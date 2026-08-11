import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Star, Sparkles, CheckCircle2, Download, Printer, X } from 'lucide-react';

const REWARDS = [
  { id: 1, title: 'Первопроходец ИВИТШ', desc: 'Завершил знакомство с порталом и маскотом ВИТШиком', icon: '🚀', points: 150 },
  { id: 2, title: 'Знаток корпуса Б', desc: 'Изучил все схемы аудиторий и нашёл Дирекцию Б-209', icon: '🏢', points: 200 },
  { id: 3, title: 'Эрудит ИТ-школы', desc: 'Успешно прошёл входной тест по правилам КГУ', icon: '🧠', points: 250 },
  { id: 4, title: 'Организованный первак', desc: 'Отметил все важные дела в чек-листе первокурсника', icon: '📋', points: 200 },
  { id: 5, title: 'Друг ВИТШика', desc: 'Пообщался с маскотом и освоил RAG ассистент', icon: '🐱', points: 200 },
];

export default function RewardsModal({ isOpen, onClose }) {
  const [showCertificate, setShowCertificate] = useState(false);

  if (!isOpen) return null;

  const totalPoints = REWARDS.reduce((sum, r) => sum + r.points, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
        <motion.div 
          className="auth-modal" 
          onClick={(e) => e.stopPropagation()} 
          style={{ width: '100%', maxWidth: showCertificate ? '620px' : '480px', padding: '25px', textCenter: 'center', transition: 'all 0.3s' }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <button className="close-modal" onClick={onClose}>✕</button>

          {!showCertificate ? (
            <div>
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
                  Вы успешно прошли все этапы «Пути первокурсника» в Высшей ИТ-школе КГУ!
                </p>
              </div>

              <div style={{ background: 'rgba(0,127,255,0.06)', borderRadius: '16px', padding: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <Star size={20} fill="#FFC107" color="#FFC107" />
                <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text)' }}>Набрано баллов: {totalPoints} XP</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', textAlign: 'left', marginBottom: '20px', paddingRight: '4px' }}>
                {REWARDS.map(reward => (
                  <div key={reward.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', border: '1px solid #eee', padding: '10px 14px', borderRadius: '12px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{reward.icon}</span>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800' }}>{reward.title}</h5>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#777' }}>{reward.desc}</p>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#2ECC71' }}>+{reward.points} XP</span>
                  </div>
                ))}
              </div>

              <button onClick={() => setShowCertificate(true)} className="btn-auth" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Sparkles size={18} /> Получить диплом первокурсника 🎓
              </button>
            </div>
          ) : (
            <div>
              {/* PRINTABLE DIPLOMA */}
              <div 
                id="diploma-certificate"
                style={{ 
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%)',
                  border: '8px solid var(--primary)',
                  borderRadius: '20px',
                  padding: '30px 24px',
                  textAlign: 'center',
                  boxShadow: '0 10px 30px rgba(0,127,255,0.15)',
                  position: 'relative',
                  marginBottom: '20px'
                }}
              >
                <div style={{ position: 'absolute', top: '15px', right: '20px', fontSize: '2rem' }}>🎓</div>
                <div style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--primary)', marginBottom: '4px' }}>
                  КОСТРОМСКОЙ ГОСУДАРСТВЕННЫЙ УНИВЕРСИТЕТ
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#666', marginBottom: '16px' }}>
                  ВЫСШАЯ ИТ-ШКОЛА (ИВИТШ)
                </div>

                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text)', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  ДИПЛОМ
                </h2>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '14px' }}>
                  ОБ УСПЕШНОМ ПРОХОЖДЕНИИ АДАПТАЦИИ ПЕРВОКУРСНИКА
                </div>

                <p style={{ fontSize: '0.9rem', color: '#444', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                  Настоящий диплом подтверждает, что первокурсник успешно прошёл все этапы адаптации, освоил правила ИВИТШ КГУ, нашел кабинеты Корпуса Б и набрал <strong>{totalPoints} XP</strong>!
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0' }}>
                  <div style={{ background: 'white', padding: '10px 16px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)' }}>
                    🏆 100% Адаптирован
                  </div>
                  <div style={{ background: 'white', padding: '10px 16px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '0.8rem', fontWeight: '700', color: '#2ECC71' }}>
                    🐾 Одобрено ВИТШиком
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #ddd', paddingTop: '14px', marginTop: '14px', fontSize: '0.75rem', color: '#777' }}>
                  <div>Академический год: 2025–2026</div>
                  <div>Дирекция ИВИТШ КГУ (Б-209)</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handlePrint} className="btn-auth" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Printer size={16} /> Распечатать / Скачать PDF
                </button>
                <button onClick={() => setShowCertificate(false)} style={{ padding: '12px 18px', borderRadius: '10px', border: '1px solid #ccc', background: 'white', fontWeight: '700', cursor: 'pointer' }}>
                  Назад
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
