import React from 'react';

function CompleteStepButton({ onComplete }) {
  return (
    <button type="button" onClick={onComplete} className="btn btn-primary btn-block step-complete">
      Завершить этап и открыть следующий
    </button>
  );
}

export function StepFoundation({ onComplete }) {
  const points = [
    { title: 'Что такое этот портал?', text: 'Адаптационный портал поможет тебе освоиться в университете: узнать расписание, найти нужные кабинеты и познакомиться с жизнью факультета.' },
    { title: 'Как это работает?', text: 'Проходи этапы по порядку — каждый открывает новый раздел. Выполняй задания, исследуй кампус и зарабатывай достижения.' },
    { title: 'Ты не один', text: 'Рядом всегда есть ВИТШик. Он подскажет, поддержит и даже расскажет студенческие приметы на удачу.' }
  ];

  return (
    <div className="step-body">
      <div className="mascot-say">
        <img src="/img/mascot.png" alt="" className="mascot-say-avatar" width="56" height="56" />
        <div className="message bot">
          <strong className="mascot-say-title">Добро пожаловать в ИВИТШ</strong>
          Я ВИТШик — твой персональный гид по студенческой жизни Высшей ИТ-школы КГУ.
        </div>
      </div>

      <ul className="list step-points">
        {points.map((point) => (
          <li key={point.title} className="step-point">
            <h3>{point.title}</h3>
            <p>{point.text}</p>
          </li>
        ))}
      </ul>

      <CompleteStepButton onComplete={onComplete} />
    </div>
  );
}

export function StepRoadmap({ onComplete }) {
  const steps = [
    { num: 1, label: 'Основа', desc: 'Знакомство с порталом и ВИТШиком' },
    { num: 2, label: 'Маршрут', desc: 'Понимаешь, как устроен путь адаптации' },
    { num: 3, label: 'Чат-бот', desc: 'Учишься задавать вопросы ВИТШику' },
    { num: 4, label: 'Тест знаний', desc: 'Проверяешь, что уже знаешь о КГУ' },
    { num: 5, label: 'Чек-лист', desc: 'Отмечаешь важные дела первокурсника' },
    { num: 6, label: 'Карта кампуса', desc: 'Изучаешь планы этажей корпуса Б' }
  ];

  return (
    <div className="step-body">
      <p className="step-lead">Каждый этап — это шаг вперёд. Проходи их по порядку.</p>

      <ol className="list step-sequence">
        {steps.map((step) => (
          <li key={step.num} className="list-row step-sequence-item">
            <span className="step-sequence-num tabular" aria-hidden="true">{step.num}</span>
            <div>
              <span className="step-sequence-label">{step.label}</span>
              <span className="step-sequence-desc">{step.desc}</span>
            </div>
          </li>
        ))}
      </ol>

      <CompleteStepButton onComplete={onComplete} />
    </div>
  );
}

export function StepChatbot({ onComplete }) {
  return (
    <div className="step-body">
      <p className="step-lead">
        ВИТШик всегда на связи: твой ассистент знает всё про аудитории корпуса Б, расписание, стипендии
        и коворкинг.
      </p>

      <div className="chat-sample">
        <h3>Пример диалога</h3>
        <div className="chat-sample-thread">
          <div className="message user chat-sample-user">Где находится дирекция?</div>
          <div className="chat-sample-bot">
            <img src="/img/mascot.png" alt="" className="chat-sample-avatar" width="28" height="28" />
            <div className="message bot">
              <span className="visually-hidden">ВИТШик: </span>
              Дирекция ИВИТШ находится в корпусе Б на 2 этаже, кабинет Б-209. Работает пн–пт с 9:00 до 17:00.
            </div>
          </div>
        </div>
      </div>

      <CompleteStepButton onComplete={onComplete} />
    </div>
  );
}
