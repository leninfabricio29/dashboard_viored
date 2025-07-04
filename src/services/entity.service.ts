import api from './api';
import { User } from '../types/user.types';
import { CreateUserInput } from "../types/user.types";



export const entityUsersService = {
  // Obtener todos los usuarios
  getSonUsers: async (id: string): Promise<User[]> => {
    try {
      const response = await api.get<User[]>(`/api/entity/${id}/sons`);
      console.log("ADA", response.data)
      return response.data; // Ya es un array
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
  ,
   createSonUser: async (
  entityId: string,
  userData: CreateUserInput
): Promise<User> => {
  const response = await api.post<{ user: User }>(`/api/entity/son`, {
    entityId,
    userData,
  });

  return response.data.user;
}


};



