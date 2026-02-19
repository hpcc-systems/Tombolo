import { apiClient } from '@/services/api';
import type { NotificationDTO } from '@tombolo/shared';

class NotificationsService {
  async getAllSentNotifications(appId: string): Promise<NotificationDTO[]> {
    const response = await apiClient.get(`/sent_notifications/${appId}`);
    return response.data;
  }

  async createNotification(notificationData: any): Promise<NotificationDTO> {
    const response = await apiClient.post('/sent_notifications', notificationData);
    return response.data;
  }

  async deleteNotification(notificationId: string): Promise<any> {
    const response = await apiClient.delete(`/sent_notifications/${notificationId}`);
    return response.data;
  }

  async updateNotification(notificationId: string, notificationData: any): Promise<NotificationDTO> {
    const response = await apiClient.put(`/sent_notifications/${notificationId}`, notificationData);
    return response.data;
  }

  async updateMultipleNotifications(notificationIds: string[], updateData: any): Promise<any> {
    const data = { ids: notificationIds, ...updateData };
    const response = await apiClient.patch('/sent_notifications', data);
    return response.data;
  }

  async getNotificationHtmlCode(notificationId: string): Promise<any> {
    const response = await apiClient.post('/sent_notifications/getNotificationHtmlCode', { id: notificationId });
    return response.data;
  }

  async getAllNotificationTemplates(): Promise<any[]> {
    const response = await apiClient.get('/notification_template');
    return response.data;
  }

  async createNotificationTemplate(templateData: any): Promise<any> {
    const response = await apiClient.post('/notification_template', templateData);
    return response.data;
  }

  async updateNotificationTemplate(templateId: string, templateData: any): Promise<any> {
    const response = await apiClient.put(`/notification_template/${templateId}`, templateData);
    return response.data;
  }

  async deleteNotificationTemplate(templateId: string): Promise<any> {
    const response = await apiClient.delete(`/notification_template/${templateId}`);
    return response.data;
  }

  async getNotificationTemplate(templateId: string): Promise<any> {
    const response = await apiClient.get(`/notification_template/${templateId}`);
    return response.data;
  }

  async deleteMultipleNotifications(ids: string[]): Promise<any> {
    const response = await apiClient.delete('/sent_notifications', { data: { ids } });
    return response.data;
  }
}

export default new NotificationsService();
