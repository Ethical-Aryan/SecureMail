import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const notificationService = {
  async registerPushToken(pushToken, platform) {
    const response = await api.post(API_ENDPOINTS.MOBILE.REGISTER_PUSH_TOKEN, {
      push_token: pushToken,
      platform: platform || 'unknown',
    });
    return response.data;
  },

  async removePushToken(pushToken) {
    const response = await api.post(API_ENDPOINTS.MOBILE.REMOVE_PUSH_TOKEN, {
      push_token: pushToken,
    });
    return response.data;
  },

  async fetchNotifications() {
    const response = await api.get(API_ENDPOINTS.MOBILE.NOTIFICATIONS);
    return response.data; // { notifications: [...], unread_count: X }
  },

  async markAsRead(notificationId = null) {
    const response = await api.put(API_ENDPOINTS.MOBILE.MARK_READ, {
      notification_id: notificationId,
    });
    return response.data;
  },

  async deleteNotification(notificationId) {
    const response = await api.delete(API_ENDPOINTS.MOBILE.DELETE_NOTIFICATION(notificationId));
    return response.data;
  },

  async sendTestNotification() {
    const response = await api.post(API_ENDPOINTS.MOBILE.TEST_NOTIFICATION);
    return response.data;
  },
};

export default notificationService;
