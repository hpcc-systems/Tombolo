// Import services instead of using fetch
import notificationsService from '@/services/notifications.service';
import asrService from '@/services/asr.service';
import monitoringTypeService from '@/services/monitoringType.service';

// Function to get all sent notifications
export const getAllSentNotifications = async ({ applicationId }) => {
  return await notificationsService.getAllSentNotifications(applicationId);
};

// Function to delete a single notification
export const deleteNotification = async (id) => {
  await notificationsService.deleteNotification(id);
  return true;
};

// Function to delete multiple notifications - send ids as array in req.body
export const deleteMultipleNotifications = async (ids) => {
  await notificationsService.deleteMultipleNotifications(ids);
  return true;
};

// Function to create a new notification
export const createNotification = async ({ notificationPayload }) => {
  return await notificationsService.createNotification(notificationPayload);
};

//Function to update multiple notifications - send ids as array in req.body
export const updateMultipleNotifications = async ({ data }) => {
  const { ids, ...updateData } = data;
  return await notificationsService.updateMultipleNotifications(ids, updateData);
};

// Statuses for the notification
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
//Get monitoring ID - aka activity type if
export const monitoringTypeId = async ({ monitoringName }) => {
  return await monitoringTypeService.getId({ monitoringTypeName: monitoringName });
};

// Get all domains
export const getAllDomains = async () => {
  return await asrService.getAllDomains();
};

// Get all domains for a specific monitoring
export const getDomains = async ({ monitoringId }) => {
  return await asrService.getDomains({ monitoringTypeId: monitoringId });
};

// Get all product categories for a domain
export const getProductCategories = async ({ domainId }) => {
  return await asrService.getProductCategories({ domainId });
};

// Get all product categories regardless of domain
export const getAllProductCategories = async () => {
  return await asrService.getAllProductCategories();
};

// Get all monitorings
export const getAllMonitorings = async () => {
  return await monitoringTypeService.getAll();
};

export const getActivityTypes = async () => {
  return [];
};

// Get notification HTML code
export const getNotificationHtmlCode = async (id) => {
  return await notificationsService.getNotificationHtmlCode(id);
};
