import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, X, Menu } from 'lucide-react';
import './App.css';

// Components
import Sidebar from './components/Sidebar';
import BackgroundDecor from './components/BackgroundDecor';
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

// Fallback Spinner Loader
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--primary)' }}>
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
      <MessageCircle size={32} />
    </motion.div>
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

  return (
    <div className="app-container">
      <BackgroundDecor />

      {/* MOBILE HEADER BUTTON */}
      <button className={`mobile-menu-toggle ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        {isMobileMenuOpen ? <X /> : <Menu />}
      </button>

      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 999
          }}
        />
      )}

      {/* SIDE NAVIGATION */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* MAIN CONTENT AREA */}
      <main className={`game-map ${isSidebarCollapsed ? 'expanded' : ''}`}>
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
