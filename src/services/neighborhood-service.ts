// src/services/neighborhood-service.ts
import api from './api';

// Interfaz para el modelo de barrio
export interface Neighborhood {
  _id: string;
  name: string;
  description?: string;
  area?: {
    type: string;
    coordinates: number[][][];
  };
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

// Interfaz para estadísticas de barrio
export interface NeighborhoodStats {
  _id: string;
  name: string;
  userCount: number;
}

const neighborhoodService = {
  // Obtener todos los barrios
  getAllNeighborhoods: async (): Promise<Neighborhood[]> => {
    try {
      const response = await api.get('/neighborhood/all-neighborhood');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      throw error;
    }
  },

  // Obtener barrio por ID
  getNeighborhoodById: async (id: string): Promise<Neighborhood> => {
    try {
      const response = await api.get(`/neighborhoods/${id}`);
      return response.data.neighborhood;
    } catch (error) {
      console.error(`Error fetching neighborhood ${id}:`, error);
      throw error;
    }
  },

  // Crear un nuevo barrio
  createNeighborhood: async (neighborhoodData: Partial<Neighborhood>): Promise<Neighborhood> => {
    try {
      const response = await api.post('/neighborhoods/register', neighborhoodData);
      return response.data.neighborhood;
    } catch (error) {
      console.error('Error creating neighborhood:', error);
      throw error;
    }
  },

  // Eliminar un barrio
  deleteNeighborhood: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/neighborhood/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting neighborhood ${id}:`, error);
      throw error;
    }
  },

  // Obtener usuarios de un barrio
  getNeighborhoodUsers: async (id: string): Promise<any[]> => {
    try {
      const response = await api.get(`/neighborhood/${id}/users`);
      return response.data.users;
    } catch (error) {
      console.error(`Error fetching users for neighborhood ${id}:`, error);
      throw error;
    }
  },

  // Agregar usuario a un barrio
  addUserToNeighborhood: async (neighborhoodId: string, userId: string): Promise<boolean> => {
    try {
      await api.post(`/neighborhood/${neighborhoodId}/users`, { userId });
      return true;
    } catch (error) {
      console.error(`Error adding user to neighborhood:`, error);
      throw error;
    }
  },

  // Eliminar usuario de un barrio
  removeUserFromNeighborhood: async (neighborhoodId: string, userId: string): Promise<boolean> => {
    try {
      await api.delete(`/neighborhood/${neighborhoodId}/users/${userId}`);
      return true;
    } catch (error) {
      console.error(`Error removing user from neighborhood:`, error);
      throw error;
    }
  },

  // Obtener estadísticas de barrios
  getNeighborhoodStats: async (): Promise<NeighborhoodStats[]> => {
    try {
      const response = await api.get('/neighborhood/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching neighborhood stats:', error);
      throw error;
    }
  }
};

export default neighborhoodService;