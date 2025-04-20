// src/pages/modules/Statistics/StatisticsPage.tsx
import React from 'react';
import NeighborhoodStatsChart from '../../../components/statistics/NeighborhoodStatsChart';
import EmergencyAlertsChart from '../../../components/statistics/EmergencyAlertsChart';
import EmergencyTotalCard from '../../../components/statistics/EmergencyTotalCard';
import TopEmergencyDaysChart from '../../../components/statistics/TopEmergencyDaysChart';
import ButtonIndicator from '../../../components/UI/ButtonIndicator';
import ButtonHome from '../../../components/UI/ButtonHome';

const StatisticsPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
    <ButtonIndicator></ButtonIndicator>
    <div className="p-6 max-w-6xl mx-auto">
  <h1 className="text-2xl font-bold mb-6">Estadísticas del Sistema</h1>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Total de emergencias */}
    <div className="bg-white p-4 rounded shadow">
      <EmergencyTotalCard />
    </div>

    {/* Línea de tiempo */}
    <div className="bg-white p-4 rounded shadow">
      <EmergencyAlertsChart />
    </div>

    {/* Clientes por barrio */}
    <div className="bg-white p-4 rounded shadow">
      <NeighborhoodStatsChart />
    </div>

    {/* Top 5 días */}
    <div className="bg-white p-4 rounded shadow">
      <TopEmergencyDaysChart />
    </div>
  </div>
</div>
  
  <ButtonHome></ButtonHome>


</div>

  );
};

export default StatisticsPage;
