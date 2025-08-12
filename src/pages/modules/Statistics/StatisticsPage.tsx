// src/pages/modules/Statistics/StatisticsPage.tsx
import React from "react";
import NeighborhoodStatsChart from "../../../components/statistics/NeighborhoodStatsChart";
import EmergencyAlertsChart from "../../../components/statistics/EmergencyAlertsChart";
import EmergencyTotalCard from "../../../components/statistics/EmergencyTotalCard";
import TopEmergencyDaysChart from "../../../components/statistics/TopEmergencyDaysChart";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import ButtonHome from "../../../components/UI/ButtonHome";
import Carousel from "../../../components/UI/Carousel";

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
              Estadísticas de la aplicación
            </h1>
            <div className="flex items-center text-slate-500">
              <span>Revisa las acciones realizadas en la aplicación </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-0 w-full max-w-full">
        <Carousel>
          {/* Total de emergencias */}
          <section className="p-8 bg-white rounded-2xl shadow-lg border border-indigo-100 flex flex-col gap-2 w-full min-h-[420px] justify-center">
            <h2 className="text-2xl font-bold text-slate-700 mb-2">Total de Emergencias</h2>
            <p className="text-slate-400 mb-4">Cantidad total de emergencias registradas en la plataforma.</p>
            <EmergencyTotalCard />
          </section>

          {/* Línea de tiempo */}
          <section className="p-8 bg-white rounded-2xl shadow-lg border border-indigo-100 flex flex-col gap-2 w-full min-h-[420px] justify-center">
            <EmergencyAlertsChart />
          </section>

          {/* Clientes por barrio */}
          <section className="p-8 bg-white rounded-2xl shadow-lg border border-indigo-100 flex flex-col gap-2 w-full min-h-[420px] justify-center">
           <NeighborhoodStatsChart />
          </section>

          {/* Top 5 días */}
          <section className="p-8 bg-white rounded-2xl shadow-lg border border-indigo-100 flex flex-col gap-2 w-full min-h-[420px] justify-center">
         <TopEmergencyDaysChart />
          </section>
        </Carousel>
      </div>
    </div>
  );
};

export default StatisticsPage;
