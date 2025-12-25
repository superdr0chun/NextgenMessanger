import api from './api';

export const userService = {
  async searchUsers(query, page = 1, pageSize = 20) {
    const response = await api.get('/users', {
      params: {
        q: query,
        page,
        pageSize,
      },
    });
    return response.data;
  },

  async getUserById(userId) {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
};

