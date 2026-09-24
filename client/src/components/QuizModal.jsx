import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, RotateCcw, ArrowRight } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/quizData';

const fade = { duration: 0.2, ease: [0.16, 1, 0.3, 1] };

export default function QuizModal({ onComplete, onClose }) {
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
      <motion.div
        className="quiz-result"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <img src="/img/mascot-160.png" alt="" className="quiz-result-mascot" width="72" height="72" />
        <h3 className="quiz-result-title">{isGreat ? 'Отличный результат' : 'Хорошая попытка'}</h3>
        <p className="quiz-result-text">
          {isGreat
            ? 'ВИТШик гордится тобой: ты хорошо разбираешься в структуре КГУ и ИВИТШ.'
            : 'ВИТШик верит в тебя. Повтори правила и попробуй ещё раз.'}
        </p>

        <div className="quiz-score">
          <span className="quiz-score-value tabular">{score}<span className="quiz-score-total"> из {totalQuestions}</span></span>
          <span className="quiz-score-caption">правильных ответов · <span className="tabular">{percent}%</span></span>
        </div>

        <div className="quiz-result-actions">
          {onClose && (
            <button type="button" onClick={onClose} className="btn btn-primary btn-block">
              Вернуться к маршруту
            </button>
          )}
          <button type="button" onClick={handleRestart} className={`btn ${onClose ? 'btn-secondary' : 'btn-primary'} btn-block`}>
            <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
            Пройти тест заново
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="quiz">
      <div className="quiz-progress">
        <div className="quiz-progress-head">
          <span id="quiz-progress-label" className="tabular">Вопрос {currentIndex + 1} из {totalQuestions}</span>
          <span className="tabular">{Math.round(progressPercent)}%</span>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-labelledby="quiz-progress-label"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
        >
          <div className="progress-value" style={{ transform: `scaleX(${progressPercent / 100})` }} />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
        >
          <h3 className="quiz-question" id={`quiz-question-${currentIndex}`}>{question.question}</h3>

          <ul className="quiz-options" aria-labelledby={`quiz-question-${currentIndex}`}>
            {question.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === question.correctIndex;
              let state = 'idle';
              if (answerState !== 'idle') {
                if (isCorrect) state = 'correct';
                else if (isSelected) state = 'incorrect';
                else state = 'muted';
              }

              return (
                <li key={idx}>
                  <button
                    type="button"
                    className="quiz-option"
                    data-state={state}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={answerState !== 'idle'}
                  >
                    <span className="quiz-option-letter" aria-hidden="true">
                      {state === 'correct' ? <Check size={16} strokeWidth={1.75} />
                        : state === 'incorrect' ? <X size={16} strokeWidth={1.75} />
                        : String.fromCharCode(65 + idx)}
                    </span>
                    <span className="quiz-option-text">{opt}</span>
                    {state === 'correct' && <span className="visually-hidden"> — верный ответ</span>}
                    {state === 'incorrect' && <span className="visually-hidden"> — твой ответ, неверный</span>}
                  </button>
                </li>
              );
            })}
          </ul>

          <div role="status" aria-live="polite">
            {answerState !== 'idle' && (
              <motion.div
                className="quiz-explanation"
                data-state={answerState}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={fade}
              >
                <strong className="quiz-explanation-verdict">
                  {answerState === 'correct' ? 'Верно.' : 'Не совсем.'}
                </strong>{' '}
                {question.explanation}
              </motion.div>
            )}
          </div>

          {answerState !== 'idle' && (
            <button type="button" onClick={handleNext} className="btn btn-primary btn-block quiz-next" autoFocus>
              {currentIndex + 1 >= totalQuestions ? 'Завершить тест' : 'Следующий вопрос'}
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
