// src/components/ChatPage.js
import React, { useState } from 'react';
import './ChatPage.css';
import { Link } from 'react-router-dom';

const ChatPage = () => {
  const [activeChat, setActiveChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      {/* HEADER */}
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

      {/* Main Container */}
      <div className="container">
        {/* Sidebar + Chat List */}
        <div className="left-content">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="user-profile">
              <a href="/profile" className="profile-link">
                <div className="avatar"></div>
                <div>
                  <div className="name">Name Profile</div>
                  <div className="status">3D Designer</div>
                </div>
              </a>
            </div>
            <nav className="nav-menu">
              <ul>
                <li><div className="nav-menu-link">Friends</div></li>
                <li><div className="nav-menu-link">Music</div></li>
                <li><div className="nav-menu-link">News Feed</div></li>
                <li><div className="nav-menu-link active">Chat</div></li>
              </ul>
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
        </div>

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
    </div>
  );
};

export default ChatPage;