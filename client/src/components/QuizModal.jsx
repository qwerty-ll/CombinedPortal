import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Trophy, ThumbsUp, Check, X } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/quizData';

export default function QuizModal({ onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerState, setAnswerState] = useState('idle'); // 'idle' | 'correct' | 'incorrect'
  const [results, setResults] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  const question = QUIZ_QUESTIONS[currentIndex];
  const totalQuestions = QUIZ_QUESTIONS.length;
  const score = results.filter(r => r.correct).length;

  const handleOptionSelect = (index) => {
    if (answerState !== 'idle') return;
    const isCorrect = index === question.correctIndex;
    setSelectedOption(index);
    setAnswerState(isCorrect ? 'correct' : 'incorrect');
    setResults(prev => [...prev, { questionId: question.id, correct: isCorrect }]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalQuestions) {
      setIsFinished(true);
      if (onComplete) onComplete();
    } else {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setAnswerState('idle');
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswerState('idle');
    setResults([]);
    setIsFinished(false);
  };

  const progressPercent = ((currentIndex + (answerState !== 'idle' ? 1 : 0)) / totalQuestions) * 100;

  if (isFinished) {
    const percent = Math.round((score / totalQuestions) * 100);
    const isGreat = percent >= 80;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '10px' }}>
        <img src="/img/mascot.png" alt="ВИТШик" style={{ width: '80px', height: '80px', margin: '0 auto 12px auto', objectFit: 'contain' }} />
        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', fontWeight: '800', color: 'var(--primary)' }}>
          {isGreat ? '🏆 Отлично сдал тест!' : '👍 Хорошая попытка!'}
        </h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '0.88rem', color: '#666' }}>
          {isGreat ? 'ВИТШик гордится тобой! Ты прекрасно разбираешься в структуре КГУ и ИВИТШ.' : 'ВИТШик верит в тебя! Повтори правила и попробуй ещё раз.'}
        </p>

        {/* Score Circle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: `conic-gradient(var(--primary) ${percent * 3.6}deg, #E8F4FF ${percent * 3.6}deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: '76px', height: '76px', background: 'white', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--primary)' }}>{score}</span>
              <span style={{ fontSize: '0.75rem', color: '#888' }}>из {totalQuestions}</span>
            </div>
          </div>
        </div>

        <button onClick={handleRestart} className="btn-auth" style={{ width: '100%' }}>
          Пройти тест заново 🔄
        </button>
      </motion.div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#777', marginBottom: '6px', fontWeight: '600' }}>
          <span>Вопрос {currentIndex + 1} из {totalQuestions}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div style={{ height: '6px', background: '#E8F4FF', borderRadius: '3px', overflow: 'hidden' }}>
          <motion.div style={{ height: '100%', background: 'var(--primary)', borderRadius: '3px' }} animate={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          {/* Question Title */}
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text)', lineHeight: '1.4' }}>
            {question.question}
          </h3>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {question.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === question.correctIndex;
              let bg = 'white';
              let border = '1px solid #e9ecef';
              let color = 'var(--text)';

              if (answerState !== 'idle') {
                if (isCorrect) {
                  bg = '#2ECC71';
                  border = '1px solid #2ECC71';
                  color = 'white';
                } else if (isSelected && !isCorrect) {
                  bg = '#E74C3C';
                  border = '1px solid #E74C3C';
                  color = 'white';
                } else {
                  opacity: 0.5;
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={answerState !== 'idle'}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: bg,
                    border: border,
                    color: color,
                    fontWeight: '600',
                    fontSize: '0.88rem',
                    cursor: answerState === 'idle' ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <strong style={{ marginRight: '8px' }}>{String.fromCharCode(65 + idx)}.</strong> {opt}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {answerState !== 'idle' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#F0F8FF', border: '1px solid rgba(0,127,255,0.15)', borderRadius: '14px', padding: '12px 14px', marginBottom: '16px', fontSize: '0.85rem', color: '#333', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <Lightbulb size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--primary)' }}>Объяснение: </strong> {question.explanation}
              </div>
            </motion.div>
          )}

          {/* Next button */}
          {answerState !== 'idle' && (
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={handleNext} className="btn-auth" style={{ width: '100%' }}>
              {currentIndex + 1 >= totalQuestions ? 'Завершить тест' : 'Следующий вопрос →'}
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
