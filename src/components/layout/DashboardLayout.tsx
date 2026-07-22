import {
  FiSettings,
  FiLogOut,
  FiUser,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { useNavigate, Outlet, NavLink, useLocation, Link } from "react-router-dom";
import Header from "./Header";
import authService from "../../services/auth-service";
import accessService from "../../services/access-service";
import userService from "../../services/user-service";
import Footer from "./Footer";
import Logo from "../../assets/icon.png";


export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    navigation: true,
    management: true,
    system: true,
  });
  console.log(expandedSections, setExpandedSections)
  const [user, setUser] = useState<{ name: string; role: string, id: string, avatar: string }>({
    name: "",
    avatar: "",
    role: "",
    id: "",
  });
  const [loading, setLoading] = useState(true);
  console.log(loading)
  const [modules, setModules] = useState<any[]>(() => {
    const stored = localStorage.getItem("modules");
    return stored ? JSON.parse(stored) : [];
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Módulos organizados por categorías
  const menuSections = modules
    .filter((m) => m.is_visible)
    .sort((a, b) => a.order - b.order)
    .reduce((acc: any[], module) => {
      const id = module.category.toLowerCase().replace(/\s+/g, "_");

      let section = acc.find((s) => s.id === id);

      if (!section) {
        section = {
          id,
          title: module.category.toUpperCase(),
          items: [],
        };

        acc.push(section);
      }

      section.items.push({
        title: module.name,
        path: module.route,
        icon: module.icon,
      });

      return acc;
    }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  useEffect(() => {
    const refreshAccess = async () => {
      try {
        const access = await accessService.refreshCurrentUserAccess();
        setModules(access.modules);
      } catch (error) {
        console.error("Error al actualizar permisos del usuario:", error);
      }
    };
    const handleAccessUpdated = (event: Event) => {
      const access = (event as CustomEvent<{ modules: any[] }>).detail;
      if (access?.modules) setModules(access.modules);
    };

    window.addEventListener("access-updated", handleAccessUpdated);
    window.addEventListener("focus", refreshAccess);
    void refreshAccess();
    return () => {
      window.removeEventListener("access-updated", handleAccessUpdated);
      window.removeEventListener("focus", refreshAccess);
    };
  }, []);



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

  const renderRoleName = () => {
  const role = localStorage.getItem("role");

  switch (role) {
    case "admin":
      return "Administrador";

    case "superadmin":
      return "Super Administrador";

    case "entity":
      return "Entidad";

    
  }
};

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = authService.getUserIdFromToken();
        if (userId) {
          const userData = await userService.getUserById(userId);
          setUser({
            name: userData.name,
            role: userData.role.name,
            id: userData._id,
            avatar: userData.avatar
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
    <div className="flex h-screen  bg-gray-50 relative">
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
                <div className="hidden md:block">
                  <Link to="/" className="flex items-center space-x-2">
                    <img
                      src={Logo}
                      alt="Logo"
                      className="w-12 h-12 object-contain"
                    />

                  </Link>
                </div>

                <div className="flex flex-col">
                  <h1 className="text-[1.2rem] font-bold text-white tracking-tight">
                    V-SOS
                  </h1>
                  <p className="text-[0.8rem] text-slate-400 tracking-tight"></p>
                  <h1 className="text-[0.8rem] font-semibold text-white tracking-tight">
                    Panel de Administración
                  </h1>

                </div>
              </div>
            ) : (
              <div className="hidden md:block">
                <Link to="/" className="flex items-center space-x-2">
                  <img
                    src={Logo}
                    alt="Logo"
                    className="w-12 h-12 object-contain"
                  />

                </Link>
              </div>
            )}


          </div>
        </div>

        {/* Navegación */}
        <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-220px)] ">
          {menuSections.map((section) => (
            <div key={section.id} className="space-y-2">
              {sidebarOpen && (
                <div className="px-2 mb-2">
                  <span className="text-[0.8rem] font-semibold text-slate-400 tracking-wider uppercase">
                    {section.title}
                  </span>
                </div>
              )}

              <div className="space-y-1">
                {section.items.map((item: any) => {
                  const isActive = location.pathname === item.path ||
                    location.pathname.startsWith(item.path + '/');

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`
                        sidebar-link flex items-center rounded-lg transition-all duration-200
                        ${sidebarOpen ? 'px-3 py-2' : 'justify-center p-3'}
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
                        <i className={`${item.icon} text-lg w-5 text-center`} />

                      </div>

                      {sidebarOpen && (
                        <span className="text-sm  text-[0.7rem] font-semibold tracking-wide flex-1">
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
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700/50 bg-slate-900/50 p-4 backdrop-blur-sm">
  {sidebarOpen ? (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={`Avatar de ${user.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <FiUser className="h-5 w-5 text-white" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {user.name}
              

          </p>
          <p className="truncate text-xs text-gray-400">
            {renderRoleName()}
          </p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg p-2 text-sm text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-white"
      >
        <FiLogOut className="h-4 w-4" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  ) : (
    <div className="flex flex-col items-center space-y-4">
      <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={`Avatar de ${user.name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <FiUser className="h-5 w-5 text-white" />
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={() => navigate("/settings")}
          className="group relative rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-white"
        >
          <FiSettings className="h-5 w-5" />
          <div className="absolute left-full ml-2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-sm text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-50">
            Configuración
          </div>
        </button>

        <button
          onClick={handleLogout}
          className="group relative rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-white"
        >
          <FiLogOut className="h-5 w-5" />
          <div className="absolute left-full ml-2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-sm text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-50">
            Salir
          </div>
        </button>
      </div>
    </div>
  )}
</div>
      </aside>

      {/* Botón de menú para móvil */}
     

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
