import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiUser, FiLogOut, FiChevronDown } from "react-icons/fi";
import authService from "../../services/auth-service";
import userService from "../../services/user-service";
import {
  getAllNotifications,
  markNotificationAsRead,
} from "../../services/notifications-service";
import NotificationsDropdown, { Notification } from "./NotificationDropdown";

interface User {
  id?: string;
  name: string;
  role: string;
  avatar?: string;
}

interface HeaderProps {
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User>({
    id: "",
    name: "",
    role: "",
    avatar: "",
  });

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userIdFromToken = authService.getUserIdFromToken();
        if (userIdFromToken) {
          const userData = await userService.getUserById(userIdFromToken);
          setUser({
            id: userData._id || userIdFromToken,
            name: userData.name,
            role: typeof userData.role === "string" ? userData.role : (userData.role?.name || ""),
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
            notificationsData.map((notif: any) => ({
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
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notif: Notification) => {
    try {
      if (!notif.isRead) {
        await markNotificationAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notif._id ? { ...n, isRead: true } : n
          )
        );
      }

      const routeMap: Record<string, string> = {
        registro: `/notificaciones/register/${notif._id}`,
        reseteo: `/notificaciones/reset/${notif._id}`,
        peticion: `/notificaciones/request/${notif._id}`,
        emergencia: `/notificaciones/emergency/${notif._id}`,
      };

      const targetRoute = routeMap[notif.type] || `/notifications`;
      navigate(targetRoute);
    } catch (error) {
      console.error("Error al procesar click en notificación:", error);
      navigate(`/notifications`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.isRead);
      await Promise.all(unread.map((n) => markNotificationAsRead(n._id)));
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error("Error al marcar todas las notificaciones como leídas:", error);
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
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Toggle menu"
                >
                  <FiMenu className="h-5 w-5 text-blue-800" />
                </button>

                <div className="flex flex-col">
                  <h1 className="text-[1.2rem] font-bold text-gray-800 tracking-tight">
                    Hola, {loading ? "Cargando..." : user.name}
                  </h1>
                  <p className="text-[0.8rem] font-semibold text-slate-400">
                    <span className="text-gray-800 font-semibold">
                      Bienvenido al panel unificado de gestión y monitoreo
                    </span>
                  </p>
                </div>
              </div>
            )}
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
              onNotificationClick={handleNotificationClick}
              onMarkAllAsRead={handleMarkAllAsRead}
            />

            {/* Dropdown Perfil de Usuario */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-200/60 transition-all cursor-pointer focus:outline-none"
                aria-expanded={isUserMenuOpen}
              >
                <div className="h-9 w-9 rounded-full  flex items-center justify-center   shadow-sm">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`Avatar de ${user.name}`}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/3840px-User_icon_2.svg.png"
                      alt="User Icon"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <FiChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    isUserMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Menú Desplegable */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {user.name || "Usuario"}
                    </p>
                  
                  </div>

                  <div className="py-1">
                    <Link
                      to={user.id ? `/settings/${user.id}` : "/settings"}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <FiUser className="w-4 h-4 text-blue-600" />
                      <span>Mi Perfil</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        authService.logout();
                        window.location.href = "/login";
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                    >
                      <FiLogOut className="w-4 h-4 text-red-600" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
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