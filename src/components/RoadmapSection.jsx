import React from 'react';
import { motion } from 'framer-motion';
import { 
  Check, Lock, Hammer, Map, Bot, Brain, ClipboardList, 
  Building2, BookOpen, Trophy, Sparkles 
} from 'lucide-react';

export const ROADMAP_STEPS = [
  { id: 0, label: 'Этап 1 · Основа', title: 'Основа', icon: Hammer, desc: 'Знакомство с порталом и ВИТШиком' },
  { id: 1, label: 'Этап 2 · Маршрут', title: 'Маршрут', icon: Map, desc: 'Понимаешь, как устроен путь адаптации' },
  { id: 2, label: 'Этап 3 · Чат-бот', title: 'Чат-бот', icon: Bot, desc: 'Учишься задавать вопросы ВИТШику' },
  { id: 3, label: 'Этап 4 · Входной тест', title: 'Входной тест', icon: Brain, desc: 'Проверяешь знания о правилах КГУ' },
  { id: 4, label: 'Этап 5 · Чек-лист', title: 'Чек-лист первачка', icon: ClipboardList, desc: 'Отмечаешь важные дела первокурсника' },
  { id: 5, label: 'Этап 6 · Карта кампуса', title: 'Карта кампуса', icon: Building2, desc: 'Изучаешь планы этажей корпуса Б' },
  { id: 6, label: 'Этап 7 · Предметы', title: 'Все 24 предмета', icon: BookOpen, desc: 'Все 24 дисциплины 1 и 2 семестров' },
  { id: 7, label: 'Этап 8 · Студ. жизнь', title: 'Студ. жизнь', icon: Sparkles, desc: 'Клубы, приметы и традиции ВИТШ' },
  { id: 8, label: 'Этап 9 · Награды', title: 'Зачёт ачивок', icon: Trophy, desc: 'Получение диплома адаптации и ачивок' }
];

export default function RoadmapSection({ activeStep, completedSteps, onStepClick }) {
  return (
    <div style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid rgba(0, 127, 255, 0.15)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: 'var(--text)' }}>Путь адаптации</h2>
          <p style={{ fontSize: '0.85rem', color: '#777', margin: '2px 0 0 0' }}>Пройди 9 главных этапов вместе с ВИТШиком</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0, 127, 255, 0.08)', padding: '6px 14px', borderRadius: '16px' }}>
          <div style={{ width: '80px', height: '6px', background: '#E8F4FF', borderRadius: '3px', overflow: 'hidden' }}>
            <motion.div 
              style={{ height: '100%', background: 'var(--primary)', borderRadius: '3px' }}
              animate={{ width: `${(completedSteps.length / ROADMAP_STEPS.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary)' }}>
            {completedSteps.length}/{ROADMAP_STEPS.length}
          </span>
        </div>
      </div>

      {/* Timeline steps list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {ROADMAP_STEPS.map((step, idx) => {
          const isCompleted = completedSteps.includes(step.id);
          const isActive = activeStep === step.id;
          const isLocked = !isCompleted && !isActive;
          const StepIcon = step.icon;

          return (
            <motion.div
              key={step.id}
              whileHover={!isLocked ? { scale: 1.01, x: 4 } : {}}
              whileTap={!isLocked ? { scale: 0.99 } : {}}
              onClick={() => !isLocked && onStepClick(step.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '16px',
                background: isCompleted ? 'rgba(0,127,255,0.03)' : isActive ? 'white' : '#fcfcfc',
                border: isCompleted ? '1px solid rgba(0,127,255,0.18)' : isActive ? '2px solid var(--primary)' : '1px solid #eee',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                opacity: isLocked ? 0.6 : 1,
                boxShadow: isActive ? '0 8px 25px rgba(0,127,255,0.15)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: isCompleted ? 'var(--primary)' : isActive ? 'white' : '#f1f3f5',
                  border: isCompleted ? '2px solid var(--primary)' : isActive ? '2px solid var(--primary)' : '1px solid #dee2e6',
                  color: isCompleted ? 'white' : isActive ? 'var(--primary)' : '#aaa'
                }}>
                  {isCompleted ? <Check size={18} strokeWidth={3} /> : isLocked ? <Lock size={16} /> : <StepIcon size={18} />}
                </div>

                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '800', color: isLocked ? '#999' : 'var(--text)' }}>
                    {step.label}
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: isCompleted ? 'var(--primary)' : isActive ? 'var(--primary)' : '#888' }}>
                    {isCompleted ? '✓ Пройдено' : isActive ? 'Текущий этап (нажмите для прохождения)' : step.desc}
                  </p>
                </div>
              </div>

              {!isLocked && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStepClick(step.id);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    border: 'none',
                    background: isActive ? 'var(--primary)' : 'rgba(0,127,255,0.1)',
                    color: isActive ? 'white' : 'var(--primary)',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 4px 12px rgba(0,127,255,0.3)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {isActive ? 'Пройти →' : 'Открыть'}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
