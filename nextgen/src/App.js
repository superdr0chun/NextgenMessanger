// src/App.js
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Feed from './components/Feed';

function App() {
  const [activeItem, setActiveItem] = useState('Новости');

  return (
    <div className="app-container">
      <div className="main-content">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="content-area">
          <Header />
          <Feed />
        </div>
      </div>

      {/* Стили встроены для удобства */}
      <style jsx>{`
        .app-container {
          width: 100%;
          max-width: 1200px;
          background: rgba(31, 30, 30, 0.08);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          display: flex;
          min-height: 80vh;
        }

        .main-content {
          display: flex;
          width: 100%;
        }

        .sidebar {
          width: 80px;
          background: rgba(0, 0, 0, 0.3);
          padding: 20px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        .sidebar-item {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          padding: 0;
        }

        .sidebar-item:hover,
        .sidebar-item.active {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }

        .sidebar-item .text {
          font-size: 0.7rem;
          margin-top: 5px;
        }

        .content-area {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 15px;
          margin-bottom: 20px;
        }

        .search-bar input {
          width: 100%;
          padding: 10px 15px;
          border-radius: 20px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 1rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
        }

        .user-info .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .feed {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 15px;
          padding: 20px;
        }

        .feed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .feed-header h2 {
          color: white;
          font-size: 1.5rem;
        }

        .tabs button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          padding: 8px 15px;
          border-radius: 20px;
          margin-left: 10px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .tabs button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .post {
          background: rgba(20, 20, 20, 0.14);
          border-radius: 15px;
          padding: 15px;
          margin-bottom: 20px;
          transition: transform 0.3s;
        }

        .post:hover {
          transform: translateY(-5px);
        }

        .post-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .author-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .author-info strong {
          color: white;
        }

        .author-info span {
          color: #aaa;
          font-size: 0.8rem;
        }

        .post-content p {
          color: white;
          margin: 10px 0;
        }

        .post-content img {
          width: 100%;
          border-radius: 10px;
          margin-top: 10px;
        }

        .post-actions {
          display: flex;
          gap: 20px;
          margin-top: 15px;
        }

        .post-actions button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .post-actions button:hover {
          color: #00ffcc;
        }

        /* Адаптив */
        @media (max-width: 768px) {
          .app-container {
            flex-direction: column;
            border-radius: 15px;
          }

          .sidebar {
            width: 100%;
            flex-direction: row;
            padding: 10px;
            gap: 10px;
            overflow-x: auto;
          }

          .sidebar-item {
            width: 60px;
            height: 60px;
            font-size: 1rem;
          }

          .sidebar-item .text {
            font-size: 0.8rem;
          }

          .content-area {
            padding: 10px;
          }

          .header {
            flex-direction: column;
            gap: 10px;
          }

          .search-bar input {
            width: 100%;
          }

          .feed-header {
            flex-direction: column;
            gap: 10px;
          }

          .tabs {
            flex-wrap: wrap;
            gap: 5px;
          }

          .tabs button {
            padding: 6px 10px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}

export default App;