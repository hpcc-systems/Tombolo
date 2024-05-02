/* This route is specifically for updating notifications via teams card. 
For that reason this route is not together with other notification routes.
Server does not validate the token to access this route */ 

const express = require("express");
const router = express.Router();
const models = require("../../models");
const monitoring_notifications = models.monitoring_notifications;
const fileMonitoring = models.fileMonitoring;

//TODO send acknowledgement
//Using POST - PUT not available for action Card
router.post("/update", async (req, res) => {
  try {
    const { notification_id, status, comment, filemonitoring_id, fileName } = req.body;

    if(!notification_id) throw Error('Invalid notification ID')
    const updateData = {
      responded_on: new Date()
    };
    if (status) {
      updateData.status = status;
    }
    if (comment) {
      updateData.comment = comment;
    }

    // Update the notification status
    await monitoring_notifications.update(updateData, {
      where: { id: notification_id },
    });


    // Remove file from monitoring list if status is changed to 'Closed'
    if (status === "Closed" && filemonitoring_id) {
      const {
        metaData,
        metaData: { currentlyMonitoring },
      } = await fileMonitoring.findOne({
        where: { id: filemonitoring_id },
        raw: true,
      });
      const newFileMonitoringList = currentlyMonitoring.filter(
        (file) => file.name !== fileName
      );
      const newMetaData = {
        ...metaData,
        currentlyMonitoring: newFileMonitoringList,
      };

      await fileMonitoring.update(
        { metaData: newMetaData },
        { where: { id: filemonitoring_id } }
      );
    } 

    res.status(200).send("Success updating");
  } catch (err) {
    console.log(err);
    res.status(503).send("Failed to make update");
  }
});

module.exports = router;