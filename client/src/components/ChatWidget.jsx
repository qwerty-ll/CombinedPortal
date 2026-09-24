import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, XCircle, ExternalLink, Maximize2 } from 'lucide-react';
import { chatApi } from '../services/api';
import { mapImageNameToPath } from '../utils/chatImages';

const playMeow = () => {
  try {
    const audio = new Audio('/sounds/meow.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => {});
  } catch {
    // Audio is optional
  }
};

// Floating mascot button and the chat panel with the ВИТШик assistant.
const ChatWidget = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

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

  const handleSendMessage = async (text = inputValue) => {
    if (!isChatActive || isTyping) return;
    const messageToSend = text.trim();
    if (!messageToSend) return;
    
    if (/мяу|котик|(^|[^а-яё])кот([^а-яё]|$)/i.test(messageToSend)) playMeow();

    // Previous turns only: the backend adds the current question itself.
    const historyPayload = chatMessages
      .filter(m => !m.isInitial && !m.isSystem)
      .slice(-4)
      .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text.slice(0, 2000) }));

    setChatMessages(prev => [...prev, { text: messageToSend, sender: 'user' }]);
    setInputValue('');
    setIsTyping(true);

    try {
      const data = await chatApi.sendMessage(messageToSend, historyPayload);
      setChatMessages(prev => [...prev, { text: data?.reply || 'Не удалось получить ответ 😿', sender: 'bot' }]);
    } catch (e) {
      const text = e.status === 429
        ? e.message
        : 'ВИТШик сейчас не на связи 😿 Попробуй ещё раз чуть позже или загляни в раздел FAQ.';
      setChatMessages(prev => [...prev, { text, sender: 'bot', isSystem: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startChat = () => {
    setChatMessages([{ text: 'Привет! Я ВИТШик, твой помощник. Чем могу помочь?', sender: 'bot', isInitial: true }]);
    setIsChatActive(true);
  };

  const endChat = () => {
    setIsChatActive(false);
    setChatMessages(prev => [...prev, { text: 'Чат завершен. Надеюсь, я смог помочь! Обращайся ещё 🐱', sender: 'bot', isSystem: true }]);
  };

  return (
    <>
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
                  />
      </motion.div>
    </>
  );
};

export default ChatWidget;
