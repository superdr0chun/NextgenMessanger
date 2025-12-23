// src/Login.js
import React from 'react';
import './Login.css';

function Login() {
  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <div className="login-box">
          <h2 className="login-title">АВТОРИЗАЦИЯ</h2>
          
          <div className="login-input-group">
            <span className="login-icon">✉</span>
            <input 
              type="email" 
              placeholder="Email" 
              className="login-input"
            />
          </div>

          <div className="login-input-group">
            <span className="login-icon">🔒</span>
            <input 
              type="password" 
              placeholder="Passwod" 
              className="login-input"
            />
          </div>

          <div className="login-button-group">
            <button className="login-btn login-btn-primary">Войти</button>
            <button className="login-btn login-btn-secondary">Создать аккаунт</button>
          </div>

          <div className="login-forgot-password">
            <button type="button" className="login-forgot-password-button">
              Forgot your password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
