import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear auth and redirect to login
      useAuthStore.getState().logout();
      window.location.href = '/login';
      
      return Promise.reject(error);
    }
    
    // Handle other errors
    if (error.response) {
      const message = error.response.data?.error || 'An error occurred';
      
      // Don't show toast for cancelled requests
      if (error.code !== 'ECONNABORTED') {
        toast.error(message);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  refreshToken: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
};

// Downloads API endpoints
export const downloadsAPI = {
  add: (data) => api.post('/downloads', data),
  getAll: (params) => api.get('/downloads', { params }),
  get: (id) => api.get(`/downloads/${id}`),
  update: (id, data) => api.patch(`/downloads/${id}`, data),
  delete: (id) => api.delete(`/downloads/${id}`),
  retry: (id) => api.post(`/downloads/${id}/retry`),
  pause: (id) => api.post(`/downloads/${id}/pause`),
  resume: (id) => api.post(`/downloads/${id}/resume`),
  getStats: () => api.get('/downloads/stats'),
};

// Categories API endpoints
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  getStats: () => api.get('/categories/stats'),
};

// Admin API endpoints
export const adminAPI = {
  // User management
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (userId) => api.get(`/admin/users/${userId}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (userId, data) => api.patch(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  resetUserPassword: (userId, data) => api.post(`/admin/users/${userId}/reset-password`, data),
  getUserDownloads: (userId, params) => api.get(`/admin/users/${userId}/downloads`, { params }),
  
  // System stats
  getStats: () => api.get('/admin/stats'),
  getSystemInfo: () => api.get('/admin/system'),
  getLogs: (params) => api.get('/admin/logs', { params }),
  
  // Real-Debrid management
  validateApiKey: (apiKey) => api.post('/admin/validate-api-key', { apiKey }),
  getHostsStatus: () => api.get('/admin/hosts-status'),
};

// Helper function to handle file downloads
export const downloadFile = async (url, filename) => {
  try {
    const response = await axios.get(url, {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().token}`,
      },
    });
    
    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    toast.error('Failed to download file');
    throw error;
  }
};

// Helper function for uploading files
export const uploadFile = async (endpoint, file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: onProgress ? (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      onProgress(percentCompleted);
    } : undefined,
  });
};

export default api;