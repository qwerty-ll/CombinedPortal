import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Send, CircleStop, ExternalLink, Maximize2, ArrowRight } from 'lucide-react';
import { chatApi } from '../services/api';
import { mapImageNameToPath } from '../utils/chatImages';
import { OPEN_CHAT_EVENT } from '../utils/chat';

const ICON = { strokeWidth: 1.75, 'aria-hidden': true };
const EASE = [0.16, 1, 0.3, 1];
const MOBILE_QUERY = '(max-width: 768px)';
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const playMeow = () => {
  try {
    const audio = new Audio('/sounds/meow.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => {});
  } catch {
    // Audio is optional
  }
};

// Mobile gets a bottom sheet, desktop a right-side panel.
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
};

// The group a visitor picked in the dashboard schedule: lets ВИТШик answer about pairs before signing in
const pickedGroupName = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('portal_sched_group'));
    return saved?.picked && typeof saved.name === 'string' ? saved.name : null;
  } catch { return null; }
};

const GREETING = 'Привет! Я ВИТШик. Спроси, где у тебя следующая пара, что завтра, как найти аудиторию или где сейчас преподаватель.';

// Floating mascot button and the chat panel with the ВИТШик assistant.
const ChatWidget = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  // Chat States
  const [chatMessages, setChatMessages] = useState([
    { text: GREETING, sender: 'bot', isInitial: true }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const isMobile = useIsMobile();

  // Pages open the chat through openChat() (utils/chat.js).
  useEffect(() => {
    const open = () => setIsChatOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, open);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, open);
  }, []);
  const toggleRef = useRef(null);
  const panelRef = useRef(null);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const startRef = useRef(null);
  const zoomCloseRef = useRef(null);
  const zoomReturnRef = useRef(null);
  const wasOpenRef = useRef(false);

  const suggestions = [
    'Где у меня следующая пара?',
    'Какие пары завтра?',
    'Как найти Б-407?',
    'Стипендии и ПГАС',
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
      const data = await chatApi.sendMessage(messageToSend, historyPayload, pickedGroupName());
      const actions = Array.isArray(data?.actions)
        ? data.actions.filter(a => typeof a?.to === 'string' && a.to.startsWith('/') && !a.to.startsWith('//'))
        : [];
      setChatMessages(prev => [...prev, { text: data?.reply || 'Не удалось получить ответ. Попробуй спросить иначе.', sender: 'bot', actions }]);
    } catch (e) {
      const text = e.status === 429
        ? e.message
        : 'ВИТШик сейчас не на связи. Попробуй ещё раз чуть позже или загляни в раздел FAQ.';
      setChatMessages(prev => [...prev, { text, sender: 'bot', isSystem: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startChat = () => {
    setChatMessages([{ text: GREETING, sender: 'bot', isInitial: true }]);
    setIsChatActive(true);
  };

  const endChat = () => {
    setIsChatActive(false);
    setChatMessages(prev => [...prev, { text: 'Чат завершён. Надеюсь, я смог помочь — обращайся ещё.', sender: 'bot', isSystem: true }]);
  };

  // Keep the newest message in view.
  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [chatMessages, isTyping, isChatOpen]);

  // Move focus into the panel when it opens or switches state; return it to the toggle on close.
  useEffect(() => {
    if (isChatOpen) {
      wasOpenRef.current = true;
      const target = isChatActive ? (isMobile ? panelRef.current : inputRef.current) : startRef.current;
      target?.focus({ preventScroll: true });
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      toggleRef.current?.focus({ preventScroll: true });
    }
  }, [isChatOpen, isChatActive]);

  useEffect(() => {
    if (zoomedImage) {
      zoomReturnRef.current = document.activeElement;
      zoomCloseRef.current?.focus();
    } else if (zoomReturnRef.current) {
      zoomReturnRef.current.focus?.({ preventScroll: true });
      zoomReturnRef.current = null;
    }
  }, [zoomedImage]);

  // Escape closes the zoomed image first, then the chat.
  useEffect(() => {
    if (!isChatOpen && !zoomedImage) return undefined;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (zoomedImage) setZoomedImage(null);
      else setIsChatOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isChatOpen, zoomedImage]);

  // Keep Tab focus inside the open dialog.
  const trapFocus = (e, container) => {
    if (e.key !== 'Tab' || !container) return;
    const items = [...container.querySelectorAll(FOCUSABLE)];
    if (items.length === 0) { e.preventDefault(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === container)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const renderBotMessage = (msg, i) => {
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
      if (!trimmed) return <div key={lIdx} className="chat-line-gap" aria-hidden="true" />;

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
          return <strong key={pIdx} className="chat-strong">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('http')) {
          const cleanUrl = part.replace(/[<>]/g, '');
          return (
            <a
              key={pIdx}
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="chat-link"
            >
              <span>{cleanUrl.replace(/^https?:\/\//, '')}</span>
              <ExternalLink size={12} {...ICON} />
              <span className="visually-hidden"> (откроется в новой вкладке)</span>
            </a>
          );
        }
        return part;
      });

      if (isHeader) {
        return <p key={lIdx} className="chat-line chat-line-heading">{parts}</p>;
      }

      return <p key={lIdx} className="chat-line">{parts}</p>;
    });

    return (
      <div key={i} className="message-wrapper bot">
        <button
          type="button"
          className="chat-msg-avatar"
          onClick={playMeow}
          tabIndex={-1}
          aria-label="Погладить ВИТШика"
        >
          <img src="/img/mascot-160.png" alt="" />
        </button>
        <div className="message bot">
          <div className="chat-text">{formattedLines}</div>

          {imgPath && (
            <button
              type="button"
              className="chat-image"
              onClick={() => setZoomedImage(imgPath)}
              aria-label="Открыть схему аудитории крупнее"
            >
              <img src={imgPath} alt="Схема аудитории" />
              <span className="chat-image-hint" aria-hidden="true">
                <Maximize2 size={12} strokeWidth={1.75} /> Увеличить
              </span>
            </button>
          )}

          {msg.actions?.length > 0 && (
            <div className="chat-actions">
              {msg.actions.map(action => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="btn btn-secondary btn-sm chat-action"
                  // The bottom sheet covers the page on phones; the side panel can stay open
                  onClick={() => { if (isMobile) setIsChatOpen(false); }}
                >
                  {action.label}
                  <ArrowRight size={14} {...ICON} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const panelMotion = isMobile
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
    : { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };

  return (
    <>
      {/* AI ASSISTANT PANEL */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div
              key="chat-backdrop"
              className="chat-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              onClick={() => setIsChatOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              key="chat-panel"
              id="chat-panel"
              ref={panelRef}
              className="chat-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="chat-title"
              tabIndex={-1}
              onKeyDown={(e) => trapFocus(e, panelRef.current)}
              {...panelMotion}
              transition={{ duration: 0.32, ease: EASE }}
            >
              <header className="chat-header">
                <span className="chat-avatar">
                  <img src="/img/mascot-160.png" alt="" />
                </span>
                <div className="chat-header-text">
                  <h2 id="chat-title" className="chat-title">ВИТШик</h2>
                  <p className="chat-status" data-online={isChatActive}>
                    {isChatActive ? 'Онлайн' : 'Офлайн'}
                  </p>
                </div>
                {isChatActive && (
                  <button type="button" className="btn btn-ghost btn-sm chat-end" onClick={endChat}>
                    <CircleStop size={16} {...ICON} />
                    Завершить чат
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-icon chat-close"
                  onClick={() => setIsChatOpen(false)}
                  aria-label="Закрыть чат"
                >
                  <X size={20} {...ICON} />
                </button>
              </header>

              <div
                ref={bodyRef}
                className="chat-body"
                role="log"
                aria-live="polite"
                aria-label="Переписка с ВИТШиком"
              >
                {chatMessages.map((msg, i) => {
                  if (msg.sender === 'user') {
                    return (
                      <div key={i} className="message-wrapper user">
                        <div className="message user">{msg.text}</div>
                      </div>
                    );
                  }
                  return renderBotMessage(msg, i);
                })}
                {isTyping && (
                  <div className="message-wrapper bot">
                    <span className="chat-msg-avatar" aria-hidden="true">
                      <img src="/img/mascot-160.png" alt="" />
                    </span>
                    <div className="message bot chat-typing" role="status">
                      <span className="chat-typing-dots" aria-hidden="true">
                        <span className="chat-typing-dot" />
                        <span className="chat-typing-dot" />
                        <span className="chat-typing-dot" />
                      </span>
                      <span className="visually-hidden">ВИТШик печатает ответ</span>
                    </div>
                  </div>
                )}
              </div>

              {isChatActive ? (
                <div className="chat-compose">
                  <div className="chat-suggestions" role="group" aria-label="Популярные вопросы">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className="chip"
                        onClick={() => handleSendMessage(s)}
                        disabled={isTyping}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <form
                    className="chat-form"
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      className="input"
                      placeholder="Задай вопрос про КГУ и ИВИТШ…"
                      aria-label="Сообщение ВИТШику"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      enterKeyHint="send"
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-icon chat-send"
                      aria-label="Отправить сообщение"
                      disabled={isTyping || !inputValue.trim()}
                    >
                      <Send size={18} {...ICON} />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="chat-start">
                  <h3 className="chat-start-title">Готов поболтать?</h3>
                  <p className="chat-start-text">Начни чат, чтобы спросить ВИТШика про пары, аудитории, преподавателей и студенческую жизнь.</p>
                  <button ref={startRef} type="button" onClick={startChat} className="btn btn-primary btn-block">
                    Начать чат
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FULLSCREEN IMAGE ZOOM MODAL */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            key="chat-zoom"
            className="modal-overlay chat-zoom"
            role="dialog"
            aria-modal="true"
            aria-label="Схема аудитории"
            onClick={() => setZoomedImage(null)}
            onKeyDown={(e) => { if (e.key === 'Tab') { e.preventDefault(); zoomCloseRef.current?.focus(); } }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <button
              ref={zoomCloseRef}
              type="button"
              className="btn btn-secondary btn-icon chat-zoom-close"
              onClick={() => setZoomedImage(null)}
              aria-label="Закрыть схему"
            >
              <X size={20} {...ICON} />
            </button>
            <img className="chat-zoom-image" src={zoomedImage} alt="Увеличенная схема аудитории" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOAT CHAT TRIGGER ICON */}
      <button
        ref={toggleRef}
        type="button"
        className="chat-toggle"
        onClick={() => setIsChatOpen(!isChatOpen)}
        aria-label={isChatOpen ? 'Закрыть чат с ВИТШиком' : 'Открыть чат с ВИТШиком'}
        aria-expanded={isChatOpen}
        aria-haspopup="dialog"
      >
        <img src="/img/mascot-160.png" alt="" />
      </button>
    </>
  );
};

export default ChatWidget;
