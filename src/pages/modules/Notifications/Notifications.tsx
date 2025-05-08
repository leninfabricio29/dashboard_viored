import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiChevronLeft,
  FiBell,
  FiChevronRight
} from "react-icons/fi";
import { getAllNotifications } from "../../../services/notifications-service";
import authService from "../../../services/auth-service";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
11|import ButtonHome from "../../../components/UI/ButtonHome";

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

  const indexOfLast = currentPage * notificationsPerPage;
  const indexOfFirst = indexOfLast - notificationsPerPage;
  const currentNotifications = notifications.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(notifications.length / notificationsPerPage);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      )
    );
  };

  const getNotificationRoute = (notif: Notification) => {
    const routeMap: Record<Notification["type"], string> = {
      registro: `/notificaciones/register/${notif._id}`,
      reseteo: `/notificaciones/reset/${notif._id}`,
      peticion: `/notificaciones/request/${notif._id}`,
      emergencia: `/notificaciones/emergency/${notif._id}`
    };
    return routeMap[notif.type] || `/notificaciones/detalle/${notif._id}`;
  };

  const getNotificationStyle = (type: Notification["type"]): NotificationStyle => {
    const base = "w-4 h-4 mr-1";
    switch (type) {
      case "registro":
        return {
          borderColor: "border-blue-500",
          textColor: "text-blue-500",
          icon: <FiBell className={`${base} text-blue-500`} />
        };
      case "peticion":
        return {
          borderColor: "border-yellow-500",
          textColor: "text-yellow-500",
          icon: <FiBell className={`${base} text-yellow-500`} />
        };
      case "reseteo":
        return {
          borderColor: "border-purple-500",
          textColor: "text-purple-500",
          icon: <FiBell className={`${base} text-purple-500`} />
        };
      case "emergencia":
        return {
          borderColor: "border-red-500",
          textColor: "text-red-500",
          icon: <FiBell className={`${base} text-red-500`} />
        };
      default:
        return {
          borderColor: "border-gray-400",
          textColor: "text-gray-600",
          icon: <FiBell className={`${base} text-gray-400`} />
        };
    }
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-5xl mx-auto rounded-2xl shadow p-6">

        {/* Top bar */}
        <div className="flex justify-between items-center mb-6">
          <ButtonIndicator />
          <ButtonHome />
        </div>

       

        {/* Filtros */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium text-sm">
              <FiBell className="mr-1.5" />
              {notifications.filter((n) => !n.isRead).length} Sin leer
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-200 text-gray-800 font-medium text-sm">
              Total: {notifications.length}
            </span>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">Cargando...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <FiBell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No hay notificaciones</h3>
            <p className="mt-1 text-sm text-gray-500">Cuando tengas nuevas notificaciones, aparecerán aquí.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentNotifications.map((n) => {
              const { borderColor, textColor, icon } = getNotificationStyle(n.type);
              return (
                <div
                  key={n._id}
                  className={`p-5 bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${borderColor} ${
                    !n.isRead ? "border-l-4" : ""
                  }`}
                  onClick={() => markAsRead(n._id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${borderColor}`}>
                        {icon}
                        <span className={`ml-1 capitalize ${textColor}`}>{n.type}</span>
                      </span>
                      <div>
                        <h3 className="text-base font-semibold text-gray-800">{n.title}</h3>
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
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`flex items-center px-4 py-2 rounded-md ${
                currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              <FiChevronLeft className="mr-1" /> Anterior
            </button>

            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-md flex items-center justify-center ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`flex items-center px-4 py-2 rounded-md ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              Siguiente <FiChevronRight className="ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
