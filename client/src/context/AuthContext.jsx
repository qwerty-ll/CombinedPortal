import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = 'portal_auth_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } catch (e) {}
    }
  }, [user]);

  // Restore & verify session on app load
  useEffect(() => {
    import('../services/api').then(({ authApi }) => {
      authApi.getMe().then(res => {
        if (res && res.id) {
          const updatedUser = {
            id: res.id,
            username: res.username,
            fullName: res.full_name || res.username,
            group: res.group_number || '24-ИСбо-1',
            role: res.role || 'student',
            photoUrl: res.userpictureurl || '',
            isEiosAuth: true,
            courses: res.courses || []
          };
          setUser(updatedUser);
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
          } catch (e) {}
        }
      }).catch(err => {
        // Only clear session if backend explicitly rejects authentication (401 Unauthorized)
        if (err.message && (err.message.includes('401') | err.message.includes('авторизация'))) {
          console.info('[AuthContext] Session expired or invalid, clearing local state');
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem('portal_jwt_token');
        } else {
          console.warn('[AuthContext] Network warning on getMe, retaining cached user profile');
        }
      });
    }).catch(() => {});
  }, []);

  // Secure Authentication via EIOS KGU Backend API
  const login = async (loginInput, groupInput = '', passwordInput = '') => {
    try {
      const { authApi } = await import('../services/api');
      const res = await authApi.eiosLogin(loginInput.trim(), passwordInput, groupInput.trim());
      if (res && res.user) {
        if (res.access_token) {
          localStorage.setItem('portal_jwt_token', res.access_token);
        }
        const eiosUser = {
          id: res.user.id,
          username: res.user.username,
          fullName: res.user.full_name,
          group: res.user.group_number || groupInput.trim() || '24-ИСбо-1',
          role: res.user.role || 'student',
          photoUrl: res.user.userpictureurl || '',
          isEiosAuth: true,
          isSdoAuth: true,
          courses: res.user.courses || [],
          createdAt: new Date().toISOString()
        };
        setUser(eiosUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(eiosUser));
        return eiosUser;
      }
    } catch (err) {
      console.warn('[EIOS Auth] Login error:', err.message);
      return { error: err.message || 'Ошибка входа через ЭИОС КГУ. Проверьте логин и пароль' };
    }

    return { error: 'Не удалось авторизоваться через ЭИОС КГУ' };
  };

  // Secure Admin Authentication via Backend API Only
  const adminLogin = async (username, password) => {
    try {
      const { authApi } = await import('../services/api');
      const res = await authApi.adminLogin(username.trim(), password);
      if (res && res.user) {
        if (res.access_token) {
          localStorage.setItem('portal_jwt_token', res.access_token);
        }
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
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
        return adminUser;
      }
    } catch (err) {
      console.warn('[Admin Auth] Login error:', err.message);
      return { error: err.message || 'Неверный логин или пароль администратора' };
    }
    return { error: 'Ошибка входа в систему администрации' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('portal_jwt_token');
    import('../services/api').then(({ authApi }) => {
      authApi.logout().catch(() => {});
    }).catch(() => {});
  };

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

  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const isCurator = user?.role === 'curator';
  const canModerate = isAdmin || isModerator;

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn,
      isAdmin,
      isModerator,
      isCurator,
      canModerate,
      login,
      adminLogin,
      logout,
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
