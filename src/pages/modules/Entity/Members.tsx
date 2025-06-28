import { useState, useMemo, useEffect, useCallback } from "react";
import { entityUsersService } from "../../../services/entity.service";
import authService from "../../../services/auth-service";
import { FiUser, FiRefreshCw } from "react-icons/fi";
import { IoClose } from "react-icons/io5";

interface User {
  id: string;
  ci: string;
  name: string;
  email: string;
  role: string;
  last_login?: string;
  createdAt?: string;
}

const Members = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const showNotification = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  const showDetailsUser = (user: User) => {
    setSelectedUser(user);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const id = authService.getUserIdFromToken();
      if (!id) throw new Error("No se pudo obtener el ID del usuario.");

      const response = await entityUsersService.getSonUsers(id);
      if (!Array.isArray(response))
        throw new Error("Respuesta inválida del servidor.");

      setUsers(
        response.map((u) => ({
          id: u._id,
          ci: u.ci,
          name: u.name,
          email: u.email,
          last_login: u.last_login,
          role: u.role,
          createdAt: u.createdAt,
        }))
      );
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
    alert(
      "Cerrar panel (puedes conectar esta función con navegación o cerrar modal)"
    );
  };

  return (
    <div className="relative h-full flex flex-col p-2  rounded-md shadow-sm bg-white">
      {/* Botón de cierre */}
      <button
        onClick={handleClose}
        className="absolute top-1 cursor-pointer right-2 bg-red-500 text-gray-50 rounded-full p-1 text-lg transition-colors duration-150 hover:bg-red-600 hover:text-white"
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

      {/* Barra de búsqueda y botones */}
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
            <FiRefreshCw
              className={`animate-spin ${loading ? "" : "hidden"}`}
            />
            {!loading && <FiRefreshCw />}
          </button>
        </div>
        <button
          onClick={() =>
            alert("Funcionalidad para agregar miembro próximamente")
          }
          className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700"
        >
          Agregar
        </button>
      </div>

      {/* Notificación de error */}
      {error && (
        <div className="mb-2 p-3 rounded-md bg-red-100 text-red-800 border border-red-200 text-xs">
          {error}
        </div>
      )}

     {selectedUser && (
  <div className="mb-4   bg-gray-100 rounded-lg p-4 shadow-sm">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-[0.90rem] font-semibold text-gray-600 flex items-center gap-1">
      Información del usuario
      </h3>
      <button
        onClick={() => setSelectedUser(null)}
        className="text-gray-500 hover:text-red-600 font-bold text-lg cursor-pointer"
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
      <div>
        <p className="font-medium text-[0.75rem]">Nombre:</p>
        <p>{selectedUser.name}</p>
      </div>

      <div>
        <p className="font-medium text-[0.75rem]">Email:</p>
        <p>{selectedUser.email}</p>
      </div>

      <div>
        <p className="font-medium text-[0.75rem]">CI:</p>
        <p>{selectedUser.ci || 'No disponible'}</p>
      </div>

      <div>
        <p className="font-medium text-[0.75rem]">Creado:</p>
        <p>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</p>
      </div>

      <div>
        <p className="font-medium text-[0.75rem]">Rol:</p>
        <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-600 text-gray-50 capitalize">
          {selectedUser.role === "son" ? "Hijo" : selectedUser.role}
        </span>
      </div>

      <div>
        <p className="font-medium text-[0.75rem]">Último acceso:</p>
        {selectedUser.last_login ? (
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-200 text-green-800">
            Activo
          </span>
        ) : (
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-red-200 text-red-800">
            Nunca
          </span>
        )}
      </div>
    </div>
  </div>
)}


      {/* Tabla de usuarios */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md ">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <span>Cargando usuarios...</span>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <span>No hay usuarios para mostrar.</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="bg-indigo-600 text-gray-200">
                <th className="px-3 py-2 text-left text-[0.75rem] ">Nombre</th>
                <th className="px-3 py-2 text-left text-[0.75rem]">Email</th>
                <th className="px-3 py-2 text-left text-[0.75rem]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs">
                    {user.name || "Sin nombre"}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {user.email || "Sin email"}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="text-blue-600 hover:text-blue-800 text-xs"
                      onClick={() => showDetailsUser(user)}
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
      {/* Paginación avanzada */}
      {totalPages > 1 && (
        <div className="mt-3 flex justify-center items-center gap-1 text-sm flex-wrap">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-2 cursor-pointer  py-1 text-gray-500 font-bold  hover:text-blue-600 disabled:opacity-50"
          >
            &lt; Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return true;
              }
              if (page === 2 && currentPage > 4) return true;
              if (page === totalPages - 1 && currentPage < totalPages - 3)
                return true;
              return false;
            })
            .reduce<number[]>((acc, page, index, arr) => {
              if (index > 0 && page - arr[index - 1] > 1) {
                acc.push(-1); // usamos -1 como marcador para "..."
              }
              acc.push(page);
              return acc;
            }, [])
            .map((page, idx) =>
              page === -1 ? (
                <span
                  key={`dots-${idx}`}
                  className="px-2 py-1 text-gray-500 select-none"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border-gray-200 border shadow rounded ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-800"
                  }`}
                >
                  {page}
                </button>
              )
            )}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-2 cursor-pointer  py-1 text-gray-500 font-bold  hover:text-blue-600 disabled:opacity-50"
          >
            Siguiente &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default Members;
