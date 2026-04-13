import { NotificationQueue, SentNotification } from '@tombolo/db';
import { Op } from 'sequelize';
import logger from '@/config/logger.js';
import type { ArchiveJobData } from '@/types/index.js';

async function cleanupSentNotifications(
  cutoff: Date,
  batchSize: number
): Promise<number> {
  let totalDeleted = 0;

  while (true) {
    const deleted =
      (await SentNotification.destroy({
        where: {
          createdAt: { [Op.lt]: cutoff },
        },
        limit: batchSize,
        force: true,
      })) ?? 0;

    totalDeleted += deleted;

    if (deleted < batchSize) break;
  }

  return totalDeleted;
}

async function cleanupNotificationQueue(
  cutoff: Date,
  batchSize: number
): Promise<number> {
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
        limit: batchSize,
        force: true,
      })) ?? 0;

    totalDeleted += deleted;

    if (deleted < batchSize) break;
  }

  return totalDeleted;
}

export async function runNotificationArchive(job: ArchiveJobData): Promise<{
  deletedSentNotifications: number;
  deletedQueueNotifications: number;
}> {
  const daysToKeep = job.daysToKeep ?? 90;
  const batchSize = job.batchSize ?? 1000;
  const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  logger.info('Starting notification retention cleanup job', {
    daysToKeep,
    batchSize,
    cutoff: cutoff.toISOString(),
  });

  const deletedSentNotifications = await cleanupSentNotifications(
    cutoff,
    batchSize
  );

  const deletedQueueNotifications = await cleanupNotificationQueue(
    cutoff,
    batchSize
  );

  return {
    deletedSentNotifications,
    deletedQueueNotifications,
  };
}
