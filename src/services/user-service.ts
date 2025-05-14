// src/services/userService.ts
import api from './api';
import { User, UsersResponse } from '../types/user.types';

interface UpdateUserData {
  email?: string;
  phone?: string;
  avatar?: string;
}

export const userService = {
  // Obtener todos los usuarios
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get<UsersResponse>('/api/users');
      return response.data.users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Obtener un usuario por ID
  getUserById: async (id: string): Promise<User> => {
    try {
      const response = await api.get<User>(`/api/users/${id}`);
      return response.data; // Ya no necesitas acceder a .user
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },



  // Eliminar un usuario
  deleteUser: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/api/users/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  },

  validateUser: async (userId: string, type_suscription: string): Promise<boolean> => {
    try {
      const response = await api.post('/api/users/validate', {
        newuserId: userId,
        type_suscription,
      }); return response.status === 200
    } catch (error) {
      console.error(`Error al validar usuario ${userId}:`, error)
      throw error
    }
  },

  updateUser: async (userId: string, data: UpdateUserData): Promise<{ 
    message: string; 
    user: { email: string; phone: string; avatar: string } 
  }> => {
    try {
      const response = await api.put(`/api/users/${userId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }
};

export default userService;