import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, MessageSquare, ThumbsUp, ThumbsDown, X, User, Trash2, LogIn, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { forumApi } from '../services/api';

const Forum = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, canModerate } = useAuth();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Учеба');
  const [newText, setNewText] = useState('');
  const [errors, setErrors] = useState({});

  // API-backed state — no localStorage
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const categories = ['Все', 'Учеба', 'Расписание', 'Общежитие', 'Стипендия', 'Организационное'];

  // ── Load questions from API ──────────────────────────────────────────────
  const loadQuestions = useCallback(() => {
    setLoading(true);
    forumApi.getQuestions(
      selectedCategory !== 'Все' ? selectedCategory : '',
      searchQuery.trim(),
      50
    )
      .then(res => {
        if (Array.isArray(res)) setQuestions(res);
      })
      .catch(err => {
        console.warn('[Forum] Failed to load questions:', err.message);
        toast.show('Не удалось загрузить вопросы форума', 'warning');
      })
      .finally(() => setLoading(false));
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    // Debounce search to avoid excessive API calls while typing
    const timer = setTimeout(loadQuestions, searchQuery ? 400 : 0);
    return () => clearTimeout(timer);
  }, [loadQuestions]);

  // ── Voting (API) ─────────────────────────────────────────────────────────
  const handleVote = async (id, type, e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.show('Войдите через ЭИОС КГУ, чтобы голосовать', 'warning');
      return;
    }
    const voteType = type === 'like' ? 1 : -1;
    try {
      await forumApi.vote(id, voteType);
      // Optimistic update for current user's vote + rating
      setQuestions(prev => prev.map(q => {
        if (q.id !== id) return q;
        const prevUserVote = q.user_vote || 0;
        let diff = 0;
        let nextVote = voteType;
        if (prevUserVote === voteType) {
          // Toggle off
          diff = -voteType;
          nextVote = 0;
        } else if (prevUserVote !== 0) {
          // Switch direction
          diff = voteType * 2;
        } else {
          diff = voteType;
        }
        return { ...q, votes_count: (q.votes_count || 0) + diff, user_vote: nextVote };
      }));
    } catch (err) {
      toast.show(err.message || 'Ошибка при голосовании', 'warning');
    }
  };

  // ── Create Question (API) ────────────────────────────────────────────────
  const handleCreateQuestion = async (e) => {
    e.preventDefault();

    const tempErrors = {};
    if (newTitle.trim().length < 10) {
      tempErrors.title = 'Заголовок должен содержать минимум 10 символов';
    } else if (newTitle.length > 300) {
      tempErrors.title = 'Заголовок не должен превышать 300 символов';
    }
    if (newText.trim().length < 20) {
      tempErrors.text = 'Описание должно содержать минимум 20 символов';
    } else if (newText.length > 10000) {
      tempErrors.text = 'Описание не должно превышать 10 000 символов';
    }
    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setSubmitting(true);
    try {
      const created = await forumApi.createQuestion({
        title: newTitle.trim(),
        category: newCategory,
        content: newText.trim()
      });
      // Normalise API response to UI shape
      setQuestions(prev => [normaliseQuestion(created), ...prev]);
      setIsAskModalOpen(false);
      setNewTitle('');
      setNewText('');
      setNewCategory('Учеба');
      setErrors({});
      toast.show('Вопрос опубликован!', 'success');
    } catch (err) {
      toast.show(err.message || 'Ошибка при публикации вопроса', 'warning');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Question (API) ───────────────────────────────────────────────────
  const handleDeleteQuestion = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Удалить вопрос с форума?')) return;
    try {
      await forumApi.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      toast.show('Вопрос удалён с сервера', 'info');
    } catch (err) {
      toast.show(err.message || 'Ошибка удаления вопроса', 'warning');
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  /** Normalise API ForumQuestionResponse to a UI-friendly shape */
  const normaliseQuestion = (q) => ({
    ...q,
    // Map API fields to UI fields used in the render
    author: {
      name: q.author_name || 'Студент',
      role: 'student',
      group: '',
      photo: 'profile.png',
    },
    text: q.content || '',
    rating: q.votes_count ?? 0,
    answersCount: q.answers_count ?? 0,
    userVote: q.user_vote === 1 ? 'like' : q.user_vote === -1 ? 'dislike' : null,
  });

  const normalisedQuestions = questions.map(normaliseQuestion);

  const isOwnPost = (q) => {
    if (!user) return false;
    return q.author_id === user.id;
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
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

  const getRoleBadge = (role) => {
    if (role === 'admin') return <span className="role-badge admin">Админ</span>;
    if (role === 'moderator') return <span className="role-badge moderator">Модератор</span>;
    if (role === 'curator') return <span className="role-badge curator">Куратор</span>;
    return null;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    } catch { return dateStr; }
  };

  return (
    <div className="container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <h1>Форум студентов</h1>
        <button onClick={loadQuestions} title="Обновить" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
          <RefreshCw size={18} />
        </button>
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
        {loading ? (
          <div className="empty-state-card">
            <MessageSquare size={48} strokeWidth={1.5} />
            <h4>Загрузка вопросов...</h4>
          </div>
        ) : normalisedQuestions.length > 0 ? (
          normalisedQuestions.map((q) => {
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
                    <div className="post-author-avatar" style={{ background: '#E0F2FE', color: '#0369A1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', overflow: 'hidden', flexShrink: 0 }}>
                      <User size={18} />
                    </div>
                    <div className="post-author-meta">
                      <h5>
                        {q.author.name}
                        {getRoleBadge(q.author.role)}
                      </h5>
                      <span>{q.author.group}{q.author.group && ' • '}{q.category}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="post-time-ago">{formatDate(q.created_at)}</span>
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
                <p className="post-excerpt">{highlightText((q.text || '').length > 150 ? `${(q.text || '').slice(0, 150)}...` : (q.text || ''), searchQuery)}</p>

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
                    onChange={(e) => { setNewTitle(e.target.value); if (errors.title) setErrors(prev => ({ ...prev, title: null })); }}
                    maxLength={300}
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    {errors.title ? <span className="form-field-error">{errors.title}</span> : <span />}
                    <span className="form-char-counter">{newTitle.length} / 300</span>
                  </div>
                </div>

                <div className="form-group-modal">
                  <label>Категория</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
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
                    onChange={(e) => { setNewText(e.target.value); if (errors.text) setErrors(prev => ({ ...prev, text: null })); }}
                    maxLength={10000}
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    {errors.text ? <span className="form-field-error">{errors.text}</span> : <span />}
                    <span className="form-char-counter">{newText.length} / 10000</span>
                  </div>
                </div>

                <button type="submit" className="btn-auth" style={{ marginTop: '10px' }} disabled={submitting}>
                  {submitting ? 'Публикуем...' : 'Опубликовать'}
                </button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Forum;
