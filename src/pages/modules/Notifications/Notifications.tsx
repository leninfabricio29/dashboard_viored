import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiChevronLeft, FiBell, FiChevronRight } from "react-icons/fi";
import { getAllNotifications } from "../../../services/notifications-service";
import authService from "../../../services/auth-service";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import ButtonHome from "../../../components/UI/ButtonHome";

const Notifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationsPerPage] = useState(5); // Número de notificaciones por página

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = authService.getUserIdFromToken();
        if (userId) {
          const notificationsData = await getAllNotifications(userId);
          setNotifications(notificationsData);
        }
      } catch (error) {
        console.error("Error al obtener notificaciones:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Calcular notificaciones para la página actual
  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification =
    indexOfLastNotification - notificationsPerPage;
  const currentNotifications = notifications.slice(
    indexOfFirstNotification,
    indexOfLastNotification
  );
  const totalPages = Math.ceil(notifications.length / notificationsPerPage);

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif._id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  // Función para determinar la ruta de redirección según el tipo de notificación
  const getNotificationRoute = (notification) => {
    // Mapeo de tipos de notificación a rutas
    const routeMap = {
      'registro': `/notificaciones/register/${notification._id}`,
      'reseteo': `/notificaciones/reset/${notification._id}`,
      'peticion': `/notificaciones/request/${notification._id}`,
    };

    // Obtener la ruta del mapa, o usar una ruta por defecto
    return routeMap[notification.type] || `/notificaciones/detalle/${notification._id}`;
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "registro":
        return {
          borderColor: "border-blue-500",
          textColor: "text-blue-500",
          icon: (
            <svg
              className="w-4 h-4 mr-1 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          ),
        };
      case "peticion":
        return {
          borderColor: "border-yellow-500",
          textColor: "text-yellow-500",
          icon: (
            <svg
              className="w-4 h-4 mr-1 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          ),
        };
      case "reseteo":
        return {
          borderColor: "border-purple-500",
          textColor: "text-purple-500",
          icon: (
            <svg
              className="w-4 h-4 mr-1 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          ),
        };
      default:
        return {
          borderColor: "border-gray-500",
          icon: <FiBell className="w-4 h-4 mr-1 text-gray-500" />,
        };
    }
  };

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

      {/* Contenido principal */}
      <main className="max-w-4xl mx-auto px-4 py-6 bg-gray-100 w-full sm:w-3/4 md:w-2/3 lg:w-1/2 rounded-2xl">
        {/* Filtros y contadores */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-md font-medium">
              <FiBell className="mr-1.5" />
              {notifications.filter((n) => !n.isRead).length} Sin leer
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-md font-medium">
              Total: {notifications.length}
            </span>
          </div>
        </div>

        {/* Paginación */}
        {notifications.length > notificationsPerPage && (
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

        {/* Lista de notificaciones */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-gray-500">Cargando...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <FiBell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No hay notificaciones
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Cuando tengas nuevas notificaciones, aparecerán aquí.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {currentNotifications.map((notification) => {
                const { borderColor, icon, textColor } = getNotificationStyle(
                  notification.type
                );

                return (
                  <div
                    key={notification._id}
                    className={`p-5 bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${borderColor} ${
                      !notification.isRead ? "border-l-4" : ""
                    }`}
                    onClick={() => markAsRead(notification._id)}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`inline-flex items-center mt-2 px-3 py-1 text-xs font-medium text-white rounded-full ${borderColor}`}
                        >
                          {icon}
                          <span className={`ml-1 capitalize ${textColor}`}>
                            {notification.type}
                          </span>
                        </span>
                        <div>
                          <h3
                            className={`text-base font-medium ${
                              !notification.isRead
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          <p className="mt-1 text-md text-gray-600">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500 self-start mt-1.5"></span>
                      )}
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-base text-gray-400">
                        {new Date(notification.createdAt).toLocaleDateString(
                          "es-ES",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                      <Link
                        to={getNotificationRoute(notification)}
                        className="text-md font-medium text-blue-600 hover:text-blue-800"
                      >
                        Ver detalles →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Notifications;