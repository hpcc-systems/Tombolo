// Packages
import { Op } from 'sequelize';
import type { Attributes, CreationAttributes } from 'sequelize';

//Local Imports
import { NotificationQueue, SentNotification } from '@tombolo/db';
import logger from '../../config/logger.js';
import { sendEmail, retryOptions } from '../../config/emailConfig.js';
const { maxRetries } = retryOptions;
import { updateNotificationQueueOnError } from './notificationsHelperFunctions.js';
import emailNotificationHtmlCode from '../../utils/emailNotificationHtmlCode.js';

type NotificationMetaData = {
  mainRecipients?: string[];
  cc?: string[];
  subject: string;
  body?: string;
  notificationId?: string;
  applicationId?: string;
  [key: string]: unknown;
};

type NotificationQueueRecord = Omit<
  Attributes<NotificationQueue>,
  'metaData' | 'reTryAfter' | 'lastScanned' | 'deliveryTime'
> & {
  metaData?: NotificationMetaData | null;
  reTryAfter?: Date | string | null;
  lastScanned?: Date | string | null;
  deliveryTime?: Date | string | null;
};

type EmailPayload = {
  notificationQueueId: string;
  receiver: string;
  cc?: string;
  subject: string;
  plainTextBody?: string;
  htmlBody?: string;
  notificationId?: string;
  applicationId?: string;
  notificationOrigin?: string;
  [key: string]: unknown;
};

type SuccessfulDeliveryRecord = EmailPayload & {
  templateName: string;
};

const toTimestamp = (dateValue?: Date | string | null): number | undefined => {
  if (!dateValue) {
    return undefined;
  }

  const timestamp =
    dateValue instanceof Date
      ? dateValue.getTime()
      : new Date(dateValue).getTime();
  return Number.isNaN(timestamp) ? undefined : timestamp;
};

(async () => {
  try {
    const now = Date.now();
    let notifications: NotificationQueueRecord[] = [];
    const notificationsToBeSent: NotificationQueueRecord[] = []; // Notification that meets the criteria to be sent
    const successfulDelivery: SuccessfulDeliveryRecord[] = [];

    // Get notifications with attempt count less than maxRetries and type email
    try {
      notifications = (await NotificationQueue.findAll({
        where: {
          type: 'email',
          attemptCount: { [Op.lt]: maxRetries },
        },
        raw: true,
      })) as NotificationQueueRecord[];
    } catch (err) {
      logger.error('Failed to retrieve notifications from db: ', err);
      return;
    }

    // Sort out notifications that meet the criteria to be sent
    for (const notification of notifications) {
      const { deliveryType, reTryAfter, lastScanned, deliveryTime } =
        notification;
      const retryAfterTime = toTimestamp(reTryAfter);
      const deliveryTimeValue = toTimestamp(deliveryTime);
      const lastScannedValue =
        toTimestamp(lastScanned) ?? Number.NEGATIVE_INFINITY;

      // Check if it meets the criteria to be sent
      if (
        (deliveryType === 'immediate' &&
          (!retryAfterTime || retryAfterTime < now)) ||
        (deliveryType === 'scheduled' &&
          (!retryAfterTime || retryAfterTime < now)) ||
        (deliveryType === 'scheduled' &&
          deliveryTimeValue !== undefined &&
          deliveryTimeValue < now &&
          deliveryTimeValue > lastScannedValue)
      ) {
        notificationsToBeSent.push(notification);
      }
    }

    // If there are no notifications to be sent - return
    if (notificationsToBeSent.length === 0) {
      return;
    }

    // If there are notifications to be sent - send the emails
    for (const notification of notificationsToBeSent) {
      const {
        metaData,
        attemptCount,
        id: notificationQueueId,
        notificationOrigin,
        templateName,
      } = notification;

      try {
        const {
          mainRecipients,
          cc: metadataCc,
          subject,
          ...metaDataWithoutEmailHeaders
        } = metaData ?? {};

        //Common email details applicable for all emails
        const commonEmailDetails = {
          receiver: mainRecipients?.join(',') || '',
          cc: metadataCc?.join(',') || '',
          subject,
        };

        //E-mail payload
        let emailPayload: EmailPayload;

        // Notification origin is manual - send the email as it is
        if (notificationOrigin === 'manual') {
          emailPayload = {
            notificationQueueId,
            ...commonEmailDetails,
            ...metaDataWithoutEmailHeaders,
            plainTextBody: metaData.body,
          };
        } else {
          // If notification origin is not manual, render email body with template
          const emailBody = emailNotificationHtmlCode({
            templateName,
            data: metaData,
          });
          emailPayload = {
            notificationQueueId,
            ...commonEmailDetails,
            ...metaDataWithoutEmailHeaders,
            htmlBody: emailBody,
          };

          // Send email
          await sendEmail({ ...emailPayload });

          // Assume success - if no error is thrown
          successfulDelivery.push({ ...emailPayload, templateName });
        }
      } catch (error) {
        // If sending fails update the notification queue
        logger.error('Failed to send email: ', error);

        // Update notification queue
        await updateNotificationQueueOnError({
          notificationId: notificationQueueId,
          attemptCount,
          error: error as Error,
        });
      }
    }

    // Update last scanned
    try {
      await NotificationQueue.update(
        { lastScanned: new Date(now) },
        { where: {} }
      );
    } catch (error) {
      logger.error(
        'processEmailNotifications: Failed to update last scanned: ',
        error
      );
    }

    //Update sent notifications table
    try {
      // clean successfully delivered notifications
      for (const notification of successfulDelivery) {
        const { htmlBody, notificationQueueId, ...notificationDetails } =
          notification;
        void htmlBody;
        void notificationQueueId;

        const sentNotificationPayload: CreationAttributes<SentNotification> = {
          ...(notificationDetails as Partial<
            CreationAttributes<SentNotification>
          >),
          searchableNotificationId: notification.notificationId ?? '',
          notificationChannel: 'email',
          notificationTitle: notification.subject,
          applicationId: notification.applicationId,
          status: 'Pending Review',
          createdBy: { name: 'System' },
          createdAt: new Date(now),
          updatedAt: new Date(now),
          metaData: { notificationDetails: notification },
        };

        await SentNotification.create(sentNotificationPayload);
      }
    } catch (error) {
      logger.error(
        'processEmailNotifications: Failed to create sent notification: ',
        error
      );
    }

    // Bulk delete the sent notifications form notification queue
    try {
      const successfulDeliveryIds = successfulDelivery.map(
        ({ notificationQueueId }) => notificationQueueId
      );

      await NotificationQueue.destroy({
        where: { id: successfulDeliveryIds },
      });
    } catch (err) {
      logger.error(
        'Failed to delete sent notifications from queue table: ',
        err
      );
    }
  } catch (error) {
    logger.error('Failed to process email notifications: ', error);
  }
})();

/* NOTES
1. new Date() - gives local time
2. new Date().toISOString() - gives UTC time in ISO 8601 format
3. Sequelize by default stores the date in UTC format
4. Sequelize by default returns the date in local time
5. Gotcha - If you console.log new Date() in node.js environment, It will log UTC time in ISO 8601 format.
   It is because node.js internally calls .toISOString() on the date object before logging it.
*/
