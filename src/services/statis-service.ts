import api from './api';

export interface EmergencyAlertStat {
  _id: string; // fecha YYYY-MM-DD
  count: number;
}

const statisticsService = {
  getEmergencyAlertsByDate: async (): Promise<EmergencyAlertStat[]> => {
    try {
      const response = await api.get('/api/panic/stats-emergencias');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching emergency alerts stats:', error);
      throw error;
    }
  }
};

export default statisticsService;
