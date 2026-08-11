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
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      // Verify JWT token with backend /api/v1/auth/me on app load
      import('../services/api').then(({ authApi }) => {
        authApi.getMe().then(res => {
          if (res && res.role) {
            setUser(prev => prev ? { ...prev, role: res.role, fullName: res.full_name || prev.fullName } : null);
          }
        }).catch(() => {
          // Token invalid or tampered -> clear session
          setUser(null);
          localStorage.removeItem('portal_jwt_token');
          localStorage.removeItem(AUTH_STORAGE_KEY);
        });
      }).catch(() => {});
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  // Secure Authentication via SDO KGU Backend API
  const login = async (loginInput, groupInput = '', passwordInput = '') => {
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
          isSdoAuth: true,
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
      console.warn('[SDO Auth] Login error:', err.message);
      return { error: err.message || 'Ошибка входа через СДО КГУ. Проверьте логин и пароль' };
    }

    return { error: 'Не удалось авторизоваться через СДО КГУ' };
  };

  // Secure Admin Authentication via Backend API Only
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
      console.warn('[Admin Auth] Login error:', err.message);
      return { error: err.message || 'Неверный логин или пароль администратора' };
    }
    return { error: 'Ошибка входа в систему администрации' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('portal_jwt_token');
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
