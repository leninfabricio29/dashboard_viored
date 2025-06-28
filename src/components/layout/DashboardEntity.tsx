import {
  FiUsers,
  FiBell,
  FiClock,
  FiSettings,
  FiLogOut,
  FiHome,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/auth-service";
import userService from "../../services/user-service";
import Footer from "./Footer";
import ImprovedNavbar from "./NavbarEntity";
import { Link, useLocation } from "react-router-dom";
import MonitoringMap from "../../pages/modules/Entity/MonitoringMap";
import Members from "../../pages/modules/Entity/Members";
import AlertsHistory from "../../pages/modules/Entity/AlertsHistory";
import HistoryAdmin from "../../pages/modules/Entity/HistoryAdmin";

export const DashboardEntity = () => {
  const { pathname } = useLocation();

  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; role: string }>({
    name: "",
    role: "",
  });
  const [loading, setLoading] = useState(true);

  const modules = [
    { title: "Inicio", path: "/monitoring", icon: <FiHome /> },
    { title: "Usuarios", path: "/monitoring/members", icon: <FiUsers /> },
    {
      title: "Notificaciones",
      path: "/monitoring/alerts-history",
      icon: <FiBell />,
    },
    { title: "Bitácora", path: "/monitoring/history-admin", icon: <FiClock /> },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-20  h-80% mx-2 my-1 rounded-lg  bg-blue-900 shadow-lg flex flex-col justify-between items-center py-6">
        {/* TOP SECTION */}
        <div className="flex flex-col items-center space-y-6 w-full">
          {/* Logo o título reducido */}

          {/* Navegación de módulos */}
          <nav className="flex flex-col space-y-4 w-full items-center">
            {modules.map((module, index) => (
              <Link
                key={index}
                to={module.path}
                className={`relative group p-2 rounded-lg hover:bg-indigo-500/20 transition-colors`}
              >
                <div className="text-indigo-300 group-hover:text-white">
                  {module.icon}
                </div>
                {location.pathname === module.path && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-8 h-1 rounded-2xl bg-white"></div>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* BOTTOM SECTION */}
        <div className="flex flex-col items-center space-y-4 w-full">
          {/* Configuración */}
          <a
            href="/settings"
            className="group p-2 rounded-lg hover:bg-indigo-500/20 transition-colors"
          >
            <FiSettings className="text-indigo-300 group-hover:text-white" />
          </a>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="group p-2 rounded-lg hover:bg-red-600/30 transition-colors"
          >
            <FiLogOut className="text-indigo-300 group-hover:text-white" />
          </button>

          {/* Usuario */}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <ImprovedNavbar />

        {/* Contenido */}
<main className="relative flex-1 overflow-y-auto p-6 bg-gray-50">
          <MonitoringMap /> {/* Se mantiene montado siempre */}
          {/* Render contextual solo si aplica */}
          {pathname.includes("/monitoring/members") && (
            <div className="fixed top-20 right-0 w-100 h-[calc(100%-5rem)] bg-white border border-gray-400 rounded-lg mr-4 shadow-lg z-40 p-4 overflow-y-auto">
              <Members />
            </div>
          )}
          {pathname.includes("/monitoring/alerts-history") && (
            <div className="fixed top-20 right-0 w-80 h-[calc(100%-5rem)] bg-white shadow-lg z-40 p-4 overflow-y-auto">
              <AlertsHistory />
            </div>
          )}
          {pathname.includes("/monitoring/history-admin") && (
            <div className="fixed top-20 right-0 w-80 h-[calc(100%-5rem)] bg-white shadow-lg z-40 p-4 overflow-y-auto">
              <HistoryAdmin />
            </div>
          )}
        </main>

        <Footer></Footer>
      </div>
    </div>
  );
};
