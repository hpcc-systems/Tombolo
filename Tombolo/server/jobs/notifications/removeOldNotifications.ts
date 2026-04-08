// Packages
import { Op } from 'sequelize';

// Local Imports
import { NotificationQueue, SentNotification } from '../../models/index.js';
import { logOrPostMessage } from '../jobUtils.js';
import {
  notificationRetentionDays as RETENTION_DAYS,
  notificationRetentionBatchSize as BATCH_SIZE,
} from '../../config/monitorings.js';

/**
 * Hard-deletes sent_notifications records older than RETENTION_DAYS in batches.
 * Uses force:true to permanently remove rows even though the model is paranoid.
 */
export async function cleanupSentNotifications(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  let totalDeleted = 0;

  while (true) {
    const deleted =
      (await SentNotification.destroy({
        where: {
          createdAt: { [Op.lt]: cutoff },
        },
        limit: BATCH_SIZE,
        force: true, // hard delete — bypass paranoid soft-delete
      })) ?? 0;

    totalDeleted += deleted;

    // Stop when we get fewer rows than the batch size — nothing left to delete
    if (deleted < BATCH_SIZE) break;
  }

  return totalDeleted;
}

/**
 * Deletes notification_queue records older than RETENTION_DAYS in batches.
 * Safe filter: only removes entries that are clearly no longer actionable
 * (immediate delivery type or scheduled items whose delivery time has passed).
 */
export async function cleanupNotificationQueue(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  let totalDeleted = 0;

  while (true) {
    const deleted =
      (await NotificationQueue.destroy({
        where: {
          createdAt: { [Op.lt]: cutoff },
          [Op.or]: [
            { deliveryType: 'immediate' },
            { deliveryTime: { [Op.lt]: now } },
          ],
        },
        limit: BATCH_SIZE,
      })) ?? 0;

    totalDeleted += deleted;

    if (deleted < BATCH_SIZE) break;
  }

  return totalDeleted;
}

/**
 * Orchestrates both cleanup steps and emits structured log messages.
 */
export async function removeOldNotifications(): Promise<void> {
  const start = Date.now();

  logOrPostMessage({
    level: 'info',
    text: 'Notification retention cleanup started ...',
  });

  const sentCount = await cleanupSentNotifications();
  logOrPostMessage({
    level: 'info',
    text: `Deleted ${sentCount} old sent notification(s) from sent_notifications`,
  });

  const queueCount = await cleanupNotificationQueue();
  logOrPostMessage({
    level: 'info',
    text: `Deleted ${queueCount} old notification(s) from notification_queue`,
  });

  const durationSecs = ((Date.now() - start) / 1000).toFixed(2);
  logOrPostMessage({
    level: 'info',
    text: `Notification retention cleanup completed in ${durationSecs}s — total deleted: ${sentCount + queueCount}`,
  });
}

(async () => {
  try {
    await removeOldNotifications();
  } catch (error) {
    logOrPostMessage({ level: 'error', text: error.message });
  }
})();
