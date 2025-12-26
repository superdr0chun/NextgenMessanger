import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './MainPage.css';
import { authService } from '../services/authService';
import { useUser } from '../context/UserContext';
import UserSearch from './UserSearch';
import { notificationService } from '../services/notificationService';
import { chatService } from '../services/chatService';
import { postService } from '../services/postService';
import { reactionService } from '../services/reactionService';
import { commentService } from '../services/commentService';
import { userService } from '../services/userService';
import api from '../services/api';
import { STATIC_BASE_URL, POLLING_INTERVALS } from '../config/constants';

function MainPage() {
  const navigate = useNavigate();
  const { user, clearUser } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [recentChats, setRecentChats] = useState([]);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [expandedComments, setExpandedComments] = useState(null); 
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [notificationUsers, setNotificationUsers] = useState({});
  const [avatarUrl, setAvatarUrl] = useState(null);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    const interval = setInterval(loadUnreadCount, POLLING_INTERVALS.UNREAD_MESSAGES);
    return () => clearInterval(interval);
  }, []);

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
        // Filter out message notifications - they are shown in navigation
        const notifs = allNotifs.filter(n => n.type !== 'new_message');
        setNotifications(notifs);
        // Count unread non-message notifications
        const unreadNonMessage = notifs.filter(n => !n.isRead).length;
        setUnreadNotificationsCount(unreadNonMessage);
        
        // Load user info and avatars for notifications
        const userIdsToLoad = [];
        notifs.forEach(notification => {
          const userId = getNotificationUserId(notification);
          // Load if we don't have this user OR if we have user but no avatar
          if (userId && (!notificationUsers[userId] || !notificationUsers[userId].avatarUrl)) {
            userIdsToLoad.push(userId);
          }
        });
        
        // Load unique user IDs
        const uniqueUserIds = [...new Set(userIdsToLoad)];
        if (uniqueUserIds.length > 0) {
          const usersInfo = {};
          await Promise.all(uniqueUserIds.map(async (userId) => {
            try {
              // Start with existing user info if we have it
              let userInfo = notificationUsers[userId] ? { ...notificationUsers[userId] } : {};
              
              // Try to load user info if we don't have it
              if (!userInfo.username) {
                try {
                  const fetchedUser = await userService.getUserById(userId);
                  userInfo = { ...userInfo, ...fetchedUser };
                } catch (e) {
                  console.error('Error loading user:', userId, e);
                }
              }
              
              // Always try to load avatar from profile
              if (userInfo.username) {
                try {
                  const profileResponse = await api.get(`/users/${userInfo.username}/profile`);
                  if (profileResponse.data?.avatarUrl) {
                    userInfo.avatarUrl = profileResponse.data.avatarUrl;
                  }
                } catch (profileError) {
                  // Profile might not exist, that's ok
                }
              }
              
              usersInfo[userId] = userInfo;
            } catch (e) {
              console.error('Error loading user:', userId, e);
            }
          }));
          setNotificationUsers(prev => ({ ...prev, ...usersInfo }));
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();
    // Refresh every 10 seconds
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [getNotificationUserId, notificationUsers]);

  // Load recent chats
  useEffect(() => {
    if (!authService.isAuthenticated()) return;
    
    const loadRecentChats = async () => {
      try {
        const chats = await chatService.getChats();
        // Take only the first 5 most recent chats
        setRecentChats(chats.slice(0, 5));
      } catch (error) {
        console.error('Error loading recent chats:', error);
      }
    };

    loadRecentChats();
  }, []);

  // Load posts
  useEffect(() => {
    if (!authService.isAuthenticated()) return;
    
    const loadPosts = async () => {
      try {
        const postsData = await postService.getPosts(1, 20);
        setPosts(Array.isArray(postsData) ? postsData : []);
      } catch (error) {
        console.error('Error loading posts:', error);
      }
    };

    loadPosts();
  }, []);

  // Create new post
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    setIsCreatingPost(true);
    try {
      await postService.createPost(newPostContent.trim());
      setNewPostContent('');
      // Reload posts from server to get the saved version
      const postsData = await postService.getPosts(1, 20);
      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Не удалось создать пост');
    } finally {
      setIsCreatingPost(false);
    }
  };

  // Handle like/unlike
  const handleLike = async (postId, isCurrentlyLiked) => {
    try {
      await reactionService.toggleLike(postId, isCurrentlyLiked);
      // Update the post in the local state
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isLikedByCurrentUser: !isCurrentlyLiked,
            reactionsCount: isCurrentlyLiked 
              ? Math.max(0, (post.reactionsCount || 1) - 1) 
              : (post.reactionsCount || 0) + 1
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Toggle comments section
  const toggleComments = async (postId) => {
    if (expandedComments === postId) {
      setExpandedComments(null);
      setComments([]);
      return;
    }
    
    setExpandedComments(postId);
    setCommentsLoading(true);
    try {
      const commentsData = await commentService.getComments(postId);
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Submit new comment
  const handleSubmitComment = async (postId) => {
    if (!newComment.trim() || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    try {
      const comment = await commentService.createComment(postId, newComment.trim());
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      // Update comments count in post
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return { ...post, commentsCount: (post.commentsCount || 0) + 1 };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Get first letter of username for avatar
  const getAuthorLetter = (username) => {
    return username ? username.charAt(0).toUpperCase() : '?';
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
    return 'Чат';
  };

  // Get first letter for avatar
  const getAvatarLetter = (chat) => {
    const name = getChatDisplayName(chat);
    return name.charAt(0).toUpperCase();
  };

  // Handle chat click - navigate to chat page
  const handleChatClick = (chatId) => {
    navigate(`/chat?id=${chatId}`);
  };

  const handleAvatarClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleNotificationsClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
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

    // Navigate based on notification type
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
        
        // Try multiple property name variations
        const username = data.follower_username || data.followerUsername || 
                        data.username || data.user_name || data.userName;
        
        if (username) return username;
        
        // Try to get from cached users
        const userId = data.follower_id || data.followerId || data.user_id || data.userId;
        if (userId && notificationUsers[userId]) {
          return notificationUsers[userId].username || notificationUsers[userId].userName || 'Пользователь';
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
        
        // Try to get avatar from notification data
        if (data.avatarUrl || data.avatar_url) {
          return data.avatarUrl || data.avatar_url;
        }
        
        // Try to get from cached users
        const userId = data.follower_id || data.followerId || data.user_id || data.userId;
        if (userId && notificationUsers[userId]?.avatarUrl) {
          return notificationUsers[userId].avatarUrl;
        }
      } catch (e) {
        // ignore
      }
    }
    return null;
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
          {recentChats.length > 0 ? (
            recentChats.map(chat => (
              <div 
                key={chat.id} 
                className="recent-chat-item"
                onClick={() => handleChatClick(chat.id)}
              >
                <div className="recent-chat-avatar">
                  {getAvatarLetter(chat)}
                </div>
                <div className="recent-chat-name">{getChatDisplayName(chat)}</div>
              </div>
            ))
          ) : (
            <div className="no-recent-chats">Нет чатов</div>
          )}
        </div>
      </section>
      
      <section className="posts-feed">
        <div className="posts-container">
          {/* Create Post Form */}
          <div className="create-post-card">
            <textarea
              className="create-post-input"
              placeholder="Что у вас нового?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={2}
            />
            <div className="create-post-actions">
              <button 
                className="create-post-btn"
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || isCreatingPost}
              >
                {isCreatingPost ? '...' : 'Опубликовать'}
              </button>
            </div>
          </div>

          {/* Posts List */}
          {posts.length > 0 ? (
            posts.map(post => (
              <div key={post.id} className="post-card">
                <div className="post-header" onClick={() => navigate(`/profile/${post.authorUsername || post.authorId}`)} style={{ cursor: 'pointer' }}>
                  <div className="post-avatar-letter">
                    {getAuthorLetter(post.authorUsername)}
                  </div>
                  <div className="post-author-name">{post.authorUsername || 'Пользователь'}</div>
                </div>
                <div className="post-content">
                  {post.mediaUrl && post.mediaUrl.length > 0 && (
                    <img src={post.mediaUrl[0]} alt="Post" className="post-image" />
                  )}
                  {post.content && (
                    <div className="post-text">{post.content}</div>
                  )}
                </div>
                <div className="post-actions">
                  <div 
                    className={`post-action ${post.isLikedByCurrentUser ? 'liked' : ''}`}
                    onClick={() => handleLike(post.id, post.isLikedByCurrentUser)}
                  >
                    <img src="/like.png" alt="Like" className="post-action-icon" />
                    <span>{post.reactionsCount || 0}</span>
                  </div>
                  <div 
                    className={`post-action ${expandedComments === post.id ? 'active' : ''}`}
                    onClick={() => toggleComments(post.id)}
                  >
                    <img src="/comment.png" alt="Comment" className="post-action-icon" />
                    <span>{post.commentsCount || 0}</span>
                  </div>
                  <img src="/important.png" alt="Bookmark" className="post-action-icon" />
                </div>
                
                {/* Comments Section */}
                {expandedComments === post.id && (
                  <div className="comments-section">
                    <div className="comment-input-wrapper">
                      <input
                        type="text"
                        className="comment-input"
                        placeholder="Написать комментарий..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                      />
                      <button 
                        className="comment-submit-btn"
                        onClick={() => handleSubmitComment(post.id)}
                        disabled={!newComment.trim() || isSubmittingComment}
                      >
                        {isSubmittingComment ? '...' : '→'}
                      </button>
                    </div>
                    
                    <div className="comments-list">
                      {commentsLoading ? (
                        <div className="comments-loading">Загрузка...</div>
                      ) : comments.length > 0 ? (
                        comments.map(comment => (
                          <div key={comment.id} className="comment-item">
                            <div 
                              className="comment-avatar"
                              onClick={() => navigate(`/profile/${comment.authorUsername || comment.authorId}`)}
                            >
                              {comment.authorUsername?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="comment-body">
                              <span 
                                className="comment-author"
                                onClick={() => navigate(`/profile/${comment.authorUsername || comment.authorId}`)}
                              >
                                {comment.authorUsername}
                              </span>
                              <span className="comment-text">{comment.content}</span>
                              <span className="comment-time">
                                {new Date(comment.createdAt).toLocaleDateString('ru-RU', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-comments">Комментариев пока нет</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-posts">Постов пока нет. Будьте первым!</div>
          )}
        </div>
      </section>
      
      <aside className="main-content-block">
        {/* Контент будет добавлен позже */}
      </aside>
    </div>
  );
}

export default MainPage;

