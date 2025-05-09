import { useState, useEffect } from "react";
import { FiMapPin, FiMap, FiUsers, FiGrid } from "react-icons/fi";
import Modal from "../../../components/UI/Modal";
import UsersMap from "./UserMaps";
import userService from "../../../services/user-service";
import neighborhoodService from "../../../services/neighborhood-service";
import { User } from "../../../types/user.types";
import { Neighborhood } from "../../../types/neighborhood.types";
import NeighborhoodsMap from "./NeighborhoodMaps";
import ButtonHome from "../../../components/UI/ButtonHome";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";

const MapIndicator = () => {
  const [isUsersMapOpen, setIsUsersMapOpen] = useState(false);
  const [isNeighborhoodsMapOpen, setIsNeighborhoodsMapOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState({
    users: false,
    neighborhoods: false,
  });
  const [error, setError] = useState({
    users: null as string | null,
    neighborhoods: null as string | null,
  });

  // Cargar usuarios cuando se abre el modal de usuarios
  useEffect(() => {
    if (isUsersMapOpen && users.length === 0) {
      const fetchUsers = async () => {
        try {
          setLoading((prev) => ({ ...prev, users: true }));
          const data = await userService.getUsers();
          setUsers(data);
          setError((prev) => ({ ...prev, users: null }));
        } catch (err) {
          console.error("Error al cargar usuarios:", err);
          setError((prev) => ({
            ...prev,
            users: "No se pudieron cargar los usuarios",
          }));
        } finally {
          setLoading((prev) => ({ ...prev, users: false }));
        }
      };

      fetchUsers();
    }
  }, [isUsersMapOpen, users.length]);

  // Cargar barrios cuando se abre el modal de barrios
  useEffect(() => {
    if (isNeighborhoodsMapOpen && neighborhoods.length === 0) {
      const fetchNeighborhoods = async () => {
        try {
          setLoading((prev) => ({ ...prev, neighborhoods: true }));
          const data = await neighborhoodService.getAllNeighborhoods();
          setNeighborhoods(data);
          setError((prev) => ({ ...prev, neighborhoods: null }));
        } catch (err) {
          console.error("Error al cargar barrios:", err);
          setError((prev) => ({
            ...prev,
            neighborhoods: "No se pudieron cargar los barrios",
          }));
        } finally {
          setLoading((prev) => ({ ...prev, neighborhoods: false }));
        }
      };

      fetchNeighborhoods();
    }
  }, [isNeighborhoodsMapOpen, neighborhoods.length]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <ButtonIndicator />
        <ButtonHome />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Card para Mapa de Usuarios */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <FiUsers className="mr-2" /> Mapa de Usuarios
            </h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Visualiza la ubicación de todos los usuarios registrados en el
              sistema. Cada pin representa la última ubicación conocida de un
              usuario.
            </p>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm text-gray-500">
                <FiMapPin className="mr-1 text-blue-500" />
                Ubicaciones en tiempo real
              </div>
              <button
                onClick={() => setIsUsersMapOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors flex items-center"
              >
                <FiMap className="mr-2" /> Ver mapa
              </button>
            </div>
          </div>
        </div>

        {/* Card para Mapa de Barrios */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <FiGrid className="mr-2" /> Mapa de Barrios
            </h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Explora los límites de todos los barrios o zonas configuradas en
              el sistema. Cada polígono representa un barrio con sus límites
              geográficos.
            </p>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm text-gray-500">
                <FiGrid className="mr-1 text-green-500" />
                Límites territoriales
              </div>
              <button
                onClick={() => setIsNeighborhoodsMapOpen(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors flex items-center"
              >
                <FiMap className="mr-2" /> Ver mapa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Mapa de Usuarios */}
      <Modal
        isOpen={isUsersMapOpen}
        onClose={() => setIsUsersMapOpen(false)}
        title="Mapa de Ubicación de Usuarios"
      >
        <div className="h-[70vh] w-full ">
          {loading.users ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error.users ? (
            <div className="h-full flex items-center justify-center text-red-500">
              {error.users}
            </div>
          ) : (
            <UsersMap users={users} />
          )}
        </div>
      </Modal>

      {/* Modal para Mapa de Barrios */}
      <Modal
        isOpen={isNeighborhoodsMapOpen}
        onClose={() => setIsNeighborhoodsMapOpen(false)}
        title="Mapa de Barrios"
      >
        <div className="h-[70vh] w-full">
          {loading.neighborhoods ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : error.neighborhoods ? (
            <div className="h-full flex items-center justify-center text-red-500">
              {error.neighborhoods}
            </div>
          ) : (
            <NeighborhoodsMap neighborhoods={neighborhoods} />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MapIndicator;
