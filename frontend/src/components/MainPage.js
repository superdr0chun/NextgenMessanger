// src/MainPage.js
import React from 'react';
import './MainPage.css';

function MainPage() {
  return (
    <div className="main-container">
      {/* ШАПКА */}
      <header className="header">
        <div className="header-left">
          <img src="/LogoNGhead.png" alt="NextGen Logo" className="logo" />
          <span className="app-name">NextGen</span>
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
        {/* 👇 ДОБАВЛЕНА ОБЁРТКА ДЛЯ ЦЕНТРИРОВАНИЯ ТРЁХ КОЛОНОК */}
        <div className="content-wrapper">
          {/* ЛЕВОЕ МЕНЮ */}
          <aside className="sidebar">
            <div className="profile">
  <div className="avatar"></div>
  <div className="profile-info">
    <div className="name">Name Profile</div> {/* ← изменили на div */}
    <div className="role">3d Designer</div> {/* ← тоже на div */}
  </div>
</div>
            <nav className="nav-menu">
              <ul>
                <li>Friends</li>
                <li>Music</li>
                <li>News Feed</li>
                <li>Chat</li>
              </ul>
            </nav>
          </aside>

          {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ */}
          <main className="central-content">
            {/* Stories */}
            <div className="stories">
              <div className="story-item">Stories</div>
              <div className="story-item">Stories</div>
              <div className="story-item">Stories</div>
              <div className="story-item">Stories</div>
              <div className="story-item new-story">+</div>
            </div>

            {/* Поиск */}
            <div className="search-bar">
              <input type="text" placeholder="Search" className="search-input" />
              <img src="/find.png" alt="Search" className="header-icon" />
            </div>

            {/* Табы */}
            <div className="tabs">
              <button className="tab active">Main</button>
              <button className="tab">Popular</button>
              <button className="tab">Music</button>
              <button className="tab">Photo</button>
            </div>

            {/* Контент */}
            <div className="content-card">
              {/* Заглушка под пост */}
            </div>
            <div className="content-card">
              {/* Заглушка под пост */}
            </div>
          </main>

          {/* ПРАВАЯ ПАНЕЛЬ */}
          <aside className="right-panel">
            {/* Пустая панель, как на макете */}
          </aside>
        </div>
        {/* 👆 ЗАКРЫТА ОБЁРТКА */}
      </div>
    </div>
  );
}

export default MainPage; 