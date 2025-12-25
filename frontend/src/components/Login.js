// src/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Login.css';
import { authService } from '../services/authService';
import { useUser } from '../context/UserContext';

function Login() {
  const navigate = useNavigate();
  const { updateUser } = useUser();
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get('mode') === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Registration
        await authService.register(email, username, password, fullName || null);
        // After successful registration, login automatically
        await authService.login(email, password);
      } else {
        // Login
        await authService.login(email, password);
      }
      
      // User data is already loaded and saved in authService.login
      // Get it from the response or reload from API
      const userData = await authService.getCurrentUser();
      updateUser(userData);
      
      // Redirect to main page on success
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message || 
        (isRegister ? 'Ошибка при регистрации' : 'Неверный email или пароль')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Update mode when URL parameter changes
    setIsRegister(searchParams.get('mode') === 'register');
  }, [searchParams]);

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setEmail('');
    setPassword('');
    setUsername('');
    setFullName('');
    // Update URL without reload
    navigate(isRegister ? '/auth' : '/auth?mode=register', { replace: true });
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <div className="login-box">
          <h2 className="login-title">
            {isRegister ? 'РЕГИСТРАЦИЯ' : 'АВТОРИЗАЦИЯ'}
          </h2>
          
          {error && (
            <div className="login-error" style={{ 
              color: '#ff4444', 
              marginBottom: '15px', 
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="login-input-group">
              <span className="login-icon">✉</span>
              <input 
                type="email" 
                placeholder="Email" 
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {isRegister && (
              <>
                <div className="login-input-group">
                  <span className="login-icon">👤</span>
                  <input 
                    type="text" 
                    placeholder="Username" 
                    className="login-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="login-input-group">
                  <span className="login-icon">📝</span>
                  <input 
                    type="text" 
                    placeholder="Full Name (optional)" 
                    className="login-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="login-input-group">
              <span className="login-icon">🔒</span>
              <input 
                type="password" 
                placeholder="Password" 
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="login-button-group">
              <button 
                type="submit" 
                className="login-btn login-btn-primary"
                disabled={loading}
              >
                {loading ? 'Загрузка...' : (isRegister ? 'Зарегистрироваться' : 'Войти')}
              </button>
              <button 
                type="button" 
                className="login-btn login-btn-secondary"
                onClick={toggleMode}
                disabled={loading}
              >
                {isRegister ? 'Уже есть аккаунт?' : 'Создать аккаунт'}
              </button>
            </div>
          </form>

          {!isRegister && (
            <div className="login-forgot-password">
              <button type="button" className="login-forgot-password-button">
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
