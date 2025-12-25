import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './MainPage.css';
import { authService } from '../services/authService';
import { useUser } from '../context/UserContext';
import UserSearch from './UserSearch';
import { notificationService } from '../services/notificationService';

function MainPage() {
  const navigate = useNavigate();
  const { user, clearUser } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load unread messages count
  useEffect(() => {
    if (!authService.isAuthenticated()) return;
    
    const loadUnreadCount = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadMessagesCount(count);
      } catch (error) {
        console.error('Error loading unread messages count:', error);
      }
    };

    loadUnreadCount();
    // Refresh every 5 seconds
    const interval = setInterval(loadUnreadCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAvatarClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = async () => {
    await authService.logout();
    clearUser();
    navigate('/auth');
  };

  return (
    <div className="main-page">
      <header className="main-header">
        <div className="header-logo">
          <img src="/LogoNGhead.png" alt="NextGen Logo" className="logo-img" />
          <span className="logo-text">Nextgen</span>
        </div>
        
        <div className="header-search-container" ref={searchContainerRef}>
          <div className="header-search">
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Найти" 
              className="header-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <img src="/search-alt.png" alt="Search" className="header-search-icon" />
          </div>
          {searchQuery.trim().length >= 2 && (
            <UserSearch 
              searchQuery={searchQuery} 
              onClose={() => setSearchQuery('')}
              searchInputRef={searchInputRef}
            />
          )}
        </div>
        
        <img src="/notifications.png" alt="Notifications" className="header-notifications-icon" />
        {authService.isAuthenticated() ? (
          <div className="header-user-profile" ref={dropdownRef}>
            <img 
              src="/images/authimage.png" 
              alt="User Avatar" 
              className="header-user-avatar" 
              onClick={handleAvatarClick}
            />
            {showDropdown && (
              <div className="header-dropdown-menu">
                <button className="header-dropdown-item" onClick={handleLogout}>
                  Выйти
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="header-auth-buttons">
            <Link to="/auth" className="header-auth-btn header-auth-btn-login">
              Войти
            </Link>
            <Link to="/auth?mode=register" className="header-auth-btn header-auth-btn-register">
              Регистрация
            </Link>
          </div>
        )}
      </header>
      
      <aside className="main-sidebar">
        <Link to="/profile" className="sidebar-profile">
          <img src="/images/authimage.png" alt="Avatar" className="sidebar-avatar" />
          <div className="sidebar-profile-info">
            <div className="sidebar-profile-name">{user?.fullName || user?.username || 'Пользователь'}</div>
            <div className="sidebar-profile-role">{user?.username || ''}</div>
          </div>
        </Link>
        
        <nav className="sidebar-nav">
          <div className="sidebar-nav-link">Друзья</div>
          <div className="sidebar-nav-link">Музыка</div>
          <div className="sidebar-nav-link active">Лента</div>
          <Link to="/chat" className="sidebar-nav-link">
            Сообщения
            {unreadMessagesCount > 0 && (
              <span className="unread-messages-badge">{unreadMessagesCount}</span>
            )}
          </Link>
        </nav>
      </aside>
      
      <section className="recent-chats-section">
        <div className="recent-chats-container">
          <div className="recent-chat-item">
            <div className="recent-chat-avatar"></div>
            <div className="recent-chat-name">Chat 1</div>
          </div>
          <div className="recent-chat-item">
            <div className="recent-chat-avatar"></div>
            <div className="recent-chat-name">Chat 2</div>
          </div>
          <div className="recent-chat-item">
            <div className="recent-chat-avatar"></div>
            <div className="recent-chat-name">Chat 3</div>
          </div>
        </div>
      </section>
      
      <section className="posts-feed">
        <div className="posts-container">
          <div className="post-card">
            <div className="post-header">
              <img src="/images/authimage.png" alt="User Avatar" className="post-avatar" />
              <div className="post-author-name">Имя Фамилия</div>
            </div>
            <div className="post-content">
              <img src="/postimage.png" alt="Post" className="post-image" />
              <div className="post-text">
                Новый мерч от Nextgen уже в продаже! Вырази свой стиль и покажи свою принадлежность к современной молодёжи. Специальные дизайны и качество — делай свой образ ярким и уникальным!
              </div>
            </div>
            <div className="post-actions">
              <img src="/like.png" alt="Like" className="post-action-icon" />
              <img src="/comment.png" alt="Comment" className="post-action-icon" />
              <img src="/important.png" alt="Bookmark" className="post-action-icon" />
            </div>
          </div>
          
          <div className="post-card">
            <div className="post-header">
              <img src="/images/authimage.png" alt="User Avatar" className="post-avatar" />
              <div className="post-author-name">Имя Фамилия</div>
            </div>
            <div className="post-content">
              <img src="/postimage.png" alt="Post" className="post-image" />
              <div className="post-text">
                Новый мерч от Nextgen уже в продаже! Вырази свой стиль и покажи свою принадлежность к современной молодёжи. Специальные дизайны и качество — делай свой образ ярким и уникальным!
              </div>
            </div>
            <div className="post-actions">
              <img src="/like.png" alt="Like" className="post-action-icon" />
              <img src="/comment.png" alt="Comment" className="post-action-icon" />
              <img src="/important.png" alt="Bookmark" className="post-action-icon" />
            </div>
          </div>
        </div>
      </section>
      
      <aside className="main-content-block">
        {/* Контент будет добавлен позже */}
      </aside>
    </div>
  );
}

export default MainPage;

