// Browser / PWA Notification Utility for Daily Activities & Adaptation Reminders

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendLocalNotification = (title, options = {}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const defaultOptions = {
    icon: '/img/mascot-160.png',
    badge: '/img/mascot-160.png',
    vibrate: [100, 50, 100],
    ...options
  };

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, defaultOptions);
      });
    } else {
      new Notification(title, defaultOptions);
    }
  } catch (err) {
    console.warn('Failed to dispatch notification:', err);
  }
};

export const scheduleDailyActivityReminder = () => {
  // Check if daily reminder was already sent today
  const lastSent = localStorage.getItem('ivitsh_last_daily_notif');
  const todayStr = new Date().toISOString().split('T')[0];

  if (lastSent === todayStr) {
    return;
  }

  // Schedule notification after 5 seconds of active session if permission granted
  setTimeout(async () => {
    const hasPermission = await requestNotificationPermission();
    if (hasPermission) {
      sendLocalNotification('ВИТШик напоминает! 🐱', {
        body: 'Не забудь проверить расписание занятий и отметить прохождение шагов адаптации на сегодня!',
        tag: 'daily-reminder'
      });
      localStorage.setItem('ivitsh_last_daily_notif', todayStr);
    }
  }, 5000);
};
