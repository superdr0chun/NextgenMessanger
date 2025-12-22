// src/App.js
import React from 'react';
import MainPage from './MainPage'; // Импортируем наш компонент
import ChatPage from './ChatPage';
import ProfilePage from './ProfilePage';

function App() {
  return (
    <div className="App">
      <ChatPage/>
    </div>
  );
}


export default App;