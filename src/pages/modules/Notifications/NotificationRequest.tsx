import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiCheck,
  FiMap,
  FiSearch,
} from "react-icons/fi";
import userService from "../../../services/user-service";
import neighborhoodService, {
  Neighborhood,
} from "../../../services/neighborhood-service";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import ButtonHome from "../../../components/UI/ButtonHome";
import { getNotificationById } from "../../../services/notifications-service";
import Modal from "../../../components/UI/Modal";

const NotificationRequest = () => {
  const { id } = useParams();
  const [emitter, setEmitter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("");
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [assigningNeighborhood, setAssigningNeighborhood] = useState(false);
  const [neighborhoodsFiltered, setNeighborhoodsFiltered] = useState<
    Neighborhood[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBarrioModalOpen, setIsBarrioModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const notif = await getNotificationById(id as string);
        const user = await userService.getUserById(notif.notification.emitter);
        setEmitter(user);
      } catch (error) {
        console.error("Error cargando detalle de notificación:", error);
      } finally {
        setLoading(false);
      }

      if (isBarrioModalOpen) {
        await fetchNeighborhoods();
      }
    };

    fetchData();
  }, [id, isBarrioModalOpen]);

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

  const formatDate = (dateString: string) => {
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

  const getNeighborhoodName = () => {
    if (!emitter?.neighborhood) {
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
      return <p className="text-sm text-gray-500">Cargando barrios...</p>;
    }

    const neighborhoodId =
      typeof emitter.neighborhood === "object"
        ? emitter.neighborhood._id
        : emitter.neighborhood;

    const foundNeighborhood = neighborhoods.find(
      (n) => n._id === neighborhoodId
    );

    if (foundNeighborhood) {
      return (
        <div className="flex items-center">
          <p className="font-medium text-gray-800">{foundNeighborhood.name}</p>
          <button
            onClick={() => setIsBarrioModalOpen(true)}
            className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
          >
            <FiMapPin className="mr-1" /> Cambiar
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <p className="font-medium text-red-500">
          Barrio no encontrado (ID:{" "}
          {typeof emitter.neighborhood === "object"
            ? emitter.neighborhood._id
            : emitter.neighborhood}
          )
        </p>
        <button
          onClick={() => setIsBarrioModalOpen(true)}
          className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
        >
          <FiMapPin className="mr-1" /> Reasignar
        </button>
      </div>
    );
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

      setIsBarrioModalOpen(false);
      setSelectedNeighborhood("");
    } catch (err) {
      console.error("Error al asignar barrio:", err);
    } finally {
      setAssigningNeighborhood(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <ButtonIndicator />
        <ButtonHome />
      </div>

      <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white">
            Petición de Unión a Comunidad
          </h2>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-yellow-800 font-medium">
              El usuario {emitter?.name} ha solicitado unirse a un
              barrio/comunidad.
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
                  <p className="font-medium text-gray-800"> {emitter?.name} </p>
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
                    {formatDate(new Date().toISOString())}
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

      <Modal
        isOpen={isBarrioModalOpen}
        onClose={() => {
          setIsBarrioModalOpen(false);
          setSearchTerm("");
          setSelectedNeighborhood("");
        }}
        title={`Asignar barrio a ${emitter.name}`}
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
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
                    <FiCheck></FiCheck>
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
