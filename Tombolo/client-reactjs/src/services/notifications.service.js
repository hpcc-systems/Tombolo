import { apiClient } from '@/services/api';

class NotificationsService {
  // Get all sent notifications
  async getAllSentNotifications(appId) {
    const response = await apiClient.get(`/sent_notifications/${appId}`);
    return response.data;
  }

  // Create a new notification
  async createNotification(notificationData) {
    const response = await apiClient.post('/sent_notifications', notificationData);
    return response.data;
  }

  // Delete a notification
  async deleteNotification(notificationId) {
    const response = await apiClient.delete(`/sent_notifications/${notificationId}`);
    return response.data;
  }

  // Update notification
  async updateNotification(notificationId, notificationData) {
    const response = await apiClient.put(`/sent_notifications/${notificationId}`, notificationData);
    return response.data;
  }

  // Update multiple notifications
  async updateMultipleNotifications(notificationIds, updateData) {
    const data = { ids: notificationIds, ...updateData };
    const response = await apiClient.patch('/sent_notifications', data);
    return response.data;
  }

  // Get notification HTML code
  async getNotificationHtmlCode(notificationId) {
    const response = await apiClient.post('/sent_notifications/getNotificationHtmlCode', { id: notificationId });
    return response.data;
  }

  // Get all notification templates
  async getAllNotificationTemplates() {
    const response = await apiClient.get('/notification_template');
    return response.data;
  }

  // Create notification template
  async createNotificationTemplate(templateData) {
    const response = await apiClient.post('/notification_template', templateData);
    return response.data;
  }

  // Update notification template
  async updateNotificationTemplate(templateId, templateData) {
    const response = await apiClient.put(`/notification_template/${templateId}`, templateData);
    return response.data;
  }

  // Delete notification template
  async deleteNotificationTemplate(templateId) {
    const response = await apiClient.delete(`/notification_template/${templateId}`);
    return response.data;
  }

  // Get notification template by ID
  async getNotificationTemplate(templateId) {
    const response = await apiClient.get(`/notification_template/${templateId}`);
    return response.data;
  }

  // Delete multiple notifications by IDs array
  async deleteMultipleNotifications(ids) {
    const response = await apiClient.delete('/sent_notifications', { data: { ids } });
    return response.data;
  }
}

export default new NotificationsService();
