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
    photo: 'profile.png',
  },
  moderator: {
    id: 'mod-1',
    username: 'moderator',
    fullName: 'Смирнов Алексей Владимирович',
    group: '24-ИСбо-1',
    role: 'moderator',
    photo: 'profile.png',
  },
  student: {
    id: 'stud-1',
    username: 'student',
    fullName: 'Иванов Иван Иванович',
    group: '25-ИСбо-1',
    role: 'student',
    photo: 'profile.png',
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

  // Login via SDO KGU stub with support for predefined demo accounts
  const login = (loginInput, groupInput = '', passwordInput = '') => {
    const key = loginInput.trim().toLowerCase();
    
    // Check if user entered a predefined username
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

    // Custom student login
    const newUser = {
      id: Date.now().toString(),
      fullName: loginInput.trim(),
      group: groupInput.trim() || '25-ИСбо-1',
      role: 'student',
      photo: 'profile.png',
      createdAt: new Date().toISOString()
    };
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    setUser(null);
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
      setRole
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
