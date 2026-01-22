// Imports from libraries
const { TopologyService, FileSprayService, send } = require('@hpcc-js/comms');
const Sequelize = require('sequelize');

// Local Imports
const logger = require('../config/logger');
const { Cluster, LandingZoneMonitoring } = require('../models');
const { decryptString } = require('@tombolo/shared');
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
      return sendError(res, 'Cluster not found', 404);
    }

    const baseUrl = `${clusterDetails.thor_host}:${clusterDetails.thor_port}`;

    const {
      TpDropZones: { TpDropZone },
    } = await new TopologyService(
      getClusterOptions(
        {
          baseUrl,
          userID: clusterDetails.username || '',
          password: `${clusterDetails.hash ? decryptString(clusterDetails.hash, process.env.ENCRYPTION_KEY) : ''}`,
        },
        clusterDetails.allowSelfSigned
      )
    ).TpDropZoneQuery();

    sendSuccess(res, TpDropZone);
  } catch (err) {
    logger.error('Error in getDropzones: ', err);
    sendError(res, 'Internal server error');
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
      return sendError(res, 'Cluster not found', 404);
    }

    const baseUrl = `${clusterDetails.thor_host}:${clusterDetails.thor_port}`;
    const fss = new FileSprayService(
      getClusterOptions(
        {
          baseUrl,
          userID: clusterDetails.username || '',
          password: `${clusterDetails.hash ? decryptString(clusterDetails.hash, process.env.ENCRYPTION_KEY) : ''}`,
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
    sendSuccess(res, fileListResponse, 'File list retrieved successfully');
  } catch (err) {
    logger.error('Error in getFileList: ', err);
    sendError(res, 'Internal server error');
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
    sendSuccess(
      res,
      response,
      'Landing zone monitoring created successfully',
      201
    );
  } catch (err) {
    logger.error('Error creating landing zone monitoring: ', err);
    const errorResult = uniqueConstraintErrorHandler(
      err,
      'Failed to create landing zone monitoring'
    );
    sendError(
      res,
      errorResult.responseObject.message ||
        'Failed to create landing zone monitoring',
      errorResult.statusCode
    );
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
      return sendError(res, 'Landing zone monitoring not found', 404);
    }

    logger.info(`Successfully retrieved landing zone monitoring: ${id}`);
    sendSuccess(
      res,
      landingZoneMonitoring,
      'Landing zone monitoring retrieved successfully'
    );
  } catch (err) {
    logger.error('Error getting landing zone monitoring by ID: ', err);
    sendError(res, 'Failed to get landing zone monitoring');
  }
};

// Update landing zone monitoring
const updateLandingZoneMonitoring = async (req, res) => {
  try {
    const { id } = req.body;

    // Check if the record exists
    const existingMonitoring = await LandingZoneMonitoring.findByPk(id);
    if (!existingMonitoring) {
      return sendError(res, 'Landing zone monitoring not found', 404);
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
      return sendError(res, 'Landing zone monitoring not found', 404);
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
      return sendError(res, 'Landing zone monitoring not found', 404);
    }

    // Soft delete the record (sets deletedAt timestamp)
    await LandingZoneMonitoring.handleDelete({
      id,
      deletedByUserId: req.user.id,
    });

    logger.info(`Successfully deleted landing zone monitoring: ${id}`);
    sendSuccess(res, null, 'Landing zone monitoring deleted successfully');
  } catch (err) {
    logger.error('Error deleting landing zone monitoring: ', err);

    // Handle specific error types
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return sendError(
        res,
        'Cannot delete: landing zone monitoring is referenced by other records',
        400
      );
    }

    sendError(res, 'Failed to delete landing zone monitoring');
  }
};

// Bulk delete landing zone monitoring
const bulkDeleteLandingZoneMonitoring = async (req, res) => {
  try {
    const { ids } = req.body;

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

    sendSuccess(res, null, 'Landing zone monitoring deleted successfully');
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
      sendError(
        res,
        'No landing zone monitoring records found with the provided IDs',
        404
      );
      return;
    }

    // Get updated monitoring
    const updatedData = await LandingZoneMonitoring.findAll({
      where: {
        id: ids,
      },
    });

    sendSuccess(res, updatedData);
  } catch (error) {
    logger.error('Error evaluating landing zone monitoring:', error);
    sendError(
      res,
      error.message || 'Failed to evaluate landing zone monitoring'
    );
  }
};

// Toggle landing zone monitoring status (activate/deactivate)
const toggleLandingZoneMonitoringStatus = async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    // If no action specified, toggle based on current status
    let allRecords = await LandingZoneMonitoring.findAll({
      where: {
        id: {
          [Sequelize.Op.in]: ids,
        },
        approvalStatus: {
          [Sequelize.Op.eq]: APPROVAL_STATUS.APPROVED,
        },
      },
      attributes: ['id', 'isActive', 'approvalStatus'],
      raw: true,
    });

    // If to made active, remove all pending and rejected records
    const records = allRecords.filter(record => {
      return record.approvalStatus === APPROVAL_STATUS.APPROVED;
    });

    // if (isActive) {
    //   const pending = records.some(record => {
    //     return record.approvalStatus !== APPROVAL_STATUS.APPROVED;
    //   });

    //   if (pending) {
    //     return sendError(
    //       res,
    //       'Cannot activate landing zone monitoring with pending approval',
    //       422
    //     );
    //   }
    // }

    if (records.length === 0) {
      return sendError(res, 'Landing zone monitoring not found', 404);
    }

    const idsToToggle = records.map(record => record.id);

    const [updatedCount] = await LandingZoneMonitoring.update(
      { isActive },
      {
        where: {
          id: {
            [Sequelize.Op.in]: idsToToggle,
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

    sendSuccess(res, 'Landing zone monitoring status updated successfully');
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

    sendSuccess(
      res,
      { updatedCount },
      `Successfully updated ${updatedCount} landing zone monitoring record(s)`
    );
  } catch (error) {
    logger.error('Error bulk updating landing zone monitoring:', error);
    sendError(res, 'Failed to bulk update landing zone monitoring');
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
