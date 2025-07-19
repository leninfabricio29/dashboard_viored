import {
  FiUsers,
  FiBell,
  FiClock,
  FiSettings,
  FiLogOut,
  FiHome,
  FiMenu,
  FiX
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/auth-service";
import userService from "../../services/user-service";
import Footer from "./Footer";
import { Link, useLocation } from "react-router-dom";
import MonitoringMap from "../../pages/modules/Entity/MonitoringMap";
import Members from "../../pages/modules/Entity/Members";
import AlertsHistory from "../../pages/modules/Entity/AlertsHistory";
import HistoryAdmin from "../../pages/modules/Entity/HistoryAdmin";
import Modal from "./Modal";

export const DashboardEntity = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string; avatar?: string }>({
    name: "",
    role: "",
  });
  const [modalType, setModalType] = useState<null | "members" | "alerts" | "history" | "settings">(null);
  const [loading, setLoading] = useState(true);
  loading

  const modules = [
    { title: "Inicio", path: "/monitoring", icon: <FiHome className="text-lg" /> },
    { title: "Colaboradores", path: "/monitoring/members", icon: <FiUsers className="text-lg" /> },
    { title: "Notificaciones", path: "/monitoring/alerts-history", icon: <FiBell className="text-lg" /> },
    { title: "Bitácora", path: "/monitoring/history-admin", icon: <FiClock className="text-lg" /> },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = authService.getUserIdFromToken();
        if (userId) {
          const userData = await userService.getUserById(userId);
          setUser({
            name: userData.name,
            role: userData.role,
            avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-lg text-gray-600"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col w-64 h-full bg-gradient-to-b from-gray-800 to-gray-600 text-white transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-4 border-b border-blue-700 flex items-center justify-center">
            <h1 className="text-xl font-bold text-white font-mono">Monitoreo V1</h1>
          </div>

          {/* User Profile */}
          <div className="p-4 flex items-center space-x-3 border-b border-blue-700">
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-blue-400"
            />
            <div>
              <p className="font-medium font-mono">{user.name}</p>
              <p className="text-xs text-blue-200 capitalize font-mono">{user.role}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {modules
              .filter((module) => {
                if (user.role === "entity") return true;
                if (user.role === "son") return (
                  module.title === "Inicio" || module.title === "Notificaciones"
                );
                return false;
              })
              .map((module, index) => (
                <Link
                  key={index}
                  to="#"
                  onClick={() => {
    if (module.path.includes("members")) setModalType("members");
    if (module.path.includes("alerts-history")) setModalType("alerts");
    if (module.path.includes("history-admin")) setModalType("history");
    }}
    className="flex items-center space-x-3 p-3 rounded-lg font-mono text-blue-100 hover:bg-blue-900/50"
    >
                  <span className="text-blue-300">{module.icon}</span>
                  <span>{module.title}</span>
                </Link>
              ))}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-gray-100 space-y-2 font-mono">
            <button
              type="button"
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              modalType === "settings"
                ? "bg-blue-900 text-white"
                : "text-blue-100 hover:bg-blue-900/50"
              }`}
              onClick={() => setModalType("settings")}
            >
              <FiSettings className="text-blue-300" />
              <span>Configuración</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 p-3 cursor-pointer rounded-lg text-blue-100 hover:bg-red-600/30 transition-colors"
            >
              <FiLogOut className="text-blue-300" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-blue-800 to-blue-900 text-white transform transition-transform duration-300 ease-in-out">
            <div className="p-4 flex justify-between items-center border-b border-blue-700">
              <h1 className="text-xl font-bold">SafeTrack</h1>
              <button onClick={() => setMobileMenuOpen(false)}>
                <FiX size={24} />
              </button>
            </div>
            {/* Mobile menu content (same as desktop) */}
            <div className="p-4 flex items-center space-x-3 border-b border-blue-700">
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-400"
              />
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-blue-200 capitalize">{user.role}</p>
              </div>
            </div>
            <nav className="p-4 space-y-1">
              {modules
                .filter((module) => {
                  if (user.role === "entity") return true;
                  if (user.role === "son") return (
                    module.title === "Inicio" || module.title === "Notificaciones"
                  );
                  return false;
                })
                .map((module, index) => (
                    <Link
                    key={index}
                    to={module.path}
                    className="flex items-center space-x-3 p-3 rounded-lg text-blue-100 hover:bg-blue-700/50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                    >
                    <span className="text-blue-300">{module.icon}</span>
                    <span>{module.title}</span>
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t border-blue-700 space-y-2">
                <button
                type="button"
                className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-blue-100 hover:bg-blue-700/50"
                onClick={() => setModalType("settings")}
                >
                <FiSettings className="text-blue-300" />
                <span>Configuración</span>
                </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 p-3 rounded-lg text-blue-100 hover:bg-red-600/30 transition-colors"
              >
                <FiLogOut className="text-blue-300" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <main className="relative flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <MonitoringMap />
            
            {/* Contextual Modules */}
            {pathname.includes("/monitoring/members") && (
              <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">Gestión de Usuarios</h2>
                </div>
                <Members />
              </div>
            )}
            
            {pathname.includes("/monitoring/alerts-history") && (
              <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">Historial de Alertas</h2>
                </div>
                <AlertsHistory />
              </div>
            )}
            
            {pathname.includes("/monitoring/history-admin") && (
              <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">Bitácora del Sistema</h2>
                </div>
                <HistoryAdmin />
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
      {modalType === "members" && (
  <Modal isOpen onClose={() => setModalType(null)} title="Gestión de Usuarios">
    <Members />
  </Modal>
)}

{modalType === "alerts" && (
  <Modal isOpen onClose={() => setModalType(null)} title="Historial de Alertas">
    <AlertsHistory />
  </Modal>
)}

{modalType === "history" && (
  <Modal isOpen onClose={() => setModalType(null)} title="Bitácora del Sistema">
    <HistoryAdmin />
  </Modal>
)}

    </div>
  );
};