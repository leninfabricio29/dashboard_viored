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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

      setSuccessMessage(
        `✅ Registro validado correctamente.\n\n📧 Correo: ${emitter.email}\n🔐 Contraseña: ${emitter.ci}`
      );
      setErrorMessage(null);

      // Puedes actualizar el estado del usuario si deseas mostrar que ya está activo
      setEmitter({ ...emitter, isActive: true });
    } catch (error) {
      setErrorMessage(
        "❌ Hubo un error al validar el usuario. Inténtalo nuevamente."
      );
      setSuccessMessage(null);
      console.error("Error al validar usuario:", error);
    }
  };

  // Componente auxiliar para mostrar tarjetas de información
  const InfoCard = ({
    icon,
    label,
    value,
  }: {
    icon: string;
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
  if (!notification)
    return <div className="p-4">Notificación no encontrada.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <ButtonIndicator />
      <ButtonHome />

      {/* Alertas */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded mb-6">
          <div className="flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <div className="font-bold mb-1">¡Operación exitosa!</div>
              <div className="whitespace-pre-line">{successMessage}</div>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 flex items-start">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <div className="font-bold mb-1">Error</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Tarjeta principal de notificación */}
      <div className="bg-white shadow-lg rounded-xl  border border-gray-100 overflow-hidden">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white">
            {notification.notification.title}
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

        {emitter && (
          <div className="border-t border-gray-200 px-6 py-6 bg-gray-50">
            {/* Sección del emisor */}
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-2 rounded-full">
                <svg
                  className="w-6 h-6 text-blue-700"
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

            {/* Grid de información */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard icon="👤" label="Nombre" value={emitter.name} />
              <InfoCard icon="📧" label="Correo" value={emitter.email} />
              <InfoCard icon="🪪" label="CI" value={emitter.ci} />
              <InfoCard
                icon="📱"
                label="Teléfono"
                value={emitter.phone || "No registrado"}
              />
              <InfoCard
                icon="🎓"
                label="Rol"
                value={
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      emitter.role === "admin"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {emitter.role}
                  </span>
                }
              />
              <InfoCard
                icon="⚙️"
                label="Estado"
                value={
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      emitter.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {emitter.isActive ? "Activo" : "Inactivo"}
                  </span>
                }
              />
              <div className="md:col-span-2">
                <InfoCard
                  icon="🕒"
                  label="Registrado el"
                  value={new Date(emitter.createdAt).toLocaleString()}
                />
              </div>
            </div>

            {/* Botón de acción */}
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Usuario ya validado
                  </>
                ) : (
                  <>
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
