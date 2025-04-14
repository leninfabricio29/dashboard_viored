// src/services/auth-service.ts
import api from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  token: string;
}

interface ResetPasswordData {
  email: string;
}

interface ResetPasswordResponse {
  message: string;
  newPassword: string;
}

interface UpdatePasswordData {
  email: string;
  currentPassword: string;
  newPassword: string;
}

const authService = {
  // Login de usuario
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      
      // Guardar el token en localStorage para mantener la sesión
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
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
      const response = await api.post<ResetPasswordResponse>('/auth/reset-password', data);
      return response.data;
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      throw error;
    }
  },

  // Actualizar contraseña
  updatePassword: async (data: UpdatePasswordData): Promise<{ message: string }> => {
    try {
      const response = await api.put<{ message: string }>('/auth/update-password', data);
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