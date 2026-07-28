import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, XCircle, Menu } from 'lucide-react';
import './App.css';

// Components
import Sidebar from './components/Sidebar';
import BackgroundDecor from './components/BackgroundDecor';

// Pages
import Dashboard from './pages/Dashboard';
import FreshmanGuide from './pages/FreshmanGuide';
import Forum from './pages/Forum';
import QuestionDetail from './pages/QuestionDetail';
import CampusMap from './pages/CampusMap';
import Teachers from './pages/Teachers';
import FaqPage from './pages/FaqPage';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';

function App() {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Chat States
  const [chatMessages, setChatMessages] = useState([
    { text: 'Привет! Я ВИТШик, твой помощник. Чем могу помочь?', sender: 'bot', isInitial: true }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestions = [
    'Где расписание?',
    'Где найти 209 кабинет?',
    'Про стипендию',
    'Кто мой куратор?',
    'Заселение в общежитие'
  ];

  // Mascot smart reply offline engine
  const getSmartReply = (message) => {
    const text = message.toLowerCase();
    
    if (text.includes('расписание') || text.includes('пара') || text.includes('урок') || text.includes('заняти')) {
      return 'Актуальное расписание занятий доступно в разделе «Путь первокурсника» (Быстрый доступ) или на портале ЕИОС. Введите номер вашей группы на главной странице для быстрого доступа!';
    }
    if (text.includes('209') || text.includes('дирекц') || text.includes('секретар') || text.includes('декан')) {
      return 'Дирекция ИВИТШ (кабинет секретарши, заказ справок) находится на <b>втором этаже в кабинете 209</b>. Секретарь работает по будням с 9:00 до 17:00.';
    }
    if (text.includes('стипенди') || text.includes('пгас') || text.includes('деньги')) {
      return 'Повышенная стипендия (ПГАС) выдается за достижения в учебной, спортивной, научной и творческой жизни. Подать документы можно в начале каждого семестра в деканат (209 каб). Подробности доступны на странице FAQ.';
    }
    if (text.includes('куратор')) {
      return 'Информацию о вашем кураторе можно найти в разделе «Личный кабинет» (Профиль). Если данные ещё не заполнены, обратитесь к администратору портала.';
    }
    if (text.includes('общежит') || text.includes('жиль')) {
      return 'Оформление общежития обычно проходит в конце августа. Вам понадобятся: паспорт, копия паспорта, медицинская справка 086-у и 4 фотографии 3х4. Инструкцию можно найти в чек-листе Гида.';
    }
    if (text.includes('привет') || text.includes('здравствуй') || text.includes('ку') || text.includes('hello')) {
      return 'Привет! Я ВИТШик, твой пушистый помощник по Высшей ИТ-школе. Могу подсказать про кабинеты, куратора, стипендию или расписание. Задавай вопросы!';
    }
    if (text.includes('мяу') || text.includes('кот') || text.includes('котик')) {
      return 'Мяу! 🐱 Я очень люблю кодить и помогать первокурсникам освоиться в нашей ИТ-школе!';
    }

    return 'Интересный вопрос! Я пока бета-версия ИИ-ассистента и не знаю точного ответа, но советую спросить ребят на Форуме или обратиться в дирекцию в кабинете 209!';
  };

  const handleSendMessage = async (text = inputValue) => {
    if (!isChatActive) return;
    const messageToSend = text.trim();
    if (!messageToSend) return;
    
    const userMessage = { text: messageToSend, sender: 'user' };
    setChatMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate thinking delay
    setTimeout(() => {
      const replyText = getSmartReply(messageToSend);
      const botReply = { text: replyText, sender: 'bot' };
      setChatMessages(prev => [...prev, botReply]);
      setIsTyping(false);
    }, 800);
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

      {/* SIDE NAVIGATION */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* MAIN CONTENT AREA */}
      <main className={`game-map ${isSidebarCollapsed ? 'expanded' : ''}`}>
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
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`message-wrapper ${msg.sender} ${msg.isSystem ? 'system' : ''}`}>
                    {msg.sender === 'bot' && !msg.isSystem && (
                      <div className="chat-msg-avatar" style={{ border: '1px solid #dee2e6', background: 'white' }}>
                        <img src="/img/mascot.png" alt="Mascot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                    <div className={`message ${msg.sender} ${msg.isSystem ? 'system' : ''}`}>
                      <div style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: msg.text }} />
                    </div>
                  </div>
                ))}
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
                  placeholder={isChatActive ? "Задай вопрос..." : "Начни чат, чтобы писать"} 
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

      {/* FLOAT CHAT TRIGGER ICON */}
      <motion.div 
        className="chat-toggle"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
      >
        <MessageCircle size={26} color="white" />
      </motion.div>
    </div>
  );
}

export default App;
