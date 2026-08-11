import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, Gamepad2, Award } from 'lucide-react';

const CLUBS = [
  { name: 'ВИТШ-медиа', desc: 'Контент, SMM, съемки и репортажи жизни ИВИТШ', leader: 'Макар Смирнов' },
  { name: 'ИДЕЯ', desc: 'Дизайн, 2D/3D графика и бренд факультета', leader: 'Ирина Горева' },
  { name: 'Спортивное программирование', desc: 'Решение алгоритмических задач и чемпионаты', leader: 'Глеб Лебедев' },
  { name: 'NextHub', desc: 'Стартапы, IT-проекты и продуктовый менеджмент', leader: 'Денислав Чеботарев' },
  { name: 'Играй', desc: 'Настольные игры, кибертурниры и весёлый досуг', leader: 'Василиса Никитина' },
];

export default function FunLayerModal({ onComplete }) {
  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(135deg, #007AFF 0%, #AF52DE 100%)', borderRadius: '18px', padding: '16px', color: 'white', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Студенческая жизнь ИВИТШ</h4>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', opacity: 0.9 }}>В ИТ-школе учёба совмещается с крутыми проектами и клубами!</p>
      </div>

      <h5 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: '800', color: 'var(--text)' }}>Объединения факультета</h5>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', marginBottom: '16px' }}>
        {CLUBS.map((club, idx) => (
          <div key={idx} style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: '12px', padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{club.name}</strong>
              <span style={{ fontSize: '0.75rem', color: '#888' }}>Рук: {club.leader}</span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#555' }}>{club.desc}</p>
          </div>
        ))}
      </div>

      <button onClick={onComplete} className="btn-auth" style={{ width: '100%' }}>
        Завершить адаптацию 🎓
      </button>
    </div>
  );
}
