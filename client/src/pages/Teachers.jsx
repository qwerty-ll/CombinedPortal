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
    name: "Денисов Артем Руфимович",
    department: "Высшая ИТ-школа КГУ",
    role: "Доцент кафедры, доктор технических наук, доцент",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/IAST/Kaf_IiVT/denisov.jpg"
  },
  {
    id: 15,
    name: "Дружинина Анна Григорьевна",
    department: "Высшая ИТ-школа КГУ",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/druzhinina.jpg"
  },
  {
    id: 16,
    name: "Кириллова Екатерина Сергеевна",
    department: "Высшая ИТ-школа КГУ",
    role: "Доцент кафедры, кандидат технических наук, доцент",
    email: "",
    office: "Корпус Б",
    photo: "https://kosgos.ru/images/INSTITUTS/Vysshaya_IT-shkola/kafedry/IST/kirillova.jpg"
  },
  {
    id: 17,
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
                  <div className="teacher-photo-circle" style={{ background: '#E0F2FE', color: '#007FFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {teacher.photo && !teacher.photo.includes('nophoto') ? (
                      <img 
                        src={teacher.photo} 
                        alt={teacher.name}
                        onError={(e) => { 
                          e.target.style.display = 'none';
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <UsersIcon size={32} color="#007FFF" />
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

      {/* TEACHER MODAL */}
      <AnimatePresence>
        {selectedTeacher && (
          <div className="modal-overlay" onClick={() => setSelectedTeacher(null)}>
            <motion.div 
              className="modal-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '520px', padding: '30px' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div className="teacher-photo-circle" style={{ width: '100px', height: '100px', margin: '0 auto 15px auto', background: '#E0F2FE', color: '#007FFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {selectedTeacher.photo && !selectedTeacher.photo.includes('nophoto') ? (
                    <img 
                      src={selectedTeacher.photo} 
                      alt={selectedTeacher.name} 
                      onError={(e) => { e.target.style.display = 'none'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <UsersIcon size={48} color="#007FFF" />
                  )}
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', color: 'var(--text)' }}>{selectedTeacher.name}</h3>
                <p style={{ margin: 0, color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>{selectedTeacher.role}</p>
              </div>

              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
                <div><strong>Кафедра:</strong> {selectedTeacher.department}</div>
                {selectedTeacher.office && <div><strong>Кабинет / Корпус:</strong> {selectedTeacher.office}</div>}
                {selectedTeacher.email && <div><strong>E-mail:</strong> <a href={`mailto:${selectedTeacher.email}`}>{selectedTeacher.email}</a></div>}
                {selectedTeacher.hours && <div><strong>Контакты / Часы:</strong> {selectedTeacher.hours}</div>}
              </div>

              <button 
                className="btn-primary" 
                style={{ width: '100%', marginTop: '20px' }}
                onClick={() => setSelectedTeacher(null)}
              >
                Закрыть
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Teachers;
