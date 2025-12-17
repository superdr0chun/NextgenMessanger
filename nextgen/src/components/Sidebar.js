// src/components/Sidebar.js
import React from 'react';

const Sidebar = ({ activeItem, setActiveItem }) => {
  const menuItems = [
    { name: 'Новости', icon: '🏠' },
    { name: 'Авторизация', icon: '🔑' },
    { name: 'Мессенджер', icon: '💬' },
    { name: 'Друзья', icon: '👥' },
    { name: 'Мой профиль', icon: '👤' },
    { name: 'Музыка', icon: '🎵' },
  ];

  return (
    <div className="sidebar">
      {menuItems.map((item, index) => (
        <button
          key={index}
          className={`sidebar-item ${activeItem === item.name ? 'active' : ''}`}
          onClick={() => setActiveItem(item.name)}
        >
          <span className="icon">{item.icon}</span>
          <span className="text">{item.name}</span>
        </button>
      ))}
    </div>
  );
};

export default Sidebar;