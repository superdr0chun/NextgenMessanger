// src/components/MainPage.js
import React from 'react';
import './MainPage.css';
import { Link } from 'react-router-dom';

function MainPage() {
  return (
    <div className="main-container">
      {/* ШАПКА */}
      <header className="header">
        <div className="header-left">
          <Link to="/" className="logo-link">
            <img src="/LogoNGhead.png" alt="NextGen Logo" className="logo" />
            <span className="app-name">NextGen</span>
          </Link>
        </div>
        <div className="header-center">
          <input type="text" placeholder="Search" className="search-input" />
          <img src="/find.png" alt="Search" className="header-icon" />
        </div>
        <div className="header-right">
          <img src="/notification.png" alt="Notifications" className="header-icon" />
        </div>
      </header>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div className="main-content">
        <div className="content-wrapper">
          {/* ЛЕВОЕ МЕНЮ */}
          <aside className="sidebar">
            <div className="profile">
              <div className="avatar"></div>
              <div className="profile-info">
                <div className="name">Name Profile</div>
                <div className="role">3d Designer</div>
              </div>
            </div>
            <nav className="nav-menu">
              <ul>
                <li><Link to="#" className="nav-menu-link">Friends</Link></li>
                <li><Link to="#" className="nav-menu-link">Music</Link></li>
                <li><Link to="#" className="nav-menu-link">News Feed</Link></li>
                <li><Link to="/chat" className="nav-menu-link">Chat</Link></li>
              </ul>
            </nav>
          </aside>

          {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ */}
          <main className="central-content">
            <div className="stories">
              <div className="story-item">Stories</div>
              <div className="story-item">Stories</div>
              <div className="story-item">Stories</div>
              <div className="story-item">Stories</div>
              <div className="story-item new-story">+</div>
            </div>

            <div className="search-bar">
              <input type="text" placeholder="Search" className="search-input" />
              <img src="/find.png" alt="Search" className="header-icon" />
            </div>

            <div className="tabs">
              <button className="tab active">Main</button>
              <button className="tab">Popular</button>
              <button className="tab">Music</button>
              <button className="tab">Photo</button>
            </div>

            <div className="content-card"></div>
            <div className="content-card"></div>
          </main>

          <aside className="right-panel"></aside>
        </div>
      </div>
    </div>
  );
}

export default MainPage;