import api from './api';

export const commentService = {
  async getComments(postId, page = 1, pageSize = 20) {
    const response = await api.get(`/posts/${postId}/comments`, {
      params: { page, pageSize }
    });
    return response.data;
  },

  async createComment(postId, content) {
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return response.data;
  },

  async deleteComment(postId, commentId) {
    await api.delete(`/posts/${postId}/comments/${commentId}`);
  }
};

