import {
  FiUsers,
  FiRadio,
  FiPieChart,
  FiMapPin,
  FiBell,
  FiClock,
  FiMenu,
  FiHome,
  FiSettings,
  FiLogOut,
  FiUser,
  FiCodepen,
  FiCpu,
  FiChevronDown,
  FiChevronRight,
  //FiCreditCard,
  //FiHelpCircle,
  //FiCamera,
  FiKey
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { useNavigate, Outlet, NavLink, useLocation } from "react-router-dom";
import Header from "./Header";
import authService from "../../services/auth-service";
import userService from "../../services/user-service";
import Footer from "./Footer";

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    navigation: true,
    management: true,
    system: true,
  });
  const [user, setUser] = useState<{ name: string; role: string, id: string }>({
    name: "",
    role: "",
    id: "",
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Módulos organizados por categorías
  const menuSections = [
    {
      id: "navigation",
      title: "NAVEGACIÓN",
      items: [
        {
          title: "Inicio",
          icon: <FiHome className="h-5 w-5" />,
          path: "/",
        },
        {
          title: "Mapas",
          icon: <FiMapPin className="h-5 w-5" />,
          path: "/maps",
        },
        {
          title: "Estadísticas",
          icon: <FiPieChart className="h-5 w-5" />,
          path: "/statistics",
        },
      ],
    },
    {
      id: "management",
      title: "GESTIÓN",
      items: [
        {
          title: "Entidades",
          icon: <FiCodepen className="h-5 w-5" />,
          path: "/entities",
        },
        {
          title: "Infraestructura",
          icon: <FiCpu className="h-5 w-5" />,
          path: "/devices",
        },
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
        /*{
          title: "Multimedia",
          icon: <FiCamera className="h-5 w-5" />,
          path: "/multimedia",
        },
        
        
        /*{
          title: "Suscripciones",
          icon: <FiCreditCard className="h-5 w-5" />,
          path: "/subscriptions",
        },*/
        {
          title: "Tokens",
          icon: <FiKey className="h-5 w-5" />,
          path: "/keys",
        }
      ],
    },
    {
      id: "system",
      title: "SISTEMA",
      items: [
        {
          title: "Notificaciones",
          icon: <FiBell className="h-5 w-5" />,
          path: "/notifications",
        },
        {
          title: "Logs de Auditoría",
          icon: <FiClock className="h-5 w-5" />,
          path: "/history",
        },
        /*
        {
          title: "Soporte y FAQ",
          icon: <FiHelpCircle className="h-5 w-5" />,
          path: "/support",
        }*/
        
      ],
    },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Auto-colapso en móviles
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cerrar sidebar al hacer clic en enlace en móvil
  useEffect(() => {
    const handleLinkClick = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(link => {
      link.addEventListener('click', handleLinkClick);
    });

    return () => {
      links.forEach(link => {
        link.removeEventListener('click', handleLinkClick);
      });
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = authService.getUserIdFromToken();
        if (userId) {
          const userData = await userService.getUserById(userId);
          setUser({
            name: userData.name,
            role: userData.role,
            id: userData._id,
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

  // Efecto para agregar overlay en móvil
  useEffect(() => {
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      if (sidebarOpen && window.innerWidth < 768) {
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      } else {
        overlay.classList.add('hidden');
        document.body.style.overflow = 'auto';
      }
    }
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Overlay para móvil */}
      <div
        id="sidebar-overlay"
        className="fixed inset-0 bg-black/50 z-20 transition-opacity duration-300 hidden md:hidden"
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative top-0 left-0 z-30 h-screen
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'}
          bg-gradient-to-b from-slate-900 to-slate-800
          shadow-xl
        `}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.3) transparent',
        }}
      >
        {/* Logo/Cabecera */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SOS</span>
                </div>
                <h1 className="text-[1rem] font-semibold text-white tracking-tight">
                  Panel Administrativo
                </h1>
              </div>
            ) : (
              <div className="flex justify-center w-full">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SOS</span>
                </div>
              </div>
            )}
            
           
          </div>
        </div>

        {/* Navegación */}
        <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-220px)]">
          {menuSections.map((section) => (
            <div key={section.id} className="space-y-2">
              {sidebarOpen && (
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                    {section.title}
                  </span>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {expandedSections[section.id] ? (
                      <FiChevronDown className="h-4 w-4" />
                    ) : (
                      <FiChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}
              
              <div className={`space-y-1 ${!expandedSections[section.id] && sidebarOpen ? 'hidden' : 'block'}`}>
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path || 
                                 location.pathname.startsWith(item.path + '/');
                  
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`
                        sidebar-link flex items-center rounded-lg transition-all duration-200
                        ${sidebarOpen ? 'px-3 py-3' : 'justify-center p-3'}
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-l-2 border-blue-500 text-white' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }
                        group relative
                      `}
                    >
                      {/* Indicador activo */}
                      {isActive && sidebarOpen && (
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full" />
                      )}
                      
                      <div className={`
                        transition-all duration-200
                        ${isActive ? 'text-blue-400' : 'group-hover:text-blue-300'}
                        ${sidebarOpen ? 'mr-3' : ''}
                      `}>
                        {item.icon}
                      </div>
                      
                      {sidebarOpen && (
                        <span className="text-sm font-medium tracking-wide flex-1">
                          {item.title}
                        </span>
                      )}
                      
                      {/* Tooltip en collapsed */}
                      {!sidebarOpen && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                          {item.title}
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Información de usuario */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700/50 p-4 bg-slate-900/50 backdrop-blur-sm">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <FiUser className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {loading ? (
                      <span className="animate-pulse">Cargando...</span>
                    ) : (
                      user.name
                    )}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user.role}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                 
                <button
                  onClick={() => navigate(`/settings/${user.id}`)}
                  className="flex-1 flex items-center cursor-pointer justify-center gap-2 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors text-sm"
                >
                  <FiSettings className="h-4 w-4" />
                  <span>Configuración</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center cursor-pointer justify-center gap-2 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors text-sm"
                >
                  <FiLogOut className="h-4 w-4" />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <FiUser className="h-5 w-5 text-white" />
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => navigate("/settings")}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors relative group"
                >
                  <FiSettings className="h-5 w-5" />
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    Configuración
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors relative group"
                >
                  <FiLogOut className="h-5 w-5" />
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    Salir
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Botón de menú para móvil */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed bottom-4 left-4 z-20 p-3 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-shadow"
      >
        <FiMenu className="h-5 w-5" />
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        <Header 
  onMenuClick={() => setSidebarOpen(!sidebarOpen)}
  sidebarOpen={sidebarOpen}
/>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-b from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};