// NotificationDropdown.tsx actualizado
import { useState, useRef, useEffect } from "react";
import { FiBell, FiCheck, FiAlertCircle, FiInfo, FiAlertTriangle } from "react-icons/fi";

interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: "registro" | "peticion" | "reseteo";
}

interface NotificationsDropdownProps {
  notifications: Notification[];
  onNotificationClick: (id: string) => void;
}

const NotificationsDropdown = ({ notifications, onNotificationClick }: NotificationsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "registro": return <FiCheck className="h-4 w-4 text-green-500" />;
      case "peticion": return <FiAlertCircle className="h-4 w-4 text-blue-500" />;
      case "reseteo": return <FiAlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <FiInfo className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    }).format(date);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-red-500  cursor-pointer transition-colors relative"
        aria-label="Notificaciones"
      >
        <FiBell className="h-5 w-5 text-gray-100" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg ring-1 ring-gray-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                  {unreadCount} sin leer
                </span>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No hay notificaciones
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => {
                      onNotificationClick(notification._id);
                      setIsOpen(false);
                    }}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {!notification.isRead && (
                          <div className="inline-flex items-center gap-1 mt-2">
                            <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                            <span className="text-xs text-blue-600">No leído</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={() => {
                // Marcar todas como leídas
                notifications.forEach(n => {
                  if (!n.isRead) onNotificationClick(n._id);
                });
                setIsOpen(false);
              }}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
              disabled={unreadCount === 0}
            >
              Marcar todas como leídas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;