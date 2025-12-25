import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ProfilePage.css';
import './MainPage.css';

function ProfilePage() {
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
    <div className="profile-page">
      <header className="main-header">
        <div className="header-logo">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img src="/LogoNGhead.png" alt="NextGen Logo" className="logo-img" />
            <span className="logo-text">Nextgen</span>
          </Link>
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
          <Link to="/" className="sidebar-nav-link">Лента</Link>
          <Link to="/chat" className="sidebar-nav-link">Сообщения</Link>
        </nav>
      </aside>

      <main className="profile-content">
        <div className="profile-main-block">
          <div className="profile-main-left">
            <img src="/images/authimage.png" alt="Profile Avatar" className="profile-main-avatar" />
            <div className="profile-main-info">
              <div className="profile-main-name">Марина Лазарева</div>
              <div className="profile-main-username">@Lazerina3D</div>
              <div className="profile-main-bio">Создаю 3D-миры и дизайн. Люблю играть с текстурами.</div>
              <div className="profile-main-contact">Контакт: marinadesign@gmail.com</div>
            </div>
          </div>
          <div className="profile-main-stats">
            <div className="profile-stat-item">
              <div className="profile-stat-number">14</div>
              <div className="profile-stat-label">Публикации</div>
            </div>
            <div className="profile-stat-item">
              <div className="profile-stat-number">92</div>
              <div className="profile-stat-label">Подписчики</div>
            </div>
            <div className="profile-stat-item">
              <div className="profile-stat-number">37</div>
              <div className="profile-stat-label">Подписки</div>
            </div>
          </div>
        </div>
        
        <div className="profile-posts-block">
          <h2 className="profile-posts-title">Публикации</h2>
          {/* Публикации пользователя будут добавлены позже */}
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;

