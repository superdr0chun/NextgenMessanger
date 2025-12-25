import api from './api';

export const notificationService = {
  async getNotifications(page = 1, pageSize = 20) {
    const response = await api.get('/notifications', {
      params: { page, pageSize },
    });
    return response.data;
  },

  async getUnreadMessagesCount() {
    const response = await api.get('/notifications/unread-count/new_message');
    return response.data.count || 0;
  },

  // For backwards compatibility
  async getUnreadCount() {
    return this.getUnreadMessagesCount();
  },

  async getTotalUnreadCount() {
    // Get notifications to get total unread count
    const response = await api.get('/notifications', {
      params: { page: 1, pageSize: 1 },
    });
    return response.data.unreadCount || 0;
  },

  async getFollowerNotificationsCount() {
    const response = await api.get('/notifications/unread-count/new_follower');
    return response.data.count || 0;
  },

  async markAsRead(notificationId) {
    await api.post(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead() {
    await api.post('/notifications/read-all');
  },
};

