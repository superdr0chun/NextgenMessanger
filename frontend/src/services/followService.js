import api from './api';

export const followService = {
  async followUser(userId) {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
  },

  async unfollowUser(userId) {
    await api.delete(`/users/${userId}/follow`);
  },

  async getFollowers(userId, page = 1, pageSize = 20) {
    const response = await api.get(`/users/${userId}/followers`, {
      params: { page, pageSize },
    });
    return response.data;
  },

  async getFollowing(userId, page = 1, pageSize = 20) {
    const response = await api.get(`/users/${userId}/following`, {
      params: { page, pageSize },
    });
    return response.data;
  },

  async checkIsFollowing(followerId, followeeId) {
    // Check if followerId is following followeeId
    // We'll use the following list to check
    try {
      const following = await this.getFollowing(followerId, 1, 1000);
      // Convert to strings for comparison as IDs might be in different formats
      const followeeIdStr = String(followeeId);
      return Array.isArray(following) && following.some(f => String(f.followeeId) === followeeIdStr);
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  },
};

