import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FiTrash2,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiMap,
  FiCheck,
  FiSearch
} from "react-icons/fi";
import userService from "../../../services/user-service";
import { User } from "../../../types/user.types";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import Modal from "../../../components/UI/Modal";
import Map from "../../../components/UI/Map";
import ButtonHome from "../../../components/UI/ButtonHome";
import neighborhoodService, {
  Neighborhood,
} from "../../../services/neighborhood-service";

const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isBarrioModalOpen, setIsBarrioModalOpen] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("");
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [assigningNeighborhood, setAssigningNeighborhood] = useState(false);
  const [neighborhoodsFiltered, setNeighborhoodsFiltered] = useState<
    Neighborhood[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");


  useEffect(() => {
    const fetchData = async () => {
      // Cargar datos del usuario si hay un ID
      if (id) {
        try {
          setLoading(true);
          const userData = await userService.getUserById(id);
          setUser(userData);
        } catch (err) {
          console.error(`Error al cargar usuario con ID ${id}:`, err);
          setError("No se pudo cargar la información del usuario");
        } finally {
          setLoading(false);
        }
      }

      // Cargar barrios si el modal está abierto
      if (isBarrioModalOpen) {
        await fetchNeighborhoods();
      }
    };

    fetchData();
  }, [id, isBarrioModalOpen]); // Dependencias combinadas

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

  const handleDeleteUser = async () => {
    if (!user) return;

    if (
      window.confirm(
        `¿Estás seguro de que deseas eliminar al usuario ${user.name}?`
      )
    ) {
      try {
        await userService.deleteUser(user._id);
        navigate("/users");
      } catch (err) {
        console.error("Error al eliminar usuario:", err);
        setError("Error al eliminar el usuario. Intente nuevamente.");
      }
    }
  };

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
      setLoadingNeighborhoods(false);
    } catch (err) {
      console.error("Error al cargar barrios:", err);
      setLoadingNeighborhoods(false);
    }
  };

  const assignNeighborhood = async () => {
    if (!selectedNeighborhood || !user) return;

    try {
      setAssigningNeighborhood(true);
      await neighborhoodService.addUserToNeighborhood(
        selectedNeighborhood,
        user._id
      );

      // Actualizar la información del usuario después de asignar
      const updatedUser = await userService.getUserById(user._id);
      setUser(updatedUser);

      setIsBarrioModalOpen(false);
      setSelectedNeighborhood("");
      setAssigningNeighborhood(false);
    } catch (err) {
      console.error("Error al asignar barrio:", err);
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

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-8 bg-red-100 border-l-4 border-red-500 p-4 rounded shadow">
        <p className="text-red-700">{error}</p>
        <Link
          to="/users"
          className="mt-2 inline-block text-blue-600 hover:underline"
        >
          Volver a la lista de usuarios
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto mt-8 text-center">
        <div className="bg-gray-100 p-8 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Usuario no encontrado</h2>
          <Link to="/users" className="text-blue-600 hover:underline">
            Volver a la lista de usuarios
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4">
        <ButtonIndicator />
      </div>

      {/* Card de Usuario */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-blue-300 to-blue-500 text-white p-6">
          <div className="flex items-center">
            <div className="bg-white/20 p-3 rounded-full mr-4">
              <FiUser className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <div className="flex items-center mt-1">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {user.isActive ? "Activo" : "Inactivo"}
                </span>
                <span className="ml-2 text-sm opacity-90">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna 1: Información de contacto */}
            <div className="space-y-4">
              <h2 className="font-medium text-lg border-b pb-2 text-gray-700">
                Información personal
              </h2>

              <div className="flex items-center">
                <FiMail className="text-gray-500 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-800">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FiPhone className="text-gray-500 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="font-medium text-gray-800">{user.phone}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FiCalendar className="text-blue-500 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Se unió</p>
                  <p className="text-sm font-medium text-indigo-600">
                    {(() => {
                      const joinDate = new Date(user.createdAt);
                      const now = new Date();
                      const diffTime = Math.abs(
                        now.getTime() - joinDate.getTime()
                      );
                      const diffDays = Math.ceil(
                        diffTime / (1000 * 60 * 60 * 24)
                      );

                      if (diffDays < 30) {
                        return `Hace ${diffDays} días`;
                      } else if (diffDays < 365) {
                        const months = Math.floor(diffDays / 30);
                        return `Hace ${months} ${
                          months === 1 ? "mes" : "meses"
                        }`;
                      } else {
                        const years = Math.floor(diffDays / 365);
                        return `Hace ${years} ${years === 1 ? "año" : "años"}`;
                      }
                    })()}
                    <span className="text-xs text-gray-500 ml-1">
                      ({formatDate(user.createdAt)})
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Columna 2: Información de ubicación */}
            <div className="space-y-4">
              <h2 className="font-medium text-lg border-b pb-2 text-gray-700">
                Ubicación
              </h2>

              <div className="flex items-center">
                <FiMapPin className="text-gray-500 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Barrio</p>
                  {user.neighborhood ? (
                    <p className="font-medium text-gray-800">
                      {user.neighborhood}
                    </p>
                  ) : (
                    <div className="flex items-center">
                      <p className="font-medium text-amber-600">No asignado</p>
                      <button
                        onClick={() => setIsBarrioModalOpen(true)}
                        className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
                      >
                        <FiMapPin className="mr-1" /> Asignar ahora
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <FiMap className="text-gray-500 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Última ubicación</p>
                  {user.lastLocation && user.lastLocation.coordinates ? (
                    <div>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-700">
                          [{user.lastLocation.coordinates[0].toFixed(4)},{" "}
                          {user.lastLocation.coordinates[1].toFixed(4)}]
                        </span>
                        {user.lastLocation.coordinates[0] !== 0 && (
                          <button
                            className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            onClick={() => setIsMapModalOpen(true)}
                          >
                            Ver mapa
                          </button>
                        )}
                      </div>
                      {user.lastLocation.lastUpdated && (
                        <p className="text-xs text-gray-500 mt-1">
                          Actualizado:{" "}
                          {formatDate(user.lastLocation.lastUpdated)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium text-gray-800">No disponible</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={handleDeleteUser}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition-colors"
            >
              <FiTrash2 className="mr-2" /> Eliminar usuario
            </button>
          </div>
        </div>
      </div>

      {/* Modal del mapa */}
      <Modal
  isOpen={isMapModalOpen}
  onClose={() => setIsMapModalOpen(false)}
  title={`Ubicación de ${user.name}`}
>
  {user.lastLocation && user.lastLocation.coordinates && (
    <Map
      coordinates={[
        user.lastLocation.coordinates[0], // Longitud
        user.lastLocation.coordinates[1]  // Latitud
      ]}
    />
  )}
</Modal>

      {/* Modal para asignar barrio */}
      {/* Modal para asignar barrio */}
      <Modal
        isOpen={isBarrioModalOpen}
        onClose={() => {
          setIsBarrioModalOpen(false);
          setSearchTerm("");
          setSelectedNeighborhood("");
        }}
        title={`Asignar barrio a ${user.name}`}
      >
        <div className="p-4">
          <p className="mb-4">
            Selecciona el barrio al que deseas asignar a este usuario:
          </p>

          {/* Buscador */}
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

          {/* Lista de tarjetas */}
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
      {/* Checkmark para selección */}
      {selectedNeighborhood === neighborhood._id && (
        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
          <FiCheck className="h-3 w-3" />
        </div>
      )}

      {/* Icono del mapa */}
      <FiMap className="text-gray-400 w-8 h-8 mb-2" />
      
      {/* Nombre del barrio */}
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

          {/* Botones de acción */}
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

      <ButtonHome></ButtonHome>
    </div>
  );
};

export default UserDetail;
