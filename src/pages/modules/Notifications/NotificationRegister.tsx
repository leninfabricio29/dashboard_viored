import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getNotificationById } from "../../../services/notifications-service";
import userService from "../../../services/user-service";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import ButtonHome from "../../../components/UI/ButtonHome";
import Swal from "sweetalert2";
import {
  FiUser,
  FiMail,
  FiSmartphone,
  FiClock,
  FiCheckCircle,
  FiInfo,
  FiShield,
  FiActivity,
} from "react-icons/fi";

const NotificationDetail = () => {
  const { id } = useParams();
  const [notification, setNotification] = useState<any>(null);
  const [emitter, setEmitter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [type_suscription, setTypeSuscription] = useState<string | null>(null);

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
    if (!type_suscription) {
      Swal.fire({
        icon: "warning",
        title: "Tipo de suscripción requerido",
        text: "Por favor, selecciona un tipo de suscripción antes de validar el usuario.",
      });
      return;
    }

    if (!emitter) return;

    try {
      await userService.validateUser(emitter._id, type_suscription);
      Swal.fire({
        icon: "success",
        title: "Usuario validado",
        text: "El usuario ha sido validado exitosamente. Se le ha asignado la suscripción correspondiente.",
      });
      setEmitter({ ...emitter, isActive: true });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al validar usuario",
        text: "Ocurrió un error al validar el usuario. Por favor, intenta nuevamente.",
      });
      
    }
  };

  const InfoCard = ({
    icon,
    label,
    value,
  }: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
  }) => (
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
  if (!notification) return <div className="p-4">Notificación no encontrada.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <ButtonIndicator />
        <ButtonHome />
      </div>

      

      <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white">{notification.notification.title}</h2>
        </div>

        <div className="p-6">
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {notification.notification.message}
            </p>
          </div>

          <div className="mt-4 flex items-center text-sm text-gray-500">
            <FiClock className="w-4 h-4 mr-2" />
            {new Date(notification.notification.updatedAt).toLocaleString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {emitter && (
          <div className="border-t border-gray-200 px-6 py-6 bg-gray-50">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-2 rounded-full">
                <FiUser className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">
                Información del Usuario
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard icon={<FiUser />} label="Nombre" value={emitter.name} />
              <InfoCard icon={<FiMail />} label="Correo" value={emitter.email} />
              <InfoCard icon={<FiShield />} label="CI" value={emitter.ci} />
              <InfoCard icon={<FiSmartphone />} label="Teléfono" value={emitter.phone || "No registrado"} />
              <InfoCard
                icon={<FiActivity />}
                label="Rol"
                value={
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    emitter.role === "admin"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {emitter.role}
                  </span>
                }
              />
              <InfoCard
                icon={<FiInfo />}
                label="Estado"
                value={
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    emitter.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {emitter.isActive ? "Activo" : "Inactivo"}
                  </span>
                }
              />
              <div className="md:col-span-2">
                <InfoCard icon={<FiClock />} label="Registrado el" value={new Date(emitter.createdAt).toLocaleString()} />
              </div>
            </div>

            <div className="mt-6 text-sm">
              <label htmlFor="type_suscription" className="block text-gray-700 font-medium mb-2">
                Tipo de suscripción
              </label>
              <select
                id="type_suscription"
                value={type_suscription || ""}
                onChange={(e) => setTypeSuscription(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecciona una opción</option>
                <option value="viored">Viored</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleValidate}
                disabled={emitter.isActive}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm transition-colors duration-200 ${
                  emitter.isActive
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {emitter.isActive ? (
                  <>
                    <FiCheckCircle className="w-5 h-5 mr-2" />
                    Usuario ya validado
                  </>
                ) : (
                  <>
                    <FiShield className="w-5 h-5 mr-2" />
                    Validar Registro
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDetail;
