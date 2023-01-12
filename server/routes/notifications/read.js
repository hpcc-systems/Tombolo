const express = require("express");
const { file } = require("tmp");
const router = express.Router();
const models = require("../../models");
const fileMonitoring_notifications = models.filemonitoring_notifications;
const fileMonitoring = models.fileMonitoring;
const Application = models.application;

router.get("/:applicationId", async (req, res) => {
  try {
    const {applicationId: application_id} = req.params;
    if (!application_id) throw Error("Invalid app ID");
    const notifications = await fileMonitoring_notifications.findAll({
      where: { application_id },
      include: [
        {
          model: fileMonitoring,
          as: "fileMonitoring",
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
