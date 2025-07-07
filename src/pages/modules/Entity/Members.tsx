import { useState, useMemo, useEffect, useCallback } from "react";
import { entityUsersService } from "../../../services/entity.service";
import authService from "../../../services/auth-service";
import { FiUser, FiRefreshCw } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { User, CreateUserInput, UserView } from "../../../types/user.types";

const Members = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserView | null>(null);
  console.log("Selected User:", selectedUser);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const itemsPerPage = 5;

  const [newUserData, setNewUserData] = useState<CreateUserInput>({
    name: "",
    email: "",
    ci: "",
    password: "",
  });

  const showNotification = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  const handleCreateSonUser = async () => {
    try {
      const entityId = authService.getUserIdFromToken();
      if (!entityId) throw new Error("No se pudo obtener el ID de la entidad.");

      if (!newUserData.name || !newUserData.email || !newUserData.password) {
        showNotification("Nombre, email y contraseña son obligatorios.");
        return;
      }

      await entityUsersService.createSonUser(entityId, newUserData);
      setNewUserData({ name: "", email: "", ci: "", password: "" });
      setShowForm(false);
      await fetchUsers();
    } catch (error: any) {
      console.error("Error creando usuario hijo:", error);
      showNotification(error.message || "No se pudo crear el usuario.");
    }
  };

  const showDetailsUser = (user: UserView) => {
    setSelectedUser(user);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const id = authService.getUserIdFromToken();
      if (!id) throw new Error("No se pudo obtener el ID del usuario.");

      const response = await entityUsersService.getSonUsers(id);
      if (!Array.isArray(response)) throw new Error("Respuesta inválida del servidor.");

      const mappedUsers: UserView[] = response.map((u: User) => ({
        id: u._id,
        ci: u.ci,
        name: u.name,
        email: u.email,
        last_login: u.last_login,
        role: u.role,
        createdAt: u.createdAt,
      }));

      setUsers(mappedUsers);
    } catch (error: any) {
      console.error(error);
      showNotification(error.message || "Error al obtener usuarios.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, users]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleClose = () => {
    alert("Cerrar panel (puedes conectar esta función con navegación o cerrar modal)");
  };

  return (
    <div className="relative h-full flex flex-col p-2 rounded-md shadow-sm bg-white">
      {/* Botón de cierre */}
      <button
        onClick={handleClose}
        className="absolute top-1 right-2 bg-red-500 text-white rounded-full p-1 text-lg hover:bg-red-600"
        aria-label="Cerrar"
        title="Cerrar"
      >
        <IoClose />
      </button>

      {/* Encabezado */}
      <div className="mb-2 text-center">
        <h2 className="text-[1rem] font-semibold text-blue-600 flex justify-center items-center gap-1">
          <FiUser /> Gestión de miembros
        </h2>
      </div>

      {/* Barra de búsqueda + botón */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800"
            title="Actualizar"
          >
            <FiRefreshCw className={`animate-spin ${loading ? "" : "hidden"}`} />
            {!loading && <FiRefreshCw />}
          </button>
        </div>

        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700"
        >
          {showForm ? "Cancelar" : "Agregar"}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="mb-4 bg-gray-50 border border-gray-200 p-4 rounded-md shadow-sm w-full">
          <h4 className="text-sm font-semibold mb-4 text-blue-700">Registrar nuevo miembro</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="name" className="text-xs font-medium text-gray-700 mb-1">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                placeholder="Ej: Juan Pérez"
                value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                className={`border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${!newUserData.name ? "border-red-300" : "border-gray-300"}`}
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="email" className="text-xs font-medium text-gray-700 mb-1">
                Correo electrónico <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="Ej: correo@example.com"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                className={`border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${!newUserData.email ? "border-red-300" : "border-gray-300"}`}
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="ci" className="text-xs font-medium text-gray-700 mb-1">Cédula (CI)</label>
              <input
                id="ci"
                type="text"
                placeholder="Ej: 1234567890"
                value={newUserData.ci}
                onChange={(e) => setNewUserData({ ...newUserData, ci: e.target.value })}
                className="border px-3 py-2 rounded-md text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="password" className="text-xs font-medium text-gray-700 mb-1">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                className={`border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${!newUserData.password ? "border-red-300" : "border-gray-300"}`}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCreateSonUser}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-md transition-colors"
            >
              Crear miembro
            </button>
          </div>
        </div>
      )}

      {/* Notificación de error */}
      {error && (
        <div className="mb-2 p-3 rounded-md bg-red-100 text-red-800 border border-red-200 text-xs">
          {error}
        </div>
      )}

      {/* Tabla o mensaje de carga */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-500">Cargando usuarios...</div>
        ) : paginatedUsers.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">No hay usuarios para mostrar.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-indigo-600 text-white">
              <tr>
                <th className="px-3 py-2 text-left text-[0.75rem]">Nombre</th>
                <th className="px-3 py-2 text-left text-[0.75rem]">Email</th>
                <th className="px-3 py-2 text-left text-[0.75rem]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs">{user.name}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{user.email}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => showDetailsUser(user)}
                      className="text-blue-600 hover:text-blue-800 text-xs"
                    >
                      Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-3 flex justify-center items-center gap-1 text-sm flex-wrap">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 text-gray-500 font-bold hover:text-blue-600 disabled:opacity-50"
          >
            &lt; Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border rounded ${
                currentPage === page ? "bg-blue-600 text-white" : "bg-white text-gray-800"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-gray-500 font-bold hover:text-blue-600 disabled:opacity-50"
          >
            Siguiente &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default Members;
