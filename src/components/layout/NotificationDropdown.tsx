import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FiBell, FiChevronRight } from 'react-icons/fi'
import useClickOutside from '../../hooks/useClickOutside'

interface Notification {
  _id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

interface NotificationsDropdownProps {
  notifications: Notification[]
  onNotificationClick?: (id: string) => void // Nueva prop para manejar el clic
}

const NotificationsDropdown = ({ notifications, onNotificationClick }: NotificationsDropdownProps) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useClickOutside(dropdownRef, () => {
    setShowNotifications(false)
  })

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleNotificationClick = (id: string) => {
    setShowNotifications(false)
    if (onNotificationClick) {
      onNotificationClick(id) // Esto marcará la notificación como leída
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-1 rounded-full hover:bg-blue-900 transition-colors duration-200"
        onClick={toggleNotifications}
        aria-expanded={showNotifications}
        aria-label="Notificaciones"
      >
        <FiBell className="h-5 w-5 text-white" />
        {notifications.filter(n => !n.isRead).length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
            {notifications.filter(n => !n.isRead).length}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-900 to-blue-800">
            <h3 className="font-semibold text-white">Notificaciones</h3>
            <span className="text-xs text-blue-100 font-bold">
              {notifications.filter(n => !n.isRead).length} sin leer
            </span>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No hay notificaciones nuevas
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.slice(0, 5).map((notif) => (
                  <li 
                  key={notif._id} 
                  className={`px-4 py-3 transition-colors ${
                    !notif.isRead 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : 'bg-white'
                  }`}
                >
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 h-2 w-2 mt-1.5 rounded-full ${notif.isRead ? 'invisible' : 'bg-blue-500'}`} />
                      <div className="ml-2 flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-normal text-gray-700'}`}>
                            {notif.title}
                          </h4>
                          <span className="text-xs text-gray-400 ml-2">
                            {formatDate(notif.createdAt)}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 line-clamp-2 ${!notif.isRead ? 'text-gray-600' : 'text-gray-500'}`}>
                          {notif.message}
                        </p>
                        <div className="mt-2">
                          <Link
                            to={`/notificaciones/${notif._id}`}
                            className="text-xs flex items-center text-blue-600 hover:text-blue-800"
                            onClick={() => handleNotificationClick(notif._id)}
                          >
                            Ver detalles <FiChevronRight className="ml-1" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 p-2 text-center">
            <Link
              to="/notifications"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center"
              onClick={() => setShowNotifications(false)}
            >
              Ver todas las notificaciones
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationsDropdown