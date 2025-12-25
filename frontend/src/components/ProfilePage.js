import React, { useState, useRef, useEffect } from 'react';
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

function ProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user: currentUser, clearUser } = useUser();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [stats, setStats] = useState({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Determine which user to display
  const displayUser = userId ? profileUser : currentUser;
  const isOwnProfile = !userId || userId === currentUser?.id;

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

  const handleAvatarClick = () => {
    setShowDropdown(!showDropdown);
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

      <aside className="main-sidebar">
        <Link to="/profile" className="sidebar-profile">
          <img src="/images/authimage.png" alt="Avatar" className="sidebar-avatar" />
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
          {!isOwnProfile && !loading && (
            <button
              className={`profile-follow-button ${isFollowing ? 'following' : ''}`}
              onClick={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? 'Загрузка...' : isFollowing ? 'Отписаться' : 'Подписаться'}
            </button>
          )}
          <div className="profile-main-left">
            <img src="/images/authimage.png" alt="Profile Avatar" className="profile-main-avatar" />
            <div className="profile-main-info">
              {loading ? (
                <div>Загрузка...</div>
              ) : (
                <>
                  <div className="profile-main-name">{displayUser?.fullName || displayUser?.username || 'Пользователь'}</div>
                  <div className="profile-main-username">@{displayUser?.username || ''}</div>
                  <div className="profile-main-bio">Создаю 3D-миры и дизайн. Люблю играть с текстурами.</div>
                  <div className="profile-main-contact">Контакт: {displayUser?.email || ''}</div>
                </>
              )}
            </div>
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
        
        <div className="profile-posts-block">
          <h2 className="profile-posts-title">Публикации</h2>
          {/* Публикации пользователя будут добавлены позже */}
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;

