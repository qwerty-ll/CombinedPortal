import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CalendarDays, Search, Clock, MapPin, User, BookOpen, AlertCircle, 
  ChevronDown, GraduationCap, Building2, UserCheck, Calendar,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { scheduleApi } from '../services/api';

const EIOS_DIRECT_URL = 'https://eios.kosgos.ru/api';

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

// Helper for lesson type badge
const getLessonTypeBadge = (disciplineName) => {
  const lower = (disciplineName || '').toLowerCase();
  if (lower.startsWith('лек') || lower.includes(' лек ')) return { label: 'Лекция', bg: '#E6F4EA', color: '#137333' };
  if (lower.startsWith('лаб') || lower.includes(' лаб ')) return { label: 'Лабораторная', bg: '#F3E8FF', color: '#7E22CE' };
  if (lower.startsWith('пр') || lower.includes(' пр ')) return { label: 'Практическое', bg: '#FEF3C7', color: '#B45309' };
  if (lower.includes('экз') || lower.includes('зач')) return { label: 'Аттестация', bg: '#FEE2E2', color: '#B91C1C' };
  return { label: 'Занятие', bg: '#E0F2FE', color: '#0369A1' };
};

const ScheduleWidget = () => {
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

  // 2. Fetch Lessons Schedule
  const fetchSchedule = async (id, name) => {
    if (!id) return;
    setLessonsLoading(true);
    setError(null);
    setStaleSince(null);
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
      setStaleSince(res?.stale && res.cached_at ? new Date(res.cached_at * 1000) : null);
    } catch (err) {
      console.error('[ScheduleWidget] Fetch schedule error:', err);
      setError(err.message || 'Не удалось загрузить расписание.');
      setRawLessons([]);
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
        const dayTitle = `${lesson.день_недели || dObj.toLocaleDateString('ru-RU', { weekday: 'long' })} (${dObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })})`;
        dateMap[dateKey] = {
          dateIso: dateKey,
          dayTitle: dayTitle,
          slotsMap: {}
        };
      }

      const timeKey = `${lesson.начало}-${lesson.конец}`;
      if (!dateMap[dateKey].slotsMap[timeKey]) {
        dateMap[dateKey].slotsMap[timeKey] = {
          timeStart: lesson.начало,
          timeEnd: lesson.конец,
          lessonNum: lesson.номерЗанятия,
          color: lesson.цвет || 'var(--primary)',
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

  return (
    <div style={{
      background: 'white',
      borderRadius: '24px',
      padding: '28px',
      border: '1px solid #E9ECEF',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)',
      maxWidth: '100%',
      margin: '0 auto'
    }}>
      {/* 1. TOP BAR: TITLE & TYPE SWITCHER */}
      <div className="schedule-widget-header">
        <div>
          <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
            <CalendarDays size={22} style={{ color: 'var(--primary)' }} />
            Расписание КГУ
          </h3>
        </div>

        {/* Category Switcher */}
        <div className="schedule-target-tabs">
          <button 
            type="button"
            onClick={() => handleSwitchTargetType('group')}
            className={`schedule-target-tab-btn ${targetType === 'group' ? 'active' : ''}`}
          >
            <GraduationCap size={15} /> <span>Группы</span>
          </button>
          <button 
            type="button"
            onClick={() => handleSwitchTargetType('teacher')}
            className={`schedule-target-tab-btn ${targetType === 'teacher' ? 'active' : ''}`}
          >
            <UserCheck size={15} /> <span>Преподаватели</span>
          </button>
          <button 
            type="button"
            onClick={() => handleSwitchTargetType('aud')}
            className={`schedule-target-tab-btn ${targetType === 'aud' ? 'active' : ''}`}
          >
            <Building2 size={15} /> <span>Аудитории</span>
          </button>
        </div>
      </div>

      {/* 2. UNIFIED SEARCH COMBOBOX & ACADEMIC YEAR SELECT */}
      <div className="schedule-search-year-row" ref={dropdownRef}>
        
        {/* Search Combobox Input */}
        <div className="schedule-search-box-wrap">
          <div 
            onClick={() => setIsDropdownOpen(true)}
            className={`schedule-search-input-box ${isDropdownOpen ? 'focused' : ''}`}
          >
            <Search size={16} className="schedule-search-icon" />
            <input 
              type="text" 
              placeholder={
                currentTarget?.name 
                  ? (isDropdownOpen ? 'Поиск другого...' : 'Поиск...')
                  : (
                    targetType === 'group' ? 'Поиск группы (напр. 24-ИСбо-1)...' :
                    targetType === 'teacher' ? 'Поиск ФИО преподавателя...' :
                    'Поиск кабинета (напр. Б-304)...'
                  )
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="schedule-search-input"
            />
            {currentTarget?.name && !searchQuery && (
              <span className="schedule-target-badge" title={currentTarget.name}>
                {currentTarget.name}
              </span>
            )}
            <ChevronDown size={16} className="schedule-chevron-icon" />
          </div>

          {/* Floating Results Card */}
          {isDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              borderRadius: '14px',
              border: '1px solid #E9ECEF',
              boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
              marginTop: '6px',
              zIndex: 100,
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '4px 0'
            }}>
              {catalogLoading ? (
                <div style={{ padding: '14px', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>
                  Загрузка данных...
                </div>
              ) : filteredCatalog.length > 0 ? (
                filteredCatalog.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    style={{
                      padding: '10px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderBottom: '1px solid #F1F3F5',
                      fontSize: '0.9rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F0F7FF'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div>
                      <strong style={{ color: 'var(--text)' }}>{item.name}</strong>
                      {item.facul && <span style={{ marginLeft: '8px', color: '#666', fontSize: '0.78rem' }}>({item.facul})</span>}
                    </div>
                    {Number(item.id) === Number(currentTarget?.id) && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '800' }}>✓ Выбрано</span>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '14px', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>
                  Ничего не найдено
                </div>
              )}
            </div>
          )}
        </div>

        {/* Academic Year Select */}
        <div className="schedule-year-select-wrap">
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="schedule-year-select"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown size={16} className="schedule-year-chevron" />
        </div>
      </div>

      {/* 3. CLEAN TOOLBAR: MODE SWITCHER (ДЕНЬ / НЕДЕЛЯ) & DATE NAVIGATION */}
      <div className="schedule-toolbar-container">
        <div className="schedule-toolbar-inner">
          
          {/* Mode Switcher */}
          <div className="schedule-mode-switcher">
            <button 
              type="button"
              onClick={() => setViewMode('day')}
              className={`schedule-mode-btn ${viewMode === 'day' ? 'active' : ''}`}
            >
              📅 1 день
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('week')}
              className={`schedule-mode-btn ${viewMode === 'week' ? 'active' : ''}`}
            >
              🗓️ За неделю
            </button>
          </div>

          {/* Controls for Day Mode */}
          {viewMode === 'day' && (
            <div className="schedule-date-controls">
              <button 
                type="button"
                onClick={() => changeDateByDays(-1)}
                className="schedule-date-btn"
              >
                <ChevronLeft size={16} /> <span>Вчера</span>
              </button>

              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="schedule-date-input"
              />

              <button 
                type="button"
                onClick={() => changeDateByDays(1)}
                className="schedule-date-btn"
              >
                <span>Завтра</span> <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Controls for Week Mode */}
          {viewMode === 'week' && (
            <div className="schedule-date-controls">
              <button 
                type="button"
                onClick={() => changeDateByWeeks(-1)}
                className="schedule-date-btn"
              >
                <ChevronLeft size={16} /> <span>Пред. неделя</span>
              </button>

              <span className="schedule-week-range">
                {new Date(weekStartEndDates.monIso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — {new Date(weekStartEndDates.satIso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </span>

              <button 
                type="button"
                onClick={() => changeDateByWeeks(1)}
                className="schedule-date-btn"
              >
                <span>След. неделя</span> <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {staleSince && !lessonsLoading && !error && (
        <div style={{ padding: '10px 14px', marginBottom: '12px', background: '#FFFBEB', borderRadius: '12px', color: '#92400E', border: '1px solid #FDE68A', fontSize: '0.85rem', fontWeight: '600' }}>
          ЭИОС сейчас недоступна — показана сохранённая копия от {staleSince.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}.
        </div>
      )}

      {/* 4. COMPACT TIME-SLOT CARDS DISPLAY */}
      {lessonsLoading ? (
        <div style={{ textAlign: 'center', padding: '45px 0', color: '#666' }}>
          <div className="spinner" style={{ margin: '0 auto 10px auto' }}></div>
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Загрузка расписания для "{currentTarget?.name || 'выбранного объекта'}"...</span>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '24px', background: '#FFF5F5', borderRadius: '16px', color: '#C53030', border: '1px solid #FEB2B2' }}>
          <AlertCircle size={32} style={{ marginBottom: '6px' }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.98rem', fontWeight: '800' }}>{error}</h4>
        </div>
      ) : groupedByDateAndSlot.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {groupedByDateAndSlot.map((dGroup) => (
            <div key={dGroup.dateIso}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '800', color: 'var(--text)', borderBottom: '2px solid rgba(0,127,255,0.12)', paddingBottom: '6px' }}>
                📅 {dGroup.dayTitle}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dGroup.slots.map((slot, sIdx) => (
                  <motion.div 
                    key={sIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'white',
                      borderLeft: `5px solid ${slot.color}`,
                      borderTop: '1px solid #F1F3F5',
                      borderRight: '1px solid #F1F3F5',
                      borderBottom: '1px solid #F1F3F5',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                  >
                    {/* Slot Time Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px dashed #E9ECEF', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ background: 'rgba(0,127,255,0.08)', padding: '4px 10px', borderRadius: '8px', fontWeight: '800', fontSize: '0.92rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} /> {slot.timeStart} - {slot.timeEnd}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: '700' }}>{slot.lessonNum} пара</span>
                      </div>
                    </div>

                    {/* Slot Sub-Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {slot.items.map((item, iIdx) => {
                        const typeBadge = getLessonTypeBadge(item.дисциплина);
                        const cleanedTitle = cleanDisciplineTitle(item.дисциплина);
                        return (
                          <div key={item.код || iIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ background: typeBadge.bg, color: typeBadge.color, padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: '800' }}>
                                {typeBadge.label}
                              </span>
                              {item.номерПодгруппы > 0 && (
                                <span style={{ background: '#E3F2FD', color: '#0D47A1', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: '800' }}>
                                  {item.номерПодгруппы} п/г
                                </span>
                              )}
                              <h5 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '800', color: 'var(--text)', flex: 1, wordBreak: 'break-word', lineHeight: '1.35' }}>
                                {cleanedTitle}
                              </h5>
                            </div>

                            <div style={{ display: 'flex', gap: '18px', fontSize: '0.84rem', color: '#555', flexWrap: 'wrap', paddingLeft: '2px' }}>
                              {item.преподаватель && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <User size={13} style={{ color: '#777' }} /> {item.преподаватель}
                                </span>
                              )}
                              {item.аудитория && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800', color: 'var(--primary)' }}>
                                  <MapPin size={13} /> Кабинет: {item.аудитория}
                                </span>
                              )}
                              {item.группа && targetType !== 'group' && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <GraduationCap size={13} style={{ color: '#777' }} /> Группа: {item.группа}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="schedule-empty-card">
          <BookOpen size={38} strokeWidth={1.5} className="schedule-empty-icon" />
          <h4>Занятий нет</h4>
          <p>На выбранный день или неделю пары не запланированы</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleWidget;
