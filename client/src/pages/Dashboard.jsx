import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HelpCircle, Users, Map, ChevronRight, ChevronDown, Circle, CheckCircle2, BellRing
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ScheduleWidget from '../components/ScheduleWidget';
import { contentApi } from '../services/api';

const ICON = { strokeWidth: 1.75, 'aria-hidden': true };

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

  // --- Announcements from backend (the API client keeps an offline copy) ---
  const [announcements, setAnnouncements] = useState([]);
  const [expandedAdIds, setExpandedAdIds] = useState([]);

  useEffect(() => {
    contentApi.getAnnouncements().then(res => {
      if (Array.isArray(res)) {
        setAnnouncements(res.map(a => ({
          id: a.id,
          title: a.title,
          text: a.content,
          important: !!a.is_important,
          time: new Date(a.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
        })));
      }
    }).catch(e => console.warn('Failed to load DB announcements on Dashboard:', e));
  }, []);

  // Onboarding tasks definition
  const initialTasks = [
    { id: 'profile-curator', text: 'Зайти в личный кабинет', route: '/profile' },
    { id: 'schedule', text: 'Посмотреть расписание', isScheduleTrigger: true },
    { id: 'faq', text: 'Посмотреть частые вопросы', route: '/faq' },
    { id: 'teachers', text: 'Посмотреть преподавателей', route: '/teachers' },
    { id: 'map', text: 'Перейти в раздел карта', route: '/map' },
    { id: 'forum', text: 'Перейти в форум', route: '/forum' },
    { id: 'ads', text: 'Посмотреть объявления', isAdTrigger: true },
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
    let nextTaskIds = completedTaskIds;
    if (!completedTaskIds.includes(task.id)) {
      nextTaskIds = [...completedTaskIds, task.id];
      setCompletedTaskIds(nextTaskIds);
      try {
        localStorage.setItem('onboarding_completed_tasks', JSON.stringify(nextTaskIds));
      } catch (e) {}
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
      const nextTaskIds = [...completedTaskIds, 'ads'];
      setCompletedTaskIds(nextTaskIds);
      try {
        localStorage.setItem('onboarding_completed_tasks', JSON.stringify(nextTaskIds));
      } catch (e) {}
    }
    setExpandedAdIds(prev =>
      prev.includes(ad.id) ? prev.filter(id => id !== ad.id) : [...prev, ad.id]
    );
  };

  const completedCount = completedTaskIds.length;
  const progressPercent = Math.round((completedCount / initialTasks.length) * 100);

  // Once every step is done the checklist folds into a one-line summary (presentation only)
  const isOnboardingComplete = completedCount >= initialTasks.length;
  const [showCompletedSteps, setShowCompletedSteps] = useState(false);
  const showSteps = !isOnboardingComplete || showCompletedSteps;

  // Quick links mark the matching onboarding step as done (navigation itself is the link)
  const markTaskDone = (taskId) => {
    if (!completedTaskIds.includes(taskId)) {
      setCompletedTaskIds(prev => [...prev, taskId]);
    }
  };

  const quickLinks = [
    { taskId: 'faq', to: '/faq', label: 'Частые вопросы', icon: HelpCircle },
    { taskId: 'teachers', to: '/teachers', label: 'Преподаватели', icon: Users },
    { taskId: 'map', to: '/map', label: 'Карта кампуса', icon: Map },
  ];

  // Greeting: a real "Фамилия Имя [Отчество]" becomes "Имя Фамилия"; anything else
  // (e.g. "Администратор ИВИТШ КГУ", "Студент 24-isbo-085") is shown as is.
  const greetingName = isLoggedIn
    ? (() => {
        const parts = (user.fullName || '').trim().split(/\s+/);
        const looksLikeFio = parts.length >= 2 && parts.length <= 3 && parts.every(w => /^[А-ЯЁ][а-яё]+(-[А-ЯЁ]?[а-яё]+)?$/.test(w));
        if (looksLikeFio) {
          return `${parts[1]} ${parts[0]}`; // e.g. "Макар Смирнов"
        }
        return user.fullName || user.username;
      })()
    : null;

  const todayLabel = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="container dash">
      {/* GREETING */}
      <header className="page-header dash-header">
        <div>
          <h1>{isLoggedIn ? `Привет, ${greetingName}` : 'Добро пожаловать на портал'}</h1>
          <p className="page-subtitle">
            Сегодня {todayLabel}. Хорошего дня и продуктивных занятий.
          </p>
        </div>
      </header>

      <div className="dash-grid">
        {/* SCHEDULE */}
        <section id="schedule-section" className="dash-main" aria-labelledby="schedule-title">
          <ScheduleWidget />
        </section>

        <div className="dash-aside">
          {/* ANNOUNCEMENTS */}
          <section id="announcements-section" className="card dash-card" aria-labelledby="announcements-title">
            <div className="dash-card-head">
              <h2 id="announcements-title">Объявления</h2>
            </div>

            {announcements.length > 0 ? (
              <ul className="list dash-rows">
                {announcements.map((ad) => {
                  const isExpanded = expandedAdIds.includes(ad.id);
                  const bodyId = `announcement-${ad.id}`;
                  return (
                    <li key={ad.id} className={`dash-ann ${isExpanded ? 'is-open' : ''}`}>
                      <h3 className="dash-ann-heading">
                        <button
                          type="button"
                          className="dash-row-btn dash-ann-toggle"
                          aria-expanded={isExpanded}
                          aria-controls={bodyId}
                          onClick={() => toggleAdExpansion(ad)}
                        >
                          <span className="dash-ann-text">
                            <span className="dash-ann-title">{ad.title}</span>
                            <span className="dash-ann-meta">
                              <span className="tabular">{ad.time}</span>
                              {ad.important && <span className="badge badge-warning">Важно</span>}
                            </span>
                          </span>
                          <ChevronDown size={18} className="dash-chevron" {...ICON} />
                        </button>
                      </h3>

                      {isExpanded && (
                        <div id={bodyId} className="dash-ann-body">
                          <p>{ad.text}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="dash-empty">
                <BellRing size={24} {...ICON} />
                <h3>Объявлений пока нет</h3>
                <p>Администратор добавит объявления через панель управления.</p>
              </div>
            )}
          </section>

          {/* ONBOARDING PROGRESS */}
          <section className="card dash-card dash-onboarding" aria-labelledby="onboarding-title">
            <div className="dash-card-head">
              <h2 id="onboarding-title">Обучение приложению</h2>
              <span className="dash-card-meta tabular">
                {completedCount} из {initialTasks.length}
                <span className="visually-hidden"> шагов выполнено</span>
              </span>
            </div>
            <div
              className="progress"
              role="progressbar"
              aria-labelledby="onboarding-title"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(progressPercent, 100)}
            >
              <div
                className="progress-value"
                style={{ transform: `scaleX(${Math.min(progressPercent, 100) / 100})` }}
              />
            </div>

            {isOnboardingComplete && (
              <div className="dash-onb-done">
                <p>Все шаги пройдены.</p>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  aria-expanded={showCompletedSteps}
                  aria-controls="onboarding-steps"
                  onClick={() => setShowCompletedSteps(v => !v)}
                >
                  {showCompletedSteps ? 'Скрыть шаги' : 'Показать шаги'}
                  <ChevronDown size={16} className="dash-chevron" {...ICON} />
                </button>
              </div>
            )}

            {showSteps && (
              <ul id="onboarding-steps" className="list dash-rows dash-onb-list">
                {initialTasks.map((task) => {
                  const isCompleted = completedTaskIds.includes(task.id);
                  return (
                    <li key={task.id}>
                      <button
                        type="button"
                        className={`dash-row-btn dash-onb-row ${isCompleted ? 'is-done' : ''}`}
                        onClick={() => handleTaskClick(task)}
                      >
                        {isCompleted
                          ? <CheckCircle2 size={20} className="dash-onb-status" {...ICON} />
                          : <Circle size={20} className="dash-onb-status" {...ICON} />}
                        <span className="dash-row-label">
                          {task.text}
                          {isCompleted && <span className="visually-hidden"> — выполнено</span>}
                        </span>
                        <ChevronRight size={16} className="dash-row-arrow" {...ICON} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* QUICK LINKS */}
          <nav className="card dash-card" aria-labelledby="quick-links-title">
            <div className="dash-card-head">
              <h2 id="quick-links-title">Быстрые ссылки</h2>
            </div>
            <ul className="list dash-rows">
              {quickLinks.map(({ taskId, to, label, icon: Icon }) => (
                <li key={to}>
                  <Link to={to} className="dash-row-btn dash-link-row" onClick={() => markTaskDone(taskId)}>
                    <Icon size={18} className="dash-row-icon" {...ICON} />
                    <span className="dash-row-label">{label}</span>
                    <ChevronRight size={16} className="dash-row-arrow" {...ICON} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
