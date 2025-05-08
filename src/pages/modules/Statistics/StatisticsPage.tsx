// src/pages/modules/Statistics/StatisticsPage.tsx
import React from "react";
import NeighborhoodStatsChart from "../../../components/statistics/NeighborhoodStatsChart";
import EmergencyAlertsChart from "../../../components/statistics/EmergencyAlertsChart";
import EmergencyTotalCard from "../../../components/statistics/EmergencyTotalCard";
import TopEmergencyDaysChart from "../../../components/statistics/TopEmergencyDaysChart";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import ButtonHome from "../../../components/UI/ButtonHome";

const StatisticsPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
     <div className="flex justify-between items-center mb-6">
  <ButtonIndicator />
  <ButtonHome />
</div>


      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Estadísticas del Sistema</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
          {/* Total de emergencias */}
          <div className="p-4 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all hover:shadow-lg">
            <EmergencyTotalCard />
          </div>

          {/* Línea de tiempo */}
          <div className="p-4 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all hover:shadow-lg">
            <EmergencyAlertsChart />
          </div>

          {/* Clientes por barrio */}
          <div className="p-4 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all hover:shadow-lg">
            <NeighborhoodStatsChart />
          </div>

          {/* Top 5 días */}
          <div className="p-4 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all hover:shadow-lg">
            <TopEmergencyDaysChart />
          </div>
        </div>
      </div>

    </div>
  );
};

export default StatisticsPage;
