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
      credentials: 'include',
      ...options,
      headers,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Ошибка сервера: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API] Error for ${endpoint}:`, err.message);
    throw err;
  }
};

// Auth Services
export const authApi = {
  // FIX: Removed authApi.login() — endpoint /api/v1/auth/login does not exist.
  // Use authApi.eiosLogin() for student login or authApi.adminLogin() for admins.
  eiosLogin: (username, password, groupNumber = '') =>
    apiFetch('/api/v1/auth/eios-login', { method: 'POST', body: JSON.stringify({ username, password, group_number: groupNumber }) }),
  sdoLogin: (username, password, groupNumber = '') =>
    apiFetch('/api/v1/auth/eios-login', { method: 'POST', body: JSON.stringify({ username, password, group_number: groupNumber }) }),
  adminLogin: (username, password) =>
    apiFetch('/api/v1/auth/admin-login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () =>
    apiFetch('/api/v1/auth/logout', { method: 'POST' }),
  register: (userData) =>
    apiFetch('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () =>
    apiFetch('/api/v1/auth/me'),
};

// Forum Services
export const forumApi = {
  getQuestions: (category = '', search = '', limit = 50, offset = 0) => {
    const query = new URLSearchParams({ limit, offset });
    if (category) query.append('category', category);
    if (search) query.append('search', search);
    return apiFetch(`/api/v1/forum/questions?${query.toString()}`);
  },
  createQuestion: (data) =>
    apiFetch('/api/v1/forum/questions', { method: 'POST', body: JSON.stringify(data) }),
  getQuestionDetail: (id) =>
    apiFetch(`/api/v1/forum/questions/${id}`),
  getAnswers: (id) =>
    apiFetch(`/api/v1/forum/questions/${id}/answers`),
  postAnswer: (id, text) =>
    apiFetch(`/api/v1/forum/questions/${id}/answers`, { method: 'POST', body: JSON.stringify({ content: text }) }),
  vote: (id, voteType) =>
    apiFetch(`/api/v1/forum/questions/${id}/vote`, { method: 'POST', body: JSON.stringify({ vote_type: voteType }) }),
  deleteQuestion: (id) =>
    apiFetch(`/api/v1/forum/questions/${id}`, { method: 'DELETE' }),
};

// Admin Services (single consolidated object — no duplicates)
export const adminApi = {
  // Users
  getUsers: (limit = 100, offset = 0) =>
    apiFetch(`/api/v1/admin/users?limit=${limit}&offset=${offset}`),
  updateUserRole: (userId, role) =>
    apiFetch(`/api/v1/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),

  // Teachers
  getTeachers: () => apiFetch('/api/v1/teachers'),
  createTeacher: (data) =>
    apiFetch('/api/v1/admin/teachers', { method: 'POST', body: JSON.stringify(data) }),
  deleteTeacher: (id) =>
    apiFetch(`/api/v1/admin/teachers/${id}`, { method: 'DELETE' }),

  // Announcements
  getAnnouncements: () => apiFetch('/api/v1/announcements'),
  createAnnouncement: (data) =>
    apiFetch('/api/v1/admin/announcements', { method: 'POST', body: JSON.stringify(data) }),
  updateAnnouncement: (id, data) =>
    apiFetch(`/api/v1/admin/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnouncement: (id) =>
    apiFetch(`/api/v1/admin/announcements/${id}`, { method: 'DELETE' }),

  // FAQ
  getFaq: () => apiFetch('/api/v1/faq'),
  createFaq: (data) =>
    apiFetch('/api/v1/admin/faq', { method: 'POST', body: JSON.stringify(data) }),
  updateFaq: (id, data) =>
    apiFetch(`/api/v1/admin/faq/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFaq: (id) =>
    apiFetch(`/api/v1/admin/faq/${id}`, { method: 'DELETE' }),

  // Subjects
  getSubjects: () => apiFetch('/api/v1/subjects'),
  createSubject: (data) =>
    apiFetch('/api/v1/admin/subjects', { method: 'POST', body: JSON.stringify(data) }),
  updateSubject: (id, data) =>
    apiFetch(`/api/v1/admin/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubject: (id) =>
    apiFetch(`/api/v1/admin/subjects/${id}`, { method: 'DELETE' }),
};

// Convenience re-exports for components that import subjectsApi / teachersApi directly
// They delegate to adminApi to keep a single source of truth.
export const subjectsApi = {
  getSubjects: () => adminApi.getSubjects(),
  createSubject: (data) => adminApi.createSubject(data),
  updateSubject: (id, data) => adminApi.updateSubject(id, data),
  deleteSubject: (id) => adminApi.deleteSubject(id),
};

export const teachersApi = {
  getTeachers: () => adminApi.getTeachers(),
  createTeacher: (data) => adminApi.createTeacher(data),
  deleteTeacher: (id) => adminApi.deleteTeacher(id),
};

// Chatbot Services
export const chatApi = {
  sendMessage: (message, history) =>
    apiFetch('/api/v1/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
  getTopQuestions: () =>
    apiFetch('/api/v1/chat/top-questions'),
};

// Schedule EIOS Services
export const scheduleApi = {
  getYears: () =>
    apiFetch('/api/v1/schedule/years'),
  getGroups: (year = '2025-2026') =>
    apiFetch(`/api/v1/schedule/groups?year=${encodeURIComponent(year)}`),
  getTeachers: (year = '2025-2026') =>
    apiFetch(`/api/v1/schedule/teachers?year=${encodeURIComponent(year)}`),
  getAuditories: (year = '2025-2026') =>
    apiFetch(`/api/v1/schedule/auditories?year=${encodeURIComponent(year)}`),
  getSchedule: (idGroup = null, year = '2025-2026', sdate = '', idTeacher = null, idAud = null) => {
    const query = new URLSearchParams({ year });
    if (idGroup) query.append('idGroup', idGroup);
    if (idTeacher) query.append('idTeacher', idTeacher);
    if (idAud) query.append('idAud', idAud);
    if (sdate) query.append('sdate', sdate);
    return apiFetch(`/api/v1/schedule/rasp?${query.toString()}`);
  }
};
