import api from './api';
import { User } from '../types/user.types';
import { CreateUserInput, CreateEntityInput, Entity} from "../types/user.types";



export const entityUsersService = {
  // Obtener todos los usuarios
  getEntytiesAll: async (): Promise<User[]> => {
    try {
      const response = await api.get<User[]>('/api/entity');
      return response.data;
    } catch (error) {
      console.error('Error fetching entities:', error);
      throw error;
    }
  },
  createEntity: async (userData: CreateEntityInput): Promise<User> => {
  try {
    const response = await api.post<User>('/api/entity/create',  userData );
    return response.data; // ← directamente el usuario
  } catch (error) {
    console.error('Error creating entity:', error);
    throw error;
  }
},

 getEntityById : async (id: string): Promise<Entity> => {
  try {
    const response = await api.get<Entity>(`/api/entity/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener la entidad:', error);
    throw error;
  }
},

  getSonUsers: async (id: string): Promise<User[]> => {
    try {
      const response = await api.get<User[]>(`/api/entity/${id}/sons`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  createSonUser: async (
    entityId: string,
    userData: CreateUserInput
  ): Promise<User> => {
    const response = await api.post<{ user: User }>(`/api/entity/son`, {
      entityId,
      userData,
    });

    return response.data.user;
  },

  changeStatusSonUser: async (
    userId: string,
    isActive: boolean
  ): Promise<User> => {
    const response = await api.post<{ user: User }>(`/api/entity/son/status/`, {
      userId,
      isActive,
    });

    return response.data.user;
  },

  acceptPetition: async (userId: string, entityId: string) => {
    try {
      const response = await api.post<Entity>(`/api/entity/suscribe`, {
        userId,
        entityId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updateEntityStatus: async (id: string, isActive: boolean): Promise<Entity> => {
  try {
    const response = await api.put<Entity>(`/api/entity/${id}`, {
      isActive
    });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar el estado de la entidad:", error);
    throw error;
  }
},

  /**
   * Atender una alerta de pánico
   * NOTA: Ahora esto encola un job en attendQueue (no es Socket.IO directo)
   */
  attendAlert: async (alertId: string, userId: string, recipientId: string): Promise<any> => {
    try {
      const response = await api.post('/api/alert/attend', {
        alertId,
        userId,
        recipientId,
      });
      console.log('✅ Alerta atendida:', response.data);
      return response.data;
    } catch (error) {
      console.error("Error al atender la alerta:", error);
      throw error;
    }
  },
};
