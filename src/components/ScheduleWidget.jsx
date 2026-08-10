import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CalendarDays, Search, Clock, MapPin, User, BookOpen, AlertCircle, 
  ChevronDown, GraduationCap, Building2, UserCheck, Calendar,
  ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scheduleApi } from '../services/api';

const EIOS_DIRECT_URL = 'https://eios.kosgos.ru/api';

// Clean discipline titles (remove leading 'лек ', 'лаб ', 'пр ')
const cleanDisciplineTitle = (rawTitle) => {
  if (!rawTitle) return '';
  // Remove leading prefixes like 'лек ', 'лаб ', 'пр '
  let clean = rawTitle.replace(/^(лек|лаб|пр)\s+/i, '').trim();
  // Remove subgroup suffix if present to group base title
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
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const availableYears = ['2025-2026', '2024-2025', '2023-2024', '2026-2027'];

  // Current selection state
  const [selectedId, setSelectedId] = useState(() => Number(localStorage.getItem('portal_sched_id')) || 8540);
  const [selectedName, setSelectedName] = useState(() => localStorage.getItem('portal_sched_name') || '24-ИСбо-1');

  // Input & Dropdown state
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Catalog items list
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Lessons data state
  const [rawLessons, setRawLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Date Selection State (ISO Date string: 'YYYY-MM-DD')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

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
        let directUrl = `${EIOS_DIRECT_URL}/raspGrouplist?year=${encodeURIComponent(selectedYear)}`;
        if (targetType === 'teacher') directUrl = `${EIOS_DIRECT_URL}/raspTeacherlist?year=${encodeURIComponent(selectedYear)}`;
        if (targetType === 'aud') directUrl = `${EIOS_DIRECT_URL}/raspAudlist?year=${encodeURIComponent(selectedYear)}`;

        let items = [];
        try {
          if (targetType === 'group') {
            const res = await scheduleApi.getGroups(selectedYear);
            items = res?.data || [];
          } else if (targetType === 'teacher') {
            const res = await scheduleApi.getTeachers(selectedYear);
            items = res?.data || [];
          } else if (targetType === 'aud') {
            const res = await scheduleApi.getAuditories(selectedYear);
            items = res?.data || [];
          }
        } catch (e) {
          const res = await fetch(directUrl);
          const json = await res.json();
          items = json?.data || [];
        }

        if (isMounted) {
          setCatalogItems(items);
          setCatalogLoading(false);

          if (items.length > 0) {
            const exists = items.find(i => i.id === Number(selectedId));
            if (!exists) {
              const defaultItem = targetType === 'group' 
                ? (items.find(g => g.name.includes('24-ИСбо-1')) || items.find(g => g.facul === 'ИВИТШ') || items[0])
                : items[0];
              if (defaultItem) handleSelectItem(defaultItem);
            }
          }
        }
      } catch (err) {
        if (isMounted) setCatalogLoading(false);
      }
    };

    loadCatalog();
    return () => { isMounted = false; };
  }, [targetType, selectedYear]);

  // Handle selecting an item from search dropdown
  const handleSelectItem = (item) => {
    setSelectedId(item.id);
    setSelectedName(item.name);
    setIsDropdownOpen(false);
    setSearchQuery('');

    localStorage.setItem('portal_sched_id', item.id);
    localStorage.setItem('portal_sched_name', item.name);
  };

  // Filter catalog items by search query
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return catalogItems.slice(0, 30);
    const query = searchQuery.toLowerCase().trim();
    return catalogItems.filter(item => 
      item.name.toLowerCase().includes(query) || 
      (item.facul && item.facul.toLowerCase().includes(query)) ||
      (item.kaf && item.kaf.toLowerCase().includes(query))
    ).slice(0, 40);
  }, [catalogItems, searchQuery]);

  // 2. Fetch Lessons Schedule
  const fetchSchedule = async (id, name) => {
    if (!id) return;
    setLessonsLoading(true);
    setError(null);
    try {
      let paramKey = 'idGroup';
      if (targetType === 'teacher') paramKey = 'idTeacher';
      if (targetType === 'aud') paramKey = 'idAud';

      let raspData = [];
      try {
        const res = await scheduleApi.getSchedule(
          targetType === 'group' ? id : null,
          selectedYear
        );
        raspData = res?.data?.rasp || [];
      } catch (e) {
        const res = await fetch(`${EIOS_DIRECT_URL}/Rasp?${paramKey}=${id}&year=${encodeURIComponent(selectedYear)}`);
        const json = await res.json();
        raspData = json?.data?.rasp || [];
      }

      setRawLessons(raspData);

      // If no lessons for current selectedDate, find nearest available date with lessons
      if (raspData.length > 0) {
        const hasToday = raspData.some(l => l.дата && l.дата.startsWith(selectedDate));
        if (!hasToday) {
          const firstAvailableDate = raspData[0].дата ? raspData[0].дата.split('T')[0] : '';
          if (firstAvailableDate) {
            setSelectedDate(firstAvailableDate);
          }
        }
      }
    } catch (err) {
      setError('Не удалось загрузить расписание.');
      setRawLessons([]);
    } finally {
      setLessonsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId && selectedName) {
      fetchSchedule(selectedId, selectedName);
    }
  }, [selectedId, selectedYear, targetType]);

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

  // Filter lessons strictly for selectedDate
  const dayLessons = useMemo(() => {
    return deduplicatedLessons.filter(l => l.дата && l.дата.startsWith(selectedDate));
  }, [deduplicatedLessons, selectedDate]);

  // Group lessons for selectedDate into Time Slots
  const timeSlotGroups = useMemo(() => {
    const map = {};
    dayLessons.forEach(lesson => {
      const timeKey = `${lesson.начало}-${lesson.конец}`;
      if (!map[timeKey]) {
        map[timeKey] = {
          timeStart: lesson.начало,
          timeEnd: lesson.конец,
          lessonNum: lesson.номерЗанятия,
          color: lesson.цвет || 'var(--primary)',
          items: []
        };
      }
      map[timeKey].items.push(lesson);
    });
    return Object.values(map).sort((a, b) => a.timeStart.localeCompare(b.timeStart));
  }, [dayLessons]);

  // Extract unique dates available in schedule for quick Date Strip Navigation
  const availableDatesList = useMemo(() => {
    const datesMap = new Map();
    deduplicatedLessons.forEach(l => {
      if (l.дата) {
        const dStr = l.дата.split('T')[0];
        if (!datesMap.has(dStr)) {
          const dObj = new Date(dStr);
          const dayName = dObj.toLocaleDateString('ru-RU', { weekday: 'short' });
          const dayNum = dObj.getDate();
          const monthName = dObj.toLocaleDateString('ru-RU', { month: 'short' });
          datesMap.set(dStr, { iso: dStr, label: `${dayName}, ${dayNum} ${monthName}`, dayName, dayNum, monthName });
        }
      }
    });
    return Array.from(datesMap.values()).slice(0, 14); // show top 14 available dates
  }, [deduplicatedLessons]);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
            <CalendarDays size={22} style={{ color: 'var(--primary)' }} />
            Расписание КГУ
          </h3>
        </div>

        {/* Category Switcher */}
        <div style={{ display: 'flex', background: '#F1F3F5', padding: '4px', borderRadius: '12px', gap: '4px' }}>
          <button 
            onClick={() => { setTargetType('group'); setSearchQuery(''); }}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              background: targetType === 'group' ? 'white' : 'transparent',
              color: targetType === 'group' ? 'var(--primary)' : '#666',
              fontWeight: targetType === 'group' ? '800' : '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: targetType === 'group' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <GraduationCap size={15} /> Группы
          </button>
          <button 
            onClick={() => { setTargetType('teacher'); setSearchQuery(''); }}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              background: targetType === 'teacher' ? 'white' : 'transparent',
              color: targetType === 'teacher' ? 'var(--primary)' : '#666',
              fontWeight: targetType === 'teacher' ? '800' : '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: targetType === 'teacher' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <UserCheck size={15} /> Преподаватели
          </button>
          <button 
            onClick={() => { setTargetType('aud'); setSearchQuery(''); }}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              background: targetType === 'aud' ? 'white' : 'transparent',
              color: targetType === 'aud' ? 'var(--primary)' : '#666',
              fontWeight: targetType === 'aud' ? '800' : '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: targetType === 'aud' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Building2 size={15} /> Аудитории
          </button>
        </div>
      </div>

      {/* 2. UNIFIED SEARCH COMBOBOX & ACADEMIC YEAR SELECT */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', position: 'relative' }} ref={dropdownRef}>
        
        {/* Search Combobox Input */}
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <div 
            onClick={() => setIsDropdownOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#F8F9FA',
              border: isDropdownOpen ? '2px solid var(--primary)' : '1px solid #DEE2E6',
              borderRadius: '14px',
              padding: '10px 14px',
              cursor: 'text'
            }}
          >
            <Search size={16} style={{ color: 'var(--primary)', marginRight: '8px', flexShrink: 0 }} />
            <input 
              type="text" 
              placeholder={
                targetType === 'group' ? 'Поиск группы (напр. 24-ИСбо-1)...' :
                targetType === 'teacher' ? 'Поиск ФИО преподавателя...' :
                'Поиск кабинета (напр. Б-304)...'
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'var(--text)'
              }}
            />
            {selectedName && !searchQuery && (
              <span style={{
                background: 'var(--primary)',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '0.8rem',
                fontWeight: '800',
                marginLeft: '6px',
                whiteSpace: 'nowrap'
              }}>
                {selectedName}
              </span>
            )}
            <ChevronDown size={16} style={{ color: '#888', marginLeft: '6px', flexShrink: 0 }} />
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
                <div style={{ padding: '14px', textCenter: 'center', color: '#888', fontSize: '0.85rem' }}>
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
                    {item.id === Number(selectedId) && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '800' }}>✓ Выбрано</span>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '14px', textCenter: 'center', color: '#888', fontSize: '0.85rem' }}>
                  Ничего не найдено
                </div>
              )}
            </div>
          )}
        </div>

        {/* Custom Styled Academic Year Select */}
        <div style={{ position: 'relative', minWidth: '130px' }}>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 28px 10px 14px',
              borderRadius: '14px',
              border: '1px solid #DEE2E6',
              background: '#F8F9FA',
              fontSize: '0.88rem',
              fontWeight: '750',
              color: 'var(--text)',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none'
            }}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#666' }} />
        </div>
      </div>

      {/* 3. DATE SELECTION TOOLBAR */}
      <div style={{ background: '#F8F9FA', padding: '12px 18px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #E9ECEF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={18} style={{ color: 'var(--primary)' }} /> Выбор конкретной даты:
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid #DEE2E6',
              background: 'white',
              fontSize: '0.88rem',
              fontWeight: '700',
              color: 'var(--text)',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>

      {/* 4. COMPACT TIME-SLOT CARDS DISPLAY */}
      {lessonsLoading ? (
        <div style={{ textAlign: 'center', padding: '45px 0', color: '#666' }}>
          <div className="spinner" style={{ margin: '0 auto 10px auto' }}></div>
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Загрузка пар для "{selectedName}"...</span>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '24px', background: '#FFF5F5', borderRadius: '16px', color: '#C53030', border: '1px solid #FEB2B2' }}>
          <AlertCircle size={32} style={{ marginBottom: '6px' }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.98rem', fontWeight: '800' }}>{error}</h4>
        </div>
      ) : timeSlotGroups.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📅 Расписание на {selectedDate ? new Date(selectedDate).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'выбранный день'}:
          </div>

          {timeSlotGroups.map((slot, sIdx) => (
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

              {/* Slot Sub-Items (Clean list of subgroups or single item) */}
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
      ) : (
        <div style={{ textAlign: 'center', padding: '36px 0', color: '#888' }}>
          <BookOpen size={38} strokeWidth={1.5} style={{ color: '#ccc', marginBottom: '8px' }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '800' }}>Занятий нет</h4>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>На выбранный день пары не запланированы</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleWidget;
