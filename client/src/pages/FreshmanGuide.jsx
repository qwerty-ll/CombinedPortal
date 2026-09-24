import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, GraduationCap, Users, Heart, LifeBuoy, ChevronDown, ExternalLink,
  FileText, CalendarDays, LogIn, Globe, Laptop, Building2, Shield, Wallet,
  BedDouble, HeartHandshake, Phone, Lightbulb, MessageSquareQuote, BookOpen
} from 'lucide-react';
import RoadmapSection, { ROADMAP_STEPS } from '../components/RoadmapSection';
import { StepFoundation, StepRoadmap, StepChatbot } from '../components/StepIntroCards';
import QuizModal from '../components/QuizModal';
import ChecklistModal from '../components/ChecklistModal';
import FunLayerModal from '../components/FunLayerModal';
import RewardsModal, { GuideDialog } from '../components/RewardsModal';
import { contentApi, adaptationApi } from '../services/api';
import SectionIcon from '../components/SectionIcon';

const EASE = [0.16, 1, 0.3, 1];

const LINK_GROUPS = [
  {
    id: 'access', label: 'Быстрый доступ', icon: Zap, links: [
      { href: 'https://guide.kosgos.ru/', label: 'Справочник первокурсника', icon: FileText },
      { href: 'https://eios.kosgos.ru/WebApp/#/Rasp/Group/8540', label: 'Расписание занятий', icon: CalendarDays },
      { href: 'https://eios.kosgos.ru', label: 'Вход в СДО ЕИОС', icon: LogIn },
      { href: 'https://kosgos.ru', label: 'Сайт Университета', icon: Globe },
    ]
  },
  {
    id: 'study', label: 'Учеба и расписание', icon: GraduationCap, links: [
      { href: '/plans/is_2026.pdf', label: 'Учебный план ИСТ (1 курс)', icon: FileText },
      { href: '/plans/ib_2026.pdf', label: 'Учебный план ИБ (1 курс)', icon: FileText },
      { href: '/plans/pm_2026.pdf', label: 'Учебный план ПМ (1 курс)', icon: FileText },
      { href: 'https://eios.kosgos.ru', label: 'Электронные курсы СДО', icon: Laptop },
    ]
  },
  {
    id: 'school', label: 'Высшая ИТ-школа', icon: Users, links: [
      { href: 'https://kosgos.ru/svedeniya-ob-organizatsii/struktura-i-organy-upravleniya/instituty/institut-vysshaya-it-shkola.html', label: 'Дирекция ИВИТШ (Б-209)', icon: Building2 },
      { href: 'https://vk.ru/vitshmedia', label: 'Группа VK ИВИТШ', icon: Users },
    ]
  },
  {
    id: 'life', label: 'Студенческая жизнь', icon: Heart, links: [
      { href: 'https://vk.ru/osoksu', label: 'Студенческий совет КГУ', icon: Users },
    ]
  },
  {
    id: 'support', label: 'Поддержка студентов', icon: LifeBuoy, links: [
      { href: 'https://kosgos.ru/svedeniya-ob-organizatsii/struktura-i-organy-upravleniya/voennoe-obuchenie/voennyj-uchebnyj-tsentr.html?ysclid=mte14ombvd622350198', label: 'ВУЦ КГУ (Военно-учебный центр)', icon: Shield },
      { href: 'https://kosgos.ru/svedeniya-ob-organizatsii/dopolnitelnaya-informatsiya/stipendii-i-inye-vidy-sotsialnoj-podderzhki.html?ysclid=mth3qazqhx932846281', label: 'Стипендии и выплаты', icon: Wallet },
      { href: 'https://vk.ru/ssokgu?ysclid=mth3rh6eq5543794961', label: 'Общежития и заселение', icon: BedDouble },
      { href: 'https://kosgos.ru/studentam/psikhologicheskaya-pomoshch/', label: 'Психологическая помощь', icon: HeartHandshake },
      { href: 'https://kosgos.ru/kontakty/', label: 'Приёмная комиссия', icon: Phone },
    ]
  },
];

const SEMESTERS = [1, 2];
const FLOORS = [1, 2, 3, 4];

const linkMeta = (href) => {
  if (href.endsWith('.pdf')) return 'PDF';
  try {
    return new URL(href, window.location.origin).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

// Arrow-key navigation for role="tablist" groups (roving tabindex).
const handleTabsKeyDown = (e, ids, activeId, onSelect, idPrefix) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
  e.preventDefault();
  const index = ids.indexOf(activeId);
  let next = index;
  if (e.key === 'ArrowRight') next = (index + 1) % ids.length;
  if (e.key === 'ArrowLeft') next = (index - 1 + ids.length) % ids.length;
  if (e.key === 'Home') next = 0;
  if (e.key === 'End') next = ids.length - 1;
  onSelect(ids[next]);
  const el = document.getElementById(`${idPrefix}-${ids[next]}`);
  if (el) {
    el.focus();
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
};

const SubjectItem = ({ subject }) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = `subject-panel-${subject.id}`;
  const controlType = `${subject.type}${subject.extraType ? ` + ${subject.extraType}` : ''}`;

  return (
    <li className="subject" data-open={isOpen}>
      <h3 className="subject-heading">
        <button
          type="button"
          className="subject-toggle"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="subject-name">{subject.name}</span>
          <span className="subject-type">
            <span className={`badge${subject.type === 'Экзамен' ? ' badge-accent' : ''}`}>{controlType}</span>
          </span>
          <span className="subject-hours tabular">
            {subject.hours} ч · {subject.credits} з.е.
          </span>
          <ChevronDown className="subject-chevron" size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </h3>

      {isOpen && (
        <motion.div
          id={panelId}
          className="subject-details"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          {subject.description && <p className="subject-desc">{subject.description}</p>}

          {subject.mascotHack && (
            <div className="subject-tip">
              <Lightbulb size={18} strokeWidth={1.75} aria-hidden="true" />
              <p><strong>Хак ВИТШика.</strong> {subject.mascotHack}</p>
            </div>
          )}

          {subject.seniorAdvice && (
            <div className="subject-tip">
              <MessageSquareQuote size={18} strokeWidth={1.75} aria-hidden="true" />
              <p><strong>Совет старшекурсника.</strong> {subject.seniorAdvice}</p>
            </div>
          )}
        </motion.div>
      )}
    </li>
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

  const [subjectsList, setSubjectsList] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  useEffect(() => {
    contentApi.getSubjects().then(res => {
      if (Array.isArray(res) && res.length > 0) {
        setSubjectsList(res.map(s => ({
          id: s.subject_code || `sub-${s.id}`,
          name: s.name,
          shortName: s.short_name,
          difficulty: s.difficulty || 3,
          hours: s.hours || 108,
          credits: s.credits || 3,
          semester: s.semester || 1,
          type: s.control_type || 'Зачет',
          extraType: s.extra_type,
          description: s.description,
          mascotHack: s.mascot_hack,
          seniorAdvice: s.senior_advice
        })));
      }
    }).catch(e => console.warn('Using static subjects fallback:', e))
      .finally(() => setSubjectsLoading(false));
  }, []);

  const [activeStepModal, setActiveStepModal] = useState(null); // stepId 0..8 or null
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);

  // Find the first uncompleted step (0-8); if all done, stay at 8
  const activeStep = (() => {
    for (let i = 0; i <= 8; i++) {
      if (!completedSteps.includes(i)) return i;
    }
    return 8;
  })();

  const handleStepClick = (stepId) => {
    if (stepId === 8) {
      completeStep(8);
      setIsRewardsOpen(true);
    } else {
      setActiveStepModal(stepId);
    }
  };

  useEffect(() => {
    adaptationApi.getMyProgress().then(res => {
      if (res && Array.isArray(res.completed_steps) && res.completed_steps.length > 0) {
        setCompletedSteps(prev => {
          const merged = Array.from(new Set([...prev, ...res.completed_steps]));
          localStorage.setItem('freshman_roadmap_completed', JSON.stringify(merged));
          return merged;
        });
      }
    }).catch(e => console.warn('Adaptation load notice:', e));
  }, []);

  const completeStep = (stepId) => {
    setCompletedSteps(prev => {
      if (prev.includes(stepId)) return prev;
      const next = [...prev, stepId];
      try {
        localStorage.setItem('freshman_roadmap_completed', JSON.stringify(next));
      } catch (e) {}
      // Debounce API save so rapid calls (e.g. completeStep(7); completeStep(8)) batch together
      clearTimeout(window._adaptationSaveTimer);
      window._adaptationSaveTimer = setTimeout(() => {
        try {
          const latest = JSON.parse(localStorage.getItem('freshman_roadmap_completed') || '[]');
          adaptationApi.saveProgress(latest).catch(e => console.warn('Failed to sync adaptation to DB:', e));
        } catch {}
      }, 300);
      return next;
    });
  };

  const closeStepModal = () => {
    setActiveStepModal(null);
  };

  const activeGroup = LINK_GROUPS.find(g => g.id === activeTab);
  const semesterSubjects = subjectsList.filter(s => s.semester === selectedSemester);
  const modalStep = activeStepModal !== null ? ROADMAP_STEPS[activeStepModal] : null;

  return (
    <div className="container guide-page">

      <header className="page-header guide-header">
        <div className="page-heading">
          <SectionIcon section="guide" size="lg" />
          <div>
            <h1>Путь первокурсника</h1>
            <p className="page-subtitle">
              Пройди 9 этапов адаптации вместе с ВИТШиком: изучи правила, проверь знания, найди кабинеты и получи диплом.
            </p>
          </div>
        </div>
      </header>

      {/* 9-Step Roadmap Engine */}
      <section className="section" aria-labelledby="roadmap-title">
        <RoadmapSection
          activeStep={activeStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
      </section>

      {/* Quick Links Section */}
      <section id="level-links" className="section" aria-labelledby="links-title">
        <div className="section-header">
          <h2 id="links-title">База ссылок и полезностей</h2>
        </div>

        <div className="segmented guide-tabs" role="tablist" aria-label="Разделы ссылок">
          {LINK_GROUPS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`links-tab-${id}`}
              aria-selected={activeTab === id}
              aria-controls="links-panel"
              tabIndex={activeTab === id ? 0 : -1}
              className="segmented-item"
              onClick={(e) => {
                setActiveTab(id);
                e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' });
              }}
              onKeyDown={(e) => handleTabsKeyDown(e, LINK_GROUPS.map(g => g.id), activeTab, setActiveTab, 'links-tab')}
            >
              <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <div id="links-panel" role="tabpanel" aria-labelledby={`links-tab-${activeTab}`} className="card guide-links-card">
          <ul className="guide-links">
            {activeGroup.links.map(({ href, label, icon: Icon }) => (
              <li key={href + label}>
                <a className="guide-link" href={href} target="_blank" rel="noopener noreferrer">
                  <Icon className="guide-link-icon" size={18} strokeWidth={1.75} aria-hidden="true" />
                  <span className="guide-link-text">
                    <span className="guide-link-label">{label}</span>
                    <span className="guide-link-meta">{linkMeta(href)}</span>
                  </span>
                  <ExternalLink className="guide-link-external" size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span className="visually-hidden"> (откроется в новой вкладке)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Subjects catalog */}
      <section id="level-disciplines" className="section" aria-labelledby="subjects-title">
        <div className="section-header guide-subjects-header">
          <div>
            <h2 id="subjects-title">
              Дисциплины ИВИТШ КГУ{' '}
              {!subjectsLoading && <span className="guide-count tabular">{semesterSubjects.length}</span>}
            </h2>
            <p>Открой дисциплину, чтобы увидеть описание и советы ВИТШика</p>
          </div>

          <div className="segmented" role="tablist" aria-label="Семестр">
            {SEMESTERS.map(sem => (
              <button
                key={sem}
                type="button"
                role="tab"
                id={`semester-tab-${sem}`}
                aria-selected={selectedSemester === sem}
                aria-controls="subjects-panel"
                tabIndex={selectedSemester === sem ? 0 : -1}
                className="segmented-item"
                onClick={() => setSelectedSemester(sem)}
                onKeyDown={(e) => handleTabsKeyDown(e, SEMESTERS, selectedSemester, setSelectedSemester, 'semester-tab')}
              >
                {sem}-й семестр
              </button>
            ))}
          </div>
        </div>

        <div id="subjects-panel" role="tabpanel" aria-labelledby={`semester-tab-${selectedSemester}`}>
          {subjectsLoading ? (
            <ul className="card subject-list" aria-busy="true" aria-label="Загрузка дисциплин">
              {[0, 1, 2, 3].map(i => (
                <li key={i} className="subject subject-skeleton">
                  <span className="skeleton subject-skeleton-title" />
                  <span className="skeleton subject-skeleton-meta" />
                </li>
              ))}
            </ul>
          ) : semesterSubjects.length > 0 ? (
            <ul className="card subject-list">
              {semesterSubjects.map(subject => (
                <SubjectItem key={subject.id} subject={subject} />
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <BookOpen size={24} strokeWidth={1.75} aria-hidden="true" />
              <h3>Список дисциплин пока пуст</h3>
              <p>Не удалось загрузить дисциплины этого семестра. Обнови страницу чуть позже.</p>
            </div>
          )}
        </div>
      </section>

      {/* UNIFIED MODAL FOR ALL ROADMAP STEPS */}
      <GuideDialog open={activeStepModal !== null} onClose={closeStepModal} labelledBy="step-modal-title" wide={activeStepModal === 5}>
        {modalStep && (
          <>
            <div className="step-modal-header">
              <h2 id="step-modal-title">{modalStep.title}</h2>
              <p className="step-modal-meta tabular">Этап {modalStep.id + 1} из {ROADMAP_STEPS.length}</p>
            </div>

            {/* Step 1 */}
            {activeStepModal === 0 && <StepFoundation onComplete={() => { completeStep(0); closeStepModal(); }} />}

            {/* Step 2 */}
            {activeStepModal === 1 && <StepRoadmap onComplete={() => { completeStep(1); closeStepModal(); }} />}

            {/* Step 3 */}
            {activeStepModal === 2 && <StepChatbot onComplete={() => { completeStep(2); closeStepModal(); }} />}

            {/* Step 4 */}
            {activeStepModal === 3 && <QuizModal onComplete={() => { completeStep(3); }} onClose={closeStepModal} />}

            {/* Step 5 */}
            {activeStepModal === 4 && <ChecklistModal onComplete={() => { completeStep(4); }} />}

            {/* Step 6: Floor Plans Map */}
            {activeStepModal === 5 && (
              <div className="step-body">
                <div className="segmented segmented-fill" role="tablist" aria-label="Этаж корпуса Б">
                  {FLOORS.map(f => (
                    <button
                      key={f}
                      type="button"
                      role="tab"
                      id={`floor-tab-${f}`}
                      aria-selected={selectedFloor === f}
                      aria-controls="floor-panel"
                      tabIndex={selectedFloor === f ? 0 : -1}
                      className="segmented-item"
                      onClick={() => setSelectedFloor(f)}
                      onKeyDown={(e) => handleTabsKeyDown(e, FLOORS, selectedFloor, setSelectedFloor, 'floor-tab')}
                    >
                      <span className="tabular">{f} этаж</span>
                    </button>
                  ))}
                </div>
                <div id="floor-panel" role="tabpanel" aria-labelledby={`floor-tab-${selectedFloor}`}>
                  <img src={`/floor${selectedFloor}.png`} alt={`Схема ${selectedFloor} этажа`} className="floor-plan" />
                  <a className="floor-plan-link" href={`/floor${selectedFloor}.png`} target="_blank" rel="noopener noreferrer">
                    Открыть схему {selectedFloor} этажа в полном размере
                    <ExternalLink size={16} strokeWidth={1.75} aria-hidden="true" />
                    <span className="visually-hidden"> (откроется в новой вкладке)</span>
                  </a>
                </div>
                <button type="button" onClick={() => { completeStep(5); closeStepModal(); }} className="btn btn-primary btn-block step-complete">
                  Завершить этап 6
                </button>
              </div>
            )}

            {/* Step 7: Subjects */}
            {activeStepModal === 6 && (
              <div className="step-body">
                <p className="step-lead">Все 24 дисциплины ИВИТШ КГУ собраны в каталоге ниже на этой странице.</p>
                <button type="button" onClick={() => { completeStep(6); closeStepModal(); }} className="btn btn-primary btn-block step-complete">
                  Завершить этап 7
                </button>
              </div>
            )}

            {/* Step 8: Student Life */}
            {activeStepModal === 7 && <FunLayerModal onComplete={() => { completeStep(7); closeStepModal(); }} />}
          </>
        )}
      </GuideDialog>

      {/* REWARDS MODAL */}
      <RewardsModal isOpen={isRewardsOpen} onClose={() => setIsRewardsOpen(false)} />
    </div>
  );
};

export default FreshmanGuide;
