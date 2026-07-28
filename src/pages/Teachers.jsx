import React, { useState } from 'react';
import { Search, Mail, Users as UsersIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Teachers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Read teachers from localStorage (admin-managed)
  const teachersList = (() => {
    try {
      const saved = localStorage.getItem('portal_teachers');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  })();

  const filteredTeachers = teachersList.filter(teacher => 
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered teachers by department
  const groupedTeachers = filteredTeachers.reduce((groups, teacher) => {
    const dept = teacher.department || 'Кафедра не указана';
    if (!groups[dept]) {
      groups[dept] = [];
    }
    groups[dept].push(teacher);
    return groups;
  }, {});

  // Helper to highlight search term
  const highlightText = (text, query) => {
    if (!query || !text) return text || '';
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={index}>{part}</mark> 
            : part
        )}
      </span>
    );
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Преподаватели</h1>
      </div>

      {/* SEARCH BOX */}
      <div className="forum-search-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon-inside" />
          <input 
            type="text" 
            placeholder="Поиск преподавателя по ФИО, предмету..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* DEPARTMENTS CONTAINER */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '35px' }}>
        {teachersList.length === 0 ? (
          <div className="empty-state-card">
            <UsersIcon size={48} strokeWidth={1.5} />
            <h4>Преподаватели ещё не добавлены</h4>
            <p>Администратор может добавить преподавателей через панель управления</p>
          </div>
        ) : Object.keys(groupedTeachers).length > 0 ? (
          Object.keys(groupedTeachers).map(deptName => (
            <div key={deptName}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '15px', color: 'var(--text)', borderBottom: '2px solid rgba(0, 127, 255, 0.1)', paddingBottom: '8px' }}>
                {deptName}
              </h2>
              
              <div className="teachers-grid-display">
                {groupedTeachers[deptName].map(teacher => (
                  <motion.div 
                    key={teacher.id}
                    className="teacher-profile-card"
                    onClick={() => setSelectedTeacher(teacher)}
                    style={{ cursor: 'pointer' }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="teacher-photo-circle">
                      <img 
                        src={teacher.photo && (teacher.photo.startsWith('data:') || teacher.photo.startsWith('http://') || teacher.photo.startsWith('https://'))
                          ? teacher.photo
                          : `/img/teachers/${teacher.photo || 'profile.png'}`} 
                        alt={teacher.name} 
                        onError={(e) => { e.target.src = '/img/profile.png'; }}
                      />
                    </div>
                    <div className="teacher-details-box">
                      <span className="teacher-department-label">ИВИТШ</span>
                      <h3>{highlightText(teacher.name, searchQuery)}</h3>
                      <p>{highlightText(teacher.role, searchQuery)}</p>
                      {teacher.email && (
                        <a href={`mailto:${teacher.email}`} onClick={(e) => e.stopPropagation()} style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', display: 'block', marginTop: '5px', fontWeight: '500' }}>
                          {highlightText(teacher.email, searchQuery)}
                        </a>
                      )}
                    </div>
                    {teacher.email && (
                      <a href={`mailto:${teacher.email}`} onClick={(e) => e.stopPropagation()} className="teacher-contact-btn" title={`Написать ${teacher.name}`}>
                        <Mail size={16} />
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
            Преподаватели не найдены. Попробуйте изменить параметры поиска.
          </div>
        )}
      </div>

      {/* TEACHER CONSULTATION MODAL */}
      <AnimatePresence>
        {selectedTeacher && (
          <div className="modal-overlay" onClick={() => setSelectedTeacher(null)}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()} style={{ width: '450px' }}>
              <button className="close-modal" onClick={() => setSelectedTeacher(null)}>×</button>
              <span className="modal-label" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Консультации</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                <div className="teacher-photo-circle" style={{ width: '60px', height: '60px', margin: 0 }}>
                  <img 
                    src={selectedTeacher.photo && (selectedTeacher.photo.startsWith('data:') || selectedTeacher.photo.startsWith('http://') || selectedTeacher.photo.startsWith('https://'))
                      ? selectedTeacher.photo
                      : `/img/teachers/${selectedTeacher.photo || 'profile.png'}`} 
                    alt={selectedTeacher.name} 
                    onError={(e) => { e.target.src = '/img/profile.png'; }}
                  />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>{selectedTeacher.name}</h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.9rem', color: '#666' }}>{selectedTeacher.role}</p>
                </div>
              </div>

              {selectedTeacher.office && (
                <div className="consultation-info-box">
                  <h5>Аудитория консультаций</h5>
                  <p>Кабинет {selectedTeacher.office}</p>
                </div>
              )}

              {selectedTeacher.hours && (
                <div className="consultation-info-box" style={{ marginTop: '12px' }}>
                  <h5>Время консультаций</h5>
                  <p>{selectedTeacher.hours}</p>
                </div>
              )}

              {selectedTeacher.courses && selectedTeacher.courses.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Читаемые курсы
                  </h5>
                  <div className="teacher-courses-tags">
                    {selectedTeacher.courses.map((course, idx) => (
                      <span key={idx} className="course-tag-pill">{course}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedTeacher.email && (
                <a 
                  href={`mailto:${selectedTeacher.email}`} 
                  className="btn-auth" 
                  style={{ 
                    marginTop: '25px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px', 
                    textDecoration: 'none' 
                  }}
                >
                  <Mail size={16} /> Написать преподавателю
                </a>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Teachers;
