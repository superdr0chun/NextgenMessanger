// src/App.js
import React from 'react';
import MainPage from './MainPage'; // Импортируем наш компонент
import ChatPage from './components/ChatPage';

function App() {
  return (
    <div className="App">
      <ChatPage/>
    </div>
  );
}


export default App;