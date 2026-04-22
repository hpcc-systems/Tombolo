import { v4 as uuidv4 } from 'uuid';
import type {
  NotificationChannel,
  NotificationDeliveryMode,
  NotificationJobPayload,
} from '@tombolo/shared';
import {
  assertNotificationJobPayload,
  isNotificationChannel,
  isNotificationDeliveryMode,
} from '@tombolo/shared';
import logger from '../config/logger.js';
import { notificationsQueue } from '../queues/notificationsQueue.js';

type LegacyMetaData = {
  notificationId?: string;
  subject?: string;
  mainRecipients?: string[];
  cc?: string[];
  [key: string]: unknown;
};

export interface NotificationEnqueueInput {
  type?: NotificationChannel | string;
  deliveryType?: NotificationDeliveryMode | string;
  templateName?: string;
  notificationOrigin?: string;
  originationId?: string;
  deliveryTime?: Date | string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  metaData?: LegacyMetaData | null;
}

const toIsoDateString = (value?: Date | string | null): string | undefined => {
  if (!value) return undefined;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const toDelayMs = (value?: Date | string | null): number | undefined => {
  const iso = toIsoDateString(value);
  if (!iso) return undefined;
  const delay = new Date(iso).getTime() - Date.now();
  return delay > 0 ? delay : 0;
};

const normalizeRecipients = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0);
};

export const enqueueNotification = async (
  input: NotificationEnqueueInput
): Promise<void> => {
  if (!isNotificationChannel(input.type)) {
    throw new Error(`Unsupported notification channel: ${input.type}`);
  }

  if (!isNotificationDeliveryMode(input.deliveryType)) {
    throw new Error(`Unsupported delivery type: ${input.deliveryType}`);
  }

  if (typeof input.templateName !== 'string' || input.templateName.length < 1) {
    throw new Error('Notification templateName is required');
  }

  if (
    typeof input.notificationOrigin !== 'string' ||
    input.notificationOrigin.length < 1
  ) {
    throw new Error('Notification notificationOrigin is required');
  }

  const metaData = input.metaData ?? {};
  const notificationId =
    typeof metaData.notificationId === 'string' && metaData.notificationId
      ? metaData.notificationId
      : uuidv4();

  const subject =
    typeof metaData.subject === 'string' && metaData.subject.trim().length > 0
      ? metaData.subject
      : input.templateName;

  // BullMQ custom job IDs cannot include ':'
  const idempotencyKey = `${input.type}-${notificationId}`;
  const mainRecipients = normalizeRecipients(metaData.mainRecipients);
  const ccRecipients = normalizeRecipients(metaData.cc);

  if (input.type === 'email' && mainRecipients.length === 0) {
    throw new Error(
      `Notification recipients are required for email notifications (template: ${input.templateName}, notificationId: ${notificationId})`
    );
  }

  const payload: NotificationJobPayload = {
    notificationId,
    idempotencyKey,
    channel: input.type,
    deliveryMode: input.deliveryType,
    templateName: input.templateName,
    notificationOrigin: input.notificationOrigin,
    subject,
    recipients: {
      mainRecipients,
      ...(ccRecipients.length > 0 ? { cc: ccRecipients } : {}),
    },
    createdBy:
      typeof input.createdBy === 'string' && input.createdBy.trim().length > 0
        ? input.createdBy
        : 'System',
    metaData,
    ...(input.deliveryType === 'scheduled'
      ? { scheduledAt: toIsoDateString(input.deliveryTime) }
      : {}),
  };

  assertNotificationJobPayload(
    payload,
    'Invalid payload while enqueueing notification'
  );

  await notificationsQueue.add('send-notification', payload, {
    jobId: payload.idempotencyKey,
    delay:
      input.deliveryType === 'scheduled'
        ? toDelayMs(input.deliveryTime)
        : undefined,
  });

  logger.info('Notification queued to BullMQ', {
    notificationId: payload.notificationId,
    idempotencyKey: payload.idempotencyKey,
    channel: payload.channel,
    deliveryMode: payload.deliveryMode,
    templateName: payload.templateName,
  });
};
