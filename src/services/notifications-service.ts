import api from './api';

export const getAllNotifications = async (userId: string) => {
  try {
    const response = await api.get(`/api/notify/all/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    throw error;
  }
};

export const getNotificationById = async (notificationId: string) => {
  try {
    const response = await api.get(`/api/notify/some/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener el detalle de la notificación:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const response = await api.post(`/api/notify/readCheck/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    throw error;
  }
};