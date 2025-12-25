import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import './UserSearch.css';

const UserSearch = ({ searchQuery, onClose, searchInputRef }) => {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        console.log('Searching for:', searchQuery);
        const results = await userService.searchUsers(searchQuery);
        console.log('Search results:', results);
        setSearchResults(results || []);
      } catch (error) {
        console.error('Search error:', error);
        console.error('Error response:', error.response);
        console.error('Error message:', error.message);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && 
          !dropdownRef.current.contains(event.target) &&
          searchInputRef?.current && 
          !searchInputRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, searchInputRef]);

  const handleUserClick = (userId) => {
    console.log('User clicked, userId:', userId);
    navigate(`/profile/${userId}`);
    onClose();
  };

  if (!searchQuery || searchQuery.trim().length < 2) {
    return null;
  }

  return (
    <div className="user-search-dropdown" ref={dropdownRef}>
      {loading && (
        <div className="user-search-loading">Поиск...</div>
      )}

      {!loading && searchResults.length === 0 && (
        <div className="user-search-empty">Пользователи не найдены</div>
      )}

      {!loading && searchResults.length > 0 && (
        <div className="user-search-results">
          {searchResults.map((user) => {
            // Handle both camelCase (id) and PascalCase (Id) from API
            const userId = user.id || user.Id;
            console.log('Rendering user:', user, 'userId:', userId);
            return (
            <div
              key={userId}
              className="user-search-result-item"
              onClick={() => handleUserClick(userId)}
            >
              <img
                src={user.avatarUrl || '/images/authimage.png'}
                alt={user.fullName || user.username}
                className="user-search-avatar"
              />
              <div className="user-search-result-info">
                <div className="user-search-result-name">
                  {user.fullName || user.username}
                </div>
                <div className="user-search-result-username">
                  @{user.username}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserSearch;

