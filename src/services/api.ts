import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

export const courseApi = {
  getAll: (params?: any) => api.get('/courses', { params }),
  getById: (id: number | string) => api.get(`/courses/${id}`),
  create: (data: any) => api.post('/courses', data),
  update: (id: number | string, data: any) => api.patch(`/courses/${id}`, data),
  delete: (id: number | string) => api.delete(`/courses/${id}`),
  enroll: (courseId: number | string, studentId?: number | string) => api.post(`/courses/${courseId}/enrollments`, { student_id: studentId }),
  unenroll: (courseId: number | string, studentId: number | string) => api.delete(`/courses/${courseId}/enrollments/${studentId}`)
};

export const assignmentApi = {
  getAll: (params?: any) => api.get('/assignments', { params }),
  getById: (id: number | string) => api.get(`/assignments/${id}`),
  create: (data: any) => api.post('/assignments', data),
  update: (id: number | string, data: any) => api.patch(`/assignments/${id}`, data),
  delete: (id: number | string) => api.delete(`/assignments/${id}`),
  uploadAttachment: (id: number | string, formData: FormData) =>
    api.post(`/assignments/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
};

export const submissionApi = {
  submit: (assignmentId: number | string, formData: FormData) =>
    api.post(`/submissions/assignments/${assignmentId}/submissions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getMySubmissions: () => api.get('/submissions/mine'),
  getAssignmentSubmissions: (assignmentId: number | string, params?: any) =>
    api.get(`/submissions/assignments/${assignmentId}/submissions`, { params }),
  getById: (id: number | string) => api.get(`/submissions/${id}`),
  downloadUrl: (submissionId: number | string, fileId: number | string) =>
    `/api/submissions/${submissionId}/files/${fileId}`
};

export const gradeApi = {
  saveGrade: (submissionId: number | string, data: { marks_obtained: number; feedback?: string; publish?: boolean }) =>
    api.post(`/grades/submissions/${submissionId}/grade`, data),
  publishGrade: (submissionId: number | string) =>
    api.post(`/grades/submissions/${submissionId}/grade/publish`),
  getMyGrades: () => api.get('/grades/mine')
};

export const userApi = {
  getMe: () => api.get('/users/me'),
  updateProfile: (data: any) => api.patch('/users/me', data)
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getActivity: () => api.get('/admin/activity'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUserStatus: (id: number | string, is_active: boolean) => api.patch(`/admin/users/${id}/status`, { is_active }),
  bootstrapAdmin: (data: any) => api.post('/admin/bootstrap', data)
};

export const systemApi = {
  getHealth: () => api.get('/health'),
  getDocs: () => api.get('/docs')
};

export default api;
