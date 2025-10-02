// Imports from libraries
const { TopologyService, FileSprayService, send } = require('@hpcc-js/comms');
const Sequelize = require('sequelize');

// Local Imports
const logger = require('../config/logger');
const { Cluster, LandingZoneMonitoring, User } = require('../models');
const { decryptString } = require('../utils/cipher');
const { getClusterOptions } = require('../utils/getClusterOptions');
const {
  uniqueConstraintErrorHandler,
} = require('../utils/uniqueConstraintErrorHandler');
const { APPROVAL_STATUS } = require('../config/constants');
const { sendError, sendSuccess } = require('../utils/response');
const { getUserFkIncludes } = require('../utils/getUserFkIncludes');

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
    logger.error('Error in getDropzones: ', err);
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
    logger.error('Error in getFileList: ', err);
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
        approvalStatus: APPROVAL_STATUS.PENDING,
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

    const landingZoneMonitoring = await LandingZoneMonitoring.findAll({
      where: { applicationId },
      order: [['createdAt', 'DESC']],
      // Include user details for createdBy , lastUpdatedBy and cluster
      include: [
        ...getUserFkIncludes(),
        {
          model: Cluster,
          attributes: ['name', 'thor_host', 'thor_port'],
          as: 'cluster',
        },
      ],
    });

    sendSuccess(res, landingZoneMonitoring);
  } catch (err) {
    logger.error('Error getting landing zone monitoring: ', err);
    sendError(res, 'Failed to get landing zone monitoring');
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
    logger.error('Error getting landing zone monitoring by ID: ', err);
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

    // Check if the record exists
    const existingMonitoring = await LandingZoneMonitoring.findByPk(id);
    if (!existingMonitoring) {
      return res.status(404).json({
        success: false,
        message: 'Landing zone monitoring not found',
      });
    }

    // Reset approval status to pending when updating
    const payload = {
      ...req.body,
      approvalStatus: APPROVAL_STATUS.PENDING,
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
      sendError(res, 'Landing zone monitoring not found');
    }

    // Get the updated record
    const updatedMonitoring = await LandingZoneMonitoring.findByPk(id);

    sendSuccess(res, updatedMonitoring);
  } catch (err) {
    logger.error('Error updating landing zone monitoring: ', err);
    sendError(res, err);
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
    logger.error('Error deleting landing zone monitoring: ', err);

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
    console.log('------------------------');
    console.log('Body: ', ids);
    console.log('------------------------');

    // Check if the records exist
    const existingMonitoring = await LandingZoneMonitoring.findAll({
      where: {
        id: {
          [Sequelize.Op.in]: ids,
        },
      },
    });

    if (existingMonitoring.length === 0) {
      sendError(res, 'Landing zone monitoring not found', 404);
    }

    // Soft delete the records
    await LandingZoneMonitoring.handleDelete({
      id: ids,
      deletedByUserId: req.user.id,
    });

    sendSuccess(res, 'Landing zone monitoring deleted successfully');
  } catch (err) {
    logger.error('Error deleting landing zone monitoring: ', err);

    sendError(res, 'Failed to delete landing zone monitoring');
  }
};

// Evaluate landing zone monitoring (approve/reject)
const evaluateLandingZoneMonitoring = async (req, res) => {
  try {
    const { id: approver } = req.user;
    const { ids, approvalStatus, approverComment, isActive } = req.body;

    const updateData = {
      approvalStatus,
      approverComment,
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
        return record.approvalStatus !== APPROVAL_STATUS.APPROVED;
      });

      if (pending) {
        return sendError(
          res,
          'Cannot activate landing zone monitoring with pending approval',
          422
        );
      }
    }

    if (records.length === 0) {
      return sendError(res, 'Landing zone monitoring not found', 404);
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
      return sendError(
        res,
        'No landing zone monitoring records found with the provided IDs',
        404
      );
    }

    const statusAction = isActive ? 'activated' : 'deactivated';

    throw new Error('Test error');
    sendSuccess(res, { updatedCount, newStatus: isActive });
  } catch (error) {
    logger.error('Error toggling landing zone monitoring status:', error);
    sendError(res, 'Failed to toggle landing zone monitoring status');
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
