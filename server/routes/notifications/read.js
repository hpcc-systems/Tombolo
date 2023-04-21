const express = require("express");
const router = express.Router();
const fsPromises = require("fs/promises");
const path = require("path");
const models = require("../../models");
const monitoring_notifications = models.monitoring_notifications;
const fileMonitoring = models.fileMonitoring;
const clusterMonitoring = models.clusterMonitoring;
const logger = require("../../config/logger");
const { Op } = require("sequelize");
const moment = require("moment");

router.get("/filteredNotifications", async (req, res) => {
  try {
    const { queryData } = req.query;
    const { monitoringType, monitoringStatus, dateRange, applicationId } =
      JSON.parse(queryData);

    const query = {
      monitoring_type: { [Op.in]: monitoringType },
      application_id: applicationId,
      status: { [Op.in]: monitoringStatus },
    };

    if (dateRange) {
      let minDate = moment(dateRange[0]).format("YYYY-MM-DD HH:mm:ss");
      let maxDate = moment(dateRange[1]).format("YYYY-MM-DD HH:mm:ss");

      const range = [minDate, maxDate];
      query.createdAt = { [Op.between]: range };
    }

    const monitorings = await monitoring_notifications.findAll({
      where: query,
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    res.status(200).send(monitorings);
  } catch (err) {
    logger.error(err);
  }
});

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
    logger.error(err);
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
    const filePath = path.join(
      __dirname,
      "..",
      "..",
      "tempFiles",
      `Tombolo-Notifications.${type}`
    );

    const createPromise = fsPromises.writeFile(
      filePath,
      output,
      function (err) {
        if (err) {
          return console.log(err);
        }
      }
    );

    await createPromise;

    res.status(200).download(filePath);
  } catch (error) {
    res.status(500).json({ message: "Unable to get notifications" });
  }
});

//method for removing file after download on front-end
router.delete("/:applicationId/file/:type", async (req, res) => {
  try {
    const type = req.params.type;
    const filePath = path.join(
      __dirname,
      "..",
      "..",
      "tempFiles",
      `Tombolo-Notifications.${type}`
    );

    const createPromise = fsPromises.unlink(filePath);

    await createPromise;

    res.status(200).json({ message: "File Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete file" });
  }
});

module.exports = router;
