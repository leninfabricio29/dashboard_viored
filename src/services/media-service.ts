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

export const createPackage = async (data) => {
  try {
    const response = await api.post(`/api/media/packages`, data);
    return response.data;
  } catch (error) {
    console.error('Error al crear el paquete de imagenes:', error);
    throw error;
  }
};

export const getImages = async () => {
  try {
    const response = await api.get(`/api/media/images`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener las imagenes del paquete:', error);
    throw error;
  }
}


