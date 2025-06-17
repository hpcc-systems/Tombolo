const { clusters } = require('../cluster-whitelist.js');
const { Sequelize } = require('sequelize');
const {
  AccountService,
  TopologyService,
  WorkunitsService,
  Connection,
} = require('@hpcc-js/comms');
const axios = require('axios');

const logger = require('../config/logger');
const models = require('../models');
const { encryptString } = require('../utils/cipher.js');
const CustomError = require('../utils/customError.js');
const hpccUtil = require('../utils/hpcc-util.js');
const hpccJSComms = require('@hpcc-js/comms');
const Cluster = models.cluster;
const moment = require('moment');

// Add a cluster - Without sending progress updates to client
const addCluster = async (req, res) => {
  try {
    const {
      name: clusterName,
      username: userID,
      password,
      adminEmails,
      metaData = {},
      allowSelfSigned,
      createdBy,
      updatedBy,
    } = req.body;
    // Make sure cluster is whitelisted
    const cluster = clusters.find(c => c.name === clusterName);

    if (!cluster) {
      return;
    }

    const baseUrl = `${cluster.thor}:${cluster.thor_port}`;

    // Check if cluster is reachable
    await new AccountService({ baseUrl, userID, password }).MyAccount();

    // Get default cluster (engine) if exists - if not pick the first one
    const {
      TpLogicalClusters: { TpLogicalCluster },
    } = await new TopologyService(
      getClusterOptions(
        {
          baseUrl,
          userID,
          password,
        },
        allowSelfSigned
      )
    ).TpLogicalClusterQuery();

    let defaultEngine = null;
    if (TpLogicalCluster.length > 0) {
      // If it contains cluster with Name "hthor", set and QueriesOnly is not set to true, make that the default engine
      // If no engine with above conditions is found, set the first engine as default but QueriesOnly should not be set to true
      defaultEngine = TpLogicalCluster.find(
        engine => engine.Name === 'hthor' && !engine.QueriesOnly
      );
      if (!defaultEngine) {
        defaultEngine = TpLogicalCluster.find(engine => !engine.QueriesOnly);
      }
    }

    // if default cluster is not found, return error
    if (!defaultEngine) throw new CustomError('Default engine not found', 400);

    // Execute ECL code to get timezone offset
    logger.verbose(
      'Adding new cluster: Executing ECL code to get timezone offset'
    );

    const eclCode =
      'IMPORT Std; now := Std.Date.LocalTimeZoneOffset(); OUTPUT(now);';
    // Create timezone offset in default engine
    const wus = new WorkunitsService({ baseUrl, userID, password });
    const {
      Workunit: { Wuid },
    } = await wus.WUCreateAndUpdate({
      Jobname: 'Get Timezone Offset',
      QueryText: eclCode,
      ClusterSelection: defaultEngine.Name,
    });

    // Submit the recently created workunit
    await wus.WUSubmit({ Wuid, Cluster: defaultEngine.Name });

    let wuState = 'submitted';
    const finalStates = ['unknown', 'completed', 'failed', 'aborted'];
    while (!finalStates.includes(wuState)) {
      // Delay for 2 seconds before checking the state again
      await new Promise(resolve => setTimeout(resolve, 3000));
      const {
        Workunits: { ECLWorkunit },
      } = await wus.WUQuery({ Wuid });
      wuState = ECLWorkunit[0].State;
    }

    // Work unit result
    const wuSummary = await wus.WUResultSummary({ Wuid });
    const offSetInMinutes = parseInt(wuSummary.Result.Value) / 60;

    // Payload
    const clusterPayload = {
      name: cluster.name,
      thor_host: cluster.thor,
      thor_port: cluster.thor_port,
      roxie_host: cluster.roxie,
      roxie_port: cluster.roxie_port,
      defaultEngine: defaultEngine.Name,
      username: userID,
      timezone_offset: offSetInMinutes,
      adminEmails,
      createdBy,
      allowSelfSigned,
      updatedBy,
      metaData,
    };

    // Has password and add to the obj if it exists
    if (password) {
      clusterPayload.hash = encryptString(password);
    }

    // Create cluster
    const newCluster = await Cluster.create(clusterPayload);
    res.status(201).json({ success: true, data: newCluster });
  } catch (err) {
    logger.error(`Add cluster: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Add a cluster and continuously send progress updates
const addClusterWithProgress = async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Transfer-Encoding', 'chunked');

  // Function to send updates
  const sendUpdate = data => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    res.flush();
  };

  try {
    const {
      name: clusterName,
      username: userID,
      password,
      adminEmails,
      metaData = {},
      allowSelfSigned,
      createdBy,
      updatedBy,
    } = req.body;
    // Make sure cluster is whitelisted
    const cluster = clusters.find(c => c.name === clusterName);

    if (!cluster) {
      return;
    }

    const baseUrl = `${cluster.thor}:${cluster.thor_port}`;

    // Check if cluster is reachable
    sendUpdate({
      step: 1,
      success: true,
      message: 'Authenticating cluster ..',
    });
    await new AccountService(
      getClusterOptions(
        {
          baseUrl,
          userID,
          password,
        },
        allowSelfSigned
      )
    ).MyAccount();
    sendUpdate({
      step: 1,
      success: true,
      message: 'Cluster authentication complete',
    });

    // Get default cluster (engine) if exists - if not pick the first one
    sendUpdate({
      step: 2,
      success: true,
      message: 'Selecting default engine ..',
    });
    const {
      TpLogicalClusters: { TpLogicalCluster },
    } = await new TopologyService(
      getClusterOptions(
        {
          baseUrl,
          userID,
          password,
        },
        allowSelfSigned
      )
    ).TpLogicalClusterQuery();

    let defaultEngine = null;
    if (TpLogicalCluster.length > 0) {
      // If it contains cluster with Name "hthor", set and QueriesOnly is not set to true, make that the default engine
      // If no engine with above conditions is found, set the first engine as default but QueriesOnly should not be set to true
      defaultEngine = TpLogicalCluster.find(
        engine => engine.Name === 'hthor' && !engine.QueriesOnly
      );
      if (!defaultEngine) {
        defaultEngine = TpLogicalCluster.find(engine => !engine.QueriesOnly);
      }
    }

    // if default cluster is not found, return error
    if (!defaultEngine) throw new CustomError('Default engine not found', 400);

    sendUpdate({
      step: 2,
      success: true,
      message: 'Default engine selection complete',
    });

    // Execute ECL code to get timezone offset
    sendUpdate({
      step: 3,
      success: true,
      message: 'Getting timezone offset ..',
    });
    logger.verbose(
      'Adding new cluster: Executing ECL code to get timezone offset'
    );

    const eclCode =
      'IMPORT Std; now := Std.Date.LocalTimeZoneOffset(); OUTPUT(now);';
    // Create timezone offset in default engine
    const wus = new WorkunitsService(
      getClusterOptions(
        {
          baseUrl,
          userID,
          password,
        },
        allowSelfSigned
      )
    );
    const {
      Workunit: { Wuid },
    } = await wus.WUCreateAndUpdate({
      Jobname: 'Get Timezone Offset',
      QueryText: eclCode,
      ClusterSelection: defaultEngine.Name,
    });

    // Submit the recently created workunit
    await wus.WUSubmit({ Wuid, Cluster: defaultEngine.Name });

    let wuState = 'submitted';
    const finalStates = ['unknown', 'completed', 'failed', 'aborted'];
    while (!finalStates.includes(wuState)) {
      // Delay for 2 seconds before checking the state again
      await new Promise(resolve => setTimeout(resolve, 3000));
      const {
        Workunits: { ECLWorkunit },
      } = await wus.WUQuery({ Wuid });
      wuState = ECLWorkunit[0].State;
    }

    // Work unit result
    const wuSummary = await wus.WUResultSummary({ Wuid });
    const offSetInMinutes = parseInt(wuSummary.Result.Value) / 60;

    // throw new Error("Error occurred while getting timezone offset");
    sendUpdate({
      step: 3,
      success: true,
      message: 'Getting timezone offset complete',
    });
    sendUpdate({
      step: 4,
      success: true,
      message: 'Preparing to save cluster ...',
    });

    // Payload
    const clusterPayload = {
      name: cluster.name,
      thor_host: cluster.thor,
      thor_port: cluster.thor_port,
      roxie_host: cluster.roxie,
      roxie_port: cluster.roxie_port,
      defaultEngine: defaultEngine.Name,
      username: userID,
      timezone_offset: offSetInMinutes,
      adminEmails,
      createdBy,
      allowSelfSigned,
      updatedBy,
      metaData,
    };

    // Has password and add to the obj if it exists
    if (password) {
      clusterPayload.hash = encryptString(password);
    }
    // Create cluster
    const newCluster = await Cluster.create(clusterPayload);
    sendUpdate({
      step: 4,
      success: true,
      message: 'Cluster added successfully',
      cluster: newCluster,
    });
    res.end();
    // res.status(201).json({ success: true, data: newCluster });
  } catch (err) {
    logger.error(`Add cluster: ${err.message}`);
    // res.status(err.status || 500).json({ success: false, message: err.message });
    sendUpdate({ step: 99, success: false, message: err.message });
    res.end();
  }
};

// Retrieve all clusters
const getClusters = async (req, res) => {
  try {
    // Get clusters ASC by name
    const clusters = await Cluster.findAll({
      attributes: {
        exclude: ['hash', 'metaData', 'storageUsageHistory'],
      },
      order: [['name', 'ASC']],
    });

    res.status(200).json({ success: true, data: clusters });
  } catch (err) {
    logger.error(`Get clusters: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Retrieve a cluster
const getCluster = async (req, res) => {
  try {
    // Get one cluster by id
    const cluster = await Cluster.findOne({
      where: { id: req.params.id },
      attributes: {
        exclude: ['hash', 'metaData'],
      },
      raw: true,
    });

    if (!cluster) throw new CustomError('Cluster not found', 404);

    res.status(200).json({ success: true, data: cluster });
  } catch (err) {
    logger.error(`Get cluster: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Delete a cluster
const deleteCluster = async (req, res) => {
  try {
    // Delete a cluster by id
    const cluster = await Cluster.destroy({ where: { id: req.params.id } });
    if (!cluster) throw new CustomError('Cluster not found', 404);
    res.status(200).json({ success: true, data: cluster });
  } catch (err) {
    logger.error(`Delete cluster: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Update a cluster
const updateCluster = async (req, res) => {
  // Only username, password, adminEmails can be updated. only update that if it is present in the request body
  try {
    const { username, password, adminEmails, updatedBy, allowSelfSigned } =
      req.body;
    const cluster = await Cluster.findOne({ where: { id: req.params.id } });
    if (!cluster) throw new CustomError('Cluster not found', 404);
    if (allowSelfSigned) cluster.allowSelfSigned = allowSelfSigned;
    if (username) cluster.username = username;
    if (password) cluster.hash = encryptString(password);
    if (adminEmails) cluster.adminEmails = adminEmails;
    cluster.updatedBy = updatedBy;

    await cluster.save();
    res.status(200).json({ success: true, data: cluster });
  } catch (err) {
    logger.error(`Update cluster: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Retrieve all whitelisted clusters
const getClusterWhiteList = async (req, res) => {
  try {
    if (!clusters) throw new CustomError('Cluster whitelist not found', 404);
    res.status(200).json({ success: true, data: clusters });
  } catch (err) {
    logger.error(`Get cluster white list: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

// Ping HPCC cluster to check if it is reachable
const pingCluster = async (req, res) => {
  let baseUrl;
  try {
    logger.verbose(`Pinging HPCC cluster: ${req.body.name}`);
    const { name, username, password } = req.body;

    //   // Validate cluster
    const cluster = clusters.find(c => c.name === name);

    if (!cluster) {
      logger.error(`Cluster not whitelisted: ${name}`);
      throw new CustomError('Cluster not whitelisted', 400);
    }

    // Construct base URL
    baseUrl = `${cluster.thor}:${cluster.thor_port}`;

    // Attempt to ping cluster
    const response = await axios.get(`${baseUrl}`, {
      auth: {
        username,
        password,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: 'Cluster reachable' });
  } catch (err) {
    if (err?.response?.status) {
      const statusCode =
        err.response.status === 401 ? 403 : err.response.status; //401 is reacheable but invalid credentials
      logger.error(
        `Ping cluster: ${err?.response?.status === 401 ? `${baseUrl} Reachable but invalid credentials` : err.message}`
      );
      return res
        .status(statusCode)
        .json({ success: false, message: err.message });
    } else {
      logger.error(`Pinging  cluster ${baseUrl}: ${err.message}`);
      return res.status(503).json({
        success: false,
        message: `Cluster unreachable ${err.message}`,
      });
    }
  }
};

// Ping HPCC cluster that is already saved in the database
const pingExistingCluster = async (req, res) => {
  const { id } = req.params;
  try {
    await hpccUtil.getCluster(id);
    // Update the reachability info for the cluster
    await Cluster.update(
      {
        reachabilityInfo: {
          reachable: true,
          lastMonitored: new Date(),
          lastReachableAt: new Date(),
        },
      },
      {
        where: { id },
      }
    );
    res.status(200).json({ success: true, message: 'Reachable' }); // Success Response
  } catch (err) {
    logger.error(`Ping existing cluster: ${err}`);
    await Cluster.update(
      {
        reachabilityInfo: {
          reachable: false,
          lastMonitored: new Date(),
          lastReachableAt: new Date(),
        },
      },
      {
        where: { id },
      }
    );
    res.status(503).json({ success: false, message: err.message }); // Service Unavailable
  }
};

const clusterUsage = async (req, res) => {
  try {
    const { id } = req.params;

    //Get cluster details
    let cluster = await hpccUtil.getCluster(id); // Checks if cluster is reachable and decrypts cluster credentials if any
    const { thor_host, thor_port, username, hash } = cluster;
    const clusterDetails = getClusterOptions(
      {
        baseUrl: `${thor_host}:${thor_port}`,
        userID: username || '',
        password: hash || '',
      },
      allowSelfSigned
    );

    //Use JS comms library to fetch current usage
    const machineService = new hpccJSComms.MachineService(clusterDetails);
    const targetClusterUsage = await machineService.GetTargetClusterUsageEx();

    const maxUsage = targetClusterUsage.map(target => ({
      name: target.Name,
      maxUsage: target.max.toFixed(2),
      meanUsage: target.mean.toFixed(2),
    }));
    res.status(200).send(maxUsage);
  } catch (err) {
    res.status(503).json({
      success: false,
      message: 'Failed to fetch current cluster usage',
    });
    logger.error(err);
  }
};

const clusterStorageHistory = async (req, res) => {
  try {
    const { queryData } = req.params;
    const query = JSON.parse(queryData);

    const data = await Cluster.findOne({
      where: { id: query.clusterId },
      raw: true,
      attributes: ['storageUsageHistory'],
    });

    // Filter data before sending to client
    const start_date = moment(query.historyDateRange[0]).valueOf();
    const end_date = moment(query.historyDateRange[1]).valueOf();

    const storageUsageHistory = data?.storageUsageHistory || {};

    const filtered_data = {};

    for (const key in storageUsageHistory) {
      filtered_data[key] = [];
      for (const item of storageUsageHistory[key]) {
        if (item.date < start_date) {
          break;
        }

        if (item.date > end_date) {
          break;
        } else {
          filtered_data[key].unshift(item);
        }
      }
    }

    res.status(200).send(filtered_data);
  } catch (err) {
    logger.error(err);
    res.status(503).json({
      success: false,
      message: 'Failed to fetch current cluster usage',
    });
  }
};

module.exports = {
  addCluster,
  addClusterWithProgress,
  getClusters,
  getCluster,
  deleteCluster,
  updateCluster,
  getClusterWhiteList,
  pingCluster,
  pingExistingCluster,
  clusterUsage,
  clusterStorageHistory,
};
