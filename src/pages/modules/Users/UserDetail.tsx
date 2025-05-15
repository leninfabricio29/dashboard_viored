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
} from "react-icons/fi";
import userService from "../../../services/user-service";
import { User } from "../../../types/user.types";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import Modal from "../../../components/UI/Modal";
import Map from "../../../components/UI/Map";
import ButtonHome from "../../../components/UI/ButtonHome";
import neighborhoodService, { Neighborhood } from "../../../services/neighborhood-service";
import DeleteConfirmationModal from "../../../components/layout/DeleteConfirmationModal";

const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user?._id) return;
    
    try {
      if (!user) return;
      await userService.deleteUser(user._id);
      navigate("/users");
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const userData = await userService.getUserById(id);
        setUser(userData);

        // Si el usuario tiene un ID de barrio, obtener los detalles del barrio
        if (userData.neighborhood) {
          try {
            const neighborhoodData = await neighborhoodService.getNeighborhoodById(
              typeof userData.neighborhood === 'string' 
                ? userData.neighborhood 
                : userData.neighborhood._id
            );
            
            setNeighborhood(neighborhoodData);
          } catch (err) {
            console.error("Error al cargar el barrio:", err);
          }
        }
      } catch (err) {
        console.error(`Error al cargar usuario con ID ${id}:`, err);
        setError("Error al cargar los datos del usuario");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <ButtonIndicator />
        <ButtonHome />
      </div>

      {/* Card de Usuario */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        {/* Encabezado con gradiente sutil */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="relative">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 mr-4">
                <FiUser className="h-10 w-10 text-blue-600" />
              </div>
              {user.isActive && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-2 border-white">
                  <div className="w-3 h-3"></div>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
              <div className="flex items-center mt-2 space-x-3">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    user.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.isActive ? "Activo" : "Inactivo"}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Columna 1: Información de contacto */}
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="bg-blue-50 p-3 rounded-lg mr-4">
                  <FiUser className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="font-semibold text-lg text-gray-800">
                  Información personal
                </h2>
              </div>

              <div className="space-y-4 pl-14">
                <div className="flex items-start">
                  <FiMail className="text-gray-400 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      Email
                    </p>
                    <p className="font-medium text-gray-800 break-all">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FiPhone className="text-gray-400 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </p>
                    <p className="font-medium text-gray-800">{user.phone}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FiCalendar className="text-blue-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      Miembro desde
                    </p>
                    <div className="flex items-baseline">
                      <p className="text-sm font-medium text-blue-600">
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
                            return `Hace ${years} ${
                              years === 1 ? "año" : "años"
                            }`;
                          }
                        })()}
                      </p>
                      <span className="text-xs text-gray-500 ml-2">
                        ({formatDate(user.createdAt)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna 2: Información de ubicación */}
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="bg-blue-50 p-3 rounded-lg mr-4">
                  <FiMapPin className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="font-semibold text-lg text-gray-800">
                  Ubicación
                </h2>
              </div>

              <div className="space-y-4 pl-14">
                <div className="flex items-start">
                  <FiMapPin className="text-gray-400 mr-3 mt-1 flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      Barrio
                    </p>
                    {user.neighborhood ? (
                      <p className="font-medium text-gray-800">
                        {neighborhood?.name || 'Cargando...'}
                      </p>
                    ) : (
                      <p className="font-medium text-amber-600">
                        No asignado
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <FiMap className="text-gray-400 mr-3 mt-1 flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      Última ubicación
                    </p>
                    {user.lastLocation && user.lastLocation.coordinates ? (
                      <div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-700 font-medium">
                            {user.lastLocation.coordinates[0].toFixed(4)},{" "}
                            {user.lastLocation.coordinates[1].toFixed(4)}
                          </span>
                          {user.lastLocation.coordinates[0] !== 0 && (
                            <button
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                              onClick={() => setIsMapModalOpen(true)}
                            >
                              Ver mapa
                            </button>
                          )}
                        </div>
                        {user.lastLocation.lastUpdated && (
                          <p className="text-xs text-gray-500 mt-2">
                            <span className="font-medium">Actualizado:</span>{" "}
                            {formatDate(user.lastLocation.lastUpdated)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="font-medium text-gray-500">No disponible</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pie de página con acciones */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleDeleteClick}
              className="flex items-center px-4 py-2 bg-white border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm cursor-pointer"
            >
              <FiTrash2 className="mr-2" /> Eliminar usuario
            </button>
          </div>
        </div>
         {/* Modal de confirmación */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        userName={user.name}
        entityType="usuario"
      />
      
      {/* Mostrar error si existe */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
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
              user.lastLocation.coordinates[1], // Latitud
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default UserDetail;
