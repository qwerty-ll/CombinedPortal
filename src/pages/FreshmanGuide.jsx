import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Link2, Map as MapIcon, BookOpen, FileText, CheckSquare, 
  ChevronRight, ChevronLeft, Zap, GraduationCap, Users, Heart, 
  LifeBuoy, ChevronDown, Check, Send, Sparkles, Smile,
  Lightbulb, Trophy, ThumbsUp, RefreshCw, X
} from 'lucide-react';
import MascotMessage from '../components/MascotMessage';
import { SUBJECTS } from '../data/subjectsData';
import RoadmapSection, { ROADMAP_STEPS } from '../components/RoadmapSection';
import { StepFoundation, StepRoadmap, StepChatbot } from '../components/StepIntroCards';
import QuizModal from '../components/QuizModal';
import EmotionalTestModal from '../components/EmotionalTestModal';
import ChecklistModal from '../components/ChecklistModal';
import FunLayerModal from '../components/FunLayerModal';
import RewardsModal from '../components/RewardsModal';

// Disciplines Accordion Item
const DisciplineItem = ({ subject }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ marginBottom: '10px' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ 
          display: 'flex', 
          justify: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer', 
          padding: '14px 18px', 
          background: 'white', 
          border: '1px solid #e9ecef', 
          borderRadius: isOpen ? '14px 14px 0 0' : '14px',
          transition: 'all 0.2s'
        }}
      >
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
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ 
              padding: '16px 18px', 
              background: 'rgba(0,127,255,0.03)', 
              borderRadius: '0 0 14px 14px', 
              border: '1px solid rgba(0,127,255,0.15)', 
              borderTop: 'none' 
            }}
          >
            <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#333', lineHeight: '1.5' }}>{subject.description}</p>
            
            {subject.mascotHack && (
              <div style={{ background: '#E8F4FF', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '8px' }}>
                💡 {subject.mascotHack}
              </div>
            )}
            
            {subject.seniorAdvice && (
              <div style={{ fontSize: '0.82rem', color: '#666', fontStyle: 'italic' }}>
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
  const [selectedSemester, setSelectedSemester] = useState(1);

  // Roadmap Progress State
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem('freshman_roadmap_completed');
      return saved ? JSON.parse(saved) : [0];
    } catch { return [0]; }
  });

  const [activeStepModal, setActiveStepModal] = useState(null); // stepId 0..9 or null
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);

  const activeStep = Math.min(9, completedSteps.length);

  const handleStepClick = (stepId) => {
    if (stepId === 8) {
      setIsRewardsOpen(true);
    } else {
      setActiveStepModal(stepId);
    }
  };

  const completeStep = (stepId) => {
    if (!completedSteps.includes(stepId)) {
      const next = [...completedSteps, stepId];
      setCompletedSteps(next);
      localStorage.setItem('freshman_roadmap_completed', JSON.stringify(next));
    }
  };

  const closeStepModal = () => {
    setActiveStepModal(null);
  };

  return (
    <div className="freshman-guide-page" style={{ padding: '30px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', borderRadius: '24px', padding: '30px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px', boxShadow: '0 10px 30px rgba(0,127,255,0.25)' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.2px', opacity: 0.85 }}>Высшая ИТ-Школа КГУ</span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '4px 0 0 0' }}>Путь первокурсника</h1>
          <p style={{ fontSize: '1rem', margin: '8px 0 0 0', opacity: 0.9, maxWidth: '540px' }}>
            Пройди все 10 этапов адаптации вместе с ВИТШиком: изучи правила, проверь знания, найди кабинеты и открой награды!
          </p>
        </div>
        <motion.img 
          src="/img/mascot.png" 
          alt="ВИТШик" 
          style={{ width: '96px', height: '96px', objectFit: 'contain' }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* 10-Step Roadmap Engine */}
      <div style={{ marginBottom: '40px' }}>
        <RoadmapSection 
          activeStep={activeStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Quick Links Section */}
      <section id="level-links" style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 16px 0', color: 'var(--text)' }}>База ссылок и полезностей</h3>
        <div className={`level-card links-card theme-${activeTab}`}>
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
                    <li><a href="https://kosgos.ru/svedeniya-ob-organizatsii/struktura-i-organy-upravleniya/instituty/institut-vysshaya-it-shkola.html" target="_blank" rel="noopener noreferrer">О дирекции ИВИТШ (Б-209)</a></li>
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
      </section>

      {/* ALL 24 SUBJECTS CATALOG */}
      <section id="level-disciplines">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text)' }}>
            Дисциплины ИВИТШ КГУ ({SUBJECTS.filter(s => s.semester === selectedSemester).length})
          </h3>

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
      </section>

      {/* UNIFIED MODAL OVERLAY FOR ALL ROADMAP STEPS */}
      <AnimatePresence>
        {activeStepModal !== null && (
          <div 
            className="modal-overlay" 
            onClick={closeStepModal} 
            style={{ 
              position: 'fixed', 
              inset: 0, 
              zIndex: 9999, 
              background: 'rgba(0,0,0,0.6)', 
              backdropFilter: 'blur(8px)', 
              display: 'flex', 
              alignItems: 'center', 
              justify: 'center', 
              padding: '20px' 
            }}
          >
            <motion.div 
              className="auth-modal" 
              onClick={(e) => e.stopPropagation()} 
              style={{ width: '100%', maxWidth: '540px', background: 'white', borderRadius: '24px', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <button 
                className="close-modal" 
                onClick={closeStepModal}
                style={{ position: 'absolute', top: '18px', right: '18px', background: '#f1f3f5', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
              >
                ✕
              </button>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {ROADMAP_STEPS[activeStepModal]?.label}
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.3rem', fontWeight: '800', color: 'var(--text)' }}>
                  {ROADMAP_STEPS[activeStepModal]?.title}
                </h3>
              </div>

              {/* Step 1 */}
              {activeStepModal === 0 && <StepFoundation onComplete={() => { completeStep(0); closeStepModal(); }} />}
              
              {/* Step 2 */}
              {activeStepModal === 1 && <StepRoadmap onComplete={() => { completeStep(1); closeStepModal(); }} />}
              
              {/* Step 3 */}
              {activeStepModal === 2 && <StepChatbot onComplete={() => { completeStep(2); closeStepModal(); }} />}
              
              {/* Step 4 */}
              {activeStepModal === 3 && <QuizModal onComplete={() => { completeStep(3); }} />}
              
              {/* Step 5 */}
              {activeStepModal === 4 && <ChecklistModal onComplete={() => { completeStep(4); }} />}
              
              {/* Step 6: Floor Plans Map */}
              {activeStepModal === 5 && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    {[1, 2, 3, 4].map(f => (
                      <button 
                        key={f} 
                        onClick={() => setSelectedFloor(f)} 
                        style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid #ddd', background: selectedFloor === f ? 'var(--primary)' : 'white', color: selectedFloor === f ? 'white' : '#333', fontWeight: '700' }}
                      >
                        {f} этаж
                      </button>
                    ))}
                  </div>
                  <img src={`/floor${selectedFloor}.png`} alt={`Схема ${selectedFloor} этажа`} style={{ width: '100%', borderRadius: '12px', border: '1px solid #eee', marginBottom: '16px' }} />
                  <button onClick={() => { completeStep(5); closeStepModal(); }} className="btn-auth" style={{ width: '100%' }}>
                    Завершить этап 6 →
                  </button>
                </div>
              )}
              
              {/* Step 7: Subjects */}
              {activeStepModal === 6 && (
                <div>
                  <p style={{ fontSize: '0.88rem', color: '#666', marginBottom: '14px' }}>Все 24 дисциплины ИВИТШ КГУ доступны в каталоге ниже на главной странице.</p>
                  <button onClick={() => { completeStep(6); closeStepModal(); }} className="btn-auth" style={{ width: '100%' }}>
                    Завершить этап 7 →
                  </button>
                </div>
              )}
              
              {/* Step 8 */}
              {activeStepModal === 7 && <EmotionalTestModal onComplete={() => { completeStep(7); }} />}
              
              {/* Step 10 */}
              {activeStepModal === 9 && <FunLayerModal onComplete={() => { completeStep(9); setIsRewardsOpen(true); closeStepModal(); }} />}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REWARDS MODAL */}
      <RewardsModal isOpen={isRewardsOpen} onClose={() => setIsRewardsOpen(false)} />
    </div>
  );
};

export default FreshmanGuide;
