const express = require("express");
const router = express.Router();
const models = require("../../models");
const monitoring_notifications = models.monitoring_notifications;
const fileMonitoring = models.fileMonitoring;
const clusterMonitoring = models.clusterMonitoring;
const logger = require("../../config/logger")
const {Op} = require("sequelize")


router.get("/filteredNotifications", async (req, res) => { // TODO input validation
  try {
    const {queryData} = req.query;
    const { monitoringType, monitoringStatus, dateRange, applicationId } = JSON.parse(queryData)

    console.log('------------------------------------------');
    console.log(monitoringType);
    console.log('------------------------------------------');

    const query = {
      monitoring_type: { [Op.in]: monitoringType },
      application_id: applicationId,
      status: { [Op.in]: monitoringStatus },
    };
    
    if(dateRange){
      const range = [dateRange[0].split("T")[0], dateRange[1].split("T")[0]];
      query.createdAt = {[Op.between] : range}
    }

    const monitorings = await monitoring_notifications.findAll({
      where: query,
      order: [['createdAt', 'DESC']],
      raw: true
    });

    res.status(200).send(monitorings)

  } catch (err) {
    logger.error(err);
  }
});

router.get("/:applicationId", async (req, res) => {
  try {
    const {applicationId: application_id} = req.params;
    if (!application_id) throw Error("Invalid app ID");
    const notifications = await monitoring_notifications.findAll({
      where: { application_id },
      include: [
        {
          model: fileMonitoring,
          as: "fileMonitoring",
        },
        {
          model: clusterMonitoring,
          as: "clusterMonitoring",
        },
      ],
      raw: true,
    });
    res.status(200).send(notifications);
  } catch (error) {
    logger.error(err)
    res.status(500).json({ message: "Unable to get notifications" });
  }
});

module.exports = router;
