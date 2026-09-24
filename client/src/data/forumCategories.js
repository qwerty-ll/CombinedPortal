// Forum categories get a steady hue so a topic is recognisable at a glance (see .badge-hue).
const CATEGORY_HUE = {
  'Учеба': 'blue',
  'Расписание': 'violet',
  'Общежитие': 'orange',
  'Стипендия': 'green',
  'Организационное': 'slate',
  'Жизнь': 'pink',
};

export const categoryBadgeClass = (category) =>
  CATEGORY_HUE[category] ? `badge badge-hue hue-${CATEGORY_HUE[category]}` : 'badge';
