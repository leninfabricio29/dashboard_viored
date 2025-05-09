import {
  FiUsers,
  FiRadio,
  FiPieChart,
  FiMapPin,
  FiBell,
  FiClock,
  FiImage,
  FiX,
  FiMenu,
  FiChevronLeft,
  FiHome,
} from "react-icons/fi";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const modules = [
    { title: "Mapas", icon: <FiMapPin className="h-5 w-5" />, path: "/maps" },
    {
      title: "Estadísticas",
      icon: <FiPieChart className="h-5 w-5" />,
      path: "/statistics",
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
    {
      title: "Notificaciones",
      icon: <FiBell className="h-5 w-5" />,
      path: "/notifications",
    },
    {
      title: "Gest. Multimedia",
      icon: <FiImage className="h-5 w-5" />,
      path: "/multimedia",
    },
    {
      title: "Historial",
      icon: <FiClock className="h-5 w-5" />,
      path: "/history",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-80" : "w-32"} 
        relative top-0 left-0 z-40  h-screen shadow-lg bg-gradient-to-r from-slate-900 to-slate-800 
         transition-all duration-300 
        overflow-hidden`}
        style={{
          // Opcional: comentar si no usas imagen
          backgroundBlendMode: "overlay",
          backgroundSize: "cover",
        }}
      >
        <div className="p-4 flex items-center justify-between border-b border-indigo-700/30 bg-indigo-800/10">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-600/20">
                <FiHome className="h-5 w-5 text-indigo-200" />
              </div>
              <h1 className="text-lg font-semibold bg-gradient-to-r from-indigo-200 to-indigo-100 bg-clip-text text-transparent">
                AdminPanel
              </h1>
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-indigo-600/20">
              <FiHome className="h-5 w-5 text-indigo-200" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-full hover:bg-indigo-700/50 transition-colors group"
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
                  <span
                    className={`${module.icon.props.className} ${
                      sidebarOpen ? "mr-3" : ""
                    } 
                    group-hover:scale-110 transition-transform`}
                  />
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
                      <div className="ml-auto w-1 h-6 bg-white rounded-full "></div>
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
      </div>
    </div>
  );
};
