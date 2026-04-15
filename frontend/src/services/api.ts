import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Criar instância do Axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Interceptor de requisição para adicionar token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Tipos de resposta da API
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Serviços de Autenticação
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string, passwordConfirmation: string) =>
    api.post('/auth/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    }),
  
  logout: () => api.post('/auth/logout'),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (email: string, password: string, passwordConfirmation: string, token: string) =>
    api.post('/auth/reset-password', {
      email,
      password,
      password_confirmation: passwordConfirmation,
      token,
    }),
  
  getUser: () => api.get('/user'),
};

// Serviços de Quadros
export const boardApi = {
  getAll: () => api.get('/boards'),
  
  getShared: () => api.get('/boards/shared'),
  
  getArchived: () => api.get('/boards/archived'),
  
  getById: (id: number) => api.get(`/boards/${id}`),
  
  create: (data: { title: string; description?: string; background?: string }) =>
    api.post('/boards', data),
  
  update: (id: number, data: { title?: string; description?: string; background?: string }) =>
    api.put(`/boards/${id}`, data),
  
  archive: (id: number) => api.put(`/boards/${id}/archive`),
  
  restore: (id: number) => api.put(`/boards/${id}/restore`),
  
  delete: (id: number) => api.delete(`/boards/${id}`),
};

// Serviços de Listas
export const listApi = {
  getByBoard: (boardId: number) => api.get(`/boards/${boardId}/lists`),
  
  create: (boardId: number, title: string) =>
    api.post(`/boards/${boardId}/lists`, { title }),
  
  update: (id: number, title: string) =>
    api.put(`/lists/${id}`, { title }),
  
  reorder: (id: number, position: number) =>
    api.put(`/lists/${id}/reorder`, { position }),
  
  delete: (id: number) => api.delete(`/lists/${id}`),
};

// Serviços de Cards
export const cardApi = {
  getByList: (listId: number) => api.get(`/lists/${listId}/cards`),

  getById: (id: number) => api.get(`/cards/${id}`),

  create: (listId: number, data: { title: string; description?: string; due_date?: string; label_ids?: number[] }) =>
    api.post(`/lists/${listId}/cards`, data),

  update: (id: number, data: { title?: string; description?: string; due_date?: string; label_ids?: number[] }) =>
    api.put(`/cards/${id}`, data),

  reorder: (id: number, position: number) =>
    api.put(`/cards/${id}/reorder`, { position }),

  move: (id: number, listId: number, position: number) =>
    api.put(`/cards/${id}/move`, { list_id: listId, position }),

  archive: (id: number) => api.put(`/cards/${id}/archive`),

  restore: (id: number) => api.put(`/cards/${id}/restore`),

  delete: (id: number) => api.delete(`/cards/${id}`),
};

// Serviços de Labels
export const labelApi = {
  getByBoard: (boardId: number) => api.get(`/boards/${boardId}/labels`),

  create: (boardId: number, data: { name: string; color: string }) =>
    api.post(`/boards/${boardId}/labels`, data),

  update: (id: number, data: { name?: string; color?: string }) =>
    api.put(`/labels/${id}`, data),

  delete: (id: number) => api.delete(`/labels/${id}`),
};

// Serviços de Checklist
export const checklistApi = {
  getByCard: (cardId: number) => api.get(`/cards/${cardId}/checklist`),

  create: (cardId: number, content: string) =>
    api.post(`/cards/${cardId}/checklist`, { content }),

  update: (id: number, data: { content?: string; is_checked?: boolean; position?: number }) =>
    api.put(`/checklist-items/${id}`, data),

  delete: (id: number) => api.delete(`/checklist-items/${id}`),
};

// Serviços de Comentários
export const commentApi = {
  getByCard: (cardId: number) => api.get(`/cards/${cardId}/comments`),
  
  create: (cardId: number, content: string) =>
    api.post(`/cards/${cardId}/comments`, { content }),
  
  update: (id: number, content: string) =>
    api.put(`/comments/${id}`, { content }),
  
  delete: (id: number) => api.delete(`/comments/${id}`),
};

// Serviços de Anexos
export const attachmentApi = {
  getByCard: (cardId: number) => api.get(`/cards/${cardId}/attachments`),
  
  upload: (cardId: number, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post(`/cards/${cardId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
  },
  
  download: (id: number) => 
    api.get(`/attachments/${id}/download`, { responseType: 'blob' }),
  
  delete: (id: number) => api.delete(`/attachments/${id}`),
};

// Serviços de Membros
export const memberApi = {
  getByBoard: (boardId: number) => api.get(`/boards/${boardId}/members`),
  
  add: (boardId: number, email: string, role?: string) =>
    api.post(`/boards/${boardId}/members`, { email, role }),
  
  updateRole: (boardId: number, memberId: number, role: string) =>
    api.put(`/boards/${boardId}/members/${memberId}/role`, { role }),
  
  remove: (boardId: number, memberId: number) =>
    api.delete(`/boards/${boardId}/members/${memberId}`),
};

export default api;