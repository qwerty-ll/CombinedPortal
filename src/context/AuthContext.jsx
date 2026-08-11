import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Abstract data access — when moving to a real DB, only this file changes
const AUTH_STORAGE_KEY = 'portal_auth_user';

const defaultUser = null;

const PREDEFINED_USERS = {
  admin: {
    id: 'admin-1',
    username: 'admin',
    fullName: 'Администратор Портала',
    group: 'Администрация ИВИТШ',
    role: 'admin',
    photoUrl: '',
  },
  moderator: {
    id: 'mod-1',
    username: 'moderator',
    fullName: 'Смирнов Алексей Владимирович',
    group: '24-ИСбо-1',
    role: 'moderator',
    photoUrl: '',
  },
  student: {
    id: 'stud-1',
    username: 'student',
    fullName: 'Иванов Иван Иванович',
    group: '24-ИСбо-1',
    role: 'student',
    photoUrl: '',
  }
};

const PREDEFINED_PASSWORDS = {
  admin: 'admin123',
  moderator: 'mod123',
  student: 'student123'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultUser;
    } catch {
      return defaultUser;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  // Login via SDO KGU with backend integration and demo fallback
  const login = async (loginInput, groupInput = '', passwordInput = '') => {
    const key = loginInput.trim().toLowerCase();

    // 1. Check if user entered a predefined demo username
    if (PREDEFINED_USERS[key]) {
      const expectedPassword = PREDEFINED_PASSWORDS[key];
      if (passwordInput && passwordInput.trim() !== expectedPassword) {
        return { error: `Неверный пароль. Для ${key} используйте ${expectedPassword}` };
      }
      const predefinedUser = {
        ...PREDEFINED_USERS[key],
        createdAt: new Date().toISOString()
      };
      setUser(predefinedUser);
      return predefinedUser;
    }

    // 2. Real SDO KGU Authentication via FastAPI Backend
    try {
      const { authApi } = await import('../services/api');
      const res = await authApi.sdoLogin(loginInput.trim(), passwordInput, groupInput.trim());
      if (res && res.user) {
        const sdoUser = {
          id: res.user.id,
          username: res.user.username,
          fullName: res.user.full_name,
          group: res.user.group_number || groupInput.trim() || '24-ИСбо-1',
          role: res.user.role || 'student',
          photoUrl: res.user.userpictureurl || '',
          sdoToken: res.user.sdo_token,
          courses: res.user.courses || [],
          createdAt: new Date().toISOString()
        };
        setUser(sdoUser);
        if (res.access_token) {
          localStorage.setItem('portal_jwt_token', res.access_token);
        }
        return sdoUser;
      }
    } catch (err) {
      console.warn('[SDO Auth] Real SDO Login failed or backend offline:', err.message);
      return { error: err.message || 'Ошибка подключения или неверный логин/пароль СДО КГУ' };
    }

    return { error: 'Не удалось получить данные профиля из СДО КГУ' };
  };

  const adminLogin = async (username, password) => {
    try {
      const { authApi } = await import('../services/api');
      const res = await authApi.adminLogin(username.trim(), password);
      if (res && res.user) {
        const adminUser = {
          id: res.user.id,
          username: res.user.username,
          fullName: res.user.full_name,
          group: res.user.group_number || 'Деканат ИВИТШ',
          role: res.user.role || 'admin',
          photoUrl: res.user.userpictureurl || '',
          createdAt: new Date().toISOString()
        };
        setUser(adminUser);
        if (res.access_token) {
          localStorage.setItem('portal_jwt_token', res.access_token);
        }
        return adminUser;
      }
    } catch (err) {
      console.warn('[Admin Auth] Login failed:', err.message);
      return { error: err.message || 'Неверный логин или пароль администратора' };
    }
    return { error: 'Ошибка входа в систему администрации' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('portal_jwt_token');
  };

  // Update fullName, group or avatar locally
  const updateUserProfile = (data = {}) => {
    if (user) {
      setUser({
        ...user,
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.group !== undefined ? { group: data.group } : {}),
        ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl } : {})
      });
    }
  };

  // Change role (for demo purposes)
  const setRole = (newRole) => {
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const canModerate = isAdmin || isModerator;

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn,
      isAdmin,
      isModerator,
      canModerate,
      login,
      logout,
      setRole,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
