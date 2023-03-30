const express = require("express");
const { file } = require("tmp");
const router = express.Router();
const fs = require("fs");
const models = require("../../models");
const monitoring_notifications = models.monitoring_notifications;
const fileMonitoring = models.fileMonitoring;
const clusterMonitoring = models.clusterMonitoring;

router.get("/:applicationId", async (req, res) => {
  try {
    const { applicationId: application_id } = req.params;
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

router.get("/:applicationId/file/:type", async (req, res) => {
  try {
    const { applicationId: application_id } = req.params;
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

    const type = req.params.type;

    let output;

    if (type === "CSV") {
      output = `id,monitoringId,Channel,Reason,Status,Created,Deleted`;
      notifications.map((notification) => {
        output +=
          "\n" +
          notification.id +
          "," +
          notification.monitoring_id +
          "," +
          notification.notification_channel +
          "," +
          notification.notification_reason +
          "," +
          notification.status +
          "," +
          notification.createdAt +
          "," +
          notification.deletedAt;
      });
    } else if (type === "JSON") {
      output = [];
      notifications.map((notification) => {
        output.push({
          ID: notification.id,
          MonitoringID: notification.monitoring_id,
          Channel: notification.notification_channel,
          Reason: notification.notification_reason,
          Status: notification.status,
          Created: notification.createdAt,
          Deleted: notification.deletedAt,
        });
      });

      output = JSON.stringify(output);
    }

    const filePath = `./temp/Tombolo-Notifications.${type}`;

    await fs.writeFile(filePath, output, async function (err) {
      if (err) {
        return console.log(err);
      }
      res.status(200).download(filePath);
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to get notifications" });
  } finally {
    //delete file
    const type = req.params.type;
    const filePath = `./temp/Tombolo-Notifications.${type}`;
    await fs.unlink(filePath, async function (err) {
      if (err) {
        return console.log(err);
      }
    });
  }
});

module.exports = router;
