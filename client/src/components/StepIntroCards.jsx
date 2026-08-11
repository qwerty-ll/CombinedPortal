import React from 'react';
import { motion } from 'framer-motion';
import { Route, Bot, Sparkles, Zap, GraduationCap, Map, HelpCircle } from 'lucide-react';

export function StepFoundation({ onComplete }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', borderRadius: '20px', padding: '20px', color: 'white', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 8px 24px rgba(0,127,255,0.2)' }}>
        <img src="/img/mascot.png" alt="ВИТШик" style={{ width: '64px', height: '64px', objectFit: 'contain', flexShrink: 0 }} />
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Этап 1 · Основа</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '2px 0 0 0' }}>Добро пожаловать в ИВИТШ!</h2>
          <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0', opacity: 0.9 }}>Я ВИТШик — твой персональный гид по студенческой жизни Высшей ИТ-школы КГУ.</p>
        </div>
      </div>

      {/* Cards */}
      {[
        { emoji: '🎓', title: 'Что такое этот портал?', text: 'Адаптационный портал поможет тебе освоиться в университете: узнать расписание, найти нужные кабинеты и познакомиться с жизнью факультета.' },
        { emoji: '🗺️', title: 'Как это работает?', text: 'Проходи этапы по порядку — каждый открывает новый раздел. Выполняй задания, исследуй кампус и зарабатывай достижения.' },
        { emoji: '🤝', title: 'Ты не один!', text: 'Рядом всегда есть ВИТШик. Он подскажет, поддержит и даже расскажет студенческие приметы на удачу.' }
      ].map((card, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid rgba(0, 127, 255, 0.1)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{card.emoji}</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text)' }}>{card.title}</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#666', lineHeight: '1.4' }}>{card.text}</p>
          </div>
        </motion.div>
      ))}

      <button onClick={onComplete} className="btn-auth" style={{ width: '100%', marginTop: '10px' }}>
        Завершить этап и открыть следующий →
      </button>
    </div>
  );
}

export function StepRoadmap({ onComplete }) {
  const steps = [
    { num: 1, color: '#007AFF', label: 'Основа', desc: 'Знакомство с порталом и ВИТШиком' },
    { num: 2, color: '#5856D6', label: 'Маршрут', desc: 'Понимаешь, как устроен путь адаптации' },
    { num: 3, color: '#AF52DE', label: 'Чат-бот', desc: 'Учишься задавать вопросы ВИТШику' },
    { num: 4, color: '#FF9500', label: 'Тест знаний', desc: 'Проверяешь, что уже знаешь о КГУ' },
    { num: 5, color: '#34C759', label: 'Чек-лист', desc: 'Отмечаешь важные дела первокурсника' },
    { num: 6, color: '#FF2D55', label: 'Карта кампуса', desc: 'Изучаешь планы этажей корпуса Б' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ background: 'linear-gradient(135deg, #5856D6 0%, #AF52DE 100%)', borderRadius: '20px', padding: '20px', color: 'white' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Этап 2 · Маршрут</span>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '2px 0 0 0' }}>Твой путь адаптации</h2>
        <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0', opacity: 0.9 }}>Каждый этап — это шаг вперёд. Пройди их по порядку:</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #eee' }}>
        {steps.map((step) => (
          <div key={step.num} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0 }}>
              {step.num}
            </div>
            <div>
              <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800' }}>{step.label}</h5>
              <span style={{ fontSize: '0.78rem', color: '#888' }}>{step.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onComplete} className="btn-auth" style={{ width: '100%', marginTop: '10px' }}>
        Завершить этап и открыть следующий →
      </button>
    </div>
  );
}

export function StepChatbot({ onComplete }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ background: 'linear-gradient(135deg, #AF52DE 0%, #FF2D55 100%)', borderRadius: '20px', padding: '20px', color: 'white', display: 'flex', gap: '14px', alignItems: 'center' }}>
        <Bot size={40} />
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Этап 3 · Чат-бот</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '2px 0 0 0' }}>ВИТШик всегда на связи</h2>
          <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0', opacity: 0.9 }}>Твой ассистент знает всё про аудитории Корпуса Б, расписание, стипендии и коворкинг!</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid rgba(0,127,255,0.1)' }}>
        <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Пример диалога с ботом</h5>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ alignSelf: 'flex-end', background: 'var(--primary)', color: 'white', padding: '8px 12px', borderRadius: '12px 12px 2px 12px', fontSize: '0.85rem' }}>
            Где находится дирекция?
          </div>
          <div style={{ alignSelf: 'flex-start', background: '#F0F8FF', border: '1px solid rgba(0,127,255,0.15)', color: '#333', padding: '8px 12px', borderRadius: '12px 12px 12px 2px', fontSize: '0.85rem', display: 'flex', gap: '8px' }}>
            <img src="/img/mascot.png" alt="bot" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            <span>Дирекция ИВИТШ находится в Корпусе Б на 2 этаже, кабинет Б-209. Работает пн–пт с 9:00 до 17:00 🐱</span>
          </div>
        </div>
      </div>

      <button onClick={onComplete} className="btn-auth" style={{ width: '100%', marginTop: '10px' }}>
        Завершить этап и открыть следующий →
      </button>
    </div>
  );
}
