import api from './api';

export const authService = {
  async register(email, username, password, fullName = null) {
    const response = await api.post('/auth/register', {
      email,
      username,
      password,
      fullName,
    });
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    
    // Save tokens to localStorage
    if (response.data.accessToken && response.data.refreshToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    
    // Load and save user data immediately
    try {
      const userData = await this.getCurrentUser();
      localStorage.setItem('userData', JSON.stringify(userData));
      return { ...response.data, user: userData };
    } catch (error) {
      console.error('Error loading user data after login:', error);
      return response.data;
    }
  },

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  },

  getUserFromStorage() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  saveUserToStorage(userData) {
    localStorage.setItem('userData', JSON.stringify(userData));
  },
};

