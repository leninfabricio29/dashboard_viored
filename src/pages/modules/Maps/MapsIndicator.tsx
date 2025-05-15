import { useState, useEffect } from "react";
import {
  FiMapPin,
  FiMap,
  FiUsers,
  FiGrid,
  FiAlertCircle,
} from "react-icons/fi";
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <ButtonIndicator />
        <ButtonHome />
      </div>
      {/* Header Section - Mejorado */}
      <div className="flex justify-between items-center mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">
            Visualización Geográfica
          </h1>
          <div className="flex items-center text-slate-500">
            <FiMapPin className="mr-2 text-sky-500" />
            <span>Explora datos geoespaciales del sistema</span>
          </div>
        </div>
      </div>

      {/* Cards Grid - Versión Premium */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card Usuarios */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 group flex flex-col h-full">
          <div className="bg-gradient-to-r from-sky-600 to-sky-700 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm mr-4 group-hover:rotate-6 transition-transform">
                <FiUsers className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Mapa de Usuarios
              </h2>
            </div>
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <div className="flex-grow">
              <p className="text-slate-600 mb-6 leading-relaxed">
                Visualiza en tiempo real la ubicación de todos los usuarios
                activos en el sistema.
              </p>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Permite monitorear la distribución geográfica de los usuarios,
                ver sus últimas ubicaciones registradas en la ciudad.
              </p>
            </div>
            <div className="flex justify-between items-center">
              <button
                onClick={() => setIsUsersMapOpen(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl transition-all flex items-center shadow-sm hover:shadow-md"
              >
                <FiMap className="mr-2" />
                <span>Explorar Mapa</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card Barrios */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 group flex flex-col h-full">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm mr-4 group-hover:-rotate-6 transition-transform">
                <FiGrid className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Mapa de Barrios
              </h2>
            </div>
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <div className="flex-grow">
              <p className="text-slate-600 mb-6 leading-relaxed">
                Explora la delimitación geográfica de todos los barrios
                registrados en el sistema.
              </p>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Visualiza las información como el nombre y la ubicación sobre
                cada barrio.
              </p>
            </div>
            <div className="flex justify-between items-center">
              <button
                onClick={() => setIsNeighborhoodsMapOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition-all flex items-center shadow-sm hover:shadow-md"
              >
                <FiMap className="mr-2" />
                <span>Explorar Mapa</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modales Mejorados */}
      <Modal
        isOpen={isUsersMapOpen}
        onClose={() => setIsUsersMapOpen(false)}
        title="Mapa de Usuarios"
      >
        <div className="h-[70vh] w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner">
          {loading.users ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-sky-500"></div>
              <p className="text-slate-500">Cargando datos de usuarios...</p>
            </div>
          ) : error.users ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-red-500">
              <FiAlertCircle className="w-10 h-10" />
              <p>{error.users}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <UsersMap users={users} />
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isNeighborhoodsMapOpen}
        onClose={() => setIsNeighborhoodsMapOpen(false)}
        title="Mapa de Barrios"
      >
        <div className="h-[70vh] w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner">
          {loading.neighborhoods ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-emerald-500"></div>
              <p className="text-slate-500">Cargando límites geográficos...</p>
            </div>
          ) : error.neighborhoods ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-red-500">
              <FiAlertCircle className="w-10 h-10" />
              <p>{error.neighborhoods}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
              >
                Reintentar
              </button>
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
