import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, Search, Clock, MapPin, User, ChevronLeft, ChevronRight, 
  RotateCcw, AlertCircle, CheckCircle2, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scheduleApi } from '../services/api';

const ScheduleWidget = () => {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [availableYears, setAvailableYears] = useState(['2025-2026', '2024-2025']);
  
  const [groupInput, setGroupInput] = useState(() => localStorage.getItem('portal_group_number') || '24-ИСбо-1');
  const [selectedGroupId, setSelectedGroupId] = useState(() => localStorage.getItem('portal_group_id') || null);
  const [selectedGroupName, setSelectedGroupName] = useState(() => localStorage.getItem('portal_group_number') || '');
  
  const [groupsList, setGroupsList] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'today' | 'tomorrow'

  // Fetch available years & groups on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const yearsRes = await scheduleApi.getYears();
        if (yearsRes?.data?.years) {
          setAvailableYears(yearsRes.data.years);
        }
      } catch (e) {
        console.warn('Years fetch fallback:', e);
      }

      try {
        const groupsRes = await scheduleApi.getGroups(selectedYear);
        if (Array.isArray(groupsRes?.data)) {
          setGroupsList(groupsRes.data);
        }
      } catch (e) {
        console.warn('Groups fetch fallback:', e);
      }
    };
    initData();
  }, [selectedYear]);

  // Autocomplete suggestions
  useEffect(() => {
    if (!groupInput.trim()) {
      setFilteredGroups([]);
      return;
    }
    const match = groupsList.filter(g => 
      g.name.toLowerCase().includes(groupInput.toLowerCase())
    ).slice(0, 8);
    setFilteredGroups(match);
  }, [groupInput, groupsList]);

  // Load schedule for group ID
  const fetchScheduleForGroup = async (groupId, groupName) => {
    setLoading(true);
    setError(null);
    try {
      const res = await scheduleApi.getSchedule(groupId, selectedYear);
      const rawRasp = res?.data?.rasp || [];
      setLessons(rawRasp);
      setSelectedGroupId(groupId);
      setSelectedGroupName(groupName);
      localStorage.setItem('portal_group_id', groupId);
      localStorage.setItem('portal_group_number', groupName);
    } catch (err) {
      setError('Не удалось загрузить расписание с сервера ЭИОС КГУ');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  // Search submit handler
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setShowDropdown(false);
    if (!groupInput.trim()) return;

    // Try finding in preloaded groupsList
    const exact = groupsList.find(g => g.name.toLowerCase().trim() === groupInput.toLowerCase().trim());
    if (exact) {
      fetchScheduleForGroup(exact.id, exact.name);
    } else {
      // Try direct API fetch
      setLoading(true);
      setError(null);
      try {
        const groupsRes = await scheduleApi.getGroups(selectedYear);
        const groups = groupsRes?.data || [];
        const found = groups.find(g => g.name.toLowerCase().trim() === groupInput.toLowerCase().trim());
        if (found) {
          fetchScheduleForGroup(found.id, found.name);
        } else {
          setError(`Группа "${groupInput}" не найдена в системе ЭИОС за ${selectedYear} год`);
          setLoading(false);
        }
      } catch (err) {
        setError('Ошибка подключения к ЭИОС КГУ API');
        setLoading(false);
      }
    }
  };

  // Load default group schedule on initial render
  useEffect(() => {
    if (selectedGroupId && selectedGroupName) {
      fetchScheduleForGroup(selectedGroupId, selectedGroupName);
    } else if (groupInput) {
      // Attempt to load 24-ИСбо-1 by default
      const autoFind = async () => {
        try {
          const res = await scheduleApi.getGroups(selectedYear);
          const defaultGrp = (res?.data || []).find(g => g.name.includes('24-ИСбо-1')) || (res?.data || [])[0];
          if (defaultGrp) {
            fetchScheduleForGroup(defaultGrp.id, defaultGrp.name);
            setGroupInput(defaultGrp.name);
          }
        } catch (e) {}
      };
      autoFind();
    }
  }, []);

  // Helper date matchers
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const displayedLessons = lessons.filter(l => {
    const lessonDate = l.дата ? l.дата.split('T')[0] : '';
    if (activeTab === 'today') return lessonDate === todayStr;
    if (activeTab === 'tomorrow') return lessonDate === tomorrowStr;
    return true; // 'all'
  });

  // Group displayed lessons by date / day of week
  const groupedLessons = displayedLessons.reduce((groups, lesson) => {
    const key = `${lesson.день_недели || 'Дата не указана'} (${lesson.дата ? new Date(lesson.дата).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : ''})`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(lesson);
    return groups;
  }, {});

  return (
    <div className="schedule-widget-box" style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #e9ecef', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
      {/* HEADER & SEARCH FORM */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={22} style={{ color: 'var(--primary)' }} />
            Расписание занятий ЭИОС КГУ (API)
          </h3>
          <p style={{ color: '#666', fontSize: '0.88rem', margin: '4px 0 0 0' }}>Прямой запрос к базе ЭИОС КГУ без сторонних виджетов</p>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', gap: '8px', minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              placeholder="Поиск группы (напр. 24-ИСбо-1)..."
              value={groupInput}
              onChange={(e) => {
                setGroupInput(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #dee2e6',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            {showDropdown && filteredGroups.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '12px',
                marginTop: '4px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 50,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {filteredGroups.map(g => (
                  <div 
                    key={g.id}
                    onClick={() => {
                      setGroupInput(g.name);
                      setShowDropdown(false);
                      fetchScheduleForGroup(g.id, g.name);
                    }}
                    style={{
                      padding: '10px 14px',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    <strong>{g.name}</strong> <span style={{ color: '#888', fontSize: '0.8rem' }}>({g.facul}, {g.kurs} курс)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--primary)',
              color: 'white',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Search size={16} /> Найти
          </button>
        </form>
      </div>

      {/* FILTER TABS & ACTIVE GROUP INFO */}
      {selectedGroupName && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '12px 16px', background: '#F8F9FA', borderRadius: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.88rem', color: '#666' }}>Выбранная группа:</span>
            <span style={{ background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontWeight: '800', fontSize: '0.9rem' }}>{selectedGroupName}</span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              onClick={() => setActiveTab('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'all' ? 'white' : 'transparent',
                color: activeTab === 'all' ? 'var(--primary)' : '#666',
                fontWeight: activeTab === 'all' ? '700' : '500',
                cursor: 'pointer',
                boxShadow: activeTab === 'all' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Все занятия
            </button>
            <button 
              onClick={() => setActiveTab('today')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'today' ? 'white' : 'transparent',
                color: activeTab === 'today' ? 'var(--primary)' : '#666',
                fontWeight: activeTab === 'today' ? '700' : '500',
                cursor: 'pointer',
                boxShadow: activeTab === 'today' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Сегодня
            </button>
            <button 
              onClick={() => setActiveTab('tomorrow')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'tomorrow' ? 'white' : 'transparent',
                color: activeTab === 'tomorrow' ? 'var(--primary)' : '#666',
                fontWeight: activeTab === 'tomorrow' ? '700' : '500',
                cursor: 'pointer',
                boxShadow: activeTab === 'tomorrow' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Завтра
            </button>
          </div>
        </div>
      )}

      {/* SCHEDULE LIST DISPLAY */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
          <div className="spinner" style={{ margin: '0 auto 12px auto' }}></div>
          <span>Загрузка расписания с серверов ЭИОС КГУ...</span>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FFF5F5', borderRadius: '16px', color: '#C53030' }}>
          <AlertCircle size={36} style={{ marginBottom: '8px' }} />
          <h4 style={{ margin: '0 0 4px 0' }}>{error}</h4>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>Проверьте правильность написания группы или выберите другой учебный год</p>
        </div>
      ) : Object.keys(groupedLessons).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Object.keys(groupedLessons).map(dayTitle => (
            <div key={dayTitle}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '800', color: 'var(--text)', borderBottom: '2px solid rgba(0,127,255,0.1)', paddingBottom: '6px' }}>
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
                      borderTop: '1px solid #f0f0f0',
                      borderRight: '1px solid #f0f0f0',
                      borderBottom: '1px solid #f0f0f0',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ background: '#F0F4F8', padding: '8px 12px', borderRadius: '10px', textCenter: 'center', minWidth: '90px' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} /> {lesson.начало} - {lesson.конец}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>{lesson.номерЗанятия} пара</span>
                      </div>

                      <div>
                        <h5 style={{ margin: '0 0 4px 0', fontSize: '0.98rem', fontWeight: '800', color: 'var(--text)' }}>
                          {lesson.дисциплина}
                        </h5>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#555', flexWrap: 'wrap' }}>
                          {lesson.преподаватель && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={14} style={{ color: '#888' }} /> {lesson.преподаватель}
                            </span>
                          )}
                          {lesson.аудитория && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', color: 'var(--primary)' }}>
                              <MapPin size={14} /> Аудитория: {lesson.аудитория}
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
          <p style={{ margin: 0, fontSize: '0.88rem' }}>На выбранный день пары отсутствуют или сессия завершена</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleWidget;
