import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, Search, Clock, MapPin, User, ChevronRight, 
  RotateCcw, AlertCircle, CheckCircle2, BookOpen, Filter, Building2, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scheduleApi } from '../services/api';

const EIOS_DIRECT_URL = 'https://eios.kosgos.ru/api';

const ScheduleWidget = () => {
  const [targetType, setTargetType] = useState('group'); // 'group' | 'teacher' | 'aud'
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [availableYears, setAvailableYears] = useState(['2025-2026', '2024-2025']);

  // Pre-filtered by Faculty (Default ИВИТШ)
  const [selectedFaculty, setSelectedFaculty] = useState('ИВИТШ');
  
  // Direct selected object (ID & Name)
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem('portal_schedule_id') || 8540);
  const [selectedName, setSelectedName] = useState(() => localStorage.getItem('portal_schedule_name') || '24-ИСбо-1');
  const [searchQuery, setSearchQuery] = useState('');

  // Data lists
  const [rawItems, setRawItems] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Day filter: 'all' | 'today' | 'tomorrow' | 1 | 2 | 3 | 4 | 5 | 6
  const [activeDayFilter, setActiveDayFilter] = useState('all');

  // 1. Fetch catalog items (groups / teachers / auditories)
  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      try {
        let endpoint = `/api/v1/schedule/groups?year=${encodeURIComponent(selectedYear)}`;
        let directEndpoint = `${EIOS_DIRECT_URL}/raspGrouplist?year=${encodeURIComponent(selectedYear)}`;
        if (targetType === 'teacher') {
          endpoint = `/api/v1/schedule/teachers?year=${encodeURIComponent(selectedYear)}`;
          directEndpoint = `${EIOS_DIRECT_URL}/raspTeacherlist?year=${encodeURIComponent(selectedYear)}`;
        } else if (targetType === 'aud') {
          endpoint = `/api/v1/schedule/auditories?year=${encodeURIComponent(selectedYear)}`;
          directEndpoint = `${EIOS_DIRECT_URL}/raspAudlist?year=${encodeURIComponent(selectedYear)}`;
        }

        let items = [];
        try {
          const res = await scheduleApi.getGroups(selectedYear);
          items = res?.data || [];
        } catch (e) {
          // Direct browser fallback to EIOS KSU
          const directRes = await fetch(directEndpoint);
          const data = await directRes.json();
          items = data?.data || [];
        }

        if (isMounted) {
          setRawItems(items);
          // Auto select first group if none selected or type changed
          if (items.length > 0) {
            const defaultItem = items.find(i => (i.facul === 'ИВИТШ' || i.name?.includes('ИСбо'))) || items[0];
            if (defaultItem) {
              setSelectedId(defaultItem.id);
              setSelectedName(defaultItem.name);
            }
          }
        }
      } catch (err) {
        console.warn('Catalog load error:', err);
      }
    };

    loadCatalog();
    return () => { isMounted = false; };
  }, [targetType, selectedYear]);

  // Extract unique faculties for groups
  const availableFaculties = useMemo(() => {
    if (targetType !== 'group') return [];
    const set = new Set();
    rawItems.forEach(i => {
      if (i.facul) set.add(i.facul);
    });
    const list = Array.from(set).sort();
    return list.includes('ИВИТШ') ? ['ИВИТШ', ...list.filter(f => f !== 'ИВИТШ')] : list;
  }, [rawItems, targetType]);

  // Filter items by selected faculty and search query
  const filteredItems = useMemo(() => {
    return rawItems.filter(item => {
      const matchFaculty = targetType === 'group' ? (selectedFaculty === 'ALL' || item.facul === selectedFaculty) : true;
      const matchSearch = searchQuery.trim() === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFaculty && matchSearch;
    });
  }, [rawItems, targetType, selectedFaculty, searchQuery]);

  // 2. Fetch Schedule for selected ID
  const fetchSchedule = async (id, name) => {
    if (!id) return;
    setLoading(true);
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
        // Direct browser fallback
        const directRes = await fetch(`${EIOS_DIRECT_URL}/Rasp?${paramKey}=${id}&year=${encodeURIComponent(selectedYear)}`);
        const data = await directRes.json();
        raspData = data?.data?.rasp || [];
      }

      setLessons(raspData);
      setSelectedId(id);
      setSelectedName(name);
      localStorage.setItem('portal_schedule_id', id);
      localStorage.setItem('portal_schedule_name', name);
    } catch (err) {
      setError('Не удалось загрузить расписание с сервера ЭИОС КГУ. Попробуйте выбрать другую группу или учебный год.');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId && selectedName) {
      fetchSchedule(selectedId, selectedName);
    }
  }, [selectedId, selectedYear, targetType]);

  // Date matchers for tabs
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const displayedLessons = lessons.filter(l => {
    const lessonDate = l.дата ? l.дата.split('T')[0] : '';
    if (activeDayFilter === 'today') return lessonDate === todayStr;
    if (activeDayFilter === 'tomorrow') return lessonDate === tomorrowStr;
    if (typeof activeDayFilter === 'number') return l.деньНедели === activeDayFilter;
    return true; // 'all'
  });

  // Group displayed lessons by Day Title
  const groupedLessons = displayedLessons.reduce((groups, lesson) => {
    const key = `${lesson.день_недели || 'День не указан'} (${lesson.дата ? new Date(lesson.дата).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : ''})`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(lesson);
    return groups;
  }, {});

  return (
    <div className="schedule-widget-box" style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #e9ecef', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
      
      {/* 1. TOP HEADER & MODE SELECTOR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
            <CalendarDays size={22} style={{ color: 'var(--primary)' }} />
            Расписание занятий ЭИОС КГУ (API)
          </h3>
          <p style={{ color: '#666', fontSize: '0.88rem', margin: '4px 0 0 0' }}>Прямые запросы к расписанию групп, преподавателей и аудиторий</p>
        </div>

        {/* Mode switch tabs: Group / Teacher / Auditory */}
        <div style={{ display: 'flex', background: '#F0F4F8', padding: '4px', borderRadius: '12px', gap: '4px' }}>
          <button 
            onClick={() => setTargetType('group')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: targetType === 'group' ? 'white' : 'transparent',
              color: targetType === 'group' ? 'var(--primary)' : '#666',
              fontWeight: targetType === 'group' ? '800' : '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: targetType === 'group' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={15} /> Группы
          </button>
          <button 
            onClick={() => setTargetType('teacher')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: targetType === 'teacher' ? 'white' : 'transparent',
              color: targetType === 'teacher' ? 'var(--primary)' : '#666',
              fontWeight: targetType === 'teacher' ? '800' : '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: targetType === 'teacher' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <User size={15} /> Преподаватели
          </button>
          <button 
            onClick={() => setTargetType('aud')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: targetType === 'aud' ? 'white' : 'transparent',
              color: targetType === 'aud' ? 'var(--primary)' : '#666',
              fontWeight: targetType === 'aud' ? '800' : '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: targetType === 'aud' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Building2 size={15} /> Аудитории
          </button>
        </div>
      </div>

      {/* 2. SELECTORS BAR: FACULTY DROPDOWN, GROUP DROPDOWN, YEAR & SEARCH INPUT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px', background: '#F8F9FA', padding: '16px', borderRadius: '16px', border: '1px solid #e9ecef' }}>
        
        {/* Faculty Select (only for groups) */}
        {targetType === 'group' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#666', marginBottom: '4px' }}>Институт / Факультет:</label>
            <select 
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid #ced4da',
                fontSize: '0.88rem',
                fontWeight: '700',
                background: 'white',
                color: 'var(--text)'
              }}
            >
              <option value="ALL">Все институты КГУ</option>
              {availableFaculties.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        )}

        {/* Group / Teacher / Aud Dropdown Selection */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#666', marginBottom: '4px' }}>
            Выбор {targetType === 'group' ? 'группы' : targetType === 'teacher' ? 'преподавателя' : 'аудитории'}:
          </label>
          <select 
            value={selectedId || ''}
            onChange={(e) => {
              const item = rawItems.find(i => i.id.toString() === e.target.value);
              if (item) {
                fetchSchedule(item.id, item.name);
              }
            }}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #ced4da',
              fontSize: '0.88rem',
              fontWeight: '700',
              background: 'white',
              color: 'var(--text)'
            }}
          >
            {filteredItems.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} {item.kurs ? `(${item.kurs} курс)` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#666', marginBottom: '4px' }}>Быстрый поиск по названию:</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 32px',
                borderRadius: '10px',
                border: '1px solid #ced4da',
                fontSize: '0.88rem',
                outline: 'none',
                background: 'white'
              }}
            />
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          </div>
        </div>

        {/* Academic Year Dropdown */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#666', marginBottom: '4px' }}>Учебный год:</label>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #ced4da',
              fontSize: '0.88rem',
              fontWeight: '700',
              background: 'white',
              color: 'var(--text)'
            }}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. DAY OF WEEK FILTER TABS */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '20px' }}>
        {[
          { id: 'all', label: 'Все пара' },
          { id: 'today', label: 'Сегодня' },
          { id: 'tomorrow', label: 'Завтра' },
          { id: 1, label: 'Пн' },
          { id: 2, label: 'Вт' },
          { id: 3, label: 'Ср' },
          { id: 4, label: 'Чт' },
          { id: 5, label: 'Пт' },
          { id: 6, label: 'Сб' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveDayFilter(tab.id)}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              background: activeDayFilter === tab.id ? 'var(--primary)' : 'white',
              color: activeDayFilter === tab.id ? 'white' : '#555',
              fontWeight: activeDayFilter === tab.id ? '800' : '600',
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. LESSONS CARDS LIST DISPLAY */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
          <div className="spinner" style={{ margin: '0 auto 12px auto' }}></div>
          <span>Загрузка расписания с серверов ЭИОС КГУ...</span>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', background: '#FFF5F5', borderRadius: '16px', color: '#C53030', border: '1px solid #FEB2B2' }}>
          <AlertCircle size={36} style={{ marginBottom: '8px' }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '800' }}>{error}</h4>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Выберите другую группу из выпадающего списка выше</p>
        </div>
      ) : Object.keys(groupedLessons).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.keys(groupedLessons).map(dayTitle => (
            <div key={dayTitle}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.98rem', fontWeight: '800', color: 'var(--text)', borderBottom: '2px solid rgba(0,127,255,0.12)', paddingBottom: '6px' }}>
                📅 {dayTitle}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {groupedLessons[dayTitle].map((lesson, idx) => (
                  <motion.div 
                    key={lesson.код || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'white',
                      borderLeft: `5px solid ${lesson.цвет || 'var(--primary)'}`,
                      borderTop: '1px solid #e9ecef',
                      borderRight: '1px solid #e9ecef',
                      borderBottom: '1px solid #e9ecef',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ background: '#F0F4F8', padding: '8px 12px', borderRadius: '10px', minWidth: '95px', textAlign: 'center' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Clock size={13} /> {lesson.начало} - {lesson.конец}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: '600' }}>{lesson.номерЗанятия} пара</span>
                      </div>

                      <div>
                        <h5 style={{ margin: '0 0 4px 0', fontSize: '0.96rem', fontWeight: '800', color: 'var(--text)' }}>
                          {lesson.дисциплина}
                        </h5>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#555', flexWrap: 'wrap' }}>
                          {lesson.преподаватель && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={14} style={{ color: '#777' }} /> {lesson.преподаватель}
                            </span>
                          )}
                          {lesson.аудитория && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '750', color: 'var(--primary)' }}>
                              <MapPin size={14} /> Аудитория: {lesson.аудитория}
                            </span>
                          )}
                          {lesson.группа && targetType !== 'group' && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Users size={14} style={{ color: '#777' }} /> Группа: {lesson.группа}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {lesson.номерПодгруппы > 0 && (
                      <span style={{ background: '#E3F2FD', color: '#0D47A1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700' }}>
                        {lesson.номерПодгруппы} подгруппа
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
          <BookOpen size={40} strokeWidth={1.5} style={{ color: '#ccc', marginBottom: '8px' }} />
          <h4 style={{ margin: '0 0 4px 0' }}>Занятий не найдено</h4>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>На выбранный день или фильтр пары отсутствуют</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleWidget;
