const express = require("express");
const { file } = require("tmp");
const router = express.Router();
const models = require("../../models");
const monitoring_notifications = models.monitoring_notifications;
const fileMonitoring = models.fileMonitoring;
const clusterMonitoring = models.clusterMonitoring;

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
    console.log(error);
    res.status(500).json({ message: "Unable to get notifications" });
  }
});

module.exports = router;
