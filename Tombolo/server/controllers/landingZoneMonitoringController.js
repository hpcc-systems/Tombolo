// Imports from libraries
const { TopologyService, FileSprayService } = require('@hpcc-js/comms');

// Local Imports
const logger = require('../config/logger');
const {
  cluster: Cluster,
  landingZoneMonitoring: LandingZoneMonitoring,
} = require('../models');
const { decryptString } = require('../utils/cipher');
const { getClusterOptions } = require('../utils/getClusterOptions');

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
    logger.info('Creating new landing zone monitoring');

    // Create the landing zone monitoring record with pending approval status
    const response = await LandingZoneMonitoring.create(
      { ...req.body, approvalStatus: 'Pending' },
      { raw: true }
    );

    logger.info(`Landing zone monitoring created with ID: ${response.id}`);
    res.status(201).json({
      success: true,
      message: 'Landing zone monitoring created successfully',
      data: response,
    });
  } catch (err) {
    logger.error(`Error creating landing zone monitoring: ${err.message}`);

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
      message: 'Failed to create landing zone monitoring',
    });
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
    await LandingZoneMonitoring.destroy({
      where: { id },
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

//Exports
module.exports = {
  getDropzonesForACluster,
  getFileList,
  createLandingZoneMonitoring,
  getAllLandingZoneMonitorings,
  getLandingZoneMonitoringById,
  updateLandingZoneMonitoring,
  deleteLandingZoneMonitoring,
};
