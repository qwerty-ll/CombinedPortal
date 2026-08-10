import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, Search, Clock, MapPin, User, BookOpen, AlertCircle, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scheduleApi } from '../services/api';

const EIOS_DIRECT_URL = 'https://eios.kosgos.ru/api';

const ScheduleWidget = () => {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const availableYears = ['2025-2026', '2024-2025', '2023-2024', '2026-2027'];

  // Direct selected group (ID & Name)
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem('portal_schedule_id') || 8540);
  const [selectedName, setSelectedName] = useState(() => localStorage.getItem('portal_schedule_name') || '24-ИСбо-1');
  const [searchQuery, setSearchQuery] = useState('');

  // Data lists
  const [rawGroups, setRawGroups] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Day filter: 'all' | 'today' | 'tomorrow' | 1 | 2 | 3 | 4 | 5 | 6
  const [activeDayFilter, setActiveDayFilter] = useState('all');

  // 1. Fetch catalog groups for IVITSH
  useEffect(() => {
    let isMounted = true;
    const loadGroups = async () => {
      try {
        let groups = [];
        try {
          const res = await scheduleApi.getGroups(selectedYear);
          groups = res?.data || [];
        } catch (e) {
          // Direct browser fallback
          const directRes = await fetch(`${EIOS_DIRECT_URL}/raspGrouplist?year=${encodeURIComponent(selectedYear)}`);
          const data = await directRes.json();
          groups = data?.data || [];
        }

        // Strictly filter IVITSH groups (facul === 'ИВИТШ' or name contains ИСbo / ПМbo)
        const ivitshGroups = groups.filter(g => g.facul === 'ИВИТШ' || (g.name && (g.name.includes('ИСбо') || g.name.includes('ПМбо') || g.name.includes('ИСмо'))));
        const finalGroupsList = ivitshGroups.length > 0 ? ivitshGroups : groups;

        if (isMounted) {
          setRawGroups(finalGroupsList);
          if (finalGroupsList.length > 0) {
            const currentSelected = finalGroupsList.find(g => g.id === Number(selectedId));
            if (!currentSelected) {
              setSelectedId(finalGroupsList[0].id);
              setSelectedName(finalGroupsList[0].name);
            }
          }
        }
      } catch (err) {
        console.warn('Groups catalog load error:', err);
      }
    };

    loadGroups();
    return () => { isMounted = false; };
  }, [selectedYear]);

  // Filter groups by search query
  const filteredGroups = useMemo(() => {
    return rawGroups.filter(g => 
      searchQuery.trim() === '' || g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rawGroups, searchQuery]);

  // 2. Fetch Schedule for selected group ID
  const fetchSchedule = async (id, name) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      let raspData = [];
      try {
        const res = await scheduleApi.getSchedule(id, selectedYear);
        raspData = res?.data?.rasp || [];
      } catch (e) {
        // Direct browser fallback
        const directRes = await fetch(`${EIOS_DIRECT_URL}/Rasp?idGroup=${id}&year=${encodeURIComponent(selectedYear)}`);
        const data = await directRes.json();
        raspData = data?.data?.rasp || [];
      }

      setLessons(raspData);
      setSelectedId(id);
      setSelectedName(name);
      localStorage.setItem('portal_schedule_id', id);
      localStorage.setItem('portal_schedule_name', name);
    } catch (err) {
      setError('Не удалось загрузить расписание. Выберите другой учебный год или группу.');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId && selectedName) {
      fetchSchedule(selectedId, selectedName);
    }
  }, [selectedId, selectedYear]);

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
    <div className="schedule-card-container" style={{ background: 'white', borderRadius: '24px', padding: '28px', border: '1px solid #e9ecef', boxShadow: '0 12px 36px rgba(0,0,0,0.04)' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text)' }}>
          <CalendarDays size={24} style={{ color: 'var(--primary)' }} />
          Расписание занятий ИВИТШ КГУ
        </h2>
        <p style={{ color: '#666', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Актуальное расписание занятий Высшей ИТ-Школы</p>
      </div>

      {/* FILTER BAR: GROUP SELECTOR, SEARCH, ACADEMIC YEAR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '22px', background: '#F8F9FA', padding: '18px', borderRadius: '18px', border: '1px solid #e9ecef' }}>
        
        {/* IVITSH Group Select Dropdown */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '750', color: '#555', marginBottom: '6px' }}>Выберите группу ИВИТШ:</label>
          <select 
            value={selectedId || ''}
            onChange={(e) => {
              const group = rawGroups.find(g => g.id.toString() === e.target.value);
              if (group) {
                fetchSchedule(group.id, group.name);
              }
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid #ced4da',
              fontSize: '0.92rem',
              fontWeight: '700',
              background: 'white',
              color: 'var(--text)',
              outline: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}
          >
            {filteredGroups.map(g => (
              <option key={g.id} value={g.id}>
                {g.name} {g.kurs ? `(${g.kurs} курс)` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Search Box */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '750', color: '#555', marginBottom: '6px' }}>Быстрый поиск группы:</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Введите номер (напр. 24-ИСбо-1)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 34px',
                borderRadius: '12px',
                border: '1px solid #ced4da',
                fontSize: '0.9rem',
                outline: 'none',
                background: 'white',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          </div>
        </div>

        {/* Academic Year Select */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '750', color: '#555', marginBottom: '6px' }}>Учебный год:</label>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid #ced4da',
              fontSize: '0.92rem',
              fontWeight: '700',
              background: 'white',
              color: 'var(--text)',
              outline: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* DAY FILTER TABS */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '22px' }}>
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
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid #dee2e6',
              background: activeDayFilter === tab.id ? 'var(--primary)' : 'white',
              color: activeDayFilter === tab.id ? 'white' : '#555',
              fontWeight: activeDayFilter === tab.id ? '800' : '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              boxShadow: activeDayFilter === tab.id ? '0 4px 12px rgba(0,127,255,0.2)' : 'none',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* LESSONS LIST */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
          <div className="spinner" style={{ margin: '0 auto 12px auto' }}></div>
          <span style={{ fontSize: '0.92rem' }}>Загрузка расписания группы {selectedName}...</span>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', background: '#FFF5F5', borderRadius: '16px', color: '#C53030', border: '1px solid #FEB2B2' }}>
          <AlertCircle size={36} style={{ marginBottom: '8px' }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '800' }}>{error}</h4>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Выберите другую группу или учебный год выше</p>
        </div>
      ) : Object.keys(groupedLessons).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {Object.keys(groupedLessons).map(dayTitle => (
            <div key={dayTitle}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '800', color: 'var(--text)', borderBottom: '2px solid rgba(0,127,255,0.12)', paddingBottom: '6px' }}>
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
                      borderLeft: `5px solid ${lesson.цвет || 'var(--primary)'}`,
                      borderTop: '1px solid #e9ecef',
                      borderRight: '1px solid #e9ecef',
                      borderBottom: '1px solid #e9ecef',
                      borderRadius: '14px',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ background: 'rgba(0, 127, 255, 0.08)', padding: '10px 14px', borderRadius: '12px', minWidth: '105px', textAlign: 'center' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Clock size={14} /> {lesson.начало} - {lesson.конец}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#666', fontWeight: '600', marginTop: '2px', display: 'block' }}>{lesson.номерЗанятия} пара</span>
                      </div>

                      <div>
                        <h5 style={{ margin: '0 0 6px 0', fontSize: '1.02rem', fontWeight: '800', color: 'var(--text)' }}>
                          {lesson.дисциплина}
                        </h5>
                        <div style={{ display: 'flex', gap: '18px', fontSize: '0.88rem', color: '#555', flexWrap: 'wrap' }}>
                          {lesson.преподаватель && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <User size={15} style={{ color: '#777' }} /> {lesson.преподаватель}
                            </span>
                          )}
                          {lesson.аудитория && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '750', color: 'var(--primary)' }}>
                              <MapPin size={15} /> Аудитория: {lesson.аудитория}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {lesson.номерПодгруппы > 0 && (
                      <span style={{ background: '#E3F2FD', color: '#0D47A1', padding: '5px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '750' }}>
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
        <div style={{ textAlign: 'center', padding: '45px 0', color: '#888' }}>
          <BookOpen size={42} strokeWidth={1.5} style={{ color: '#ccc', marginBottom: '10px' }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: '800' }}>Занятий не найдено</h4>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>На выбранный день или фильтр пары отсутствуют</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleWidget;
