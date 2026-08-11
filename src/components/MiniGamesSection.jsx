import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Heart, Sparkles, CheckCircle2, RefreshCw, ChevronRight, Zap, Target, Star } from 'lucide-react';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Кто такой староста группы ИВИТШ?",
    options: [
      "Студент, выбранный группой для связи с администрацией и преподавателями",
      "Преподаватель, который ведёт основную дисциплину",
      "Сотрудник профсоюзной организации",
      "Наставник со старшего курса"
    ],
    correctIndex: 0,
    explanation: "Староста представляет интересы группы, взаимодействует с дирекцией ИВИТШ и помогает решать организационные вопросы."
  },
  {
    id: 2,
    question: "К кому обратиться, если нужна помощь с адаптацией или сложным предметом?",
    options: ["К культоргу", "К тьютору/наставнику", "К профоргу", "К охране"],
    correctIndex: 1,
    explanation: "Тьютор — студент старших курсов, который помогает первачкам освоиться в вузе и справиться с учебой."
  },
  {
    id: 3,
    question: "Что необходимо для получения повышенной академической стипендии ИВИТШ?",
    options: [
      "Только сдать сессию на 'отлично' и 'хорошо' без задолженностей",
      "Активное участие в научной, спортивной или общественной жизни + успешная сессия",
      "Быть старостой группы",
      "Иметь пропуск в корпус Б"
    ],
    correctIndex: 1,
    explanation: "Повышенная стипендия назначается за особые достижения в науке, творчестве, спорте и учебе."
  },
  {
    id: 4,
    question: "Где посмотреть расписание и учебный план ИВИТШ КГУ?",
    options: [
      "В ЭИОС и портале КГУ (eios.kosgos.ru)",
      "Только в студенческом чате",
      "На доске объявлений у входа",
      "Спросить у прохожих"
    ],
    correctIndex: 0,
    explanation: "ЭИОС и личный кабинет содержат актуальное расписание занятий и сессий."
  }
];

const EMOTIONAL_QUESTIONS = [
  {
    id: 1,
    text: "Как вы чувствуете себя перед началом первой недели занятий?",
    options: [
      { text: "Полный энергии и азарта! 🔥", score: 3 },
      { text: "Немного волнуюсь, но интересно 🙂", score: 2 },
      { text: "Немного растерян и переживаю 😟", score: 1 }
    ]
  },
  {
    id: 2,
    text: "Насколько комфортно вам в новом коллективе одногруппников?",
    options: [
      { text: "Уже со всеми познакомился! 🤝", score: 3 },
      { text: "Общаюсь с несколькими ребятами 💬", score: 2 },
      { text: "Пока стесняюсь заговорить первым 🙈", score: 1 }
    ]
  },
  {
    id: 3,
    text: "Понятна ли вам система баллов и ориентирование в корпусе Б?",
    options: [
      { text: "Всё понял и нашел кабинеты! 🧭", score: 3 },
      { text: "Ориентируюсь с картой в приложении 🗺️", score: 2 },
      { text: "Всё еще ищу 209 и 101 кабинеты 😅", score: 1 }
    ]
  }
];

const REWARDS = [
  { id: 1, title: 'Первачок ИВИТШ', icon: '🚀', desc: 'Успешная авторизация на Портале', unlocked: true },
  { id: 2, title: 'Знаток Корпуса Б', icon: '📍', desc: 'Изучил карту корпусов и аудиторий', unlocked: true },
  { id: 3, title: 'Мастер Адаптации', icon: '🧠', desc: 'Пройден тест и викторина первачка', unlocked: false },
  { id: 4, title: 'Активный Форумчанин', icon: '💬', desc: 'Создал первый вопрос в студенческом форуме', unlocked: false }
];

export default function MiniGamesSection() {
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' | 'test' | 'rewards'

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Emotional test state
  const [testIndex, setTestIndex] = useState(0);
  const [testScore, setTestScore] = useState(0);
  const [testFinished, setTestFinished] = useState(false);

  const handleQuizSelect = (idx) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    const isCorrect = idx === QUIZ_QUESTIONS[quizIndex].correctIndex;
    if (isCorrect) setQuizScore(s => s + 1);
  };

  const handleNextQuiz = () => {
    if (quizIndex + 1 >= QUIZ_QUESTIONS.length) {
      setQuizFinished(true);
    } else {
      setQuizIndex(i => i + 1);
      setSelectedOpt(null);
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setSelectedOpt(null);
    setQuizScore(0);
    setQuizFinished(false);
  };

  const handleTestSelect = (scoreVal) => {
    const nextScore = testScore + scoreVal;
    setTestScore(nextScore);
    if (testIndex + 1 >= EMOTIONAL_QUESTIONS.length) {
      setTestFinished(true);
    } else {
      setTestIndex(i => i + 1);
    }
  };

  const resetTest = () => {
    setTestIndex(0);
    setTestScore(0);
    setTestFinished(false);
  };

  return (
    <motion.section 
      className="curator-profile-section"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'white',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
        border: '1px solid #E9ECEF',
        marginTop: '20px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'rgba(0,127,255,0.1)', color: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text)' }}>Адаптационные мини-игры ИВИТШ</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#666' }}>Интерактивный квиз, эмоциональная диагностика и ачивки</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', background: '#F1F3F5', padding: '4px', borderRadius: '12px', gap: '4px' }}>
          <button 
            onClick={() => setActiveTab('quiz')}
            style={{
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.82rem',
              cursor: 'pointer',
              background: activeTab === 'quiz' ? 'white' : 'transparent',
              color: activeTab === 'quiz' ? 'var(--primary)' : '#666',
              boxShadow: activeTab === 'quiz' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            🎯 Квиз
          </button>
          <button 
            onClick={() => setActiveTab('test')}
            style={{
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.82rem',
              cursor: 'pointer',
              background: activeTab === 'test' ? 'white' : 'transparent',
              color: activeTab === 'test' ? 'var(--primary)' : '#666',
              boxShadow: activeTab === 'test' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            🧠 Настрой
          </button>
          <button 
            onClick={() => setActiveTab('rewards')}
            style={{
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.82rem',
              cursor: 'pointer',
              background: activeTab === 'rewards' ? 'white' : 'transparent',
              color: activeTab === 'rewards' ? 'var(--primary)' : '#666',
              boxShadow: activeTab === 'rewards' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            🏆 Ачивки
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: QUIZ */}
        {activeTab === 'quiz' && (
          <motion.div key="quiz" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {!quizFinished ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                  <span>Вопрос {quizIndex + 1} из {QUIZ_QUESTIONS.length}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: '700' }}>Баллы: {quizScore}</span>
                </div>

                <h4 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', color: 'var(--text)' }}>
                  {QUIZ_QUESTIONS[quizIndex].question}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {QUIZ_QUESTIONS[quizIndex].options.map((opt, idx) => {
                    const isSelected = selectedOpt === idx;
                    const isCorrect = idx === QUIZ_QUESTIONS[quizIndex].correctIndex;
                    let bgColor = '#F8F9FA';
                    let borderColor = '#E9ECEF';
                    let textColor = 'var(--text)';

                    if (selectedOpt !== null) {
                      if (isCorrect) {
                        bgColor = '#E6F4EA';
                        borderColor = '#34A853';
                        textColor = '#137333';
                      } else if (isSelected) {
                        bgColor = '#FCE8E6';
                        borderColor = '#EA4335';
                        textColor = '#C5221F';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleQuizSelect(idx)}
                        disabled={selectedOpt !== null}
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: `1px solid ${borderColor}`,
                          background: bgColor,
                          color: textColor,
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          cursor: selectedOpt !== null ? 'default' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {selectedOpt !== null && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '14px', background: '#F1F3F5', padding: '12px 14px', borderRadius: '10px', fontSize: '0.85rem', color: '#444' }}>
                    💡 <strong>Пояснение:</strong> {QUIZ_QUESTIONS[quizIndex].explanation}
                  </motion.div>
                )}

                {selectedOpt !== null && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                    <button
                      onClick={handleNextQuiz}
                      style={{
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {quizIndex + 1 === QUIZ_QUESTIONS.length ? 'Завершить квиз 🎉' : 'Следующий вопрос ➔'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🏆</div>
                <h4 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--primary)' }}>Квиз пройден!</h4>
                <p style={{ margin: '6px 0 16px 0', color: '#666', fontSize: '0.92rem' }}>
                  Вы правильно ответили на <strong>{quizScore} из {QUIZ_QUESTIONS.length}</strong> вопросов!
                </p>
                <button
                  onClick={resetQuiz}
                  style={{
                    background: '#F1F3F5',
                    color: 'var(--text)',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={14} /> Пройти заново
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: EMOTIONAL DIAGNOSTIC TEST */}
        {activeTab === 'test' && (
          <motion.div key="test" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {!testFinished ? (
              <div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                  Вопрос {testIndex + 1} из {EMOTIONAL_QUESTIONS.length}
                </div>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', color: 'var(--text)' }}>
                  {EMOTIONAL_QUESTIONS[testIndex].text}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {EMOTIONAL_QUESTIONS[testIndex].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTestSelect(opt.score)}
                      style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid #E9ECEF',
                        background: '#F8F9FA',
                        color: 'var(--text)',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🌟</div>
                <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)' }}>
                  {testScore >= 7 ? 'Вы отлично готовы к старту! 🔥' : testScore >= 5 ? 'Хороший уверенный настрой! 🙂' : 'Главное — не переживать, тьюторы рядом! 💪'}
                </h4>
                <p style={{ margin: '8px 0 16px 0', color: '#666', fontSize: '0.9rem', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                  ВИТШик и ваша группа помогут с любыми вопросами по учебе и ориентированию в институте.
                </p>
                <button
                  onClick={resetTest}
                  style={{
                    background: '#F1F3F5',
                    color: 'var(--text)',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={14} /> Пройти снова
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: REWARDS & ACHIEVEMENTS */}
        {activeTab === 'rewards' && (
          <motion.div key="rewards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {REWARDS.map(rw => (
                <div
                  key={rw.id}
                  style={{
                    background: rw.unlocked ? '#F0F9FF' : '#F8F9FA',
                    border: rw.unlocked ? '1px solid #BAE6FD' : '1px dashed #DEE2E6',
                    padding: '14px',
                    borderRadius: '14px',
                    opacity: rw.unlocked ? 1 : 0.7
                  }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{rw.icon}</div>
                  <div style={{ fontWeight: '700', fontSize: '0.92rem', color: rw.unlocked ? '#0369A1' : '#666' }}>{rw.title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#777', marginTop: '2px' }}>{rw.desc}</div>
                  <div style={{ marginTop: '8px' }}>
                    {rw.unlocked ? (
                      <span style={{ fontSize: '0.72rem', background: '#E0F2FE', color: '#0369A1', padding: '2px 6px', borderRadius: '6px', fontWeight: '800' }}>
                        ✓ Разблокировано
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', background: '#E9ECEF', color: '#6C757D', padding: '2px 6px', borderRadius: '6px', fontWeight: '700' }}>
                        🔒 В процессе
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
