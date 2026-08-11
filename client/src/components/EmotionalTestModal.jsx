import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, RefreshCw, Heart } from 'lucide-react';

const QUESTIONS = [
  { id: "q1", text: "Я чувствую себя спокойно и уверенно в новой учебной среде." },
  { id: "q2", text: "Мне понятно, к кому можно обратиться за помощью в университете." },
  { id: "q3", text: "Я быстро привыкаю к новому расписанию, преподавателям и требованиям." },
  { id: "q4", text: "Мне интересно учиться на моем направлении." },
  { id: "q5", text: "Мне комфортно общаться с одногруппниками." },
  { id: "q6", text: "Я не боюсь задавать вопросы преподавателям, старосте или тьютору." },
  { id: "q7", text: "Мне кажется, я справляюсь с учебной нагрузкой." },
  { id: "q8", text: "У меня достаточно сил, энергии и мотивации для учёбы." },
  { id: "q9", text: "Я понимаю, как организовать своё время между учёбой и отдыхом." },
  { id: "q10", text: "В целом я чувствую себя частью университетской среды." }
];

const OPTIONS = [
  { label: "1 — Совсем не согласен", value: 1 },
  { label: "2 — Скорее не согласен", value: 2 },
  { label: "3 — Нейтрально", value: 3 },
  { label: "4 — Скорее согласен", value: 4 },
  { label: "5 — Полностью согласен", value: 5 }
];

const RESULT_LEVELS = [
  {
    minScore: 10,
    name: "Нужна поддержка",
    emoji: "❤️‍🩹",
    color: "#FF3B30",
    bgColor: "#FFF1F0",
    mascotReaction: "Эй, я вижу, что тебе сейчас нелегко. Начало учёбы — это стресс, и это нормально! ВИТШик мысленно обнимает тебя 🫂",
    advice: "Поговори с куратором, тьютором или психологом университета. Они здесь именно для того, чтобы помогать в таких ситуациях."
  },
  {
    minScore: 25,
    name: "В процессе адаптации",
    emoji: "🌱",
    color: "#FF9500",
    bgColor: "#FFF7ED",
    mascotReaction: "Всё идёт своим чередом! Ты уже осваиваешься, но иногда бывает сложно. Не забывай отдыхать! 😸",
    advice: "Планируй время и не стесняйся задавать вопросы преподавателям или одногруппникам."
  },
  {
    minScore: 40,
    name: "Уверенный старт",
    emoji: "🚀",
    color: "#34C759",
    bgColor: "#EDFFF3",
    mascotReaction: "Ты просто огонь! Уверенно ворвался в студенческую жизнь и чувствуешь себя как рыба в воде! 😻",
    advice: "Записывайся в студенческие клубы, участвуй в хакатонах и заводи полезные знакомства!"
  }
];

export default function EmotionalTestModal({ onComplete }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isResult, setIsResult] = useState(false);

  const handleAnswer = (val) => {
    const nextAnswers = { ...answers, [currentQ]: val };
    setAnswers(nextAnswers);

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setIsResult(true);
      if (onComplete) onComplete();
    }
  };

  const restart = () => {
    setAnswers({});
    setCurrentQ(0);
    setIsResult(false);
  };

  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const result = RESULT_LEVELS.reduce((prev, curr) => totalScore >= curr.minScore ? curr : prev, RESULT_LEVELS[0]);

  if (isResult) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '10px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>{result.emoji}</div>
        <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: result.color }}>Твой результат</span>
        <h3 style={{ margin: '2px 0 6px 0', fontSize: '1.4rem', fontWeight: '800', color: result.color }}>{result.name}</h3>
        <p style={{ fontSize: '0.9rem', color: '#666', fontWeight: '600', marginBottom: '16px' }}>{totalScore} из 50 баллов</p>

        <div style={{ background: result.bgColor, border: `1px solid ${result.color}33`, borderRadius: '16px', padding: '14px', textAlign: 'left', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
            <img src="/img/mascot.png" alt="ВИТШик" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
            <strong style={{ fontSize: '0.88rem', color: result.color }}>ВИТШик говорит:</strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#333', fontStyle: 'italic', lineHeight: '1.4' }}>«{result.mascotReaction}»</p>
        </div>

        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '14px', padding: '12px', textAlign: 'left', fontSize: '0.82rem', color: '#555', marginBottom: '20px' }}>
          <Lightbulb size={16} style={{ color: result.color, verticalAlign: 'text-bottom', marginRight: '6px' }} />
          <strong>Что делать:</strong> {result.advice}
        </div>

        <button onClick={restart} className="btn-auth" style={{ width: '100%', background: result.color, borderColor: result.color }}>
          Пройти тест заново 🔄
        </button>
      </motion.div>
    );
  }

  const q = QUESTIONS[currentQ];
  const progress = ((currentQ + 1) / QUESTIONS.length) * 100;

  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyBetween: 'space-between', fontSize: '0.82rem', color: '#777', marginBottom: '6px', fontWeight: '600' }}>
          <span>Вопрос {currentQ + 1} из {QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div style={{ height: '6px', background: '#E8F4FF', borderRadius: '3px', overflow: 'hidden' }}>
          <motion.div style={{ height: '100%', background: 'var(--primary)', borderRadius: '3px' }} animate={{ width: `${progress}%` }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          <h3 style={{ margin: '0 0 18px 0', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text)', lineHeight: '1.4', textAlign: 'center' }}>
            {q.text}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'white',
                  border: '1px solid #e9ecef',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
