export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5002/api';
export const STATIC_BASE_URL = process.env.REACT_APP_STATIC_BASE_URL || 'http://localhost:5002';

export const POLLING_INTERVALS = {
  UNREAD_MESSAGES: 5000,
  MESSAGES: 3000,
};

export const CACHE_TIMEOUTS = {
  USER_PROFILE: 30000,
};

