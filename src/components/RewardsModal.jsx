import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Star, Sparkles, CheckCircle2, X } from 'lucide-react';

const REWARDS = [
  { id: 1, title: 'Первопроходец ИВИТШ', desc: 'Завершил знакомство с порталом и маскотом ВИТШиком', icon: '🚀', points: 100 },
  { id: 2, title: 'Знаток корпуса Б', desc: 'Изучил все схемы аудиторий и нашёл Дирекцию Б-209', icon: '🏢', points: 150 },
  { id: 3, title: 'Эрудит ИТ-школы', desc: 'Успешно прошёл входной тест по правилам КГУ', icon: '🧠', points: 200 },
  { id: 4, title: 'Организованный первак', desc: 'Отметил все дела в чек-листе первокурсника', icon: '📋', points: 150 },
  { id: 5, title: 'Друг ВИТШика', desc: 'Пообщался с ассистентом и протестировал маскот-чат', icon: '🐱', points: 200 },
];

export default function RewardsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const totalPoints = REWARDS.reduce((sum, r) => sum + r.points, 0);

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
        <motion.div 
          className="auth-modal" 
          onClick={(e) => e.stopPropagation()} 
          style={{ width: '480px', padding: '25px', textCenter: 'center' }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <button className="close-modal" onClick={onClose}>×</button>
          
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} 
              transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: '3.5rem', marginBottom: '10px' }}
            >
              🏆
            </motion.div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>
              Адаптация завершена!
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#666' }}>
              Вы успешно прошли весь «Путь первокурсника» в Высшей ИТ-школе!
            </p>
          </div>

          <div style={{ background: 'rgba(0,127,255,0.06)', borderRadius: '16px', padding: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <Star size={20} fill="#FFC107" color="#FFC107" />
            <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text)' }}>Набрано баллов: {totalPoints} XP</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', textAlign: 'left', marginBottom: '20px' }}>
            {REWARDS.map(reward => (
              <div key={reward.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', border: '1px solid #eee', padding: '10px 14px', borderRadius: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>{reward.icon}</span>
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800' }}>{reward.title}</h5>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#777' }}>{reward.desc}</p>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#2ECC71' }}>+{reward.points} XP</span>
              </div>
            ))}
          </div>

          <button onClick={onClose} className="btn-auth" style={{ width: '100%' }}>
            Получить диплом первокурсника 🎓
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
