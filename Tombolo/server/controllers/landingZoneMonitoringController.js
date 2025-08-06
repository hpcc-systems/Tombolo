// Imports from libraries
const { TopologyService, FileSprayService } = require('@hpcc-js/comms');
const Sequelize = require('sequelize');

// Local Imports
const logger = require('../config/logger');
const { Cluster, LandingZoneMonitoring, user: User } = require('../models');
const { decryptString } = require('../utils/cipher');
const { getClusterOptions } = require('../utils/getClusterOptions');
const {
  uniqueConstraintErrorHandler,
} = require('../utils/uniqueConstraintErrorHandler');

// Function to get dropzones and associated machines when a cluster id is provided
const getDropzonesForACluster = async (req, res) => {
  try {
    const { clusterId } = req.query;
    const clusterDetails = await Cluster.findOne({
      where: { id: clusterId },
      attributes: {
        exclude: ['metaData'],
      },
      raw: true,
    });

    // If no cluster found, return 404
    if (!clusterDetails) {
      return res.status(404).send({ message: 'Cluster not found' });
    }

    const baseUrl = `${clusterDetails.thor_host}:${clusterDetails.thor_port}`;

    const {
      TpDropZones: { TpDropZone },
    } = await new TopologyService(
      getClusterOptions(
        {
          baseUrl,
          userID: clusterDetails.username || '',
          password: `${clusterDetails.hash ? decryptString(clusterDetails.hash) : ''}`,
        },
        clusterDetails.allowSelfSigned
      )
    ).TpDropZoneQuery();

    res.status(200).send(TpDropZone);
  } catch (err) {
    logger.error(`Error in getDropzones: ${err.message}`);
    res.status(500).send({ message: 'Internal server error' });
  }
};

// Function to get filesdirs from specific path in a dropzone
const getFileList = async (req, res) => {
  try {
    const { clusterId, DropZoneName, Netaddr, Path, DirectoryOnly } = req.query;

    logger.info(
      `Getting file list - Cluster: ${clusterId}, DropZone: ${DropZoneName}, Path: ${Path}`
    );

    const clusterDetails = await Cluster.findOne({
      where: { id: clusterId },
      attributes: {
        exclude: ['metaData'],
      },
      raw: true,
    });

    // If no cluster found, return 404
    if (!clusterDetails) {
      return res.status(404).send({ message: 'Cluster not found' });
    }

    const baseUrl = `${clusterDetails.thor_host}:${clusterDetails.thor_port}`;
    const fss = new FileSprayService(
      getClusterOptions(
        {
          baseUrl,
          userID: clusterDetails.username || '',
          password: `${clusterDetails.hash ? decryptString(clusterDetails.hash) : ''}`,
        },
        clusterDetails.allowSelfSigned
      )
    );

    const fileListResponse = await fss.FileList({
      DropZoneName,
      Netaddr,
      Path,
      DirectoryOnly: DirectoryOnly === 'true', // Convert string to boolean
    });

    logger.info('File Spray service response received successfully');

    // Send successful response with file list
    res.status(200).send({
      success: true,
      data: fileListResponse,
    });
  } catch (err) {
    logger.error(`Error in getFileList: ${err.message}`);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
};

// Create new landing zone monitoring
const createLandingZoneMonitoring = async (req, res) => {
  try {
    const { id: userId } = req.user;

    // Create the landing zone monitoring record with pending approval status
    const response = await LandingZoneMonitoring.create(
      {
        ...req.body,
        approvalStatus: 'Pending',
        createdBy: userId,
        lastUpdatedBy: userId,
      },
      { raw: true }
    );

    logger.info(`Landing zone monitoring created with ID: ${response.id}`);
    res.status(201).json({
      success: true,
      message: 'Landing zone monitoring created successfully',
      data: response,
    });
  } catch (err) {
    logger.error('Error creating landing zone monitoring: ', err);
    const errorResult = uniqueConstraintErrorHandler(
      err,
      'Failed to create landing zone monitoring'
    );
    res.status(errorResult.statusCode).json(errorResult.responseObject);
  }
};

// Get all landing zone monitorings by application ID
const getAllLandingZoneMonitorings = async (req, res) => {
  try {
    const { applicationId } = req.params;
    logger.info(
      `Getting all landing zone monitorings for application: ${applicationId}`
    );

    const landingZoneMonitorings = await LandingZoneMonitoring.findAll({
      where: { applicationId },
      order: [['createdAt', 'DESC']],
      // Include user details for createdBy , lastUpdatedBy and cluster
      include: [
        {
          model: User,
          attributes: ['firstName', 'lastName', 'email'],
          as: 'creator',
        },
        {
          model: User,
          attributes: ['firstName', 'lastName', 'email'],
          as: 'updater',
        },
        {
          model: User,
          attributes: ['firstName', 'lastName', 'email'],
          as: 'approver',
        },
        {
          model: Cluster,
          attributes: ['name', 'thor_host', 'thor_port'],
          as: 'cluster',
        },
      ],
    });

    logger.info(
      `Found ${landingZoneMonitorings.length} landing zone monitorings`
    );
    res.status(200).json({
      success: true,
      data: landingZoneMonitorings,
      count: landingZoneMonitorings.length,
    });
  } catch (err) {
    logger.error(`Error getting landing zone monitorings: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get landing zone monitorings',
    });
  }
};

// Get single landing zone monitoring by ID
const getLandingZoneMonitoringById = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Getting landing zone monitoring with ID: ${id}`);

    const landingZoneMonitoring = await LandingZoneMonitoring.findByPk(id);

    if (!landingZoneMonitoring) {
      logger.warn(`Landing zone monitoring not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Landing zone monitoring not found',
      });
    }

    logger.info(`Successfully retrieved landing zone monitoring: ${id}`);
    res.status(200).json({
      success: true,
      data: landingZoneMonitoring,
    });
  } catch (err) {
    logger.error(`Error getting landing zone monitoring by ID: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get landing zone monitoring',
    });
  }
};

// Update landing zone monitoring
const updateLandingZoneMonitoring = async (req, res) => {
  try {
    const { id } = req.body;
    logger.info(`Updating landing zone monitoring with ID: ${id}`);

    // Check if the record exists
    const existingMonitoring = await LandingZoneMonitoring.findByPk(id);
    if (!existingMonitoring) {
      logger.warn(`Landing zone monitoring not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Landing zone monitoring not found',
      });
    }

    // Reset approval status to pending when updating
    const payload = {
      ...req.body,
      approvalStatus: 'Pending',
      isActive: false,
      approverComment: null,
      approvedBy: null,
      approvedAt: null,
    };

    // Update the record
    const [updatedRowsCount] = await LandingZoneMonitoring.update(payload, {
      where: { id },
      returning: true,
    });

    if (updatedRowsCount === 0) {
      logger.warn(`No rows updated for landing zone monitoring ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Landing zone monitoring not found',
      });
    }

    // Get the updated record
    const updatedMonitoring = await LandingZoneMonitoring.findByPk(id);

    logger.info(`Successfully updated landing zone monitoring: ${id}`);
    res.status(200).json({
      success: true,
      message: 'Landing zone monitoring updated successfully',
      data: updatedMonitoring,
    });
  } catch (err) {
    logger.error(`Error updating landing zone monitoring: ${err.message}`);

    // Handle specific error types
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: err.errors.map(e => e.message),
      });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'A landing zone monitoring with this name already exists',
      });
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reference to application, cluster, or user',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update landing zone monitoring',
    });
  }
};

// Delete landing zone monitoring (soft delete)
const deleteLandingZoneMonitoring = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Deleting landing zone monitoring with ID: ${id}`);

    // Check if the record exists
    const existingMonitoring = await LandingZoneMonitoring.findByPk(id);
    if (!existingMonitoring) {
      logger.warn(`Landing zone monitoring not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Landing zone monitoring not found',
      });
    }

    // Soft delete the record (sets deletedAt timestamp)
    await LandingZoneMonitoring.handleDelete({
      id,
      deletedByUserId: req.user.id,
    });

    logger.info(`Successfully deleted landing zone monitoring: ${id}`);
    res.status(200).json({
      success: true,
      message: 'Landing zone monitoring deleted successfully',
    });
  } catch (err) {
    logger.error(`Error deleting landing zone monitoring: ${err.message}`);

    // Handle specific error types
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message:
          'Cannot delete: landing zone monitoring is referenced by other records',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete landing zone monitoring',
    });
  }
};

// Bulk delete landing zone monitoring
const bulkDeleteLandingZoneMonitoring = async (req, res) => {
  try {
    const { ids } = req.body;
    logger.info(`Bulk deleting landing zone monitoring: ${ids}`);

    // Check if the records exist
    const existingMonitorings = await LandingZoneMonitoring.findAll({
      where: {
        id: {
          [Sequelize.Op.in]: ids,
        },
      },
    });

    if (existingMonitorings.length === 0) {
      logger.warn(`No landing zone monitoring found with IDs: ${ids}`);
      return res.status(404).json({
        success: false,
        message: 'Landing zone monitoring not found',
      });
    }

    // Soft delete the records
    await LandingZoneMonitoring.handleDelete({
      id: ids,
      deletedByUserId: req.user.id,
    });

    logger.info(`Successfully deleted landing zone monitoring: ${ids}`);
    res.status(200).json({
      success: true,
      message: 'Landing zone monitoring deleted successfully',
    });
  } catch (err) {
    logger.error(`Error deleting landing zone monitoring: ${err.message}`);

    res.status(500).json({
      success: false,
      message: 'Failed to delete landing zone monitoring',
    });
  }
};

// Evaluate landing zone monitoring (approve/reject)
const evaluateLandingZoneMonitoring = async (req, res) => {
  try {
    const { id: approver } = req.user;
    const { ids, approvalStatus, approverComment, approvedBy, isActive } =
      req.body;

    const updateData = {
      approvalStatus,
      approverComment,
      approvedBy,
      isActive: isActive !== undefined ? isActive : false,
      approvedAt: new Date(),
      approvedBy: approver,
    };

    const [updatedCount] = await LandingZoneMonitoring.update(updateData, {
      where: {
        id: {
          [Sequelize.Op.in]: ids,
        },
      },
    });

    if (updatedCount === 0) {
      return res.status(404).json({
        success: false,
        message:
          'No landing zone monitoring records found with the provided IDs',
      });
    }

    logger.info(
      `Successfully ${approvalStatus} ${updatedCount} landing zone monitoring record(s)`
    );

    res.status(200).json({
      success: true,
      message: `Successfully ${approvalStatus} ${updatedCount} landing zone monitoring record(s)`,
      updatedCount,
    });
  } catch (error) {
    logger.error('Error evaluating landing zone monitoring:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate landing zone monitoring',
      error: error.message,
    });
  }
};

// Toggle landing zone monitoring status (activate/deactivate)
const toggleLandingZoneMonitoringStatus = async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    // If no action specified, toggle based on current status
    const records = await LandingZoneMonitoring.findAll({
      where: {
        id: {
          [Sequelize.Op.in]: ids,
        },
      },
      attributes: ['id', 'isActive', 'approvalStatus'],
      raw: true,
    });

    if (isActive) {
      const pending = records.some(record => {
        return record.approvalStatus !== 'approved';
      });

      if (pending) {
        logger.warn(
          'Cannot activate landing zone monitoring with pending approval'
        );
        return res.status(400).json({
          success: false,
          message:
            'Cannot activate landing zone monitoring with pending approval',
        });
      }
    }

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          'No landing zone monitoring records found with the provided IDs',
      });
    }

    const [updatedCount] = await LandingZoneMonitoring.update(
      { isActive },
      {
        where: {
          id: {
            [Sequelize.Op.in]: ids,
          },
        },
      }
    );

    if (updatedCount === 0) {
      return res.status(404).json({
        success: false,
        message:
          'No landing zone monitoring records found with the provided IDs',
      });
    }

    const statusAction = isActive ? 'activated' : 'deactivated';
    logger.info(
      `Successfully ${statusAction} ${updatedCount} landing zone monitoring record(s)`
    );

    res.status(200).json({
      success: true,
      message: `Successfully ${statusAction} ${updatedCount} landing zone monitoring record(s)`,
      updatedCount,
      newStatus: isActive,
    });
  } catch (error) {
    logger.error('Error toggling landing zone monitoring status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle landing zone monitoring status',
      error: error.message,
    });
  }
};

// Bulk update landing zone monitoring
/*
map all the objects in the arry and build new arery of ids
get all rows with the ids
update metaData of those rows
*/

const bulkUpdateLzMonitoring = async (req, res) => {
  try {
    const { updatedData } = req.body;

    const updatePromises = updatedData.map(item =>
      LandingZoneMonitoring.update(
        { metaData: item.metaData },
        {
          where: {
            id: item.id,
          },
        }
      )
    );

    // Execute all updates concurrently
    const updateResults = await Promise.all(updatePromises);

    // Count successful updates
    const updatedCount = updateResults.reduce(
      (count, [rowsAffected]) => count + rowsAffected,
      0
    );

    logger.info(
      `Successfully updated ${updatedCount} landing zone monitoring record(s)`
    );

    res.status(200).json({
      success: true,
      message: `Successfully updated ${updatedCount} landing zone monitoring record(s)`,
      updatedCount,
    });
  } catch (error) {
    logger.error('Error bulk updating landing zone monitoring:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update landing zone monitoring',
      error: error.message,
    });
  }
};

//Exports
module.exports = {
  getDropzonesForACluster,
  getFileList,
  createLandingZoneMonitoring,
  getAllLandingZoneMonitorings,
  getLandingZoneMonitoringById,
  updateLandingZoneMonitoring,
  deleteLandingZoneMonitoring,
  evaluateLandingZoneMonitoring,
  toggleLandingZoneMonitoringStatus,
  bulkDeleteLandingZoneMonitoring,
  bulkUpdateLzMonitoring,
};
