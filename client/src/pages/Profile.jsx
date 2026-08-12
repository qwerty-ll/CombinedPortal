import React, { useState, useEffect } from 'react';
import { 
  Mail, GraduationCap, Award, Compass, MessageSquare, Star, CheckCircle2, 
  Lock, RefreshCw, LogIn, Shield, LogOut, FileText, Download, User, Camera, BookOpen, Edit3, Check, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import MiniGamesSection from '../components/MiniGamesSection';

const Profile = () => {
  const { user, isLoggedIn, login, adminLogin, logout, updateUserProfile } = useAuth();
  const toast = useToast();

  // Login form states
  const [loginMode, setLoginMode] = useState('sdo'); // 'sdo' | 'staff'
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
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
    
    if (!loginForm.username.trim()) {
      setLoginError(loginMode === 'sdo' ? 'Введите логин СДО КГУ' : 'Введите логин администратора');
      setIsLoggingIn(false);
      return;
    }

    try {
      let res;
      if (loginMode === 'staff') {
        res = await adminLogin(loginForm.username, loginForm.password);
      } else {
        res = await login(loginForm.username, '', loginForm.password);
      }

      if (res && res.error) {
        setLoginError(res.error);
        setIsLoggingIn(false);
        return;
      }

      toast.show(`Успешный вход: ${res.fullName}`, 'success');
      setLoginForm({ username: '', password: '' });
    } catch (err) {
      setLoginError(err.message || 'Ошибка авторизации');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.show('Вы вышли из аккаунта', 'info');
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!file.type || !allowedMimeTypes.includes(file.type.toLowerCase())) {
      toast.show('Ошибка формата! Разрешены только изображения PNG, JPEG, JPG и WebP', 'warning');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.show('Файл слишком большой! Максимальный размер 2МБ', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      updateUserProfile({ photoUrl: reader.result });
      setAvatarLoadError(false);
      toast.show('Фотография профиля успешно обновлена!', 'success');
    };
    reader.readAsDataURL(file);
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

  // --- NOT LOGGED IN: SHOW LOGIN FORM WITH MODE SWITCHER ---
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
          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', background: '#F1F3F5', padding: '4px', borderRadius: '14px', marginBottom: '20px', gap: '4px' }}>
            <button
              type="button"
              onClick={() => { setLoginMode('sdo'); setLoginError(''); }}
              style={{
                flex: 1,
                border: 'none',
                padding: '10px 14px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: loginMode === 'sdo' ? 'white' : 'transparent',
                color: loginMode === 'sdo' ? 'var(--primary)' : '#666',
                boxShadow: loginMode === 'sdo' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🎓 Студент ЭИОС КГУ
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('staff'); setLoginError(''); }}
              style={{
                flex: 1,
                border: 'none',
                padding: '10px 14px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: loginMode === 'staff' ? 'white' : 'transparent',
                color: loginMode === 'staff' ? '#059669' : '#666',
                boxShadow: loginMode === 'staff' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🛡️ Сотрудник ИВИТШ
            </button>
          </div>

          <div className="login-card-header">
            <div className="login-icon-box" style={{ background: loginMode === 'staff' ? 'rgba(5,150,105,0.1)' : 'rgba(0,127,255,0.1)', color: loginMode === 'staff' ? '#059669' : 'var(--primary)' }}>
              {loginMode === 'staff' ? <UserCheck size={32} /> : <GraduationCap size={32} />}
            </div>
            <h2>{loginMode === 'staff' ? 'Вход для Администрации ИВИТШ' : 'Вход через ЭИОС КГУ'}</h2>
            <p>{loginMode === 'staff' ? 'Служебная авторизация администраторов и деканата' : 'Единый сервис авторизации eios.kosgos.ru / sdo.kosgos.ru'}</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label>{loginMode === 'staff' ? 'Логин администратора' : 'Логин ЭИОС КГУ'}</label>
              <input 
                type="text"
                placeholder={loginMode === 'staff' ? 'Учетная запись деканата' : 'Логин учетной записи ЭИОС'}
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                required
                disabled={isLoggingIn}
              />
            </div>
            <div className="login-field">
              <label>Пароль</label>
              <input 
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                disabled={isLoggingIn}
                required
              />
            </div>

            {loginError && <div className="login-error">{loginError}</div>}

            <button type="submit" className="btn-auth login-submit" disabled={isLoggingIn} style={{ background: loginMode === 'staff' ? '#059669' : 'var(--primary)' }}>
              {isLoggingIn ? (
                <>Проверка авторизации...</>
              ) : (
                <>
                  <Lock size={16} /> {loginMode === 'staff' ? 'Войти в админку' : 'Войти через ЭИОС'}
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
              {user.isSdoAuth && (
                <span style={{ background: '#E6F4EA', color: '#137333', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '8px', fontWeight: '800' }}>
                  ✓ ЭИОС KOSGOS
                </span>
              )}
            </div>
            
            <span className="student-group-tag">{user.group}</span>

            <p>
              {user.role === 'admin' ? 'Администратор' : user.role === 'moderator' ? 'Модератор' : 'Студент ИВИТШ'}
            </p>

            <button onClick={handleLogout} className="profile-logout-btn">
              <LogOut size={14} /> Выйти из аккаунта
            </button>
          </div>
        </motion.section>



        {/* REAL STATISTICS */}
        <motion.section 
          className="profile-stats-grid"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-box-profile">
            <span><Compass size={18} style={{ verticalAlign: 'text-bottom', marginRight: '5px', color: 'var(--primary)' }} /> Чек-лист гида</span>
            <h2>{checklistCompleted} / 7</h2>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>задач отмечено в Гиде</p>
          </div>

          <div className="stat-box-profile">
            <span><MessageSquare size={18} style={{ verticalAlign: 'text-bottom', marginRight: '5px', color: 'var(--primary)' }} /> Темы на форуме</span>
            <h2>{forumQuestionsCount}</h2>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>сообщений создано вами</p>
          </div>
        </motion.section>

        {/* ADAPTATION MINI-GAMES */}
        <MiniGamesSection />
      </div>
    </div>
  );
};

export default Profile;
