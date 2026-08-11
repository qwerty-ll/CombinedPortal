import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCheck, CalendarDays, HelpCircle, UserCheck2, 
  MapPin, MessageSquare, BellRing, ChevronRight, Zap, ExternalLink, Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ScheduleWidget from '../components/ScheduleWidget';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  
  // --- Schedule group input ---
  const [groupNumber, setGroupNumber] = useState(() => {
    return localStorage.getItem('portal_group_number') || '';
  });
  const [groupSaved, setGroupSaved] = useState(() => !!localStorage.getItem('portal_group_number'));

  const handleSaveGroup = (e) => {
    e.preventDefault();
    if (groupNumber.trim()) {
      localStorage.setItem('portal_group_number', groupNumber.trim());
      setGroupSaved(true);
    }
  };

  const handleResetGroup = () => {
    localStorage.removeItem('portal_group_number');
    setGroupNumber('');
    setGroupSaved(false);
  };

  // --- Announcements from localStorage (admin-managed only) ---
  const [announcements, setAnnouncements] = useState(() => {
    try {
      const saved = localStorage.getItem('portal_announcements');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [expandedAdIds, setExpandedAdIds] = useState([]);

  // Onboarding tasks definition
  const initialTasks = [
    { id: 'profile-curator', text: 'Зайти в личный кабинет', icon: <UserCheck size={18} />, route: '/profile' },
    { id: 'schedule', text: 'Посмотреть расписание', icon: <CalendarDays size={18} />, isScheduleTrigger: true },
    { id: 'faq', text: 'Посмотреть частые вопросы', icon: <HelpCircle size={18} />, route: '/faq' },
    { id: 'teachers', text: 'Посмотреть преподавателей', icon: <UserCheck2 size={18} />, route: '/teachers' },
    { id: 'map', text: 'Перейти в раздел карта', icon: <MapPin size={18} />, route: '/map' },
    { id: 'forum', text: 'Перейти в форум', icon: <MessageSquare size={18} />, route: '/forum' },
    { id: 'ads', text: 'Посмотреть объявления', icon: <BellRing size={18} />, isAdTrigger: true },
  ];

  const [completedTaskIds, setCompletedTaskIds] = useState(() => {
    try {
      const saved = localStorage.getItem('onboarding_completed_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('onboarding_completed_tasks', JSON.stringify(completedTaskIds));
  }, [completedTaskIds]);

  const handleTaskClick = (task) => {
    if (!completedTaskIds.includes(task.id)) {
      setCompletedTaskIds(prev => [...prev, task.id]);
    }
    
    if (task.route) {
      navigate(task.route);
    } else if (task.isScheduleTrigger) {
      const el = document.getElementById('schedule-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (task.isAdTrigger) {
      const el = document.getElementById('announcements-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleAdExpansion = (ad) => {
    if (!completedTaskIds.includes('ads')) {
      setCompletedTaskIds(prev => [...prev, 'ads']);
    }
    setExpandedAdIds(prev => 
      prev.includes(ad.id) ? prev.filter(id => id !== ad.id) : [...prev, ad.id]
    );
  };

  const completedCount = completedTaskIds.length;
  const progressPercent = Math.round((completedCount / initialTasks.length) * 100);

  // Greeting based on auth state (formats "Фамилия Имя Отчество" -> "Имя Фамилия" or full name)
  const greetingName = isLoggedIn
    ? (() => {
        const parts = (user.fullName || '').trim().split(/\s+/);
        if (parts.length >= 2) {
          return `${parts[1]} ${parts[0]}`; // e.g. "Макар Смирнов"
        }
        return user.fullName || user.username;
      })()
    : null;

  return (
    <div className="container">
      <div className="dashboard-container">
        
        {/* GREETING */}
        <section className="greeting-card">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {isLoggedIn ? (
              <>Привет, <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{greetingName}</span>! 👋</>
            ) : (
              <>Добро пожаловать на портал! 👋</>
            )}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            Хорошего дня и продуктивных занятий в Высшей ИТ-школе!
          </motion.p>
        </section>

        {/* ONBOARDING PROGRESS */}
        <motion.section 
          className="onboarding-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="onboarding-header">
            <h3>Обучение приложению</h3>
            <span className="progress-text">{completedCount} из {initialTasks.length} шагов выполнено</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <div className="onboarding-tasks">
            {initialTasks.map((task) => {
              const isCompleted = completedTaskIds.includes(task.id);
              return (
                <div 
                  key={task.id}
                  className={`onboarding-task-item ${isCompleted ? 'completed' : ''}`}
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="onboarding-task-left">
                    {task.icon}
                    <span>{task.text}</span>
                  </div>
                  <div className="onboarding-status-icon">
                    ✓
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* SCHEDULE SECTION WITH DIRECT EIOS API CLIENT */}
        <motion.section 
          id="schedule-section"
          className="schedule-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ScheduleWidget />
        </motion.section>

        {/* ANNOUNCEMENTS */}
        <motion.section 
          id="announcements-section"
          className="announcements-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2>Объявления</h2>
          <div className="announcements-list" style={{ marginTop: '15px' }}>
            {announcements.length > 0 ? (
              announcements.map((ad) => {
                const isExpanded = expandedAdIds.includes(ad.id);
                return (
                  <div 
                    key={ad.id} 
                    className={`announcement-card-item ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleAdExpansion(ad)}
                    style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div className="announcement-card-left">
                        <div className={`announcement-icon-box ${!ad.read ? 'unread' : ''}`}>
                          <BellRing size={20} />
                        </div>
                        <div className="announcement-details">
                          <h4>{ad.title}</h4>
                          <span>{ad.time}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!ad.read && <div className="unread-dot"></div>}
                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>
                          {isExpanded ? 'Свернуть' : 'Подробнее'}
                        </span>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="announcement-card-expanded-content">
                        <p style={{ margin: 0, color: 'var(--text)' }}>{ad.text}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="empty-state-card">
                <BellRing size={40} strokeWidth={1.5} />
                <h4>Объявлений пока нет</h4>
                <p>Администратор добавит объявления через панель управления</p>
              </div>
            )}
          </div>
        </motion.section>

        {/* QUICK ACTIONS */}
        <motion.section 
          className="actions-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2>Быстрые действия</h2>
          <div className="actions-grid-box" style={{ marginTop: '15px' }}>
            <div className="action-tile-btn" onClick={() => {
              if (!completedTaskIds.includes('faq')) {
                setCompletedTaskIds(prev => [...prev, 'faq']);
              }
              navigate('/faq');
            }}>
              <HelpCircle size={24} />
              <span>Частые вопросы</span>
              <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
            </div>

            <div className="action-tile-btn" onClick={() => {
              if (!completedTaskIds.includes('teachers')) {
                setCompletedTaskIds(prev => [...prev, 'teachers']);
              }
              navigate('/teachers');
            }}>
              <UserCheck2 size={24} />
              <span>Преподаватели</span>
              <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
            </div>

            <div className="action-tile-btn" onClick={() => {
              if (!completedTaskIds.includes('map')) {
                setCompletedTaskIds(prev => [...prev, 'map']);
              }
              navigate('/map');
            }}>
              <Zap size={24} />
              <span>Карта кампуса</span>
              <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
            </div>
          </div>
        </motion.section>

      </div>
    </div>
  );
};

export default Dashboard;
