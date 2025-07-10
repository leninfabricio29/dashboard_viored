import { useState, useEffect, useMemo } from "react";
import { entityUsersService } from "../../../services/entity.service";
import { User } from "../../../types/user.types";
import ButtonHome from "../../../components/UI/ButtonHome";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import { FiCheck, FiEye, FiMail, FiPlus, FiSearch, FiUser, FiX } from "react-icons/fi";
import Pagination from "../../../components/layout/Pagination";
import { FaUser } from "react-icons/fa";
import { CreateEntityModal } from "../../../components/Forms/CreateEntityModal";
import { DetailEntityModel } from "../../../components/Forms/DetailEntityModal";


const EntityList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [subscriptionType] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  console.log("Selected Users:", setSelectedUsers);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const usersPerPage = 6;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await entityUsersService.getEntytiesAll();
        console.log("Usuarios obtenidos:", data);
        const filteredUsers = data.filter(
          (user: User) => user.role === "entity"
        );
        setUsers(filteredUsers);
      } catch (err) {
        console.error("Error al cargar usuarios:", err);
        setError("No se pudieron cargar los datos. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.role !== "admin" &&
        (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone.includes(searchTerm));

      const matchesSubscription =
        subscriptionType === "all" ||
        user.type_suscription?.toLowerCase() === subscriptionType;

      return matchesSearch && matchesSubscription;
    });
  }, [searchTerm, subscriptionType, users]);

  // Paginación
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

 


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Componente para mostrar cuando no hay usuarios
  const EmptyState = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
       <FiUser></FiUser>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {searchTerm
          ? "No se encontraron entidad"
          : "No hay entidades disponibles"}
      </h3>
      <p className="text-gray-500 mb-6">
        {searchTerm
          ? "Intenta con otro término de búsqueda"
          : ""}
      </p>
     
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Modal para crear entidad */}
      
        <CreateEntityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false);
          setCurrentPage(1); // Resetear a la primera página al crear una nueva entidad
          setUsers([]); // Limpiar usuarios para recargar
          entityUsersService.getEntytiesAll().then((data) => {
            const filteredUsers = data.filter(
              (user: User) => user.role === "entity"
            );
            setUsers(filteredUsers);
          });
        }}
      />
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <ButtonIndicator />
        <ButtonHome />
      </div>

      {/* Título */}
      <div className="flex justify-between items-center mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">
            Entidades registradas en Sistema
          </h1>
          <div className="flex items-center text-slate-500">
            <FaUser className="mr-2" />
            <span className="text-sm">
              Aquí puedes ver todas las entidades registradas en el sistema.
            </span>
          </div>
        </div>
      </div>

      {/* Controles de búsqueda y filtrado */}

<div className="mb-8 flex flex-col md:flex-row md:items-end md:space-x-6 space-y-4 md:space-y-0">
  <div className="relative w-full max-w-md">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <FiSearch className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
    </div>
    <input
      type="text"
      placeholder="Buscar usuario..."
      className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent hover:border-slate-400 transition-all duration-200 text-slate-700 placeholder-slate-400 group"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    {searchTerm && (
      <button
        onClick={() => setSearchTerm("")}
        className="absolute inset-y-0 right-0 pr-3 flex items-center"
      >
        ✕
      </button>
    )}
  </div>

  <button
    onClick={() => setShowCreateModal(true)}
    className="flex cursor-pointer items-center justify-center h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow transition-all duration-200"
    title="Crear entidad"

  >
    <FiPlus className="w-6 h-6" />
  </button>
</div>


      {/* Loading y Error States */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : currentUsers.length === 0 ? (
        <EmptyState />
      ) : (
        /* Tabla de usuarios */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header de la tabla */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Usuarios ({currentUsers.length})
                </h2>
                {selectedUsers.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {selectedUsers.length} seleccionado
                      {selectedUsers.length > 1 ? "s" : ""}
                    </span>
                    <div className="flex space-x-1">
                      <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
                        Activar
                      </button>
                      <button className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {currentUsers.filter((u) => u.isActive).length} activos
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suscripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.map((user) => (
                  <tr
                    key={user._id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedUsers.includes(user._id) ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              user.isActive ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          ></div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user._id.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <FiMail className="w-4 h-4 mr-2 text-gray-400" />
                          {user.email}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.isActive ? (
                          <FiCheck className="w-3 h-3 mr-1" />
                        ) : (
                          <FiX className="w-3 h-3 mr-1" />
                        )}
                        {user.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.suscription === "free"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {user.suscription || "Sin definir"}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt
                        ? formatDate(user.createdAt)
                        : "No disponible"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedEntityId(user._id);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                        {selectedEntityId && (
                          <DetailEntityModel
                            isOpen={showDetailModal}
                            onClose={() => setShowDetailModal(false)}
                            entityId={selectedEntityId}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer de la tabla */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Mostrando {currentUsers.length} de {filteredUsers.length}{" "}
                usuario{filteredUsers.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
};

export default EntityList;
