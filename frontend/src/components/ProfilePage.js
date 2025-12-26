import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import './ProfilePage.css';
import './MainPage.css';
import { authService } from '../services/authService';
import { useUser } from '../context/UserContext';
import UserSearch from './UserSearch';
import { userService } from '../services/userService';
import { followService } from '../services/followService';
import api from '../services/api';
import { notificationService } from '../services/notificationService';
import { reactionService } from '../services/reactionService';
import { commentService } from '../services/commentService';

function ProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user: currentUser, clearUser } = useUser();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingMe, setIsFollowingMe] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [stats, setStats] = useState({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [notificationUsers, setNotificationUsers] = useState({});
  const [myAvatarUrl, setMyAvatarUrl] = useState(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const avatarInputRef = useRef(null);

  // Determine which user to display
  const displayUser = userId ? profileUser : currentUser;
  const isOwnProfile = !userId || userId === currentUser?.id;

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

  // Helper function to extract user ID from notification
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

  // Load notifications
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
          const notifUserId = getNotificationUserId(notification);
          // Load if we don't have this user OR if we have user but no avatar
          if (notifUserId && (!notificationUsers[notifUserId] || !notificationUsers[notifUserId].avatarUrl)) {
            userIdsToLoad.push(notifUserId);
          }
        });
        
        // Load unique user IDs
        const uniqueUserIds = [...new Set(userIdsToLoad)];
        if (uniqueUserIds.length > 0) {
          const usersInfo = {};
          await Promise.all(uniqueUserIds.map(async (id) => {
            try {
              // Start with existing user info if we have it
              let userInfo = notificationUsers[id] ? { ...notificationUsers[id] } : {};
              
              // Try to load user info if we don't have it
              if (!userInfo.username) {
                try {
                  const fetchedUser = await userService.getUserById(id);
                  userInfo = { ...userInfo, ...fetchedUser };
                } catch (e) {
                  console.error('Error loading user:', id, e);
                }
              }
              
              // Always try to load avatar from profile
              try {
                const profileResponse = await api.get(`/users/${id}/profile`);
                if (profileResponse.data?.avatarUrl) {
                  userInfo.avatarUrl = profileResponse.data.avatarUrl;
                }
              } catch (e) {
                // Profile might not exist, that's ok
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
    // Refresh every 10 seconds
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [getNotificationUserId, notificationUsers]);

  const loadUserStats = async (targetUserId) => {
    try {
      // Try to load from cache first for instant display
      const cacheKey = `userStats_${targetUserId}`;
      const cachedStats = localStorage.getItem(cacheKey);
      if (cachedStats) {
        try {
          const parsedStats = JSON.parse(cachedStats);
          const cacheTime = parsedStats.cachedAt || 0;
          const now = Date.now();
          // Use cached data if it's less than 30 seconds old
          if (now - cacheTime < 30000) {
            setStats({
              postsCount: parsedStats.postsCount || 0,
              followersCount: parsedStats.followersCount || 0,
              followingCount: parsedStats.followingCount || 0,
            });
          }
        } catch (e) {
          // Invalid cache, ignore
        }
      }

      // Load posts count
      let postsCount = 0;
      try {
        const postsResponse = await api.get(`/users/${targetUserId}/posts`, {
          params: { page: 1, pageSize: 1000 },
        });
        const postsData = postsResponse.data;
        postsCount = Array.isArray(postsData) ? postsData.length : 0;
      } catch (error) {
        console.error('Error loading posts data:', error);
        // If there's an error, try to keep the cached value or set to 0
        const cachedStats = localStorage.getItem(cacheKey);
        if (cachedStats) {
          try {
            const parsedStats = JSON.parse(cachedStats);
            postsCount = parsedStats.postsCount || 0;
          } catch (e) {
            postsCount = 0;
          }
        }
      }

      // Load followers count (users who follow targetUserId)
      let followersCount = 0;
      try {
        const followersData = await followService.getFollowers(targetUserId, 1, 1000);
        followersCount = Array.isArray(followersData) ? followersData.length : 0;
      } catch (error) {
        console.error('Error loading followers data:', error);
        // If there's an error, try to keep the cached value or set to 0
        const cachedStats = localStorage.getItem(cacheKey);
        if (cachedStats) {
          try {
            const parsedStats = JSON.parse(cachedStats);
            followersCount = parsedStats.followersCount || 0;
          } catch (e) {
            followersCount = 0;
          }
        }
      }

      // Load following count (users that targetUserId follows)
      let followingCount = 0;
      try {
        const followingData = await followService.getFollowing(targetUserId, 1, 1000);
        console.log('Following data for user', targetUserId, ':', followingData);
        followingCount = Array.isArray(followingData) ? followingData.length : 0;
        console.log('Following count calculated:', followingCount);
      } catch (error) {
        console.error('Error loading following data:', error);
        // If there's an error, try to keep the cached value or set to 0
        const cachedStats = localStorage.getItem(cacheKey);
        if (cachedStats) {
          try {
            const parsedStats = JSON.parse(cachedStats);
            followingCount = parsedStats.followingCount || 0;
          } catch (e) {
            followingCount = 0;
          }
        }
      }

      const newStats = {
        postsCount,
        followersCount,
        followingCount,
      };

      setStats(newStats);

      // Cache the stats
      localStorage.setItem(cacheKey, JSON.stringify({
        ...newStats,
        cachedAt: Date.now(),
      }));
    } catch (error) {
      console.error('Error loading user stats:', error);
      setStats({ postsCount: 0, followersCount: 0, followingCount: 0 });
    }
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      if (userId) {
        setLoading(true);
        try {
          const userData = await userService.getUserById(userId);
          setProfileUser(userData);
          
          // Check if current user is following this user
          if (currentUser?.id && userData?.id) {
            const following = await followService.checkIsFollowing(currentUser.id, userData.id);
            setIsFollowing(following);
            
            // Check if this user is following the current user
            const followingMe = await followService.checkIsFollowing(userData.id, currentUser.id);
            setIsFollowingMe(followingMe);
          }

          // Load stats
          await loadUserStats(userData.id);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Redirect to main profile if user not found
          navigate('/profile');
        } finally {
          setLoading(false);
        }
      } else {
        // Load own profile stats
        setProfileUser(null);
        setIsFollowing(false);
        setIsFollowingMe(false);
        if (currentUser?.id) {
          await loadUserStats(currentUser.id);
        } else {
          setStats({ postsCount: 0, followersCount: 0, followingCount: 0 });
        }
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [userId, navigate, currentUser?.id]);

  // Load unread messages count
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!currentUser?.id) return;
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
  }, [currentUser?.id]);

  // Load user posts
  useEffect(() => {
    const loadUserPosts = async () => {
      const targetUserId = userId || currentUser?.id;
      if (!targetUserId) return;

      setPostsLoading(true);
      try {
        const response = await api.get(`/users/${targetUserId}/posts`, {
          params: { page: 1, pageSize: 50 },
        });
        setUserPosts(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error loading user posts:', error);
        setUserPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    loadUserPosts();
  }, [userId, currentUser?.id]);

  // Load current user's avatar (for header/sidebar)
  useEffect(() => {
    const loadMyAvatar = async () => {
      if (!currentUser?.id) return;

      try {
        const response = await api.get(`/users/${currentUser.id}/profile`);
        if (response.data?.avatarUrl) {
          setMyAvatarUrl(response.data.avatarUrl);
        }
      } catch (error) {
        console.error('Error loading my avatar:', error);
      }
    };

    loadMyAvatar();
  }, [currentUser?.id]);

  // Load profile avatar (for the displayed profile)
  useEffect(() => {
    const loadProfileAvatar = async () => {
      const targetUserId = userId || currentUser?.id;
      if (!targetUserId) return;

      try {
        const response = await api.get(`/users/${targetUserId}/profile`);
        if (response.data?.avatarUrl) {
          setProfileAvatarUrl(response.data.avatarUrl);
        } else {
          setProfileAvatarUrl(null);
        }
      } catch (error) {
        console.error('Error loading profile avatar:', error);
        setProfileAvatarUrl(null);
      }
    };

    loadProfileAvatar();
  }, [userId, currentUser?.id]);

  // Handle avatar upload
  const handleAvatarClick = () => {
    if (isOwnProfile && avatarInputRef.current) {
      avatarInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Неподдерживаемый формат файла. Разрешены: JPEG, PNG, GIF, WebP');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер: 5MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/users/${currentUser.id}/profile/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.avatarUrl) {
        // Add timestamp to bust cache
        const newAvatarUrl = `${response.data.avatarUrl}?t=${Date.now()}`;
        setMyAvatarUrl(newAvatarUrl);
        setProfileAvatarUrl(newAvatarUrl);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Ошибка при загрузке аватарки');
    } finally {
      setAvatarUploading(false);
      // Reset file input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  // Get first letter of username for avatar
  const getAuthorLetter = (username) => {
    return username ? username.charAt(0).toUpperCase() : '?';
  };

  // Handle like/unlike
  const handleLike = async (postId, isCurrentlyLiked) => {
    try {
      await reactionService.toggleLike(postId, isCurrentlyLiked);
      // Update the post in the local state
      setUserPosts(prevPosts => prevPosts.map(post => {
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
      setUserPosts(prevPosts => prevPosts.map(post => {
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

  const handleFollowToggle = async () => {
    if (!userId || !currentUser?.id || followLoading) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollowUser(userId);
        setIsFollowing(false);
        // Update followers count
        const newStats = { ...stats, followersCount: Math.max(0, stats.followersCount - 1) };
        setStats(newStats);
        // Update cache
        const cacheKey = `userStats_${userId}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          ...newStats,
          cachedAt: Date.now(),
        }));
      } else {
        await followService.followUser(userId);
        setIsFollowing(true);
        // Update followers count
        const newStats = { ...stats, followersCount: stats.followersCount + 1 };
        setStats(newStats);
        // Update cache
        const cacheKey = `userStats_${userId}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          ...newStats,
          cachedAt: Date.now(),
        }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleHeaderAvatarClick = () => {
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
        if (followerId) {
          setShowNotifications(false);
          navigate(`/profile/${followerId}`);
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
        
        // Try to get avatar from notification data
        if (data.avatarUrl || data.avatar_url) {
          return data.avatarUrl || data.avatar_url;
        }
        
        // Try to get from cached users
        const notifUserId = data.follower_id || data.followerId || data.user_id || data.userId;
        if (notifUserId && notificationUsers[notifUserId]?.avatarUrl) {
          return notificationUsers[notifUserId].avatarUrl;
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
    <div className="profile-page">
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
                          src={`http://localhost:5002${getNotificationAvatarUrl(notification)}`}
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
            {myAvatarUrl ? (
              <img 
                src={`http://localhost:5002${myAvatarUrl}`} 
                alt="User Avatar" 
                className="header-user-avatar" 
                onClick={handleHeaderAvatarClick}
              />
            ) : (
              <div 
                className="header-user-avatar header-avatar-letter" 
                onClick={handleHeaderAvatarClick}
              >
                {currentUser?.username?.charAt(0).toUpperCase() || '?'}
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
          {myAvatarUrl ? (
            <img src={`http://localhost:5002${myAvatarUrl}`} alt="Avatar" className="sidebar-avatar" />
          ) : (
            <div className="sidebar-avatar sidebar-avatar-letter">
              {currentUser?.username?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
            <div className="sidebar-profile-info">
            <div className="sidebar-profile-name">{currentUser?.fullName || currentUser?.username || 'Пользователь'}</div>
            <div className="sidebar-profile-role">{currentUser?.username || ''}</div>
          </div>
        </Link>
        
        <nav className="sidebar-nav">
          <div className="sidebar-nav-link">Друзья</div>
          <div className="sidebar-nav-link">Музыка</div>
          <Link to="/" className="sidebar-nav-link">Лента</Link>
                 <Link to="/chat" className="sidebar-nav-link">
                   Сообщения
                   {unreadMessagesCount > 0 && (
                     <span className="unread-messages-badge">{unreadMessagesCount}</span>
                   )}
                 </Link>
        </nav>
      </aside>

      <main className="profile-content">
        <div className="profile-main-block">
          <div className="profile-cover">
            <img src="/profileimage.png" alt="Cover" className="profile-cover-image" />
          </div>
          {!isOwnProfile && !loading && (
            <button
              className={`profile-follow-button ${isFollowing ? 'following' : ''}`}
              onClick={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? 'Загрузка...' : isFollowing ? 'Отписаться' : isFollowingMe ? 'Подписаться в ответ' : 'Подписаться'}
            </button>
          )}
          <div className="profile-info-section">
            <div 
              className={`profile-avatar-container ${isOwnProfile ? 'editable' : ''}`}
              onClick={handleAvatarClick}
            >
              {profileAvatarUrl ? (
                <img 
                  src={`http://localhost:5002${profileAvatarUrl}`} 
                  alt="Profile Avatar" 
                  className="profile-main-avatar"
                  style={avatarUploading ? { filter: 'brightness(0.5)' } : {}}
                />
              ) : (
                <div 
                  className="profile-main-avatar profile-avatar-letter"
                  style={avatarUploading ? { filter: 'brightness(0.5)' } : {}}
                >
                  {displayUser?.username?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              {isOwnProfile && (
                <div className="profile-avatar-overlay">
                  <span className="profile-avatar-overlay-text">
                    {avatarUploading ? 'Загрузка...' : 'Изменить'}
                  </span>
                </div>
              )}
              <input
                type="file"
                ref={avatarInputRef}
                className="profile-avatar-input"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="profile-info-content">
              <div className="profile-main-info">
                {loading ? (
                  <div>Загрузка...</div>
                ) : (
                  <>
                    <div className="profile-main-name">{displayUser?.fullName || displayUser?.username || 'Пользователь'}</div>
                    <div className="profile-main-username">@{displayUser?.username || ''}</div>
                    <div className="profile-main-bio">Создаю 3D-миры и дизайн. Люблю играть с текстурами.</div>
                  </>
                )}
              </div>
              <div className="profile-main-stats">
                <div className="profile-stat-item">
                  <div className="profile-stat-number">{stats.postsCount}</div>
                  <div className="profile-stat-label">Публикации</div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-number">{stats.followersCount}</div>
                  <div className="profile-stat-label">Подписчики</div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-number">{stats.followingCount}</div>
                  <div className="profile-stat-label">Подписки</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="profile-posts-section">
          <h2 className="profile-posts-title">Публикации</h2>
          {postsLoading ? (
            <div className="profile-posts-loading">Загрузка...</div>
          ) : userPosts.length > 0 ? (
            userPosts.map(post => (
              <div key={post.id} className="profile-post-card">
                <div className="profile-post-header" onClick={() => navigate(`/profile/${post.authorId}`)} style={{ cursor: 'pointer' }}>
                  <div className="profile-post-avatar">
                    {getAuthorLetter(post.authorUsername)}
                  </div>
                  <div className="profile-post-meta">
                    <div className="profile-post-author">{post.authorUsername || 'Пользователь'}</div>
                    <div className="profile-post-date">
                      {new Date(post.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                {post.content && (
                  <div className="profile-post-content">{post.content}</div>
                )}
                {post.mediaUrl && post.mediaUrl.length > 0 && (
                  <img src={post.mediaUrl[0]} alt="Post" className="profile-post-image" />
                )}
                <div className="profile-post-actions">
                  <div 
                    className={`profile-post-action ${post.isLikedByCurrentUser ? 'liked' : ''}`}
                    onClick={() => handleLike(post.id, post.isLikedByCurrentUser)}
                  >
                    <img src="/like.png" alt="Like" className="profile-post-action-icon" />
                    <span>{post.reactionsCount || 0}</span>
                  </div>
                  <div 
                    className={`profile-post-action ${expandedComments === post.id ? 'active' : ''}`}
                    onClick={() => toggleComments(post.id)}
                  >
                    <img src="/comment.png" alt="Comment" className="profile-post-action-icon" />
                    <span>{post.commentsCount || 0}</span>
                  </div>
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
                              onClick={() => navigate(`/profile/${comment.authorId}`)}
                            >
                              {comment.authorUsername?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="comment-body">
                              <span 
                                className="comment-author"
                                onClick={() => navigate(`/profile/${comment.authorId}`)}
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
            <div className="profile-posts-empty">Публикаций пока нет</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;

