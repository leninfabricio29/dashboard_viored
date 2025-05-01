import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiChevronLeft, FiBell, FiCheck } from 'react-icons/fi'
import { getAllNotifications } from '../../../services/notifications-service'
import authService from '../../../services/auth-service'

const Notifications = () => {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === notificationId ? { ...notif, isRead: true } : notif
      )
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 rounded-2xl">
      {/* Header */}
      <header className="bg-blue-900 shadow-sm rounded-t-2xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <Link 
            to="/" 
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FiChevronLeft className="h-5 w-5 text-white" />
          </Link>
          <h1 className="text-xl font-bold flex items-center text-white">
            <FiBell className="mr-3 text-white" />
            Mis Notificaciones
          </h1>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Filtros y contadores */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
              <FiBell className="mr-1.5" />
              {notifications.filter(n => !n.isRead).length} Sin leer
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium">
              Total: {notifications.length}
            </span>
          </div>
          
        </div>

        {/* Lista de notificaciones */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-gray-500">Cargando...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <FiBell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No hay notificaciones</h3>
            <p className="mt-1 text-sm text-gray-500">Cuando tengas nuevas notificaciones, aparecerán aquí.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div 
                key={notification._id}
                className={`p-5 bg-white rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md ${
                  !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => markAsRead(notification._id)}
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className={`text-base font-medium ${
                      !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {notification.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500 self-start mt-1.5"></span>
                  )}
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {new Date(notification.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <Link
                    to={`/notificaciones/${notification._id}`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Ver detalles →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Notifications