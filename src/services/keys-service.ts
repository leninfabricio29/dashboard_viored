import api from './api';

export interface ApiKey {
  _id: string;
  name: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}


export const keysService = {

  getAllKeys: async (): Promise<ApiKey[]> => {
    try {
      const response = await api.get<{ keys: ApiKey[] }>('/api/keys');
      return response.data.keys;
    } catch (error) {
      console.error('Error al obtener las llaves:', error);
      throw error;
    }
  },

  createKey: async (data: { name: string; expires: string }): Promise<any> => {
    try {
      const response = await api.post('/api/keys/create', {
        name: data.name,
        expires: data.expires
      });
      return response.data;
    } catch (error) {
      console.error('Error al crear la llave:', error);
      throw error;
    }
  }

};
