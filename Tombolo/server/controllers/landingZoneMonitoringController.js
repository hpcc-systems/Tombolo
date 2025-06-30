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
    res.status(200).send(response);
  } catch (err) {
    logger.error(`Error creating landing zone monitoring: ${err.message}`);
    res.status(500).send('Failed to create landing zone monitoring');
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
    res.status(200).json(landingZoneMonitorings);
  } catch (err) {
    logger.error(`Error getting landing zone monitorings: ${err.message}`);
    res.status(500).send('Failed to get landing zone monitorings');
  }
};

//Exports
module.exports = {
  getDropzonesForACluster,
  getFileList,
  createLandingZoneMonitoring,
  getAllLandingZoneMonitorings,
};
