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
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import Header from "./Header";
import authService from "../../services/auth-service";
import userService from "../../services/user-service";
import Footer from "./Footer";
import ImprovedNavbar from "./NavbarEntity";

export const DashboardEntity = () => {
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
      path: "/monitoring",
    },
     {
      title: "Usuarios",
      icon: <FiUsers className="h-5 w-5" />,
      path: "/users",
    },  
    {
      title: "Notificaciones",
      icon: <FiBell className="h-5 w-5" />,
      path: "/notifications",
    },
    
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
  className="w-20  h-80% mx-2 my-1 rounded-lg  bg-blue-900 shadow-lg flex flex-col justify-between items-center py-6"
>
  {/* TOP SECTION */}
  <div className="flex flex-col items-center space-y-6 w-full">
    {/* Logo o título reducido */}
    

    {/* Navegación de módulos */}
    <nav className="flex flex-col space-y-4 w-full items-center">
      {modules.map((module, index) => (
        <a
          key={index}
          href={module.path}
          className={`relative group p-2 rounded-lg hover:bg-indigo-500/20 transition-colors`}
        >
          <div className="text-indigo-300 group-hover:text-white">{module.icon}</div>
          {/* Indicador de página actual */}
          {location.pathname === module.path && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-8 h-1 rounded-2xl bg-white"></div>
          )}
        </a>
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
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet /> {/* Aquí se inyectará tu Dashboard.tsx actual */}
        </main>
                  <Footer></Footer>

      </div>
    </div>
  );
};
