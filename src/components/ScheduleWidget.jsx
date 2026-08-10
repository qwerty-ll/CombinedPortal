import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CalendarDays, Search, Clock, MapPin, User, BookOpen, AlertCircle, 
  ChevronDown, GraduationCap, Building2, UserCheck, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scheduleApi } from '../services/api';

const EIOS_DIRECT_URL = 'https://eios.kosgos.ru/api';

const ScheduleWidget = () => {
  const [targetType, setTargetType] = useState('group'); // 'group' | 'teacher' | 'aud'
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const availableYears = ['2025-2026', '2024-2025', '2023-2024', '2026-2027'];

  // Current selection state
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem('portal_sched_id') || 8540);
  const [selectedName, setSelectedName] = useState(() => localStorage.getItem('portal_sched_name') || '24-ИСбо-1');
  const [selectedMeta, setSelectedMeta] = useState(() => localStorage.getItem('portal_sched_meta') || 'ИВИТШ');

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
  
  // Day filter state: 'all' | 'today' | 'tomorrow' | 1 | 2 | 3 | 4 | 5 | 6
  const [activeDayFilter, setActiveDayFilter] = useState('all');

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
    const meta = item.facul || item.kaf || (item.kurs ? `${item.kurs} курс` : '');
    setSelectedMeta(meta);
    setIsDropdownOpen(false);
    setSearchQuery('');

    localStorage.setItem('portal_sched_id', item.id);
    localStorage.setItem('portal_sched_name', item.name);
    localStorage.setItem('portal_sched_meta', meta);
  };

  // Filter catalog items by search query
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return catalogItems.slice(0, 40); // show top 40 when empty
    const query = searchQuery.toLowerCase().trim();
    return catalogItems.filter(item => 
      item.name.toLowerCase().includes(query) || 
      (item.facul && item.facul.toLowerCase().includes(query)) ||
      (item.kaf && item.kaf.toLowerCase().includes(query))
    ).slice(0, 50);
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
        // Direct browser fallback
        const res = await fetch(`${EIOS_DIRECT_URL}/Rasp?${paramKey}=${id}&year=${encodeURIComponent(selectedYear)}`);
        const json = await res.json();
        raspData = json?.data?.rasp || [];
      }

      setLessons(raspData);
    } catch (err) {
      setError('Не удалось загрузить расписание. Выберите другой объект или учебный год.');
      setLessons([]);
    } finally {
      setLessonsLoading(false);
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
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      borderRadius: '28px',
      padding: '30px',
      border: '1px solid rgba(0, 127, 255, 0.12)',
      boxShadow: '0 16px 40px rgba(0,0,0,0.04)'
    }}>
      {/* 1. TOP HEADER & CATEGORY SEGMENTED SWITCHER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text)' }}>
            <CalendarDays size={26} style={{ color: 'var(--primary)' }} />
            Расписание занятий КГУ
          </h2>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Поиск по группам, преподавателям и аудиториям университета</p>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', background: '#F0F4F8', padding: '5px', borderRadius: '14px', gap: '4px' }}>
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
              boxShadow: targetType === 'group' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
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
              boxShadow: targetType === 'teacher' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
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
              boxShadow: targetType === 'aud' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
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

      {/* 2. UNIFIED SEARCH INPUT & ACADEMIC YEAR SELECTOR */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '24px', position: 'relative' }} ref={dropdownRef}>
        
        {/* Interactive Custom Combobox Input */}
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <div 
            onClick={() => setIsDropdownOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#F8F9FA',
              border: isDropdownOpen ? '2px solid var(--primary)' : '1px solid #DEE2E6',
              borderRadius: '16px',
              padding: '12px 16px',
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
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.8rem',
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
              boxShadow: '0 12px 36px rgba(0,0,0,0.15)',
              marginTop: '6px',
              zIndex: 100,
              maxHeight: '280px',
              overflowY: 'auto',
              padding: '6px 0'
            }}>
              {catalogLoading ? (
                <div style={{ padding: '16px', textCenter: 'center', color: '#888', fontSize: '0.88rem' }}>
                  Загрузка справочника...
                </div>
              ) : filteredCatalog.length > 0 ? (
                filteredCatalog.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    style={{
                      padding: '10px 18px',
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
                      <strong style={{ fontSize: '0.94rem', color: 'var(--text)' }}>{item.name}</strong>
                      {(item.facul || item.kaf || item.kurs) && (
                        <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '2px' }}>
                          {item.facul && <span style={{ background: '#E3F2FD', color: '#0D47A1', padding: '2px 6px', borderRadius: '4px', marginRight: '6px', fontWeight: '700' }}>{item.facul}</span>}
                          {item.kaf && <span>Кафедра: {item.kaf}</span>}
                          {item.kurs && <span>{item.kurs} курс</span>}
                        </div>
                      )}
                    </div>
                    {item.id === Number(selectedId) && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '800' }}>✓ Выбрано</span>
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

      {/* 3. DAY OF WEEK FILTER TABS */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '24px' }}>
        {[
          { id: 'all', label: 'Все пары' },
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
              padding: '8px 18px',
              borderRadius: '12px',
              border: '1px solid #E9ECEF',
              background: activeDayFilter === tab.id ? 'var(--primary)' : 'white',
              color: activeDayFilter === tab.id ? 'white' : '#555',
              fontWeight: activeDayFilter === tab.id ? '800' : '600',
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: activeDayFilter === tab.id ? '0 4px 12px rgba(0,127,255,0.22)' : 'none',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. LESSON CARDS DISPLAY */}
      {lessonsLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
          <div className="spinner" style={{ margin: '0 auto 12px auto' }}></div>
          <span style={{ fontSize: '0.92rem', fontWeight: '600' }}>Загрузка расписания для "{selectedName}"...</span>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', background: '#FFF5F5', borderRadius: '20px', color: '#C53030', border: '1px solid #FEB2B2' }}>
          <AlertCircle size={36} style={{ marginBottom: '8px' }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '1.02rem', fontWeight: '800' }}>{error}</h4>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>Попробуйте выбрать другой объект или учебный год</p>
        </div>
      ) : Object.keys(groupedLessons).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Object.keys(groupedLessons).map(dayTitle => (
            <div key={dayTitle}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text)', borderBottom: '2px solid rgba(0,127,255,0.12)', paddingBottom: '8px' }}>
                📅 {dayTitle}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {groupedLessons[dayTitle].map((lesson, idx) => (
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

                    {lesson.номерПодгруппы > 0 && (
                      <span style={{ background: '#E3F2FD', color: '#0D47A1', padding: '6px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '800' }}>
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
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#888' }}>
          <BookOpen size={44} strokeWidth={1.5} style={{ color: '#ccc', marginBottom: '10px' }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '1.08rem', fontWeight: '800' }}>Занятий не найдено</h4>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>На выбранный период пары отсутствуют</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleWidget;
