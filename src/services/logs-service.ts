// src/services/logsService.js
import api from './api';

const getlogsAdmin = async () => {
  try {
    const response = await api.get('/api/auditories/logs');
    return response.data;
  } catch (error) {
    console.error('Error al obtener los logs:', error);
    throw error;
  }
};

const logsService = {
  getlogsAdmin,
};

export default logsService;
