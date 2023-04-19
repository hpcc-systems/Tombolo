const express = require("express");
const moment = require("moment");
const { param, validationResult } = require("express-validator");
const hpccJSComms = require("@hpcc-js/comms");

const logger = require("../../config/logger");
const validatorUtil = require("../../utils/validator");
const hpccUtil = require("../../utils/hpcc-util");
const models = require("../../models");


const Cluster = models.cluster;
const router = express.Router();

router.get("/currentClusterUsage/:clusterId",
 [param("clusterId").isUUID().withMessage("Invalid cluster ID")],
async(req,res) =>{
    try{
      //Check for errors - return if exists
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );

      // return if error(s) exist
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      const {clusterId} = req.params;

      //Get cluster details
        let cluster = await hpccUtil.getCluster(clusterId); // Checks if cluster is reachable and decrypts cluster credentials if any
        const { thor_host, thor_port, username, hash } = cluster;
        const clusterDetails = {
            baseUrl: `${thor_host}:${thor_port}`,
            userID: username || "",
            password: hash || "",
        };
    
     //Use JS comms library to fetch current usage
      const machineService = new hpccJSComms.MachineService(clusterDetails);
      const targetClusterUsage = await machineService.GetTargetClusterUsageEx();

      const maxUsage = targetClusterUsage.map(target =>  ({name: target.Name, maxUsage: target.max, meanUsage: target.mean}))
      res.status(200).send(maxUsage);
      
    }catch(err){
        res.status(503).json({success: false, message : "Failed to fetch current cluster usage"})
        logger.error(err)
    }
});

router.get(
  "/clusterStorageHistory/:queryData",
  [param("queryData").isString().withMessage("Invalid cluster query data")],
  async (req, res) => {
    try{
      //Check for errors - return if exists
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );

      // return if error(s) exist
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      const { queryData } = req.params;
      const query = JSON.parse(queryData);

      const data = await Cluster.findOne({
        where: { id: query.clusterId },
        raw: true,
        attributes: ["metaData"],
      });

      // Filter data before sending to client
      const start_date = moment(query.historyDateRange[0]).valueOf();
      const end_date = moment(query.historyDateRange[1]).valueOf();

      const storageUsageHistory =   data.metaData?.storageUsageHistory || {};

      const filtered_data = {};

      for (const key in storageUsageHistory) {
        filtered_data[key] = [];
        for (const item of storageUsageHistory[key]) {
          if (item.date > end_date) {
            break;
          }
          if (start_date <= item.date && item.date <= end_date) {
            filtered_data[key].push(item);
          }
        }
      }
      res.status(200).send(data.metaData?.storageUsageHistory || {});
    }catch(err){
      logger.error(err)
      res.status(503).json({success: false,message: "Failed to fetch current cluster usage"});
    }
  }
);

module.exports = router;