import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown, Send, CheckCircle2, LogIn, User, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { forumApi } from '../services/api';

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, canModerate } = useAuth();
  const toast = useToast();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // ── Load Question Detail & Answers from Backend API ────────────────────────
  const loadQuestionData = useCallback(async () => {
    setLoading(true);
    try {
      const [qData, aData] = await Promise.all([
        forumApi.getQuestionDetail(id),
        forumApi.getAnswers(id)
      ]);
      setQuestion(qData);
      setAnswers(Array.isArray(aData) ? aData : []);
    } catch (err) {
      console.warn('[QuestionDetail] Failed to load detail:', err.message);
      toast.show(err.message || 'Ошибка загрузки вопроса', 'warning');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadQuestionData();
  }, [loadQuestionData]);

  // Role badge helper
  const getRoleBadge = (role) => {
    if (role === 'admin') return <span className="role-badge admin">Админ</span>;
    if (role === 'moderator') return <span className="role-badge moderator">Модератор</span>;
    if (role === 'curator') return <span className="role-badge curator">Куратор</span>;
    return null;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // Safe author name helper (format login if full_name is username)
  const formatAuthorName = (name, username) => {
    if (!name || name === username || /^\d{2}-[a-zа-я]+-\d+/i.test(name)) {
      return `Студент ${name || username || ''}`;
    }
    return name;
  };

  // Voting on the main question
  const handleVoteQuestion = async (type) => {
    if (!isLoggedIn) {
      toast.show('Войдите через ЭИОС КГУ, чтобы голосовать', 'warning');
      return;
    }
    const voteType = type === 'like' ? 1 : -1;
    try {
      await forumApi.vote(id, voteType);
      setQuestion(prev => {
        if (!prev) return prev;
        const prevUserVote = prev.user_vote || 0;
        let diff = 0;
        let nextVote = voteType;
        if (prevUserVote === voteType) {
          diff = -voteType;
          nextVote = 0;
        } else if (prevUserVote !== 0) {
          diff = voteType * 2;
        } else {
          diff = voteType;
        }
        return {
          ...prev,
          votes_count: (prev.votes_count || 0) + diff,
          user_vote: nextVote
        };
      });
    } catch (err) {
      toast.show(err.message || 'Ошибка при голосовании', 'warning');
    }
  };

  // Submit new answer via API
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const createdAns = await forumApi.postAnswer(id, replyText.trim());
      setAnswers(prev => [...prev, createdAns]);
      setQuestion(prev => prev ? { ...prev, answers_count: (prev.answers_count || 0) + 1 } : prev);
      setReplyText('');
      toast.show('Ответ опубликован!', 'success');
    } catch (err) {
      toast.show(err.message || 'Ошибка отправки ответа', 'warning');
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <MessageSquare size={48} strokeWidth={1.5} style={{ marginBottom: '15px', color: 'var(--primary)' }} />
        <h2>Загрузка вопроса...</h2>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <h2>Вопрос не найден</h2>
        <button onClick={() => navigate('/forum')} className="btn-auth" style={{ marginTop: '20px', width: '200px' }}>
          Вернуться на форум
        </button>
      </div>
    );
  }

  const isQuestionCreator = user && question.author_id === user.id;

  return (
    <div className="container">
      {/* BACK BUTTON */}
      <div className="details-back-row">
        <button onClick={() => navigate('/forum')} className="btn-back-link">
          <ArrowLeft size={18} /> Вернуться к списку вопросов
        </button>
      </div>

      {/* QUESTION BLOCK */}
      <motion.section 
        className="question-block"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="post-top-row">
          <div className="post-author-badge">
            <div className="post-author-avatar" style={{ background: '#E0F2FE', color: '#0369A1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', overflow: 'hidden', flexShrink: 0 }}>
              <User size={18} />
            </div>
            <div className="post-author-meta">
              <h5>
                {formatAuthorName(question.author_name, question.author_username)}
              </h5>
              <span>{question.category}</span>
            </div>
          </div>
          <span className="post-time-ago">{formatDate(question.created_at)}</span>
        </div>

        <span className="post-tag-badge" style={{ alignSelf: 'flex-start' }}>{question.category}</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: 'var(--text)' }}>{question.title}</h2>
        <p style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#444', margin: 0 }}>{question.content}</p>

        <div className="post-bottom-row" style={{ padding: 0, border: 'none' }}>
          <div className="post-voting-buttons">
            <button 
              className={`vote-action-btn like ${question.user_vote === 1 ? 'active' : ''}`}
              onClick={() => handleVoteQuestion('like')}
              title="Нравится"
            >
              <ThumbsUp size={16} />
            </button>
            <span className="vote-count-number" style={{ fontSize: '1rem' }}>{question.votes_count || 0}</span>
            <button 
              className={`vote-action-btn dislike ${question.user_vote === -1 ? 'active' : ''}`}
              onClick={() => handleVoteQuestion('dislike')}
              title="Не нравится"
            >
              <ThumbsDown size={16} />
            </button>
          </div>
        </div>
      </motion.section>

      {/* ANSWERS HEADER */}
      <div className="answers-header-row">
        <h3>Ответы ({answers.length})</h3>
      </div>

      {/* ANSWERS FEED */}
      <div className="answers-feed-list">
        {answers.length > 0 ? (
          answers.map((reply) => {
            const isReplyAuthor = user && reply.author_id === user.id;
            const canDeleteReply = isReplyAuthor || canModerate;
            return (
              <motion.div 
                key={reply.id} 
                className={`answer-card-box ${reply.is_solution ? 'best' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                {reply.is_solution && (
                  <span className="best-answer-ribbon">
                    <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                    Решение
                  </span>
                )}
                
                <div className="post-top-row">
                  <div className="post-author-badge">
                    <div className="post-author-avatar" style={{ width: '28px', height: '28px', background: '#E0F2FE', color: '#0369A1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <User size={14} />
                    </div>
                    <div className="post-author-meta">
                      <h5 style={{ fontSize: '0.85rem' }}>
                        {formatAuthorName(reply.author_name)}
                      </h5>
                    </div>
                  </div>
                  <span className="post-time-ago">{formatDate(reply.created_at)}</span>
                </div>

                <p style={{ fontSize: '1rem', color: '#333', lineHeight: '1.5', margin: 0 }}>{reply.content}</p>
              </motion.div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#999', background: 'rgba(255,255,255,0.4)', borderRadius: '16px', border: '1px dashed #DDD' }}>
            Пока никто не ответил на этот вопрос. Помоги сокурснику — напиши ответ!
          </div>
        )}
      </div>

      {/* INPUT FORM FOR NEW REPLY */}
      {isLoggedIn ? (
        <form onSubmit={handleSendReply} className="reply-input-box" style={{ marginBottom: '50px' }}>
          <input 
            type="text" 
            placeholder="Напишите ответ..." 
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            disabled={submittingReply}
            required
          />
          <button type="submit" className="btn-send-reply" disabled={submittingReply}>
            <Send size={16} />
          </button>
        </form>
      ) : (
        <div className="auth-gate-banner" style={{ marginBottom: '50px' }}>
          <div className="auth-gate-content">
            <LogIn size={20} />
            <div>
              <strong>Войдите через СДО, чтобы ответить на вопрос</strong>
            </div>
          </div>
          <button className="btn-auth-gate" onClick={() => navigate('/profile')}>
            Войти
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionDetail;
