// src/components/ProfilePage.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('publications');
  const location = useLocation();

  const publications = [
    { id: 1, title: 'Project A', desc: 'Description of project A' },
    { id: 2, title: 'Project B', desc: 'Description of project B' },
    { id: 3, title: 'Project C', desc: 'Description of project C' },
    { id: 4, title: 'Project D', desc: 'Description of project D' },
  ];

  const friends = [
    { id: 1, name: 'Alex Johnson', avatar: '' },
    { id: 2, name: 'Maria Garcia', avatar: '' },
    { id: 3, name: 'John Doe', avatar: '' },
    { id: 4, name: 'Sarah Lee', avatar: '' },
  ];

  const photos = [
    { id: 1, url: '' },
    { id: 2, url: '' },
    { id: 3, url: '' },
    { id: 4, url: '' },
    { id: 5, url: '' },
    { id: 6, url: '' },
  ];

  const videos = [
    { id: 1, url: '' },
    { id: 2, url: '' },
    { id: 3, url: '' },
    { id: 4, url: '' },
    { id: 5, url: '' },
    { id: 6, url: '' },
  ];

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <Link to="/" className="logo-link">
            <img src="/LogoNGhead.png" alt="NextGen Logo" className="logo" />
            <span className="app-name">Nextgen</span>
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

      {/* Main Container */}
      <div className="container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className={`user-profile ${location.pathname === '/profile' ? 'active' : ''}`}>
            <Link to="/profile" className="profile-link">
              <div className="avatar"></div>
              <div>
                <div className="name">Name Profile</div>
                <div className="status">3D Designer</div>
              </div>
            </Link>
          </div>

          <nav className="nav-menu">
            <ul>
              <li><Link to="/profile" className="nav-menu-link">Friends</Link></li>
              <li><Link to="#" className="nav-menu-link">Music</Link></li>
              <li><Link to="#" className="nav-menu-link">News Feed</Link></li>
              <li><Link to="/chat" className="nav-menu-link">Chat</Link></li>
            </ul>
          </nav>
        </aside>

        {/* Profile Content */}
        <main className="profile-content">
          <div className="profile-header">
            <div className="avatar-large"></div>
            <div className="profile-info">
              <h1>Name Profile</h1>
              <p>@user</p>
              <div className="description">
                Discription • Discription<br/>
                Discription • Discription
              </div>
              <div className="stats">
                <div className="stat-item">
                  <div className="circle">○</div>
                  <span>publications</span>
                </div>
                <div className="stat-item">
                  <div className="circle">○</div>
                  <span>subscribers</span>
                </div>
                <div className="stat-item">
                  <div className="circle">○</div>
                  <span>subscriptions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'publications' ? 'active' : ''}`}
              onClick={() => setActiveTab('publications')}
            >
              Publications
            </button>
            <button
              className={`tab ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              About me
            </button>
            <button
              className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              Friends
            </button>
            <button
              className={`tab ${activeTab === 'photo' ? 'active' : ''}`}
              onClick={() => setActiveTab('photo')}
            >
              Photo
            </button>
            <button
              className={`tab ${activeTab === 'video' ? 'active' : ''}`}
              onClick={() => setActiveTab('video')}
            >
              Video
            </button>
          </div>

          {/* Tab Content — без изменений */}
          <div className="tab-content-wrapper">
            {activeTab === 'publications' && (
              <div className="publications-grid">
                {publications.map(pub => (
                  <div key={pub.id} className="publication-card">
                    <div className="card-title">{pub.title}</div>
                    <div className="card-desc">{pub.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="about-section">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                </p>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                </p>
              </div>
            )}

            {activeTab === 'friends' && (
              <div className="friends-list">
                {friends.map(friend => (
                  <div key={friend.id} className="friend-item">
                    <div className="avatar-small"></div>
                    <div className="friend-name">{friend.name}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'photo' && (
              <div className="photos-grid">
                {photos.map(photo => (
                  <div key={photo.id} className="photo-item">
                    <div className="photo-placeholder"></div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'video' && (
              <div className="videos-grid">
                {videos.map(video => (
                  <div key={video.id} className="video-item">
                    <div className="video-placeholder"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;