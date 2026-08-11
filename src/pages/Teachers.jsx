import React, { useState } from 'react';
import { Search, Mail, Users as UsersIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OFFICIAL_IVITSH_TEACHERS = [
  {
    id: 1,
    name: "Киприна Людмила Юрьевна",
    department: "Кафедра Информационных Систем и Технологий (ИСиТ)",
    role: "Заведующая кафедрой, кандидат технических наук, доцент",
    email: "L_kiprina@Kosgos.ru",
    office: "Корпус Б, каб. 214",
    hours: "Пн-Пт 9:00-17:00 (Тел. 63-49-00 доб. 8120)",
    courses: "Введение в направление, Архитектура ИС",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/kiprina_lyu.jpg"
  },
  {
    id: 2,
    name: "Барило Илья Иванович",
    department: "Кафедра Информационных Систем и Технологий (ИСиТ)",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "barilo_ii@kosgos.ru",
    office: "Корпус Б, 3 этаж",
    hours: "По расписанию пар",
    courses: "Базы данных, Веб-технологии",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/barilo_ii.jpg"
  },
  {
    id: 3,
    name: "Лустгартен Юрий Леонидович",
    department: "Кафедра Информационных Систем и Технологий (ИСиТ)",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "lusgarten_yl@kosgos.ru",
    office: "Корпус Б, 3 этаж",
    hours: "По расписанию пар",
    courses: "Математическое моделирование, Исследование операций",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/lusgarten_yl.jpg"
  },
  {
    id: 4,
    name: "Красавина Мария Сергеевна",
    department: "Кафедра Информационных Систем и Технологий (ИСиТ)",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "krasavina_ms@kosgos.ru",
    office: "Корпус Б, 3 этаж",
    hours: "По расписанию пар",
    courses: "Программирование, Алгоритмы и структуры данных",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/krasavina.jpg"
  },
  {
    id: 5,
    name: "Прядкина Нина Олеговна",
    department: "Кафедра Информационных Систем и Технологий (ИСиТ)",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "pryadkina_no@kosgos.ru",
    office: "Корпус Б, 3 этаж",
    hours: "По расписанию пар",
    courses: "Операционные системы, Информационная безопасность",
    photo: "https://kosgos.ru/images/INSTITUTS/IAST/Kaf_IST/PPS/pryadkina_no.jpg"
  },
  {
    id: 6,
    name: "Смирнова Светлана Геннадьевна",
    department: "Кафедра Информационных Систем и Технологий (ИСиТ)",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "smirnova_sg@kosgos.ru",
    office: "Корпус Б, 3 этаж",
    hours: "По расписанию пар",
    courses: "Объектно-ориентированное программирование",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/smirnova_sg.jpg"
  },
  {
    id: 7,
    name: "Демчинова Елена Александровна",
    department: "Кафедра Информационных Систем и Технологий (ИСиТ)",
    role: "Старший преподаватель кафедры",
    email: "demchinova_ea@kosgos.ru",
    office: "Корпус Б, 3 этаж",
    hours: "По расписанию пар",
    courses: "Компьютерная графика, Инженерная графика",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/demchinova.jpg"
  },
  {
    id: 8,
    name: "Дорохова Жанна Викторовна",
    department: "Кафедра Информационных Систем и Технологий (ИСиТ)",
    role: "Старший преподаватель кафедры",
    email: "dorohova_zhv@kosgos.ru",
    office: "Корпус Б, 3 этаж",
    hours: "По расписанию пар",
    courses: "Информационные технологии, Офисные программы",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/dorohova.jpg"
  },
  {
    id: 9,
    name: "Орлов Александр Валерьевич",
    department: "Кафедра Информационных Систем и Технологий (ИСиТ)",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "orlov_av@kosgos.ru",
    office: "Корпус Б, 3 этаж",
    hours: "По расписанию пар",
    courses: "Сети и телекоммуникации, Системное администрирование",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/orlov.jpg"
  },
  {
    id: 10,
    name: "Мозохин Александр Евгеньевич",
    department: "Кафедра Информационных Систем и Технологий (ИСиТ)",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "mozohin_ae@kosgos.ru",
    office: "Корпус Б, 3 этаж",
    hours: "По расписанию пар",
    courses: "Параллельное программирование, Вычислительные системы",
    photo: "https://kosgos.ru/images/INSTITUTS/nophoto.jpg"
  },
  {
    id: 11,
    name: "Логинова Анна Александровна",
    department: "Кафедра Информационных Систем и Технологий (ИСиТ)",
    role: "Ассистент кафедры",
    email: "loginova_aa@kosgos.ru",
    office: "Корпус Б, 3 этаж",
    hours: "По расписанию пар",
    courses: "Практикум по программированию, Лабораторные работы",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/loginova_aa.jpg"
  },
  {
    id: 12,
    name: "Силенок Юрий Викторович",
    department: "Кафедра Информационных Систем и Технологий (ИСиТ)",
    role: "Программист ООО 'Экзактпро', Преподаватель",
    email: "silenok_yv@kosgos.ru",
    office: "Корпус Б, 3 этаж",
    hours: "По расписанию пар",
    courses: "Тестирование ПО, Промышленная разработка",
    photo: "https://kosgos.ru/images/INSTITUTS/IAST/Kaf_IST/PPS/silenok_yv.jpg"
  },
  {
    id: 13,
    name: "Иваницкий Виталий Викторович",
    department: "Кафедра Информационных Систем и Технологий (ИСиТ)",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "ivanickiy_vv@kosgos.ru",
    office: "Корпус Б, 3 этаж",
    hours: "По расписанию пар",
    courses: "Информационные системы, Системный анализ",
    photo: "https://kosgos.ru/images/INSTITUTS/IAST/Kaf_IST/PPS/ivanickiy_vv.jpg"
  },
  {
    id: 14,
    name: "Попова Светлана Валентиновна",
    department: "Кафедра экономики и управления",
    role: "Старший преподаватель кафедры экономики и управления",
    email: "popova_sv@kosgos.ru",
    office: "Корпус Б, 2 этаж",
    hours: "По расписанию пар",
    courses: "Экономика ИТ-отрасли, Менеджмент проектов",
    photo: "https://kosgos.ru/images/INSTITUTS/IAST/Kaf_IST/PPS/Popova_SV.jpg"
  },
  {
    id: 15,
    name: "Денисов Артем Руфимович",
    department: "Кафедра Информатики и Вычислительной Техники (ИиВТ)",
    role: "Доцент кафедры, доктор технических наук, доцент",
    email: "denisov_ar@kosgos.ru",
    office: "Корпус Б, 3 этаж",
    hours: "По расписанию пар",
    courses: "Искусственный интеллект, Нейронные сети",
    photo: "https://kosgos.ru/images/INSTITUTS/IAST/Kaf_IiVT/denisov.jpg"
  },
  {
    id: 16,
    name: "Дружинина Анна Григорьевна",
    department: "Кафедра Информационных Систем и Технологий (ИСиТ)",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "druzhinina_ag@kosgos.ru",
    office: "Корпус Б, 3 этаж",
    hours: "По расписанию пар",
    courses: "Проектирование ИС, Базы данных",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/druzhinina.jpg"
  },
  {
    id: 17,
    name: "Кириллова Екатерина Сергеевна",
    department: "Кафедра Информационных Систем и Технологий (ИСиТ)",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "kirillova_es@kosgos.ru",
    office: "Корпус Б, 3 этаж",
    hours: "По расписанию пар",
    courses: "Математическая логика, Дискретная математика",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/kirillova.jpg"
  },
  {
    id: 18,
    name: "Чувиляева Александра Сергеевна",
    department: "Кафедра Информационных Систем и Технологий (ИСиТ)",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "chuvilyaeva_as@kosgos.ru",
    office: "Корпус Б, 3 этаж",
    hours: "По расписанию пар",
    courses: "Разработка мобильных приложений, Веб-программирование",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/chuvilyaeva.jpg"
  }
];

const Teachers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Read teachers from localStorage (fallback to official list)
  const teachersList = (() => {
    try {
      const saved = localStorage.getItem('portal_teachers');
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.length > 0 ? parsed : OFFICIAL_IVITSH_TEACHERS;
    } catch { return OFFICIAL_IVITSH_TEACHERS; }
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
        <h1>Преподаватели ИВИТШ КГУ</h1>
      </div>

      {/* SEARCH BOX */}
      {teachersList.length > 0 && (
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
      )}

      {/* DEPARTMENTS CONTAINER */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '35px' }}>
        {teachersList.length === 0 ? (
          <div className="empty-state-card" style={{ background: 'white', borderRadius: '24px', padding: '50px 20px', textAlign: 'center', border: '1px solid #e9ecef' }}>
            <UsersIcon size={48} strokeWidth={1.5} style={{ color: '#aaa', marginBottom: '12px' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: '800' }}>Преподаватели ещё не добавлены</h4>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#777' }}>Администратор может добавить преподавателей через панель управления</p>
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
                    <div className="teacher-photo-circle" style={{ background: '#E0F2FE', color: '#0369A1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {teacher.photo && teacher.photo !== 'profile.png' ? (
                        <img 
                          src={teacher.photo.startsWith('data:') || teacher.photo.startsWith('http://') || teacher.photo.startsWith('https://')
                            ? teacher.photo
                            : `/img/teachers/${teacher.photo}`} 
                          alt={teacher.name} 
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <UserIcon size={24} />
                      )}
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
              <button className="close-modal" onClick={() => setSelectedTeacher(null)}>✕</button>
              <span className="modal-label" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Консультации</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                <div className="teacher-photo-circle" style={{ width: '60px', height: '60px', margin: 0, background: '#E0F2FE', color: '#0369A1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {selectedTeacher.photo && selectedTeacher.photo !== 'profile.png' ? (
                    <img 
                      src={selectedTeacher.photo.startsWith('data:') || selectedTeacher.photo.startsWith('http://') || selectedTeacher.photo.startsWith('https://')
                        ? selectedTeacher.photo
                        : `/img/teachers/${selectedTeacher.photo}`} 
                      alt={selectedTeacher.name} 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <UserIcon size={30} />
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>{selectedTeacher.name}</h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.9rem', color: '#666' }}>{selectedTeacher.role}</p>
                </div>
              </div>

              <div style={{ marginTop: '20px', background: '#F8F9FA', padding: '15px', borderRadius: '12px', fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Кабинет:</strong> {selectedTeacher.office || 'Б-209'}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Часы приёма:</strong> {selectedTeacher.hours || 'Пн-Пт 9:00 - 17:00'}
                </div>
                {selectedTeacher.courses && (
                  <div>
                    <strong>Дисциплины:</strong> {selectedTeacher.courses}
                  </div>
                )}
              </div>

              {selectedTeacher.email && (
                <a 
                  href={`mailto:${selectedTeacher.email}`} 
                  className="btn-auth" 
                  style={{ display: 'block', textDecoration: 'none', textAlign: 'center', marginTop: '20px' }}
                >
                  Написать на email ✉️
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
