import api from './api';

export const notificationService = {
  async getNotifications(page = 1, pageSize = 20) {
    const response = await api.get('/notifications', {
      params: { page, pageSize },
    });
    return response.data;
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count/new_message');
    return response.data.count || 0;
  },

  async markAsRead(notificationId) {
    await api.post(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead() {
    await api.post('/notifications/read-all');
  },
};

