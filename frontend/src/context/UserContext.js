import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  // Load user from localStorage immediately for instant display
  const [user, setUser] = useState(() => {
    if (authService.isAuthenticated()) {
      return authService.getUserFromStorage();
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (authService.isAuthenticated()) {
        try {
          // Update user data from API (may have changed)
          const userData = await authService.getCurrentUser();
          setUser(userData);
          authService.saveUserToStorage(userData);
        } catch (error) {
          console.error('Error loading user:', error);
          // If token is invalid, clear it
          if (error.response?.status === 401) {
            authService.logout();
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const updateUser = (userData) => {
    setUser(userData);
    if (userData) {
      authService.saveUserToStorage(userData);
    }
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('userData');
  };

  return (
    <UserContext.Provider value={{ user, loading, updateUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

