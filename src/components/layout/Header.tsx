import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiHome, FiMenu, FiLogOut, FiSettings, FiUser, FiX, FiMap } from 'react-icons/fi'
import authService from '../../services/auth-service'
import userService from '../../services/user-service'
import { getAllNotifications } from '../../services/notifications-service'
import { FiBell } from 'react-icons/fi'



const Header = () => {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; role: string }>({ name: '', role: '' })
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Obtener el ID del usuario del token JWT
        const userId = authService.getUserIdFromToken()
        
        if (userId) {
          // Obtener los datos del usuario
          const userData = await userService.getUserById(userId)
          setUser({
            name: userData.name,
            role: userData.role
          })
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = authService.getUserIdFromToken()
        if (userId) {
          const notificationsData = await getAllNotifications(userId)
          setNotifications(notificationsData)
        }
      } catch (error) {
        console.error('Error al obtener notificaciones:', error)
      }
    }

    fetchNotifications()
  }, [])

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="bg-blue-950 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo y nombre de la app */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <FiHome className="h-6 w-6 mr-2" />
              <span className="font-bold text-xl hidden md:block">Panel de Administración</span>
            </Link>
          </div>

          {/* Menú para móviles */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu}
              className="p-2 rounded-md hover:bg-blue-900 focus:outline-none"
            >
              {isMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>

          {/* Información de usuario y menú para desktop */}
          <div className="hidden md:flex items-center space-x-4">
          
          <div className="relative">
  <button
    className="relative"
    onClick={() => setShowNotifications(!showNotifications)}
  >
    <FiBell className="h-6 w-6 text-white" />
    {notifications.length > 0 && (
      <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-xs px-1.5">
        {notifications.length}
      </span>
    )}
  </button>

  {showNotifications && (
    <div className="absolute right-0 mt-2 w-96 max-h-[400px] bg-white text-black rounded-lg shadow-2xl z-50 overflow-y-auto ">
      <div className="p-4 font-semibold  bg-gray-100">Notificaciones</div>
      <ul className="divide-y divide-gray-200 ">
        {notifications.slice(0, 4).map((notif) => (
          <li key={notif._id} className="px-4 py-3 hover:bg-blue-200 cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-800">{notif.title}</div>
                <div className="text-xs text-gray-500 mt-1">{notif.message}</div>
              </div>
              <Link
                to={`/notificaciones/${notif._id}`}
                className="text-xs text-blue-600 hover:underline ml-2"
              >
                Ver
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <div className="text-center p-3 text-sm">
        <Link
          to="/notificaciones"
          className="text-blue-700 font-medium hover:underline"
        >
          Ver todas
        </Link>
      </div>
    </div>
  )}
</div>

            <div className="text-sm text-right">
              {loading ? (
                <span className="animate-pulse">Cargando...</span>
              ) : (
                <div>{user.role} / {user.name}</div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={handleLogout}
                className="flex items-center text-sm px-3 py-2 rounded hover:bg-blue-900"
              >
                <FiLogOut className="mr-2" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {isMenuOpen && (
        <div className="md:hidden bg-blue-900">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <div className="text-white px-4 py-2 text-sm">
              {loading ? "Cargando..." : `${user.role} / ${user.name}`}
            </div>
            <Link 
              to="/" 
              className="text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <FiHome className="mr-2" />
                Inicio
              </div>
            </Link>
            <Link 
              to="/users" 
              className="text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <FiUser className="mr-2" />
                Usuarios
              </div>
            </Link>
            <Link 
              to="/maps" 
              className="text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <FiMap className="mr-2" />
                Mapas
              </div>
            </Link>
            <Link 
              to="/settings" 
              className="text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <FiSettings className="mr-2" />
                Configuración
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="text-white w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
            >
              <div className="flex items-center">
                <FiLogOut className="mr-2" />
                Cerrar sesión
              </div>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header