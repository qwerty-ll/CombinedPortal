import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, MapPin, User, AlertCircle, ChevronDown, GraduationCap, Check,
  ChevronLeft, ChevronRight, CalendarX2, CloudOff, RotateCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { scheduleApi } from '../services/api';

const EIOS_DIRECT_URL = 'https://eios.kosgos.ru/api';

const ICON = { strokeWidth: 1.75, 'aria-hidden': true };

// Automatically calculate academic year from date string (YYYY-MM-DD)
const calculateAcademicYear = (dateStr) => {
  if (!dateStr) return '2025-2026';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '2025-2026';
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1 to 12
  if (month >= 9) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

// Clean discipline titles (remove leading 'лек ', 'лаб ', 'пр ')
const cleanDisciplineTitle = (rawTitle) => {
  if (!rawTitle) return '';
  let clean = rawTitle.replace(/^(лек|лаб|пр)\s+/i, '').trim();
  clean = clean.replace(/,\s*п\/г\s*\d+$/i, '').trim();
  return clean;
};

// Helper for lesson type badge (label + badge tone)
const getLessonTypeBadge = (disciplineName) => {
  const lower = (disciplineName || '').toLowerCase();
  if (lower.startsWith('лек') || lower.includes(' лек ')) return { label: 'Лекция', tone: 'badge-hue hue-blue' };
  if (lower.startsWith('лаб') || lower.includes(' лаб ')) return { label: 'Лабораторная', tone: 'badge-hue hue-violet' };
  if (lower.startsWith('пр') || lower.includes(' пр ')) return { label: 'Практика', tone: 'badge-hue hue-green' };
  if (lower.includes('экз') || lower.includes('зач')) return { label: 'Аттестация', tone: 'badge-warning' };
  return { label: 'Занятие', tone: '' };
};

// Presentation helpers (local calendar date / time, used only for "today" and "now" markers)
const pad2 = (n) => String(n).padStart(2, '0');
const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');
const localIso = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const mondayIsoOf = (iso) => {
  const d = new Date(iso);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().split('T')[0];
};

const TARGET_TYPES = [
  { id: 'group', label: 'Группы', field: 'Группа', placeholder: 'Найти группу, например 24-ИСбо-1' },
  { id: 'teacher', label: 'Преподаватели', field: 'Преподаватель', placeholder: 'Найти преподавателя по ФИО' },
  { id: 'aud', label: 'Аудитории', field: 'Аудитория', placeholder: 'Найти аудиторию, например Б-304' },
];

// onGroupLessons({ group, lessons }) receives the loaded lessons whenever a group's schedule is shown,
// so the dashboard can summarise today without fetching the schedule twice.
const ScheduleWidget = ({ onGroupLessons }) => {
  const [targetType, setTargetType] = useState('group'); // 'group' | 'teacher' | 'aud'
  const availableYears = ['2025-2026', '2024-2025', '2023-2024', '2026-2027'];

  // Separate target selection states per category
  const [selectedGroup, setSelectedGroup] = useState(() => {
    try {
      const saved = localStorage.getItem('portal_sched_group');
      return saved ? JSON.parse(saved) : { id: 8540, name: '24-ИСбо-1' };
    } catch { return { id: 8540, name: '24-ИСбо-1' }; }
  });

  const [selectedTeacher, setSelectedTeacher] = useState(() => {
    try {
      const saved = localStorage.getItem('portal_sched_teacher');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [selectedAud, setSelectedAud] = useState(() => {
    try {
      const saved = localStorage.getItem('portal_sched_aud');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Current active target object depending on active tab
  const currentTarget = useMemo(() => {
    if (targetType === 'teacher') return selectedTeacher;
    if (targetType === 'aud') return selectedAud;
    return selectedGroup;
  }, [targetType, selectedGroup, selectedTeacher, selectedAud]);

  // Input & Dropdown state
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  // Keyboard highlight inside the combobox list (presentation only)
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // View Mode: 'day' (1 день) | 'week' (1 неделя)
  const [viewMode, setViewMode] = useState('day');

  // Selected date ISO string (default to today)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Academic Year State (Auto-synced with selectedDate, can also be manually selected)
  const [selectedYear, setSelectedYear] = useState(() => calculateAcademicYear(new Date().toISOString().split('T')[0]));

  // Auto-sync year when user picks a new date
  const handleDateChange = (newDateIso) => {
    setSelectedDate(newDateIso);
    if (newDateIso) {
      const autoYear = calculateAcademicYear(newDateIso);
      setSelectedYear(autoYear);
    }
  };

  // Switch category tabs and clear search input
  const handleSwitchTargetType = (newType) => {
    setTargetType(newType);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  // Catalog items & Lessons state
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [rawLessons, setRawLessons] = useState([]);
  // Which target the loaded lessons belong to (the tab can change before the next fetch finishes)
  const [lessonsOwner, setLessonsOwner] = useState(null);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Set when the backend served the last saved copy because EIOS is unreachable.
  const [staleSince, setStaleSince] = useState(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Fetch Catalog Items for selected type & year
  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      setCatalogLoading(true);
      try {
        let rawItems = [];
        if (targetType === 'group') {
          const res = await scheduleApi.getGroups(selectedYear);
          rawItems = res?.data || [];
        } else if (targetType === 'teacher') {
          const res = await scheduleApi.getTeachers(selectedYear);
          rawItems = res?.data || [];
        } else if (targetType === 'aud') {
          const res = await scheduleApi.getAuditories(selectedYear);
          rawItems = res?.data || [];
        }

        const items = (rawItems || []).map(i => ({
          ...i,
          id: i.id || i.idName,
          idName: i.idName || i.id
        }));

        if (isMounted) {
          setCatalogItems(items);
          setCatalogLoading(false);

          if (items.length > 0) {
            const activeId = currentTarget?.id;
            const exists = activeId ? items.find(i => Number(i.id) === Number(activeId)) : null;
            if (!exists) {
              const defaultItem = targetType === 'group'
                ? (items.find(g => g.name && g.name.includes('24-ИСбо-1')) || items.find(g => g.facul === 'ИВИТШ') || items[0])
                : (items.find(a => a.name && (a.name.includes('Б-') || a.name.includes('Б2'))) || items[0]);
              if (defaultItem) handleSelectItem(defaultItem);
            }
          }
        }
      } catch (err) {
        console.warn('[ScheduleWidget] Catalog load error:', err);
        if (isMounted) {
          setCatalogLoading(false);
          setError(err.message || 'Не удалось загрузить список из ЭИОС.');
        }
      }
    };

    loadCatalog();
    return () => { isMounted = false; };
  }, [targetType, selectedYear]);

  // Handle selecting an item from search dropdown
  const handleSelectItem = (item) => {
    const itemId = item.id || item.idName;
    const targetObj = { id: itemId, name: item.name };

    if (targetType === 'group') {
      setSelectedGroup(targetObj);
      localStorage.setItem('portal_sched_group', JSON.stringify(targetObj));
    } else if (targetType === 'teacher') {
      setSelectedTeacher(targetObj);
      localStorage.setItem('portal_sched_teacher', JSON.stringify(targetObj));
    } else if (targetType === 'aud') {
      setSelectedAud(targetObj);
      localStorage.setItem('portal_sched_aud', JSON.stringify(targetObj));
    }

    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  // Filter catalog items by search query
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return catalogItems.slice(0, 30);
    const query = searchQuery.toLowerCase().trim();
    return catalogItems.filter(item =>
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.facul && item.facul.toLowerCase().includes(query)) ||
      (item.kaf && item.kaf.toLowerCase().includes(query))
    ).slice(0, 40);
  }, [catalogItems, searchQuery]);

  // Reset the keyboard highlight whenever the list changes or closes
  useEffect(() => { setActiveIndex(-1); }, [searchQuery, isDropdownOpen, targetType]);

  // Keep the highlighted option visible while moving with the keyboard
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[activeIndex];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // 2. Fetch Lessons Schedule
  const fetchSchedule = async (id, name) => {
    if (!id) return;
    setLessonsLoading(true);
    setError(null);
    setStaleSince(null);
    setLessonsOwner(null);
    try {
      const res = await scheduleApi.getSchedule(
        targetType === 'group' ? id : null,
        selectedYear,
        '',
        targetType === 'teacher' ? id : null,
        targetType === 'aud' ? id : null
      );

      const raspData = res?.data?.rasp || (Array.isArray(res?.data) ? res.data : []);
      setRawLessons(raspData);
      setLessonsOwner({ type: targetType, name });
      setStaleSince(res?.stale && res.cached_at ? new Date(res.cached_at * 1000) : null);
    } catch (err) {
      console.error('[ScheduleWidget] Fetch schedule error:', err);
      setError(err.message || 'Не удалось загрузить расписание.');
      setRawLessons([]);
      if (targetType === 'group') onGroupLessons?.(null);
    } finally {
      setLessonsLoading(false);
    }
  };

  useEffect(() => {
    if (currentTarget?.id) {
      fetchSchedule(currentTarget.id, currentTarget.name);
    }
  }, [currentTarget, selectedYear, targetType]);

  // 3. Deduplicate raw EIOS API lessons
  const deduplicatedLessons = useMemo(() => {
    const seen = new Set();
    const result = [];
    (rawLessons || []).forEach(item => {
      const key = `${item.код || ''}_${item.дата}_${item.начало}_${item.конец}_${item.дисциплина}_${item.преподаватель}_${item.аудитория}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    });
    return result;
  }, [rawLessons]);

  useEffect(() => {
    if (onGroupLessons && lessonsOwner?.type === 'group') {
      onGroupLessons({ group: lessonsOwner.name, lessons: deduplicatedLessons });
    }
  }, [deduplicatedLessons, lessonsOwner]);

  // Get start & end dates for Monday to Saturday of the selectedDate's week
  const weekStartEndDates = useMemo(() => {
    const d = new Date(selectedDate);
    const day = d.getDay(); // 0 is Sun
    const diffToMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diffToMon);

    const sat = new Date(mon);
    sat.setDate(mon.getDate() + 5);

    const monIso = mon.toISOString().split('T')[0];
    const satIso = sat.toISOString().split('T')[0];

    return { monIso, satIso, monObj: mon, satObj: sat };
  }, [selectedDate]);

  // Lessons filtered by view mode (Day or Week)
  const modeLessons = useMemo(() => {
    if (viewMode === 'day') {
      return deduplicatedLessons.filter(l => l.дата && l.дата.startsWith(selectedDate));
    }
    // Week Mode: filter lessons between Monday and Saturday
    return deduplicatedLessons.filter(l => {
      if (!l.дата) return false;
      const d = l.дата.split('T')[0];
      return d >= weekStartEndDates.monIso && d <= weekStartEndDates.satIso;
    });
  }, [deduplicatedLessons, viewMode, selectedDate, weekStartEndDates]);

  // Group modeLessons FIRST BY DATE, THEN BY TIME SLOT (Prevents date mixing!)
  const groupedByDateAndSlot = useMemo(() => {
    const dateMap = {};

    modeLessons.forEach(lesson => {
      const dateKey = lesson.дата ? lesson.дата.split('T')[0] : 'неизвестно';
      if (!dateMap[dateKey]) {
        const dObj = new Date(dateKey);
        const weekday = lesson.день_недели || dObj.toLocaleDateString('ru-RU', { weekday: 'long' });
        const dateLabel = dObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
        const dayTitle = `${weekday} (${dateLabel})`;
        dateMap[dateKey] = {
          dateIso: dateKey,
          dayTitle: dayTitle,
          weekday,
          dateLabel,
          slotsMap: {}
        };
      }

      const timeKey = `${lesson.начало}-${lesson.конец}`;
      if (!dateMap[dateKey].slotsMap[timeKey]) {
        dateMap[dateKey].slotsMap[timeKey] = {
          timeStart: lesson.начало,
          timeEnd: lesson.конец,
          lessonNum: lesson.номерЗанятия,
          color: lesson.цвет || 'var(--accent)',
          items: []
        };
      }
      dateMap[dateKey].slotsMap[timeKey].items.push(lesson);
    });

    // Convert to sorted list of date groups
    return Object.values(dateMap).sort((a, b) => a.dateIso.localeCompare(b.dateIso)).map(dGroup => ({
      ...dGroup,
      slots: Object.values(dGroup.slotsMap).sort((a, b) => a.timeStart.localeCompare(b.timeStart))
    }));
  }, [modeLessons]);

  // Day navigation helper: +/- days
  const changeDateByDays = (daysDelta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + daysDelta);
    handleDateChange(d.toISOString().split('T')[0]);
  };

  // Week navigation helper: +/- weeks
  const changeDateByWeeks = (weeksDelta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (weeksDelta * 7));
    handleDateChange(d.toISOString().split('T')[0]);
  };

  // ---------- Presentation-only derived values ----------
  const todayIso = new Date().toISOString().split('T')[0]; // same expression as the default date
  const now = new Date();
  const localTodayIso = localIso(now);
  const nowHm = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  const isOnToday = viewMode === 'day'
    ? selectedDate === todayIso
    : mondayIsoOf(todayIso) === weekStartEndDates.monIso;
  const targetMeta = TARGET_TYPES.find(t => t.id === targetType) || TARGET_TYPES[0];
  const listboxId = 'schedule-target-listbox';
  const optionId = (item) => `schedule-target-option-${item.id}`;

  // Marks the lesson in progress and the next one — only for today's date group
  const slotMarker = (dGroup, slot, slotIdx) => {
    if (dGroup.dateIso !== localTodayIso) return null;
    if (slot.timeStart <= nowHm && nowHm < slot.timeEnd) return 'now';
    const firstUpcoming = dGroup.slots.findIndex(s => s.timeStart > nowHm);
    return firstUpcoming === slotIdx ? 'next' : null;
  };

  const handleComboKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isDropdownOpen) { setIsDropdownOpen(true); return; }
      setActiveIndex(i => Math.min(i + 1, filteredCatalog.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (isDropdownOpen && activeIndex >= 0 && filteredCatalog[activeIndex]) {
        e.preventDefault();
        handleSelectItem(filteredCatalog[activeIndex]);
        requestAnimationFrame(() => inputRef.current?.select());
      }
    } else if (e.key === 'Escape') {
      if (isDropdownOpen) {
        e.preventDefault();
        setIsDropdownOpen(false);
        requestAnimationFrame(() => inputRef.current?.select());
      }
    } else if (e.key === 'Tab') {
      setIsDropdownOpen(false);
    }
  };

  const renderLesson = (slot, marker) => (item, iIdx) => {
    const typeBadge = getLessonTypeBadge(item.дисциплина);
    const cleanedTitle = cleanDisciplineTitle(item.дисциплина);
    return (
      <div key={item.код || iIdx} className="sched-lesson">
        <p className="sched-lesson-tags">
          <span className={`badge ${typeBadge.tone}`}>{typeBadge.label}</span>
          {item.номерПодгруппы > 0 && (
            <span className="badge">Подгруппа {item.номерПодгруппы}</span>
          )}
          {iIdx === 0 && slot.lessonNum ? <span className="sched-lesson-num tabular">{slot.lessonNum} пара</span> : null}
          {iIdx === 0 && marker === 'now' && <span className="badge badge-accent sched-marker">Идёт сейчас</span>}
          {iIdx === 0 && marker === 'next' && <span className="badge badge-hue hue-orange sched-marker">Следующая</span>}
        </p>
        <h4 className="sched-lesson-title">{cleanedTitle}</h4>
        <p className="sched-lesson-meta">
          {item.аудитория && (/^Б-?\d{3}/i.test(item.аудитория) ? (
            // Rooms in building Б open the floor plan on the campus map
            <Link to={`/map?room=${encodeURIComponent(item.аудитория)}`} className="sched-lesson-room sched-room-link">
              <MapPin size={15} {...ICON} />
              <span className="visually-hidden">Аудитория </span>{item.аудитория}
              <span className="visually-hidden"> — показать на карте</span>
            </Link>
          ) : (
            <span className="sched-lesson-room">
              <MapPin size={15} {...ICON} />
              <span className="visually-hidden">Аудитория </span>{item.аудитория}
            </span>
          ))}
          {item.преподаватель && (
            <span>
              <User size={15} {...ICON} />
              <span className="visually-hidden">Преподаватель </span>{item.преподаватель}
            </span>
          )}
          {item.группа && targetType !== 'group' && (
            <span>
              <GraduationCap size={15} {...ICON} />
              <span className="visually-hidden">Группа </span>{item.группа}
            </span>
          )}
        </p>
      </div>
    );
  };

  return (
    <div className="card sched">
      {/* 1. TITLE & TYPE SWITCHER */}
      <div className="sched-head">
        <h2 id="schedule-title">Расписание</h2>
        <div className="segmented sched-types" role="group" aria-label="Чьё расписание показать">
          {TARGET_TYPES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSwitchTargetType(t.id)}
              className={`segmented-item ${targetType === t.id ? 'active' : ''}`}
              aria-pressed={targetType === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. SEARCH COMBOBOX & ACADEMIC YEAR SELECT */}
      <div className="sched-filters">
        <div className="field sched-combo" ref={dropdownRef}>
          <label className="field-label" htmlFor="schedule-target-input">{targetMeta.field}</label>
          <div className="sched-combo-control">
            <Search size={16} className="sched-combo-icon" {...ICON} />
            <input
              ref={inputRef}
              id="schedule-target-input"
              type="text"
              role="combobox"
              aria-expanded={isDropdownOpen}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={isDropdownOpen && activeIndex >= 0 && filteredCatalog[activeIndex] ? optionId(filteredCatalog[activeIndex]) : undefined}
              autoComplete="off"
              spellCheck={false}
              placeholder={isDropdownOpen && currentTarget?.name ? currentTarget.name : targetMeta.placeholder}
              value={isDropdownOpen ? searchQuery : (currentTarget?.name || searchQuery)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onClick={() => setIsDropdownOpen(true)}
              onKeyDown={handleComboKeyDown}
              className="input sched-combo-input"
            />
            <ChevronDown size={16} className="sched-combo-chevron" {...ICON} />
          </div>

          {/* Results popover */}
          {isDropdownOpen && (
            <div className="sched-popover">
              {catalogLoading ? (
                <div className="sched-popover-loading" role="status">
                  <span className="visually-hidden">Загрузка списка…</span>
                  <span className="skeleton sched-skel-line" />
                  <span className="skeleton sched-skel-line sched-skel-line--mid" />
                  <span className="skeleton sched-skel-line sched-skel-line--short" />
                </div>
              ) : filteredCatalog.length > 0 ? (
                <ul className="sched-options" role="listbox" id={listboxId} ref={listRef} aria-label={targetMeta.label}>
                  {filteredCatalog.map((item, idx) => {
                    const isCurrent = Number(item.id) === Number(currentTarget?.id);
                    return (
                      <li
                        key={item.id}
                        id={optionId(item)}
                        role="option"
                        aria-selected={isCurrent}
                        className={`sched-option ${idx === activeIndex ? 'is-active' : ''}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          handleSelectItem(item);
                          inputRef.current?.blur();
                        }}
                      >
                        <span className="sched-option-text">
                          <span className="sched-option-name">{item.name}</span>
                          {item.facul && <span className="sched-option-meta">{item.facul}</span>}
                          {!item.facul && item.kaf && <span className="sched-option-meta">{item.kaf}</span>}
                        </span>
                        {isCurrent && <Check size={16} className="sched-option-check" {...ICON} />}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="sched-popover-empty">Ничего не найдено</p>
              )}
            </div>
          )}
        </div>

        <div className="field sched-year">
          <label className="field-label" htmlFor="schedule-year-select">Учебный год</label>
          <div className="sched-select-wrap">
            <select
              id="schedule-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="select sched-select tabular"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown size={16} className="sched-select-chevron" {...ICON} />
          </div>
        </div>
      </div>

      {/* 3. MODE SWITCHER (ДЕНЬ / НЕДЕЛЯ) & DATE NAVIGATION */}
      <div className="sched-nav">
        <div className="segmented sched-modes" role="group" aria-label="Период">
          <button
            type="button"
            onClick={() => setViewMode('day')}
            className={`segmented-item ${viewMode === 'day' ? 'active' : ''}`}
            aria-pressed={viewMode === 'day'}
          >
            День
          </button>
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`segmented-item ${viewMode === 'week' ? 'active' : ''}`}
            aria-pressed={viewMode === 'week'}
          >
            Неделя
          </button>
        </div>

        <div className="sched-nav-end">
          {!isOnToday && (
            <button type="button" className="btn btn-secondary sched-today" onClick={() => handleDateChange(todayIso)}>
              {viewMode === 'day' ? 'Сегодня' : 'Эта неделя'}
            </button>
          )}
          {viewMode === 'day' ? (
            <div className="sched-dates">
              <button
                type="button"
                onClick={() => changeDateByDays(-1)}
                className="btn btn-secondary btn-icon"
                aria-label="Предыдущий день"
              >
                <ChevronLeft size={18} {...ICON} />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="input sched-date-input tabular"
                aria-label="Дата"
              />
              <button
                type="button"
                onClick={() => changeDateByDays(1)}
                className="btn btn-secondary btn-icon"
                aria-label="Следующий день"
              >
                <ChevronRight size={18} {...ICON} />
              </button>
            </div>
          ) : (
            <div className="sched-dates">
              <button
                type="button"
                onClick={() => changeDateByWeeks(-1)}
                className="btn btn-secondary btn-icon"
                aria-label="Предыдущая неделя"
              >
                <ChevronLeft size={18} {...ICON} />
              </button>
              <span className="sched-week-range tabular" aria-live="polite">
                {new Date(weekStartEndDates.monIso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — {new Date(weekStartEndDates.satIso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </span>
              <button
                type="button"
                onClick={() => changeDateByWeeks(1)}
                className="btn btn-secondary btn-icon"
                aria-label="Следующая неделя"
              >
                <ChevronRight size={18} {...ICON} />
              </button>
            </div>
          )}
        </div>
      </div>

      {staleSince && !lessonsLoading && !error && (
        <p className="sched-notice" role="status">
          <CloudOff size={18} {...ICON} />
          <span>
            ЭИОС сейчас недоступна — показана сохранённая копия от{' '}
            <span className="tabular">{staleSince.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>.
          </span>
        </p>
      )}

      {/* 4. LESSONS */}
      {lessonsLoading ? (
        <div className="sched-body" aria-busy="true">
          <p className="visually-hidden" role="status">
            Загрузка расписания для «{currentTarget?.name || 'выбранного объекта'}»…
          </p>
          <span className="skeleton sched-skel-heading" />
          <ul className="sched-slots" aria-hidden="true">
            {[0, 1, 2].map(i => (
              <li key={i} className="sched-slot">
                <span className="sched-time">
                  <span className="skeleton sched-skel-time" />
                </span>
                <span className="sched-skel-body">
                  <span className="skeleton sched-skel-badge" />
                  <span className="skeleton sched-skel-line sched-skel-line--mid" />
                  <span className="skeleton sched-skel-line sched-skel-line--short" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : error ? (
        <div className="sched-alert" role="alert">
          <AlertCircle size={20} {...ICON} />
          <div className="sched-alert-text">
            <p className="sched-alert-title">{error}</p>
            <p>Проверьте подключение к интернету и загрузите расписание ещё раз.</p>
            {currentTarget?.id && (
              <button
                type="button"
                className="btn btn-secondary sched-alert-retry"
                onClick={() => fetchSchedule(currentTarget.id, currentTarget.name)}
              >
                <RotateCw size={16} {...ICON} />
                Загрузить снова
              </button>
            )}
          </div>
        </div>
      ) : groupedByDateAndSlot.length > 0 ? (
        <div className="sched-body">
          {groupedByDateAndSlot.map((dGroup) => (
            <section key={dGroup.dateIso} className="sched-day" aria-labelledby={`sched-day-${dGroup.dateIso}`}>
              <h3 className="sched-day-title" id={`sched-day-${dGroup.dateIso}`}>
                <span>{capitalize(dGroup.weekday)}, {dGroup.dateLabel}</span>
                {dGroup.dateIso === localTodayIso && <span className="badge badge-accent">Сегодня</span>}
              </h3>

              <ul className="sched-slots">
                {dGroup.slots.map((slot, sIdx) => {
                  const marker = slotMarker(dGroup, slot, sIdx);
                  return (
                    <li key={sIdx} className={`sched-slot ${marker ? `is-${marker}` : ''}`}>
                      <p className="sched-time tabular">
                        <span className="sched-time-start">{slot.timeStart}</span>
                        <span className="sched-time-end">
                          <span className="visually-hidden">до </span>{slot.timeEnd}
                        </span>
                      </p>
                      <div className="sched-slot-body">
                        {slot.items.map(renderLesson(slot, marker))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="sched-empty">
          <CalendarX2 size={28} {...ICON} />
          <h3>Занятий нет</h3>
          <p>На выбранный день или неделю пары не запланированы.</p>
          {viewMode === 'day' && (
            <button type="button" className="btn btn-secondary" onClick={() => setViewMode('week')}>
              Показать всю неделю
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleWidget;
