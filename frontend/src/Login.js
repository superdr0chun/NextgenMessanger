// src/Login.js
import React from 'react';
import './Login.css'; // Подключим стили

function Login() {
  return (
    <div className="login-container">
      <div className="login-box">
        <h2>LOGIN</h2>
        
        <div className="input-group">
          <span className="icon">■</span>
          <input type="email" placeholder="Email" />
        </div>

        <div className="input-group">
          <span className="icon">■</span>
          <input type="password" placeholder="Password" />
        </div>

        <div className="button-group">
          <button className="btn primary">Войти</button>
          <button className="btn secondary">Зарегистрироваться</button>
        </div>

        <div className="forgot-password">
          <button type="button" className="forgot-password-button">
  Забыли пароль?
</button>
        </div>
      </div>
    </div>
  );
}

export default Login;