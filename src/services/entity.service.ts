import api from './api';
import { User } from '../types/user.types';


export const entityUsersService = {
    // Obtener todos los usuarios
    getSonUsers: async (id: string): Promise<User[]> => {
  try {
    const response = await api.get<User[]>(`/api/entity/${id}/sons`);
    console.log("ADA",response.data)
    return response.data; // Ya es un array
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}
};
