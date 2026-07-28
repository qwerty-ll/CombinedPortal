import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, MessageSquare, ThumbsUp, ThumbsDown, X, User, Trash2, LogIn, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Forum = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, canModerate } = useAuth();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);

  // Form states for a new question
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Учеба');
  const [newText, setNewText] = useState('');
  const [errors, setErrors] = useState({});

  const defaultQuestions = [];

  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('forum_questions');
      return saved ? JSON.parse(saved) : defaultQuestions;
    } catch (e) {
      return defaultQuestions;
    }
  });

  useEffect(() => {
    localStorage.setItem('forum_questions', JSON.stringify(questions));
  }, [questions]);

  // Handle voting
  const handleVote = (id, type, e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.show('Войдите через СДО, чтобы голосовать', 'warning');
      return;
    }
    setQuestions(prev => prev.map(q => {
      if (q.id === id) {
        let diff = 0;
        let nextVote = null;

        if (type === 'like') {
          if (q.userVote === 'like') { diff = -1; nextVote = null; }
          else if (q.userVote === 'dislike') { diff = 2; nextVote = 'like'; }
          else { diff = 1; nextVote = 'like'; }
        } else if (type === 'dislike') {
          if (q.userVote === 'dislike') { diff = 1; nextVote = null; }
          else if (q.userVote === 'like') { diff = -2; nextVote = 'dislike'; }
          else { diff = -1; nextVote = 'dislike'; }
        }
        return { ...q, rating: q.rating + diff, userVote: nextVote };
      }
      return q;
    }));
  };

  // Add a new question
  const handleCreateQuestion = (e) => {
    e.preventDefault();
    
    const tempErrors = {};
    if (newTitle.trim().length < 10) {
      tempErrors.title = 'Заголовок должен содержать минимум 10 символов';
    } else if (newTitle.length > 100) {
      tempErrors.title = 'Заголовок не должен превышать 100 символов';
    }

    if (newText.trim().length < 20) {
      tempErrors.text = 'Описание должно содержать минимум 20 символов';
    } else if (newText.length > 2000) {
      tempErrors.text = 'Описание не должно превышать 2000 символов';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    const authorName = user ? user.fullName.split(' ').map((w, i) => i === 0 ? w : w[0] + '.').join(' ') : 'Аноним';
    
    const newQuestion = {
      id: Date.now(),
      title: newTitle.trim(),
      text: newText.trim(),
      category: newCategory,
      author: { 
        name: authorName, 
        group: user?.group || '', 
        course: 1, 
        photo: user?.photo || 'profile.png',
        role: user?.role || 'student',
        userId: user?.id || null
      },
      created_at: 'Только что',
      rating: 0,
      userVote: null,
      answersCount: 0
    };

    setQuestions([newQuestion, ...questions]);
    setIsAskModalOpen(false);
    setNewTitle('');
    setNewText('');
    setNewCategory('Учеба');
    setErrors({});
    toast.show('Вопрос опубликован!', 'success');
  };

  // Delete question (own or as moderator)
  const handleDeleteQuestion = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Вы действительно хотите удалить этот вопрос?')) {
      setQuestions(prev => prev.filter(q => q.id !== id));
      toast.show('Вопрос удалён', 'info');
    }
  };

  // Check if current user owns a question
  const isOwnPost = (q) => {
    if (!user) return false;
    return q.author.userId === user.id;
  };

  // Helper to highlight search term
  const highlightText = (text, query) => {
    if (!query) return text;
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

  // Role badge helper
  const getRoleBadge = (role) => {
    if (role === 'admin') return <span className="role-badge admin">Админ</span>;
    if (role === 'moderator') return <span className="role-badge moderator">Модератор</span>;
    if (role === 'curator') return <span className="role-badge curator">Куратор</span>;
    return null;
  };

  const categories = ['Все', 'Учеба', 'Расписание', 'Общежитие', 'Стипендия', 'Организационное'];

  const filteredQuestions = questions.filter(q => {
    const matchesCategory = selectedCategory === 'Все' || q.category === selectedCategory;
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <h1>Форум студентов</h1>
      </div>

      {/* AUTH GATE BANNER */}
      {!isLoggedIn && (
        <div className="auth-gate-banner">
          <div className="auth-gate-content">
            <LogIn size={20} />
            <div>
              <strong>Для участия в форуме необходимо войти через СДО КГУ</strong>
              <p>Вы можете просматривать темы, но для создания вопросов и ответов нужна авторизация</p>
            </div>
          </div>
          <button className="btn-auth-gate" onClick={() => navigate('/profile')}>
            Войти через СДО
          </button>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="forum-search-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon-inside" />
          <input 
            type="text" 
            placeholder="Поиск по форуму..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* CONTROLS */}
      <div className="forum-controls">
        <div className="category-filter-scroll">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`filter-badge ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoggedIn && (
          <button className="btn-ask-question" onClick={() => { setIsAskModalOpen(true); setErrors({}); }}>
            <Plus size={16} /> Задать вопрос
          </button>
        )}
      </div>

      {/* DISCUSSIONS FEED */}
      <div className="posts-feed">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((q) => {
            const canDelete = isOwnPost(q) || canModerate;
            return (
              <motion.div 
                key={q.id}
                className="post-card-container"
                onClick={() => navigate(`/forum/question/${q.id}`)}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="post-top-row">
                  <div className="post-author-badge">
                    <div className="post-author-avatar">
                      <img 
                        src={`/img/${q.author.photo}`} 
                        alt="avatar" 
                        onError={(e) => { e.target.src = '/img/profile.png'; }}
                      />
                    </div>
                    <div className="post-author-meta">
                      <h5>
                        {q.author.name}
                        {getRoleBadge(q.author.role)}
                      </h5>
                      <span>{q.author.group}{q.author.group && ' • '}{q.author.course} курс</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="post-time-ago">{q.created_at}</span>
                    {canDelete && (
                      <button 
                        className="vote-action-btn dislike" 
                        style={{ padding: '4px', height: 'auto', width: 'auto', borderRadius: '4px' }}
                        onClick={(e) => handleDeleteQuestion(q.id, e)}
                        title="Удалить вопрос"
                      >
                        <Trash2 size={16} style={{ color: '#E74C3C' }} />
                      </button>
                    )}
                  </div>
                </div>

                <h3>{highlightText(q.title, searchQuery)}</h3>
                <p className="post-excerpt">{highlightText(q.text.length > 150 ? `${q.text.slice(0, 150)}...` : q.text, searchQuery)}</p>

                <div className="post-bottom-row">
                  <span className="post-tag-badge">{q.category}</span>
                  <div className="post-stats-group">
                    <span className="post-stat-item">
                      <MessageSquare size={14} /> {q.answersCount} ответов
                    </span>
                    <div className="post-voting-buttons">
                      <button 
                        className={`vote-action-btn like ${q.userVote === 'like' ? 'active' : ''}`}
                        onClick={(e) => handleVote(q.id, 'like', e)}
                        title="Нравится"
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <span className="vote-count-number">{q.rating}</span>
                      <button 
                        className={`vote-action-btn dislike ${q.userVote === 'dislike' ? 'active' : ''}`}
                        onClick={(e) => handleVote(q.id, 'dislike', e)}
                        title="Не нравится"
                      >
                        <ThumbsDown size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="empty-state-card">
            <MessageSquare size={48} strokeWidth={1.5} />
            <h4>На форуме пока нет вопросов</h4>
            <p>{isLoggedIn ? 'Станьте первым, кто задаст вопрос!' : 'Войдите через СДО, чтобы задать вопрос'}</p>
          </div>
        )}
      </div>

      {/* CREATE QUESTION MODAL */}
      <AnimatePresence>
        {isAskModalOpen && (
          <div className="modal-overlay" onClick={() => setIsAskModalOpen(false)}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()} style={{ width: '500px' }}>
              <button className="close-modal" onClick={() => setIsAskModalOpen(false)}><X size={20} /></button>
              <h3 style={{ fontWeight: '800' }}>Новый вопрос на форум</h3>
              
              <form onSubmit={handleCreateQuestion} className="ask-form-modal" style={{ marginTop: '20px' }}>
                <div className="form-group-modal" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label>Заголовок вопроса</label>
                  <input 
                    type="text" 
                    placeholder="Сформулируйте ваш вопрос кратко..." 
                    value={newTitle}
                    onChange={(e) => {
                      setNewTitle(e.target.value);
                      if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                    }}
                    maxLength={100}
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    {errors.title ? <span className="form-field-error">{errors.title}</span> : <span></span>}
                    <span className="form-char-counter">{newTitle.length} / 100</span>
                  </div>
                </div>

                <div className="form-group-modal">
                  <label>Категория</label>
                  <select 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="Учеба">Учеба</option>
                    <option value="Расписание">Расписание</option>
                    <option value="Общежитие">Общежитие</option>
                    <option value="Стипендия">Стипендия</option>
                    <option value="Организационное">Организационное</option>
                  </select>
                </div>

                <div className="form-group-modal" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label>Подробное описание</label>
                  <textarea 
                    placeholder="Опишите детали вашего вопроса..." 
                    value={newText}
                    onChange={(e) => {
                      setNewText(e.target.value);
                      if (errors.text) setErrors(prev => ({ ...prev, text: null }));
                    }}
                    maxLength={2000}
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    {errors.text ? <span className="form-field-error">{errors.text}</span> : <span></span>}
                    <span className="form-char-counter">{newText.length} / 2000</span>
                  </div>
                </div>

                <button type="submit" className="btn-auth" style={{ marginTop: '10px' }}>Опубликовать</button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Forum;
