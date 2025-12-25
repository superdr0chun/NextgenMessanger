// src/components/ChatPage.js
import React, { useState, useRef, useEffect } from 'react';
import './ChatPage.css';
import { Link, useNavigate } from 'react-router-dom';
import './MainPage.css';

const ChatPage = () => {
  const navigate = useNavigate();
  const [activeChat, setActiveChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  const mockChats = [
    { id: 1, name: 'Alex Johnson', lastMessage: 'Hey, how are you?' },
    { id: 2, name: 'Maria Garcia', lastMessage: 'See you tomorrow!' },
    { id: 3, name: 'Team Project', lastMessage: 'New task added' },
    { id: 4, name: 'Support', lastMessage: 'Your ticket is resolved' },
    { id: 5, name: 'John Doe', lastMessage: 'Thanks for the help!' },
    { id: 6, name: 'Design Group', lastMessage: 'Check the new mockups' },
    { id: 7, name: 'Sergey Ivanov', lastMessage: 'Hello!' },
    { id: 8, name: 'Anna Smith', lastMessage: 'Meeting at 5 PM' },
  ];

  const filteredChats = mockChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatClick = (chat) => {
    setActiveChat(chat);
  };

  return (
    <div className="chat-page">
      {/* HEADER - как в MainPage */}
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

      {/* Sidebar - как в MainPage */}
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
          <div className="sidebar-nav-link active">Сообщения</div>
        </nav>
      </aside>

      {/* Chat List */}
      <main className="chat-list-section">
            <div className="search-header">
              <input
                type="text"
                placeholder="Search chats..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button>+</button>
            </div>
            <div className="chat-items">
              {filteredChats.length > 0 ? (
                filteredChats.map(chat => (
                  <div
                    key={chat.id}
                    className="chat-item"
                    onClick={() => handleChatClick(chat)}
                  >
                    <div className="avatar"></div>
                    <div className="chat-info">
                      <div className="name">{chat.name}</div>
                      <div className="message">{chat.lastMessage}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-chats">No chats found</div>
              )}
            </div>
      </main>

      {/* Placeholder или чат */}
        {activeChat ? (
          <section className="chat-area">
            <div className="chat-area-header">
              {/* ✅ Кнопка закрытия УДАЛЕНА */}
              <div className="chat-title">{activeChat.name}</div>
              <div className="participants">3 participants</div>
              <div className="options">⋯</div>
            </div>
            <div className="messages">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="message-bubble">
                  <div className="avatar"></div>
                  <div className="message-content">
                    <div className="sender">Name Profile</div>
                    <div className="text">Message</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="input-area">
              <button className="emoji-button">😊</button>
              <input type="text" placeholder="Text a message..." />
              <button className="attach-button">📎</button>
            </div>
          </section>
        ) : (
          <section className="chat-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">💬</div>
              <h2>Выберите чат</h2>
              <p>Начните общение, выбрав один из чатов слева</p>
            </div>
          </section>
        )}
    </div>
  );
};

export default ChatPage;