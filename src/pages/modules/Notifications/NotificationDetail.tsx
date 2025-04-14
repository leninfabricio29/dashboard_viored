import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getNotificationById } from '../../../services/notifications-service'
import userService from '../../../services/user-service'
import ButtonIndicator from '../../../components/UI/ButtonIndicator'
import ButtonHome from '../../../components/UI/ButtonHome'


const NotificationDetail = () => {
    const { id } = useParams()
    const [notification, setNotification] = useState<any>(null)
    const [emitter, setEmitter] = useState<any>(null)
    const [loading, setLoading] = useState(true)
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const notif = await getNotificationById(id as string)
          setNotification(notif)
  
          const user = await userService.getUserById(notif.notification.emitter)
          setEmitter(user)
        } catch (error) {
          console.error('Error cargando detalle de notificación:', error)
        } finally {
          setLoading(false)
        }
      }
  
      fetchData()
    }, [id])
  
    const handleValidate = () => {
      if (!emitter) return
      alert(
        `✅ Registro validado.\n\n📧 Correo: ${emitter.email}\n🔐 Contraseña: ${emitter.ci}`
      )
    }
  
    if (loading) return <div className="p-4">Cargando...</div>
    if (!notification) return <div className="p-4">Notificación no encontrada.</div>
  
    return (
    <div className="max-w-3xl mx-auto px-4 py-6">
    <ButtonIndicator></ButtonIndicator>
     <div className="max-w-3xl mx-auto mt-8 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-blue-800">{notification.notification.title}</h2>
        <p className="mb-2 text-gray-700">{notification.notification.message}</p>
        <p className="text-sm text-gray-500 mb-4">
          Fecha: {new Date(notification.notification.updatedAt).toLocaleString()}
        </p>
  
        {emitter && (
  <div className="border-t pt-6 mt-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
      <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 10a3 3 0 100-6 3 3 0 000 6z" />
        <path
          fillRule="evenodd"
          d="M.458 15.042A9.978 9.978 0 0110 0a9.978 9.978 0 019.542 15.042C17.17 16.89 13.84 18 10 18s-7.17-1.11-9.542-2.958zM10 16c3.313 0 6-1.343 6-3H4c0 1.657 2.687 3 6 3z"
          clipRule="evenodd"
        />
      </svg>
      Datos del Usuario Registrado
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
      <div>
        <span className="font-semibold text-gray-600">👤 Nombre:</span> {emitter.name}
      </div>
      <div>
        <span className="font-semibold text-gray-600">📧 Correo:</span> {emitter.email}
      </div>
      <div>
        <span className="font-semibold text-gray-600">🪪 CI:</span> {emitter.ci}
      </div>
      <div>
        <span className="font-semibold text-gray-600">📱 Teléfono:</span> {emitter.phone || 'No registrado'}
      </div>
      <div>
        <span className="font-semibold text-gray-600">🎓 Rol:</span> 
        <span className={`ml-1 inline-block px-2 py-0.5 rounded text-xs font-medium 
          ${emitter.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
          {emitter.role}
        </span>
      </div>
      <div>
        <span className="font-semibold text-gray-600">⚙️ Estado:</span> 
        <span className={`ml-1 inline-block px-2 py-0.5 rounded text-xs font-medium 
          ${emitter.isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {emitter.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      <div className="md:col-span-2">
        <span className="font-semibold text-gray-600">🕒 Registrado el:</span> {new Date(emitter.createdAt).toLocaleString()}
      </div>
    </div>

    <button
      onClick={handleValidate}
      className="mt-6 w-full md:w-auto bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg shadow transition duration-300"
    >
       Validar Registro
    </button>
  </div>
)}


      </div>
      <ButtonHome></ButtonHome>
    </div>
     
    )
  }
  
  export default NotificationDetail
  