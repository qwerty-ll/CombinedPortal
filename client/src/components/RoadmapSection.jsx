import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Lock, Hammer, Map, Bot, Brain, ClipboardList,
  Building2, BookOpen, Trophy, Sparkles, ArrowRight, ChevronRight
} from 'lucide-react';

export const ROADMAP_STEPS = [
  { id: 0, label: 'Этап 1 · Основа', name: 'Основа', title: 'Основа', icon: Hammer, desc: 'Знакомство с порталом и ВИТШиком' },
  { id: 1, label: 'Этап 2 · Маршрут', name: 'Маршрут', title: 'Маршрут', icon: Map, desc: 'Понимаешь, как устроен путь адаптации' },
  { id: 2, label: 'Этап 3 · Чат-бот', name: 'Чат-бот', title: 'Чат-бот', icon: Bot, desc: 'Учишься задавать вопросы ВИТШику' },
  { id: 3, label: 'Этап 4 · Входной тест', name: 'Входной тест', title: 'Входной тест', icon: Brain, desc: 'Проверяешь знания о правилах КГУ' },
  { id: 4, label: 'Этап 5 · Чек-лист', name: 'Чек-лист', title: 'Чек-лист первачка', icon: ClipboardList, desc: 'Отмечаешь важные дела первокурсника' },
  { id: 5, label: 'Этап 6 · Карта кампуса', name: 'Карта кампуса', title: 'Карта кампуса', icon: Building2, desc: 'Изучаешь планы этажей корпуса Б' },
  { id: 6, label: 'Этап 7 · Предметы', name: 'Предметы', title: 'Все 24 предмета', icon: BookOpen, desc: 'Все 24 дисциплины 1 и 2 семестров' },
  { id: 7, label: 'Этап 8 · Студ. жизнь', name: 'Студенческая жизнь', title: 'Студ. жизнь', icon: Sparkles, desc: 'Клубы, приметы и традиции ВИТШ' },
  { id: 8, label: 'Этап 9 · Награды', name: 'Награды', title: 'Зачёт ачивок', icon: Trophy, desc: 'Получение диплома адаптации и ачивок' }
];

const markerTransition = { duration: 0.24, ease: [0.16, 1, 0.3, 1] };

export default function RoadmapSection({ activeStep, completedSteps, onStepClick }) {
  const total = ROADMAP_STEPS.length;
  const doneCount = completedSteps.length;
  const allDone = ROADMAP_STEPS.every(step => completedSteps.includes(step.id));
  const nextStep = ROADMAP_STEPS[activeStep];

  return (
    <div className="card roadmap">
      <div className="roadmap-header">
        <div>
          <h2 id="roadmap-title">Путь адаптации</h2>
          <p className="roadmap-next">
            {allDone ? 'Все этапы пройдены — диплом ждёт в наградах' : `Следующий этап — ${nextStep?.name}`}
          </p>
        </div>

        <div className="roadmap-progress">
          <span className="roadmap-progress-label tabular" id="roadmap-progress-label">
            {doneCount} из {total} этапов
          </span>
          <div
            className="progress"
            role="progressbar"
            aria-labelledby="roadmap-progress-label"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={doneCount}
          >
            <div className="progress-value" style={{ transform: `scaleX(${Math.min(doneCount / total, 1)})` }} />
          </div>
        </div>
      </div>

      <ol className="roadmap-steps" aria-labelledby="roadmap-title">
        {ROADMAP_STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isActive = activeStep === step.id && !isCompleted;
          const isLocked = !isCompleted && !isActive;
          const state = isCompleted ? 'done' : isActive ? 'current' : 'locked';
          const number = step.id + 1;
          const actionLabel = isCompleted ? 'Открыть' : step.id === 8 ? 'Получить награды' : 'Пройти этап';

          return (
            <li
              key={step.id}
              className="roadmap-step"
              data-state={state}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="roadmap-marker" aria-hidden="true">
                <AnimatePresence initial={false}>
                  <motion.span
                    key={state}
                    className="roadmap-marker-inner"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={markerTransition}
                  >
                    {isCompleted
                      ? <Check size={16} strokeWidth={1.75} />
                      : <span className="tabular">{number}</span>}
                  </motion.span>
                </AnimatePresence>
              </span>

              <div className="roadmap-step-text">
                <span className="roadmap-step-name">
                  <span className="visually-hidden">Этап {number}: </span>
                  {step.name}
                </span>
                <span className="roadmap-step-desc">
                  {isCompleted && <span className="roadmap-step-status">Пройден<span className="roadmap-step-sep"> · </span></span>}
                  <span className="roadmap-step-desc-text">{step.desc}</span>
                </span>
                {isLocked && <span className="visually-hidden"> Этап закрыт: сначала пройди предыдущие.</span>}
              </div>

              {isLocked ? (
                <Lock className="roadmap-lock" size={16} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <button
                  type="button"
                  className={`btn ${isActive ? 'btn-primary' : 'btn-ghost'} btn-sm roadmap-action`}
                  onClick={() => onStepClick(step.id)}
                  aria-label={`${actionLabel}: этап ${number}, ${step.name}`}
                >
                  <span className="roadmap-action-label">{actionLabel}</span>
                  {isActive
                    ? <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                    : <ChevronRight className="roadmap-action-chevron" size={20} strokeWidth={1.75} aria-hidden="true" />}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
