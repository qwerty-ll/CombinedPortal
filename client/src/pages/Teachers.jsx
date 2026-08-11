import React, { useState } from 'react';
import { Search, Mail, Users as UsersIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OFFICIAL_IVITSH_TEACHERS = [
  {
    id: 1,
    name: "Киприна Людмила Юрьевна",
    department: "Высшая ИТ-школа КГУ",
    role: "Заведующая кафедрой, кандидат технических наук, доцент",
    email: "L_kiprina@Kosgos.ru",
    office: "г. Кострома, ул. Ивановская, 24А, каб.214",
    hours: "Тел. 63-49-00 (доб. 8120)",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/kiprina_lyu.jpg"
  },
  {
    id: 2,
    name: "Барило Илья Иванович",
    department: "Высшая ИТ-школа КГУ",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/barilo_ii.jpg"
  },
  {
    id: 3,
    name: "Лустгартен Юрий Леонидович",
    department: "Высшая ИТ-школа КГУ",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/lusgarten_yl.jpg"
  },
  {
    id: 4,
    name: "Красавина Мария Сергеевна",
    department: "Высшая ИТ-школа КГУ",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/krasavina.jpg"
  },
  {
    id: 5,
    name: "Прядкина Нина Олеговна",
    department: "Высшая ИТ-школа КГУ",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/IAST/Kaf_IST/PPS/pryadkina_no.jpg"
  },
  {
    id: 6,
    name: "Смирнова Светлана Геннадьевна",
    department: "Высшая ИТ-школа КГУ",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/smirnova_sg.jpg"
  },
  {
    id: 7,
    name: "Демчинова Елена Александровна",
    department: "Высшая ИТ-школа КГУ",
    role: "Старший преподаватель кафедры",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/demchinova.jpg"
  },
  {
    id: 8,
    name: "Дорохова Жанна Викторовна",
    department: "Высшая ИТ-школа КГУ",
    role: "Старший преподаватель кафедры",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/dorohova.jpg"
  },
  {
    id: 9,
    name: "Орлов Александр Валерьевич",
    department: "Высшая ИТ-школа КГУ",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/orlov.jpg"
  },
  {
    id: 10,
    name: "Мозохин Александр Евгеньевич",
    department: "Высшая ИТ-школа КГУ",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/nophoto.jpg"
  },
  {
    id: 11,
    name: "Логинова Анна Александровна",
    department: "Высшая ИТ-школа КГУ",
    role: "Ассистент кафедры",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/loginova_aa.jpg"
  },
  {
    id: 12,
    name: "Силенок Юрий Викторович",
    department: "Высшая ИТ-школа КГУ",
    role: "Программист ООО 'Экзактпро'",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/IAST/Kaf_IST/PPS/silenok_yv.jpg"
  },
  {
    id: 13,
    name: "Иваницкий Виталий Викторович",
    department: "Высшая ИТ-школа КГУ",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/IAST/Kaf_IST/PPS/ivanickiy_vv.jpg"
  },
  {
    id: 14,
    name: "Попова Светлана Валентиновна",
    department: "Высшая ИТ-школа КГУ",
    role: "Старший преподаватель кафедры экономики и управления",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/IAST/Kaf_IST/PPS/Popova_SV.jpg"
  },
  {
    id: 15,
    name: "Денисов Артем Руфимович",
    department: "Высшая ИТ-школа КГУ",
    role: "Доцент кафедры, доктор технических наук, доцент",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/IAST/Kaf_IiVT/denisov.jpg"
  },
  {
    id: 16,
    name: "Дружинина Анна Григорьевна",
    department: "Высшая ИТ-школа КГУ",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/druzhinina.jpg"
  },
  {
    id: 17,
    name: "Кириллова Екатерина Сергеевна",
    department: "Высшая ИТ-школа КГУ",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/kirillova.jpg"
  },
  {
    id: 18,
    name: "Чувиляева Александра Сергеевна",
    department: "Высшая ИТ-школа КГУ",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/chuvilyaeva.jpg"
  }
];

const Teachers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const teachersList = OFFICIAL_IVITSH_TEACHERS;

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

  return (
    <div className="container">
      <div className="page-header">
        <h1>Преподаватели ИВИТШ КГУ</h1>
      </div>

      {/* SEARCH BOX */}
      <div className="forum-search-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon-inside" />
          <input 
            type="text" 
            placeholder="Поиск преподавателя по ФИО..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* DEPARTMENTS CONTAINER */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '35px' }}>
        {Object.keys(groupedTeachers).map(deptName => (
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
                    {teacher.photo ? (
                      <img 
                        src={teacher.photo} 
                        alt={teacher.name}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <UsersIcon size={32} />
                    )}
                  </div>
                  <div className="teacher-card-info">
                    <h4>{highlightText(teacher.name, searchQuery)}</h4>
                    <p className="teacher-role-text">{highlightText(teacher.role, searchQuery)}</p>
                    {teacher.email && (
                      <span className="teacher-email-text">
                        <Mail size={13} style={{ display: 'inline', marginRight: '4px' }} />
                        {highlightText(teacher.email, searchQuery)}
                      </span>
                    )}
                    {teacher.office && (
                      <span style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px', display: 'block' }}>
                        📍 {teacher.office}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* STUNNING TEACHER MODAL */}
      <AnimatePresence>
        {selectedTeacher && (
          <div 
            className="modal-overlay" 
            onClick={() => setSelectedTeacher(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{
                background: '#FFFFFF',
                borderRadius: '28px',
                padding: '32px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                color: '#1E293B',
                border: '1px solid rgba(226, 232, 240, 0.8)'
              }}
            >
              {/* Close button */}
              <button 
                onClick={() => setSelectedTeacher(null)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#F1F5F9',
                  color: '#64748B',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                ✕
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
                <img 
                  src={selectedTeacher.photo} 
                  alt={selectedTeacher.name} 
                  style={{ 
                    width: '110px', 
                    height: '110px', 
                    borderRadius: '50%', 
                    objectFit: 'cover',
                    boxShadow: '0 10px 25px rgba(0,127,255,0.25)',
                    border: '4px solid #007FFF',
                    marginBottom: '16px'
                  }}
                />
                <span style={{ 
                  background: '#E0F2FE', 
                  color: '#0284C7', 
                  padding: '4px 14px', 
                  borderRadius: '20px', 
                  fontSize: '0.8rem', 
                  fontWeight: '700',
                  display: 'inline-block',
                  marginBottom: '8px'
                }}>
                  {selectedTeacher.department || 'Высшая ИТ-школа КГУ'}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', lineHeight: '1.3' }}>
                  {selectedTeacher.name}
                </h3>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Должность и степень</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: '600', color: '#1E293B', lineHeight: '1.4' }}>
                    {selectedTeacher.role}
                  </p>
                </div>

                {selectedTeacher.office && (
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Местоположение</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: '600', color: '#1E293B' }}>
                      📍 {selectedTeacher.office}
                    </p>
                  </div>
                )}

                {selectedTeacher.hours && (
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Контакты</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: '600', color: '#1E293B' }}>
                      📞 {selectedTeacher.hours}
                    </p>
                  </div>
                )}

                {selectedTeacher.email && (
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Электронная почта</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: '600', color: '#0284C7' }}>
                      ✉️ {selectedTeacher.email}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Teachers;
