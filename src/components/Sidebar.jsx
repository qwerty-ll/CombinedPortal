import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronRight, ChevronLeft, LayoutDashboard, Compass, 
  MessageSquare, Map, UserSquare, HelpCircle, Users, Shield, LogIn, LogOut, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, isAdmin } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Главная', path: '/', icon: <LayoutDashboard size={20} /> },
    { id: 'guide', label: 'Путь первокурсника', path: '/guide', icon: <Compass size={20} /> },
    { id: 'forum', label: 'Форум студентов', path: '/forum', icon: <MessageSquare size={20} /> },
    { id: 'map', label: 'Карта кампуса', path: '/map', icon: <Map size={20} /> },
    { id: 'teachers', label: 'Преподаватели', path: '/teachers', icon: <Users size={20} /> },
    { id: 'faq', label: 'Вопросы и ответы', path: '/faq', icon: <HelpCircle size={20} /> },
    { id: 'profile', label: 'Личный кабинет', path: '/profile', icon: <UserSquare size={20} /> },
  ];

  // Add admin panel link if user is admin
  if (isAdmin) {
    menuItems.push({ id: 'admin', label: 'Панель управления', path: '/admin', icon: <Shield size={20} /> });
  }

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      <button 
        className="sidebar-toggle" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Развернуть" : "Свернуть"}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
      
      <div className="sidebar-header" onClick={() => handleNavigation('/')} style={{ cursor: 'pointer' }}>
        <h2>{isCollapsed ? "ИВИТШ" : "Портал ИВИТШ"}</h2>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <li 
                key={item.id}
                className={isActive ? 'active' : ''} 
                onClick={() => handleNavigation(item.path)} 
                title={item.label}
              >
                <div className="sidebar-icon-wrapper">{item.icon}</div>
                {!isCollapsed && <span>{item.label}</span>}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mini-profile at bottom */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          {isLoggedIn ? (
            <div className="sidebar-user-mini" onClick={() => handleNavigation('/profile')}>
              <div className="sidebar-user-avatar" style={{ overflow: 'hidden', background: '#E0F2FE', color: '#0369A1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', flexShrink: 0 }}>
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <User size={18} />
                )}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{/^\d{2}-[a-z0-9]+-\d+$/i.test((user.fullName || '').trim()) ? `Студент (${user.fullName.trim()})` : user.fullName}</span>
                <span className="sidebar-user-role">
                  {user.role === 'admin' ? 'Администратор' : user.role === 'moderator' ? 'Модератор' : 'Студент'}
                </span>
              </div>
            </div>
          ) : (
            <button className="sidebar-login-btn" onClick={() => handleNavigation('/profile')}>
              <LogIn size={16} />
              <span>Войти через СДО</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
