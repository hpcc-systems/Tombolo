const express = require("express");
const logger = require("../../config/logger");
const router = express.Router();
const models = require("../../models");
const jobScheduler = require("../../job-scheduler");
const FileMonitoring = models.fileMonitoring;
const validatorUtil = require("../../utils/validator");
const { body, param, validationResult } = require("express-validator");

router.post(
  "/",
  [
    body("application_id").isUUID(4).withMessage("Invalid application id"),
    body("cluster_id")
      .isUUID(4)
      .optional({ nullable: false })
      .withMessage("Invalid cluster id"),
    body("dirToMonitor")
      .isArray()
      .optional({ nullable: true })
      .withMessage("Invalid directory to monitor"),
    body("email")
      .isArray()
      .optional({ nullable: true })
      .withMessage("Invalid email/s"),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    try {
      if (!errors.isEmpty())return res.status(422).json({ success: false, errors: errors.array() });
      const { monitoringAssetType, monitoringActive } = req.body;
      const fileMonitoring = await FileMonitoring.create(req.body);
      res.status(200).send(fileMonitoring);

      // Add monitoring to bree if start monitoring now is checked
      if( monitoringActive){
        const schedularOptions = {
          filemonitoring_id: fileMonitoring.id,
          name: fileMonitoring.name,
          cron: fileMonitoring.cron,
          monitoringAssetType
        };
        jobScheduler.scheduleFileMonitoringBreeJob(schedularOptions);
      }

    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "Unable to save file monitoring details" });
    }
  }
);


// Get file monitoring [ All of them ]
router.get(
  "/all/:application_id",
  [param("application_id").isUUID(4).withMessage("Invalid application id")],
  async (req, res) => {
    try {
      const {application_id} = req.params;
        const errors = validationResult(req).formatWith(
          validatorUtil.errorFormatter
        );
        if (!errors.isEmpty()) 
          return res.status(422).json({ success: false, errors: errors.array() });

      const fileMonitoring = await FileMonitoring.findAll({where: {application_id}, raw: true });
      res.status(200).send(fileMonitoring);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Unable to get file monitoring" });
    }
  }
);

// Get file monitoring [ All of them ]
router.get(
  "/:file_monitoring_id",
  [param("file_monitoring_id").isUUID(4).withMessage("Invalid file monitoring id")],
  async (req, res) => {
    try {
      const { file_monitoring_id } = req.params;
        const errors = validationResult(req).formatWith(
          validatorUtil.errorFormatter
        );
        if (!errors.isEmpty()) 
          return res.status(422).json({ success: false, errors: errors.array() });

      const fileMonitoring = await FileMonitoring.findOne({
        where: { id: file_monitoring_id },
        raw: true,
      });

      res.status(200).send(fileMonitoring);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Unable to get file monitoring" });
    }
  }
);

//Delete File Monitoring 
router.delete('/:fileMonitoringId/:fileMonitoringName', 
[param("fileMonitoringId").isUUID(4).withMessage("Invalid file monitoring id")],
async (req, res, next) =>{
try{
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty())
    return res.status(422).json({ success: false, errors: errors.array() });
  const { fileMonitoringId, fileMonitoringName } = req.params;
  const response = await FileMonitoring.destroy({where: {id: fileMonitoringId}})
  res.status(200).json({message: `Deleted ${response} file monitoring`})

  //Check if this job is in bree - if so - remove
   const breeJobs = jobScheduler.getAllJobs();
   const expectedJobName = `${fileMonitoringName}-${fileMonitoringId}`;
   for(job of breeJobs){
    if(job.name === expectedJobName){
    jobScheduler.removeJobFromScheduler(expectedJobName);
    break;
    }
   }
}catch(err){
  res.status(500).json({message: err.message})
}
})


// Pause or start monitoring
router.put(
  "/fileMonitoringStatus/:id",
  [param("id").isUUID(4).withMessage("Invalid file monitoring Id")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { id } = req.params;
      const monitoring = await FileMonitoring.findOne({
        where: { id },
        raw: true,
      });
      const { name, cron, monitoringActive, monitoringAssetType } = monitoring;

      // flipping monitoringActive
      await FileMonitoring.update(
        { monitoringActive: !monitoringActive },
        { where: { id: id } }
      );

      // If monitoringActive, it is in bre - remove from bree
      if (monitoringActive) {
        await jobScheduler.removeJobFromScheduler(`${name}-${id}`);
      }

      // If monitoringActive = false, add it to bre
      if (!monitoringActive) {
        await jobScheduler.scheduleFileMonitoringBreeJob({
          filemonitoring_id: id,
          name,
          cron,
          monitoringAssetType,
        });
      }

      res.status(200).send("Update successful");
    } catch (err) {
      logger.error(err);
    }
  }
);


router.put(
  "/",
  [
    body("application_id").isUUID(4).withMessage("Invalid application id"),
    body("cluster_id")
      .isUUID(4)
      .optional({ nullable: false })
      .withMessage("Invalid cluster id"),
    body("dirToMonitor")
      .isArray()
      .optional({ nullable: true })
      .withMessage("Invalid directory to monitor"),
    body("email")
      .isArray()
      .optional({ nullable: true })
      .withMessage("Invalid email/s"),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    console.log('------------------------------------------');
    console.dir("Hitting put", {depth: null})
    res.status(200).send({ok: true})
    console.log('------------------------------------------');
    // try {
    //   if (!errors.isEmpty())
    //     return res.status(422).json({ success: false, errors: errors.array() });
    //   const { monitoringAssetType, monitoringActive } = req.body;
    //   const fileMonitoring = await FileMonitoring.create(req.body);
    //   res.status(200).send(fileMonitoring);

    //   // Add monitoring to bree if start monitoring now is checked
    //   if (monitoringActive) {
    //     const schedularOptions = {
    //       filemonitoring_id: fileMonitoring.id,
    //       name: fileMonitoring.name,
    //       cron: fileMonitoring.cron,
    //       monitoringAssetType,
    //     };
    //     jobScheduler.scheduleFileMonitoringBreeJob(schedularOptions);
    //   }
    // } catch (error) {
    //   console.log(error);
    //   res
    //     .status(500)
    //     .json({ message: "Unable to save file monitoring details" });
    // }
  }
);

module.exports = router;