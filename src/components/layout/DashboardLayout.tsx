import {
  FiUsers,
  FiRadio,
  FiPieChart,
  FiMapPin,
  FiBell,
  FiClock,
  FiMenu,
  FiChevronLeft,
  FiHome,
  FiSettings,
  FiLogOut,
  FiUser,
  FiCodepen
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import Header from "./Header";
import authService from "../../services/auth-service";
import userService from "../../services/user-service";
import Footer from "./Footer";

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; role: string }>({
    name: "",
    role: "",
  });
  const [loading, setLoading] = useState(true);

  const modules = [
    {
      title: "Inicio",
      icon: <FiHome className="h-6 w-6 text-white" />,
      path: "/",
    },
    { title: "Mapas", icon: <FiMapPin className="h-5 w-5" />, path: "/maps" },
    {
      title: "Estadísticas",
      icon: <FiPieChart className="h-5 w-5" />,
      path: "/statistics",
    },
    {
      title: "Entidades ",
      icon: <FiCodepen className="h-5 w-5" />,
      path: "/entities",
    },
    /*{
      title: "Botones Físicos",
      icon: <FiCpu className="h-5 w-5" />,
      path: "/devices",
    },*/
    {
      title: "Usuarios",
      icon: <FiUsers className="h-5 w-5" />,
      path: "/users",
    },
    {
      title: "Barrios",
      icon: <FiRadio className="h-5 w-5" />,
      path: "/neighborhood",
    },
    {
      title: "Notificaciones",
      icon: <FiBell className="h-5 w-5" />,
      path: "/notifications",
    },
    /* {
      title: "Gest. Multimedia",
      icon: <FiImage className="h-5 w-5" />,
      path: "/multimedia",
    }, */
    {
      title: "Bitácora",
      icon: <FiClock className="h-5 w-5" />,
      path: "/history",
    },

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
      <aside
        className={`${sidebarOpen ? "w-60" : "w-32"} 
          relative top-0 left-0 z-10 h-screen shadow-lg bg-slate-700
          transition-all duration-300 overflow-hidden`}
        style={{
          // Opcional: comentar si no usas imagen
          backgroundBlendMode: "overlay",
          backgroundSize: "cover",
          position: "relative",
          zIndex: 10
        }}
      >
        <div className="p-5  flex items-center justify-between border-b border-indigo-700/30 bg-indigo-800/10">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">

              <h1 className="text-lg font-semibold bg-gradient-to-r from-indigo-200 to-indigo-100 bg-clip-text text-transparent">
                Menú
              </h1>
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-indigo-600/20">
              <FiHome className="h-5 w-5 text-indigo-200" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors group"
          >
            {sidebarOpen ? (
              <FiChevronLeft
                size={20}
                className="text-indigo-300 group-hover:text-white transform group-hover:scale-110 transition-all"
              />
            ) : (
              <FiMenu
                size={20}
                className="text-indigo-300 group-hover:text-white transform group-hover:scale-110 transition-all"
              />
            )}
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {modules.map((module, index) => (
              <li key={index}>
                <a
                  href={module.path}
                  className={`flex items-center p-3 rounded-lg transition-all 
                    ${sidebarOpen ? "justify-start" : "justify-center"}
                    text-indigo-100 hover:bg-white/10 hover:text-white
                    group relative overflow-hidden `}
                >
                  <div
                    className={`flex items-center ${
                      sidebarOpen ? "gap-3" : "justify-center"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-md bg-white/10 group-hover:bg-white/20 transition-colors ${
                        sidebarOpen ? "" : "flex justify-center"
                      }`}
                    >
                      {module.icon}
                    </div>
                    {sidebarOpen && (
                      <span className="text-sm font-medium text-indigo-50 group-hover:text-white transition-colors">
                        {module.title}
                      </span>
                    )}
                    {/* Efecto de "current page" (opcional) */}
                    {location.pathname === module.path && sidebarOpen && (
                      <div className="ml-auto w-1 h-6 bg-blue rounded-full "></div>
                    )}
                  </div>
                  {/* Efecto de luz al pasar el mouse */}
                  <span
                    className="absolute inset-0 bg-white/5 group-hover:bg-white/10 
                    opacity-0 group-hover:opacity-100 transition-opacity text"
                  ></span>
                </a>
              </li>
            ))}
          </ul>

          {/* ADMIN PANEL OPTION */}
          <div className="md:hidden mt-4">
            <div className="border-t border-white/20 mx-2 my-3"></div>
            <ul className="space-y-2">
              <li>
                <a
                  href="/settings"
                  className={`flex items-center p-3 rounded-lg transition-all ${
                    sidebarOpen ? "justify-start" : "justify-center"
                  } hover:bg-white/10 text-indigo-100 hover:text-white group relative overflow-hidden `}
                >
                  <div
                    className={`p-1.5 rounded-md bg-white/10 group-hover:bg-white/20 transition-colors mr-2 ${
                      sidebarOpen ? "" : "flex justify-center"
                    }`}
                  >
                    <FiSettings className="h-5 w-5" />
                  </div>
                  {sidebarOpen && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-indigo-50 group-hover:text-white transition-colors">
                        Configuración
                      </span>
                      {location.pathname === "/settings" && (
                        <div className="ml-auto w-1 h-6 bg-white rounded-full"></div>
                      )}
                    </div>
                  )}
                  <span className="absolute inset-0 bg-white/5 group-hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </a>
              </li>

              <li>
                <button
                  onClick={handleLogout}
                  className={`flex items-center w-full p-3 rounded-lg transition-all cursor-pointer ${
                    sidebarOpen ? "justify-start" : "justify-center"
                  } hover:bg-white/10 text-indigo-100 hover:text-white group relative overflow-hidden `}
                >
                  <div
                    className={`p-1.5 rounded-md bg-white/10 group-hover:bg-white/20 transition-colors mr-2 ${
                      sidebarOpen ? "" : "flex justify-center"
                    }`}
                  >
                    <FiLogOut className="h-5 w-5" />
                  </div>
                  {sidebarOpen && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-indigo-50 group-hover:text-white transition-colors">
                        Cerrar Sesión
                      </span>
                    </div>
                  )}
                  <span className="absolute inset-0 bg-white/5 group-hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </button>
              </li>
            </ul>

            <div className={`flex items-center w-full p-3 rounded-lg transition-all cursor-pointer ${
                    sidebarOpen ? "justify-start" : "justify-center"
                  } hover:bg-white/10 text-indigo-100 hover:text-white group relative overflow-hidden `}>
              <div
                className={`p-1.5 rounded-md bg-white/10 group-hover:bg-white/20 transition-colors mr-2 ${
                  sidebarOpen ? "" : "flex justify-center"
                }`}
              >
                <FiUser className="h-5 w-5" />
              </div>
              {sidebarOpen && (
                <div className="text-sm leading-tight">
                  <div className="font-semibold text-white">
                    {loading ? (
                      <span className="animate-pulse">Cargando...</span>
                    ) : (
                      user.name
                    )}
                  </div>
                  <div className="text-xs text-blue-200">{user.role}</div>
                </div>
              )}
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet /> {/* Aquí se inyectará tu Dashboard.tsx actual */}
        </main>
                  <Footer></Footer>

      </div>
    </div>
  );
};
