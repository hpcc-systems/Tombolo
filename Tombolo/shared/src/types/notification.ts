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
