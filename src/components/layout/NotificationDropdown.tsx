import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiBell, FiCheck, FiAlertCircle, FiInfo, FiAlertTriangle, FiList } from "react-icons/fi";

export interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: "registro" | "peticion" | "reseteo" | "emergencia" | string;
}

interface NotificationsDropdownProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead?: () => void;
}

const NotificationsDropdown = ({
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
}: NotificationsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "registro":
        return <FiCheck className="h-4 w-4 text-green-500" />;
      case "peticion":
        return <FiAlertCircle className="h-4 w-4 text-blue-500" />;
      case "reseteo":
        return <FiAlertTriangle className="h-4 w-4 text-amber-500" />;
      case "emergencia":
        return <FiAlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FiInfo className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    }).format(date);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg cursor-pointer transition-colors relative hover:bg-gray-100"
        aria-label="Notificaciones"
      >
        <FiBell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl ring-1 ring-gray-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/80">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FiBell className="text-blue-600" /> Notificaciones
              </h3>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  {unreadCount} sin leer
                </span>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No tienes notificaciones por el momento
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => {
                      onNotificationClick(notification);
                      setIsOpen(false);
                    }}
                    className={`p-4 hover:bg-blue-50/50 transition-colors cursor-pointer ${
                      !notification.isRead ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notification.isRead ? "text-slate-900 font-semibold" : "text-gray-700"} truncate`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {!notification.isRead && (
                          <div className="inline-flex items-center gap-1.5 mt-2">
                            <span className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></span>
                            <span className="text-[11px] font-semibold text-blue-600">No leído</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-800 py-1.5 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-1.5 transition-colors"
            >
              <FiList className="w-3.5 h-3.5" /> Ver todas las notificaciones
            </Link>

            {unreadCount > 0 && onMarkAllAsRead && (
              <button
                onClick={() => {
                  onMarkAllAsRead();
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700 font-medium py-1 hover:underline cursor-pointer"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;