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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <ButtonIndicator />
        <ButtonHome />
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex justify-between items-center mb-8 mt-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">
              Estadisticas de la aplicación
            </h1>
            <div className="flex items-center text-slate-500">
              <span>Revisa las acciones realizadas en la aplicación </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
          {/* Total de emergencias */}
          <div className="p-4 bg-white rounded-xl shadow-sm transition-all hover:shadow-slate-500 duration-300 hover:shadow-lg hover:-translate-y-1 
        border border-gray-100">
            <EmergencyTotalCard />
          </div>

          {/* Línea de tiempo */}
          <div className="p-4 bg-white rounded-xl shadow-sm transition-all hover:shadow-slate-500 duration-300 hover:shadow-lg hover:-translate-y-1 
        border border-gray-100">
            <EmergencyAlertsChart />
          </div>

          {/* Clientes por barrio */}
          <div className="p-4 bg-white rounded-xl shadow-sm transition-all hover:shadow-slate-500 duration-300 hover:shadow-lg hover:-translate-y-1 
        border border-gray-100">
            <NeighborhoodStatsChart />
          </div>

          {/* Top 5 días */}
          <div className="p-4 bg-white rounded-xl shadow-sm transition-all hover:shadow-slate-500 duration-300 hover:shadow-lg hover:-translate-y-1 
        border border-gray-100">
            <TopEmergencyDaysChart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
