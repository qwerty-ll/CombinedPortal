import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  PanelLeftClose, PanelLeftOpen, LayoutDashboard, Compass,
  MessageSquare, Map, UserSquare, HelpCircle, Users, Shield, LogIn, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ICON = { size: 20, strokeWidth: 1.75 };

const ROLE_LABEL = { admin: 'Администратор', moderator: 'Модератор', curator: 'Куратор' };

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isAdmin } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Главная', path: '/', icon: <LayoutDashboard {...ICON} /> },
    { id: 'guide', label: 'Путь первокурсника', path: '/guide', icon: <Compass {...ICON} /> },
    { id: 'forum', label: 'Форум', path: '/forum', icon: <MessageSquare {...ICON} /> },
    { id: 'map', label: 'Карта кампуса', path: '/map', icon: <Map {...ICON} /> },
    { id: 'teachers', label: 'Преподаватели', path: '/teachers', icon: <Users {...ICON} /> },
    { id: 'faq', label: 'Вопросы и ответы', path: '/faq', icon: <HelpCircle {...ICON} /> },
    { id: 'profile', label: 'Личный кабинет', path: '/profile', icon: <UserSquare {...ICON} /> },
  ];
  if (isAdmin) {
    menuItems.push({ id: 'admin', label: 'Панель управления', path: '/admin', icon: <Shield {...ICON} /> });
  }

  const goTo = (path) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  return (
    <aside
      id="app-sidebar"
      className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
      aria-label="Основная навигация"
    >
      <NavLink to="/" className="sidebar-brand" onClick={() => setIsMobileOpen(false)}>
        <img src="/img/mascot.png" alt="" className="sidebar-brand-mark" />
        <span className="sidebar-brand-text">Портал ИВИТШ</span>
      </NavLink>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
                onClick={() => setIsMobileOpen(false)}
              >
                {item.icon}
                <span className="sidebar-link-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {isLoggedIn ? (
          <button className="sidebar-user" onClick={() => goTo('/profile')} title={isCollapsed ? user.fullName : undefined}>
            <span className="sidebar-user-avatar">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <User size={18} strokeWidth={1.75} />
              )}
            </span>
            <span className="sidebar-user-info">
              <span className="sidebar-user-name">{user.fullName}</span>
              <span className="sidebar-user-role">{ROLE_LABEL[user.role] || 'Студент'}</span>
            </span>
          </button>
        ) : (
          <button className="btn btn-primary sidebar-login" onClick={() => goTo('/profile')} title={isCollapsed ? 'Войти через ЭИОС' : undefined}>
            <LogIn size={18} strokeWidth={1.75} />
            <span className="sidebar-link-label">Войти через ЭИОС</span>
          </button>
        )}

        <button
          className="sidebar-collapse"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
          title={isCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {isCollapsed ? <PanelLeftOpen {...ICON} /> : <PanelLeftClose {...ICON} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
