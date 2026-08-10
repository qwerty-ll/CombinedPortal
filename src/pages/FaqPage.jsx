import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Info, MessageCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_FAQS = [
  {
    id: 1,
    question: 'Где находится Дирекция Высшей ИТ-Школы (ИВИТШ)?',
    answer: 'Дирекция ИВИТШ КГУ расположена в <strong>Корпусе Б</strong> по адресу ул. Ивановская, 24а, кабинет <strong>Б-209</strong> на 2 этаже. График работы: Пн–Пт с 9:00 до 17:00 (перерыв 12:00–13:00).'
  },
  {
    id: 2,
    question: 'Как узнать свои академические стипендии и выплатные нормы?',
    answer: 'Академическая стипендия составляет 3000 руб за сессию на «4» и «5», и 4500 руб за сессию только на «5». Повышенная академическая стипендия (ПГАС) составляет от 5000 до 10000 руб. Заявления принимаются в кабинете Б-209.'
  },
  {
    id: 3,
    question: 'Где находится Коворкинг ИВИТШ?',
    answer: 'Коворкинг Высшей ИТ-школы находится на <strong>4-м этаже Корпуса Б</strong>. Там можно поработать за ноутбуком, обсудить командные проекты и подключиться к Wi-Fi.'
  },
  {
    id: 4,
    question: 'Какое расписание занятий у моей группы?',
    answer: 'Расписание занятий обновляется в системе ЭИОС КГУ по адресу <a href="https://eios.kosgos.ru/WebApp/#/Rasp/Group/8540" target="_blank" rel="noopener noreferrer">eios.kosgos.ru</a>.'
  }
];

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

  // Read FAQ from localStorage (or fallback to INITIAL_FAQS)
  const faqItems = (() => {
    try {
      const saved = localStorage.getItem('portal_faq');
      return (saved && JSON.parse(saved).length > 0) ? JSON.parse(saved) : INITIAL_FAQS;
    } catch { return INITIAL_FAQS; }
  })();

  return (
    <div className="container">
      <div className="page-header">
        <h1>Частые вопросы (FAQ)</h1>
      </div>

      {/* ACCORDIONS */}
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
