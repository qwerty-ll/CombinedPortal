import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Square, Luggage, FileCheck } from 'lucide-react';

const CAMP_TASKS = [
  { id: 'c1', text: "🧥 Одежда: Тёплая одежда на вечер, головной убор, зонт/дождевик", done: true },
  { id: 'c2', text: "🧴 Личные вещи: Зубная паста, щётка, расчёска, личная аптечка", done: true },
  { id: 'c3', text: "🔌 Зарядные устройства для телефона и устройств", done: false },
  { id: 'c4', text: "📄 Паспорт (оригинал) + бумажная ксерокопия (2-5 страницы)", done: true },
  { id: 'c5', text: "📝 Согласие на заселение (если не сдавали ранее)", done: false },
];

const SEPT1_TASKS = [
  { id: 's1', text: "📸 Фотографии 3х4 - 4 шт. (подписать фамилию на обороте каждого фото)", done: false },
  { id: 's2', text: "📄 Копия паспорта + Копия СНИЛС + Номер ИНН", done: false },
  { id: 's3', text: "👨 Для юношей: Постановка на воинский учёт в ауд. ГЛ-329 (приписное/военный билет + паспорт)", done: false },
  { id: 's4', text: "👨‍👩‍👧 Для несовершеннолетних: Согласие родителей на сборы и согласие на заселение", done: false },
  { id: 's5', text: "🎒 Проверить и взять с собой все документы, которые ещё не сдавались в деканат ИВИТШ", done: true },
];

export default function ChecklistModal({ onComplete }) {
  const [tab, setTab] = useState('camp'); // 'camp' | 'sept1'
  const [tasks, setTasks] = useState({
    camp: CAMP_TASKS,
    sept1: SEPT1_TASKS
  });

  const toggleTask = (taskId) => {
    setTasks(prev => {
      const currentList = prev[tab];
      const updatedList = currentList.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
      const nextState = { ...prev, [tab]: updatedList };

      const allCampDone = nextState.camp.every(t => t.done);
      const allSeptDone = nextState.sept1.every(t => t.done);
      if (allCampDone && allSeptDone && onComplete) onComplete();

      return nextState;
    });
  };

  const currentTasks = tasks[tab];
  const doneCount = currentTasks.filter(t => t.done).length;
  const percent = Math.round((doneCount / currentTasks.length) * 100);

  return (
    <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>
      
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: '#F1F3F5', padding: '4px', borderRadius: '14px' }}>
        <button
          onClick={() => setTab('camp')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '10px',
            border: 'none',
            background: tab === 'camp' ? 'white' : 'transparent',
            color: tab === 'camp' ? 'var(--primary)' : '#666',
            fontWeight: '700',
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: tab === 'camp' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Luggage size={16} /> Чек-лист на сборы
        </button>

        <button
          onClick={() => setTab('sept1')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '10px',
            border: 'none',
            background: tab === 'sept1' ? 'white' : 'transparent',
            color: tab === 'sept1' ? 'var(--primary)' : '#666',
            fontWeight: '700',
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: tab === 'sept1' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <FileCheck size={16} /> Чек-лист на 1 сентября
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
          <span>{tab === 'camp' ? 'Сборы первокурсников' : 'Документы на 1 сентября'}</span>
          <span style={{ color: 'var(--primary)' }}>{doneCount} из {currentTasks.length} ({percent}%)</span>
        </div>
        <div style={{ height: '6px', background: '#E8F4FF', borderRadius: '3px', overflow: 'hidden' }}>
          <motion.div style={{ height: '100%', background: 'var(--primary)', borderRadius: '3px' }} animate={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
        {currentTasks.map(task => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 14px',
              background: task.done ? 'rgba(0,127,255,0.04)' : 'white',
              border: task.done ? '1px solid rgba(0,127,255,0.2)' : '1px solid #e9ecef',
              borderRadius: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ marginTop: '2px', flexShrink: 0 }}>
              {task.done ? <CheckSquare size={20} color="var(--primary)" /> : <Square size={20} color="#aaa" />}
            </div>
            <span style={{ fontSize: '0.86rem', fontWeight: '600', color: task.done ? 'var(--primary)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none', lineHeight: '1.4' }}>
              {task.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
