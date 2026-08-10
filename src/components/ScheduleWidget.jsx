import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CalendarDays, Search, Clock, MapPin, User, BookOpen, AlertCircle, 
  ChevronDown, GraduationCap, Building2, UserCheck, Calendar, Sparkles, 
  ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scheduleApi } from '../services/api';

const EIOS_DIRECT_URL = 'https://eios.kosgos.ru/api';

// Popular IVITSH groups for quick 1-click access
const POPULAR_GROUPS = [
  { name: '24-ИСбо-1', id: 8540 },
  { name: '25-ИСбо-1', id: 8448 },
  { name: '24-ИСбо-2', id: 8541 },
  { name: '25-ПМбо-1', id: 8474 },
  { name: '23-ИСбо-1', id: 8140 },
];

const ScheduleWidget = () => {
  const [targetType, setTargetType] = useState('group'); // 'group' | 'teacher' | 'aud'
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const availableYears = ['2025-2026', '2024-2025', '2023-2024', '2026-2027'];

  // Current selection state
  const [selectedId, setSelectedId] = useState(() => Number(localStorage.getItem('portal_sched_id')) || 8540);
  const [selectedName, setSelectedName] = useState(() => localStorage.getItem('portal_sched_name') || '24-ИСбо-1');

  // Date selection state
  const [customDate, setCustomDate] = useState(''); // 'YYYY-MM-DD'
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState('all'); // 'all' | 1 | 2 | 3 | 4 | 5 | 6 | 'today' | 'tomorrow'

  // Input & Dropdown state
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Catalog items list
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Lessons data state
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [error, setError] = useState(null);

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
          // Direct browser fallback
          const res = await fetch(directUrl);
          const json = await res.json();
          items = json?.data || [];
        }

        if (isMounted) {
          setCatalogItems(items);
          setCatalogLoading(false);

          // If current selected item not in new catalog, pick first relevant item
          if (items.length > 0) {
            const exists = items.find(i => i.id === Number(selectedId));
            if (!exists) {
              const defaultItem = targetType === 'group' 
                ? (items.find(g => g.name.includes('24-ИСбо-1')) || items.find(g => g.facul === 'ИВИТШ') || items[0])
                : items[0];
              if (defaultItem) {
                handleSelectItem(defaultItem);
              }
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
    if (!searchQuery.trim()) return catalogItems.slice(0, 35);
    const query = searchQuery.toLowerCase().trim();
    return catalogItems.filter(item => 
      item.name.toLowerCase().includes(query) || 
      (item.facul && item.facul.toLowerCase().includes(query)) ||
      (item.kaf && item.kaf.toLowerCase().includes(query))
    ).slice(0, 50);
  }, [catalogItems, searchQuery]);

  // 2. Fetch Lessons Schedule
  const fetchSchedule = async (id, name, dateParam = '') => {
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
          selectedYear,
          dateParam
        );
        raspData = res?.data?.rasp || [];
      } catch (e) {
        // Direct browser fallback
        let url = `${EIOS_DIRECT_URL}/Rasp?${paramKey}=${id}&year=${encodeURIComponent(selectedYear)}`;
        if (dateParam) url += `&sdate=${encodeURIComponent(dateParam)}`;
        const res = await fetch(url);
        const json = await res.json();
        raspData = json?.data?.rasp || [];
      }

      setLessons(raspData);
    } catch (err) {
      setError('Не удалось загрузить расписание. Выберите другой учебный год или объект.');
      setLessons([]);
    } finally {
      setLessonsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId && selectedName) {
      fetchSchedule(selectedId, selectedName, customDate);
    }
  }, [selectedId, selectedYear, targetType, customDate]);

  // Helper date matchers
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  // Filter displayed lessons by date or day of week
  const displayedLessons = useMemo(() => {
    return lessons.filter(l => {
      const lessonDate = l.дата ? l.дата.split('T')[0] : '';
      if (customDate) return lessonDate === customDate;
      if (selectedDayOfWeek === 'today') return lessonDate === todayStr;
      if (selectedDayOfWeek === 'tomorrow') return lessonDate === tomorrowStr;
      if (typeof selectedDayOfWeek === 'number') return l.деньНедели === selectedDayOfWeek;
      return true; // 'all'
    });
  }, [lessons, customDate, selectedDayOfWeek, todayStr, tomorrowStr]);

  // Group displayed lessons by Day Title
  const groupedLessons = useMemo(() => {
    return displayedLessons.reduce((groups, lesson) => {
      const key = `${lesson.день_недели || 'День не указан'} (${lesson.дата ? new Date(lesson.дата).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : ''})`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(lesson);
      return groups;
    }, {});
  }, [displayedLessons]);

  // Generate Current Week Days for Week Strip
  const currentWeekDays = useMemo(() => {
    const now = new Date();
    const currentDayNum = now.getDay(); // 0 is Sunday
    const distanceToMon = currentDayNum === 0 ? -6 : 1 - currentDayNum;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMon);

    const days = [];
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      days.push({
        dayName: dayNames[i],
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('ru-RU', { month: 'short' }),
        iso: iso,
        isToday: iso === todayStr,
        dayOfWeekId: i + 1
      });
    }
    return days;
  }, [todayStr]);

  // Helper for lesson type badge text and color
  const getLessonTypeBadge = (disciplineName) => {
    const lower = (disciplineName || '').toLowerCase();
    if (lower.includes('лек')) return { label: 'Лекция', bg: '#E6F4EA', color: '#137333' };
    if (lower.includes('лаб')) return { label: 'Лабораторная', bg: '#F3E8FF', color: '#7E22CE' };
    if (lower.includes('пр')) return { label: 'Практическое', bg: '#FEF3C7', color: '#B45309' };
    if (lower.includes('экз') || lower.includes('зач')) return { label: 'Аттестация', bg: '#FEE2E2', color: '#B91C1C' };
    return { label: 'Занятие', bg: '#E0F2FE', color: '#0369A1' };
  };

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '28px',
      padding: '32px',
      border: '1px solid #E9ECEF',
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)'
    }}>
      {/* 1. TOP HEADER & QUICK ACCESS CHIPS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text)' }}>
            <CalendarDays size={26} style={{ color: 'var(--primary)' }} />
            Расписание КГУ
          </h2>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Быстрый поиск расписания пар, преподавателей и аудиторий</p>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ display: 'flex', background: '#F1F3F5', padding: '4px', borderRadius: '14px', gap: '4px' }}>
          <button 
            onClick={() => { setTargetType('group'); setSearchQuery(''); }}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              background: targetType === 'group' ? 'white' : 'transparent',
              color: targetType === 'group' ? 'var(--primary)' : '#666',
              fontWeight: targetType === 'group' ? '800' : '600',
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: targetType === 'group' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <GraduationCap size={16} /> Группы
          </button>
          <button 
            onClick={() => { setTargetType('teacher'); setSearchQuery(''); }}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              background: targetType === 'teacher' ? 'white' : 'transparent',
              color: targetType === 'teacher' ? 'var(--primary)' : '#666',
              fontWeight: targetType === 'teacher' ? '800' : '600',
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: targetType === 'teacher' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <UserCheck size={16} /> Преподаватели
          </button>
          <button 
            onClick={() => { setTargetType('aud'); setSearchQuery(''); }}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              background: targetType === 'aud' ? 'white' : 'transparent',
              color: targetType === 'aud' ? 'var(--primary)' : '#666',
              fontWeight: targetType === 'aud' ? '800' : '600',
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: targetType === 'aud' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <Building2 size={16} /> Аудитории
          </button>
        </div>
      </div>

      {/* POPULAR IVITSH GROUPS CHIPS (Only shown in group mode) */}
      {targetType === 'group' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#777', fontWeight: '700' }}>Быстрый выбор:</span>
          {POPULAR_GROUPS.map(g => (
            <button 
              key={g.id}
              onClick={() => handleSelectItem(g)}
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                border: selectedId === g.id ? '1px solid var(--primary)' : '1px solid #E9ECEF',
                background: selectedId === g.id ? 'rgba(0, 127, 255, 0.08)' : '#F8F9FA',
                color: selectedId === g.id ? 'var(--primary)' : '#555',
                fontSize: '0.82rem',
                fontWeight: selectedId === g.id ? '800' : '600',
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* 2. UNIFIED SEARCH INPUT & ACADEMIC YEAR SELECTOR */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '24px', position: 'relative' }} ref={dropdownRef}>
        
        {/* Interactive Custom Combobox Input */}
        <div style={{ position: 'relative', flex: '1 1 320px' }}>
          <div 
            onClick={() => setIsDropdownOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#F8F9FA',
              border: isDropdownOpen ? '2px solid var(--primary)' : '1px solid #DEE2E6',
              borderRadius: '16px',
              padding: '12px 18px',
              cursor: 'text',
              transition: 'all 0.15s'
            }}
          >
            <Search size={18} style={{ color: 'var(--primary)', marginRight: '10px', flexShrink: 0 }} />
            <input 
              type="text" 
              placeholder={
                targetType === 'group' ? 'Поиск группы (напр. 24-ИСбо-1, 25-ПМбо-1)...' :
                targetType === 'teacher' ? 'Поиск преподавателя (напр. Ярыгина, Орлов)...' :
                'Поиск аудитории (напр. Б-304, Б-101, Гл-240)...'
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
                fontSize: '0.94rem',
                fontWeight: '600',
                color: 'var(--text)'
              }}
            />
            {selectedName && !searchQuery && (
              <span style={{
                background: 'var(--primary)',
                color: 'white',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: '800',
                marginLeft: '8px',
                whiteSpace: 'nowrap'
              }}>
                {selectedName}
              </span>
            )}
            <ChevronDown size={18} style={{ color: '#888', marginLeft: '8px', flexShrink: 0 }} />
          </div>

          {/* Floating Dropdown Results Card */}
          {isDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #E9ECEF',
              boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
              marginTop: '6px',
              zIndex: 100,
              maxHeight: '290px',
              overflowY: 'auto',
              padding: '6px 0'
            }}>
              {catalogLoading ? (
                <div style={{ padding: '16px', textCenter: 'center', color: '#888', fontSize: '0.88rem' }}>
                  Загрузка справочника ЭИОС КГУ...
                </div>
              ) : filteredCatalog.length > 0 ? (
                filteredCatalog.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    style={{
                      padding: '11px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderBottom: '1px solid #F1F3F5',
                      transition: 'background 0.12s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F0F7FF'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{item.name}</strong>
                      {(item.facul || item.kaf || item.kurs) && (
                        <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '2px' }}>
                          {item.facul && <span style={{ background: '#E3F2FD', color: '#0D47A1', padding: '2px 6px', borderRadius: '4px', marginRight: '6px', fontWeight: '700' }}>{item.facul}</span>}
                          {item.kaf && <span>Кафедра: {item.kaf}</span>}
                          {item.kurs && <span>{item.kurs} курс</span>}
                        </div>
                      )}
                    </div>
                    {item.id === Number(selectedId) && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '800' }}>✓ Выбрано</span>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textCenter: 'center', color: '#888', fontSize: '0.88rem' }}>
                  Ничего не найдено по запросу "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Academic Year Dropdown */}
        <div style={{ minWidth: '150px' }}>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '16px',
              border: '1px solid #DEE2E6',
              background: '#F8F9FA',
              fontSize: '0.9rem',
              fontWeight: '800',
              color: 'var(--text)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y} уч. год</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. DATE SELECTOR TOOLBAR (DATE PICKER & WEEK STRIP) */}
      <div style={{ background: '#F8F9FA', padding: '16px', borderRadius: '20px', marginBottom: '24px', border: '1px solid #E9ECEF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} style={{ color: 'var(--primary)' }} /> Фильтр по дате:
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Custom Date Input */}
            <input 
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setSelectedDayOfWeek('all');
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                border: '1px solid #DEE2E6',
                background: 'white',
                fontSize: '0.85rem',
                fontWeight: '700',
                color: 'var(--text)',
                outline: 'none'
              }}
            />

            {customDate && (
              <button 
                onClick={() => setCustomDate('')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#FFE0E0',
                  color: '#C53030',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Сбросить дату
              </button>
            )}

            {/* Quick buttons */}
            <button 
              onClick={() => { setCustomDate(''); setSelectedDayOfWeek('today'); }}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid #DEE2E6',
                background: selectedDayOfWeek === 'today' && !customDate ? 'var(--primary)' : 'white',
                color: selectedDayOfWeek === 'today' && !customDate ? 'white' : '#555',
                fontSize: '0.82rem',
                fontWeight: '750',
                cursor: 'pointer'
              }}
            >
              Сегодня
            </button>
            <button 
              onClick={() => { setCustomDate(''); setSelectedDayOfWeek('tomorrow'); }}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid #DEE2E6',
                background: selectedDayOfWeek === 'tomorrow' && !customDate ? 'var(--primary)' : 'white',
                color: selectedDayOfWeek === 'tomorrow' && !customDate ? 'white' : '#555',
                fontSize: '0.82rem',
                fontWeight: '750',
                cursor: 'pointer'
              }}
            >
              Завтра
            </button>
            <button 
              onClick={() => { setCustomDate(''); setSelectedDayOfWeek('all'); }}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid #DEE2E6',
                background: selectedDayOfWeek === 'all' && !customDate ? 'var(--primary)' : 'white',
                color: selectedDayOfWeek === 'all' && !customDate ? 'white' : '#555',
                fontSize: '0.82rem',
                fontWeight: '750',
                cursor: 'pointer'
              }}
            >
              Всё расписание
            </button>
          </div>
        </div>

        {/* Weekly Date Cards Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px' }}>
          {currentWeekDays.map(day => {
            const isSelected = customDate === day.iso || (selectedDayOfWeek === day.dayOfWeekId && !customDate);
            return (
              <div 
                key={day.iso}
                onClick={() => {
                  setCustomDate(day.iso);
                  setSelectedDayOfWeek('all');
                }}
                style={{
                  background: isSelected ? 'var(--primary)' : 'white',
                  color: isSelected ? 'white' : 'var(--text)',
                  border: isSelected ? 'none' : '1px solid #E9ECEF',
                  borderRadius: '12px',
                  padding: '10px 6px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(0,127,255,0.25)' : 'none'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', opacity: isSelected ? 0.9 : 0.6 }}>
                  {day.dayName}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: '800', margin: '2px 0' }}>
                  {day.dayNum}
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: '600', opacity: isSelected ? 0.9 : 0.6 }}>
                  {day.monthName}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. LESSON CARDS DISPLAY */}
      {lessonsLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
          <div className="spinner" style={{ margin: '0 auto 12px auto' }}></div>
          <span style={{ fontSize: '0.94rem', fontWeight: '600' }}>Загрузка расписания для "{selectedName}"...</span>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: '#FFF5F5', borderRadius: '20px', color: '#C53030', border: '1px solid #FEB2B2' }}>
          <AlertCircle size={36} style={{ marginBottom: '8px' }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: '800' }}>{error}</h4>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>Попробуйте выбрать другой объект или сбросить дату выше</p>
        </div>
      ) : Object.keys(groupedLessons).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Object.keys(groupedLessons).map(dayTitle => (
            <div key={dayTitle}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text)', borderBottom: '2px solid rgba(0,127,255,0.12)', paddingBottom: '8px' }}>
                📅 {dayTitle}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {groupedLessons[dayTitle].map((lesson, idx) => {
                  const typeBadge = getLessonTypeBadge(lesson.дисциплина);
                  return (
                    <motion.div 
                      key={lesson.код || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        background: 'white',
                        borderLeft: `6px solid ${lesson.цвет || 'var(--primary)'}`,
                        borderTop: '1px solid #F1F3F5',
                        borderRight: '1px solid #F1F3F5',
                        borderBottom: '1px solid #F1F3F5',
                        borderRadius: '16px',
                        padding: '18px 22px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                        <div style={{ background: 'linear-gradient(135deg, rgba(0,127,255,0.08), rgba(0,127,255,0.14))', padding: '12px 16px', borderRadius: '14px', minWidth: '110px', textAlign: 'center' }}>
                          <div style={{ fontWeight: '800', fontSize: '0.98rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <Clock size={14} /> {lesson.начало} - {lesson.конец}
                          </div>
                          <span style={{ fontSize: '0.78rem', color: '#666', fontWeight: '700', marginTop: '2px', display: 'block' }}>{lesson.номерЗанятия} пара</span>
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ background: typeBadge.bg, color: typeBadge.color, padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}>
                              {typeBadge.label}
                            </span>
                            {lesson.номерПодгруппы > 0 && (
                              <span style={{ background: '#E3F2FD', color: '#0D47A1', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}>
                                {lesson.номерПодгруппы} подгруппа
                              </span>
                            )}
                          </div>

                          <h5 style={{ margin: '0 0 6px 0', fontSize: '1.04rem', fontWeight: '800', color: 'var(--text)' }}>
                            {lesson.дисциплина}
                          </h5>

                          <div style={{ display: 'flex', gap: '18px', fontSize: '0.88rem', color: '#555', flexWrap: 'wrap' }}>
                            {lesson.преподаватель && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
                                <User size={15} style={{ color: '#777' }} /> {lesson.преподаватель}
                              </span>
                            )}
                            {lesson.аудитория && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '800', color: 'var(--primary)' }}>
                                <MapPin size={15} /> Аудитория: {lesson.аудитория}
                              </span>
                            )}
                            {lesson.группа && targetType !== 'group' && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
                                <GraduationCap size={15} style={{ color: '#777' }} /> Группа: {lesson.группа}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#888' }}>
          <BookOpen size={44} strokeWidth={1.5} style={{ color: '#ccc', marginBottom: '10px' }} />
          <h4 style={{ margin: '0 0 6px 0', fontSize: '1.08rem', fontWeight: '800' }}>Занятий не найдено</h4>
          <p style={{ margin: '0 0 14px 0', fontSize: '0.9rem' }}>
            {customDate ? `На выбранную дату (${new Date(customDate).toLocaleDateString('ru-RU')}) пары отсутствуют` : 'На выбранный период пары отсутствуют'}
          </p>
          {customDate && (
            <button 
              onClick={() => setCustomDate('')}
              style={{
                padding: '8px 18px',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--primary)',
                color: 'white',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Сбросить фильтр даты
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleWidget;
