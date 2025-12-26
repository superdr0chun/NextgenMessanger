import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ChatPage.css';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './MainPage.css';
import { authService } from '../services/authService';
import { useUser } from '../context/UserContext';
import UserSearch from './UserSearch';
import { chatService } from '../services/chatService';
import { followService } from '../services/followService';
import { notificationService } from '../services/notificationService';
import { userService } from '../services/userService';
import api from '../services/api';
import { STATIC_BASE_URL, POLLING_INTERVALS } from '../config/constants';

const ChatPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  // eslint-disable-next-line no-unused-vars
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [initialChatId] = useState(searchParams.get('id'));
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [notificationUsers, setNotificationUsers] = useState({});
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [pinnedChats, setPinnedChats] = useState([]);
  const [chatMenuOpen, setChatMenuOpen] = useState(null); // chat id of open menu
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState([]);
  const [groupSearchLoading, setGroupSearchLoading] = useState(false);
  const dropdownRef = useRef(null);
  const createGroupModalRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const shouldScrollToBottom = useRef(true);
  const prevMessagesLength = useRef(0);
  const chatMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setChatMenuOpen(null);
      }
      if (createGroupModalRef.current && !createGroupModalRef.current.contains(event.target)) {
        setShowCreateGroupModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const pinned = chatService.getPinnedChats();
    setPinnedChats(pinned);
  }, []);

  const getNotificationUserId = useCallback((notification) => {
    if (notification.data) {
      try {
        const data = typeof notification.data === 'string' 
          ? JSON.parse(notification.data) 
          : notification.data;
        return data.follower_id || data.followerId || data.user_id || data.userId || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    if (!authService.isAuthenticated()) return;
    
    const loadNotifications = async () => {
      try {
        const data = await notificationService.getNotifications(1, 20);
        const allNotifs = data.notifications || [];
        const notifs = allNotifs.filter(n => n.type !== 'new_message');
        setNotifications(notifs);
        const unreadNonMessage = notifs.filter(n => !n.isRead).length;
        setUnreadNotificationsCount(unreadNonMessage);
        
        const userIdsToLoad = [];
        notifs.forEach(notification => {
          const notifUserId = getNotificationUserId(notification);
          if (notifUserId && (!notificationUsers[notifUserId] || !notificationUsers[notifUserId].avatarUrl)) {
            userIdsToLoad.push(notifUserId);
          }
        });
        
        const uniqueUserIds = [...new Set(userIdsToLoad)];
        if (uniqueUserIds.length > 0) {
          const usersInfo = {};
          await Promise.all(uniqueUserIds.map(async (id) => {
            try {
              let userInfo = notificationUsers[id] ? { ...notificationUsers[id] } : {};
              
              if (!userInfo.username) {
                try {
                  const fetchedUser = await userService.getUserById(id);
                  userInfo = { ...userInfo, ...fetchedUser };
                } catch (e) {
                  console.error('Error loading user:', id, e);
                }
              }
              
              if (userInfo.username) {
                try {
                  const profileResponse = await api.get(`/users/${userInfo.username}/profile`);
                  if (profileResponse.data?.avatarUrl) {
                    userInfo.avatarUrl = profileResponse.data.avatarUrl;
                  }
                } catch (e) {
                }
              }
              
              usersInfo[id] = userInfo;
            } catch (e) {
              console.error('Error loading user:', id, e);
            }
          }));
          setNotificationUsers(prev => ({ ...prev, ...usersInfo }));
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [getNotificationUserId, notificationUsers]);

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
        
        if (initialChatId && chatsData.length > 0) {
          const targetChat = chatsData.find(chat => chat.id === initialChatId);
          if (targetChat) {
            setActiveChat(targetChat);
            try {
              await chatService.markAsRead(targetChat.id);
            } catch (error) {
              console.error('Error marking chat as read:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [initialChatId]);

  useEffect(() => {
    const loadContacts = async () => {
      if (!user?.id) return;
      
      setLoadingContacts(true);
      try {
        const [followers, following] = await Promise.all([
          followService.getFollowers(user.id, 1, 1000),
          followService.getFollowing(user.id, 1, 1000),
        ]);

        const allContacts = new Map();
        
        if (Array.isArray(followers)) {
          followers.forEach(f => {
            if (f.followerId && f.followerId !== user.id) {
              allContacts.set(f.followerId, {
                id: f.followerId,
                username: f.followerUsername || '',
                fullName: f.followerUsername || '',
                avatarUrl: f.followerAvatarUrl || null,
              });
            }
          });
        }

        if (Array.isArray(following)) {
          following.forEach(f => {
            if (f.followeeId && f.followeeId !== user.id) {
              allContacts.set(f.followeeId, {
                id: f.followeeId,
                username: f.followeeUsername || '',
                fullName: f.followeeUsername || '',
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
    const interval = setInterval(loadUnreadCount, POLLING_INTERVALS.UNREAD_MESSAGES);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const loadUserAvatar = async () => {
      if (!user?.username) return;
      
      try {
        const response = await api.get(`/users/${user.username}/profile`);
        if (response.data?.avatarUrl) {
          setAvatarUrl(response.data.avatarUrl);
        }
      } catch (error) {
        console.error('Error loading user avatar:', error);
      }
    };

    loadUserAvatar();
  }, [user?.id, user?.username]);

  useEffect(() => {
    if (activeChat?.id) {
      const loadMessages = async () => {
        setMessagesLoading(true);
        try {
          const messagesData = await chatService.getMessages(activeChat.id);
          const sortedMessages = Array.isArray(messagesData) 
            ? [...messagesData].sort((a, b) => new Date(a.sentAt || a.createdAt) - new Date(b.sentAt || b.createdAt))
            : [];
          setMessages(sortedMessages);
          
          try {
            await notificationService.markAllAsRead();
            setUnreadMessagesCount(0);
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
      }, POLLING_INTERVALS.MESSAGES);
      
      return () => clearInterval(pollMessages);
    } else {
      setMessages([]);
    }
  }, [activeChat?.id]);

  useEffect(() => {
    if (shouldScrollToBottom.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  useEffect(() => {
    shouldScrollToBottom.current = true;
  }, [activeChat?.id]);

  useEffect(() => {
    const handleWheel = (e) => {
      if (messagesContainerRef.current && activeChat) {
        const messagesEl = messagesContainerRef.current;
        const isAtTop = messagesEl.scrollTop === 0;
        const isAtBottom = messagesEl.scrollTop + messagesEl.clientHeight >= messagesEl.scrollHeight - 10;
        
        if (e.deltaY < 0) {
          shouldScrollToBottom.current = false;
        }
        
        if (isAtBottom && e.deltaY > 0) {
          shouldScrollToBottom.current = true;
        }
        
        // Forward scroll to messages container
        if ((e.deltaY > 0 && !isAtBottom) || (e.deltaY < 0 && !isAtTop)) {
          messagesEl.scrollTop += e.deltaY;
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [activeChat]);

  const handleAvatarClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleNotificationsClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        ));
        setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    if (notification.type === 'new_follower' && notification.data) {
      try {
        const data = typeof notification.data === 'string' 
          ? JSON.parse(notification.data) 
          : notification.data;
        const followerId = data.follower_id || data.followerId;
        const followerUsername = data.follower_username || data.followerUsername;
        if (followerId) {
          setShowNotifications(false);
          navigate(`/profile/${followerUsername || followerId}`);
        }
      } catch (e) {
        console.error('Error parsing notification data:', e);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadNotificationsCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationText = (notification) => {
    if (notification.type === 'new_follower') {
      return 'подписался на вас';
    }
    if (notification.type === 'new_message') {
      return 'отправил вам сообщение';
    }
    if (notification.type === 'new_comment') {
      return 'прокомментировал ваш пост';
    }
    if (notification.type === 'new_like') {
      return 'оценил ваш пост';
    }
    return 'новое уведомление';
  };

  const getNotificationUsername = (notification) => {
    if (notification.data) {
      try {
        const data = typeof notification.data === 'string' 
          ? JSON.parse(notification.data) 
          : notification.data;
        
        const username = data.follower_username || data.followerUsername || 
                        data.username || data.user_name || data.userName;
        
        if (username) return username;
        
        const notifUserId = data.follower_id || data.followerId || data.user_id || data.userId;
        if (notifUserId && notificationUsers[notifUserId]) {
          return notificationUsers[notifUserId].username || notificationUsers[notifUserId].userName || 'Пользователь';
        }
        
        return 'Пользователь';
      } catch (e) {
        return 'Пользователь';
      }
    }
    return 'Пользователь';
  };

  const getNotificationAvatarUrl = (notification) => {
    if (notification.data) {
      try {
        const data = typeof notification.data === 'string' 
          ? JSON.parse(notification.data) 
          : notification.data;
        
        if (data.avatarUrl || data.avatar_url) {
          return data.avatarUrl || data.avatar_url;
        }
        
        const notifUserId = data.follower_id || data.followerId || data.user_id || data.userId;
        if (notifUserId && notificationUsers[notifUserId]?.avatarUrl) {
          return notificationUsers[notifUserId].avatarUrl;
        }
      } catch (e) {
      }
    }
    return null;
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
    if ((chat.type === 'Direct' || chat.type === 'direct') && chat.participants) {
      const otherParticipant = chat.participants.find(p => p.userId !== user?.id);
      if (otherParticipant) {
        return otherParticipant.username;
      }
    }
    return 'Chat';
  };

  const getOtherParticipant = (chat) => {
    if ((chat.type === 'Direct' || chat.type === 'direct') && chat.participants) {
      return chat.participants.find(p => p.userId !== user?.id);
    }
    return null;
  };

  const getChatAvatar = (chat) => {
    const otherParticipant = getOtherParticipant(chat);
    if (otherParticipant?.avatarUrl) {
      return otherParticipant.avatarUrl;
    }
    return null;
  };

  const getLastMessage = (chat, maxLength = 50) => {
    const lastMessageContent = chat.lastMessageContent || chat.LastMessageContent;
    const lastMessageSenderId = chat.lastMessageSenderId || chat.LastMessageSenderId;
    
    if (lastMessageContent) {
      const isFromCurrentUser = lastMessageSenderId && user?.id && 
        (lastMessageSenderId === user.id || 
         lastMessageSenderId.toString() === user.id.toString() ||
         String(lastMessageSenderId) === String(user.id));
      
      let messageText = lastMessageContent;
      if (messageText.length > maxLength) {
        messageText = messageText.substring(0, maxLength) + '...';
      }
      
      if (isFromCurrentUser) {
        return `Вы: ${messageText}`;
      }
      
      return messageText;
    }
    return 'Нет сообщений';
  };

  const filteredChats = chats
    .filter(chat => {
      const name = getChatDisplayName(chat).toLowerCase();
      return name.includes(chatSearchQuery.toLowerCase());
    })
    .sort((a, b) => {
      const aPinned = pinnedChats.includes(a.id);
      const bPinned = pinnedChats.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });

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
    try {
      await chatService.markAsRead(chat.id);
      setChats(prevChats => prevChats.map(c => 
        c.id === chat.id ? { ...c, unreadCount: 0, UnreadCount: 0 } : c
      ));
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  const handleChatMenuClick = (e, chatId) => {
    e.stopPropagation();
    setChatMenuOpen(chatMenuOpen === chatId ? null : chatId);
  };

  const handlePinChat = (e, chatId) => {
    e.stopPropagation();
    if (pinnedChats.includes(chatId)) {
      chatService.unpinChat(chatId);
      setPinnedChats(pinnedChats.filter(id => id !== chatId));
    } else {
      chatService.pinChat(chatId);
      setPinnedChats([...pinnedChats, chatId]);
    }
    setChatMenuOpen(null);
  };

  const handleDeleteChatForMe = async (e, chatId) => {
    e.stopPropagation();
    try {
      await chatService.deleteChat(chatId, false);
      setChats(chats.filter(c => c.id !== chatId));
      if (activeChat?.id === chatId) {
        setActiveChat(null);
      }
      if (pinnedChats.includes(chatId)) {
        chatService.unpinChat(chatId);
        setPinnedChats(pinnedChats.filter(id => id !== chatId));
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
    setChatMenuOpen(null);
  };

  const handleDeleteChatForEveryone = async (e, chatId) => {
    e.stopPropagation();
    try {
      await chatService.deleteChat(chatId, true);
      setChats(chats.filter(c => c.id !== chatId));
      if (activeChat?.id === chatId) {
        setActiveChat(null);
      }
      if (pinnedChats.includes(chatId)) {
        chatService.unpinChat(chatId);
        setPinnedChats(pinnedChats.filter(id => id !== chatId));
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
    setChatMenuOpen(null);
  };

  const isDirectChat = (chat) => {
    return chat?.type === 'Direct' || chat?.type === 'direct';
  };

  const handleContactClick = async (contact) => {
    try {
      const existingChat = chats.find(chat => {
        if (chat.type === 'Direct' || chat.type === 'direct') {
          return chat.participants?.some(p => p.userId === contact.id);
        }
        return false;
      });

      if (existingChat) {
        setActiveChat(existingChat);
        setChatSearchQuery('');
      } else {
        console.log('Creating chat with contact:', contact);
        console.log('Contact ID type:', typeof contact.id, 'value:', contact.id);
        try {
          const newChat = await chatService.createChat([contact.id], 'Direct');
          console.log('Created new chat:', newChat);
        
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

  // Group chat creation functions
  const handleGroupSearch = async (query) => {
    setGroupSearchQuery(query);
    if (!query.trim()) {
      setGroupSearchResults([]);
      return;
    }

    setGroupSearchLoading(true);
    try {
      const results = await userService.searchUsers(query);
      // Filter out already selected participants and current user
      const filtered = results.filter(
        u => u.id !== user?.id && !selectedParticipants.some(p => p.id === u.id)
      );
      setGroupSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setGroupSearchLoading(false);
    }
  };

  const handleAddParticipant = (participant) => {
    setSelectedParticipants([...selectedParticipants, participant]);
    setGroupSearchQuery('');
    setGroupSearchResults([]);
  };

  const handleRemoveParticipant = (participantId) => {
    setSelectedParticipants(selectedParticipants.filter(p => p.id !== participantId));
  };

  const handleCreateGroup = async () => {
    if (selectedParticipants.length < 2) {
      alert('Выберите минимум 2 участников для создания беседы');
      return;
    }

    if (!groupName.trim()) {
      alert('Введите название беседы');
      return;
    }

    try {
      const participantIds = selectedParticipants.map(p => p.id);
      const newChat = await chatService.createChat(participantIds, 'Group', groupName.trim());
      
      // Reload chats
      const chatsData = await chatService.getChats();
      setChats(chatsData);
      
      // Open new chat
      const reloadedChat = chatsData.find(chat => chat.id === newChat.id) || newChat;
      setActiveChat(reloadedChat);
      setMessages([]);
      
      // Close modal and reset
      setShowCreateGroupModal(false);
      setGroupName('');
      setSelectedParticipants([]);
      setGroupSearchQuery('');
      setGroupSearchResults([]);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Ошибка при создании беседы');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    shouldScrollToBottom.current = true; // Scroll to bottom when user sends a message

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
        
        <div className="header-notifications" ref={notificationsRef}>
          <div className="header-notifications-btn" onClick={handleNotificationsClick}>
            <img src="/notifications.png" alt="Notifications" className="header-notifications-icon" />
            {unreadNotificationsCount > 0 && (
              <span className="notifications-badge">{unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}</span>
            )}
          </div>
          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <span className="notifications-title">Уведомления</span>
                {unreadNotificationsCount > 0 && (
                  <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
                    Прочитать все
                  </button>
                )}
              </div>
              <div className="notifications-list">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {getNotificationAvatarUrl(notification) ? (
                        <img 
                          src={`${STATIC_BASE_URL}${getNotificationAvatarUrl(notification)}`}
                          alt=""
                          className="notification-avatar"
                        />
                      ) : (
                        <div className="notification-avatar notification-avatar-letter">
                          {getNotificationUsername(notification).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="notification-content">
                        <span className="notification-text">
                          <strong>{getNotificationUsername(notification)}</strong> {getNotificationText(notification)}
                        </span>
                        <span className="notification-time">
                          {new Date(notification.createdAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {!notification.isRead && <div className="notification-dot" />}
                    </div>
                  ))
                ) : (
                  <div className="no-notifications">Нет уведомлений</div>
                )}
              </div>
            </div>
          )}
        </div>
        {authService.isAuthenticated() ? (
          <div className="header-user-profile" ref={dropdownRef}>
            {avatarUrl ? (
              <img 
                src={`${STATIC_BASE_URL}${avatarUrl}`} 
                alt="User Avatar" 
                className="header-user-avatar" 
                onClick={handleAvatarClick}
              />
            ) : (
              <div 
                className="header-user-avatar header-avatar-letter" 
                onClick={handleAvatarClick}
              >
                {user?.username?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
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
          {avatarUrl ? (
            <img src={`${STATIC_BASE_URL}${avatarUrl}`} alt="Avatar" className="sidebar-avatar" />
          ) : (
            <div className="sidebar-avatar sidebar-avatar-letter">
              {user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
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
            </div>
            <div className="chat-items">
              {/* Create Group Button - only show when not searching */}
              {!chatSearchQuery.trim() && (
                <div 
                  className="chat-item create-group-item"
                  onClick={() => setShowCreateGroupModal(true)}
                >
                  <div className="avatar create-group-avatar">
                    <span>+</span>
                  </div>
                  <div className="chat-info">
                    <div className="name">Создать беседу</div>
                    <div className="message">Объедините друзей в группу</div>
                  </div>
                </div>
              )}
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
                    const isPinned = pinnedChats.includes(chat.id);
                    return (
                      <div
                        key={chat.id}
                        className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`}
                        onClick={() => handleChatClick(chat)}
                      >
                        {getChatAvatar(chat) ? (
                          <img 
                            src={`${STATIC_BASE_URL}${getChatAvatar(chat)}`}
                            alt="Avatar"
                            className="avatar"
                          />
                        ) : (
                          <div className="avatar avatar-letter">
                            {getOtherParticipant(chat)?.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="chat-info">
                          <div className="name">{getChatDisplayName(chat)}</div>
                          <div className="message">{getLastMessage(chat)}</div>
                        </div>
                        {isPinned && (
                          <img src="/pin.png" alt="Pinned" className="chat-pin-icon" />
                        )}
                        {unreadCount > 0 && activeChat?.id !== chat.id && (
                          <div className="chat-unread-badge">{unreadCount}</div>
                        )}
                        <div className="chat-item-menu-container" ref={chatMenuOpen === chat.id ? chatMenuRef : null}>
                          <button 
                            className="chat-item-menu-btn"
                            onClick={(e) => handleChatMenuClick(e, chat.id)}
                          >
                            ⋯
                          </button>
                          {chatMenuOpen === chat.id && (
                            <div className="chat-item-menu">
                              <button onClick={(e) => handlePinChat(e, chat.id)}>
                                <img src="/Pushpin.png" alt="" className="menu-icon" />
                                {isPinned ? 'Открепить' : 'Закрепить'}
                              </button>
                              <button onClick={(e) => handleDeleteChatForMe(e, chat.id)} className="danger">
                                <img src="/Wastebasket.png" alt="" className="menu-icon" />
                                Удалить у себя
                              </button>
                              <button onClick={(e) => handleDeleteChatForEveryone(e, chat.id)} className="danger">
                                <img src="/Wastebasket.png" alt="" className="menu-icon" />
                                Удалить у всех
                              </button>
                            </div>
                          )}
                        </div>
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
              <div className="chat-header-info">
                {getChatAvatar(activeChat) ? (
                  <img 
                    src={`${STATIC_BASE_URL}${getChatAvatar(activeChat)}`} 
                    alt="Avatar" 
                    className="chat-header-avatar"
                  />
                ) : (
                  <div className="chat-header-avatar chat-header-avatar-letter">
                    {getOtherParticipant(activeChat)?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div className="chat-title">{getChatDisplayName(activeChat)}</div>
              </div>
              {!isDirectChat(activeChat) && (
                <div className="chat-header-right">
                  <div className="participants">{activeChat.participants?.length || 0} участников</div>
                  <div className="options">⋯</div>
                </div>
              )}
            </div>
            <div className="messages" ref={messagesContainerRef}>
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

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="modal-overlay">
          <div className="create-group-modal" ref={createGroupModalRef}>
            <div className="modal-header">
              <h2>Создать беседу</h2>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  setShowCreateGroupModal(false);
                  setGroupName('');
                  setSelectedParticipants([]);
                  setGroupSearchQuery('');
                  setGroupSearchResults([]);
                }}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <input
                type="text"
                className="group-name-input"
                placeholder="Название беседы"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              
              {selectedParticipants.length > 0 && (
                <div className="selected-participants">
                  {selectedParticipants.map(participant => (
                    <div key={participant.id} className="selected-participant-chip">
                      <span>{participant.fullName || participant.username}</span>
                      <button onClick={() => handleRemoveParticipant(participant.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              
              <input
                type="text"
                className="participant-search-input"
                placeholder="Поиск участников..."
                value={groupSearchQuery}
                onChange={(e) => handleGroupSearch(e.target.value)}
              />
              
              <div className="participant-search-results">
                {groupSearchLoading ? (
                  <div className="search-loading">Поиск...</div>
                ) : groupSearchResults.length > 0 ? (
                  groupSearchResults.map(result => (
                    <div 
                      key={result.id} 
                      className="participant-search-item"
                      onClick={() => handleAddParticipant(result)}
                    >
                      {result.avatarUrl ? (
                        <img 
                          src={`${STATIC_BASE_URL}${result.avatarUrl}`}
                          alt=""
                          className="participant-avatar"
                        />
                      ) : (
                        <div className="participant-avatar participant-avatar-letter">
                          {(result.fullName || result.username || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="participant-info">
                        <div className="participant-name">{result.fullName || result.username}</div>
                        <div className="participant-username">@{result.username}</div>
                      </div>
                    </div>
                  ))
                ) : groupSearchQuery.trim() ? (
                  <div className="no-results">Пользователи не найдены</div>
                ) : null}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="create-group-btn"
                onClick={handleCreateGroup}
                disabled={selectedParticipants.length < 2 || !groupName.trim()}
              >
                Создать беседу ({selectedParticipants.length} участ.)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;