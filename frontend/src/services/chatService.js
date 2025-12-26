import api from './api';

export const chatService = {
  async getChats() {
    const response = await api.get('/chats');
    return response.data;
  },

  async getChatById(chatId) {
    const response = await api.get(`/chats/${chatId}`);
    return response.data;
  },

  async getMessages(chatId, page = 1, pageSize = 50, before = null) {
    const params = { page, pageSize };
    if (before) {
      params.before = before;
    }
    const response = await api.get(`/chats/${chatId}/messages`, { params });
    return response.data;
  },

  async sendMessage(chatId, content, mediaUrl = null) {
    const response = await api.post(`/chats/${chatId}/messages`, {
      content,
      mediaUrl: mediaUrl ? [mediaUrl] : null,
    });
    return response.data;
  },

  async createChat(participantIds, type = 'Direct', title = null) {
    // Ensure participantIds is an array and convert to proper format
    const participantIdsArray = Array.isArray(participantIds) ? participantIds : [participantIds];
    
    // Convert type to proper case for enum (first letter uppercase, rest lowercase)
    const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    
    const payload = {
      type: typeCapitalized, // ASP.NET Core expects enum name like "Direct", not "direct"
      participantIds: participantIdsArray,
    };
    
    if (title) {
      payload.title = title;
    }
    
    console.log('Creating chat with payload:', JSON.stringify(payload, null, 2));
    console.log('Participant IDs:', participantIdsArray);
    console.log('Participant ID types:', participantIdsArray.map(id => typeof id));
    
    try {
      const response = await api.post('/chats', payload);
      return response.data;
    } catch (error) {
      console.error('Error in createChat API call:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      throw error;
    }
  },

  async markAsRead(chatId) {
    await api.post(`/chats/${chatId}/read`);
  },

  async deleteChat(chatId, forEveryone = false) {
    await api.delete(`/chats/${chatId}`, {
      params: { forEveryone }
    });
  },

  // Pinned chats are stored locally
  getPinnedChats() {
    const pinned = localStorage.getItem('pinnedChats');
    return pinned ? JSON.parse(pinned) : [];
  },

  pinChat(chatId) {
    const pinned = this.getPinnedChats();
    if (!pinned.includes(chatId)) {
      pinned.push(chatId);
      localStorage.setItem('pinnedChats', JSON.stringify(pinned));
    }
  },

  unpinChat(chatId) {
    const pinned = this.getPinnedChats();
    const newPinned = pinned.filter(id => id !== chatId);
    localStorage.setItem('pinnedChats', JSON.stringify(newPinned));
  },

  isPinned(chatId) {
    return this.getPinnedChats().includes(chatId);
  },
};

