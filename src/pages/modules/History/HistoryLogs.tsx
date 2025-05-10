import React, { useEffect, useState } from "react";
import { getActivityLogs } from "../../../services/activity-log-service";

import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import ButtonHome from "../../../components/UI/ButtonHome";
import {
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
} from "react-icons/fi";
import Pagination from "../../../components/layout/Pagination";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface ActivityLog {
  _id: string;
  user: User;
  action: string;
  target: string;
  timestamp: string;
  __v: number;
}

const ITEMS_PER_PAGE = 10;

const HistoryLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(10);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const activityLogs = await getActivityLogs();
        setLogs(activityLogs || []);
      } catch (err) {
        setError("Error al cargar los logs de actividad");
        console.error(err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleString("es-ES", { month: "long" });
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");

      return `${day} de ${month} de ${year} a las ${hours}:${minutes}`;
    } catch (error) {
      return dateString;
    }
  };

  // Calcular los logs para la página actual
  const indexOfLastLog = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstLog = indexOfLastLog - ITEMS_PER_PAGE;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Historial de Actividades
        </h2>
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-500">
            No hay registros de actividad disponibles
          </p>
        </div>
      </div>
    );
  }

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <ButtonIndicator />
        <ButtonHome />
      </div>

      <div className="flex justify-between items-center mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">
            Historial de Actividades
          </h1>
          <div className="flex items-center text-slate-500">
            <FiClock className="mr-2 text-sky-500" />
            <span className="text-slate-500">
              Aquí puedes ver todas las actividades realizadas en el sistema.
            </span>
          </div>
        </div>
      </div>

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Lista de logs */}
      <div className="space-y-4">
  {currentLogs.map((log) => (
    <div
      key={log._id}
      className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-shadow duration-200 group"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-sky-200 flex items-center justify-center border border-slate-300 shadow-sm group-hover:shadow-md transition-shadow">
            <span className="text-sky-700 font-semibold text-lg">
              {log.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
            <div className="flex items-center flex-wrap gap-2">
              <p className="text-base font-semibold text-slate-800">
                {log.user.name}
              </p>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {log.user.email}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1 sm:mt-0">
              {formatDate(log.timestamp)}
            </p>
          </div>

          {/* Acción y detalles */}
          <p className="text-sm text-slate-700 mb-2">
            <span className="text-sky-600 font-medium">{log.action}</span>
            {log.details && (
              <span className="ml-1 text-slate-600">{log.details}</span>
            )}
          </p>

          {/* Target */}
          {log.target && (
            <div className="flex items-start">
              <FiArrowRight className="w-4 h-4 mt-0.5 text-slate-400 mr-2" />
              <p className="text-sm text-slate-500 flex-1">{log.target}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  ))}
</div>

    </div>
  );
};

export default HistoryLogs;
