import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './MainPage.css';

function MainPage() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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

  const handleAvatarClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    // TODO: Add API call to logout endpoint
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/auth');
  };

  return (
    <div className="main-page">
      <header className="main-header">
        <div className="header-logo">
          <img src="/LogoNGhead.png" alt="NextGen Logo" className="logo-img" />
          <span className="logo-text">Nextgen</span>
        </div>
        
        <div className="header-search">
          <input type="text" placeholder="Найти" className="header-search-input" />
          <img src="/search-alt.png" alt="Search" className="header-search-icon" />
        </div>
        
        <img src="/notifications.png" alt="Notifications" className="header-notifications-icon" />
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
      </header>
      
      <aside className="main-sidebar">
        <Link to="/profile" className="sidebar-profile">
          <img src="/images/authimage.png" alt="Avatar" className="sidebar-avatar" />
          <div className="sidebar-profile-info">
            <div className="sidebar-profile-name">Марина Лазарева</div>
            <div className="sidebar-profile-role">3d Designer</div>
          </div>
        </Link>
        
        <nav className="sidebar-nav">
          <div className="sidebar-nav-link">Друзья</div>
          <div className="sidebar-nav-link">Музыка</div>
          <div className="sidebar-nav-link active">Лента</div>
          <Link to="/chat" className="sidebar-nav-link">Сообщения</Link>
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

