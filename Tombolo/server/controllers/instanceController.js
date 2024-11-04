const models = require("../models");
const { v4: UUIDV4 } = require("uuid");
const instance_settings = models.instance_settings;
const User = models.user;
const NotificationQueue = models.notification_queue;
const sent_notifications = models.sent_notifications;
const logger = require("../config/logger");

// Get a single instance setting by name
const getInstanceSetting = async (req, res) => {
  try {
    const instance = await instance_settings.findOne({
      where: { name: req.params.name },
    });

    if (!instance) {
      return res.status(404).json({ message: "Instance setting not found" });
    }
    res.status(200).json(instance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all instance settings
const getAllInstanceSettings = async (req, res) => {
  try {
    const instances = await instance_settings.findAll();
    if (!instances) {
      return res.status(404).json({ message: "Instance settings not found" });
    }
    res.status(200).json(instances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new instance setting
const createInstanceSetting = async (req, res) => {
  try {
    const newInstance = await instance_settings.create(req.body);

    if (!newInstance) {
      return res
        .status(400)
        .json({ message: "Failed to create instance setting" });
    }
    res.status(201).json(newInstance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update an existing instance setting by ID
const updateInstanceSetting = async (req, res) => {
  try {
    const instance = await instance_settings.findOne({
      where: { id: req.params.id },
    });

    if (!instance) {
      return res.status(404).json({ message: "Instance setting not found" });
    }

    const updatedInstance = await instance.update(req.body);

    res.status(200).json(updatedInstance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an instance setting by ID
const deleteInstanceSetting = async (req, res) => {
  try {
    const instance = await instance_settings.findOne({
      where: { id: req.params.id },
    });
    if (!instance) {
      return res.status(404).json({ message: "Instance setting not found" });
    }

    await instance.destroy();
    res.status(200).json({ message: "Instance setting deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const requestAccess = async (req, res) => {
  try {
    const { id, comment } = req.body;

    const user = await User.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const instance_setting = await instance_settings.findOne({
      where: { name: "contactEmail" },
    });

    if (!instance_setting) {
      return res.status(404).json({ message: "No contact email found." });
    }

    const existingNotification = await sent_notifications.findOne({
      where: { notificationTitle: `User Access Request from ${user.email}` },
    });

    //check if existingNotification.createdAt is within 24 hours
    if (existingNotification) {
      const currentTime = new Date();
      const notificationTime = new Date(existingNotification.createdAt);
      const diff = Math.abs(currentTime - notificationTime);
      const diffHours = Math.ceil(diff / (1000 * 60 * 60));

      if (diffHours < 24) {
        logger.info(
          "Access request from user already sent within 24 hours. User: " +
            user.email
        );
        return res.status(200).json({ message: "Access request already sent" });
      }
    }

    const searchableNotificationId = UUIDV4();

    // Add to notification queue
    await NotificationQueue.create({
      type: "email",
      templateName: "accessRequest",
      notificationOrigin: "No Access Page",
      deliveryType: "immediate",
      metaData: {
        notificationId: searchableNotificationId,
        notificationOrigin: "No Access Page",
        email: `${user.email}`,
        comment: comment,
        userManagementLink: `${process.env.WEB_URL}/admin/userManagement`,
        subject: `User Access Request from ${user.email}`,
        mainRecipients: [instance_setting.value],
        notificationDescription: "User Access Request",
        validForHours: 24,
      },
      createdBy: user.id,
    });

    res.status(200).json({ message: "Access requested successfully" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
};

module.exports = {
  getInstanceSetting,
  getAllInstanceSettings,
  createInstanceSetting,
  updateInstanceSetting,
  deleteInstanceSetting,
  requestAccess,
};
