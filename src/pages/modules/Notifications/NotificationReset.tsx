import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getNotificationById } from "../../../services/notifications-service";
import userService from "../../../services/user-service";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import ButtonHome from "../../../components/UI/ButtonHome";

const NotificationDetail = () => {
  const { id } = useParams();
  const [notification, setNotification] = useState<any>(null);
  const [emitter, setEmitter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const notif = await getNotificationById(id as string);
        setNotification(notif);

        const user = await userService.getUserById(notif.notification.emitter);
        setEmitter(user);
      } catch (error) {
        console.error("Error cargando detalle de notificación:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleValidate = async () => {
    if (!emitter) return;

    try {
      await userService.validateUser(emitter._id);

      alert(
        `✅ Registro validado correctamente.\n\n📧 Correo: ${emitter.email}\n🔐 Contraseña: ${emitter.ci}`
      );

      // Puedes actualizar el estado del usuario si deseas mostrar que ya está activo
      setEmitter({ ...emitter, isActive: true });
    } catch (error) {
      alert("❌ Hubo un error al validar el usuario. Inténtalo nuevamente.");
      console.error("Error al validar usuario:", error);
    }
  };

  // Componente auxiliar para mostrar tarjetas de información
  const InfoCard = ({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) => (
    <div className="bg-white p-3 rounded-lg border border-gray-100">
      <div className="flex items-center space-x-3">
        <span className="text-blue-500 text-xl">{icon}</span>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-gray-800 font-medium mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="p-4">Cargando...</div>;
  if (!notification)
    return <div className="p-4">Notificación no encontrada.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <ButtonIndicator />
      <ButtonHome />

      {/* Tarjeta principal de notificación */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
        {/* Encabezado con gradiente morado */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white">
            Solicitud de Reseteo de Contraseña
          </h2>
        </div>

        {/* Cuerpo */}

        <div className="p-6">
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {notification.notification.message}
            </p>
          </div>

          <div className="mt-4 flex items-center text-sm text-gray-500">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {new Date(notification.notification.updatedAt).toLocaleString(
              "es-ES",
              {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 px-6 py-6 bg-gray-50">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-2 rounded-full">
              <svg
                className="w-6 h-6 text-purple-700"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 10a3 3 0 100-6 3 3 0 000 6z" />
                <path
                  fillRule="evenodd"
                  d="M.458 15.042A9.978 9.978 0 0110 0a9.978 9.978 0 019.542 15.042C17.17 16.89 13.84 18 10 18s-7.17-1.11-9.542-2.958zM10 16c3.313 0 6-1.343 6-3H4c0 1.657 2.687 3 6 3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-800">
              Información del Usuario
            </h3>
          </div>

          {/* Información esencial del usuario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ">
            <InfoCard
              icon="👤"
              label="Nombre"
              value={emitter.name}
              
            />
            <InfoCard
              icon="📧"
              label="Correo"
              value={emitter.email}
              
            />
            <InfoCard
              icon="🪪"
              label="Identificación"
              value={emitter.ci}
              
            />
          </div>

          {/* Fecha de la solicitud */}
          <div className="md:col-span-2">
            <InfoCard
              icon="🕒"
              label="Petición de reseteo de contraseña:"
              value={new Date(emitter.createdAt).toLocaleString()}
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="border-t border-gray-200 px-6 py-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleValidate}
              disabled={emitter.isActive}
              className={`flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-200 cursor-pointer ${
                emitter.isActive ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Aprobar Reseteo
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetail;
