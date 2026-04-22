import { Worker } from 'bullmq';
import type { Job } from 'bullmq';
import type { NotificationJobPayload } from '@tombolo/shared';
import { FailedNotification, SentNotification } from '@tombolo/db';
import { redisConnectionOptions } from '@/config/redis.js';
import logger from '@/config/logger.js';
import { formatErrorForLogging } from '@/utils/errorFormatter.js';
import { sendEmail } from '@/config/email.js';
import emailNotificationHtmlCode, {
  emailNotificationTextCode,
} from '@/utils/emailNotificationHtmlCode.js';

const getApplicationId = (
  payload: NotificationJobPayload
): string | undefined => {
  const value = payload.metaData?.applicationId;
  return typeof value === 'string' ? value : undefined;
};

const getLastErrorCode = (error: Error): string | null => {
  const maybeCode = (error as Error & { code?: unknown }).code;
  return typeof maybeCode === 'string' ? maybeCode : null;
};

const normalizeRecipients = (recipients: string[] | undefined): string[] => {
  if (!Array.isArray(recipients)) return [];
  return recipients
    .filter((entry): entry is string => typeof entry === 'string')
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0);
};

const processNotificationJob = async (job: Job<NotificationJobPayload>) => {
  const payload = job.data;
  const mainRecipients = normalizeRecipients(payload.recipients.mainRecipients);
  const ccRecipients = normalizeRecipients(payload.recipients.cc);

  if (mainRecipients.length === 0) {
    throw new Error(
      `No recipients defined for notificationId ${payload.notificationId}`
    );
  }

  const templateName =
    typeof payload.templateName === 'string' ? payload.templateName : '';

  const htmlBody = emailNotificationHtmlCode({
    templateName,
    data: payload.metaData ?? {},
  });

  const plainTextBody =
    typeof payload.metaData?.body === 'string'
      ? payload.metaData.body
      : (emailNotificationTextCode({
          templateName,
          data: payload.metaData ?? {},
        }) ?? `Notification: ${payload.subject}`);

  await sendEmail({
    receiver: mainRecipients.join(','),
    cc: ccRecipients.length > 0 ? ccRecipients.join(',') : undefined,
    subject: payload.subject,
    plainTextBody,
    htmlBody,
  });

  await SentNotification.create({
    searchableNotificationId: payload.notificationId,
    idempotencyKey: payload.idempotencyKey,
    applicationId: getApplicationId(payload),
    notifiedAt: new Date(),
    notificationOrigin: payload.notificationOrigin,
    notificationChannel: payload.channel,
    notificationTitle: payload.subject,
    notificationDescription:
      typeof payload.metaData?.notificationDescription === 'string'
        ? payload.metaData.notificationDescription
        : null,
    status: 'Pending Review',
    recipients: payload.recipients,
    createdBy: { name: payload.createdBy },
    updatedBy: { name: payload.createdBy },
    metaData: { notificationDetails: payload },
  });

  logger.info('Notification processed successfully', {
    jobId: job.id,
    notificationId: payload.notificationId,
    idempotencyKey: payload.idempotencyKey,
  });
};

export const notificationsWorker = new Worker(
  'notifications',
  processNotificationJob,
  {
    autorun: false,
    connection: redisConnectionOptions,
    concurrency: 2,
    lockDuration: 300000,
    lockRenewTime: 150000,
  }
);

notificationsWorker.on('completed', job => {
  logger.info(`Notification job ${job.id} completed`);
});

notificationsWorker.on('failed', async (job, err) => {
  logger.error(
    `Notification job ${job?.id} failed`,
    formatErrorForLogging(err)
  );

  if (!job) return;

  const maxAttempts = job.opts.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) {
    return;
  }

  const payload = job.data;

  try {
    await FailedNotification.upsert({
      searchableNotificationId: payload.notificationId,
      idempotencyKey: payload.idempotencyKey,
      applicationId: getApplicationId(payload),
      notificationOrigin: payload.notificationOrigin,
      notificationChannel: payload.channel,
      notificationTitle: payload.subject,
      notificationDescription:
        typeof payload.metaData?.notificationDescription === 'string'
          ? payload.metaData.notificationDescription
          : null,
      recipients: payload.recipients,
      attemptCount: job.attemptsMade,
      lastErrorCode: getLastErrorCode(err),
      lastErrorMessage: err.message,
      failureReason: {
        attemptsMade: job.attemptsMade,
        maxAttempts,
        reason: err.message,
      },
      failedAt: new Date(),
      createdBy: { name: payload.createdBy },
      updatedBy: { name: payload.createdBy },
      metaData: {
        notificationDetails: payload,
        failure: {
          attemptsMade: job.attemptsMade,
          maxAttempts,
          reason: err.message,
        },
      },
    });
  } catch (persistError) {
    logger.error(
      'Failed to persist notification terminal failure',
      formatErrorForLogging(persistError)
    );
  }
});

notificationsWorker.on('error', err => {
  logger.error('Notification worker error', formatErrorForLogging(err));
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing notifications worker...');
  await notificationsWorker.close();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing notifications worker...');
  await notificationsWorker.close();
});
