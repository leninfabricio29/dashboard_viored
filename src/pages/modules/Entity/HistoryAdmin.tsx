import { useState, useEffect } from "react";
import React from "react";
import { ActivityLog } from "../../../types/activity-log";
import logsService from "../../../services/logs-service";
import { FileXIcon } from "lucide-react";
import { FiClock } from "react-icons/fi";

const HistoryAdmin: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const logsPerPage = 5;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await logsService.getlogsAdmin();
        setLogs(data);
      } catch (err) {
        console.error("Error cargando logs:", err);
        setError("Error al cargar los logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const totalPages = Math.ceil(logs.length / logsPerPage);
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-400 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto mt-6">
        <strong className="font-bold">Error:</strong> <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
         <div className="mb-2 text-center">
                <h2 className="text-[1rem] font-semibold text-blue-600 flex justify-center items-center gap-1">
                  <FiClock /> Logs del sistema
                </h2>
              </div>

       

        <div className="flex justify-between items-center text-sm font-medium text-gray-700">
          <p>
            Logs de Actividad ({indexOfFirstLog + 1}–
            {Math.min(indexOfLastLog, logs.length)} de {logs.length})
          </p>
        </div>

        {/* Contenido */}
        {currentLogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileXIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay logs disponibles
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              No se encontraron registros de actividad en este momento. Los logs aparecerán aquí cuando se registren nuevas actividades.
            </p>
          </div>
        ) : (
          <div className="space-y-4 ">
            {currentLogs.map((log, index) => (
              <div
                key={log._id || index}
                className="bg-white border-l-4 border-green-400  rounded-lg p-5 shadow hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400 font-mono">
                    ID: {log._id?.slice(-6) || index}
                  </span>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                    {log.action || "Sin acción"}
                  </span>
                </div>

                <div className="flex justify-between flex-wrap text-sm text-gray-900 mb-3">
                  <div>
                    <p className=" text-sm text-gray-900 font-semibold">Usuario</p>
                    <p className=" text-gray-400">{log.user?.name || "Desconocido"}</p>
                  </div>
                  <div>
                    <p className=" text-sm text-gray-900 font-semibold">Fecha</p>
                    <p className="text-gray-400">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className=" text-sm text-gray-900 font-semibold mb-1">Descripción</p>
                  <p className="text-gray-600 whitespace-pre-line">
                    {log.target || log.action || "Sin descripción disponible"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 bg-white hover:bg-gray-100"
            >
              Anterior
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentPage === page
                    ? "bg-red-500 text-white"
                    : "bg-white border text-gray-700 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 bg-white hover:bg-gray-100"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryAdmin;
