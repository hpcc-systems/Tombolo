export interface SentNotificationAttributes {
  id: string;
  searchableNotificationId: string;
  idempotencyKey?: string | null;
  applicationId?: string | null;
  notifiedAt?: Date | string | null;
  notificationOrigin: string;
  notificationChannel: string;
  notificationTitle: string;
  notificationDescription?: string | null;
  status: string;
  recipients?: any | null;
  resolutionDateTime?: Date | string | null;
  comment?: string | null;
  createdBy: any;
  updatedBy?: any | null;
  metaData?: any | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;

  // Associations
  application?: any;
}

export type NotificationDTO = SentNotificationAttributes;

/**
 * Represents a notification job payload for use with BullMQ
 */
export interface NotificationJobPayload {
  notificationId: string;
  idempotencyKey: string;
  channel: string;
  deliveryMode?: string;
  templateName?: string;
  notificationOrigin: string;
  subject: string;
  recipients: {
    mainRecipients: string[];
    cc?: string[];
  };
  createdBy: string;
  metaData?: Record<string, unknown>;
  scheduledAt?: string;
}

/**
 * Validates that a payload conforms to NotificationJobPayload shape
 */
export const assertNotificationJobPayload = (
  payload: unknown,
  errorMsg?: string
): asserts payload is NotificationJobPayload => {
  const msg = errorMsg || 'Invalid notification job payload';

  if (!payload || typeof payload !== 'object') {
    throw new Error(msg);
  }

  const p = payload as Record<string, unknown>;

  if (typeof p.notificationId !== 'string') {
    throw new Error(`${msg}: notificationId must be a string`);
  }
  if (typeof p.idempotencyKey !== 'string') {
    throw new Error(`${msg}: idempotencyKey must be a string`);
  }
  if (typeof p.channel !== 'string') {
    throw new Error(`${msg}: channel must be a string`);
  }
  if (typeof p.notificationOrigin !== 'string') {
    throw new Error(`${msg}: notificationOrigin must be a string`);
  }
  if (typeof p.subject !== 'string') {
    throw new Error(`${msg}: subject must be a string`);
  }
  if (typeof p.createdBy !== 'string') {
    throw new Error(`${msg}: createdBy must be a string`);
  }

  if (!p.recipients || typeof p.recipients !== 'object') {
    throw new Error(`${msg}: recipients must be an object`);
  }

  const recipients = p.recipients as Record<string, unknown>;
  if (!Array.isArray(recipients.mainRecipients)) {
    throw new Error(`${msg}: recipients.mainRecipients must be an array`);
  }

  if (recipients.cc !== undefined && !Array.isArray(recipients.cc)) {
    throw new Error(`${msg}: recipients.cc must be an array if provided`);
  }
};

export type NotificationChannel = 'email' | 'sms' | 'push';
export type NotificationDeliveryMode = 'immediate' | 'scheduled' | 'batch';

/**
 * Type guard functions for notification types
 */
export const isNotificationChannel = (
  value: unknown
): value is NotificationChannel => {
  return value === 'email' || value === 'sms' || value === 'push';
};

export const isNotificationDeliveryMode = (
  value: unknown
): value is NotificationDeliveryMode => {
  return value === 'immediate' || value === 'scheduled' || value === 'batch';
};
