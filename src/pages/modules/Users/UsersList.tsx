import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import userService from "../../../services/user-service";

import { User } from "../../../types/user.types";
import ButtonHome from "../../../components/UI/ButtonHome";
import ButtonIndicator from "../../../components/UI/ButtonIndicator";
import { FiEye, FiPhone, FiSearch } from "react-icons/fi";
import Pagination from "../../../components/layout/Pagination";
import { FaUser } from "react-icons/fa";

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [subscriptionType, setSubscriptionType] = useState("all");

  const usersPerPage = 6;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await userService.getUsers();
        console.log("Usuarios obtenidos:", data);
        const filteredUsers = data.filter((user: User) => user.role === "user");
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

    console.log(`Filtrando usuario: ${user.name}, Coincide con búsqueda: ${matchesSearch}, Tipo de suscripción: ${user.type_suscription}, Coincide con filtro: ${matchesSubscription}`);

    return matchesSearch && matchesSubscription;
  });
}, [searchTerm, subscriptionType, users]);

  // Paginación
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <ButtonIndicator />
        <ButtonHome />
      </div>

      <div className="flex justify-between items-center mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">
            Usuarios del Sistema
          </h1>
          <div className="flex items-center text-slate-500">
            <FaUser className="mr-2" />
            <span className="text-sm">
              Aquí puedes ver todos los usuarios registrados en el sistema.
            </span>
          </div>
        </div>
      </div>

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
          <svg
            className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
        Filtrar por tipo de suscripción
          </label>
          <select
        value={subscriptionType}
        onChange={(e) => setSubscriptionType(e.target.value)}
        className="block w-full max-w-xs px-4 py-2 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-slate-700"
          >
        <option value="all">Todos</option>
        <option value="viored">Viored</option>
        <option value="other">Otro</option>
          </select>
        </div>
      </div>
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentUsers.length > 0 ? (
            currentUsers.map((user) => (
              <div
                key={user._id}
                className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-gray-100"
              >
                {/* Header con indicador de estado */}
                <div
                  className={`h-1.5 ${
                    user.isActive
                      ? "bg-gradient-to-r from-emerald-400 to-sky-500"
                      : "bg-gradient-to-r from-amber-400 to-rose-400"
                  }`}
                ></div>

                <div className="p-5">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={
                          user.avatar ||
                          "https://cdn-icons-png.flaticon.com/512/3607/3607444.png"
                        }
                        alt={user.name}
                        className="w-16 h-16 rounded-full border-4 border-white shadow-sm object-cover"
                      />
                      {user.isActive && (
                        <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-1.5 border-2 border-white shadow-xs">
                          <div className="w-3 h-3"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        {user.name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {user.email}
                      </p>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        <FiPhone className="inline mr-1 text-gray-400" />
                        {user.phone}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-between items-center">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        user.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {user.isActive ? "Activo" : "Inactivo"}
                    </span>

                    <div className="flex space-x-2">
                      <Link
                        to={`/users/${user._id}`}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-medium rounded-lg shadow-xs hover:shadow-sm hover:from-sky-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-300 transition-all duration-200"
                      >
                        <FiEye className="mr-2 w-4 h-4" />
                        Ver detalles
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                {searchTerm
                  ? "No se encontraron usuarios"
                  : "No hay usuarios disponibles"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? "Intenta con otro término de búsqueda"
                  : "Crea un nuevo usuario para comenzar"}
              </p>
            </div>
          )}
        </div>
      )}
      {/* Paginación */}
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
};

export default UsersList;
