import api from './api';

export const reactionService = {
  async likePost(postId) {
    const response = await api.post(`/posts/${postId}/reactions`, {
      type: 'Like'
    });
    return response.data;
  },

  async unlikePost(postId) {
    await api.delete(`/posts/${postId}/reactions`);
  },

  async getReactions(postId) {
    const response = await api.get(`/posts/${postId}/reactions`);
    return response.data;
  },

  // Toggle like - if liked, unlike; if not liked, like
  async toggleLike(postId, isCurrentlyLiked) {
    if (isCurrentlyLiked) {
      await this.unlikePost(postId);
      return false;
    } else {
      await this.likePost(postId);
      return true;
    }
  }
};

