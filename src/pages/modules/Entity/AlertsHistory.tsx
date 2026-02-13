import React, { useEffect, useState } from "react";
import { getAllNotifications } from "../../../services/notifications-service";
import authService from "../../../services/auth-service";
import { entityUsersService } from "../../../services/entity.service";
import { FiBell, FiCheck, FiEye } from "react-icons/fi";
import Swal from 'sweetalert2'
import axios from "axios";


interface Notification {
  _id: string;
  message: string;
  type: string;
  createdAt: string;
  read?: boolean;
  details?: string;
  emitter?: string;
  receiver?: string;
}

type FilterType = "all" | "read" | "unread";
type NotificationType = "all" | "info" | "warning" | "error" | "success";

const AlertsHistory: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtros
  const [readFilter, setReadFilter] = useState<FilterType>("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [detailsModal, setDetailsModal] = useState("");
  const selectedNotification = notifications.find(
    (n) => n._id === detailsModal
  );

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = authService.getUserIdFromToken();
        if (userId) {
          const data = await getAllNotifications(userId);
          setNotifications(data);
        }
      } catch (error) {
        console.error("Error al obtener notificaciones:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const openDetails = (id: string) => {
    setDetailsModal(id);
  };

  const closeModal = () => {
    setDetailsModal("");
  };

  const handleAcceptRequest = async (
  id: string,
  userId: string,
  entityId: string
) => {
  try {
    const response = await entityUsersService.acceptPetition(userId, entityId);

    console.log("Respuesta de aceptación:", response);

    markAsRead(id);
    closeModal();

    Swal.fire({
      icon: 'success',
      title: 'Petición aceptada',
      text: 'Un nuevo usuario pertenece a tu entidad.',
      timer: 3000,
      showConfirmButton: true,
    });

  } catch (error: unknown) {

  if (axios.isAxiosError(error)) {

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.message || 'Error inesperado',
      timer: 3000,
      showConfirmButton: true,
    });
    closeModal();

  } else {
    console.error("Error desconocido:", error);
  }
}
};

  useEffect(() => {
    let filtered = [...notifications];

    // Filtro por estado de lectura
    if (readFilter !== "all") {
      filtered = filtered.filter((notif) =>
        readFilter === "read" ? notif.read : !notif.read
      );
    }

    // Filtro por tipo
    if (typeFilter !== "all") {
      filtered = filtered.filter((notif) => notif.type === typeFilter);
    }

    // Filtro por fechas
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(
        (notif) => new Date(notif.createdAt) >= fromDate
      );
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (notif) => new Date(notif.createdAt) <= toDate
      );
    }

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (notif) =>
          notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notif.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
    setCurrentPage(1);
  }, [notifications, readFilter, typeFilter, dateFrom, dateTo, searchTerm]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif._id === id ? { ...notif, read: true } : notif))
    );
  };

  const clearFilters = () => {
    setReadFilter("all");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
  };

  // Paginación
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = filteredNotifications.slice(
    startIndex,
    endIndex
  );

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;

    let startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisibleButtons / 2)
    );
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 mx-1 rounded ${
            i === currentPage
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {i}
        </button>
      );
    }

    return buttons;
  };


  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-[w-6xl] mx-auto">
      {/* Header */}
      <div className="mb-2 text-center">
        <h2 className="text-[1rem] font-semibold text-blue-600 flex justify-center items-center gap-1">
          <FiBell /> Notificaciones
        </h2>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Búsqueda */}
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="Buscar notificaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por estado */}
          <div>
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value as FilterType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="unread">Sin leer</option>
              <option value="read">Leídas</option>
            </select>
          </div>

          {/* Fecha desde */}
          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fecha hasta */}
          <div>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Limpiar filtros */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Lista de notificaciones */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📭</div>
          <p className="text-xl text-gray-600 mb-2">No hay notificaciones</p>
          <p className="text-gray-500">
            {notifications.length === 0
              ? "No tienes notificaciones disponibles."
              : "No se encontraron notificaciones con los filtros aplicados."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {currentNotifications.map((notif) => {
              const isSalida = notif.type === "salida";

              return (
                <div
                  key={notif._id}
                  className={` shadow-lg rounded-lg p-2 transition-all duration-200 hover:shadow-md bg-white border-l-4 ${
                    isSalida ? "border-red-400" : "border-blue-500"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-2xl"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.5rem] font-medium ${
                              isSalida
                                ? "bg-red-400 text-white"
                                : "bg-blue-500 text-white"
                            }`}
                          >
                            {notif.type}
                          </span>
                          {!notif.read && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.5rem] font-medium bg-red-100 text-red-800">
                              Sin leer
                            </span>
                          )}
                          <span className="text-[0.5rem] text-gray-500">
                            {new Date(notif.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-900 mb-2 text-[0.75rem] text-justify">
                          {notif.message}
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col items-start gap-2 ml-4">
                      {!notif.read && (
                        <button
                          onClick={() => markAsRead(notif._id)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                          title="Marcar como leída"
                        >
                          <FiCheck />
                        </button>
                      )}
                      <button
                        onClick={() => openDetails(notif._id)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                        title="Detalles"
                      >
                        <FiEye />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-8">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>

                {renderPaginationButtons()}

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              </div>

              <div className="ml-4 text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Detalles */}
      {detailsModal && selectedNotification && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-[40%] p-6 relative animate-fade-in">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2  cursor-pointer rounded-full bg-red-400 hover:bg-red-500 text-white px-2"
              title="Cerrar"
            >
              X
            </button>

            <h3 className="text-lg font-semibold text-blue-600 mb-4">
              Detalles de la Notificación
            </h3>

            <div className="text-sm space-y-2">
              {selectedNotification.message && (
                <p>
                  <strong>Mensaje:</strong> {selectedNotification.message}
                </p>
              )}

              {selectedNotification.details && (
                <p>
                  <strong>Detalles:</strong> {selectedNotification.details}
                </p>
              )}

              <p>
                <strong>Fecha:</strong>{" "}
                {new Date(selectedNotification.createdAt).toLocaleString()}
              </p>

              {/* 👇 Solo si es tipo 'peticion' */}
              {selectedNotification.type === "peticion" && (
                <button
                  onClick={() => handleAcceptRequest(selectedNotification._id, selectedNotification.emitter || '', selectedNotification.receiver || '')}
                  className="px-3 py-1 text-xs font-semibold bg-green-500 text-white rounded hover:bg-green-600 transition cursor-pointer"
                  title="Aceptar petición"
                >
                  Admitir
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsHistory;
