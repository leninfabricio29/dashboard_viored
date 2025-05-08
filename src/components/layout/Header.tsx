import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiHome,
  FiMenu,
  FiLogOut,
  FiSettings,
  FiUser,
  FiX,
  FiMap,
  FiPieChart,
} from "react-icons/fi";
import authService from "../../services/auth-service";
import userService from "../../services/user-service";
import { getAllNotifications, markNotificationAsRead } from "../../services/notifications-service";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string }>({
    name: "",
    role: "",
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Obtener el ID del usuario del token JWT
        const userId = authService.getUserIdFromToken();

        if (userId) {
          // Obtener los datos del usuario
          const userData = await userService.getUserById(userId);
          setUser({
            name: userData.name,
            role: userData.role,
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
          setNotifications(notificationsData.map((notif: Notification) => ({
            ...notif,
            isRead: notif.isRead || false
          })));
        }
      } catch (error) {
        console.error("Error al obtener notificaciones:", error);
      }
    };

    fetchNotifications();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNotificationRead = async (notificationId: string) => {
    console.log('ID de notificación a marcar:', notificationId);
    try {
      const result = await markNotificationAsRead(notificationId);
      console.log('Resultado de la actualización:', result);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error completo:', error);
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-800 shadow-lg">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-20">
      {/* Logo y nombre de la app */}
      <div className="flex items-center space-x-4">
        <Link 
          to="/" 
          className="flex items-center space-x-2 group"
        >
          <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-all duration-300">
            <FiHome className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl text-white hidden md:block tracking-tight">
            Panel<span className="text-blue-200">Admin</span>
          </span>
        </Link>
        
        {/* Menú desktop */}
        <nav className="hidden md:flex space-x-1 ml-6">
          <Link
            to="/users"
            className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors duration-300 flex items-center"
          >
            <FiUser className="mr-2" />
            Usuarios
          </Link>
          <Link
            to="/maps"
            className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors duration-300 flex items-center"
          >
            <FiMap className="mr-2" />
            Mapas
          </Link>
          <Link
            to="/statistics"
            className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors duration-300 flex items-center"
          >
            <FiPieChart className="mr-2" />
            Estadísticas
          </Link>
        </nav>
      </div>

      {/* Menú de usuario */}
      <div className="hidden md:flex items-center space-x-4">
        <NotificationsDropdown
          notifications={notifications}
          onNotificationClick={handleNotificationRead}
        />
        
        <div className="relative group">
          <div className="flex items-center space-x-2 cursor-pointer">
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
              <div className="text-xs text-blue-200">
                {user.role}
              </div>
            </div>
          </div>
          
          {/* Dropdown de usuario */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
            <Link
              to="/settings"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center"
            >
              <FiSettings className="mr-2" />
              Configuración
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center"
            >
              <FiLogOut className="mr-2" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      <div className="md:hidden">
        <button
          onClick={toggleMenu}
          className="p-2 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          {isMenuOpen ? (
            <FiX className="h-6 w-6 text-white" />
          ) : (
            <FiMenu className="h-6 w-6 text-white" />
          )}
        </button>
      </div>
    </div>
  </div>

  {/* Menú móvil desplegable */}
  {isMenuOpen && (
    <div className="md:hidden bg-blue-800/95 backdrop-blur-sm">
      <div className="px-2 pt-2 pb-4 space-y-1">
        <div className="flex items-center px-4 py-3 border-b border-blue-700/50">
          <div className="bg-white/10 p-1 rounded-full mr-3">
            <FiUser className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-white font-medium">
              {loading ? "Cargando..." : user.name}
            </div>
            <div className="text-xs text-blue-200">
              {user.role}
            </div>
          </div>
        </div>
        
        <Link
          to="/"
          className="text-white block px-3 py-3 rounded-lg text-base font-medium hover:bg-white/10 transition-colors duration-300"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="flex items-center">
            <FiHome className="mr-3" />
            Inicio
          </div>
        </Link>
        <Link
          to="/users"
          className="text-white block px-3 py-3 rounded-lg text-base font-medium hover:bg-white/10 transition-colors duration-300"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="flex items-center">
            <FiUser className="mr-3" />
            Usuarios
          </div>
        </Link>
        <Link
          to="/maps"
          className="text-white block px-3 py-3 rounded-lg text-base font-medium hover:bg-white/10 transition-colors duration-300"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="flex items-center">
            <FiMap className="mr-3" />
            Mapas
          </div>
        </Link>
        <Link
          to="/statistics"
          className="text-white block px-3 py-3 rounded-lg text-base font-medium hover:bg-white/10 transition-colors duration-300"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="flex items-center">
            <FiPieChart className="mr-3" />
            Estadísticas
          </div>
        </Link>
        <Link
          to="/settings"
          className="text-white block px-3 py-3 rounded-lg text-base font-medium hover:bg-white/10 transition-colors duration-300"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="flex items-center">
            <FiSettings className="mr-3" />
            Configuración
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="text-white w-full text-left px-3 py-3 rounded-lg text-base font-medium hover:bg-white/10 transition-colors duration-300"
        >
          <div className="flex items-center">
            <FiLogOut className="mr-3" />
            Cerrar sesión
          </div>
        </button>
      </div>
    </div>
  )}
</header>
  );
};

export default Header;
