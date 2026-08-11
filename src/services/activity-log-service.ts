import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
}

export const getActivityLogs = async () => {
  try {
    const token = localStorage.getItem('token');

    const response = await api.get('/api/auditories/logs', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error al obtener los logs de actividad:', error);
    throw error;
  }
};


