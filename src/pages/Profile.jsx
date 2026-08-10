import React, { useState, useEffect } from 'react';
import { Mail, GraduationCap, Award, Compass, MessageSquare, Star, CheckCircle2, Lock, RefreshCw, LogIn, Shield, LogOut, FileText, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Profile = () => {
  const { user, isLoggedIn, login, logout, setRole } = useAuth();
  const toast = useToast();

  // Login form states
  const [loginForm, setLoginForm] = useState({ fullName: '', group: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Load stats from localStorage
  const [onboardingCompleted, setOnboardingCompleted] = useState(0);
  const [checklistCompleted, setChecklistCompleted] = useState(0);
  const [forumQuestionsCount, setForumQuestionsCount] = useState(0);

  // Curator Feedback states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('onboarding_completed_tasks');
      if (savedTasks) setOnboardingCompleted(JSON.parse(savedTasks).length);
    } catch (e) { console.error(e); }

    try {
      const checklist = localStorage.getItem('freshman_checklist');
      if (checklist) {
        const parsed = JSON.parse(checklist);
        setChecklistCompleted(parsed.filter(item => item.checked).length);
      }
    } catch (e) { console.error(e); }

    try {
      const questions = localStorage.getItem('forum_questions');
      if (questions && user) {
        const parsed = JSON.parse(questions);
        setForumQuestionsCount(parsed.filter(q => q.author.userId === user.id).length);
      }
    } catch (e) { console.error(e); }
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    
    if (!loginForm.fullName.trim()) {
      setLoginError('Введите логин или ФИО');
      return;
    }

    const res = login(loginForm.fullName, loginForm.group, loginForm.password);
    if (res && res.error) {
      setLoginError(res.error);
      return;
    }

    toast.show(`Вы вошли как ${res.fullName}`, 'success');
    setLoginForm({ fullName: '', group: '', password: '' });
  };

  const handleLogout = () => {
    logout();
    toast.show('Вы вышли из аккаунта', 'info');
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    const roleNames = { student: 'Студент', moderator: 'Модератор', admin: 'Администратор' };
    toast.show(`Роль изменена: ${roleNames[newRole]}`, 'info');
  };

  const handleSendFeedback = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.show('Выберите оценку звёздами!', 'warning');
      return;
    }
    toast.show('Спасибо! Ваш отзыв отправлен.', 'success');
    setRating(0);
    setFeedbackText('');
  };

  const handleResetApp = () => {
    if (window.confirm('Вы действительно хотите сбросить весь прогресс?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // --- NOT LOGGED IN: SHOW LOGIN FORM ---
  if (!isLoggedIn) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Личный кабинет</h1>
        </div>

        <motion.div 
          className="login-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="login-card-header">
            <div className="login-icon-box">
              <LogIn size={32} />
            </div>
            <h2>Вход на портал</h2>
            <p>Авторизуйтесь для доступа к форуму и личному кабинету</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label>Логин или ФИО</label>
              <input 
                type="text"
                placeholder="student, admin или Иванов Иван"
                value={loginForm.fullName}
                onChange={e => setLoginForm({ ...loginForm, fullName: e.target.value })}
                required
              />
            </div>
            <div className="login-field">
              <label>Номер группы (опционально)</label>
              <input 
                type="text"
                placeholder="25-ИСбо-1"
                value={loginForm.group}
                onChange={e => setLoginForm({ ...loginForm, group: e.target.value })}
              />
            </div>
            <div className="login-field">
              <label>Пароль</label>
              <input 
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>

            {loginError && <div className="login-error">{loginError}</div>}

            <button type="submit" className="btn-auth login-submit">
              <Lock size={16} /> Войти
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // --- LOGGED IN: SHOW PROFILE ---
  return (
    <div className="container">
      <div className="page-header">
        <h1>Личный кабинет</h1>
      </div>

      <div className="profile-card-layout">
        
        {/* STUDENT CARD */}
        <motion.section 
          className="student-main-profile"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="student-avatar-box">
            <img 
              src={`/img/${user.photo || 'profile.png'}`} 
              alt={user.fullName}
              onError={(e) => { e.target.src = '/img/profile.png'; }}
            />
          </div>
          <div className="student-info-meta">
            <h2>{user.fullName}</h2>
            <span className="student-group-tag">{user.group}</span>
            <p>
              {user.role === 'admin' ? 'Администратор' : user.role === 'moderator' ? 'Модератор' : 'Студент'}
            </p>
            <button onClick={handleLogout} className="profile-logout-btn">
              <LogOut size={14} /> Выйти
            </button>
          </div>
        </motion.section>

        {/* ROLE SWITCHER (for demo) */}
        <motion.section 
          className="curator-profile-section"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Shield size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0 }}>Переключение роли (демо)</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#888', margin: '0 0 15px 0' }}>
            Для тестирования функционала портала. В реальной версии роли будут назначаться администратором.
          </p>
          <div className="role-switcher">
            {['student', 'moderator', 'admin'].map(role => (
              <button
                key={role}
                className={`role-switch-btn ${user.role === role ? 'active' : ''}`}
                onClick={() => handleRoleChange(role)}
              >
                {role === 'student' && '👤 Студент'}
                {role === 'moderator' && '🛡️ Модератор'}
                {role === 'admin' && '⚙️ Администратор'}
              </button>
            ))}
          </div>
        </motion.section>

        {/* PROGRESS STATISTICS */}
        <motion.section 
          className="profile-stats-grid"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-box-profile">
            <span><Award size={18} style={{ verticalAlign: 'text-bottom', marginRight: '5px', color: 'var(--primary)' }} /> Обучение приложению</span>
            <h2>{onboardingCompleted} / 7</h2>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>шагов пройдено на Главной</p>
          </div>
          
          <div className="stat-box-profile">
            <span><Compass size={18} style={{ verticalAlign: 'text-bottom', marginRight: '5px', color: 'var(--primary)' }} /> Чек-лист дел</span>
            <h2>{checklistCompleted} / 5</h2>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>задач отмечено в Гиде</p>
          </div>

          <div className="stat-box-profile">
            <span><MessageSquare size={18} style={{ verticalAlign: 'text-bottom', marginRight: '5px', color: 'var(--primary)' }} /> Вопросы на форуме</span>
            <h2>{forumQuestionsCount}</h2>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>тем создано вами</p>
          </div>
        </motion.section>

        {/* CURATOR FEEDBACK */}
        <motion.section 
          className="curator-profile-section"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3>Оценить куратора</h3>
          <p style={{ fontSize: '0.9rem', color: '#666', margin: '0 0 15px 0' }}>
            Оставьте отзыв о работе вашего куратора. Данные будут доступны администрации.
          </p>
          
          <div className="curator-rating-section">
            <div className="rating-stars-container">
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const isActive = starIndex <= (hoverRating || rating);
                return (
                  <button
                    key={starIndex}
                    type="button"
                    className={`star-icon-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setRating(starIndex)}
                    onMouseEnter={() => setHoverRating(starIndex)}
                    onMouseLeave={() => setHoverRating(0)}
                    title={`Оценить на ${starIndex} звёзд`}
                  >
                    <Star size={24} fill={isActive ? '#FFC107' : 'none'} />
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSendFeedback} className="curator-feedback-form">
              <textarea
                placeholder="Оставьте ваш отзыв о работе куратора..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                maxLength={500}
                required
              />
              <button type="submit" className="btn-send-feedback">
                Отправить отзыв
              </button>
            </form>
          </div>
        </motion.section>



        {/* RESET PROGRESS */}
        <motion.section 
          className="curator-profile-section"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
        >
          <h3>Сброс прогресса</h3>
          <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
            Вы можете сбросить все шаги обучения, чек-лист гида первокурсника и очистить локальные сохраненные данные.
          </p>
          <button onClick={handleResetApp} className="btn-auth" style={{ alignSelf: 'flex-start', background: '#E74C3C', color: 'white' }}>
            Сбросить прогресс приложения
          </button>
        </motion.section>

      </div>
    </div>
  );
};

export default Profile;
