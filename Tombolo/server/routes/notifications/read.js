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
  MonitoringNotification,
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

    const monitorings = await MonitoringNotification.findAll({
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
    logger.error('notifications/read getFilteredNotifications: ', err);
  }
});

router.get(
  '/:applicationId',
  validate(validateGetNotifications),
  async (req, res) => {
    try {
      const { applicationId: application_id } = req.params;
      if (!application_id) throw Error('Invalid app ID');
      const notifications = await MonitoringNotification.findAll({
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
      logger.error('notifications/read getNotifications: ', error);
      return res.status(500).json({ message: 'Unable to get notifications' });
    }
  }
);

//Delete notification
router.delete('/', validate(validateDeleteNotifications), async (req, res) => {
  try {
    const { notifications } = req.body;
    await MonitoringNotification.destroy({ where: { id: notifications } });
    return res
      .status(200)
      .send({ success: true, message: 'Deletion successful' });
  } catch (err) {
    logger.error('notifications/read deleteNotifications: ', err);
    return res
      .status(503)
      .send({ success: false, message: 'Failed to delete' });
  }
});

router.put('/', validate(validatePutUpdateNotification), async (req, res) => {
  try {
    const { notifications, status, comment } = req.body;

    if (status) {
      await MonitoringNotification.update(
        { status },
        { where: { id: notifications } }
      );
    }

    if (comment || comment === '') {
      await MonitoringNotification.update(
        { comment },
        { where: { id: notifications } }
      );
    }

    return res
      .status(200)
      .send({ success: true, message: 'Update successful' });
  } catch (err) {
    logger.error('notifications/read putUpdateNotification: ', err);
    return res
      .status(503)
      .send({ success: false, message: 'Failed to update status' });
  }
});

module.exports = router;
