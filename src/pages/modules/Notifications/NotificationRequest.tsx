import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiCheck,
  FiMap,
  FiSearch,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowLeft,
} from "react-icons/fi";
import userService from "../../../services/user-service";
import neighborhoodService, {
  Neighborhood,
} from "../../../services/neighborhood-service";
import { entityUsersService } from "../../../services/entity.service";
import {
  getNotificationById,
  markNotificationAsRead,
} from "../../../services/notifications-service";
import Modal from "../../../components/UI/Modal";

const NotificationRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [emitter, setEmitter] = useState<any>(null);
  const [notification, setNotification] = useState<any>(null);
  const [targetEntity, setTargetEntity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados para asignación de barrio
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("");
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [assigningNeighborhood, setAssigningNeighborhood] = useState(false);
  const [neighborhoodsFiltered, setNeighborhoodsFiltered] = useState<
    Neighborhood[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBarrioModalOpen, setIsBarrioModalOpen] = useState(false);

  // Estados para aceptación de suscripción a entidad
  const [acceptingEntity, setAcceptingEntity] = useState(false);
  const [entityAccepted, setEntityAccepted] = useState(false);
  const [entityError, setEntityError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const notifData = await getNotificationById(id as string);
        const notif = notifData.notification;
        setNotification(notif);

        if (id && notif && !notif.isRead) {
          try {
            await markNotificationAsRead(id);
          } catch (e) {
            console.error("Error al marcar notificación como leída:", e);
          }
        }

        if (notif?.emitter) {
          const userEmitterId =
            typeof notif.emitter === "object"
              ? notif.emitter._id
              : notif.emitter;
          const user = await userService.getUserById(userEmitterId);
          setEmitter(user);
        }

        const isEntity = Boolean(
          notif?.title?.toLowerCase().includes("suscripción") ||
            notif?.title?.toLowerCase().includes("suscripcion") ||
            notif?.message?.toLowerCase().includes("equipo de seguridad") ||
            notif?.message?.toLowerCase().includes("entidad")
        );

        if (isEntity && notif?.receiver) {
          const entityId =
            typeof notif.receiver === "object"
              ? notif.receiver._id
              : notif.receiver;
          try {
            const entityData = await entityUsersService.getEntityById(entityId);
            setTargetEntity(entityData);
          } catch (err) {
            console.error("Error al obtener la entidad:", err);
          }
        } else {
          await fetchNeighborhoods();
        }
      } catch (error) {
        console.error("Error cargando detalle de notificación:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setNeighborhoodsFiltered(neighborhoods);
    } else {
      const filtered = neighborhoods.filter((neighborhood) =>
        neighborhood.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setNeighborhoodsFiltered(filtered);
    }
  }, [searchTerm, neighborhoods]);

  useEffect(() => {
    if (isBarrioModalOpen) {
      fetchNeighborhoods();
    }
  }, [isBarrioModalOpen]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("es-ES", options);
  };

  const fetchNeighborhoods = async () => {
    try {
      setLoadingNeighborhoods(true);
      const data = await neighborhoodService.getAllNeighborhoods();
      setNeighborhoods(data);
    } catch (err) {
      console.error("Error al cargar barrios:", err);
    } finally {
      setLoadingNeighborhoods(false);
    }
  };

  const handleAcceptEntitySubscription = async () => {
    if (!emitter || !notification?.receiver) return;

    try {
      setAcceptingEntity(true);
      setEntityError(null);
      const entityId =
        typeof notification.receiver === "object"
          ? notification.receiver._id
          : notification.receiver;

      await entityUsersService.acceptPetition(emitter._id, entityId);
      setEntityAccepted(true);
      await markNotificationAsRead(id as string);
    } catch (err: any) {
      console.error("Error al aceptar suscripción a entidad:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al procesar la solicitud.";
      setEntityError(msg);
    } finally {
      setAcceptingEntity(false);
    }
  };

  const assignNeighborhood = async () => {
    if (!selectedNeighborhood || !emitter) return;

    try {
      setAssigningNeighborhood(true);
      await neighborhoodService.addUserToNeighborhood(
        selectedNeighborhood,
        emitter._id
      );

      const updatedUser = await userService.getUserById(emitter._id);
      setEmitter(updatedUser);
      await fetchNeighborhoods();
      await markNotificationAsRead(id as string);

      setIsBarrioModalOpen(false);
      setSelectedNeighborhood("");
    } catch (err) {
      console.error("Error al asignar barrio:", err);
    } finally {
      setAssigningNeighborhood(false);
    }
  };

  const getNeighborhoodName = () => {
    if (!emitter) return null;

    if (!emitter.neighborhood) {
      return (
        <div className="flex items-center">
          <p className="font-medium text-amber-600">No asignado</p>
          <button
            onClick={() => setIsBarrioModalOpen(true)}
            className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
          >
            <FiMapPin className="mr-1" /> Asignar ahora
          </button>
        </div>
      );
    }

    if (loadingNeighborhoods) {
      return (
        <div className="flex items-center">
          <div className="animate-spin h-4 w-4 mr-2 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          <p className="text-sm text-gray-500">Cargando barrio...</p>
        </div>
      );
    }

    let neighborhoodId: string | null = null;
    let neighborhoodName: string | undefined = undefined;

    if (
      typeof emitter.neighborhood === "object" &&
      emitter.neighborhood !== null
    ) {
      neighborhoodId = emitter.neighborhood._id;
      neighborhoodName = emitter.neighborhood.name;
    } else if (typeof emitter.neighborhood === "string") {
      neighborhoodId = emitter.neighborhood;
      const foundNeighborhood = neighborhoods.find(
        (n) => n._id === neighborhoodId
      );
      neighborhoodName = foundNeighborhood?.name;
    }

    if (neighborhoodName) {
      return (
        <div className="flex items-center">
          <div className="flex items-center bg-green-50 px-3 py-1.5 rounded-full">
            <p className="font-medium text-green-800">{neighborhoodName}</p>
          </div>
          <button
            onClick={() => setIsBarrioModalOpen(true)}
            className="ml-3 px-3 py-1.5 text-xs bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center"
          >
            Cambiar
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <div className="flex items-center bg-red-50 px-3 py-1.5 rounded-full">
          <FiMapPin className="text-red-600 mr-2 h-4 w-4" />
          <p className="font-medium text-red-800">Barrio no encontrado</p>
        </div>
        <button
          onClick={() => setIsBarrioModalOpen(true)}
          className="ml-3 px-3 py-1.5 text-xs bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center"
        >
          Reasignar
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isEntityRequest = Boolean(
    notification?.title?.toLowerCase().includes("suscripción") ||
      notification?.title?.toLowerCase().includes("suscripcion") ||
      notification?.message?.toLowerCase().includes("equipo de seguridad") ||
      notification?.message?.toLowerCase().includes("entidad")
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        <FiArrowLeft className="mr-2" /> Volver a notificaciones
      </button>

      {isEntityRequest ? (
        /* ESCENARIO 1: Solicitud de Suscripción a Entidad */
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiShield className="h-6 w-6 text-white" />
              <h2 className="text-xl font-bold text-white">
                Solicitud de Suscripción a Entidad
              </h2>
            </div>
            {targetEntity && (
              <span className="bg-blue-500/30 text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
                {targetEntity.name}
              </span>
            )}
          </div>

          <div className="p-6">
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start space-x-3">
              <FiAlertCircle className="text-blue-600 h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-900 font-semibold">
                  {notification?.title || "Solicitud de Suscripción"}
                </p>
                <p className="text-blue-800 text-sm mt-1">
                  {notification?.message ||
                    `${emitter?.name} solicita unirse a la entidad.`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2 text-gray-700">
                  Información del Usuario
                </h3>

                <div className="flex items-center">
                  <FiUser className="text-gray-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="font-medium text-gray-800">
                      {emitter?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FiMail className="text-gray-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">
                      {emitter?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FiPhone className="text-gray-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Teléfono</p>
                    <p className="font-medium text-gray-800">
                      {emitter?.phone ? emitter.phone : "No registrado"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FiCalendar className="text-gray-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Fecha de solicitud</p>
                    <p className="text-sm font-medium text-gray-800">
                      {formatDate(notification?.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2 text-gray-700">
                  Detalles de la Suscripción
                </h3>

                {targetEntity && (
                  <div className="flex items-center">
                    <FiShield className="text-blue-500 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">
                        Entidad Solicitada
                      </p>
                      <p className="font-medium text-gray-800">
                        {targetEntity.name}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <FiCheckCircle className="text-gray-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">
                      Suscripciones del Usuario
                    </p>
                    <p className="font-medium text-gray-800">
                      {emitter?.amount_suscribed || 0} /{" "}
                      {emitter?.max_limit_suscribed || 2} límite
                    </p>
                  </div>
                </div>

                {entityError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {entityError}
                  </div>
                )}

                {entityAccepted ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-800 font-medium">
                    <FiCheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ¡Suscripción aceptada correctamente!
                  </div>
                ) : (
                  <div className="pt-4">
                    <button
                      onClick={handleAcceptEntitySubscription}
                      disabled={acceptingEntity}
                      className="w-full md:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow transition-colors flex items-center justify-center space-x-2"
                    >
                      {acceptingEntity ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <FiCheck className="h-5 w-5" />
                          <span>Aceptar Suscripción a Entidad</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ESCENARIO 2: Solicitud de Unión a Barrio / Comunidad */
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white">
              Petición de Unión a Comunidad / Barrio
            </h2>
          </div>

          <div className="p-6">
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-yellow-800 font-medium">
                {notification?.message ||
                  `El usuario ${emitter?.name} ha solicitado unirse a un barrio/comunidad.`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2 text-gray-700">
                  Información del Usuario
                </h3>

                <div className="flex items-center">
                  <FiUser className="text-gray-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="font-medium text-gray-800">
                      {" "}
                      {emitter?.name}{" "}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FiMail className="text-gray-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">{emitter?.email}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FiPhone className="text-gray-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Teléfono</p>
                    <p className="font-medium text-gray-800">
                      {emitter?.phone ? emitter.phone : "No registrado"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FiCalendar className="text-gray-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Fecha de solicitud</p>
                    <p className="text-sm font-medium text-gray-800">
                      {formatDate(notification?.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2 text-gray-700">
                  Ubicación Actual
                </h3>

                <div className="flex items-center">
                  <FiMapPin className="text-gray-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Barrio</p>
                    {getNeighborhoodName()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para asignación de barrio */}
      <Modal
        isOpen={isBarrioModalOpen}
        onClose={() => {
          setIsBarrioModalOpen(false);
          setSearchTerm("");
          setSelectedNeighborhood("");
        }}
        title={`Asignar barrio a ${emitter?.name}`}
      >
        <div className="p-4">
          <p className="mb-4">
            Selecciona el barrio al que deseas asignar a este usuario:
          </p>

          <div className="mb-6">
            <div className="relative w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar barrio..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loadingNeighborhoods ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : neighborhoodsFiltered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {neighborhoodsFiltered.map((neighborhood) => (
                  <div
                    key={neighborhood._id}
                    className={`relative flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all duration-200 min-h-[120px] ${
                      selectedNeighborhood === neighborhood._id
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedNeighborhood(neighborhood._id)}
                  >
                    {selectedNeighborhood === neighborhood._id && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                        <FiCheck className="h-3 w-3" />
                      </div>
                    )}

                    <FiMap className="text-gray-400 w-8 h-8 mb-2" />

                    <h3 className="font-bold text-sm text-gray-800 text-center">
                      {neighborhood.name}
                    </h3>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="mt-2 text-gray-500">No se encontraron barrios</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-2 text-blue-500 hover:underline"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6 space-x-3">
            <button
              onClick={() => {
                setIsBarrioModalOpen(false);
                setSearchTerm("");
                setSelectedNeighborhood("");
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={assignNeighborhood}
              disabled={!selectedNeighborhood || assigningNeighborhood}
              className={`px-4 py-2 rounded-lg flex items-center ${
                !selectedNeighborhood || assigningNeighborhood
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              } transition-colors`}
            >
              {assigningNeighborhood ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <FiCheck />
                  </svg>
                  Asignando...
                </>
              ) : (
                "Asignar barrio"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NotificationRequest;
