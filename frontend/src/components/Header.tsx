import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          ⚡ AI Code Review
        </Link>

        <nav className="nav">
          <Link to="/">Главная</Link>
          <Link to="/problems">Задачи</Link>
          <Link to="/profile">Профиль</Link>

          {user ? (
            <>
              <span className="user-greeting">Привет, {user.username}</span>
              <button onClick={handleLogout} className="logout-btn">
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Вход</Link>
              <Link to="/register">Регистрация</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
