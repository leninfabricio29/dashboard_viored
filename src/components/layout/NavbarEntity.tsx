import { useState, useEffect, useRef } from "react";
import {  Link } from "react-router-dom";
import authService from "../../services/auth-service";
import userService from "../../services/user-service";


interface User {
  name: string;
  role: string;
  avatar?: string;
  email: string;
}



const NavbarEntity = () => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [user, setUser] = useState<User>({
  name: "",
  role: "",
  avatar: "",
  email: "",
});

  const [loading, setLoading] = useState(true);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);

  console.log("User:", userId);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userIdFromToken = authService.getUserIdFromToken();
        if (userIdFromToken) {
          setUserId(userIdFromToken);
          const userData = await userService.getUserById(userIdFromToken);
          setUser({
            name: userData.name,
            role: userData.role,
            avatar: userData.avatar,
            email: userData.email
            //avatar: userData. ?? "",
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

 

 

  return (
    <header className=" m-2 bg-blue-900 rounded-lg   shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
           

            <span className="font-bold text-xl text-white hidden md:block tracking-tight">
              Panel de monitoreo V-<span className="text-white">SOS</span>
            </span>
          </Link>

          {/* Notificaciones y Usuario */}
          <div className="flex items-center space-x-6">
            {/* Usuario Dropdown */}
            <div className="relative hidden md:block" ref={userDropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-4 cursor-pointer px-3 py-2 rounded-lg  transition"
              >
                <div className="text-right mr-2 flex flex-col items-end space-y-1">
                  <div className="text-sm text-gray-200 font-bold">
                    {loading ? (
                      <span className="animate-pulse">Cargando...</span>
                    ) : (
                      user.email
                    )}
                  </div>
                  <div className="inline-flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                      Activo
                    </span>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white flex-shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`Avatar de ${user.name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-500 flex items-center justify-center text-gray-800 text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

              </button>

             
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavbarEntity;
