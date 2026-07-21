import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiUser } from "react-icons/fi";
import authService from "../../services/auth-service";
import userService from "../../services/user-service";
import {
  getAllNotifications,
  markNotificationAsRead,
} from "../../services/notifications-service";
import NotificationsDropdown from "./NotificationDropdown";

interface User {
  name: string;
  role: string;
  avatar?: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: "registro" | "peticion" | "reseteo";
}

interface HeaderProps {
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
}

const Header = ({ onMenuClick, sidebarOpen }: HeaderProps) => {
  const [user, setUser] = useState<User>({
    name: "",
    role: "",
    avatar: "",
  });

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userIdFromToken = authService.getUserIdFromToken();
        if (userIdFromToken) {
          const userData = await userService.getUserById(userIdFromToken);
          setUser({
            name: userData.name,
            role: userData.role.name,
            avatar: userData.avatar || "",
          });
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = authService.getUserIdFromToken();
        if (userId) {
          const notificationsData = await getAllNotifications(userId);
          setNotifications(
            notificationsData.map((notif: Notification) => ({
              ...notif,
              isRead: notif.isRead || false,
            }))
          );
        }
      } catch (error) {
        console.error("Error al obtener notificaciones:", error);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        // Cerrar dropdown de usuario si se hace clic fuera
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);



  const handleNotificationRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      window.location.href = "/notifications";
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-gray-50 border-gray-100 border-b shadow-sm">
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo y botón de menú móvil */}
          <div className="flex items-center gap-4">
            {onMenuClick && (
              <div className="flex items-center gap-3">
                <button
                  onClick={onMenuClick}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Toggle menu"
                >
                  {sidebarOpen ? (
                    <FiMenu className="h-5 w-5 text-blue-800" />
                  ) : (
                    <FiMenu className="h-5 w-5 text-blue-800" />
                  )}
                </button>

                <div className="flex flex-col">
                  <h1 className="text-[1.2rem] font-bold text-gray-800 tracking-tight">
                    Hola, {loading ? "Cargando..." : user.name}
                  </h1>
                  <p className="text-[0.8rem] font-semibold text-slate-400 t">
                    <span className="text-gray-800 font-semibold">
                      Bienvenido al panel unificado de gestión y monitoreo
                    </span>
                  </p>
                </div>



              </div>
            )}

            {/* Logo desktop */}

          </div>


          {/* Notificaciones y Usuario */}
          <div className="flex items-center gap-4">

            {/* Alert para mostrar estado del sistema */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-green-300 bg-green-50 px-3 py-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
              </span>

              <span className="text-sm font-medium text-green-700">
                Sistema en línea
              </span>
            </div>
            <NotificationsDropdown
              notifications={notifications}
              onNotificationClick={handleNotificationRead}
            />

            {/* Información de usuario en móvil */}
            <div >
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">

                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`Avatar de ${user.name}`}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <FiUser className="h-4 w-4 text-white" />
                  )}
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;