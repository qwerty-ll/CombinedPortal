import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Square, CheckSquare } from 'lucide-react';

const INITIAL_TASKS = [
  { id: 1, text: "Оригинал справки 086-У и прививочный сертификат", done: true },
  { id: 2, text: "Фотографии 3х4 (4 штуки)", done: true },
  { id: 3, text: "Получить логин и пароль в СДО/ЕИОС КГУ", done: false },
  { id: 4, text: "Вступить в общий чат вашей группы ИВИТШ", done: true },
  { id: 5, text: "Узнать свой кабинет в Корпусе Б (101-409)", done: false },
  { id: 6, text: "Познакомиться со старостой и куратором", done: false },
  { id: 7, text: "Оформить пропуск и карту в профкоме", done: false },
];

export default function ChecklistModal({ onComplete }) {
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const toggleTask = (id) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, done: !t.done } : t);
      const allDone = next.every(t => t.done);
      if (allDone && onComplete) onComplete();
      return next;
    });
  };

  const doneCount = tasks.filter(t => t.done).length;
  const percent = Math.round((doneCount / tasks.length) * 100);

  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
          <span>Чек-лист первачка</span>
          <span style={{ color: 'var(--primary)' }}>{doneCount} из {tasks.length} ({percent}%)</span>
        </div>
        <div style={{ height: '6px', background: '#E8F4FF', borderRadius: '3px', overflow: 'hidden' }}>
          <motion.div style={{ height: '100%', background: 'var(--primary)', borderRadius: '3px' }} animate={{ width: `${percent}%` }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
        {tasks.map(task => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: task.done ? 'rgba(0,127,255,0.04)' : 'white',
              border: task.done ? '1px solid rgba(0,127,255,0.2)' : '1px solid #e9ecef',
              borderRadius: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {task.done ? <CheckSquare size={20} color="var(--primary)" /> : <Square size={20} color="#aaa" />}
            <span style={{ fontSize: '0.88rem', fontWeight: '600', color: task.done ? 'var(--primary)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none' }}>
              {task.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
