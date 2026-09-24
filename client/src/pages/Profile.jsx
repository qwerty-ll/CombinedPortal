import React, { useState, useEffect } from 'react';
import {
  GraduationCap, ShieldCheck, BadgeCheck, Compass, MessageSquare, CheckCircle2,
  LogIn, LogOut, User, Camera, AlertCircle, Clock, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adaptationApi, forumApi } from '../services/api';
import MiniGamesSection from '../components/MiniGamesSection';

const ICON = { strokeWidth: 1.75, 'aria-hidden': true };

const LOGIN_MODES = [
  { id: 'sdo', label: 'Студент ЭИОС КГУ', Icon: GraduationCap },
  { id: 'staff', label: 'Сотрудник ИВИТШ', Icon: ShieldCheck }
];

// Arrow-key navigation between role="tab" buttons (WAI-ARIA tabs pattern).
const handleTabsKeyDown = (e, ids, current, select, idPrefix) => {
  const idx = ids.indexOf(current);
  let next = null;
  if (e.key === 'ArrowRight') next = ids[(idx + 1) % ids.length];
  else if (e.key === 'ArrowLeft') next = ids[(idx - 1 + ids.length) % ids.length];
  else if (e.key === 'Home') next = ids[0];
  else if (e.key === 'End') next = ids[ids.length - 1];
  if (next === null) return;
  e.preventDefault();
  select(next);
  document.getElementById(`${idPrefix}${next}`)?.focus();
};

const Profile = () => {
  const { user, isLoggedIn, login, adminLogin, logout, updateUserProfile, sessionExpired } = useAuth();
  const toast = useToast();

  // Login form states
  const [loginMode, setLoginMode] = useState('sdo'); // 'sdo' | 'staff'
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  // Load stats from localStorage and API
  const [roadmapCompleted, setRoadmapCompleted] = useState(0);
  const [totalRoadmapSteps] = useState(9);
  const [forumQuestionsCount, setForumQuestionsCount] = useState(0);

  useEffect(() => {
    // Load roadmap progress from localStorage first
    try {
      const saved = localStorage.getItem('freshman_roadmap_completed');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRoadmapCompleted(parsed.length);
      }
    } catch (e) { console.error(e); }

    if (!user) return;

    // Server progress is authoritative; merge with steps done offline on this device.
    adaptationApi.getMyProgress().then(res => {
      if (res && Array.isArray(res.completed_steps)) {
        try {
          const localSteps = JSON.parse(localStorage.getItem('freshman_roadmap_completed') || '[]');
          setRoadmapCompleted(new Set([...localSteps, ...res.completed_steps]).size);
        } catch {
          setRoadmapCompleted(res.completed_steps.length);
        }
      }
    }).catch(() => {});

    forumApi.getQuestions('', '', 200, 0, user.id)
      .then(res => setForumQuestionsCount(Array.isArray(res) ? res.length : 0))
      .catch(() => {});
  }, [user?.id]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    if (!loginForm.username.trim()) {
      setLoginError(loginMode === 'sdo' ? 'Введите логин ЭИОС КГУ' : 'Введите логин администратора');
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

  const handleLogout = async () => {
    await logout();
    toast.show('Вы вышли из аккаунта', 'info');
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!file.type || !allowedMimeTypes.includes(file.type.toLowerCase())) {
      toast.show('Неподходящий формат. Загрузите изображение PNG, JPEG, JPG или WebP', 'warning');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.show('Файл больше 2 МБ. Выберите изображение поменьше', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      updateUserProfile({ photoUrl: reader.result });
      setAvatarLoadError(false);
      toast.show('Фото профиля обновлено (сохраняется только на этом устройстве)', 'success');
    };
    reader.readAsDataURL(file);
  };

  const selectLoginMode = (mode) => {
    setLoginMode(mode);
    setLoginError('');
  };

  // --- NOT LOGGED IN: SHOW LOGIN FORM WITH MODE SWITCHER ---
  if (!isLoggedIn) {
    const isStaff = loginMode === 'staff';
    const describedBy = [
      !isStaff ? 'login-password-hint' : null,
      loginError ? 'login-error' : null
    ].filter(Boolean).join(' ') || undefined;

    return (
      <div className="container profile-page">
        <header className="page-header">
          <div>
            <h1>Личный кабинет</h1>
            <p className="page-subtitle">
              Войдите, чтобы видеть свой путь адаптации, темы на форуме и мини-игры ВИТШика.
            </p>
          </div>
        </header>

        <section className="card login-card" aria-labelledby="login-title">
          <div
            className="segmented login-modes"
            role="tablist"
            aria-label="Способ входа"
            onKeyDown={(e) => handleTabsKeyDown(e, LOGIN_MODES.map(m => m.id), loginMode, selectLoginMode, 'login-tab-')}
          >
            {LOGIN_MODES.map(({ id, label, Icon }) => (
              <button
                key={id}
                id={`login-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={loginMode === id}
                aria-controls="login-panel"
                tabIndex={loginMode === id ? 0 : -1}
                className="segmented-item"
                onClick={() => selectLoginMode(id)}
              >
                <Icon size={16} {...ICON} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div id="login-panel" role="tabpanel" aria-labelledby={`login-tab-${loginMode}`}>
            <h2 id="login-title" className="login-title">
              {isStaff ? 'Вход для администрации ИВИТШ' : 'Вход через ЭИОС КГУ'}
            </h2>
            <p className="login-lead">
              {isStaff ? 'Служебная авторизация администраторов и деканата' : 'Единая авторизация студентов eios.kosgos.ru'}
            </p>

            <form onSubmit={handleLogin} className="login-form">
              <div className="field">
                <label className="field-label" htmlFor="login-username">
                  {isStaff ? 'Логин администратора' : 'Логин ЭИОС КГУ'}
                </label>
                <input
                  id="login-username"
                  className="input"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={isStaff ? 'Учётная запись деканата' : 'Например, 22-isbo-035'}
                  value={loginForm.username}
                  onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                  aria-describedby={loginError ? 'login-error' : undefined}
                  required
                  disabled={isLoggingIn}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="login-password">Пароль</label>
                <input
                  id="login-password"
                  className="input"
                  type="password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  aria-describedby={describedBy}
                  disabled={isLoggingIn}
                  required
                />
                {!isStaff && (
                  <p id="login-password-hint" className="field-hint">
                    Используется единый логин и пароль от аккаунта ЭИОС КГУ (eios.kosgos.ru).
                  </p>
                )}
              </div>

              {!loginError && sessionExpired && (
                <p className="login-alert login-alert-warning" role="status">
                  <Clock size={16} {...ICON} />
                  <span>Сессия истекла — войдите снова.</span>
                </p>
              )}
              {loginError && (
                <p id="login-error" className="login-alert" role="alert">
                  <AlertCircle size={16} {...ICON} />
                  <span>{loginError}</span>
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block login-submit"
                disabled={isLoggingIn}
                data-loading={isLoggingIn || undefined}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 size={16} className="spin-icon" {...ICON} />
                    Проверка авторизации…
                  </>
                ) : (
                  <>
                    <LogIn size={16} {...ICON} />
                    {isStaff ? 'Войти в админку' : 'Войти через ЭИОС'}
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    );
  }

  // --- LOGGED IN: SHOW PROFILE ---
  const roleLabel = user.role === 'admin' ? 'Администратор' : user.role === 'moderator' ? 'Модератор' : 'Студент ИВИТШ';
  const roadmapDone = roadmapCompleted >= totalRoadmapSteps;
  const roadmapRatio = Math.min(1, Math.max(0, roadmapCompleted / totalRoadmapSteps));

  return (
    <div className="container profile-page">
      <header className="page-header">
        <h1>Личный кабинет</h1>
      </header>

      <div className="profile-layout">
        {/* IDENTITY */}
        <section className="card profile-identity" aria-labelledby="profile-name">
          <div className="profile-identity-main">
            <div className="profile-avatar">
              {user.photoUrl && !avatarLoadError ? (
                <img src={user.photoUrl} alt="" onError={() => setAvatarLoadError(true)} />
              ) : (
                <User size={36} {...ICON} />
              )}
            </div>

            <div className="profile-identity-text">
              <h2 id="profile-name" className="profile-name">{user.fullName}</h2>
              <p className="profile-meta">
                {roleLabel}
                {user.group && <> · <span className="tabular">{user.group}</span></>}
              </p>
              {user.role !== 'admin' && (
                <span className="badge badge-success profile-verified" title="Аккаунт подтверждён через ЭИОС КГУ (eios.kosgos.ru)">
                  <BadgeCheck size={14} {...ICON} />
                  Подтверждено ЭИОС
                </span>
              )}
            </div>
          </div>

          <div className="profile-identity-actions">
            <div className="profile-photo">
              <label className="btn btn-secondary profile-photo-btn">
                <Camera size={16} {...ICON} />
                Сменить фото
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="visually-hidden"
                  aria-describedby="profile-photo-hint"
                />
              </label>
              <p id="profile-photo-hint" className="profile-photo-hint">
                PNG, JPEG или WebP до 2 МБ. Фото хранится только на этом устройстве.
              </p>
            </div>

            <button type="button" onClick={handleLogout} className="btn btn-secondary profile-logout">
              <LogOut size={16} {...ICON} />
              Выйти из аккаунта
            </button>
          </div>
        </section>

        <div className="profile-main">
          {/* REAL STATISTICS */}
          <section aria-labelledby="profile-activity-title">
            <div className="section-header">
              <h2 id="profile-activity-title">Активность</h2>
            </div>

            <ul className="card list profile-stats">
              <li className="list-row profile-stat">
                <span className="profile-stat-icon"><Compass size={20} {...ICON} /></span>
                <div className="profile-stat-body">
                  <div className="profile-stat-head">
                    <div className="profile-stat-text">
                      <span className="profile-stat-label">Путь адаптации</span>
                      <span className={`profile-stat-meta${roadmapDone ? ' is-done' : ''}`}>
                        {roadmapDone ? (
                          <><CheckCircle2 size={14} {...ICON} /> Все этапы пройдены</>
                        ) : (
                          'этапов пройдено'
                        )}
                      </span>
                    </div>
                    <span className="profile-stat-value tabular">
                      {roadmapCompleted} <span className="profile-stat-unit">из {totalRoadmapSteps}</span>
                    </span>
                  </div>
                  <div
                    className="progress"
                    role="progressbar"
                    aria-label="Пройдено этапов пути адаптации"
                    aria-valuemin={0}
                    aria-valuemax={totalRoadmapSteps}
                    aria-valuenow={Math.min(roadmapCompleted, totalRoadmapSteps)}
                  >
                    <div className="progress-value" style={{ transform: `scaleX(${roadmapRatio})` }} />
                  </div>
                </div>
              </li>

              <li className="list-row profile-stat">
                <span className="profile-stat-icon"><MessageSquare size={20} {...ICON} /></span>
                <div className="profile-stat-body">
                  <div className="profile-stat-head">
                    <div className="profile-stat-text">
                      <span className="profile-stat-label">Темы на форуме</span>
                      <span className="profile-stat-meta">созданы вами</span>
                    </div>
                    <span className="profile-stat-value tabular">{forumQuestionsCount}</span>
                  </div>
                </div>
              </li>
            </ul>
          </section>

          {/* ADAPTATION MINI-GAMES */}
          <MiniGamesSection />
        </div>
      </div>
    </div>
  );
};

export default Profile;
