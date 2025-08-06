const express = require('express');
const router = express.Router();

const fsPromises = require('fs/promises');
const path = require('path');
const { Op } = require('sequelize');
const moment = require('moment');
const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateGetNotifications,
  validateNotificationByType,
  validateDeleteNotificationByType,
  validateDeleteNotifications,
  validatePutUpdateNotification,
} = require('../../middlewares/notificationsMiddleware');

const logger = require('../../config/logger');
const {
  monitoring_notifications,
  FileMonitoring,
  ClusterMonitoring,
  JobMonitoring,
} = require('../../models');
const ROOT = 'tombolo/server';

router.get('/filteredNotifications', async (req, res) => {
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
      let minDate = moment(dateRange[0]).format('YYYY-MM-DD HH:mm:ss');
      let maxDate = moment(dateRange[1]).format('YYYY-MM-DD HH:mm:ss');

      const range = [minDate, maxDate];
      query.createdAt = { [Op.between]: range };
    }

    const monitorings = await monitoring_notifications.findAll({
      where: query,
      order: [['createdAt', 'DESC']],
      raw: true,
      // include: [
      //   {
      //     model: JobMonitoring,
      //     attributes: ["name"],
      //   },
      //   {
      //     model: ClusterMonitoring,
      //     attributes: ["name"],
      //   },
      //   {
      //     model: FileMonitoring,
      //     attributes: ["name"],
      //   },
      // ],
    });

    return res.status(200).send(monitorings);
  } catch (err) {
    logger.error(err);
  }
});

router.get(
  '/:applicationId',
  validate(validateGetNotifications),
  async (req, res) => {
    try {
      const { applicationId: application_id } = req.params;
      if (!application_id) throw Error('Invalid app ID');
      const notifications = await monitoring_notifications.findAll({
        where: { application_id },
        include: [
          {
            model: JobMonitoring,
            attributes: ['name'],
          },
          {
            model: ClusterMonitoring,
            attributes: ['name'],
          },
          {
            model: FileMonitoring,
            attributes: ['name'],
          },
        ],
        raw: true,
      });
      return res.status(200).send(notifications);
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ message: 'Unable to get notifications' });
    }
  }
);

router.get(
  '/:applicationId/file/:type',
  validate(validateNotificationByType),
  async (req, res) => {
    try {
      const { applicationId: application_id } = req.params;
      if (!application_id) throw Error('Invalid app ID');
      const notifications = await monitoring_notifications.findAll({
        where: { application_id },
        include: [
          {
            model: FileMonitoring,
            as: 'fileMonitoring',
          },
          {
            model: ClusterMonitoring,
            as: 'clusterMonitoring',
          },
        ],
        raw: true,
      });

      const type = req.params.type;

      let output;

      if (type === 'CSV') {
        output = 'id,monitoringId,Channel,Reason,Status,Created,Deleted';
        notifications.map(notification => {
          output +=
            '\n' +
            notification.id +
            ',' +
            notification.monitoring_id +
            ',' +
            notification.notification_channel +
            ',' +
            notification.notification_reason +
            ',' +
            notification.status +
            ',' +
            notification.createdAt +
            ',' +
            notification.deletedAt;
        });
      } else if (type === 'JSON') {
        output = [];
        notifications.map(notification => {
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

      let filePath = path.join(
        __dirname,
        '..',
        '..',
        'tempFiles',
        `Tombolo-Notifications.${type}`
      );

      await createPromise;

      return res.status(200).download(filePath);
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Unable to get notifications: ' + error });
    }
  }
);

//method for removing file after download on front-end
router.delete(
  '/:applicationId/file/:type',
  validate(validateDeleteNotificationByType),
  async (req, res) => {
    try {
      const type = req.params.type;

      const filePath = path.join(
        __dirname,
        '..',
        '..',
        'tempFiles',
        `Tombolo-Notifications.${type}`
      );

      const createPromise = fsPromises.unlink(filePath);

      await createPromise;

      return res.status(200).json({ message: 'File Deleted' });
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ message: 'Failed to delete file' });
    }
  }
);

//Delete notification
router.delete('/', validate(validateDeleteNotifications), async (req, res) => {
  try {
    const { notifications } = req.body;
    await monitoring_notifications.destroy({ where: { id: notifications } });
    return res
      .status(200)
      .send({ success: true, message: 'Deletion successful' });
  } catch (err) {
    logger.error(err.message);
    return res
      .status(503)
      .send({ success: false, message: 'Failed to delete' });
  }
});

router.put('/', validate(validatePutUpdateNotification), async (req, res) => {
  try {
    const { notifications, status, comment } = req.body;

    if (status) {
      await monitoring_notifications.update(
        { status },
        { where: { id: notifications } }
      );
    }

    if (comment || comment === '') {
      await monitoring_notifications.update(
        { comment },
        { where: { id: notifications } }
      );
    }

    return res
      .status(200)
      .send({ success: true, message: 'Update successful' });
  } catch (err) {
    logger.error(err.message);
    return res
      .status(503)
      .send({ success: false, message: 'Failed to update status' });
  }
});

module.exports = router;
