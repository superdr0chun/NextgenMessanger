// src/components/ChatPage.js
import React, { useState, useRef, useEffect } from 'react';
import './ChatPage.css';
import { Link, useNavigate } from 'react-router-dom';
import './MainPage.css';
import { authService } from '../services/authService';
import { useUser } from '../context/UserContext';
import UserSearch from './UserSearch';
import { chatService } from '../services/chatService';
import { followService } from '../services/followService';
import { notificationService } from '../services/notificationService';

const ChatPage = () => {
  const navigate = useNavigate();
  const { user, clearUser } = useUser();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [followersAndFollowing, setFollowersAndFollowing] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

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

  useEffect(() => {
    const loadChats = async () => {
      setLoading(true);
      try {
        const chatsData = await chatService.getChats();
        console.log('Loaded chats:', chatsData);
        if (chatsData && chatsData.length > 0) {
          console.log('First chat example:', chatsData[0]);
        }
        setChats(chatsData);
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, []);

  // Load followers and following for search
  useEffect(() => {
    const loadContacts = async () => {
      if (!user?.id) return;
      
      setLoadingContacts(true);
      try {
        // Load both followers and following
        const [followers, following] = await Promise.all([
          followService.getFollowers(user.id, 1, 1000),
          followService.getFollowing(user.id, 1, 1000),
        ]);

        // Combine and deduplicate by userId
        const allContacts = new Map();
        
        // Add followers (users who follow us)
        if (Array.isArray(followers)) {
          followers.forEach(f => {
            if (f.followerId && f.followerId !== user.id) {
              allContacts.set(f.followerId, {
                id: f.followerId,
                username: f.followerUsername || '',
                fullName: f.followerUsername || '', // FollowDto doesn't have fullName, using username
                avatarUrl: f.followerAvatarUrl || null,
              });
            }
          });
        }

        // Add following (users we follow)
        if (Array.isArray(following)) {
          following.forEach(f => {
            if (f.followeeId && f.followeeId !== user.id) {
              allContacts.set(f.followeeId, {
                id: f.followeeId,
                username: f.followeeUsername || '',
                fullName: f.followeeUsername || '', // FollowDto doesn't have fullName, using username
                avatarUrl: f.followeeAvatarUrl || null,
              });
            }
          });
        }

        setFollowersAndFollowing(Array.from(allContacts.values()));
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        setLoadingContacts(false);
      }
    };

    loadContacts();
  }, [user?.id]);

  // Load unread messages count
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!user?.id) return;
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
  }, [user?.id]);

  useEffect(() => {
    if (activeChat?.id) {
      const loadMessages = async () => {
        setMessagesLoading(true);
        try {
          const messagesData = await chatService.getMessages(activeChat.id);
          // Sort messages by time ascending (oldest first, newest last at bottom)
          const sortedMessages = Array.isArray(messagesData) 
            ? [...messagesData].sort((a, b) => new Date(a.sentAt || a.createdAt) - new Date(b.sentAt || b.createdAt))
            : [];
          setMessages(sortedMessages);
          
          // Mark message notifications as read when opening chat
          try {
            await notificationService.markAllAsRead();
            setUnreadMessagesCount(0);
            // Reload unread count to get updated value
            const count = await notificationService.getUnreadCount();
            setUnreadMessagesCount(count);
          } catch (error) {
            console.error('Error marking notifications as read:', error);
          }
        } catch (error) {
          console.error('Error loading messages:', error);
          setMessages([]);
        } finally {
          setMessagesLoading(false);
        }
      };

      loadMessages();
      
      // Poll for new messages every 3 seconds
      const pollMessages = setInterval(async () => {
        try {
          const messagesData = await chatService.getMessages(activeChat.id);
          const sortedMessages = Array.isArray(messagesData) 
            ? [...messagesData].sort((a, b) => new Date(a.sentAt || a.createdAt) - new Date(b.sentAt || b.createdAt))
            : [];
          setMessages(sortedMessages);
        } catch (error) {
          console.error('Error polling messages:', error);
        }
      }, 3000);
      
      return () => clearInterval(pollMessages);
    } else {
      setMessages([]);
    }
  }, [activeChat?.id]); // Only reload when chat ID changes

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAvatarClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = async () => {
    await authService.logout();
    clearUser();
    navigate('/auth');
  };

  // Helper function to get chat display name
  const getChatDisplayName = (chat) => {
    if (chat.title) {
      return chat.title;
    }
    // For direct chats, show the other participant's name
    if ((chat.type === 'Direct' || chat.type === 'direct') && chat.participants) {
      const otherParticipant = chat.participants.find(p => p.userId !== user?.id);
      if (otherParticipant) {
        return otherParticipant.username;
      }
    }
    return 'Chat';
  };

  // Helper function to get chat avatar
  const getChatAvatar = (chat) => {
    if ((chat.type === 'Direct' || chat.type === 'direct') && chat.participants) {
      const otherParticipant = chat.participants.find(p => p.userId !== user?.id);
      if (otherParticipant?.avatarUrl) {
        return otherParticipant.avatarUrl;
      }
    }
    return null;
  };

  // Helper function to get last message with truncation
  const getLastMessage = (chat, maxLength = 50) => {
    // Try both camelCase and PascalCase property names (API might return either)
    const lastMessageContent = chat.lastMessageContent || chat.LastMessageContent;
    const lastMessageSenderId = chat.lastMessageSenderId || chat.LastMessageSenderId;
    
    if (lastMessageContent) {
      // Check if the last message is from current user
      const isFromCurrentUser = lastMessageSenderId && user?.id && 
        (lastMessageSenderId === user.id || 
         lastMessageSenderId.toString() === user.id.toString() ||
         String(lastMessageSenderId) === String(user.id));
      
      let messageText = lastMessageContent;
      if (messageText.length > maxLength) {
        messageText = messageText.substring(0, maxLength) + '...';
      }
      
      // Add "Вы: " prefix if message is from current user
      if (isFromCurrentUser) {
        return `Вы: ${messageText}`;
      }
      
      return messageText;
    }
    return 'Нет сообщений';
  };

  const filteredChats = chats.filter(chat => {
    const name = getChatDisplayName(chat).toLowerCase();
    return name.includes(chatSearchQuery.toLowerCase());
  });

  // Filter contacts (followers/following) by search query
  const filteredContacts = chatSearchQuery.trim().length > 0
    ? followersAndFollowing.filter(contact => {
        const searchLower = chatSearchQuery.toLowerCase();
        const username = (contact.username || '').toLowerCase();
        const fullName = (contact.fullName || '').toLowerCase();
        return username.includes(searchLower) || fullName.includes(searchLower);
      })
    : [];

  const handleChatClick = async (chat) => {
    setActiveChat(chat);
    // Mark chat as read
    try {
      await chatService.markAsRead(chat.id);
      // Update chat in list to reset unread count
      setChats(prevChats => prevChats.map(c => 
        c.id === chat.id ? { ...c, unreadCount: 0, UnreadCount: 0 } : c
      ));
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  const handleContactClick = async (contact) => {
    try {
      // Check if chat already exists with this user
      const existingChat = chats.find(chat => {
        if (chat.type === 'Direct' || chat.type === 'direct') {
          return chat.participants?.some(p => p.userId === contact.id);
        }
        return false;
      });

      if (existingChat) {
        // Open existing chat
        setActiveChat(existingChat);
        setChatSearchQuery(''); // Clear search
      } else {
        // Create new direct chat
        console.log('Creating chat with contact:', contact);
        console.log('Contact ID type:', typeof contact.id, 'value:', contact.id);
        try {
          const newChat = await chatService.createChat([contact.id], 'Direct');
          console.log('Created new chat:', newChat);
        
        // Reload chats to include the new one
        const chatsData = await chatService.getChats();
        setChats(chatsData);
        
        // Find the newly created chat from the reloaded list (to get full data)
        const reloadedChat = chatsData.find(chat => chat.id === newChat.id) || newChat;
        
        // Set active chat and load messages
        setActiveChat(reloadedChat);
        setChatSearchQuery(''); // Clear search
        
          // Load messages for the new chat (may be empty)
          try {
            const messagesData = await chatService.getMessages(reloadedChat.id);
            const sortedMessages = Array.isArray(messagesData) 
              ? [...messagesData].sort((a, b) => new Date(a.sentAt || a.createdAt) - new Date(b.sentAt || b.createdAt))
              : [];
            setMessages(sortedMessages);
          } catch (error) {
            console.error('Error loading messages for new chat:', error);
            setMessages([]);
          }
        } catch (createError) {
          console.error('Error in createChat call:', createError);
          throw createError; // Re-throw to be caught by outer catch
        }
      }
    } catch (error) {
      console.error('Error creating/opening chat:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Неизвестная ошибка';
      console.error('Full error details:', error.response?.data);
      console.error('Error response:', JSON.stringify(error.response?.data, null, 2));
      alert(`Не удалось создать чат: ${errorMessage}`);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      // Send message
      const sentMessage = await chatService.sendMessage(activeChat.id, messageContent);
      console.log('Message sent:', sentMessage);
      
      // Reload messages to get the complete list
      const messagesData = await chatService.getMessages(activeChat.id);
      const sortedMessages = Array.isArray(messagesData) 
        ? [...messagesData].sort((a, b) => new Date(a.sentAt || a.createdAt) - new Date(b.sentAt || b.createdAt))
        : [];
      setMessages(sortedMessages);
      
      // Reload chats to update last message and order
      const chatsData = await chatService.getChats();
      console.log('Reloaded chats after sending message:', chatsData);
      setChats(chatsData);
      
      // Update active chat to reflect the latest state
      const updatedChat = chatsData.find(c => c.id === activeChat.id);
      if (updatedChat) {
        console.log('Updated active chat:', updatedChat);
        setActiveChat(updatedChat);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message if sending failed
      setNewMessage(messageContent);
      alert('Не удалось отправить сообщение. Попробуйте еще раз.');
    }
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
        
        <div className="header-search-container" ref={searchContainerRef}>
          <div className="header-search">
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Найти" 
              className="header-search-input"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
            />
            <img src="/search-alt.png" alt="Search" className="header-search-icon" />
          </div>
          {userSearchQuery.trim().length >= 2 && (
            <UserSearch 
              searchQuery={userSearchQuery} 
              onClose={() => setUserSearchQuery('')}
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

      {/* Sidebar - как в MainPage */}
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
          <Link to="/" className="sidebar-nav-link">Лента</Link>
          <div className="sidebar-nav-link active">Сообщения</div>
        </nav>
      </aside>

      {/* Chat List */}
      <main className="chat-list-section">
            <div className="search-header">
              <input
                type="text"
                placeholder="Поиск чатов или пользователей..."
                className="search-input"
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
              />
              <button>+</button>
            </div>
            <div className="chat-items">
              {chatSearchQuery.trim().length > 0 ? (
                // Show search results (contacts)
                loadingContacts ? (
                  <div className="no-chats">Загрузка...</div>
                ) : filteredContacts.length > 0 ? (
                  filteredContacts.map(contact => (
                    <div
                      key={contact.id}
                      className="chat-item"
                      onClick={() => handleContactClick(contact)}
                    >
                      <div 
                        className="avatar"
                        style={{
                          backgroundImage: contact.avatarUrl ? `url(${contact.avatarUrl})` : 'none',
                          backgroundColor: contact.avatarUrl ? 'transparent' : '#444',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      ></div>
                      <div className="chat-info">
                        <div className="name">{contact.fullName || contact.username || 'Пользователь'}</div>
                        <div className="message">@{contact.username}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-chats">Пользователи не найдены</div>
                )
              ) : (
                // Show regular chats
                filteredChats.length > 0 ? (
                  filteredChats.map(chat => {
                    const unreadCount = chat.unreadCount || chat.UnreadCount || 0;
                    return (
                      <div
                        key={chat.id}
                        className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`}
                        onClick={() => handleChatClick(chat)}
                      >
                        <div 
                          className="avatar"
                          style={{
                            backgroundImage: getChatAvatar(chat) ? `url(${getChatAvatar(chat)})` : 'none',
                            backgroundColor: getChatAvatar(chat) ? 'transparent' : '#444',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        ></div>
                        <div className="chat-info">
                          <div className="name">{getChatDisplayName(chat)}</div>
                          <div className="message">{getLastMessage(chat)}</div>
                        </div>
                        {unreadCount > 0 && activeChat?.id !== chat.id && (
                          <div className="chat-unread-badge">{unreadCount}</div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="no-chats">Нет чатов</div>
                )
              )}
            </div>
      </main>

      {/* Placeholder или чат */}
        {activeChat ? (
          <section className="chat-area">
            <div className="chat-area-header">
              <div className="chat-title">{getChatDisplayName(activeChat)}</div>
              <div className="participants">{activeChat.participants?.length || 0} участников</div>
              <div className="options">⋯</div>
            </div>
            <div className="messages">
              {messagesLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                  Загрузка сообщений...
                </div>
              ) : messages.length > 0 ? (
                messages.map((message) => {
                  const isOwnMessage = message.senderId === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`message-bubble ${isOwnMessage ? 'own' : ''}`}
                    >
                      {!isOwnMessage && (
                        <div 
                          className="avatar"
                          style={{
                            backgroundImage: message.senderAvatarUrl ? `url(${message.senderAvatarUrl})` : 'none',
                            backgroundColor: message.senderAvatarUrl ? 'transparent' : '#444',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        ></div>
                      )}
                      <div className="message-content">
                        {!isOwnMessage && (
                          <div className="sender">{message.senderUsername}</div>
                        )}
                        <div className="text">{message.content}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                  Нет сообщений
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form className="input-area" onSubmit={handleSendMessage}>
              <button type="button" className="emoji-button">😊</button>
              <input
                type="text"
                placeholder="Введите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="button" className="attach-button">📎</button>
            </form>
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