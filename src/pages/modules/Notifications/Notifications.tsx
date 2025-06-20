import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBell, FiChevronDown, FiChevronUp, FiCalendar } from "react-icons/fi";
import { getAllNotifications } from "../../../services/notifications-service";
import authService from "../../../services/auth-service";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import ButtonHome from "../../../components/UI/ButtonHome";
import Pagination from "../../../components/layout/Pagination";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "registro" | "peticion" | "reseteo" | "emergencia";
  isRead: boolean;
  createdAt: string;
  emitter?: string;
}

interface NotificationStyle {
  borderColor: string;
  textColor: string;
  icon: JSX.Element;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationsPerPage] = useState(5);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateFilter, setShowDateFilter] = useState(false);

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

  const filteredNotifications = notifications.filter((n) => {
    // Convertir la fecha de la notificación a formato YYYY-MM-DD en zona horaria local
    const notificationDate = new Date(n.createdAt);
    const notificationDateString = notificationDate.getFullYear() + '-' + 
      String(notificationDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(notificationDate.getDate()).padStart(2, '0');
    
    // Si no hay filtros de fecha, mostrar todas
    if (!startDate && !endDate) return true;
    
    // Si solo hay fecha de inicio, filtrar por ese día específico
    if (startDate && !endDate) {
      return notificationDateString === startDate;
    }
    
    // Si hay ambas fechas, filtrar por rango
    if (startDate && endDate) {
      return notificationDateString >= startDate && notificationDateString <= endDate;
    }
    
    return true;
  });

  const indexOfLast = currentPage * notificationsPerPage;
  const indexOfFirst = indexOfLast - notificationsPerPage;
  const currentNotifications = filteredNotifications.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
  };

  const getNotificationRoute = (notif: Notification) => {
    const routeMap: Record<Notification["type"], string> = {
      registro: `/notificaciones/register/${notif._id}`,
      reseteo: `/notificaciones/reset/${notif._id}`,
      peticion: `/notificaciones/request/${notif._id}`,
      emergencia: `/notificaciones/emergency/${notif._id}`,
    };
    return routeMap[notif.type] || `/notificaciones/detalle/${notif._id}`;
  };

  const getNotificationStyle = (
    type: Notification["type"]
  ): NotificationStyle => {
    const base = "w-4 h-4 mr-1";
    switch (type) {
      case "registro":
        return {
          borderColor: "border-blue-500",
          textColor: "text-blue-500",
          icon: <FiBell className={`${base} text-blue-500`} />,
        };
      case "peticion":
        return {
          borderColor: "border-yellow-500",
          textColor: "text-yellow-500",
          icon: <FiBell className={`${base} text-yellow-500`} />,
        };
      case "reseteo":
        return {
          borderColor: "border-purple-500",
          textColor: "text-purple-500",
          icon: <FiBell className={`${base} text-purple-500`} />,
        };
      case "emergencia":
        return {
          borderColor: "border-red-500",
          textColor: "text-red-500",
          icon: <FiBell className={`${base} text-red-500`} />,
        };
      default:
        return {
          borderColor: "border-gray-400",
          textColor: "text-gray-600",
          icon: <FiBell className={`${base} text-gray-400`} />,
        };
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

 

  const hasActiveFilters = startDate || endDate;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <ButtonIndicator />
        <ButtonHome />
      </div>

      <div className="flex justify-between items-center mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">
            Notificaciones
          </h1>
          <div className="flex items-center text-slate-500">
            <FiBell className="mr-2 text-sky-500" />
            Aquí puedes ver todas tus notificaciones.
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-3 items-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium text-sm">
              <FiBell className="mr-1.5" />
              {notifications.filter((n) => !n.isRead).length} Sin leer
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-200 text-gray-800 font-medium text-sm">
              Total: {filteredNotifications.length}
            </span>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium text-sm">
                <FiCalendar className="mr-1.5" />
                Filtros activos
              </span>
            )}
          </div>
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg shadow-sm transition"
          >
            <FiCalendar className="mr-2" />
            Filtrar por fecha
            {showDateFilter ? (
              <FiChevronUp className="ml-2 w-4 h-4" />
            ) : (
              <FiChevronDown className="ml-2 w-4 h-4" />
            )}
          </button>
        </div>

        {/* Panel de filtros colapsable */}
        {showDateFilter && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filtrar por fechas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Fecha específica o desde:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Hasta (opcional):
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  min={startDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <p className="text-xs text-gray-500">
                {startDate && !endDate && "Mostrando notificaciones del día seleccionado"}
                {startDate && endDate && "Mostrando notificaciones del rango seleccionado"}
                {!startDate && !endDate && "Selecciona una fecha para filtrar"}
              </p>
              <div className="flex space-x-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  onClick={() => setShowDateFilter(false)}
                  className="px-3 py-1 text-xs rounded-md bg-blue-600 hover:bg-blue-700 text-white transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 animate-pulse">
          Cargando...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <FiBell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            {hasActiveFilters ? "No hay notificaciones en las fechas seleccionadas" : "No hay notificaciones"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {hasActiveFilters 
              ? "Intenta cambiar el rango de fechas o limpiar los filtros."
              : "Cuando tengas nuevas notificaciones, aparecerán aquí."
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentNotifications.map((n) => {
            const { borderColor, textColor, icon } = getNotificationStyle(
              n.type
            );
            return (
              <div
                key={n._id}
                className={`p-5 bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${borderColor} ${!n.isRead ? "border-l-4" : ""
                  }`}
                onClick={() => markAsRead(n._id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${borderColor}`}
                    >
                      {icon}
                      <span className={`ml-1 capitalize ${textColor}`}>
                        {n.type}
                      </span>
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">
                        {n.title}
                      </h3>
                      <p className="text-sm text-gray-600">{n.message}</p>
                    </div>
                  </div>
                  {!n.isRead && (
                    <span className="h-2.5 w-2.5 mt-1.5 rounded-full bg-blue-500"></span>
                  )}
                </div>
                <div className="mt-3 flex justify-between text-sm text-gray-400">
                  <span>
                    {new Date(n.createdAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <Link
                    to={getNotificationRoute(n)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ver detalles →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
};

export default Notifications;