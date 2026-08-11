import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, MapPin, User } from 'lucide-react';

const LessonDetailModal = ({ isOpen, onClose, lesson }) => {
  const navigate = useNavigate();
  if (!isOpen || !lesson) return null;

  const handleShowOnMap = () => {
    onClose();
    // Navigate to map and pass the floor as state or search param
    navigate('/map', { state: { selectedFloor: lesson.floor } });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal lesson-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose} aria-label="Закрыть">
          <X size={20} />
        </button>

        <span className="modal-label">Детали занятия</span>
        <h2 className="modal-lesson-title">{lesson.title}</h2>

        <div className="modal-top-info">
          <span className="time-badge">{lesson.time}</span>
          {lesson.status === 'current' && <span className="time-countdown" style={{ color: 'var(--primary)' }}>Идет сейчас</span>}
          {lesson.status === 'completed' && <span className="time-countdown" style={{ color: '#2ECC71' }}>Завершено</span>}
          {lesson.status === 'upcoming' && <span className="time-countdown" style={{ color: '#FF9F43' }}>Начнется позже</span>}
          {!lesson.status && <span className="time-countdown" style={{ color: '#FF9F43' }}>Следующее занятие</span>}
        </div>

        <div className="modal-bottom-info">
          <span className="info-tag"><MapPin size={14} /> Кабинет {lesson.room}</span>
          <span className="info-tag">{lesson.floor} этаж</span>
        </div>

        {/* TEACHER CARD */}
        <div className="teacher-card modal-teacher">
          <div className="teacher-avatar" style={{ background: '#E0F2FE', color: '#0369A1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {lesson.teacher.photo && lesson.teacher.photo !== 'profile.png' ? (
              <img 
                src={lesson.teacher.photo.startsWith('data:') || lesson.teacher.photo.startsWith('http://') || lesson.teacher.photo.startsWith('https://')
                  ? lesson.teacher.photo
                  : `/img/teachers/${lesson.teacher.photo}`} 
                alt={lesson.teacher.name} 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <User size={24} />
            )}
          </div>
          <div className="teacher-info">
            <h3>{lesson.teacher.name}</h3>
            <p>{lesson.teacher.role}</p>
            <a href={`mailto:${lesson.teacher.email}`} className="teacher-email-link">
              <Mail size={14} /> {lesson.teacher.email}
            </a>
          </div>
        </div>

        <button onClick={handleShowOnMap} className="btn-auth map-btn">
          <MapPin size={16} /> Показать на карте
        </button>
      </div>
    </div>
  );
};

export default LessonDetailModal;
