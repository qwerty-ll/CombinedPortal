import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'portal_cookie_notice';
// Bump when the set of cookies changes, so everyone sees the notice again
const NOTICE_VERSION = '1';

const wasDismissed = () => {
  try { return localStorage.getItem(STORAGE_KEY) === NOTICE_VERSION; } catch { return false; }
};

// Shown on every page until dismissed: the portal uses only the sign-in cookie, nothing to opt out of.
const CookieNotice = () => {
  const [open, setOpen] = useState(() => !wasDismissed());
  if (!open) return null;

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, NOTICE_VERSION); } catch { /* storage unavailable */ }
    setOpen(false);
  };

  return (
    <section className="cookie-notice" role="region" aria-label="Уведомление о cookie">
      <Cookie size={20} strokeWidth={1.75} aria-hidden="true" className="cookie-notice-icon" />
      <p className="cookie-notice-text">
        Портал использует одну cookie — для входа в аккаунт — и хранит настройки в вашем браузере.
        Рекламы и аналитики нет.{' '}
        <Link to="/privacy#cookies" className="cookie-notice-link">Подробнее</Link>
      </p>
      <button type="button" className="btn btn-primary btn-sm cookie-notice-ok" onClick={dismiss}>
        Понятно
      </button>
    </section>
  );
};

export default CookieNotice;
