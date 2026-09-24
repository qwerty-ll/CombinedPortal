import {
  LayoutDashboard, Compass, MessageSquare, Map, Users, HelpCircle, UserSquare, Shield
} from 'lucide-react';

// One place for every section's name, route, icon and wayfinding hue.
// The hue only colors the section's icon tile (see .tile and .hue-* in shared.css).
export const SECTIONS = {
  dashboard: { label: 'Главная', short: 'Главная', path: '/', Icon: LayoutDashboard, hue: 'blue' },
  guide: { label: 'Путь первокурсника', short: 'Путь', path: '/guide', Icon: Compass, hue: 'orange', hint: '9 этапов адаптации' },
  forum: { label: 'Форум', short: 'Форум', path: '/forum', Icon: MessageSquare, hue: 'violet', hint: 'Спросить сокурсников' },
  map: { label: 'Карта кампуса', short: 'Карта', path: '/map', Icon: Map, hue: 'green', hint: 'Найти аудиторию' },
  teachers: { label: 'Преподаватели', short: 'Преподаватели', path: '/teachers', Icon: Users, hue: 'pink', hint: 'Кабинеты и почта' },
  faq: { label: 'Вопросы и ответы', short: 'FAQ', path: '/faq', Icon: HelpCircle, hue: 'amber', hint: 'Частые вопросы' },
  profile: { label: 'Личный кабинет', short: 'Профиль', path: '/profile', Icon: UserSquare, hue: 'cyan' },
  admin: { label: 'Панель управления', short: 'Админка', path: '/admin', Icon: Shield, hue: 'slate' },
};

export const NAV_ORDER = ['dashboard', 'guide', 'forum', 'map', 'teachers', 'faq', 'profile'];

// Mobile bottom bar: the sections students open most; the rest stay in the menu.
export const TAB_BAR_ORDER = ['dashboard', 'guide', 'forum', 'map', 'profile'];
