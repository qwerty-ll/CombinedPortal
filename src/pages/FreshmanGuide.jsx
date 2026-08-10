import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Link2, Map as MapIcon, BookOpen, FileText, CheckSquare, 
  ChevronRight, ChevronLeft, Zap, GraduationCap, Users, Heart, 
  LifeBuoy, ChevronDown, Check, Send, Sparkles, Smile,
  Lightbulb, Trophy, ThumbsUp, RefreshCw
} from 'lucide-react';
import MascotMessage from '../components/MascotMessage';
import { SUBJECTS } from '../data/subjectsData';
import RoadmapSection from '../components/RoadmapSection';
import { StepFoundation, StepRoadmap, StepChatbot } from '../components/StepIntroCards';
import RewardsModal from '../components/RewardsModal';

// Level Connector sub-component
const LevelConnector = ({ direction = "right" }) => (
  <div className={`connector-refined connector-${direction}`}>
    <svg width="240" height="180" viewBox="0 0 240 180">
      <motion.path 
        d={direction === "right" 
          ? "M20,0 C220,0 220,180 220,180" 
          : "M220,0 C20,0 20,180 20,180"}
        fill="none" 
        stroke="url(#connectorGradient)"
        strokeWidth="4" 
        strokeLinecap="round"
        strokeDasharray="10,15"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        transition={{ duration: 1.5 }}
      />
      <defs>
        <linearGradient id="connectorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <motion.circle 
        r="6" 
        fill="var(--primary)"
        animate={{ 
          cx: direction === "right" ? [20, 220] : [220, 20],
          cy: [0, 180],
          opacity: [0, 1, 0]
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  </div>
);

// Disciplines Accordion Item
const DisciplineItem = ({ subject }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`acc-item-wrapper ${isOpen ? 'open' : ''}`} style={{ marginBottom: '10px' }}>
      <div className="acc-item" onClick={() => setIsOpen(!isOpen)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '14px 18px', background: 'white', border: '1px solid #e9ecef', borderRadius: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>{subject.emoji}</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>{subject.name}</h4>
            <span style={{ fontSize: '0.78rem', color: '#888' }}>
              {subject.type}{subject.extraType ? ` + ${subject.extraType}` : ''} • {subject.hours} ч. • {subject.credits} з.е.
            </span>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown size={18}/>
        </motion.div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="acc-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ padding: '16px 18px', background: 'rgba(0,127,255,0.03)', borderRadius: '0 0 14px 14px', border: '1px solid rgba(0,127,255,0.1)', borderTop: 'none' }}
          >
            <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#333', lineHeight: '1.5' }}>{subject.description}</p>
            
            {subject.mascotHack && (
              <div style={{ background: '#E8F4FF', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '8px' }}>
                💡 {subject.mascotHack}
              </div>
            )}
            
            {subject.seniorAdvice && (
              <div style={{ fontSize: '0.82rem', color: '#666', italic: 'true' }}>
                💬 <strong>Совет старшекурсника:</strong> {subject.seniorAdvice}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FreshmanGuide = () => {
  const [activeTab, setActiveTab] = useState('access');
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [activeQuiz, setActiveQuiz] = useState(null); // 'intro' or 'mood' or null
  const [selectedSemester, setSelectedSemester] = useState(1);

  // Roadmap & Step Modal States
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem('freshman_roadmap_completed');
      return saved ? JSON.parse(saved) : [0];
    } catch { return [0]; }
  });
  const [activeStepModal, setActiveStepModal] = useState(null);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);

  const activeStep = Math.min(9, completedSteps.length);

  const handleStepClick = (stepId) => {
    if (stepId === 0 || stepId === 1 || stepId === 2) {
      setActiveStepModal(stepId);
    } else if (stepId === 3) {
      setActiveQuiz('intro');
    } else if (stepId === 4) {
      const el = document.getElementById('level-links');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (stepId === 5) {
      const el = document.getElementById('level-map');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (stepId === 6) {
      const el = document.getElementById('level-disciplines');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (stepId === 7) {
      setActiveQuiz('mood');
    } else if (stepId === 8) {
      setIsRewardsOpen(true);
    } else if (stepId === 9) {
      const el = document.getElementById('level-tests');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const completeStep = (stepId) => {
    if (!completedSteps.includes(stepId)) {
      const next = [...completedSteps, stepId];
      setCompletedSteps(next);
      localStorage.setItem('freshman_roadmap_completed', JSON.stringify(next));
    }
    setActiveStepModal(null);
  };

  // Zoom & Pan states for the floor maps in Guide
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset zoom & pan on floor change
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [selectedFloor]);

  const handleMouseDown = (e) => {
    if (zoom === 1) return; // Only allow pan if zoomed
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Bounds limit based on zoom factor
    const limit = (zoom - 1) * 200;
    const clampedX = Math.max(-limit, Math.min(limit, newX));
    const clampedY = Math.max(-limit, Math.min(limit, newY));
    
    setPosition({ x: clampedX, y: clampedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(4, prev + 0.5));
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const next = Math.max(1, prev - 0.5);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Load checklist items from localStorage
  const defaultChecklist = [
    { id: 1, text: "Получить студенческий билет", checked: false },
    { id: 2, text: "Заселиться в общежитие", checked: false },
    { id: 3, text: "Найти свою группу в Telegram", checked: false },
    { id: 4, text: "Познакомиться с куратором", checked: false },
    { id: 5, text: "Сделать фото у главного входа", checked: false }
  ];
  
  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem('freshman_checklist');
      return saved ? JSON.parse(saved) : defaultChecklist;
    } catch (e) {
      return defaultChecklist;
    }
  });

  const toggleChecklistItem = (id) => {
    const updated = checklist.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setChecklist(updated);
    localStorage.setItem('freshman_checklist', JSON.stringify(updated));
  };

  // --- ВХОДНОЙ ТЕСТ (10 вопросов с Верселя) ---
  const quizQuestions = [
    {
      id: 1,
      question: "Кто такой староста группы?",
      options: [
        "Студент, выбранный группой для связи с администрацией и преподавателями",
        "Преподаватель, который ведёт основную дисциплину",
        "Сотрудник профсоюзной организации",
        "Наставник со старшего курса"
      ],
      correctIndex: 0,
      explanation: "Староста — это студент, который представляет интересы группы, взаимодействует с дирекцией ИВИТШ и преподавателями, а также помогает решать организационные вопросы."
    },
    {
      id: 2,
      question: "К кому лучше обратиться, если нужна помощь с адаптацией, подготовкой к экзамену или сложной темой?",
      options: [
        "К культоргу",
        "К тьютору",
        "К профоргу",
        "К дирекции"
      ],
      correctIndex: 1,
      explanation: "Тьютор — это студент старших курсов или преподаватель, который помогает первокурсникам адаптироваться в вузе и справиться с учебными трудностями."
    },
    {
      id: 3,
      question: "За что отвечает куратор группы?",
      options: [
        "Только за проведение экзаменов",
        "За учебно-воспитательную работу, адаптацию и контроль успеваемости",
        "Только за спортивные мероприятия",
        "За начисление стипендии"
      ],
      correctIndex: 1,
      explanation: "Куратор — это преподаватель, закреплённый за группой, который помогает студентам влиться в студенческую жизнь, контролирует успеваемость и проводит кураторские часы."
    },
    {
      id: 4,
      question: "Кто поможет студенту с социальными вопросами, льготами, общежитием или материальной поддержкой?",
      options: [
        "Профорг",
        "Культорг",
        "Староста",
        "Тьютор"
      ],
      correctIndex: 0,
      explanation: "Профорг (профсоюзный организатор) группы помогает студентам с вопросами материальной помощи, льготных проездных, путевок и защиты социальных прав."
    },
    {
      id: 5,
      question: "Что такое академическая стипендия?",
      options: [
        "Выплата за участие в мероприятиях университета",
        "Выплата студенту за учебные успехи на очной бюджетной форме обучения",
        "Разовая помощь студенту в сложной жизненной ситуации",
        "Выплата только студентам, живущим в общежитии"
      ],
      correctIndex: 1,
      explanation: "Государственная академическая стипендия назначается студентам-бюджетникам очной формы, сдавшим сессию без троек (на «хорошо» и «отлично») и не имеющим академической задолженности."
    },
    {
      id: 6,
      question: "Когда выплата академической стипендии приостанавливается?",
      options: [
        "Если студент не состоит в студенческом объединении",
        "Если студент получил по результатам сессии “удовлетворительно” или “неудовлетворительно”",
        "Если студент не посещает культурные мероприятия",
        "Если студент не подал заявление в профком"
      ],
      correctIndex: 1,
      explanation: "Академическая стипендия перестаёт выплачиваться, если по итогам сессии у студента появляется оценка «удовлетворительно» (3) или академическая задолженность («неудовлетворительно»)."
    },
    {
      id: 7,
      question: "Где можно узнать, какие экзамены и зачёты будут в семестре?",
      options: [
        "В учебном плане направления в ЭИОС",
        "Только у одногруппников",
        "Только в социальных сетях университета",
        "Только в расписании занятий"
      ],
      correctIndex: 0,
      explanation: "Все дисциплины, а также формы их контроля (зачёт, экзамен, курсовая работа) прописаны в учебном плане, который доступен в ЭИОС (Электронной информационно-образовательной среде) вуза."
    },
    {
      id: 8,
      question: "Чем лекция отличается от лабораторной работы?",
      options: [
        "На лекции студенты выполняют практические задания, а на лабораторной только слушают преподавателя",
        "На лекции преподаватель объясняет теорию, а на лабораторной студенты выполняют практические задания",
        "Лекция и лабораторная работа ничем не отличаются",
        "Лабораторная работа всегда проходит без преподавателя"
      ],
      correctIndex: 1,
      explanation: "Лекция — это теоретическое занятие для потока студентов. Лабораторная работа — это практика, где студенты применяют теорию на практике (например, пишут код за компьютерами)."
    },
    {
      id: 9,
      question: "Что такое дифференцированный зачёт?",
      options: [
        "Зачёт, где ставится только “зачтено” или “незачтено”",
        "Форма аттестации, где оценка выставляется по шкале от 2 до 5",
        "Экзамен",
        "Зачёт, который можно не сдавать при хорошей посещаемости"
      ],
      correctIndex: 1,
      explanation: "Дифференцированный зачёт (зачёт с оценкой) оценивается так же, как экзамен: «отлично» (5), «хорошо» (4), «удовлетворительно» (3), «неудовлетворительно» (2). Эта оценка влияет на стипендию."
    },
    {
      id: 10,
      question: "Что такое СДО?",
      options: [
        "Система дистанционного обучения, где размещаются лекции, задания, тесты и ответы студентов",
        "Сайт только для просмотра расписания",
        "Кабинет дирекции института",
        "Студенческое объединение института"
      ],
      correctIndex: 0,
      explanation: "СДО (Система дистанционного обучения, например Moodle) — это портал, где преподаватели выкладывают материалы курсов, задания и проводят тестирование."
    }
  ];

  // --- ТЕСТ НА НАСТРОЕНИЕ (10 вопросов с Верселя) ---
  const moodQuestions = [
    { id: "q1", text: "Я чувствую себя спокойно и уверенно в новой учебной среде." },
    { id: "q2", text: "Мне понятно, к кому можно обратиться за помощью в университете." },
    { id: "q3", text: "Я быстро привыкаю к новому расписанию, преподавателям и требованиям." },
    { id: "q4", text: "Мне интересно учиться на моем направлении." },
    { id: "q5", text: "Мне комфортно общаться с одногруппниками." },
    { id: "q6", text: "Я не боюсь задавать вопросы преподавателям, старосте, куратору или тьютору." },
    { id: "q7", text: "Мне кажется я справляюсь с учебной нагрузкой." },
    { id: "q8", text: "У меня достаточно сил, энергии и мотивации для учёбы." },
    { id: "q9", text: "Я понимаю, как организовать своё время между учёбой, отдыхом и личными делами." },
    { id: "q10", text: "В целом я чувствую себя частью университетской среды." }
  ];

  const moodOptions = [
    { label: "1 — Совсем не согласен", value: 1 },
    { label: "2 — Скорее не согласен", value: 2 },
    { label: "3 — Нейтрально", value: 3 },
    { label: "4 — Скорее согласен", value: 4 },
    { label: "5 — Полностью согласен", value: 5 }
  ];

  const moodResultLevels = [
    {
      id: "red",
      name: "Нужна поддержка",
      emoji: "❤️‍🩹",
      color: "#FF3B30",
      bgColor: "#FFF1F0",
      minScore: 10,
      mascotReaction: "Эй, я вижу, что тебе сейчас нелегко. Начало учёбы — это огромный стресс, и это нормально, что ты устаёшь или чувствуешь себя потерянным. Ты не обязан справляться со всем в одиночку. ВИТШик мысленно обнимает тебя 🫂",
      advice: "Поговори с куратором, тьютором или психологом университета. Они здесь именно для того, чтобы помогать в таких ситуациях. Не копи проблемы — поделись ими."
    },
    {
      id: "yellow",
      name: "В процессе адаптации",
      emoji: "🌱",
      color: "#FF9500",
      bgColor: "#FFF7ED",
      minScore: 25,
      mascotReaction: "Всё идёт своим чередом! Ты уже осваиваешься, но иногда бывает сложно — это абсолютно нормально для первого семестра. Главное — не забывай отдыхать! 😸",
      advice: "Старайся лучше планировать время и не стесняйся задавать вопросы преподавателям или одногруппникам. У тебя всё получится!"
    },
    {
      id: "green",
      name: "Уверенный старт",
      emoji: "🚀",
      color: "#34C759",
      bgColor: "#EDFFF3",
      minScore: 40,
      mascotReaction: "Ты просто огонь! Уверенно ворвался в студенческую жизнь и уже чувствуешь себя как рыба в воде. Так держать, первокурсник! 😻",
      advice: "Используй эту энергию по максимуму — записывайся в студенческие клубы, участвуй в мероприятиях и заводи полезные знакомства."
    }
  ];

  // Quiz logic states (Входной тест)
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState(null);
  const [quizAnswerState, setQuizAnswerState] = useState("idle"); // "idle", "correct", "incorrect"
  const [quizResults, setQuizResults] = useState([]);
  const [quizIsFinished, setQuizIsFinished] = useState(false);

  const handleQuizOptionSelect = (index) => {
    if (quizAnswerState !== "idle") return;
    const isCorrect = index === quizQuestions[quizCurrentIndex].correctIndex;
    setQuizSelectedOption(index);
    setQuizAnswerState(isCorrect ? "correct" : "incorrect");
    setQuizResults(prev => [...prev, { questionId: quizQuestions[quizCurrentIndex].id, correct: isCorrect }]);
  };

  const handleQuizNext = () => {
    if (quizCurrentIndex + 1 >= quizQuestions.length) {
      setQuizIsFinished(true);
    } else {
      setQuizCurrentIndex(prev => prev + 1);
      setQuizSelectedOption(null);
      setQuizAnswerState("idle");
    }
  };

  const resetQuiz = () => {
    setQuizCurrentIndex(0);
    setQuizSelectedOption(null);
    setQuizAnswerState("idle");
    setQuizResults([]);
    setQuizIsFinished(false);
  };

  // Mood test logic states (Тест на настроение)
  const [moodAnswers, setMoodAnswers] = useState({});
  const [moodCurrentQ, setMoodCurrentQ] = useState(0);
  const [moodPhase, setMoodPhase] = useState("intro"); // "intro", "quiz", "result"

  const handleMoodAnswer = (questionId, value) => {
    const nextAnswers = { ...moodAnswers, [questionId]: value };
    setMoodAnswers(nextAnswers);

    if (moodCurrentQ < moodQuestions.length - 1) {
      setTimeout(() => setMoodCurrentQ(prev => prev + 1), 200);
    } else {
      setTimeout(() => setMoodPhase("result"), 300);
    }
  };

  const getMoodTotalScore = () => {
    return Object.values(moodAnswers).reduce((s, v) => s + v, 0);
  };

  const getMoodResultLevel = () => {
    const score = getMoodTotalScore();
    let result = moodResultLevels[0];
    for (const level of moodResultLevels) {
      if (score >= level.minScore) result = level;
    }
    return result;
  };

  const resetMoodTest = () => {
    setMoodAnswers({});
    setMoodCurrentQ(0);
    setMoodPhase("intro");
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Путь первокурсника</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '30px' }}>
        
        {/* ROADMAP ADAPTATION SECTION */}
        <section id="level-roadmap">
          <RoadmapSection 
            activeStep={activeStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </section>

        {/* LEVEL 1: LINKS */}
        <section id="level-links" className="level-section">
          <MascotMessage text="Привет! Давай знакомиться с нашим вузом. Здесь ты быстро найдешь все самые полезные ссылки!" />
          
          <div className={`level-card links-card theme-${activeTab}`}>
            <div className="card-bg-icons">
               {activeTab === 'access' && "⚡ 📋 📅 🔑".split(' ').map((e,i) => <span key={i} className="bg-emoji">{e}</span>)}
               {activeTab === 'study' && "📚 🎓 📝 🔬".split(' ').map((e,i) => <span key={i} className="bg-emoji">{e}</span>)}
               {activeTab === 'school' && "💻 👨‍💻 🤖 🚀".split(' ').map((e,i) => <span key={i} className="bg-emoji">{e}</span>)}
               {activeTab === 'life' && "🍕 🎸 🏀 🎭".split(' ').map((e,i) => <span key={i} className="bg-emoji">{e}</span>)}
               {activeTab === 'support' && "🆘 🛡️ 🚑 💬".split(' ').map((e,i) => <span key={i} className="bg-emoji">{e}</span>)}
            </div>

            <div className="tabs-header-innovative">
                {[
                  { id: 'access', label: 'Быстрый доступ', icon: <Zap size={16}/>, color: '#007FFF' },
                  { id: 'study', label: 'Учеба и расписание', icon: <GraduationCap size={16}/>, color: '#673AB7' },
                  { id: 'school', label: 'Высшая ИТ-школа', icon: <Users size={16}/>, color: '#00BCD4' },
                  { id: 'life', label: 'Студенческая жизнь', icon: <Heart size={16}/>, color: '#D32F2F' },
                  { id: 'support', label: 'Поддержка студентов', icon: <LifeBuoy size={16}/>, color: '#009688' }
                ].map((t) => (
                  <button 
                   key={t.id} 
                   className={`tab-btn-innovative ${activeTab === t.id ? 'active' : ''}`} 
                   onClick={() => setActiveTab(t.id)}
                   style={{ '--tab-color': t.color }}
                  >
                    <div className="tab-icon-wrapper">{t.icon}</div>
                    <span>{t.label}</span>
                  </button>
                ))}
            </div>

            <div className="links-content-innovative">
               <AnimatePresence mode="wait">
                 <motion.ul 
                   key={activeTab}
                   className="game-links-innovative"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   transition={{ duration: 0.3 }}
                 >
                    {activeTab === 'access' && (
                      <>
                        <li><a href="https://guide.kosgos.ru/" target="_blank" rel="noopener noreferrer"><FileText size={16}/> Справочник первокурсника</a></li>
                        <li><a href="https://eios.kosgos.ru/WebApp/#/Rasp/Group/8540" target="_blank" rel="noopener noreferrer"><BookOpen size={16}/> Расписание занятий</a></li>
                        <li><a href="https://eios.kosgos.ru" target="_blank" rel="noopener noreferrer"><Zap size={16}/> Вход в СДО ЕИОС</a></li>
                        <li><a href="https://kosgos.ru" target="_blank" rel="noopener noreferrer"><Users size={16}/> Сайт Университета</a></li>
                      </>
                    )}
                    {activeTab === 'study' && (
                      <>
                        <li><a href="https://lib.kosgos.ru" target="_blank" rel="noopener noreferrer">Библиотека ВУЗа</a></li>
                        <li><a href="https://eios.kosgos.ru" target="_blank" rel="noopener noreferrer">Электронные курсы</a></li>
                        <li><a href="https://science.kosgos.ru" target="_blank" rel="noopener noreferrer">Научные работы</a></li>
                      </>
                    )}
                    {activeTab === 'school' && (
                      <>
                        <li><a href="https://kosgos.ru/svedeniya-ob-organizatsii/struktura-i-organy-upravleniya/instituty/institut-vysshaya-it-shkola.html" target="_blank" rel="noopener noreferrer">О дирекции ИВИТШ</a></li>
                        <li><a href="https://t.me/ivitsh_chat" target="_blank" rel="noopener noreferrer">Telegram чат ИВИТШ</a></li>
                        <li><a href="https://vk.com/ivitsh" target="_blank" rel="noopener noreferrer">Группа VK ИВИТШ</a></li>
                      </>
                    )}
                    {activeTab === 'life' && (
                      <>
                        <li><a href="https://vk.com/studsovet_kosgos" target="_blank" rel="noopener noreferrer"><Users size={16} /> Студенческий совет КГУ</a></li>
                        <li><a href="https://vk.com/profkom_kosgos" target="_blank" rel="noopener noreferrer"><Heart size={16} /> Профком студентов</a></li>
                        <li><a href="https://vk.com/sport_kosgos" target="_blank" rel="noopener noreferrer"><Zap size={16} /> Спортивный клуб</a></li>
                        <li><a href="https://vk.com/creative_kosgos" target="_blank" rel="noopener noreferrer"><Sparkles size={16} /> Творческие объединения</a></li>
                      </>
                    )}
                    {activeTab === 'support' && (
                      <>
                        <li><a href="https://kosgos.ru/studentam/stipendii/" target="_blank" rel="noopener noreferrer"><GraduationCap size={16} /> Стипендии и материальная помощь</a></li>
                        <li><a href="https://kosgos.ru/studentam/obshchezhitiya/" target="_blank" rel="noopener noreferrer"><LifeBuoy size={16} /> Общежития и заселение</a></li>
                        <li><a href="https://kosgos.ru/studentam/psikhologicheskaya-pomoshch/" target="_blank" rel="noopener noreferrer"><Heart size={16} /> Психологическая поддержка</a></li>
                        <li><a href="https://kosgos.ru/kontakty/" target="_blank" rel="noopener noreferrer"><Sparkles size={16} /> Контакты приёмной комиссии</a></li>
                      </>
                    )}
                 </motion.ul>
               </AnimatePresence>
            </div>
          </div>
          <LevelConnector direction="right" />
        </section>

        {/* LEVEL 2: MAP */}
        <section id="level-map" className="level-section">
          <MascotMessage text="А теперь посмотрим, где именно будут проходить твои пары — выбирай нужный этаж на схеме!" position="right" />
          
          <div className="level-card map-card">
            <div className="map-header">
              <h3 style={{ margin: 0, fontWeight: '750' }}>Карта корпуса ИВИТШ</h3>
              <div className="floor-tabs" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                {[1, 2, 3, 4].map(f => (
                  <button 
                    key={f} 
                    className={`floor-tab ${selectedFloor === f ? 'active' : ''}`}
                    onClick={() => setSelectedFloor(f)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #dee2e6',
                      background: selectedFloor === f ? 'var(--primary)' : 'white',
                      color: selectedFloor === f ? 'white' : '#666',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {f} этаж
                  </button>
                ))}
              </div>
            </div>
            <div 
              className="map-viewport-container" 
              style={{ marginTop: '20px', cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
               <AnimatePresence mode="wait">
                 <motion.img 
                   key={selectedFloor}
                   src={`/img/floors/${selectedFloor}.png`} 
                   alt={`${selectedFloor} этаж`}
                   className="map-zoomable-image"
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.05 }}
                   transition={{ duration: 0.3 }}
                   style={{
                     transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                     transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                   }}
                 />
               </AnimatePresence>

              <div className="map-zoom-overlay-controls">
                <button className="zoom-control-btn" onClick={handleZoomIn} title="Приблизить">+</button>
                <button className="zoom-control-btn" onClick={handleZoomOut} title="Отдалить">-</button>
                <button className="zoom-control-btn" onClick={handleResetZoom} title="Сбросить" style={{ fontSize: '14px' }}>↺</button>
              </div>
            </div>
          </div>
          <LevelConnector direction="left" />
        </section>

        {/* LEVEL 3: DISCIPLINES (ALL 24 SUBJECTS OF IVITSH KSU) */}
        <section id="level-disciplines" className="level-section">
          <MascotMessage text="Здесь опубликован полный каталог всех 24 предметов ИВИТШ КГУ! Нажми на предмет, чтобы узнать лайфхак от ВИТШика и совет старшекурсника." />
          
          <div className="level-card disciplines-card">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
               <h3 style={{ margin: 0, fontWeight: '750' }}>Дисциплины ИВИТШ КГУ ({SUBJECTS.filter(s => s.semester === selectedSemester).length})</h3>
               
               <div style={{ display: 'flex', gap: '8px' }}>
                 {[1, 2].map(sem => (
                   <button 
                     key={sem} 
                     className={`floor-tab ${selectedSemester === sem ? 'active' : ''}`}
                     onClick={() => setSelectedSemester(sem)}
                     style={{
                       padding: '6px 14px',
                       borderRadius: '8px',
                       border: '1px solid #dee2e6',
                       background: selectedSemester === sem ? 'var(--primary)' : 'white',
                       color: selectedSemester === sem ? 'white' : '#666',
                       fontWeight: '600',
                       fontSize: '0.85rem',
                       cursor: 'pointer'
                     }}
                   >
                     {sem}-й семестр
                   </button>
                 ))}
               </div>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               {SUBJECTS.filter(s => s.semester === selectedSemester).map(subject => (
                 <DisciplineItem key={subject.id} subject={subject} />
               ))}
             </div>
          </div>
          <LevelConnector direction="right" />
        </section>

        {/* LEVEL 4: TESTS */}
        <section id="level-tests" className="level-section">
          <MascotMessage text="А теперь давай пройдем два мини-теста. Проверим, как ты освоился, и узнаем твое настроение!" position="right" />
          
          <div className="level-card tests-card">
            <h3 style={{ margin: '0 0 20px 0', fontWeight: '750' }}>Интерактивные тесты</h3>
            <div className="test-btns" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn-game" onClick={() => { setActiveQuiz('intro'); setQuizScore(null); }}>Входной тест</button>
              <button className="btn-game" onClick={() => { setActiveQuiz('mood'); setMoodResult(null); }}>Тест на настроение</button>
            </div>

            {/* QUIZ MODALS */}
            <AnimatePresence>
              {activeQuiz === 'intro' && (
                <div className="modal-overlay" onClick={() => { setActiveQuiz(null); resetQuiz(); }}>
                  <div className="auth-modal quiz-modal-container" onClick={(e) => e.stopPropagation()} style={{ width: '480px', padding: '25px' }}>
                    <button className="close-modal" onClick={() => { setActiveQuiz(null); resetQuiz(); }}>×</button>
                    
                    {!quizIsFinished ? (
                      <div>
                        {/* Header with Mascot */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                          <div>
                            <h3 style={{ margin: 0, fontWeight: '800', color: 'var(--primary)' }}>Входной тест</h3>
                            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#888' }}>Проверь свои знания об ИВИТШ</p>
                          </div>
                          <div 
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              try {
                                const audio = new Audio('/sounds/meow.mp3');
                                audio.volume = 0.4;
                                audio.play().catch(() => {});
                              } catch(e) {}
                            }}
                          >
                            <motion.img 
                              src="/img/mascot.png" 
                              alt="ВИТШик" 
                              style={{ width: '54px', height: '54px', objectFit: 'contain' }}
                              animate={quizAnswerState === "correct" 
                                ? { y: [0, -10, 0], rotate: [0, -5, 5, 0] } 
                                : quizAnswerState === "incorrect" 
                                  ? { x: [-5, 5, -5, 5, 0] } 
                                  : { scale: [1, 1.05, 1] }
                              }
                              transition={quizAnswerState !== "idle" ? { duration: 0.5 } : { duration: 3, repeat: Infinity }}
                            />
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: '15px' }}>
                          <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>
                            <span>Вопрос {quizCurrentIndex + 1} из {quizQuestions.length}</span>
                            <span style={{ marginLeft: 'auto' }}>{Math.round(((quizCurrentIndex + (quizAnswerState !== "idle" ? 1 : 0)) / quizQuestions.length) * 100)}%</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(0,127,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <motion.div 
                              style={{ height: '100%', background: 'var(--primary)', borderRadius: '3px' }}
                              animate={{ width: `${((quizCurrentIndex + (quizAnswerState !== "idle" ? 1 : 0)) / quizQuestions.length) * 100}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>

                        {/* Mascot reaction bubble */}
                        <AnimatePresence>
                          {quizAnswerState !== "idle" && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              style={{
                                textAlign: 'center',
                                padding: '8px 12px',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                marginBottom: '15px',
                                background: quizAnswerState === "correct" ? '#E8F4FF' : '#FFF0EE',
                                color: quizAnswerState === "correct" ? 'var(--primary)' : '#FF3B30'
                              }}
                            >
                              {quizAnswerState === "correct" ? "🎉 Правильно! Молодец!" : "😿 Не переживай, ВИТШик верит в тебя!"}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Question Text */}
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '800', lineHeight: '1.4', marginBottom: '15px', color: 'var(--text)' }}>
                          {quizQuestions[quizCurrentIndex].question}
                        </h4>

                        {/* Options Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                          {quizQuestions[quizCurrentIndex].options.map((opt, idx) => {
                            const isSelected = quizSelectedOption === idx;
                            const isCorrectOption = idx === quizQuestions[quizCurrentIndex].correctIndex;
                            let styleObj = { cursor: 'pointer' };
                            
                            if (quizAnswerState !== "idle") {
                              styleObj.cursor = 'default';
                              if (isCorrectOption) {
                                styleObj.background = 'var(--primary)';
                                styleObj.borderColor = 'var(--primary)';
                                styleObj.color = 'white';
                              } else if (isSelected && !isCorrectOption) {
                                styleObj.background = '#FF3B30';
                                styleObj.borderColor = '#FF3B30';
                                styleObj.color = 'white';
                              } else {
                                styleObj.background = '#f8f9fa';
                                styleObj.borderColor = '#e9ecef';
                                styleObj.color = '#adb5bd';
                              }
                            }

                            return (
                              <button
                                key={idx}
                                className="quiz-option-card-btn"
                                style={styleObj}
                                onClick={() => handleQuizOptionSelect(idx)}
                                disabled={quizAnswerState !== "idle"}
                              >
                                <span style={{ marginRight: '8px', fontWeight: '800' }}>
                                  {String.fromCharCode(65 + idx)}.
                                </span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation Card */}
                        <AnimatePresence>
                          {quizAnswerState !== "idle" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ 
                                display: 'flex', 
                                gap: '8px', 
                                padding: '12px', 
                                background: '#F0F8FF', 
                                borderRadius: '12px', 
                                fontSize: '0.85rem', 
                                color: '#374151', 
                                borderLeft: '3px solid var(--primary)',
                                marginBottom: '15px'
                              }}>
                                <Lightbulb size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                                <span>
                                  <strong>Объяснение:</strong> {quizQuestions[quizCurrentIndex].explanation}
                                </span>
                              </div>

                              <button 
                                className="btn-auth" 
                                style={{ width: '100%', marginTop: 0 }}
                                onClick={handleQuizNext}
                              >
                                {quizCurrentIndex + 1 >= quizQuestions.length ? "Посмотреть результат" : "Следующий вопрос →"}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                          <motion.img 
                            src="/img/mascot.png" 
                            alt="ВИТШик" 
                            style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        </div>
                        
                        <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text)' }}>
                          {quizResults.filter(r => r.correct).length >= 8 ? "🏆 Отличный результат!" : "👍 Тест пройден!"}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: '#666', margin: '5px 0 15px 0' }}>
                          {quizResults.filter(r => r.correct).length >= 8 
                            ? "ВИТШик гордится тобой! Ты прекрасно готов к началу учебы!" 
                            : "Хороший старт! Изучи FAQ и полезные контакты, чтобы ориентироваться еще лучше."}
                        </p>

                        {/* Circular Score Badge */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                          <div 
                            style={{ 
                              width: '100px', 
                              height: '100px', 
                              borderRadius: '50%', 
                              background: `conic-gradient(var(--primary) ${quizResults.filter(r => r.correct).length * 36}deg, #E8F4FF ${quizResults.filter(r => r.correct).length * 36}deg)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary)' }}>
                                {quizResults.filter(r => r.correct).length}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#999' }}>из {quizQuestions.length}</span>
                            </div>
                          </div>
                        </div>

                        {/* Dot breakdown grid */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '25px', flexWrap: 'wrap' }}>
                          {quizResults.map((r, i) => (
                            <div 
                              key={i} 
                              style={{ 
                                width: '28px', 
                                height: '28px', 
                                borderRadius: '50%', 
                                background: r.correct ? 'var(--primary)' : '#FF3B30', 
                                color: 'white', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                              }}
                              title={`Вопрос ${i + 1}`}
                            >
                              {r.correct ? "✓" : "✗"}
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button className="btn-auth" style={{ flex: 1, marginTop: 0 }} onClick={resetQuiz}>
                            <RefreshCw size={14} style={{ marginRight: '5px', verticalAlign: 'text-bottom' }} /> Пройти заново
                          </button>
                          <button 
                            className="btn-auth secondary" 
                            style={{ flex: 1, marginTop: 0, background: 'none', border: '1px solid #dee2e6', color: '#666' }} 
                            onClick={() => { setActiveQuiz(null); resetQuiz(); }}
                          >
                            Закрыть
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeQuiz === 'mood' && (
                <div className="modal-overlay" onClick={() => { setActiveQuiz(null); resetMoodTest(); }}>
                  <div className="auth-modal quiz-modal-container" onClick={(e) => e.stopPropagation()} style={{ width: '480px', padding: '25px' }}>
                    <button className="close-modal" onClick={() => { setActiveQuiz(null); resetMoodTest(); }}>×</button>
                    
                    {moodPhase === 'intro' && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🧘‍♂️</div>
                        <h3 style={{ fontWeight: '800', marginBottom: '10px', color: 'var(--text)' }}>Оцени своё состояние</h3>
                        <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: '1.5', marginBottom: '20px' }}>
                          Тебе предстоит ответить на 10 простых вопросов о том, как ты себя чувствуешь в университете. Это поможет маскоту ВИТШику понять твой этап адаптации и подсказать совет.
                        </p>
                        <div style={{ background: '#F0F8FF', borderRadius: '12px', padding: '10px 15px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '20px' }}>
                          <strong>Шкала оценок:</strong><br />
                          1 — совсем не согласен / не чувствую этого<br />
                          5 — полностью согласен / чувствую это отлично
                        </div>
                        <button className="btn-auth" style={{ width: '100%', marginTop: 0 }} onClick={() => setMoodPhase('quiz')}>
                          Начать тест →
                        </button>
                      </div>
                    )}

                    {moodPhase === 'quiz' && (
                      <div>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                          <h3 style={{ margin: 0, fontWeight: '800', color: 'var(--primary)' }}>Тест на настроение</h3>
                          <img src="/img/mascot.png" alt="ВИТШик" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>
                            <span>Вопрос {moodCurrentQ + 1} из {moodQuestions.length}</span>
                            <span style={{ marginLeft: 'auto' }}>{Math.round((moodCurrentQ / moodQuestions.length) * 100)}%</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(0,127,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <motion.div 
                              style={{ height: '100%', background: 'var(--primary)', borderRadius: '3px' }}
                              animate={{ width: `${(moodCurrentQ / moodQuestions.length) * 100}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>

                        {/* Question Text */}
                        <div style={{ minHeight: '60px', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: '800', lineHeight: '1.4', margin: 0, color: 'var(--text)' }}>
                            {moodQuestions[moodCurrentQ].text}
                          </h4>
                        </div>

                        {/* Options Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {moodOptions.map((opt) => (
                            <button
                              key={opt.value}
                              className="quiz-option-card-btn"
                              onClick={() => handleMoodAnswer(moodQuestions[moodCurrentQ].id, opt.value)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {moodPhase === 'result' && (
                      <div>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                          <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>{getMoodResultLevel().emoji}</div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: getMoodResultLevel().color, letterSpacing: '1px' }}>
                            Твой результат
                          </span>
                          <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: getMoodResultLevel().color, margin: '2px 0' }}>
                            {getMoodResultLevel().name}
                          </h3>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#888' }}>
                            {getMoodTotalScore()} из 50 баллов
                          </span>
                        </div>

                        {/* Mascot reaction bubble */}
                        <div style={{ 
                          display: 'flex', 
                          gap: '12px', 
                          padding: '12px', 
                          background: 'white', 
                          borderRadius: '16px', 
                          border: '1px solid rgba(0,127,255,0.08)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                          marginBottom: '15px'
                        }}>
                          <img src="/img/mascot.png" alt="ВИТШик" style={{ width: '48px', height: '48px', objectFit: 'contain', flexShrink: 0 }} />
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>ВИТШик говорит:</span>
                            <p style={{ fontSize: '0.82rem', color: '#4b5563', margin: '2px 0 0 0', fontStyle: 'italic', lineHeight: '1.4' }}>
                              «{getMoodResultLevel().mascotReaction}»
                            </p>
                          </div>
                        </div>

                        {/* Advice Card */}
                        <div style={{ 
                          padding: '12px', 
                          background: getMoodResultLevel().bgColor, 
                          color: '#374151',
                          borderRadius: '12px',
                          fontSize: '0.82rem',
                          borderLeft: `3px solid ${getMoodResultLevel().color}`,
                          marginBottom: '20px'
                        }}>
                          <Lightbulb size={16} style={{ color: getMoodResultLevel().color, verticalAlign: 'text-bottom', marginRight: '5px' }} />
                          <strong>Что делать:</strong> {getMoodResultLevel().advice}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button className="btn-auth" style={{ flex: 1, marginTop: 0, background: getMoodResultLevel().color, borderColor: getMoodResultLevel().color }} onClick={resetMoodTest}>
                            <RefreshCw size={14} style={{ marginRight: '5px', verticalAlign: 'text-bottom' }} /> Пройти заново
                          </button>
                          <button 
                            className="btn-auth secondary" 
                            style={{ flex: 1, marginTop: 0, background: 'none', border: '1px solid #dee2e6', color: '#666' }} 
                            onClick={() => { setActiveQuiz(null); resetMoodTest(); }}
                          >
                            Закрыть
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
          <LevelConnector direction="left" />
        </section>

        {/* LEVEL 5: CHECKLIST */}
        <section id="level-checklist" className="level-section">
          <MascotMessage text="И напоследок — твой чек-лист первокурсника. Отметь, что уже сделано, чтобы ничего не забыть!" />
          
          <div className="level-card checklist-card">
            <h3 style={{ margin: '0 0 20px 0', fontWeight: '750' }}>Чек-лист важных дел</h3>
            {checklist.map((item) => (
              <div 
                key={item.id} 
                className="check-item" 
                onClick={() => toggleChecklistItem(item.id)}
                style={{ opacity: item.checked ? 0.75 : 1 }}
              >
                <input 
                  type="checkbox" 
                  checked={item.checked} 
                  onChange={() => {}} // Controlled in parent onClick
                  id={`task-${item.id}`}
                />
                <label 
                  htmlFor={`task-${item.id}`} 
                  style={{ 
                    cursor: 'pointer', 
                    textDecoration: item.checked ? 'line-through' : 'none',
                    color: item.checked ? '#888' : 'inherit'
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevents double toggles
                >
                  {item.text}
                </label>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* STEP INTRO MODALS (Steps 0, 1, 2) */}
      <AnimatePresence>
        {activeStepModal !== null && (
          <div className="modal-overlay" onClick={() => setActiveStepModal(null)}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()} style={{ width: '520px', padding: '25px' }}>
              <button className="close-modal" onClick={() => setActiveStepModal(null)}>×</button>
              {activeStepModal === 0 && <StepFoundation onComplete={() => completeStep(0)} />}
              {activeStepModal === 1 && <StepRoadmap onComplete={() => completeStep(1)} />}
              {activeStepModal === 2 && <StepChatbot onComplete={() => completeStep(2)} />}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* REWARDS MODAL */}
      <RewardsModal isOpen={isRewardsOpen} onClose={() => setIsRewardsOpen(false)} />
    </div>
  );
};

export default FreshmanGuide;
