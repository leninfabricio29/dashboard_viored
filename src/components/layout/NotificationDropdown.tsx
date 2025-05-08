import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FiBell, FiChevronRight } from "react-icons/fi";
import useClickOutside from "../../hooks/useClickOutside";

interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: "registro" | "peticion" | "reseteo" | "emergencia";
}

interface NotificationsDropdownProps {
  notifications: Notification[];
  onNotificationClick?: (id: string) => void; // Nueva prop para manejar el clic
}

const NotificationsDropdown = ({
  notifications,
  onNotificationClick,
}: NotificationsDropdownProps) => {

  const getSortedNotifications = () => {
    return notifications
      .filter(n => n.type !== 'emergencia')
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Orden descendente (más reciente a más antigua)
      });
  };

  // Uso en el renderizado
  const displayedNotifications = getSortedNotifications().slice(0, 5);


  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => {
    setShowNotifications(false);
  });

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { year: "numeric", month: "2-digit", day: "2-digit" }) + 
           " " + 
           date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleNotificationClick = (id: string) => {
    setShowNotifications(false);
    if (onNotificationClick) {
      onNotificationClick(id); // Esto marcará la notificación como leída
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "registro":
        return {
          borderColor: "border-blue-500",
          textColor: "text-blue-500",
          bgColor: "bg-blue-500",
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
          bgColor: "bg-yellow-500",
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
          bgColor: "bg-purple-500",
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
      case "emergencia":
        return {
          borderColor: "border-red-500",
          textColor: "text-red-500",
          bgColor: "bg-red-500",
          icon: (
            <svg
              className="w-4 h-4 mr-1 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ),
        };
      default:
        return {
          borderColor: "border-gray-500",
          textColor: "text-gray-500",
          bgColor: "bg-gray-500",
          icon: <FiBell className="w-4 h-4 mr-1 text-gray-500" />,
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-1 rounded-full hover:bg-blue-900 transition-colors duration-200"
        onClick={toggleNotifications}
        aria-expanded={showNotifications}
        aria-label="Notificaciones"
      >
        <FiBell className="h-5 w-5 text-white" />
        {notifications.filter((n) => !n.isRead).length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
            {notifications.filter((n) => !n.isRead).length}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-900 to-blue-800">
            <h3 className="font-semibold text-white">Notificaciones</h3>
            <span className="text-xs text-blue-100 font-bold">
              {notifications.filter((n) => !n.isRead).length} sin leer
            </span>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {displayedNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No hay notificaciones nuevas
              </div>
            ) : (
                <ul className="divide-y divide-gray-100">
                {displayedNotifications.slice(0, 5).map((notif) => {
                  const style = getNotificationStyle(notif.type);
                  const typePathMap: Record<string, string> = {
                    registro: "register",
                    peticion: "request",
                    reseteo: "reset",
                    emergencia: "emergency"
                  };
                  const notificationPath = typePathMap[notif.type] || "unknown";

                  return (
                  <li
                    key={notif._id}
                    className={`px-4 py-3 transition-colors ${
                    !notif.isRead
                      ? `bg-blue-50 border-l-4 ${style.borderColor}`
                      : "bg-white"
                    }`}
                  >
                    <div className="flex items-start">
                    <div className="flex-shrink-0">{style.icon}</div>
                    <div className="ml-1 flex-1">
                      <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <h4
                        className={`text-sm ${
                          !notif.isRead
                          ? "font-semibold text-gray-900"
                          : "font-normal text-gray-700"
                        }`}
                        >
                        {notif.title}
                        </h4>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold capitalize ${style.textColor, style.bgColor}`}>
                        {notif.type}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">
                        {formatDate(notif.createdAt)}
                      </span>
                      </div>
                      <p
                      className={`text-xs mt-1 line-clamp-2 ${
                        !notif.isRead ? "text-gray-600" : "text-gray-500"
                      }`}
                      >
                      {notif.message}
                      </p>
                      <div className="mt-2">
                      <Link
                        to={`/notificaciones/${notificationPath}/${notif._id}`}
                        className="text-xs flex items-center text-blue-600 hover:text-blue-800"
                        onClick={() => handleNotificationClick(notif._id)}
                      >
                        Ver detalles <FiChevronRight className="ml-1" />
                      </Link>
                      </div>
                    </div>
                    </div>
                  </li>
                  );
                })}
                </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 p-2 text-center">
            <Link
              to="/notifications"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center"
              onClick={() => setShowNotifications(false)}
            >
              Ver todas las notificaciones
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
