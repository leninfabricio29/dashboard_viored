// src/services/auth-service.ts
import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
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
  // ... otros campos si los necesitas
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  token: string;
  user: User
}

interface ResetPasswordData {
  email: string;
}

interface ResetPasswordResponse {
  message: string;
  newPassword: string;
}



const authService = {
  // Login de usuario
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/api/auth/login', credentials);
      console.log(response.data)
      // Guardar el token en localStorage para mantener la sesión
      const { user, token } = response.data;

      if (user.role === "admin" || user.role === "entity" || user.role === "son") {
        if (token) {
          localStorage.setItem('token', token);
        }
      }else{
        console.error('No puedes acceder a este panel de admin')
      }


      return response.data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  // Cerrar sesión (eliminar token)
  logout: (): void => {
    localStorage.removeItem('token');
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: (): boolean => {
    return localStorage.getItem('token') !== null;
  },

  // Obtener el token JWT
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Solicitar restablecimiento de contraseña
  resetPassword: async (data: ResetPasswordData): Promise<ResetPasswordResponse> => {
    try {
      const response = await api.post<ResetPasswordResponse>('/api/auth/reset-password', data);
      return response.data;
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      throw error;
    }
  },

  // Actualizar contraseña
  // auth-service.ts
  // auth-service.ts
  updatePassword: async (data: {
    email: string,
    currentPassword: string,
    newPassword: string
  }): Promise<{ message: string }> => {
    try {
      const response = await api.put<{ message: string }>('/api/auth/update-password', {
        email: data.email,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
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
      // Decodificar el token JWT (método simple)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id; // Asumiendo que el ID del usuario está en la propiedad "id" del payload
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      return null;
    }
  }


};

export default authService;