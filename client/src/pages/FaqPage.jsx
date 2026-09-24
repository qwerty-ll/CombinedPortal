import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { contentApi } from '../services/api';

const ICON = { strokeWidth: 1.75 };

const FAQItem = ({ id, question, answer, isOpen, onClick }) => {
  const buttonId = `faq-q-${id}`;
  const panelId = `faq-a-${id}`;
  return (
    <li className={`faq-item ${isOpen ? 'is-open' : ''}`}>
      <h2 className="faq-question">
        <button
          type="button"
          id={buttonId}
          className="faq-trigger"
          onClick={onClick}
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span>{question}</span>
          <ChevronDown size={20} {...ICON} className="faq-chevron" aria-hidden="true" />
        </button>
      </h2>
      {isOpen && (
        <motion.div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className="faq-answer"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="faq-answer-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(answer || '') }} />
        </motion.div>
      )}
    </li>
  );
};

const FaqPage = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const [faqItems, setFaqItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentApi.getFaq()
      .then(res => setFaqItems(Array.isArray(res) ? res : []))
      .catch(err => console.warn('FAQ load failed:', err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container cm-page faq-page">
      <header className="page-header">
        <div>
          <h1>Частые вопросы</h1>
          <p className="page-subtitle">Короткие ответы на то, что первокурсники спрашивают чаще всего.</p>
        </div>
      </header>

      {loading ? (
        <ul className="faq-list" aria-busy="true" aria-label="Загрузка вопросов">
          {[0, 1, 2].map(i => (
            <li key={i} className="faq-item faq-item-skeleton" aria-hidden="true">
              <span className="skeleton faq-skel" />
            </li>
          ))}
        </ul>
      ) : faqItems.length > 0 ? (
        <ul className="faq-list">
          {faqItems.map((item, idx) => (
            <FAQItem
              key={item.id || idx}
              id={item.id || idx}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === idx}
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            />
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <HelpCircle size={32} {...ICON} aria-hidden="true" />
          <h2 className="cm-empty-title">Список частых вопросов пока пуст</h2>
          <p>Администратор добавляет вопросы через панель управления. А пока спросите на форуме — там отвечают студенты и кураторы.</p>
        </div>
      )}

      {/* NOT FOUND AN ANSWER */}
      <section className="section faq-help" aria-labelledby="faq-help-heading">
        <h2 id="faq-help-heading">Не нашли ответ на свой вопрос?</h2>
        <p>
          Студенты и кураторы часто делятся ответами на форуме. Посмотрите обсуждения или задайте свой вопрос.
        </p>
        <div className="faq-help-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate('/forum')}>
            Задать вопрос
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/forum')}>
            Перейти на форум
          </button>
        </div>
      </section>
    </div>
  );
};

export default FaqPage;
