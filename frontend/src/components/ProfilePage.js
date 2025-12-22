// frontend/src/components/ProfilePage.js
import React from 'react';
import './ProfilePage.css'; // Создадим CSS файл позже

const ProfilePage = () => {
  // Данные профиля (пока статические, потом можно подтягивать с бэкенда)
  const userProfile = {
    avatar: 'https://via.placeholder.com/150', // Замените на реальный URL аватарки
    name: 'Марина Лазарева',
    username: '@Lazerina3D',
    bio: 'Создаю 3D-миры и дизайн. Люблю играть с текстурами.',
    email: 'marinadesign@gmail.com',
    stats: {
      publications: 14,
      subscribers: 92,
      subscriptions: 37
    },
    posts: [
      { id: 1, image: 'https://via.placeholder.com/200x200?text=Post+1' },
      { id: 2, image: 'https://via.placeholder.com/200x200?text=Post+2' },
      { id: 3, image: 'https://via.placeholder.com/200x200?text=Post+3' },
      { id: 4, image: 'https://via.placeholder.com/200x200?text=Post+4' },
      { id: 5, image: 'https://via.placeholder.com/200x200?text=Post+5' },
      { id: 6, image: 'https://via.placeholder.com/200x200?text=Post+6' },
      { id: 7, image: 'https://via.placeholder.com/200x200?text=Post+7' },
      { id: 8, image: 'https://via.placeholder.com/200x200?text=Post+8' }
    ]
  };

  return (
    <div className="profile-page">
      {/* Шапка профиля */}
      <div className="profile-header">
        <img src={userProfile.avatar} alt="Аватар" className="avatar" />
        <div className="profile-info">
          <h1>{userProfile.name}</h1>
          <p className="username">{userProfile.username}</p>
          <p className="bio">{userProfile.bio}</p>
          <p className="contact">Контакт: {userProfile.email}</p>
        </div>
        <div className="profile-stats">
          <div className="stat">
            <span className="stat-number">{userProfile.stats.publications}</span>
            <span className="stat-label">публикации</span>
          </div>
          <div className="stat">
            <span className="stat-number">{userProfile.stats.subscribers}</span>
            <span className="stat-label">подписчики</span>
          </div>
          <div className="stat">
            <span className="stat-number">{userProfile.stats.subscriptions}</span>
            <span className="stat-label">подписки</span>
          </div>
        </div>
      </div>

      {/* Навигация */}
      <div className="profile-nav">
        <button className="nav-item active">Publications</button>
        <button className="nav-item">About me</button>
        <button className="nav-item">Friends</button>
        <button className="nav-item">Photo</button>
        <button className="nav-item">Video</button>
      </div>

      {/* Галерея публикаций */}
      <div className="posts-grid">
        {userProfile.posts.map(post => (
          <div key={post.id} className="post-item">
            <img src={post.image} alt={`Пост ${post.id}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;