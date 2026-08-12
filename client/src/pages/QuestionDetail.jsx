import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown, Send, CheckCircle2, LogIn, User, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const INITIAL_DEFAULT_QUESTIONS = [
  {
    id: 1,
    title: 'Как получить пропуск в Корпус Б на Ивановской?',
    category: 'Организационное',
    text: 'Привет всем! Подскажите, пожалуйста, где именно в Корпусе Б выдают постоянные студенческие электронные пропуски и какие документы с собой брать?',
    author: {
      name: 'Алексей Смирнов',
      role: 'student',
      group: '24-ИСбо-1',
      course: 1,
      photo: 'profile.png',
      userId: 101
    },
    created_at: '2 часа назад',
    rating: 12,
    userVote: null,
    answersCount: 3
  },
  {
    id: 2,
    title: 'Где находится аудитория Б-209 и Дирекция ИВИТШ?',
    category: 'Расписание',
    text: 'Здравствуйте! Подскажите, на каком этаже находится дирекция ИВИТШ (кабинет Б-209) и по какому графику работает приём студентов?',
    author: {
      name: 'Мария Иванова',
      role: 'student',
      group: '24-ПИбо-2',
      course: 1,
      photo: 'profile.png',
      userId: 102
    },
    created_at: 'Вчера',
    rating: 8,
    userVote: null,
    answersCount: 2
  },
  {
    id: 3,
    title: 'Какие требования для получения повышенной стипендии (ПГАС)?',
    category: 'Стипендия',
    text: 'Подскажите, какие достижения учитываются для ПГАС на ИВИТШ (наука, хакатоны, спорт) и когда обычно открывается приём портфолио?',
    author: {
      name: 'Дмитрий Соколов',
      role: 'student',
      group: '23-ИСбо-1',
      course: 2,
      photo: 'profile.png',
      userId: 103
    },
    created_at: '3 дня назад',
    rating: 15,
    userVote: null,
    answersCount: 4
  }
];

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, canModerate } = useAuth();
  const toast = useToast();
  const [replyText, setReplyText] = useState('');

  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('forum_questions');
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.length > 0 ? parsed : INITIAL_DEFAULT_QUESTIONS;
    } catch (e) {
      return INITIAL_DEFAULT_QUESTIONS;
    }
  });

  const [answersMap, setAnswersMap] = useState(() => {
    try {
      const saved = localStorage.getItem('forum_answers');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('forum_answers', JSON.stringify(answersMap));
    } catch (e) {}
  }, [answersMap]);

  // Safe author object extractor
  const getAuthorObj = (author) => {
    if (!author) {
      return { name: 'Студент ИВИТШ', role: 'student', group: '24-ИСбо-1', course: 1, photo: 'profile.png', userId: null };
    }
    if (typeof author === 'string') {
      return { name: author, role: 'student', group: '24-ИСбо-1', course: 1, photo: 'profile.png', userId: null };
    }
    return {
      name: author.name || author.full_name || author.username || 'Студент ИВИТШ',
      role: author.role || 'student',
      group: author.group || author.group_number || '',
      course: author.course || 1,
      photo: author.photo || 'profile.png',
      photoUrl: author.photoUrl || author.photo_url || null,
      userId: author.userId || author.id || null
    };
  };

  const question = questions.find(q => q.id.toString() === id.toString());

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

  const questionAuthor = getAuthorObj(question.author);
  const currentAnswers = answersMap[id] || [];
  const isQuestionCreator = user && (questionAuthor.userId === user.id || questionAuthor.name === user.fullName);

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
      if (q.id.toString() === question.id.toString()) {
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
        return { ...q, rating: (q.rating || 0) + diff, userVote: nextVote };
      }
      return q;
    });
    
    setQuestions(updatedQuestions);
    try {
      localStorage.setItem('forum_questions', JSON.stringify(updatedQuestions));
    } catch (e) {}
  };

  // Submit new reply
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const authorName = user ? user.fullName : 'Аноним';

    const newReply = {
      id: Date.now(),
      text: replyText.trim(),
      author: { 
        name: authorName, 
        group: user?.group_number || user?.group || '', 
        course: 1, 
        photo: user?.photo || 'profile.png',
        photoUrl: user?.photoUrl || null,
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
      if (q.id.toString() === question.id.toString()) {
        return { ...q, answersCount: (q.answersCount || 0) + 1 };
      }
      return q;
    });
    setQuestions(updatedQuestions);
    try {
      localStorage.setItem('forum_questions', JSON.stringify(updatedQuestions));
    } catch (e) {}

    setReplyText('');
    toast.show('Ответ опубликован!', 'success');
  };

  // Delete comment
  const handleDeleteComment = (replyId) => {
    if (window.confirm('Удалить этот ответ?')) {
      const updatedAnswers = currentAnswers.filter(ans => ans.id !== replyId);
      setAnswersMap(prev => ({ ...prev, [id]: updatedAnswers }));

      const updatedQuestions = questions.map(q => {
        if (q.id.toString() === question.id.toString()) {
          return { ...q, answersCount: Math.max(0, (q.answersCount || 1) - 1) };
        }
        return q;
      });
      setQuestions(updatedQuestions);
      try {
        localStorage.setItem('forum_questions', JSON.stringify(updatedQuestions));
      } catch (e) {}
      toast.show('Ответ удалён', 'info');
    }
  };

  // Vote on comment
  const handleVoteComment = (replyId, type) => {
    if (!isLoggedIn) {
      toast.show('Войдите через СДО, чтобы голосовать', 'warning');
      return;
    }
    const updatedAnswers = currentAnswers.map(ans => {
      if (ans.id === replyId) {
        let diff = 0;
        let nextVote = null;
        const userVote = ans.userVote || null;
        const rating = ans.rating || 0;

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

  // Mark best answer
  const handleMarkBest = (replyId) => {
    const updatedAnswers = currentAnswers.map(ans => ({
      ...ans,
      is_best: ans.id === replyId ? !ans.is_best : false
    }));
    setAnswersMap(prev => ({ ...prev, [id]: updatedAnswers }));
    toast.show('Статус решения обновлен', 'success');
  };

  // Can delete a comment
  const canDeleteComment = (reply) => {
    if (!user) return false;
    const replyAuthor = getAuthorObj(reply.author);
    return replyAuthor.userId === user.id || canModerate;
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
            <div className="post-author-avatar" style={{ background: '#E0F2FE', color: '#0369A1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', overflow: 'hidden', flexShrink: 0 }}>
              {questionAuthor.photoUrl || (questionAuthor.photo && questionAuthor.photo !== 'profile.png') ? (
                <img 
                  src={questionAuthor.photoUrl || `/img/${questionAuthor.photo}`} 
                  alt="avatar" 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <User size={18} />
              )}
            </div>
            <div className="post-author-meta">
              <h5>
                {questionAuthor.name}
                {getRoleBadge(questionAuthor.role)}
              </h5>
              <span>{questionAuthor.group}{questionAuthor.group && ' • '}{questionAuthor.course} курс</span>
            </div>
          </div>
          <span className="post-time-ago">{question.created_at}</span>
        </div>

        <span className="post-tag-badge" style={{ alignSelf: 'flex-start' }}>{question.category}</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: 'var(--text)' }}>{question.title}</h2>
        <p style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#444', margin: 0 }}>{question.text || question.content}</p>

        <div className="post-bottom-row" style={{ padding: 0, border: 'none' }}>
          <div className="post-voting-buttons">
            <button 
              className={`vote-action-btn like ${question.userVote === 'like' ? 'active' : ''}`}
              onClick={() => handleVote('like')}
              title="Нравится"
            >
              <ThumbsUp size={16} />
            </button>
            <span className="vote-count-number" style={{ fontSize: '1rem' }}>{question.rating || question.votes_count || 0}</span>
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
          currentAnswers.map((reply) => {
            const replyAuthor = getAuthorObj(reply.author);
            return (
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
                    <div className="post-author-avatar" style={{ width: '28px', height: '28px', background: '#E0F2FE', color: '#0369A1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {replyAuthor.photoUrl || (replyAuthor.photo && replyAuthor.photo !== 'profile.png') ? (
                        <img 
                          src={replyAuthor.photoUrl || `/img/${replyAuthor.photo}`} 
                          alt="avatar" 
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <User size={14} />
                      )}
                    </div>
                    <div className="post-author-meta">
                      <h5 style={{ fontSize: '0.85rem' }}>
                        {replyAuthor.name}
                        {getRoleBadge(replyAuthor.role)}
                      </h5>
                      <span style={{ fontSize: '0.7rem' }}>{replyAuthor.group}{replyAuthor.group && ' • '}{replyAuthor.course} курс</span>
                    </div>
                  </div>
                  <span className="post-time-ago">{reply.created_at}</span>
                </div>

                <p style={{ fontSize: '1rem', color: '#333', lineHeight: '1.5', margin: 0 }}>{reply.text || reply.content}</p>

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
              <strong>Войдите через ЭИОС КГУ, чтобы ответить на вопрос</strong>
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
