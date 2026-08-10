import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Info, MessageCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className={`faq-accordion-item ${isOpen ? 'active' : ''}`}>
    <button className="faq-accordion-trigger" onClick={onClick}>
      <span>{question}</span>
      <ChevronDown size={18} />
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div 
          className="faq-accordion-content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div dangerouslySetInnerHTML={{ __html: answer }} />
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const FaqPage = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  // Read FAQ from localStorage (dynamic data only)
  const faqItems = (() => {
    try {
      const saved = localStorage.getItem('portal_faq');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  })();

  return (
    <div className="container">
      <div className="page-header">
        <h1>Частые вопросы (FAQ)</h1>
      </div>

      {/* ACCORDIONS */}
      {faqItems.length > 0 ? (
        <div className="faq-accordions-group">
          {faqItems.map((item, idx) => (
            <FAQItem 
              key={item.id || idx}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === idx}
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state-card" style={{ background: 'white', borderRadius: '24px', padding: '50px 20px', textAlign: 'center', border: '1px solid #e9ecef', marginBottom: '30px' }}>
          <HelpCircle size={48} strokeWidth={1.5} style={{ color: '#aaa', marginBottom: '12px' }} />
          <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: '800' }}>Список частых вопросов пуст</h4>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#777' }}>Администратор может добавить вопросы через панель управления</p>
        </div>
      )}

      {/* FOOTER HELPER */}
      <div className="faq-help-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Info size={24} style={{ color: 'var(--primary)' }} />
          <h3>Не нашли ответ на свой вопрос?</h3>
        </div>
        <p>
          Наши студенты и кураторы часто делятся ответами на форуме. Посмотрите обсуждения или задайте свой собственный вопрос!
        </p>
        <div className="faq-help-buttons">
          <button 
            className="btn-faq-redirect secondary"
            onClick={() => navigate('/forum')}
          >
            Перейти на форум
          </button>
          <button 
            className="btn-faq-redirect primary"
            onClick={() => navigate('/forum')}
          >
            Задать вопрос
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
