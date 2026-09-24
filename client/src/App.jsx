import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { X, Menu } from 'lucide-react';
import './styles/index.css';

// Components
import Sidebar from './components/Sidebar';
import ChatWidget from './components/ChatWidget';

// Lazy Loaded Pages for Optimal Bundle Splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FreshmanGuide = lazy(() => import('./pages/FreshmanGuide'));
const Forum = lazy(() => import('./pages/Forum'));
const QuestionDetail = lazy(() => import('./pages/QuestionDetail'));
const CampusMap = lazy(() => import('./pages/CampusMap'));
const Teachers = lazy(() => import('./pages/Teachers'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// Route loading placeholder: page-shaped skeleton instead of a spinner
const PageLoader = () => (
  <div className="container" aria-busy="true" aria-label="Загрузка страницы">
    <span className="skeleton" style={{ width: '40%', height: '2.25rem' }} />
    <span className="skeleton" style={{ width: '100%', height: '10rem', marginTop: 'var(--space-8)' }} />
    <span className="skeleton" style={{ width: '100%', height: '6rem', marginTop: 'var(--space-4)' }} />
  </div>
);

import { scheduleDailyActivityReminder } from './utils/notifications';

function App() {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Scroll to top on route change & initialize daily notifications
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    scheduleDailyActivityReminder();
  }, [location.pathname]);

  // Close the mobile drawer on navigation and with Escape
  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setIsMobileMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <a className="skip-link" href="#main-content">Перейти к содержимому</a>

      {/* MOBILE APP BAR */}
      <header className="mobile-bar">
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="app-sidebar"
        >
          {isMobileMenuOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
        </button>
        <span className="mobile-bar-title">Портал ИВИТШ</span>
      </header>

      {isMobileMenuOpen && <div className="drawer-backdrop" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true" />}

      {/* SIDE NAVIGATION */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* MAIN CONTENT AREA */}
      <main id="main-content" className="app-main" tabIndex={-1}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/guide" element={<FreshmanGuide />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/question/:id" element={<QuestionDetail />} />
            <Route path="/map" element={<CampusMap />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </Suspense>
      </main>

      <ChatWidget />
    </div>
  );
}

export default App;
