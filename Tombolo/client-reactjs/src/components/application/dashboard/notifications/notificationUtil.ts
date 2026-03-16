import notificationsService from '@/services/notifications.service';
import asrService from '@/services/asr.service';
import monitoringTypeService from '@/services/monitoringType.service';

export const getAllSentNotifications = async ({ applicationId }: { applicationId: any }) => {
  return await notificationsService.getAllSentNotifications(applicationId);
};

export const deleteNotification = async (id: any) => {
  await notificationsService.deleteNotification(id);
  return true;
};

export const deleteMultipleNotifications = async (ids: any[]) => {
  await notificationsService.deleteMultipleNotifications(ids);
  return true;
};

export const createNotification = async ({ notificationPayload }: { notificationPayload: any }) => {
  return await notificationsService.createNotification(notificationPayload);
};

export const updateMultipleNotifications = async ({ data }: { data: any }) => {
  const { ids, ...updateData } = data;
  return await notificationsService.updateMultipleNotifications(ids, updateData);
};

export const statuses = [
  'Investigating',
  'Re-opened',
  'Triage',
  'Pending Review',
  'On hold',
  'Resolved',
  'Non-actionable',
  'Non-issue',
];

export const monitoringTypeId = async ({ monitoringName }: { monitoringName: string }) => {
  return await monitoringTypeService.getId({ monitoringTypeName: monitoringName });
};

export const getAllDomains = async () => {
  return await asrService.getAllDomains();
};

export const getDomains = async ({ monitoringId }: { monitoringId: any }) => {
  return await asrService.getDomains({ monitoringTypeId: monitoringId });
};

export const getProductCategories = async ({ domainId }: { domainId: any }) => {
  return await asrService.getProductCategories({ domainId });
};

export const getAllProductCategories = async () => {
  return await asrService.getAllProductCategories();
};

export const getAllMonitorings = async () => {
  return await monitoringTypeService.getAll();
};

export const getActivityTypes = async () => {
  return [];
};

export const getNotificationHtmlCode = async (id: any) => {
  return await notificationsService.getNotificationHtmlCode(id);
};
