import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Coins, Scroll, Heart, RefreshCw, Trophy, Smile } from 'lucide-react';

const PREDICTIONS = [
  "Завтрашняя лекция пройдет на одном дыхании, а конспект получится идеальным! 📝",
  "Тебе улыбнется удача на первой же лабораторной работе! ⚡",
  "Староста пришлет тебе самые важные ответы перед тестом! 🤫",
  "Ты найдешь лучшего друга на своем направлении в ИВИТШ! 🤝",
  "Твой проект на хакатоне займет 1 место и удивит всех! 🏆",
  "Преподаватель поставит автоматом за зачет за отличную активность! 🌟",
  "В коворкинге тебя ждет самое удобное кресло и вкусный кофе! ☕",
  "Сессия пролетит легко, если верить в себя и дружить с ВИТШиком! 🐱"
];

const SUPERSTITIONS = [
  { emoji: "🪙", text: "Положи монетку под пятку перед сессией — к удаче на экзамене." },
  { emoji: "🥠", text: "Не закрывай зачётку сразу после первой оценки — удача улетит!" },
  { emoji: "📜", text: "Кричи «Халява, приди!» в окно в ночь перед экзаменом." },
  { emoji: "🐱", text: "Погладь ВИТШика в Личном кабинете перед зачетом — он принесет 100 баллов!" },
  { emoji: "📝", text: "Пиши шпаргалки от руки — даже если не пронесешь, память зафиксирует всё." }
];

export default function MiniGamesSection() {
  const [activeTab, setActiveTab] = useState('petting'); // 'petting' | 'cookie' | 'coin' | 'khalyava' | 'superstition'

  // 1. PETTING MASCOT CLICKER STATE
  const [pets, setPets] = useState(() => {
    const saved = localStorage.getItem('vitshik_pets_count');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [petHearts, setPetHearts] = useState([]);

  const handlePetMascot = (e) => {
    const nextPets = pets + 1;
    setPets(nextPets);
    localStorage.setItem('vitshik_pets_count', nextPets.toString());

    // Floating heart effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setPetHearts(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setPetHearts(prev => prev.filter(h => h.id !== id));
    }, 800);
  };

  const levelInfo = useMemo(() => {
    if (pets < 10) return { lvl: 1, title: "Знакомые 🐾", next: 10, prev: 0, color: "#3B82F6" };
    if (pets < 25) return { lvl: 2, title: "Приятели 🤝", next: 25, prev: 10, color: "#10B981" };
    if (pets < 50) return { lvl: 3, title: "Друзья 🐱💖", next: 50, prev: 25, color: "#F59E0B" };
    if (pets < 100) return { lvl: 4, title: "Лучшие друзья! 🌟", next: 100, prev: 50, color: "#EC4899" };
    return { lvl: 5, title: "Неразлейвода! 👑🏆", next: 500, prev: 100, color: "#8B5CF6" };
  }, [pets]);

  const petPercentage = Math.min(100, Math.max(0, ((pets - levelInfo.prev) / (levelInfo.next - levelInfo.prev)) * 100));

  // 2. FORTUNE COOKIE STATE
  const [cookieOpened, setCookieOpened] = useState(false);
  const [cookieOpening, setCookieOpening] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState('');

  const openCookie = () => {
    if (cookieOpening || cookieOpened) return;
    setCookieOpening(true);
    setTimeout(() => {
      const idx = Math.floor(Math.random() * PREDICTIONS.length);
      setCurrentPrediction(PREDICTIONS[idx]);
      setCookieOpened(true);
      setCookieOpening(false);
    }, 600);
  };

  const resetCookie = () => {
    setCookieOpened(false);
    setCurrentPrediction('');
  };

  // 3. COIN CLICKER STATE
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('vitshik_coins_count');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [coinBursts, setCoinBursts] = useState([]);

  const handleCoinClick = (e) => {
    const nextCoins = coins + 1;
    setCoins(nextCoins);
    localStorage.setItem('vitshik_coins_count', nextCoins.toString());

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setCoinBursts(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setCoinBursts(prev => prev.filter(b => b.id !== id));
    }, 700);
  };

  // 4. KHALYAVA CATCHER GAME STATE
  const [khalyavaActive, setKhalyavaActive] = useState(false);
  const [khalyavaCaught, setKhalyavaCaught] = useState(false);
  const [khalyavaPos, setKhalyavaPos] = useState({ x: 40, y: 40 });
  const [khalyavaScore, setKhalyavaScore] = useState(0);
  const khalyavaTimerRef = useRef(null);
  const khalyavaTimeoutRef = useRef(null);

  const startKhalyava = () => {
    setKhalyavaCaught(false);
    setKhalyavaActive(true);
    moveKhalyava();
  };

  const moveKhalyava = () => {
    if (khalyavaTimerRef.current) clearInterval(khalyavaTimerRef.current);
    khalyavaTimerRef.current = setInterval(() => {
      setKhalyavaPos({
        x: 10 + Math.random() * 75,
        y: 10 + Math.random() * 65
      });
    }, 700);

    if (khalyavaTimeoutRef.current) clearTimeout(khalyavaTimeoutRef.current);
    khalyavaTimeoutRef.current = setTimeout(() => {
      if (khalyavaTimerRef.current) clearInterval(khalyavaTimerRef.current);
      setKhalyavaActive(false);
    }, 8000);
  };

  const catchKhalyava = () => {
    if (!khalyavaActive) return;
    if (khalyavaTimerRef.current) clearInterval(khalyavaTimerRef.current);
    if (khalyavaTimeoutRef.current) clearTimeout(khalyavaTimeoutRef.current);
    setKhalyavaCaught(true);
    setKhalyavaActive(false);
    setKhalyavaScore(s => s + 1);
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
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'rgba(0,127,255,0.1)', color: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text)' }}>Мини-игры и Приметы ВИТШика</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#666' }}>Погладь маскота, открой предсказание и поймай халяву!</p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div style={{ display: 'flex', background: '#F1F3F5', padding: '4px', borderRadius: '12px', gap: '4px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('petting')}
            style={{
              border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer',
              background: activeTab === 'petting' ? 'white' : 'transparent', color: activeTab === 'petting' ? 'var(--primary)' : '#666',
              boxShadow: activeTab === 'petting' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            🐱 Погладь ВИТШика
          </button>
          <button 
            onClick={() => setActiveTab('cookie')}
            style={{
              border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer',
              background: activeTab === 'cookie' ? 'white' : 'transparent', color: activeTab === 'cookie' ? 'var(--primary)' : '#666',
              boxShadow: activeTab === 'cookie' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            🥠 Предсказание
          </button>
          <button 
            onClick={() => setActiveTab('coin')}
            style={{
              border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer',
              background: activeTab === 'coin' ? 'white' : 'transparent', color: activeTab === 'coin' ? 'var(--primary)' : '#666',
              boxShadow: activeTab === 'coin' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            🪙 Монетка
          </button>
          <button 
            onClick={() => setActiveTab('khalyava')}
            style={{
              border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer',
              background: activeTab === 'khalyava' ? 'white' : 'transparent', color: activeTab === 'khalyava' ? 'var(--primary)' : '#666',
              boxShadow: activeTab === 'khalyava' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            📜 Ловец Халявы
          </button>
          <button 
            onClick={() => setActiveTab('superstition')}
            style={{
              border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer',
              background: activeTab === 'superstition' ? 'white' : 'transparent', color: activeTab === 'superstition' ? 'var(--primary)' : '#666',
              boxShadow: activeTab === 'superstition' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            🌟 Приметы
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* GAME 1: MASCOT PETTING CLICKER */}
        {activeTab === 'petting' && (
          <motion.div key="petting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <motion.button
                onClick={handlePetMascot}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92, rotate: -5 }}
                style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
                  border: '3px solid white',
                  boxShadow: '0 8px 24px rgba(0,127,255,0.15)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3.5rem',
                  position: 'relative',
                  margin: '0 auto'
                }}
              >
                🐱
              </motion.button>

              {/* Floating Hearts */}
              {petHearts.map(h => (
                <motion.span
                  key={h.id}
                  initial={{ opacity: 1, y: 0, scale: 0.8 }}
                  animate={{ opacity: 0, y: -45, scale: 1.4 }}
                  transition={{ duration: 0.7 }}
                  style={{ position: 'absolute', left: h.x, top: h.y, pointerEvents: 'none', color: '#EC4899' }}
                >
                  <Heart size={20} fill="#EC4899" />
                </motion.span>
              ))}
            </div>

            <div style={{ marginTop: '16px', maxWidth: '380px', margin: '16px auto 0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', fontWeight: '700', marginBottom: '6px' }}>
                <span>Уровень {levelInfo.lvl}: <span style={{ color: levelInfo.color }}>{levelInfo.title}</span></span>
                <span style={{ color: '#666', fontSize: '0.8rem' }}>{pets} поглаживаний</span>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '10px', background: '#E9ECEF', borderRadius: '5px', overflow: 'hidden' }}>
                <motion.div 
                  style={{ height: '100%', background: levelInfo.color, borderRadius: '5px' }}
                  animate={{ width: `${petPercentage}%` }}
                  transition={{ type: 'spring', stiffness: 100 }}
                />
              </div>

              <p style={{ fontSize: '0.82rem', color: '#777', marginTop: '8px' }}>
                {levelInfo.lvl < 5 ? (
                  <>Кликай на маскота! Осталось <strong>{levelInfo.next - pets}</strong> поглаживаний до нового уровня дружбы!</>
                ) : (
                  <>👑 Вы и ВИТШик — неразлейвода! Достигнут максимальный уровень дружбы!</>
                )}
              </p>
            </div>
          </motion.div>
        )}

        {/* GAME 2: FORTUNE COOKIE */}
        {activeTab === 'cookie' && (
          <motion.div key="cookie" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '16px 0' }}>
            {!cookieOpened ? (
              <div>
                <motion.button
                  onClick={openCookie}
                  disabled={cookieOpening}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  animate={cookieOpening ? { rotate: [-10, 10, -10, 10, 0], scale: [1, 1.15, 1] } : {}}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    background: '#FFF3BF',
                    border: '2px dashed #FAB005',
                    fontSize: '2.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto'
                  }}
                >
                  🥠
                </motion.button>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#555', fontWeight: '600' }}>
                  {cookieOpening ? 'ВИТШик раскалывает печенье...' : 'Нажми на печенье, чтобы узнать предсказание!'}
                </p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Sparkles size={32} color="var(--primary)" style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text)', maxWidth: '440px', margin: '0 auto 14px auto', lineHeight: '1.4' }}>
                  «{currentPrediction}»
                </p>
                <button
                  onClick={resetCookie}
                  style={{ background: '#F1F3F5', color: 'var(--primary)', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Еще одно предсказание →
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* GAME 3: COIN CLICKER */}
        {activeTab === 'coin' && (
          <motion.div key="coin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 12px 0' }}>Кликай, чтобы положить монетку под пятку перед экзаменами!</p>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <motion.button
                onClick={handleCoinClick}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.85, rotate: 15 }}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  background: '#FFE8CC',
                  border: '2px solid #FD7E14',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}
              >
                <Coins size={36} color="#FD7E14" />
              </motion.button>

              {coinBursts.map(b => (
                <motion.span
                  key={b.id}
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -40, scale: 1.4 }}
                  transition={{ duration: 0.6 }}
                  style={{ position: 'absolute', left: b.x, top: b.y, pointerEvents: 'none' }}
                >
                  <Sparkles size={16} color="#FD7E14" />
                </motion.span>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '14px' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FD7E14' }}>{coins}</div>
                <div style={{ fontSize: '0.78rem', color: '#888' }}>всего монеток</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* GAME 4: KHALYAVA CATCHER */}
        {activeTab === 'khalyava' && (
          <motion.div key="khalyava" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: '#666' }}>Поймай летающую халяву за 8 секунд!</span>
              <span style={{ fontWeight: '800', color: 'var(--primary)' }}>Поймано: {khalyavaScore}</span>
            </div>

            <div 
              style={{ 
                position: 'relative', 
                height: '160px', 
                background: '#F0F8FF', 
                borderRadius: '14px', 
                border: '1px border #BAE6FD', 
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {!khalyavaActive && !khalyavaCaught && (
                <button
                  onClick={startKhalyava}
                  style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Начать ловлю Халявы 📜
                </button>
              )}

              {khalyavaActive && (
                <motion.button
                  animate={{ left: `${khalyavaPos.x}%`, top: `${khalyavaPos.y}%` }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  onClick={catchKhalyava}
                  style={{
                    position: 'absolute',
                    transform: 'translate(-50%, -50%)',
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,127,255,0.3)'
                  }}
                >
                  <Scroll size={22} />
                </motion.button>
              )}

              {khalyavaCaught && (
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} style={{ textAlign: 'center' }}>
                  <Sparkles size={28} color="var(--primary)" />
                  <p style={{ margin: '4px 0 8px 0', fontWeight: '700', color: 'var(--primary)' }}>Поймал! Халява засчитана! 🎉</p>
                  <button onClick={startKhalyava} style={{ background: '#E9ECEF', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}>
                    Еще раз
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 5: SUPERSTITIONS */}
        {activeTab === 'superstition' && (
          <motion.div key="superstition" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {SUPERSTITIONS.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8F9FA', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E9ECEF' }}>
                  <span style={{ fontSize: '1.4rem' }}>{s.emoji}</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text)' }}>{s.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
