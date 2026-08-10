import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Lock, Hammer, Map, Bot, Brain, ClipboardList, 
  Building2, BookOpen, Heart, Trophy, Sparkles 
} from 'lucide-react';

export const ROADMAP_STEPS = [
  { id: 0, key: 'foundation', label: 'Этап 1 · Основа', icon: Hammer, desc: 'Знакомство с порталом и ВИТШиком' },
  { id: 1, key: 'roadmap', label: 'Этап 2 · Маршрут', icon: Map, desc: 'Понимаешь, как устроен путь адаптации' },
  { id: 2, key: 'bot', label: 'Этап 3 · Чат-бот', icon: Bot, desc: 'Учишься задавать вопросы ВИТШику' },
  { id: 3, key: 'quiz', label: 'Этап 4 · Тест знаний', icon: Brain, desc: 'Проверяешь знания о правилах КГУ' },
  { id: 4, key: 'checklist', label: 'Этап 5 · Чек-лист', icon: ClipboardList, desc: 'Отмечаешь важные дела первокурсника' },
  { id: 5, key: 'map', label: 'Этап 6 · Карта кампуса', icon: Building2, desc: 'Изучаешь планы этажей корпуса Б' },
  { id: 6, key: 'subjects', label: 'Этап 7 · Предметы', icon: BookOpen, desc: 'Все 24 дисциплины 1 и 2 семестров' },
  { id: 7, key: 'emotional', label: 'Этап 8 · Настроение', icon: Heart, desc: 'Тест эмоциональной адаптации' },
  { id: 8, key: 'rewards', label: 'Этап 9 · Награды', icon: Trophy, desc: 'Получаешь зачёт ачивок адаптации' },
  { id: 9, key: 'fun', label: 'Этап 10 · Студ. жизнь', icon: Sparkles, desc: 'Клубы, приметы и традиции ВИТШ' }
];

const RoadmapSection = ({ activeStep, completedSteps, onStepClick }) => {
  return (
    <div style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid rgba(0, 127, 255, 0.15)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text)' }}>Путь адаптации</h2>
          <p style={{ fontSize: '0.85rem', color: '#888', margin: '2px 0 0 0' }}>Пройди все 10 этапов вместе с ВИТШиком</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 127, 255, 0.08)', padding: '6px 14px', borderRadius: '16px' }}>
          <div style={{ width: '70px', height: '6px', background: '#E8F4FF', borderRadius: '3px', overflow: 'hidden' }}>
            <motion.div 
              style={{ height: '100%', background: 'var(--primary)', borderRadius: '3px' }}
              animate={{ width: `${(completedSteps.length / ROADMAP_STEPS.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)' }}>
            {completedSteps.length}/{ROADMAP_STEPS.length}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ position: 'absolute', left: '21px', top: '20px', bottom: '20px', width: '2px', background: 'linear-gradient(to bottom, rgba(0,127,255,0.4), rgba(0,127,255,0.1))', zIndex: 0 }} />

        {ROADMAP_STEPS.map((step, idx) => {
          const isCompleted = completedSteps.includes(step.id);
          const isActive = activeStep === step.id;
          const isLocked = !isCompleted && !isActive;
          const StepIcon = step.icon;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '14px' }}
            >
              {/* Step Circle */}
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: isCompleted ? 'var(--primary)' : isActive ? 'white' : '#f8f9fa',
                  border: isCompleted ? '2px solid var(--primary)' : isActive ? '2px solid var(--primary)' : '1px solid #e9ecef',
                  boxShadow: isActive ? '0 4px 14px rgba(0,127,255,0.25)' : 'none',
                  color: isCompleted ? 'white' : isActive ? 'var(--primary)' : '#aaa',
                  cursor: isLocked ? 'not-allowed' : 'pointer'
                }}
                onClick={() => !isLocked && onStepClick(step.id)}
              >
                {isCompleted ? <Check size={18} strokeWidth={3} /> : isLocked ? <Lock size={16} /> : <StepIcon size={18} />}
              </div>

              {/* Step Card */}
              <div
                onClick={() => !isLocked && onStepClick(step.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: isCompleted ? 'rgba(0,127,255,0.03)' : isActive ? 'white' : '#fdfdfd',
                  border: isCompleted ? '1px solid rgba(0,127,255,0.15)' : isActive ? '2px solid var(--primary)' : '1px solid #eee',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  opacity: isLocked ? 0.6 : 1,
                  boxShadow: isActive ? '0 6px 20px rgba(0,127,255,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: isLocked ? '#999' : 'var(--text)' }}>
                    {step.label}
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: isCompleted ? 'var(--primary)' : isActive ? 'var(--primary)' : '#888' }}>
                    {isCompleted ? '✓ Пройдено' : isActive ? 'Текущий этап (нажмите)' : step.desc}
                  </p>
                </div>

                {!isLocked && (
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    background: isActive ? 'var(--primary)' : 'rgba(0,127,255,0.1)',
                    color: isActive ? 'white' : 'var(--primary)'
                  }}>
                    {isActive ? 'Пройти →' : 'Открыть'}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default RoadmapSection;
