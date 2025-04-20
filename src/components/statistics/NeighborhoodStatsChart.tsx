import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

import neighborhoodService from '../../services/neighborhood-service';

interface NeighborhoodStat {
  _id: string;
  userCount: number;
  name: string;
}

const NeighborhoodStatsChart: React.FC = () => {
  const [data, setData] = useState<NeighborhoodStat[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const stats = await neighborhoodService.getNeighborhoodStats();
      setData(stats);
    };

    fetchData();
  }, []);

  return (
    <div style={{ width: '100%', height: 400 }}>
      <h3 className="text-xl font-semibold mb-4">Clientes por Barrio</h3>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="userCount" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NeighborhoodStatsChart;
