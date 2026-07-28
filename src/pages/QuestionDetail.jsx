import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown, Send, CheckCircle2, LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, canModerate } = useAuth();
  const toast = useToast();
  const [replyText, setReplyText] = useState('');

  const defaultAnswers = {};

  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('forum_questions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [answersMap, setAnswersMap] = useState(() => {
    try {
      const saved = localStorage.getItem('forum_answers');
      return saved ? JSON.parse(saved) : defaultAnswers;
    } catch (e) {
      return defaultAnswers;
    }
  });

  useEffect(() => {
    localStorage.setItem('forum_answers', JSON.stringify(answersMap));
  }, [answersMap]);

  const question = questions.find(q => q.id.toString() === id);

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

  const currentAnswers = answersMap[id] || [];
  const isQuestionCreator = user && question.author.userId === user.id;

  // Role badge helper
  const getRoleBadge = (role) => {
    if (role === 'admin') return <span className="role-badge admin">Админ</span>;
    if (role === 'moderator') return <span className="role-badge moderator">Модератор</span>;
    if (role === 'curator') return <span className="role-badge curator">Куратор</span>;
    return null;
  };

  // Voting on the question
  const handleVote = (type) => {
    if (!isLoggedIn) {
      toast.show('Войдите через СДО, чтобы голосовать', 'warning');
      return;
    }
    const updatedQuestions = questions.map(q => {
      if (q.id === question.id) {
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
    });
    
    setQuestions(updatedQuestions);
    localStorage.setItem('forum_questions', JSON.stringify(updatedQuestions));
  };

  // Submit new reply
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const authorName = user ? user.fullName.split(' ').map((w, i) => i === 0 ? w : w[0] + '.').join(' ') : 'Аноним';

    const newReply = {
      id: Date.now(),
      text: replyText.trim(),
      author: { 
        name: authorName, 
        group: user?.group || '', 
        course: 1, 
        photo: user?.photo || 'profile.png',
        role: user?.role || 'student',
        userId: user?.id || null
      },
      created_at: 'Только что',
      is_best: false,
      rating: 0,
      userVote: null
    };

    const updatedAnswers = [...currentAnswers, newReply];
    setAnswersMap(prev => ({ ...prev, [id]: updatedAnswers }));

    const updatedQuestions = questions.map(q => {
      if (q.id === question.id) {
        return { ...q, answersCount: q.answersCount + 1 };
      }
      return q;
    });
    setQuestions(updatedQuestions);
    localStorage.setItem('forum_questions', JSON.stringify(updatedQuestions));

    setReplyText('');
    toast.show('Ответ опубликован!', 'success');
  };

  // Delete comment
  const handleDeleteComment = (replyId) => {
    if (window.confirm('Удалить этот ответ?')) {
      const updatedAnswers = currentAnswers.filter(ans => ans.id !== replyId);
      setAnswersMap(prev => ({ ...prev, [id]: updatedAnswers }));

      const updatedQuestions = questions.map(q => {
        if (q.id === question.id) {
          return { ...q, answersCount: Math.max(0, q.answersCount - 1) };
        }
        return q;
      });
      setQuestions(updatedQuestions);
      localStorage.setItem('forum_questions', JSON.stringify(updatedQuestions));
      toast.show('Ответ удалён', 'info');
    }
  };

  // Mark comment as best answer
  const handleMarkBest = (replyId) => {
    const updatedAnswers = currentAnswers.map(ans => ({
      ...ans,
      is_best: ans.id === replyId ? !ans.is_best : false
    }));
    setAnswersMap(prev => ({ ...prev, [id]: updatedAnswers }));
    toast.show('Статус решения обновлён', 'success');
  };

  // Voting on comments
  const handleVoteComment = (replyId, type) => {
    if (!isLoggedIn) {
      toast.show('Войдите через СДО, чтобы голосовать', 'warning');
      return;
    }
    const updatedAnswers = currentAnswers.map(ans => {
      if (ans.id === replyId) {
        const rating = ans.rating || 0;
        const userVote = ans.userVote || null;
        let diff = 0;
        let nextVote = null;

        if (type === 'like') {
          if (userVote === 'like') { diff = -1; nextVote = null; }
          else if (userVote === 'dislike') { diff = 2; nextVote = 'like'; }
          else { diff = 1; nextVote = 'like'; }
        } else if (type === 'dislike') {
          if (userVote === 'dislike') { diff = 1; nextVote = null; }
          else if (userVote === 'like') { diff = -2; nextVote = 'dislike'; }
          else { diff = -1; nextVote = 'dislike'; }
        }
        return { ...ans, rating: rating + diff, userVote: nextVote };
      }
      return ans;
    });

    setAnswersMap(prev => ({ ...prev, [id]: updatedAnswers }));
  };

  // Can delete a comment: own or moderator/admin
  const canDeleteComment = (reply) => {
    if (!user) return false;
    return reply.author.userId === user.id || canModerate;
  };

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
            <div className="post-author-avatar">
              <img 
                src={`/img/${question.author.photo}`} 
                alt="avatar" 
                onError={(e) => { e.target.src = '/img/profile.png'; }}
              />
            </div>
            <div className="post-author-meta">
              <h5>
                {question.author.name}
                {getRoleBadge(question.author.role)}
              </h5>
              <span>{question.author.group}{question.author.group && ' • '}{question.author.course} курс</span>
            </div>
          </div>
          <span className="post-time-ago">{question.created_at}</span>
        </div>

        <span className="post-tag-badge" style={{ alignSelf: 'flex-start' }}>{question.category}</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: 'var(--text)' }}>{question.title}</h2>
        <p style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#444', margin: 0 }}>{question.text}</p>

        <div className="post-bottom-row" style={{ padding: 0, border: 'none' }}>
          <div className="post-voting-buttons">
            <button 
              className={`vote-action-btn like ${question.userVote === 'like' ? 'active' : ''}`}
              onClick={() => handleVote('like')}
              title="Нравится"
            >
              <ThumbsUp size={16} />
            </button>
            <span className="vote-count-number" style={{ fontSize: '1rem' }}>{question.rating}</span>
            <button 
              className={`vote-action-btn dislike ${question.userVote === 'dislike' ? 'active' : ''}`}
              onClick={() => handleVote('dislike')}
              title="Не нравится"
            >
              <ThumbsDown size={16} />
            </button>
          </div>
        </div>
      </motion.section>

      {/* ANSWERS HEADER */}
      <div className="answers-header-row">
        <h3>Ответы ({currentAnswers.length})</h3>
      </div>

      {/* ANSWERS FEED */}
      <div className="answers-feed-list">
        {currentAnswers.length > 0 ? (
          currentAnswers.map((reply) => (
            <motion.div 
              key={reply.id} 
              className={`answer-card-box ${reply.is_best ? 'best' : ''}`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {reply.is_best && (
                <span className="best-answer-ribbon">
                  <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                  Решение
                </span>
              )}
              
              <div className="post-top-row">
                <div className="post-author-badge">
                  <div className="post-author-avatar" style={{ width: '28px', height: '28px' }}>
                    <img 
                      src={`/img/${reply.author.photo}`} 
                      alt="avatar" 
                      onError={(e) => { e.target.src = '/img/profile.png'; }}
                    />
                  </div>
                  <div className="post-author-meta">
                    <h5 style={{ fontSize: '0.85rem' }}>
                      {reply.author.name}
                      {getRoleBadge(reply.author.role)}
                    </h5>
                    <span style={{ fontSize: '0.7rem' }}>{reply.author.group}{reply.author.group && ' • '}{reply.author.course} курс</span>
                  </div>
                </div>
                <span className="post-time-ago">{reply.created_at}</span>
              </div>

              <p style={{ fontSize: '1rem', color: '#333', lineHeight: '1.5', margin: 0 }}>{reply.text}</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed rgba(0,0,0,0.05)' }}>
                <div className="post-voting-buttons" style={{ margin: 0 }}>
                  <button 
                    className={`vote-action-btn like ${(reply.userVote || null) === 'like' ? 'active' : ''}`}
                    onClick={() => handleVoteComment(reply.id, 'like')}
                    title="Нравится"
                    style={{ padding: '4px 8px' }}
                  >
                    <ThumbsUp size={12} />
                  </button>
                  <span className="vote-count-number" style={{ fontSize: '0.85rem' }}>{reply.rating || 0}</span>
                  <button 
                    className={`vote-action-btn dislike ${(reply.userVote || null) === 'dislike' ? 'active' : ''}`}
                    onClick={() => handleVoteComment(reply.id, 'dislike')}
                    title="Не нравится"
                    style={{ padding: '4px 8px' }}
                  >
                    <ThumbsDown size={12} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  {canDeleteComment(reply) && (
                    <button 
                      onClick={() => handleDeleteComment(reply.id)} 
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#E74C3C',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Удалить ответ"
                    >
                      Удалить
                    </button>
                  )}
                  
                  {isQuestionCreator && (
                    <button 
                      onClick={() => handleMarkBest(reply.id)} 
                      style={{
                        background: 'none',
                        border: 'none',
                        color: reply.is_best ? '#E74C3C' : '#2ECC71',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {reply.is_best ? 'Снять пометку решения' : 'Отметить как решение'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
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
            required
          />
          <button type="submit" className="btn-send-reply">
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
