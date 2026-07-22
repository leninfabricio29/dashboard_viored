// src/services/auth-service.ts
import api from './api';

export interface Permission {
  _id: string;
  module: Module;
  name: string;
}

export interface Module {
  _id: string;
  name: string;
  icon: string;
  route: string;
}

export interface Role {
  name: string;
  permissions?: Permission[];
  _id: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  ci: string;
  avatar: string;
  neighborhood: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLocation: {
    type: string;
    coordinates: number[];
    lastUpdated: string;
  };
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  token: string;
  user: User;
  entidadId: string | null;
}

interface ResetPasswordData {
  email: string;
}

interface ResetPasswordResponse {
  message: string;
  newPassword: string;
}

const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/api/auth/login', credentials);
      const { user, token } = response.data;
      if (token) {
        localStorage.setItem('token', token);
        console.log("user", user)
      }
      return response.data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  logout: (): void => {
    localStorage.clear();
  },

  isAuthenticated: (): boolean => {
    return localStorage.getItem('token') !== null;
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  resetPassword: async (data: ResetPasswordData): Promise<ResetPasswordResponse> => {
    try {
      const response = await api.post<ResetPasswordResponse>('/api/auth/reset-password', data);
      return response.data;
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      throw error;
    }
  },

  updatePassword: async (data: {
    email: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    try {
      const response = await api.put<{ message: string }>('/api/auth/update-password', {
        email: data.email,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      throw error;
    }
  },

  getUserIdFromToken: (): string | null => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || null;
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      return null;
    }
  },

  getEntityIdFromToken: (): string | null => {
    const storedEntityId = localStorage.getItem('entity_sonId');
    if (storedEntityId) return storedEntityId;

    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.entityId || null;
    } catch (error) {
      console.error('Error al obtener ID de entidad:', error);
      return null;
    }
  },
};

export default authService;
