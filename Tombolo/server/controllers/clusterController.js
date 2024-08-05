const {clusters}= require("../cluster-whitelist.js");
const {
  AccountService,
  TopologyService,
  WorkunitsService,
} = require("@hpcc-js/comms");
const logger = require("../config/logger");
const models = require("../models");
const { encryptString } = require("../utils/cipher.js");
const CustomError = require("../utils/customError.js");

const Cluster = models.cluster;

// Add a cluster
const addCluster = async (req, res) => {
    try {
        const { name: clusterName, username: userID, password, adminEmails, metaData = {} } = req.body;
        // Make sure cluster is whitelisted
        const cluster = clusters.find((c) => c.name === clusterName);
        if (!cluster) throw new CustomError("Cluster not whitelisted", 400);
        const baseUrl = `${cluster.thor}:${cluster.thor_port}`;

        // Check if cluster is reachable
        await new AccountService({baseUrl,userID,password}).MyAccount();

        // Get default cluster (engine) if exists - if not pick the first one 
        const {TpLogicalClusters: {TpLogicalCluster}}  = await new TopologyService({
          baseUrl,
          userID,
          password,
        }).TpLogicalClusterQuery();

        let defaultEngine = null;
        if (TpLogicalCluster.length > 0) {
          // If it contains cluster with Name "hthor", set and QueriesOnly is not set to true, make that the default engine
          // If no engine with above conditions is found, set the first engine as default but QueriesOnly should not be set to true
            defaultEngine = TpLogicalCluster.find((engine) => engine.Name === "hthor" && !engine.QueriesOnly);
            if (!defaultEngine) {
              defaultEngine = TpLogicalCluster.find((engine) => !engine.QueriesOnly);
            }
        }

        // if default cluster is not found, return error
        if (!defaultEngine) throw new CustomError("Default engine not found", 400);

        // Execute ECL code to get timezone offset
        logger.verbose("Adding new cluster: Executing ECL code to get timezone offset");
        const eclCode = "IMPORT Std; now := Std.Date.LocalTimeZoneOffset(); OUTPUT(now);"
        // Create timezone offset in default engine
        const wus = new WorkunitsService({baseUrl,userID,password});
        const { Workunit: {Wuid} } = await wus.WUCreateAndUpdate({
          Jobname: "Get Timezone Offset",
          QueryText:eclCode,
          ClusterSelection: defaultEngine.Name,
        });

        // Submit the recently created workunit
        await wus.WUSubmit({ Wuid, Cluster: defaultEngine.Name});
        
        let wuState = "submitted";
        const finalStates = ["unknown", "completed", "failed", "aborted"];
        while (!finalStates.includes(wuState)) {
          // Delay for 1 second before checking the state again
          await new Promise((resolve) => setTimeout(resolve, 1000));
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
          metaData,
        };

        // Has password and add to the obj if it exists
        if(password){
            clusterPayload.hash = encryptString(password);;
        }

         // Create cluster
        const newCluster = await Cluster.create(clusterPayload);
        res.status(201).json({ success: true, data: newCluster });
        
    } catch (err) {
        logger.error(`Add cluster: ${err.message}`);
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
};

// Retrieve all clusters
const getClusters = async (req, res) => {
    try {
        // Get clusters ASC by name 
        const clusters = await Cluster.findAll({ order: [["name", "ASC"]] });
        res.status(200).json({ success: true, data: clusters });
    } catch (err) {
        logger.error(`Get clusters: ${err.message}`);
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
};

// Retrieve a cluster
const getCluster = async (req, res) => {
    try {
        // Get one cluster by id
        const cluster = await Cluster.findOne({ where: { id: req.params.id } });
        if (!cluster) throw new CustomError("Cluster not found", 404);
        res.status(200).json({ success: true, data: cluster });
    } catch (err) {
        logger.error(`Get cluster: ${err.message}`);
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
}

// Delete a cluster
const deleteCluster = async (req, res) => {
    try {
        // Delete a cluster by id
        const cluster = await Cluster.destroy({ where: { id: req.params.id } });
        if (!cluster) throw new CustomError("Cluster not found", 404);
        res.status(200).json({ success: true, data: cluster });
    } catch (err) {
        logger.error(`Delete cluster: ${err.message}`);
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
}

// Update a cluster
const updateCluster = async (req, res) => {
   // Only username, password, adminEmails can be updated. only update that if it is present in the request body
    try {
        const { username, password, adminEmails } = req.body;
        const cluster = await Cluster.findOne({ where: { id: req.params.id } });
        const existingMetaData = {...cluster.metaData};
        if (!cluster) throw new CustomError("Cluster not found", 404);
        if (username) cluster.username = username;
        if (password) cluster.hash = encryptString(password);
        if (adminEmails){
          existingMetaData.adminEmails = adminEmails;
          cluster.metaData = existingMetaData;
        } 
        await cluster.save();
        res.status(200).json({ success: true, data: cluster });
    } catch (err) {
        logger.error(`Update cluster: ${err.message}`);
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
    
  }

// Retrieve all whitelisted clusters
const getClusterWhiteList = async (req, res) => {
    try {
        if (!clusters) throw new CustomError("Cluster whitelist not found", 404);
        res.status(200).json({ success: true, data: clusters });
    } catch (err) {
        logger.error(`Get cluster white list: ${err.message}`);
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
}


// Ping HPCC cluster to find if it is reachable
const pingCluster = async (req, res) => {
    try {
      const { name, username, password } = req.body;
      const cluster = clusters.find((c) => c.name === name);

      // If bogus cluster name is provided, return error
      if (!cluster) throw new CustomError("Cluster not whitelisted", 400);

      // construct base url
      const baseUrl = `${cluster.thor}:${cluster.thor_port}`;

      // Ping cluster
      await new AccountService({ baseUrl, userID: username, password }).MyAccount();
      res.status(200).json({ success: true, message: "Authorized" });
    } catch (err) {
      let errMessage = "Unable to reach cluster";
      let statusCode = err.statusCode || 500;

      if (err.message.includes("Unauthorized")) {
        errMessage = "Unauthorized";
        statusCode = 401;
      }
      res.status(statusCode).json({ success: false, message: errMessage });
    }
}

module.exports = {
  addCluster,
  getClusters,
  getCluster,
  deleteCluster,
  updateCluster,
  getClusterWhiteList,
  pingCluster,
};