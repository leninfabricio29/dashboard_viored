import api from './api';

export const getAllPackages = async () => {
    try {
      const response = await api.get(`/api/media/packages/list`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener los paquetes de imagenes:', error);
      throw error;
    }   
  };
  