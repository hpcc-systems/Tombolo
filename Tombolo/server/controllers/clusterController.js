const clusters = require('../cluster-whitelist');
const {
  AccountService,
  TopologyService,
  WorkunitsService,
} = require('@hpcc-js/comms');
const axios = require('axios');

const logger = require('../config/logger');
const { Cluster } = require('../models');
const { encryptString } = require('../utils/cipher.js');
const CustomError = require('../utils/customError.js');
const { getClusterOptions } = require('../utils/getClusterOptions');
const hpccUtil = require('../utils/hpcc-util.js');
const hpccJSComms = require('@hpcc-js/comms');
const moment = require('moment');
const {
  uniqueConstraintErrorHandler,
} = require('../utils/uniqueConstraintErrorHandler');
const { getUserFkIncludes } = require('../utils/getUserFkIncludes');
const { sendSuccess, sendError } = require('../utils/response');

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
    } = req.body;
    // Make sure cluster is whitelisted
    const cluster = clusters.find(c => c.name === clusterName);

    if (!cluster) {
      logger.error(`Cluster not whitelisted: ${clusterName}`);
      return sendError(res, 'Cluster not whitelisted', 400);
    }

    const baseUrl = `${cluster.thor}:${cluster.thor_port}`;

    // Check if cluster is reachable
    await new AccountService(
      getClusterOptions({ baseUrl, userID, password }, allowSelfSigned)
    ).MyAccount();

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
    const wus = new WorkunitsService(
      getClusterOptions({ baseUrl, userID, password }, allowSelfSigned)
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
      createdBy: req.user.id,
      allowSelfSigned,
      metaData,
    };

    // Has password and add to the obj if it exists
    if (password) {
      clusterPayload.hash = encryptString(password);
    }

    // Create cluster
    const newCluster = await Cluster.create(clusterPayload);
    return sendSuccess(res, newCluster, 'Cluster added successfully');
  } catch (err) {
    logger.error('Failed to add cluster: ', err);
    const errorResult = uniqueConstraintErrorHandler(err, err.message);
    return sendError(
      res,
      errorResult.responseObject?.message || err.message,
      err.statusCode || errorResult.statusCode || 500
    );
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
    } = req.body;

    logger.info(
      `Adding cluster with progress: ${clusterName}, user: ${userID}`
    );

    // Make sure cluster is whitelisted
    const cluster = clusters.find(c => c.name === clusterName);

    if (!cluster) {
      logger.error(`Cluster ${clusterName} not found in whitelist`);
      sendUpdate({
        step: 99,
        success: false,
        message: 'Cluster not found in whitelist',
      });
      return res.end();
    }

    const baseUrl = `${cluster.thor}:${cluster.thor_port}`;
    logger.info(`Cluster base URL: ${baseUrl}`);

    // Check if cluster is reachable
    sendUpdate({
      step: 1,
      success: true,
      message: 'Authenticating cluster ..',
    });

    logger.info(`Attempting to authenticate with cluster ${clusterName}`);
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

    logger.info(`Authentication successful for cluster ${clusterName}`);
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

    logger.info(`Querying logical clusters for ${clusterName}`);
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

    logger.info(`Found ${TpLogicalCluster.length} logical clusters`);

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
    if (!defaultEngine) {
      logger.error(
        `No suitable default engine found for cluster ${clusterName}`
      );
      throw new CustomError('Default engine not found', 400);
    }

    logger.info(`Selected default engine: ${defaultEngine.Name}`);
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
    logger.info(`Submitted workunit ${Wuid} for timezone offset calculation`);

    let wuState = 'submitted';
    const finalStates = ['unknown', 'completed', 'failed', 'aborted'];
    const maxAttempts = 20; // 20 attempts * 3 seconds = 60 seconds max wait
    let attempts = 0;

    while (!finalStates.includes(wuState) && attempts < maxAttempts) {
      // Delay for 3 seconds before checking the state again
      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;
      logger.info(
        `Checking workunit ${Wuid} state, attempt ${attempts}/${maxAttempts}`
      );

      const {
        Workunits: { ECLWorkunit },
      } = await wus.WUQuery({ Wuid });
      wuState = ECLWorkunit[0].State.toLowerCase();
      logger.info(`Workunit ${Wuid} state: ${wuState}`);
    }

    // Check if we timed out
    if (attempts >= maxAttempts && !finalStates.includes(wuState)) {
      logger.error(
        `Workunit ${Wuid} timed out after ${maxAttempts * 3} seconds. Last state: ${wuState}`
      );
      throw new CustomError(
        'Timeout waiting for timezone offset calculation. The cluster may be slow or unresponsive.',
        408
      );
    }

    // Check if workunit failed
    if (
      wuState === 'failed' ||
      wuState === 'aborted' ||
      wuState === 'unknown'
    ) {
      logger.error(`Workunit ${Wuid} ended with state: ${wuState}`);
      throw new CustomError(
        `Timezone offset calculation ${wuState}. Please check cluster health.`,
        500
      );
    }

    // Work unit result
    logger.info(`Fetching result for workunit ${Wuid}`);
    const wuSummary = await wus.WUResultSummary({ Wuid });
    const offSetInMinutes = parseInt(wuSummary.Result.Value) / 60;
    logger.info(`Timezone offset calculated: ${offSetInMinutes} minutes`);

    // throw new Error("Error occurred while getting timezone offset");
    sendUpdate({
      step: 3,
      success: true,
      message: 'Getting timezone offset complete',
    });
    sendUpdate({
      step: 4,
      success: true,
      message: 'Checking if cluster is containerized ...',
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
      createdBy: req.user.id,
      allowSelfSigned,
      metaData,
    };

    const endpoint = `${cluster.thor}:${cluster.thor_port}/WsSMC/GetBuildInfo.json`;

    // Prepare axios config
    const axiosConfig = {
      method: 'GET',
      url: endpoint,
      timeout: 30000, // 30 second timeout
    };

    // Add authentication if credentials exist
    if (userID && password) {
      axiosConfig.auth = {
        username: userID,
        password,
      };
    }

    // Make the HTTP call
    const { data } = await axios(axiosConfig);

    if (
      data &&
      data.GetBuildInfoResponse &&
      data.GetBuildInfoResponse.BuildInfo &&
      data.GetBuildInfoResponse.BuildInfo.NamedValue
    ) {
      const { NamedValue } = data.GetBuildInfoResponse.BuildInfo;
      NamedValue.forEach(nv => {
        if (nv.Name === 'CONTAINERIZED' && nv.Value === 'ON') {
          clusterPayload.containerized = true;
        }
        if (nv.Name === 'currencyCode' && nv.Value) {
          clusterPayload.currencyCode = nv.Value;
        }
      });
    }

    sendUpdate({
      step: 4,
      success: true,
      message: 'Cluster build info check complete',
    });

    sendUpdate({
      step: 5,
      success: true,
      message: 'Preparing to save cluster ...',
    });

    // Has password and add to the obj if it exists
    if (password) {
      clusterPayload.hash = encryptString(password);
    }
    // Create cluster
    const newCluster = await Cluster.create(clusterPayload);
    sendUpdate({
      step: 5,
      success: true,
      message: 'Cluster added successfully',
      cluster: newCluster,
    });
    res.end();
  } catch (err) {
    logger.error('Add cluster: ', err);
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
      include: getUserFkIncludes(),
      order: [['name', 'ASC']],
    });

    return sendSuccess(res, clusters);
  } catch (err) {
    logger.error('Get clusters: ', err);
    return sendError(res, err);
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
      include: getUserFkIncludes(),
      raw: true,
    });

    if (!cluster) throw new CustomError('Cluster not found', 404);

    return sendSuccess(res, cluster);
  } catch (err) {
    logger.error(`Get cluster: ${err.message}`);
    return sendError(res, err);
  }
};

// Delete a cluster
const deleteCluster = async (req, res) => {
  try {
    // Delete a cluster by id
    const cluster = await Cluster.handleDelete({
      id: req.params.id,
      deletedByUserId: req.user.id,
    });
    if (!cluster) throw new CustomError('Cluster not found', 404);
    return sendSuccess(res, cluster, 'Cluster deleted successfully');
  } catch (err) {
    logger.error(`Delete cluster: ${err.message}`);
    return sendError(res, err);
  }
};

// Update a cluster
const updateCluster = async (req, res) => {
  // Only username, password, adminEmails can be updated. only update that if it is present in the request body
  try {
    const { username, password, adminEmails, allowSelfSigned } = req.body;
    const cluster = await Cluster.findOne({ where: { id: req.params.id } });
    if (!cluster) throw new CustomError('Cluster not found', 404);
    if (allowSelfSigned) cluster.allowSelfSigned = allowSelfSigned;
    if (username) cluster.username = username;
    if (password) cluster.hash = encryptString(password);
    if (adminEmails) cluster.adminEmails = adminEmails;
    cluster.updatedBy = req.user.id;

    await cluster.save();
    return sendSuccess(res, cluster, 'Cluster updated successfully');
  } catch (err) {
    logger.error(`Update cluster: ${err.message}`);
    return sendError(res, err);
  }
};

// Retrieve all whitelisted clusters
const getClusterWhiteList = async (req, res) => {
  try {
    if (!clusters) throw new CustomError('Cluster whitelist not found', 404);
    return sendSuccess(res, clusters);
  } catch (err) {
    logger.error(`Get cluster white list: ${err.message}`);
    return sendError(res, err);
  }
};

// Ping HPCC cluster to check if it is reachable (with given username and password)
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
    await axios.get(`${baseUrl}`, {
      auth: {
        username,
        password,
      },
      timeout: 25000,
    });

    return sendSuccess(res, null, 'Cluster reachable');
  } catch (err) {
    if (err?.response?.status) {
      const statusCode =
        err.response.status === 401 ? 403 : err.response.status; //401 is reacheable but invalid credentials
      logger.error(
        `Ping cluster: ${err?.response?.status === 401 ? `${baseUrl} Reachable but invalid credentials` : err.message}`
      );
      return sendError(res, err.message, statusCode);
    } else {
      logger.error(`Pinging  cluster ${baseUrl}: ${err.message}`);
      return sendError(res, `Cluster unreachable ${err.message}`, 503);
    }
  }
};

// Check if cluster is alive - pings with no username and password
const checkClusterHealth = async (req, res) => {
  let baseUrl;
  try {
    logger.verbose(`Checking HPCC cluster health: ${req.body.name}`);
    const { name } = req.body;

    // Validate cluster
    const cluster = clusters.find(c => c.name === name);

    if (!cluster) {
      logger.error(`Cluster not whitelisted: ${name}`);
      throw new CustomError('Cluster not whitelisted', 400);
    }

    // Construct base URL
    baseUrl = `${cluster.thor}:${cluster.thor_port}`;

    // Attempt to check cluster health without credentials
    await axios.get(`${baseUrl}`, {
      timeout: 25000,
      auth: {
        username: null,
        password: null,
      },
    });

    return sendSuccess(res, null, 'Cluster is healthy');
  } catch (err) {
    if (err?.response?.status) {
      const statusCode =
        err.response.status === 401 ? 202 : err.response.status; // 401 means healthy but needs authentication
      logger.error(
        `Check cluster health: ${err?.response?.status === 401 ? `${baseUrl} Healthy but requires authentication` : err.message}`
      );
      const message =
        err.response.status === 401
          ? 'Cluster healthy but requires authentication'
          : err.message;
      // send success response
      sendSuccess(res, [], message, statusCode);
    } else {
      logger.error(`Checking cluster health ${baseUrl}: ${err.message}`);
      return sendError(res, `Cluster unreachable ${err.message}`, 503);
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
    return sendSuccess(res, null, 'Reachable');
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
    return sendError(res, err.message || err, 503);
  }
};

const clusterUsage = async (req, res) => {
  try {
    const { id } = req.params;

    //Get cluster details
    let cluster = await hpccUtil.getCluster(id); // Checks if cluster is reachable and decrypts cluster credentials if any
    const { thor_host, thor_port, username, hash, allowSelfSigned } = cluster;
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
    return sendSuccess(res, maxUsage);
  } catch (err) {
    logger.error('clusterControllers clusterUsage: ', err);
    return sendError(res, 'Failed to fetch current cluster usage', 503);
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

    return sendSuccess(res, filtered_data);
  } catch (err) {
    logger.error('clusterController clusterStorageHistory: ', err);
    return sendError(res, 'Failed to fetch cluster storage history', 503);
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
  checkClusterHealth,
  pingExistingCluster,
  clusterUsage,
  clusterStorageHistory,
};
