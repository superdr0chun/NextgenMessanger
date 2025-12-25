import api from './api';

export const postService = {
  async getPosts(page = 1, pageSize = 20, query = null) {
    const params = { page, pageSize };
    if (query) {
      params.q = query;
    }
    const response = await api.get('/posts', { params });
    return response.data;
  },

  async getPostById(postId) {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  async createPost(content, mediaUrl = null, visibility = 'Public') {
    const payload = {
      content,
      visibility,
    };
    if (mediaUrl) {
      payload.mediaUrl = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
    }
    const response = await api.post('/posts', payload);
    return response.data;
  },

  async updatePost(postId, content) {
    const response = await api.patch(`/posts/${postId}`, { content });
    return response.data;
  },

  async deletePost(postId) {
    await api.delete(`/posts/${postId}`);
  },
};

