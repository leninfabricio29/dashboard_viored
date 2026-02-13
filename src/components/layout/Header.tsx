import { useState, useEffect, useRef } from "react";
import {  Link } from "react-router-dom";
import {  FiMenu, FiUser } from "react-icons/fi";
import authService from "../../services/auth-service";
import userService from "../../services/user-service";
import {
  getAllNotifications,
  markNotificationAsRead,
} from "../../services/notifications-service";
import NotificationsDropdown from "./NotificationDropdown";
import Logo from "../../assets/icon.png";

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
            role: userData.role,
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
    <header className="sticky top-0 z-10 bg-gradient-to-b from-slate-900 to-slate-800 backdrop-blur-sm border-b border-gray-200">
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
                    <FiMenu className="h-5 w-5 text-gray-100" />
                  ) : (
                    <FiMenu className="h-5 w-5 text-gray-100" />
                  )}
                </button>
                
                <div className="md:hidden">
                  <Link to="/" className="flex items-center space-x-2">
                    <img
                      src={Logo}
                      alt="Logo"
                      className="w-10 h-10 object-contain"
                    />
                    <span className="font-bold text-lg text-gray-800 tracking-tight">
                      V-<span className="text-blue-600">SOS</span>
                    </span>
                  </Link>
                </div>
              </div>
            )}
            
            {/* Logo desktop */}
            <div className="hidden md:block">
              <Link to="/" className="flex items-center space-x-2">
                <img
                  src={Logo}
                  alt="Logo"
                  className="w-12 h-12 object-contain"
                />
                <span className="font-bold text-xl text-blue-400 tracking-tight">
                  V-<span className="text-red-400">SOS</span>
                </span>
              </Link>
            </div>
          </div>

          
          {/* Notificaciones y Usuario */}
          <div className="flex items-center gap-4">
            <NotificationsDropdown
              notifications={notifications}
              onNotificationClick={handleNotificationRead}
            />

            {/* Información de usuario en móvil */}
            <div className="md:hidden">
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                    {loading ? "Cargando..." : user.name}
                  </p>
                    <p className="text-xs text-gray-500">{user.role}</p>
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