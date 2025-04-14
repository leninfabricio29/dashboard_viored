// src/services/userService.ts
import api from './api';
import { User, UsersResponse } from '../types/user.types';

export const userService = {
  // Obtener todos los usuarios
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get<UsersResponse>('/users');
      return response.data.users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

 // Obtener un usuario por ID
getUserById: async (id: string): Promise<User> => {
    try {
      const response = await api.get<User>(`/users/${id}`);
      return response.data; // Ya no necesitas acceder a .user
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },

 

  // Eliminar un usuario
  deleteUser: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/users/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
};

export default userService;