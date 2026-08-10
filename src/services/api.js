// Unified API Client for FastAPI backend & Vercel serverless
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('portal_jwt_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Ошибка сервера: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API] Fallback for ${endpoint}:`, err.message);
    throw err;
  }
};

// Auth Services
export const authApi = {
  login: (username, password) => apiFetch('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (userData) => apiFetch('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => apiFetch('/api/v1/auth/me'),
};

// Forum Services
export const forumApi = {
  getQuestions: (category = '', search = '') => {
    const query = new URLSearchParams();
    if (category) query.append('category', category);
    if (search) query.append('search', search);
    return apiFetch(`/api/v1/forum/questions?${query.toString()}`);
  },
  createQuestion: (data) => apiFetch('/api/v1/forum/questions', { method: 'POST', body: JSON.stringify(data) }),
  getQuestionDetail: (id) => apiFetch(`/api/v1/forum/questions/${id}`),
  getAnswers: (id) => apiFetch(`/api/v1/forum/questions/${id}/answers`),
  postAnswer: (id, text) => apiFetch(`/api/v1/forum/questions/${id}/answers`, { method: 'POST', body: JSON.stringify({ content: text }) }),
  vote: (id, voteType) => apiFetch(`/api/v1/forum/questions/${id}/vote`, { method: 'POST', body: JSON.stringify({ vote_type: voteType }) }),
};

// Admin Services
export const adminApi = {
  getTeachers: () => apiFetch('/api/v1/teachers'),
  createTeacher: (data) => apiFetch('/api/v1/admin/teachers', { method: 'POST', body: JSON.stringify(data) }),
  deleteTeacher: (id) => apiFetch(`/api/v1/admin/teachers/${id}`, { method: 'DELETE' }),

  getAnnouncements: () => apiFetch('/api/v1/announcements'),
  createAnnouncement: (data) => apiFetch('/api/v1/admin/announcements', { method: 'POST', body: JSON.stringify(data) }),
  deleteAnnouncement: (id) => apiFetch(`/api/v1/admin/announcements/${id}`, { method: 'DELETE' }),

  getFaq: () => apiFetch('/api/v1/faq'),
  createFaq: (data) => apiFetch('/api/v1/admin/faq', { method: 'POST', body: JSON.stringify(data) }),
  deleteFaq: (id) => apiFetch(`/api/v1/admin/faq/${id}`, { method: 'DELETE' }),
};

// Chatbot Services
export const chatApi = {
  sendMessage: (message, history) => apiFetch('/api/v1/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
  getTopQuestions: () => apiFetch('/api/v1/chat/top-questions'),
};

// Schedule EIOS Services
export const scheduleApi = {
  getYears: () => apiFetch('/api/v1/schedule/years'),
  getGroups: (year = '2025-2026') => apiFetch(`/api/v1/schedule/groups?year=${encodeURIComponent(year)}`),
  getTeachers: (year = '2025-2026') => apiFetch(`/api/v1/schedule/teachers?year=${encodeURIComponent(year)}`),
  getAuditories: (year = '2025-2026') => apiFetch(`/api/v1/schedule/auditories?year=${encodeURIComponent(year)}`),
  getSchedule: (idGroup, year = '2025-2026', sdate = '') => {
    const query = new URLSearchParams({ year });
    if (idGroup) query.append('idGroup', idGroup);
    if (sdate) query.append('sdate', sdate);
    return apiFetch(`/api/v1/schedule/rasp?${query.toString()}`);
  }
};
