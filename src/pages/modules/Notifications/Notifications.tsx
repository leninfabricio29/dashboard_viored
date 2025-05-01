import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiChevronLeft,
  FiBell,
  FiCheck,
  FiChevronRight,
  FiChevronLeft,
} from "react-icons/fi";
import { getAllNotifications } from "../../../services/notifications-service";
import authService from "../../../services/auth-service";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";

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

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
        <ButtonIndicator />
      </div>

      {/* Contenido principal */}
      <main className="max-w-4xl mx-auto px-4 py-6 bg-gray-100 w-1/2 rounded-2xl">
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
              {currentNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-5 bg-white rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md ${
                    !notification.isRead ? "border-l-4 border-l-blue-500" : ""
                  }`}
                  onClick={() => markAsRead(notification._id)}
                >
                  <div className="flex justify-between">
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
                      to={`/notificaciones/${notification._id}`}
                      className="text-md font-medium text-blue-600 hover:text-blue-800"
                    >
                      Ver detalles →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {notifications.length > notificationsPerPage && (
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
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
          </>
        )}
      </main>
    </div>
  );
};

export default Notifications;
