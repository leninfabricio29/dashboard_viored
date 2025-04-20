import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';
import statisticsService, { EmergencyAlertStat } from '../../services/statis-service';

const EmergencyAlertsChart: React.FC = () => {
  const [data, setData] = useState<EmergencyAlertStat[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await statisticsService.getEmergencyAlertsByDate();
        setData(stats);
      } catch (error) {
        console.error('Error al cargar las estadísticas de emergencias');
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ width: '100%', height: 300 }}>
      <h3 className="text-xl font-semibold mb-4">Alertas de Emergencia por Día</h3>
      <ResponsiveContainer width="100%" height="100%">
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
    <YAxis allowDecimals={false} />
    <Tooltip />
    <Line type="monotone" dataKey="count" stroke="#f87171" strokeWidth={2} label={{ fontSize: 10 }} />
  </LineChart>
</ResponsiveContainer>

    </div>
  );
};

export default EmergencyAlertsChart;
