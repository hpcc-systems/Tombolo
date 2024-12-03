const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const moment = require("moment");
const sequelize = require("sequelize");

const { Op } = sequelize;

//Local imports
const logger = require("../../config/logger");
const models = require("../../models");
const { validationResult } = require("express-validator");
const emailNotificationHtmlCode  = require("../../utils/emailNotificationHtmlCode");

//Constants
const SentNotifications = models.sent_notifications;

// Create new sent notification
router.post(
  "/",
  [
    body("applicationId")
      .isUUID()
      .withMessage("Application ID must be a valid UUID"),
    body("notifiedAt").optional().custom((value) => {
      if (!moment(value, moment.ISO_8601, true).isValid()) {
        throw new Error("Notified at must be a date");
      }
      return true;
    }),
    body("notificationOrigin")
      .notEmpty()
      .withMessage("Notification origin is required"),
    body("notificationChannel")
      .notEmpty()
      .withMessage("Notification channel is required"),
    body("notificationTitle")
      .notEmpty()
      .withMessage("Notification title is required"),
    body("status").notEmpty().withMessage("Status is required"),
    body("recipients")
      .optional()
      .isObject()
      .withMessage("recipients  must be an object if provided"),
    body("createdBy").notEmpty().withMessage("Created by is required"),
    body("metaData")
      .optional()
      .isObject()
      .withMessage("Metadata must be an object if provided"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.error(errors);
        return res.status(400).send("Validation error occurred");
      }

      const response = await SentNotifications.create(req.body, { raw: true });
      res.status(200).send(response);
    } catch (err) {
      logger.error(err);
      res.status(500).send("Failed to save sent notification");
    }
  }
);

// Get all sent notifications
router.get(
  "/:applicationId",
  [
    param("applicationId")
      .isUUID()
      .withMessage("Application ID must be a valid UUID"),
  ],
  async (req, res) => {
    try {
      //validate
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.error(errors);
        return res.status(400).send("Validation error occurred");
      }

      // Get notifications from last 60 days only
      const sixtyDaysAgo = moment().subtract(60, "days").toDate();

      
      const notifications = await SentNotifications.findAll({
        where: {
          createdAt: {
            [Op.gte]: sixtyDaysAgo,
          },
        },
        order: [["createdAt", "DESC"]],
      });
      res.status(200).json(notifications);
    } catch (err) {
      logger.error(err);
      res.status(500).send("Failed to get sent notifications");
    }
  }
);

// Get a single sent notification
router.get(
  "/:applicationId/:id",
  [param("applicationId").isUUID().withMessage("ID must be a valid UUID"),
  param("id").isUUID().withMessage("ID must be a valid UUID")],
  async (req, res) => {
    try {
      //Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.error(errors);
        return res.status(400).send("Validation error occurred");
      }

      const notification = await SentNotifications.findByPk(req.params.id);
      if (!notification) {
        return res.status(404).send("Sent notification not found");
      }
      res.status(200).json(notification);
    } catch (err) {
      logger.error(err);
      res.status(500).send("Failed to get sent notification");
    }
  }
);


// Delete a single sent notification
router.delete(
  "/:id",
  [param("id").isUUID().withMessage("ID must be a valid UUID")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.error(errors);
        return res.status(400).send("Validation error occurred");
      }

      await SentNotifications.destroy({ where: { id: req.params.id } });
      res.status(200).send("success");
    } catch (err) {
      logger.error(err);
      res.status(500).send("Failed to delete sent notification");
    }
  }
);

//Delete multiple sent notifications
router.delete(
  "/",
  [body("ids").isArray().withMessage("IDs must be an array of UUIDs")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      await SentNotifications.destroy({ where: { id: req.body.ids } });
      res.status(200).send("success");
    } catch (err) {
      logger.error(err);
      res.status(500).send("Failed to delete sent notifications");
    }
  }
);

//Update single or multiple sent notifications
router.patch(
  "/",
  [body("ids").isArray().withMessage("IDs must be an array of UUIDs")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const allNotificationToBeUpdated = [];



      // If anything that is part of metaData is to be updated - fetch existing metadata and update particular fields
      if (req.body.jiraTickets) {
        const notificationsToBeUpdated = await SentNotifications.findAll({
          where: { id: req.body.ids },
        });

      // Organize all notifications to be updated the way they are to be updated
      notificationsToBeUpdated.forEach((n) => {
        let updatedNotification;
        updatedNotification = {
          ...req.body,
          id: n.id,
          metaData: {
            ...n.metaData,
            asrSpecificMetaData: {
              ...n.metaData.asrSpecificMetaData,
              jiraTickets: req.body.jiraTickets,
            },
          },
        };
        delete updatedNotification.ids;
        delete updatedNotification.jiraTickets
        allNotificationToBeUpdated.push(updatedNotification);
      });
      }


      // If no metadata is to be updated, update the rest of the fields
      if(allNotificationToBeUpdated.length > 0){
          const transaction = await models.sequelize.transaction();
          try{
          for(let item of allNotificationToBeUpdated){
            await SentNotifications.update(item, {where: {id: item.id}});
          }
          await transaction.commit();
        }catch(err){
          await transaction.rollback();
          throw new Error(err);
        }
      }else{
        const rows = await SentNotifications.update(
          req.body,  
          { where: { id: { [Op.in]: req.body.ids } } }
        );
      }

      //fetch and send updated data to client
      const updatedNotifications = await SentNotifications.findAll({
        where: { id: req.body.ids },
        raw: true,
      });

      res.status(200).json(updatedNotifications);
 
    } catch (err) {
      logger.error(err);
      res.status(500).send("Failed to update sent notifications");
    }
  }
);

// Get notification html code
router.post(
  "/getNotificationHtmlCode",
  [body("id").isUUID().withMessage("ID must be a valid UUID")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.error(errors);
        return res.status(400).send("Validation error occurred");
      }

      const notification = await SentNotifications.findByPk(req.body.id);
      if (!notification) {
        return res.status(404).send("Sent notification not found");
      }


      if (!notification.metaData || !notification.metaData.notificationDetails) {
        return res.status(404).send({message: "No details for this notification", data: null});
      }

      const templateName = notification.metaData.notificationDetails.templateName;
      if (!templateName) {
        return res.status(404).send({message: "Notification template not found", data: null});
      }

      const htmlCode = emailNotificationHtmlCode({templateName, data: notification.metaData.notificationDetails});
      res.status(200).send({message: 'Successfully fetched notification details', data: htmlCode});
    } catch (err) {
      logger.error(err.message);
      res.status(500).send("Failed to get notification html code");
    }
  }
);

module.exports = router;
