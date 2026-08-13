import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, XCircle, Menu, ExternalLink, MapPin, Maximize2 } from 'lucide-react';
import './App.css';
import { searchKnowledgeBase, mapImageNameToPath } from './data/knowledgeData';

// Components
import Sidebar from './components/Sidebar';
import BackgroundDecor from './components/BackgroundDecor';
import { chatApi } from './services/api';

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

function App() {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Chat States
  const [chatMessages, setChatMessages] = useState([
    { text: 'Привет! Я ВИТШик, твой ассистент по Высшей ИТ-школе КГУ. Задай мне любой вопрос об аудиториях, стипендиях, коворкинге или клубах! 🐱', sender: 'bot', isInitial: true }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestions = [
    'Где найти Б-209?',
    'Стипендии и ПГАС',
    'Клубы и объединения ВИТШ',
    'Где находится коворкинг?',
    'Где поесть рядом?'
  ];

  const playMeow = () => {
    try {
      const audio = new Audio('/meow.mp3');
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  // Mascot RAG Smart reply engine
  const getSmartReply = (message) => {
    const text = message.toLowerCase().trim();

    if (text.includes('мяу') || text.includes('котик') || text.includes('кот')) {
      playMeow();
      return 'Мяу! 🐱 Я цифровой житель ИВИТШ КГУ. Помогаю первакам найти аудитории и узнать про учёбу!';
    }
    
    // 1. First check real knowledge base of IVITSH KSU
    const ragResult = searchKnowledgeBase(text);
    if (ragResult) {
      return ragResult;
    }

    // 2. Fallbacks
    if (text.includes('расписание') || text.includes('пара') || text.includes('урок') || text.includes('заняти')) {
      return '### Расписание занятий\nАктуальное расписание занятий доступно в разделе «Путь первокурсника» (Быстрый доступ) или на портале ЕИОС: https://eios.kosgos.ru. Введите номер вашей группы на главном дашборде!';
    }
    if (text.includes('209') || text.includes('дирекц') || text.includes('секретар') || text.includes('декан')) {
      return '### Дирекция ИВИТШ\nДирекция ИВИТШ находится на **2 этаже Корпуса Б в кабинете Б-209**.\nГрафик работы: Пн–Пт с 9:00 до 17:00 (перерыв 12:00–13:00).\n\n[IMG:209.png]';
    }
    if (text.includes('стипенди') || text.includes('пгас') || text.includes('деньги')) {
      return '### Стипендии КГУ\n- **Академическая**: 3000 руб (сессия на «4» и «5») или 4500 руб (только «5»).\n- **ПГАС (Повышенная)**: от 5000 до 10000 руб за успехи в науке, спорте и творчестве.\n- **Социальная**: 2980 руб.';
    }

    return 'Извини, я не нашёл точного ответа в базе знаний ИВИТШ КГУ 😿 Попробуй спросить про аудитории (101-409), коворкинг, стипендии или объединения ИВИТШ!';
  };

  const handleSendMessage = async (text = inputValue) => {
    if (!isChatActive) return;
    const messageToSend = text.trim();
    if (!messageToSend) return;
    
    const userMessage = { text: messageToSend, sender: 'user' };
    const newHistory = [...chatMessages, userMessage];
    setChatMessages(newHistory);
    setInputValue('');
    setIsTyping(true);

    try {
      // Build history payload for GigaChat API
      const historyPayload = newHistory.slice(-4).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const data = await chatApi.sendMessage(messageToSend, historyPayload);
      if (data && data.reply) {
        setChatMessages(prev => [...prev, { text: data.reply, sender: 'bot' }]);
        setIsTyping(false);
        return;
      }
    } catch (e) {
      console.warn("GigaChat API call failed, falling back to local RAG:", e);
    }

    // Local RAG Fallback if API is offline
    setTimeout(() => {
      const replyText = getSmartReply(messageToSend);
      setChatMessages(prev => [...prev, { text: replyText, sender: 'bot' }]);
      setIsTyping(false);
    }, 600);
  };

  const startChat = () => {
    setChatMessages([{ text: 'Привет! Я ВИТШик, твой помощник. Чем могу помочь?', sender: 'bot', isInitial: true }]);
    setIsChatActive(true);
  };

  const endChat = () => {
    setIsChatActive(false);
    setChatMessages(prev => [...prev, { text: 'Чат завершен. Надеюсь, я смог помочь! Обращайся ещё 🐱', sender: 'bot', isSystem: true }]);
  };

  const renderLineParts = (text) => {
    // Regex to capture markdown bold text and URLs
    const regex = /(\*\*.*?\*\*|https?:\/\/\S+)/;
    
    return text.split(regex).map((part, pIndex) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <b key={pIndex}>{part.slice(2, -2)}</b>;
      }
      if (part.startsWith('http')) {
        return <a key={pIndex} href={part} target="_blank" rel="noopener noreferrer" className="chat-link">{part}</a>;
      }
      return part;
    });
  };

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

      {/* AI ASSISTANT PANEL */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div 
              className="chat-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
            />
            <motion.div 
              className="chat-window"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="chat-header">
                <div className="chat-header-user">
                  <div className="chat-avatar-mini" style={{ border: '2px solid white', background: 'white' }}>
                    <img src="/img/mascot.png" alt="Mascot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>ВИТШик</div>
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>{isChatActive ? 'Онлайн' : 'Офлайн'}</div>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                  <X size={20}/>
                </button>
              </div>

              {!isChatActive && (
                <div className="chat-overlay-start">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="start-chat-card"
                  >
                    <div className="start-chat-icon" style={{ border: '3px solid var(--primary)', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <img src="/img/mascot.png" alt="Mascot" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                    </div>
                    <h4>Готов поболтать?</h4>
                    <p>Нажми кнопку ниже, чтобы задать вопрос Айтишику</p>
                    <button onClick={startChat} className="btn-start-chat">Начать чат</button>
                  </motion.div>
                </div>
              )}
              
              <div className="chat-body">
                {chatMessages.map((msg, i) => {
                  if (msg.sender === 'user') {
                    return (
                      <div key={i} className="message-wrapper user">
                        <div className="message user">{msg.text}</div>
                      </div>
                    );
                  }

                  // Parse [IMG:...] tags in bot message
                  const imgMatch = msg.text.match(/\[IMG:(.*?)\]/);
                  const cleanText = msg.text
                    .replace(/\[IMG:(.*?)\]/g, '')
                    .replace(/\[SMILEY_.*?\]/gi, '')
                    .replace(/\[EMOJI_.*?\]/gi, '')
                    .replace(/\[TAG_.*?\]/gi, '')
                    .trim();
                  const imgPath = imgMatch ? mapImageNameToPath(imgMatch[1]) : '';

                  // Rich Markdown & Link Formatter
                  const formattedLines = cleanText.split('\n').map((line, lIdx) => {
                    let trimmed = line.trim();
                    if (!trimmed) return <div key={lIdx} style={{ height: '6px' }} />;

                    let isHeader = false;
                    if (trimmed.startsWith('###')) {
                      isHeader = true;
                      trimmed = trimmed.replace(/^###\s*/, '');
                    } else if (trimmed.startsWith('===')) {
                      isHeader = true;
                      trimmed = trimmed.replace(/^===\s*/, '').replace(/\s*===$/, '');
                    }

                    // Render inline bold and links
                    const parts = trimmed.split(/(\*\*.*?\*\*|https?:\/\/\S+)/).map((part, pIdx) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={pIdx} style={{ color: 'var(--primary)' }}>{part.slice(2, -2)}</strong>;
                      }
                      if (part.startsWith('http')) {
                        const cleanUrl = part.replace(/[<>]/g, '');
                        return (
                          <a 
                            key={pIdx} 
                            href={cleanUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              background: '#E8F4FF', 
                              color: 'var(--primary)', 
                              padding: '2px 8px', 
                              borderRadius: '6px', 
                              fontSize: '0.8rem', 
                              fontWeight: '700', 
                              textDecoration: 'none',
                              margin: '0 2px' 
                            }}
                          >
                            <span>{cleanUrl.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink size={12} />
                          </a>
                        );
                      }
                      return part;
                    });

                    if (isHeader) {
                      return (
                        <div key={lIdx} style={{ fontSize: '0.98rem', fontWeight: '800', color: 'var(--primary)', margin: '6px 0 2px 0' }}>
                          {parts}
                        </div>
                      );
                    }

                    return <div key={lIdx} style={{ margin: '2px 0' }}>{parts}</div>;
                  });

                  return (
                    <div key={i} className="message-wrapper bot">
                      <div className="chat-msg-avatar" style={{ border: '1px solid #dee2e6', background: 'white', cursor: 'pointer' }} onClick={playMeow}>
                        <img src="/img/mascot.png" alt="ВИТШик" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <div className="message bot" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ margin: 0, lineHeight: '1.45', fontSize: '0.88rem' }}>{formattedLines}</div>

                        {imgPath && (
                          <div 
                            style={{ 
                              position: 'relative', 
                              borderRadius: '12px', 
                              overflow: 'hidden', 
                              border: '1px solid rgba(0,127,255,0.2)',
                              cursor: 'pointer',
                              marginTop: '6px'
                            }}
                            onClick={() => setZoomedImage(imgPath)}
                          >
                            <img src={imgPath} alt="Схема аудитории" style={{ width: '100%', display: 'block', maxHeight: '180px', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Maximize2 size={12} /> Нажми для зума
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="message-wrapper bot">
                    <div className="chat-msg-avatar" style={{ border: '1px solid #dee2e6', background: 'white' }}>
                      <img src="/img/mascot.png" alt="Mascot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div className="message bot typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {isChatActive && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="suggestions-container"
                  >
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="suggestion-btn"
                      style={{ borderColor: '#ff4757', color: '#ff4757', display: 'flex', alignItems: 'center', gap: '5px' }}
                      onClick={endChat}
                    >
                      <XCircle size={14} /> Завершить сессию
                    </motion.button>
                    {suggestions.map((s, i) => (
                      <motion.button 
                        key={i} 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="suggestion-btn" 
                        onClick={() => handleSendMessage(s)}
                      >
                        {s}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="chat-footer" style={{ opacity: isChatActive ? 1 : 0.5, pointerEvents: isChatActive ? 'auto' : 'none' }}>
                <input 
                  type="text" 
                  placeholder={isChatActive ? "Задай вопрос про КГУ и ИВИТШ..." : "Начни чат, чтобы писать"} 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={!isChatActive}
                />
                <button onClick={() => handleSendMessage()} disabled={!isChatActive}><Send size={18}/></button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FULLSCREEN IMAGE ZOOM MODAL */}
      <AnimatePresence>
        {zoomedImage && (
          <div className="modal-overlay" onClick={() => setZoomedImage(null)} style={{ zIndex: 2000, background: 'rgba(0,0,0,0.85)' }}>
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
              <button 
                onClick={() => setZoomedImage(null)} 
                style={{ position: 'absolute', top: '-40px', right: '0', color: 'white', background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer' }}
              >
                ×
              </button>
              <img src={zoomedImage} alt="Увеличенная схема аудитории" style={{ width: '100%', height: '100%', maxH: '85vh', objectFit: 'contain', borderRadius: '12px' }} />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOAT CHAT TRIGGER ICON */}
      <motion.div 
        className="chat-toggle"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', overflow: 'hidden', padding: '6px' }}
      >
        <img 
          src="/img/mascot.png" 
          alt="ВИТШик" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          onError={(e) => { e.target.src = "/mascot.png"; }}
        />
      </motion.div>
    </div>
  );
}

export default App;
