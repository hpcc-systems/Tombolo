import { Request, Response } from 'express';
import logger from '../config/logger.js';
import { NotificationQueue } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/response.js';

async function createNotificationQueue(req: Request, res: Response) {
  try {
    const response = await NotificationQueue.create(req.body, { raw: true });
    return sendSuccess(res, response, 'Notification created successfully');
  } catch (err) {
    logger.error('createNotificationQueue: ', err);
    return sendError(res, 'Failed to save notification');
  }
}

async function getNotifications(req: Request, res: Response) {
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

async function updateNotificationQueue(req: Request, res: Response) {
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

async function deleteNotificationQueue(req: Request, res: Response) {
  try {
    await NotificationQueue.destroy({
      where: { id: (req.params as { id: string }).id },
    });
    return sendSuccess(res, null, 'Notification deleted successfully');
  } catch (err) {
    logger.error('deleteNotificationQueue: ', err);
    return sendError(res, 'Failed to delete notification');
  }
}

export {
  deleteNotificationQueue,
  updateNotificationQueue,
  getNotifications,
  createNotificationQueue,
};
