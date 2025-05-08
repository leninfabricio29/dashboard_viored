import React, { useEffect, useState } from 'react';
import { getActivityLogs } from '../../../services/activity-log-service';

import ButtonIndicator from '../../../components/UI/ButtonIndicator';
import ButtonHome from '../../../components/UI/ButtonHome';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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
        setError('Error al cargar los logs de actividad');
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
      const month = date.toLocaleString('es-ES', { month: 'long' });
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
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
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Historial de Actividades</h2>
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-500">No hay registros de actividad disponibles</p>
        </div>
      </div>
    );
  }

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
        <ButtonIndicator />
      </div>
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
        <ButtonHome />
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-6 bg-gray-100 w-full sm:w-3/4 md:w-2/3 lg:w-1/2 rounded-2xl">

{/* Paginación */}
{logs.length > logsPerPage && (
          <div className="flex justify-between items-center m-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`flex items-center px-4 py-2 rounded-md cursor-pointer ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              <FiChevronLeft className="mr-1" /> Anterior
            </button>

            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`w-10 h-10 rounded-md flex items-center justify-center cursor-pointer ${
                      currentPage === number
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {number}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`flex items-center px-4 py-2 rounded-md cursor-pointer ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              Siguiente <FiChevronRight className="ml-1" />
            </button>
          </div>
        )}

<div className="space-y-4">
  {currentLogs.map((log) => (
    <div
      key={log._id}
      className="p-5 bg-white rounded-xl shadow-md border border-blue-500 hover:shadow-lg transition-all"
    >
      <div className="flex items-start space-x-4">
        {/* Avatar inicial */}
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
            <span className="text-blue-600 font-semibold text-lg">
              {log.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Detalles del log */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-base font-semibold text-gray-900">
              {log.user.name}
            </p>
            <p className="text-sm text-gray-500">{formatDate(log.timestamp)}</p>
          </div>

          <p className="text-sm text-gray-700">
            <span className="font-medium text-blue-700">{log.action}</span>
          </p>

          <p className="mt-1 text-sm text-gray-500 italic">{log.target}</p>
        </div>
      </div>
    </div>
  ))}
</div>


      </div>
    </div>
  );
};

export default HistoryLogs;