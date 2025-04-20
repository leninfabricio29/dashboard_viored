import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import statisticsService, { EmergencyAlertStat } from '../../services/statis-service';

const TopEmergencyDaysChart: React.FC = () => {
  const [topDays, setTopDays] = useState<EmergencyAlertStat[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await statisticsService.getEmergencyAlertsByDate();
        const sorted = [...stats].sort((a, b) => b.count - a.count).slice(0, 5);
        const formatted = sorted.map(item => ({
            ...item,
            label: new Date(item._id).toLocaleDateString('es-EC', {
              weekday: 'long',
              day: 'numeric',
              month: 'short'
            })
          }));
          setTopDays(formatted);;
      } catch (error) {
        console.error('Error al obtener top días con más alertas');
      }
    };

    fetchData();
  }, []);

  return (
    <div className="w-full h-[300px]">
      <h3 className="text-xl font-semibold mb-4">Top 5 Días con Más Alertas</h3>
      <ResponsiveContainer width="100%" height="100%">
  <BarChart data={topDays}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis 
      dataKey="label" 
      tick={{ fontSize: 10 }}
      interval={0} 
    />
    <YAxis allowDecimals={false} />
    <Tooltip />
    <Bar dataKey="count" fill="#f97316" label={{ position: 'top', fontSize: 10 }} />
  </BarChart>
</ResponsiveContainer>

    </div>
  );
};

export default TopEmergencyDaysChart;
