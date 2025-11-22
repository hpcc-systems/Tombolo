const logger = require('../config/logger');
const { NotificationQueue } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

async function createNotificationQueue(req, res) {
  try {
    const response = await NotificationQueue.create(req.body, { raw: true });
    return sendSuccess(res, response, 'Notification created successfully');
  } catch (err) {
    logger.error('createNotificationQueue: ', err);
    return sendError(res, 'Failed to save notification');
  }
}

async function getNotifications(req, res) {
  try {
    const notifications = await NotificationQueue.findAll();
    return sendSuccess(
      res,
      notifications,
      'Notifications retrieved successfully'
    );
  } catch (err) {
    logger.error('getNotificationQueue: ', err);
    return sendError(res, 'Failed to get notifications');
  }
}

async function updateNotificationQueue(req, res) {
  try {
    const updatedRows = await NotificationQueue.update(req.body, {
      where: { id: req.body.id },
      returning: true,
    });

    if (updatedRows[0] === 0) {
      return sendError(res, 'Notification not found', 404);
    }

    const updatedNotification = await NotificationQueue.findByPk(req.body.id);
    return sendSuccess(
      res,
      updatedNotification,
      'Notification updated successfully'
    );
  } catch (err) {
    logger.error('patchNotificationQueue: ', err);
    return sendError(res, 'Failed to update notification');
  }
}

async function deleteNotificationQueue(req, res) {
  try {
    await NotificationQueue.destroy({ where: { id: req.params.id } });
    return sendSuccess(res, null, 'Notification deleted successfully');
  } catch (err) {
    logger.error('deleteNotificationQueue: ', err);
    return sendError(res, 'Failed to delete notification');
  }
}

module.exports = {
  deleteNotificationQueue,
  updateNotificationQueue,
  getNotifications,
  createNotificationQueue,
};
