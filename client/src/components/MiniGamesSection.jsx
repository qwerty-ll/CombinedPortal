import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Coins, Scroll, Heart, RefreshCw, Trophy, Cookie, Cat, PenLine
} from 'lucide-react';

const ICON = { strokeWidth: 1.75, 'aria-hidden': true };
const EASE = [0.16, 1, 0.3, 1];

const PREDICTIONS = [
  "Завтрашняя лекция пройдет на одном дыхании, а конспект получится идеальным!",
  "Тебе улыбнется удача на первой же лабораторной работе!",
  "Староста пришлет тебе самые важные ответы перед тестом!",
  "Ты найдешь лучшего друга на своем направлении в ИВИТШ!",
  "Твой проект на хакатоне займет 1 место и удивит всех!",
  "Преподаватель поставит автоматом за зачет за отличную активность!",
  "В коворкинге тебя ждет самое удобное кресло и вкусный кофе!",
  "Сессия пролетит легко, если верить в себя и дружить с ВИТШиком!"
];

const SUPERSTITIONS = [
  { Icon: Coins, text: "Положи монетку под пятку перед сессией — к удаче на экзамене." },
  { Icon: Cookie, text: "Не закрывай зачётку сразу после первой оценки — удача улетит!" },
  { Icon: Scroll, text: "Кричи «Халява, приди!» в окно в ночь перед экзаменом." },
  { Icon: Cat, text: "Погладь ВИТШика в Личном кабинете перед зачетом — он принесет 100 баллов!" },
  { Icon: PenLine, text: "Пиши шпаргалки от руки — даже если не пронесешь, память зафиксирует всё." }
];

const TABS = [
  { id: 'petting', label: 'Погладь ВИТШика' },
  { id: 'cookie', label: 'Предсказание' },
  { id: 'coin', label: 'Монетка' },
  { id: 'khalyava', label: 'Ловец халявы' },
  { id: 'superstition', label: 'Приметы' }
];

const plural = (n, one, few, many) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

// Where a burst appears: the pointer position, or the centre for keyboard activation.
const burstPoint = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  if (!e.clientX && !e.clientY) return { x: rect.width / 2, y: rect.height / 2 };
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

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
    const { x, y } = burstPoint(e);
    const id = Date.now() + Math.random();
    setPetHearts(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setPetHearts(prev => prev.filter(h => h.id !== id));
    }, 800);
  };

  const levelInfo = useMemo(() => {
    if (pets < 10) return { lvl: 1, title: "Знакомые", next: 10, prev: 0 };
    if (pets < 25) return { lvl: 2, title: "Приятели", next: 25, prev: 10 };
    if (pets < 50) return { lvl: 3, title: "Друзья", next: 50, prev: 25 };
    if (pets < 100) return { lvl: 4, title: "Лучшие друзья", next: 100, prev: 50 };
    return { lvl: 5, title: "Неразлейвода", next: 500, prev: 100 };
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

    const { x, y } = burstPoint(e);
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

  const handleTabsKeyDown = (e) => {
    const ids = TABS.map(t => t.id);
    const idx = ids.indexOf(activeTab);
    let next = null;
    if (e.key === 'ArrowRight') next = ids[(idx + 1) % ids.length];
    else if (e.key === 'ArrowLeft') next = ids[(idx - 1 + ids.length) % ids.length];
    else if (e.key === 'Home') next = ids[0];
    else if (e.key === 'End') next = ids[ids.length - 1];
    if (next === null) return;
    e.preventDefault();
    setActiveTab(next);
    document.getElementById(`game-tab-${next}`)?.focus();
  };

  const petsLeft = levelInfo.next - pets;

  return (
    <section className="minigames" aria-labelledby="minigames-title">
      <div className="section-header minigames-header">
        <h2 id="minigames-title">Мини-игры и приметы ВИТШика</h2>
        <p>Погладь маскота, открой предсказание и поймай халяву.</p>
      </div>

      <div className="card minigames-card">
        {/* NAVIGATION TABS */}
        <div className="segmented minigames-tabs" role="tablist" aria-label="Мини-игры" onKeyDown={handleTabsKeyDown}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              id={`game-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              aria-controls="game-panel"
              tabIndex={activeTab === id ? 0 : -1}
              className="segmented-item"
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div id="game-panel" role="tabpanel" aria-labelledby={`game-tab-${activeTab}`} className="minigames-panel">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: EASE }}
            >
              {/* GAME 1: MASCOT PETTING CLICKER */}
              {activeTab === 'petting' && (
                <div className="game-stage">
                  <div className="game-target">
                    <motion.button
                      type="button"
                      className="pet-button"
                      onClick={handlePetMascot}
                      whileTap={{ scale: 0.94, rotate: -4 }}
                      transition={{ duration: 0.12, ease: EASE }}
                      aria-label="Погладить ВИТШика"
                    >
                      <img src="/img/mascot-320.png" alt="" draggable="false" />
                    </motion.button>

                    {/* Floating Hearts */}
                    {petHearts.map(h => (
                      <motion.span
                        key={h.id}
                        className="game-burst game-burst-heart"
                        initial={{ opacity: 1, y: 0, scale: 0.8 }}
                        animate={{ opacity: 0, y: -44, scale: 1.3 }}
                        transition={{ duration: 0.32, ease: EASE }}
                        style={{ left: h.x - 10, top: h.y - 10 }}
                        aria-hidden="true"
                      >
                        <Heart size={20} fill="currentColor" strokeWidth={1.75} />
                      </motion.span>
                    ))}
                  </div>

                  <div className="pet-level">
                    <div className="pet-level-head">
                      <span className="pet-level-title">
                        Уровень <span className="tabular">{levelInfo.lvl}</span> · {levelInfo.title}
                      </span>
                      <span className="pet-level-count tabular" aria-live="polite">
                        {pets} {plural(pets, 'поглаживание', 'поглаживания', 'поглаживаний')}
                      </span>
                    </div>

                    <div
                      className="progress"
                      role="progressbar"
                      aria-label="Прогресс до следующего уровня дружбы"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(petPercentage)}
                    >
                      <div className="progress-value" style={{ transform: `scaleX(${petPercentage / 100})` }} />
                    </div>

                    {levelInfo.lvl < 5 ? (
                      <p className="pet-level-hint">
                        Нажимай на маскота: до нового уровня дружбы осталось{' '}
                        <strong className="tabular">{petsLeft}</strong>{' '}
                        {plural(petsLeft, 'поглаживание', 'поглаживания', 'поглаживаний')}.
                      </p>
                    ) : (
                      <p className="pet-level-hint pet-level-max">
                        <Trophy size={16} {...ICON} />
                        <span>Вы с ВИТШиком неразлейвода — это максимальный уровень дружбы.</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* GAME 2: FORTUNE COOKIE */}
              {activeTab === 'cookie' && (
                <div className="game-stage">
                  {!cookieOpened ? (
                    <>
                      <motion.button
                        type="button"
                        className="cookie-button"
                        onClick={openCookie}
                        disabled={cookieOpening}
                        whileTap={{ scale: 0.94 }}
                        animate={cookieOpening ? { rotate: [0, -8, 8, 0] } : { rotate: 0 }}
                        transition={{ duration: 0.32, ease: EASE }}
                        aria-label="Открыть печенье с предсказанием"
                      >
                        <Cookie size={40} {...ICON} />
                      </motion.button>
                      <p className="game-hint" aria-live="polite">
                        {cookieOpening ? 'ВИТШик раскалывает печенье…' : 'Нажми на печенье, чтобы узнать предсказание.'}
                      </p>
                    </>
                  ) : (
                    <motion.div
                      className="prediction"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: EASE }}
                      aria-live="polite"
                    >
                      <Sparkles size={24} className="prediction-icon" {...ICON} />
                      <p className="prediction-text">«{currentPrediction}»</p>
                      <button type="button" className="btn btn-secondary" onClick={resetCookie}>
                        <RefreshCw size={16} {...ICON} />
                        Открыть ещё одно печенье
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* GAME 3: COIN CLICKER */}
              {activeTab === 'coin' && (
                <div className="game-stage">
                  <p className="game-hint">Нажимай, чтобы положить монетку под пятку перед экзаменами.</p>
                  <div className="game-target">
                    <motion.button
                      type="button"
                      className="coin-button"
                      onClick={handleCoinClick}
                      whileTap={{ scale: 0.9, rotate: 12 }}
                      transition={{ duration: 0.12, ease: EASE }}
                      aria-label="Положить монетку"
                    >
                      <Coins size={40} {...ICON} />
                    </motion.button>

                    {coinBursts.map(b => (
                      <motion.span
                        key={b.id}
                        className="game-burst game-burst-coin"
                        initial={{ opacity: 1, y: 0, scale: 1 }}
                        animate={{ opacity: 0, y: -40, scale: 1.3 }}
                        transition={{ duration: 0.32, ease: EASE }}
                        style={{ left: b.x - 8, top: b.y - 8 }}
                        aria-hidden="true"
                      >
                        <Sparkles size={16} strokeWidth={1.75} />
                      </motion.span>
                    ))}
                  </div>

                  <p className="game-counter" aria-live="polite">
                    Всего монеток: <strong className="tabular">{coins}</strong>
                  </p>
                </div>
              )}

              {/* GAME 4: KHALYAVA CATCHER */}
              {activeTab === 'khalyava' && (
                <div className="khalyava">
                  <div className="khalyava-head">
                    <p className="game-hint">Поймай летающую халяву за 8 секунд.</p>
                    <p className="khalyava-score" aria-live="polite">
                      Поймано: <span className="tabular">{khalyavaScore}</span>
                    </p>
                  </div>

                  <div className="khalyava-arena">
                    {!khalyavaActive && !khalyavaCaught && (
                      <button type="button" className="btn btn-primary" onClick={startKhalyava}>
                        <Scroll size={16} {...ICON} />
                        Начать ловлю халявы
                      </button>
                    )}

                    {khalyavaActive && (
                      <motion.div
                        className="khalyava-track"
                        initial={false}
                        animate={{ x: `${khalyavaPos.x}%`, y: `${khalyavaPos.y}%` }}
                        transition={{ duration: 0.32, ease: EASE }}
                      >
                        <button
                          type="button"
                          className="khalyava-target"
                          onClick={catchKhalyava}
                          aria-label="Поймать халяву"
                        >
                          <Scroll size={22} {...ICON} />
                        </button>
                      </motion.div>
                    )}

                    {khalyavaCaught && (
                      <motion.div
                        className="khalyava-result"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        role="status"
                      >
                        <Sparkles size={24} className="khalyava-result-icon" {...ICON} />
                        <p>Поймано — халява засчитана.</p>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={startKhalyava}>
                          Поймать ещё раз
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: SUPERSTITIONS */}
              {activeTab === 'superstition' && (
                <ul className="list omens">
                  {SUPERSTITIONS.map(({ Icon, text }, idx) => (
                    <li key={idx} className="list-row omen">
                      <span className="omen-icon"><Icon size={18} {...ICON} /></span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
