import React, { useState } from 'react';
import { Luggage, FileCheck, CircleCheck } from 'lucide-react';

const CAMP_TASKS = [
  { id: 'c1', text: "Одежда: тёплая одежда на вечер, головной убор, зонт или дождевик", done: true },
  { id: 'c2', text: "Личные вещи: зубная паста, щётка, расчёска, личная аптечка", done: true },
  { id: 'c3', text: "Зарядные устройства для телефона и других устройств", done: false },
  { id: 'c4', text: "Паспорт (оригинал) и бумажная ксерокопия (2–5 страницы)", done: true },
  { id: 'c5', text: "Согласие на заселение (если не сдавали ранее)", done: false },
];

const SEPT1_TASKS = [
  { id: 's1', text: "Фотографии 3×4 — 4 шт. (подписать фамилию на обороте каждого фото)", done: false },
  { id: 's2', text: "Копия паспорта, копия СНИЛС и номер ИНН", done: false },
  { id: 's3', text: "Для юношей: постановка на воинский учёт в ауд. ГЛ-329 (приписное или военный билет и паспорт)", done: false },
  { id: 's4', text: "Для несовершеннолетних: согласие родителей на сборы и согласие на заселение", done: false },
  { id: 's5', text: "Проверить и взять с собой все документы, которые ещё не сдавались в деканат ИВИТШ", done: true },
];

const TABS = [
  { id: 'camp', label: 'На сборы', title: 'Сборы первокурсников', icon: Luggage },
  { id: 'sept1', label: 'На 1 сентября', title: 'Документы на 1 сентября', icon: FileCheck },
];

export default function ChecklistModal({ onComplete }) {
  const [tab, setTab] = useState('camp'); // 'camp' | 'sept1'
  const [tasks, setTasks] = useState({
    camp: CAMP_TASKS,
    sept1: SEPT1_TASKS
  });

  const toggleTask = (taskId) => {
    // Computed outside the state updater so onComplete (a parent setState) never runs during render.
    const currentList = tasks[tab];
    const updatedList = currentList.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    const nextState = { ...tasks, [tab]: updatedList };
    setTasks(nextState);

    const allCampDone = nextState.camp.every(t => t.done);
    const allSeptDone = nextState.sept1.every(t => t.done);
    if (allCampDone && allSeptDone && onComplete) onComplete();
  };

  const handleTabKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const index = TABS.findIndex(t => t.id === tab);
    const next = TABS[(index + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    setTab(next.id);
    e.currentTarget.parentElement.querySelector(`#checklist-tab-${next.id}`)?.focus();
  };

  const currentTasks = tasks[tab];
  const doneCount = currentTasks.filter(t => t.done).length;
  const percent = Math.round((doneCount / currentTasks.length) * 100);
  const everythingDone = tasks.camp.every(t => t.done) && tasks.sept1.every(t => t.done);
  const activeTab = TABS.find(t => t.id === tab);

  return (
    <div className="checklist">
      <div className="segmented segmented-fill" role="tablist" aria-label="Чек-листы">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`checklist-tab-${id}`}
            aria-selected={tab === id}
            aria-controls="checklist-panel"
            tabIndex={tab === id ? 0 : -1}
            className="segmented-item"
            onClick={() => setTab(id)}
            onKeyDown={handleTabKeyDown}
          >
            <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div id="checklist-panel" role="tabpanel" aria-labelledby={`checklist-tab-${tab}`}>
        <div className="checklist-progress">
          <div className="checklist-progress-head">
            <span id="checklist-progress-label">{activeTab.title}</span>
            <span className="tabular">{doneCount} из {currentTasks.length}</span>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-labelledby="checklist-progress-label"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={`${doneCount} из ${currentTasks.length}`}
          >
            <div className="progress-value" style={{ transform: `scaleX(${percent / 100})` }} />
          </div>
        </div>

        <ul className="list checklist-items">
          {currentTasks.map(task => (
            <li key={task.id} className="checklist-item">
              <label className="checklist-label" data-done={task.done}>
                <input
                  type="checkbox"
                  className="checklist-checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                />
                <span>{task.text}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <p className="checklist-done" role="status">
        {everythingDone && (
          <>
            <CircleCheck size={18} strokeWidth={1.75} aria-hidden="true" />
            Оба списка отмечены — этап пройден.
          </>
        )}
      </p>
    </div>
  );
}
