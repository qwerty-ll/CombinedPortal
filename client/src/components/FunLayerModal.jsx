import React from 'react';

const CLUBS = [
  { name: 'ВИТШ-медиа', desc: 'Контент, SMM, съемки и репортажи жизни ИВИТШ', leader: 'Макар Смирнов' },
  { name: 'ИДЕЯ', desc: 'Дизайн, 2D/3D графика и бренд факультета', leader: 'Ирина Горева' },
  { name: 'Спортивное программирование', desc: 'Решение алгоритмических задач и чемпионаты', leader: 'Глеб Лебедев' },
  { name: 'NextHub', desc: 'Стартапы, IT-проекты и продуктовый менеджмент', leader: 'Денислав Чеботарев' },
  { name: 'Играй', desc: 'Настольные игры, кибертурниры и весёлый досуг', leader: 'Василиса Никитина' },
];

export default function FunLayerModal({ onComplete }) {
  return (
    <div className="step-body">
      <p className="step-lead">Студенческая жизнь ИВИТШ: в ИТ-школе учёба совмещается с интересными проектами и клубами.</p>

      <section aria-labelledby="clubs-title">
        <h3 id="clubs-title" className="step-subheading">Объединения факультета</h3>
        <ul className="list clubs">
          {CLUBS.map((club) => (
            <li key={club.name} className="club">
              <span className="club-name">{club.name}</span>
              <span className="club-desc">{club.desc}</span>
              <span className="club-leader">Руководитель: {club.leader}</span>
            </li>
          ))}
        </ul>
      </section>

      <button type="button" onClick={onComplete} className="btn btn-primary btn-block step-complete">
        Завершить этап и открыть награды
      </button>
    </div>
  );
}
