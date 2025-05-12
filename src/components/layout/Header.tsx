import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiHome,
  FiLogOut,
  FiSettings,
  FiUser,
  FiChevronDown,
} from "react-icons/fi";
import authService from "../../services/auth-service";
import userService from "../../services/user-service";
import {
  getAllNotifications,
  markNotificationAsRead,
} from "../../services/notifications-service";
import NotificationsDropdown from "./NotificationDropdown";

interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: "registro" | "peticion" | "reseteo";
}

const Header = () => {
  const navigate = useNavigate();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string }>({
    name: "",
    role: "",
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = authService.getUserIdFromToken();
        if (userId) {
          const userData = await userService.getUserById(userId);
          setUser({ name: userData.name, role: userData.role });
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
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const handleNotificationRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  };

  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-all duration-300">
              <FiHome className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl text-white hidden md:block tracking-tight">
              Vio<span className="text-blue-200">Red</span>
            </span>
          </Link>

          {/* Notificaciones y Usuario */}
          <div className="flex items-center space-x-4">
            <NotificationsDropdown
              notifications={notifications}
              onNotificationClick={handleNotificationRead}
            />

            {/* Usuario Dropdown */}
            <div className="relative hidden md:block" ref={userDropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <div className="bg-white/10 p-1 rounded-full">
                  <FiUser className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">
                    {loading ? (
                      <span className="animate-pulse">Cargando...</span>
                    ) : (
                      user.name
                    )}
                  </div>
                  <div className="text-xs text-blue-200">{user.role}</div>
                </div>
                <FiChevronDown className="text-white" />
              </button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-800 rounded-xl shadow-xl ring-1 ring-slate-700 z-50 overflow-hidden">
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 hover:text-white hover:border-l-4 hover:border-blue-500 transition-all duration-150"
                  >
                    <FiSettings className="w-4 h-4" />
                    Configuración
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 hover:text-white hover:border-l-4 hover:border-red-500 transition-all duration-150"
                  >
                    <FiLogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
