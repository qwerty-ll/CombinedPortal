import React, { useState, useEffect } from 'react';
import { 
  Mail, GraduationCap, Award, Compass, MessageSquare, Star, CheckCircle2, 
  Lock, RefreshCw, LogIn, Shield, LogOut, FileText, Download, User, Camera, BookOpen, Edit3, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Profile = () => {
  const { user, isLoggedIn, login, logout, setRole, updateUserProfile } = useAuth();
  const toast = useToast();

  // Login form states
  const [loginForm, setLoginForm] = useState({ fullName: '', group: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

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
        setForumQuestionsCount(parsed.filter(q => q.author && (q.author.userId === user.id || q.author.name === user.fullName)).length);
      }
    } catch (e) { console.error(e); }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    if (!loginForm.fullName.trim()) {
      setLoginError('Введите логин СДО КГУ');
      setIsLoggingIn(false);
      return;
    }

    try {
      const res = await login(loginForm.fullName, loginForm.group, loginForm.password);
      if (res && res.error) {
        setLoginError(res.error);
        setIsLoggingIn(false);
        return;
      }

      toast.show(`Вы вошли через СДО как ${res.fullName}`, 'success');
      setLoginForm({ fullName: '', group: '', password: '' });
    } catch (err) {
      setLoginError(err.message || 'Ошибка подключения к СДО КГУ');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.show('Вы вышли из аккаунта СДО', 'info');
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.show('Размер файла не должен превышать 5МБ', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUserProfile({ photoUrl: reader.result });
        setAvatarLoadError(false);
        toast.show('Аватар обновлен', 'success');
      };
      reader.readAsDataURL(file);
    }
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

  // --- NOT LOGGED IN: SHOW SDO KGU LOGIN FORM ---
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
            <div className="login-icon-box" style={{ background: 'rgba(0,127,255,0.1)', color: 'var(--primary)' }}>
              <GraduationCap size={32} />
            </div>
            <h2>Вход через СДО КГУ</h2>
            <p>Авторизация через единый сервис sdo.kosgos.ru</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label>Логин СДО КГУ</label>
              <input 
                type="text"
                placeholder="Логин в sdo.kosgos.ru (напр. student)"
                value={loginForm.fullName}
                onChange={e => setLoginForm({ ...loginForm, fullName: e.target.value })}
                required
                disabled={isLoggingIn}
              />
            </div>
            <div className="login-field">
              <label>Номер группы (опционально)</label>
              <input 
                type="text"
                placeholder="24-ИСбо-1"
                value={loginForm.group}
                onChange={e => setLoginForm({ ...loginForm, group: e.target.value })}
                disabled={isLoggingIn}
              />
            </div>
            <div className="login-field">
              <label>Пароль СДО КГУ</label>
              <input 
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                disabled={isLoggingIn}
              />
            </div>

            {loginError && <div className="login-error">{loginError}</div>}

            <button type="submit" className="btn-auth login-submit" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <>Проверка в СДО КГУ...</>
              ) : (
                <>
                  <Lock size={16} /> Войти через СДО
                </>
              )}
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
          {/* Avatar Box with Stock Person Fallback */}
          <div className="student-avatar-box" style={{ position: 'relative' }}>
            {user.photoUrl && !avatarLoadError ? (
              <img 
                src={user.photoUrl} 
                alt={user.fullName}
                onError={() => setAvatarLoadError(true)}
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#E0F2FE',
                color: '#0369A1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}>
                <User size={40} />
              </div>
            )}
            
            {/* Upload Custom Photo Pill */}
            <label title="Сменить фото профиля" style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: 'var(--primary)',
              color: 'white',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}>
              <Camera size={13} />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div className="student-info-meta">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2>{user.fullName}</h2>
              {user.sdoToken && (
                <span style={{ background: '#E6F4EA', color: '#137333', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '8px', fontWeight: '800' }}>
                  ✓ СДО KOSGOS
                </span>
              )}
            </div>
            
            <span className="student-group-tag">{user.group}</span>

            <p>
              {user.role === 'admin' ? 'Администратор' : user.role === 'moderator' ? 'Модератор' : 'Студент ИВИТШ'}
            </p>

            <button onClick={handleLogout} className="profile-logout-btn">
              <LogOut size={14} /> Выйти из СДО
            </button>
          </div>
        </motion.section>

        {/* SDO COURSES (IF ENROLLED) */}
        {user.courses && user.courses.length > 0 && (
          <motion.section 
            className="curator-profile-section"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <GraduationCap size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ margin: 0 }}>Мои дисциплины в СДО КГУ</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {user.courses.map((course) => (
                <div 
                  key={course.id} 
                  style={{
                    background: '#F8F9FA',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #E9ECEF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text)' }}>{course.fullname}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#777' }}>{course.shortname}</div>
                  </div>
                  {course.progress !== undefined && (
                    <span style={{ background: 'rgba(0,127,255,0.1)', color: 'var(--primary)', fontWeight: '800', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '8px' }}>
                      {course.progress}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* REAL STATISTICS */}
        <motion.section 
          className="profile-stats-grid"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-box-profile">
            <span><BookOpen size={18} style={{ verticalAlign: 'text-bottom', marginRight: '5px', color: 'var(--primary)' }} /> Дисциплины в СДО</span>
            <h2>{user.courses ? user.courses.length : 0}</h2>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>курсов подключено в sdo.kosgos.ru</p>
          </div>
          
          <div className="stat-box-profile">
            <span><Compass size={18} style={{ verticalAlign: 'text-bottom', marginRight: '5px', color: 'var(--primary)' }} /> Чек-лист гида</span>
            <h2>{checklistCompleted} / 5</h2>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>задач отмечено в Гиде</p>
          </div>

          <div className="stat-box-profile">
            <span><MessageSquare size={18} style={{ verticalAlign: 'text-bottom', marginRight: '5px', color: 'var(--primary)' }} /> Темы на форуме</span>
            <h2>{forumQuestionsCount}</h2>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>сообщений создано вами</p>
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
          <h3>Сброс локальных данных</h3>
          <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
            Вы можете сбросить сохраненные чек-листы первокурсника и очистить временные данные приложения.
          </p>
          <button onClick={handleResetApp} className="btn-auth" style={{ alignSelf: 'flex-start', background: '#E74C3C', color: 'white' }}>
            Сбросить данные приложения
          </button>
        </motion.section>

      </div>
    </div>
  );
};

export default Profile;
