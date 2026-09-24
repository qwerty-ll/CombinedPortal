import React, { useState, useEffect, useRef } from 'react';
import { Search, Mail, MapPin, Phone, ChevronRight, SearchX, Users as UsersIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { contentApi } from '../services/api';
import SectionIcon from '../components/SectionIcon';
import { initialsOf } from '../utils/avatar';

const ICON = { strokeWidth: 1.75 };
const EASE = [0.16, 1, 0.3, 1];

/** Russian plural: plural(3, ['преподаватель', 'преподавателя', 'преподавателей']) */
const plural = (n, [one, few, many]) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};


/** Teacher photo from kosgos.ru with an initials fallback when the image is missing or fails to load. */
const TeacherPhoto = ({ photo, name, size = 'md' }) => {
  const [failed, setFailed] = useState(false);
  const hasPhoto = photo && !photo.includes('nophoto') && !failed;
  return (
    <span className={`cm-avatar cm-avatar-${size}`} aria-hidden="true">
      {hasPhoto ? (
        <img src={photo} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <span className="cm-avatar-initials">{initialsOf(name)}</span>
      )}
    </span>
  );
};

const Teachers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teachersList, setTeachersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const rowTriggerRef = useRef(null);

  useEffect(() => {
    contentApi.getTeachers().then(res => {
      if (Array.isArray(res) && res.length > 0) {
        setTeachersList(res.map(t => ({
          id: t.id,
          name: t.name,
          department: t.department,
          role: t.role,
          email: t.email || '',
          office: t.office || 'Корпус Б',
          hours: t.hours || '',
          courses: t.courses ? t.courses.split(',') : [],
          photo: t.photo_url || 'https://kosgos.ru/images/INSTITUTS/nophoto.jpg'
        })));
      }
    }).catch(e => console.warn('Using static teachers fallback:', e))
      .finally(() => setLoading(false));
  }, []);

  // Teacher dialog: close on Escape, return focus to the row that opened it
  useEffect(() => {
    if (!selectedTeacher) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setSelectedTeacher(null); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      const trigger = rowTriggerRef.current;
      if (trigger && trigger.isConnected) trigger.focus();
    };
  }, [selectedTeacher]);

  const filteredTeachers = teachersList.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (teacher.email && teacher.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group filtered teachers by department
  const groupedTeachers = filteredTeachers.reduce((groups, teacher) => {
    const dept = teacher.department || 'Высшая ИТ-школа КГУ';
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

  const emailsOf = (email) => (email || '').split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="container cm-page">
      <header className="page-header">
        <div className="page-heading">
          <SectionIcon section="teachers" size="lg" />
          <div>
            <h1>Преподаватели</h1>
            <p className="page-subtitle">Преподаватели ИВИТШ КГУ: должности, кабинеты и контакты.</p>
          </div>
        </div>
      </header>

      {/* SEARCH */}
      <div className="teachers-toolbar">
        <div className="cm-search">
          <label htmlFor="teachers-search" className="visually-hidden">Поиск преподавателя</label>
          <Search size={18} {...ICON} className="cm-search-icon" aria-hidden="true" />
          <input
            id="teachers-search"
            type="search"
            className="input"
            placeholder="ФИО, должность или e-mail"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        {!loading && teachersList.length > 0 && (
          <p className="teachers-count" aria-live="polite">
            <span className="tabular">{filteredTeachers.length}</span>{' '}
            {plural(filteredTeachers.length, ['преподаватель', 'преподавателя', 'преподавателей'])}
            {searchQuery ? ' найдено' : ''}
          </p>
        )}
      </div>

      {/* DIRECTORY */}
      {loading ? (
        <ul className="teacher-list" aria-busy="true" aria-label="Загрузка списка преподавателей">
          {[0, 1, 2, 3].map(i => (
            <li key={i} className="teacher-skeleton" aria-hidden="true">
              <span className="skeleton teacher-skel-avatar" />
              <span className="teacher-skel-text">
                <span className="skeleton teacher-skel-name" />
                <span className="skeleton teacher-skel-role" />
              </span>
            </li>
          ))}
        </ul>
      ) : teachersList.length === 0 ? (
        <div className="empty-state">
          <UsersIcon size={32} {...ICON} aria-hidden="true" />
          <h2 className="cm-empty-title">Список преподавателей недоступен</h2>
          <p>Обновите страницу через минуту. Контакты кафедры также есть на сайте kosgos.ru.</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="empty-state">
          <SearchX size={32} {...ICON} aria-hidden="true" />
          <h2 className="cm-empty-title">Никого не нашли</h2>
          <p>По запросу «{searchQuery}» преподавателей нет. Проверьте написание фамилии или поищите по должности.</p>
          <button type="button" className="btn btn-secondary" onClick={() => setSearchQuery('')}>Сбросить поиск</button>
        </div>
      ) : (
        <div className="teachers-groups">
          {Object.keys(groupedTeachers).map((deptName, deptIdx) => (
            <section key={deptName} className="teachers-group" aria-labelledby={`dept-${deptIdx}`}>
              <div className="section-header">
                <h2 id={`dept-${deptIdx}`}>{deptName}</h2>
                {Object.keys(groupedTeachers).length > 1 && (
                  <p className="tabular">{groupedTeachers[deptName].length}</p>
                )}
              </div>

              <ul className="teacher-list">
                {groupedTeachers[deptName].map(teacher => (
                  <li key={teacher.id}>
                    <button
                      type="button"
                      className="teacher-row"
                      onClick={(e) => { rowTriggerRef.current = e.currentTarget; setSelectedTeacher(teacher); }}
                      aria-haspopup="dialog"
                    >
                      <TeacherPhoto photo={teacher.photo} name={teacher.name} />
                      <span className="teacher-main">
                        <span className="teacher-name">{highlightText(teacher.name, searchQuery)}</span>
                        <span className="teacher-role">{highlightText(teacher.role, searchQuery)}</span>
                      </span>
                      <span className="teacher-details">
                        {teacher.office && (
                          <span className="teacher-detail">
                            <MapPin size={14} {...ICON} aria-hidden="true" />
                            <span>{teacher.office}</span>
                          </span>
                        )}
                        {teacher.email && (
                          <span className="teacher-detail teacher-email">
                            <Mail size={14} {...ICON} aria-hidden="true" />
                            <span>{highlightText(teacher.email, searchQuery)}</span>
                          </span>
                        )}
                      </span>
                      <ChevronRight size={18} {...ICON} className="teacher-chevron" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* TEACHER DIALOG */}
      <AnimatePresence>
        {selectedTeacher && (
          <motion.div
            className="modal-overlay"
            onClick={() => setSelectedTeacher(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <motion.div
              className="modal teacher-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="teacher-dialog-name"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.24, ease: EASE }}
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedTeacher(null)}
                aria-label="Закрыть карточку"
              >
                <X size={20} {...ICON} />
              </button>

              <div className="teacher-modal-head">
                <TeacherPhoto photo={selectedTeacher.photo} name={selectedTeacher.name} size="lg" />
                <div>
                  <h2 id="teacher-dialog-name">{selectedTeacher.name}</h2>
                  <p className="teacher-modal-role">{selectedTeacher.role}</p>
                </div>
              </div>

              <dl className="teacher-facts">
                <div className="teacher-fact">
                  <dt>Кафедра</dt>
                  <dd>{selectedTeacher.department}</dd>
                </div>
                {selectedTeacher.office && (
                  <div className="teacher-fact">
                    <dt>Кабинет / корпус</dt>
                    <dd>{selectedTeacher.office}</dd>
                  </div>
                )}
                {selectedTeacher.email && (
                  <div className="teacher-fact">
                    <dt>E-mail</dt>
                    <dd className="teacher-fact-links">
                      {emailsOf(selectedTeacher.email).map(addr => (
                        <a key={addr} href={`mailto:${addr}`}>
                          <Mail size={16} {...ICON} aria-hidden="true" />
                          {addr}
                        </a>
                      ))}
                    </dd>
                  </div>
                )}
                {selectedTeacher.hours && (
                  <div className="teacher-fact">
                    <dt>Контакты / часы</dt>
                    <dd className="teacher-fact-icon">
                      <Phone size={16} {...ICON} aria-hidden="true" />
                      <span className="tabular">{selectedTeacher.hours}</span>
                    </dd>
                  </div>
                )}
              </dl>

              <div className="cm-form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedTeacher(null)}
                  autoFocus
                >
                  Закрыть карточку
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Teachers;
