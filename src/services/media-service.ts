import api from './api';

interface Package {
  
}

export const getAllPackages = async () => {
  try {
    const response = await api.get(`/api/media/packages/list`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener los paquetes de imagenes:', error);
    throw error;
  }
};

export const createPackage = async (data:any) => {
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

export const activatePackage = async (packageId: string): Promise<Package> => {
  try {
    const response = await api.put(`/api/media/packages/${packageId}/activate`);
    return response.data;
  } catch (error) {
    console.error('Error al activar el paquete:', error);
    throw error;
  }
};

export const uploadImages = async (formData: FormData, packageId: string): Promise<any> => {
  try {
    const response = await api.post(`/api/media/packages/${packageId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al subir las imagenes:', error);
    throw error;
  }
};