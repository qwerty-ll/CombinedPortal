import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import {
  BellRing, Users, HelpCircle, MessageSquare, Plus, Pencil, Trash2, X, Save, Shield, UserCheck, BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminApi, subjectsApi, teachersApi } from '../services/api';

// --- Data access helpers (future: replace with API calls) ---
const getFromStorage = (key, fallback = []) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch { return fallback; }
};
const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const AdminPanel = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('announcements');
  const [usersList, setUsersList] = useState([]);

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    adminApi.getUsers().then(res => {
      if (Array.isArray(res)) setUsersList(res);
    }).catch(e => console.warn('Failed to load users for admin:', e));
  }, [isAdmin, navigate]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const updated = await adminApi.updateUserRole(userId, newRole);
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: updated.role } : u));
      toast.show(`Роль пользователя обновлена на ${newRole}`, 'success');
    } catch (err) {
      toast.show(err.message || 'Ошибка изменения роли', 'warning');
    }
  };

  // --- ANNOUNCEMENTS ---
  const [announcements, setAnnouncements] = useState(() => getFromStorage('portal_announcements'));
  const [annForm, setAnnForm] = useState({ title: '', text: '' });
  const [editingAnnId, setEditingAnnId] = useState(null);

  const saveAnnouncements = (data) => {
    setAnnouncements(data);
    saveToStorage('portal_announcements', data);
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!annForm.title.trim() || !annForm.text.trim()) return;

    try {
      const created = await adminApi.createAnnouncement({
        title: annForm.title.trim(),
        content: annForm.text.trim(),
        is_important: false
      });
      const newAnn = {
        id: created.id,
        title: created.title,
        text: created.content,
        time: new Date(created.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
        read: false
      };
      saveAnnouncements([newAnn, ...announcements]);
      toast.show('Объявление создано и сохранено на сервере', 'success');
    } catch (err) {
      const newAnn = { id: Date.now(), title: annForm.title.trim(), text: annForm.text.trim() };
      saveAnnouncements([newAnn, ...announcements]);
      toast.show('Объявление создано', 'success');
    }
    setAnnForm({ title: '', text: '' });
  };

  const handleEditAnnouncement = (ann) => {
    setAnnForm({ title: ann.title, text: ann.text });
    setEditingAnnId(ann.id);
  };

  const handleDeleteAnnouncement = (id) => {
    if (window.confirm('Удалить объявление?')) {
      saveAnnouncements(announcements.filter(a => a.id !== id));
      toast.show('Объявление удалено', 'info');
    }
  };

  // --- TEACHERS ---
  const [teachers, setTeachers] = useState([]);
  const [teacherForm, setTeacherForm] = useState({
    name: '', department: '', role: '', email: '', office: '', hours: '', courses: '', photo: ''
  });
  const [editingTeacherId, setEditingTeacherId] = useState(null);

  // --- SUBJECTS ---
  const [subjects, setSubjects] = useState([]);
  const [subjectForm, setSubjectForm] = useState({
    subject_code: '', name: '', short_name: '', emoji: '📚', color: '#007AFF',
    difficulty: 3, hours: 108, credits: 3, semester: 1, control_type: 'Зачет',
    extra_type: '', description: '', mascot_hack: '', senior_advice: ''
  });
  const [editingSubjectId, setEditingSubjectId] = useState(null);

  useEffect(() => {
    teachersApi.getTeachers().then(res => {
      if (Array.isArray(res) && res.length > 0) setTeachers(res);
    }).catch(e => console.warn('Failed to load DB teachers:', e));

    subjectsApi.getSubjects().then(res => {
      if (Array.isArray(res)) setSubjects(res);
    }).catch(e => console.warn('Failed to load DB subjects:', e));
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!file.type || !allowedMimeTypes.includes(file.type.toLowerCase())) {
      toast.show('Ошибка формата! Разрешены только форматы PNG, JPEG, JPG и WebP', 'warning');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.show('Размер файла не должен превышать 2МБ!', 'warning');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTeacherForm(prev => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!teacherForm.name.trim()) return;

    const teacherData = {
      name: teacherForm.name.trim(),
      department: teacherForm.department.trim() || 'Высшая ИТ-школа КГУ',
      role: teacherForm.role.trim() || 'Преподаватель',
      email: teacherForm.email.trim(),
      office: teacherForm.office.trim() || 'Корпус Б',
      hours: teacherForm.hours.trim(),
      courses: teacherForm.courses,
      photo_url: teacherForm.photo || 'https://kosgos.ru/images/INSTITUTS/nophoto.jpg'
    };

    try {
      const created = await teachersApi.createTeacher(teacherData);
      setTeachers(prev => [created, ...prev.filter(t => t.id !== created.id)]);
      toast.show('Преподаватель сохранён на сервере', 'success');
      setTeacherForm({ name: '', department: '', role: '', email: '', office: '', hours: '', courses: '', photo: '' });
      setEditingTeacherId(null);
    } catch (err) {
      const newTeacher = { id: Date.now(), ...teacherData, photo: teacherData.photo_url };
      setTeachers([newTeacher, ...teachers]);
      toast.show('Сохранено локально', 'info');
    }
  };

  const handleEditTeacher = (t) => {
    setTeacherForm({
      name: t.name,
      department: t.department,
      role: t.role,
      email: t.email || '',
      office: t.office || '',
      hours: t.hours || '',
      courses: t.courses || '',
      photo: t.photo_url || t.photo || ''
    });
    setEditingTeacherId(t.id);
  };

  const handleDeleteTeacher = async (id) => {
    if (window.confirm('Удалить преподавателя?')) {
      try {
        await teachersApi.deleteTeacher(id);
      } catch (err) {}
      setTeachers(teachers.filter(t => t.id !== id));
      toast.show('Преподаватель удалён', 'info');
    }
  };

  // --- SUBJECTS HANDLERS ---
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!subjectForm.name.trim() || !subjectForm.subject_code.trim()) return;

    try {
      if (editingSubjectId) {
        const updated = await subjectsApi.updateSubject(editingSubjectId, subjectForm);
        setSubjects(prev => prev.map(s => s.id === editingSubjectId ? updated : s));
        toast.show('Предмет обновлён на сервере', 'success');
        setEditingSubjectId(null);
      } else {
        const created = await subjectsApi.createSubject(subjectForm);
        setSubjects(prev => [...prev, created]);
        toast.show('Предмет создан в базе данных', 'success');
      }
      setSubjectForm({
        subject_code: '', name: '', short_name: '', emoji: '📚', color: '#007AFF',
        difficulty: 3, hours: 108, credits: 3, semester: 1, control_type: 'Зачет',
        extra_type: '', description: '', mascot_hack: '', senior_advice: ''
      });
    } catch (err) {
      toast.show(err.message || 'Ошибка сохранения предмета', 'warning');
    }
  };

  const handleEditSubject = (s) => {
    setSubjectForm({
      subject_code: s.subject_code,
      name: s.name,
      short_name: s.short_name,
      emoji: s.emoji || '📚',
      color: s.color || '#007AFF',
      difficulty: s.difficulty || 3,
      hours: s.hours || 108,
      credits: s.credits || 3,
      semester: s.semester || 1,
      control_type: s.control_type || 'Зачет',
      extra_type: s.extra_type || '',
      description: s.description || '',
      mascot_hack: s.mascot_hack || '',
      senior_advice: s.senior_advice || ''
    });
    setEditingSubjectId(s.id);
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm('Удалить дисциплину из каталога?')) {
      try {
        await subjectsApi.deleteSubject(id);
        setSubjects(prev => prev.filter(s => s.id !== id));
        toast.show('Предмет удалён из базы данных', 'info');
      } catch (err) {
        toast.show(err.message || 'Ошибка удаления', 'warning');
      }
    }
  };

  // --- FAQ ---
  const [faqItems, setFaqItems] = useState(() => getFromStorage('portal_faq'));
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
  const [editingFaqId, setEditingFaqId] = useState(null);

  const saveFaq = (data) => {
    setFaqItems(data);
    saveToStorage('portal_faq', data);
  };

  const handleAddFaq = (e) => {
    e.preventDefault();
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;

    if (editingFaqId) {
      const updated = faqItems.map(f =>
        f.id === editingFaqId ? { ...f, question: faqForm.question.trim(), answer: faqForm.answer.trim() } : f
      );
      saveFaq(updated);
      toast.show('FAQ обновлён', 'success');
      setEditingFaqId(null);
    } else {
      const newFaq = {
        id: Date.now(),
        question: faqForm.question.trim(),
        answer: faqForm.answer.trim()
      };
      saveFaq([...faqItems, newFaq]);
      toast.show('Вопрос добавлен в FAQ', 'success');
    }
    setFaqForm({ question: '', answer: '' });
  };

  const handleEditFaq = (f) => {
    setFaqForm({ question: f.question, answer: f.answer });
    setEditingFaqId(f.id);
  };

  const handleDeleteFaq = (id) => {
    if (window.confirm('Удалить вопрос из FAQ?')) {
      saveFaq(faqItems.filter(f => f.id !== id));
      toast.show('Вопрос удалён из FAQ', 'info');
    }
  };

  // --- FORUM MODERATION ---
  const [forumQuestions, setForumQuestions] = useState(() => getFromStorage('forum_questions'));

  const handleDeleteForumQuestion = (id) => {
    if (window.confirm('Удалить тему с форума?')) {
      const updated = forumQuestions.filter(q => q.id !== id);
      setForumQuestions(updated);
      saveToStorage('forum_questions', updated);
      toast.show('Тема удалена с форума', 'info');
    }
  };

  if (!isAdmin) return null;

  const tabs = [
    { id: 'announcements', label: 'Объявления', icon: <BellRing size={18} />, count: announcements.length },
    { id: 'teachers', label: 'Преподаватели', icon: <Users size={18} />, count: teachers.length },
    { id: 'subjects', label: 'Предметы / Дисциплины', icon: <BookOpen size={18} />, count: subjects.length },
    { id: 'faq', label: 'FAQ', icon: <HelpCircle size={18} />, count: faqItems.length },
    { id: 'forum', label: 'Модерация форума', icon: <MessageSquare size={18} />, count: forumQuestions.length },
    { id: 'users', label: 'Пользователи и Роли', icon: <UserCheck size={18} />, count: usersList.length },
  ];

  return (
    <div className="container">
      <div className="page-header">
        <h1><Shield size={28} style={{ verticalAlign: 'text-bottom', marginRight: '10px' }} />Панель управления</h1>
      </div>

      {/* TABS */}
      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span className="admin-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'announcements' && (
          <motion.div key="ann" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="admin-section-card">
              <h3>{editingAnnId ? 'Редактировать объявление' : 'Новое объявление'}</h3>
              <form onSubmit={handleAddAnnouncement} className="admin-form">
                <input
                  type="text"
                  placeholder="Заголовок объявления..."
                  value={annForm.title}
                  onChange={e => setAnnForm({ ...annForm, title: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Текст объявления..."
                  value={annForm.text}
                  onChange={e => setAnnForm({ ...annForm, text: e.target.value })}
                  required
                  rows={3}
                />
                <div className="admin-form-actions">
                  <button type="submit" className="btn-admin-save">
                    <Save size={16} /> {editingAnnId ? 'Сохранить' : 'Создать'}
                  </button>
                  {editingAnnId && (
                    <button type="button" className="btn-admin-cancel" onClick={() => { setEditingAnnId(null); setAnnForm({ title: '', text: '' }); }}>
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="admin-items-list">
              {announcements.length === 0 ? (
                <div className="admin-empty">Объявлений пока нет. Создайте первое!</div>
              ) : announcements.map(ann => (
                <div key={ann.id} className="admin-item-row">
                  <div className="admin-item-info">
                    <h4>{ann.title}</h4>
                    <p>{ann.text.length > 100 ? ann.text.slice(0, 100) + '...' : ann.text}</p>
                    <span className="admin-item-date">{ann.time}</span>
                  </div>
                  <div className="admin-item-actions">
                    <button onClick={() => handleEditAnnouncement(ann)} title="Редактировать"><Pencil size={16} /></button>
                    <button onClick={() => handleDeleteAnnouncement(ann.id)} title="Удалить" className="danger"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TEACHERS TAB */}
        {activeTab === 'teachers' && (
          <motion.div key="teach" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="admin-section-card">
              <h3>{editingTeacherId ? 'Редактировать преподавателя' : 'Добавить преподавателя'}</h3>
              <form onSubmit={handleAddTeacher} className="admin-form">
                <div className="admin-form-grid">
                  <input type="text" placeholder="ФИО *" value={teacherForm.name} onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })} required />
                  <input type="text" placeholder="Кафедра" value={teacherForm.department} onChange={e => setTeacherForm({ ...teacherForm, department: e.target.value })} />
                  <input type="text" placeholder="Должность (Доцент, Профессор...)" value={teacherForm.role} onChange={e => setTeacherForm({ ...teacherForm, role: e.target.value })} />
                  <input type="email" placeholder="Email" value={teacherForm.email} onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })} />
                  <input type="text" placeholder="Кабинет (А-304)" value={teacherForm.office} onChange={e => setTeacherForm({ ...teacherForm, office: e.target.value })} />
                  <input type="text" placeholder="Часы приёма (Вт 12:00-14:00)" value={teacherForm.hours} onChange={e => setTeacherForm({ ...teacherForm, hours: e.target.value })} />
                </div>
                <input type="text" placeholder="Курсы (через запятую: Базы данных, SQL, ООП)" value={teacherForm.courses} onChange={e => setTeacherForm({ ...teacherForm, courses: e.target.value })} />
                
                {/* Photo upload field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)' }}>
                    Фотография преподавателя (опционально)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      style={{ 
                        fontSize: '0.85rem', 
                        color: '#666',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        background: '#fcfcfc',
                        cursor: 'pointer'
                      }} 
                    />
                    {teacherForm.photo && (
                      <div className="teacher-photo-circle" style={{ width: '45px', height: '45px', margin: 0, border: '2px solid var(--primary)', overflow: 'hidden', borderRadius: '50%', flexShrink: 0 }}>
                        <img 
                          src={teacherForm.photo.startsWith('data:') || teacherForm.photo.startsWith('http') 
                            ? teacherForm.photo 
                            : `/img/teachers/${teacherForm.photo}`} 
                          alt="Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="admin-form-actions">
                  <button type="submit" className="btn-admin-save">
                    <Save size={16} /> {editingTeacherId ? 'Сохранить' : 'Добавить'}
                  </button>
                  {editingTeacherId && (
                    <button type="button" className="btn-admin-cancel" onClick={() => { setEditingTeacherId(null); setTeacherForm({ name: '', department: '', role: '', email: '', office: '', hours: '', courses: '', photo: '' }); }}>
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="admin-items-list">
              {teachers.length === 0 ? (
                <div className="admin-empty">Преподаватели ещё не добавлены.</div>
              ) : teachers.map(t => (
                <div key={t.id} className="admin-item-row">
                  <div className="admin-item-info">
                    <h4>{t.name}</h4>
                    <p>{t.role} • {t.department}</p>
                    <span className="admin-item-date">{t.email}</span>
                  </div>
                  <div className="admin-item-actions">
                    <button onClick={() => handleEditTeacher(t)} title="Редактировать"><Pencil size={16} /></button>
                    <button onClick={() => handleDeleteTeacher(t.id)} title="Удалить" className="danger"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* SUBJECTS TAB */}
        {activeTab === 'subjects' && (
          <motion.div key="subjects" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="admin-section-card">
              <h3>{editingSubjectId ? 'Редактировать дисциплину' : 'Добавить новую дисциплину'}</h3>
              <form onSubmit={handleAddSubject} className="admin-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '10px' }}>
                  <input type="text" placeholder="Код (напр. s1-algo) *" value={subjectForm.subject_code} onChange={e => setSubjectForm({ ...subjectForm, subject_code: e.target.value })} required />
                  <input type="text" placeholder="Полное название *" value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} required />
                  <input type="text" placeholder="Сокращение *" value={subjectForm.short_name} onChange={e => setSubjectForm({ ...subjectForm, short_name: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  <input type="number" placeholder="Семестр *" min={1} max={8} value={subjectForm.semester} onChange={e => setSubjectForm({ ...subjectForm, semester: Number(e.target.value) })} required />
                  <input type="number" placeholder="Часы *" value={subjectForm.hours} onChange={e => setSubjectForm({ ...subjectForm, hours: Number(e.target.value) })} required />
                  <input type="number" placeholder="Зач. ед. *" value={subjectForm.credits} onChange={e => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })} required />
                  <select value={subjectForm.control_type} onChange={e => setSubjectForm({ ...subjectForm, control_type: e.target.value })}>
                    <option value="Зачет">Зачет</option>
                    <option value="Экзамен">Экзамен</option>
                    <option value="Практика">Практика</option>
                  </select>
                  <input type="text" placeholder="Эмодзи" value={subjectForm.emoji} onChange={e => setSubjectForm({ ...subjectForm, emoji: e.target.value })} />
                </div>
                <textarea placeholder="Описание предмета *" value={subjectForm.description} onChange={e => setSubjectForm({ ...subjectForm, description: e.target.value })} required rows={2} style={{ marginTop: '10px' }} />
                <textarea placeholder="Лайфхак ВИТШика (Кота-маскота)..." value={subjectForm.mascot_hack} onChange={e => setSubjectForm({ ...subjectForm, mascot_hack: e.target.value })} rows={2} style={{ marginTop: '10px' }} />
                <textarea placeholder="Совет старшекурсника..." value={subjectForm.senior_advice} onChange={e => setSubjectForm({ ...subjectForm, senior_advice: e.target.value })} rows={2} style={{ marginTop: '10px' }} />

                <div className="admin-form-actions" style={{ marginTop: '10px' }}>
                  <button type="submit" className="btn-admin-save">
                    <Save size={16} /> {editingSubjectId ? 'Сохранить' : 'Добавить предмет'}
                  </button>
                  {editingSubjectId && (
                    <button type="button" className="btn-admin-cancel" onClick={() => { setEditingSubjectId(null); setSubjectForm({ subject_code: '', name: '', short_name: '', emoji: '📚', color: '#007AFF', difficulty: 3, hours: 108, credits: 3, semester: 1, control_type: 'Зачет', extra_type: '', description: '', mascot_hack: '', senior_advice: '' }); }}>
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="admin-items-list">
              {subjects.length === 0 ? (
                <div className="admin-empty">Предметы не найдены. Нажмите «Добавить», чтобы занести первый предмет в базу.</div>
              ) : subjects.map(s => (
                <div key={s.id} className="admin-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px 16px', borderRadius: '12px', marginBottom: '8px', border: '1px solid #eee' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1rem' }}>{s.emoji} {s.name} ({s.short_name})</div>
                    <div style={{ fontSize: '0.82rem', color: '#666' }}>{s.semester}-й семестр | {s.hours}ч | {s.credits} з.е. | {s.control_type}</div>
                  </div>
                  <div className="admin-item-actions">
                    <button onClick={() => handleEditSubject(s)} title="Редактировать"><Pencil size={16} /></button>
                    <button onClick={() => handleDeleteSubject(s.id)} title="Удалить" className="danger"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* FAQ TAB */}
        {activeTab === 'faq' && (
          <motion.div key="faq" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="admin-section-card">
              <h3>{editingFaqId ? 'Редактировать FAQ' : 'Добавить вопрос в FAQ'}</h3>
              <form onSubmit={handleAddFaq} className="admin-form">
                <input type="text" placeholder="Вопрос *" value={faqForm.question} onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} required />
                <textarea placeholder="Ответ (поддерживается HTML) *" value={faqForm.answer} onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })} required rows={4} />
                <div className="admin-form-actions">
                  <button type="submit" className="btn-admin-save">
                    <Save size={16} /> {editingFaqId ? 'Сохранить' : 'Добавить'}
                  </button>
                  {editingFaqId && (
                    <button type="button" className="btn-admin-cancel" onClick={() => { setEditingFaqId(null); setFaqForm({ question: '', answer: '' }); }}>
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="admin-items-list">
              {faqItems.length === 0 ? (
                <div className="admin-empty">FAQ пуст. Добавьте первый вопрос!</div>
              ) : faqItems.map(f => (
                <div key={f.id} className="admin-item-row">
                  <div className="admin-item-info">
                    <h4>{f.question}</h4>
                    <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(f.answer.length > 120 ? f.answer.slice(0, 120) + '...' : f.answer) }} />
                  </div>
                  <div className="admin-item-actions">
                    <button onClick={() => handleEditFaq(f)} title="Редактировать"><Pencil size={16} /></button>
                    <button onClick={() => handleDeleteFaq(f.id)} title="Удалить" className="danger"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* FORUM MODERATION TAB */}
        {activeTab === 'forum' && (
          <motion.div key="forum" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="admin-section-card" style={{ background: 'rgba(231, 76, 60, 0.03)', borderColor: 'rgba(231, 76, 60, 0.15)' }}>
              <h3 style={{ color: '#E74C3C' }}>Модерация форума</h3>
              <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
                Здесь вы можете удалять неприемлемые темы. Все действия необратимы.
              </p>
            </div>

            <div className="admin-items-list">
              {forumQuestions.length === 0 ? (
                <div className="admin-empty">На форуме нет тем.</div>
              ) : forumQuestions.map(q => (
                <div key={q.id} className="admin-item-row">
                  <div className="admin-item-info">
                    <h4>{q.title}</h4>
                    <p>{q.author?.name} • {q.category} • {q.created_at}</p>
                  </div>
                  <div className="admin-item-actions">
                    <button onClick={() => handleDeleteForumQuestion(q.id)} title="Удалить тему" className="danger"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* USERS & ROLES TAB */}
        {activeTab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="admin-section-card">
              <h3>Управление ролями пользователей</h3>
              <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                Вы можете назначать права Администратора или Модератора зарегистрированным студентам ИВИТШ.
              </p>
            </div>

            <div className="admin-items-list">
              {usersList.length === 0 ? (
                <div className="admin-empty">Нет зарегистрированных пользователей.</div>
              ) : usersList.map(u => {
                const isSuperAdmin = ['ivitsh_admin', 'admin', 'smirnovmakar'].includes(u.username.toLowerCase());
                return (
                  <div key={u.id} className="admin-item-row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="admin-item-info">
                      <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {u.full_name || u.username}
                        {isSuperAdmin && (
                          <span style={{ fontSize: '0.7rem', background: '#059669', color: 'white', padding: '2px 6px', borderRadius: '6px', fontWeight: '800' }}>
                            Главный Админ
                          </span>
                        )}
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#777' }}>
                        Логин: <strong>{u.username}</strong> • Группа: {u.group_number || 'Не указана'}
                      </p>
                    </div>
                    <div className="admin-item-actions" style={{ alignItems: 'center', gap: '8px' }}>
                      {isSuperAdmin ? (
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#059669', padding: '6px 12px', background: '#ECFDF5', borderRadius: '8px' }}>
                          Администратор ИВИТШ
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CED4DA',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            color: u.role === 'admin' ? '#059669' : u.role === 'moderator' ? '#007FFF' : '#495057'
                          }}
                        >
                          <option value="student">Студент</option>
                          <option value="moderator">Модератор</option>
                          <option value="admin">Администратор</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
