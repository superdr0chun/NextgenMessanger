// src/components/Header.js
import React from 'react';

const Header = () => {
  return (
    <div className="header">
      <div className="search-bar">
        <input type="text" placeholder="🔍 Поиск..." />
      </div>
      <div className="user-info">
        <div className="avatar">👤</div>
        <span>@username</span>
      </div>
    </div>
  );
};

export default Header;