import { useState, useEffect, useMemo } from "react";
import userService from "../../../services/user-service";
import neighborhoodService, { Neighborhood } from "../../../services/neighborhood-service";
import trackingService from "../../../services/tracking-service";

import { User } from "../../../types/user.types";
import Pagination from "../../../components/layout/Pagination";
import {
  FiSearch,
  FiEye,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiShield,
  FiX,
  FiChevronUp,
  FiChevronDown,
  FiCreditCard,
  FiClock,
  FiTruck,
  FiCheck,
} from "react-icons/fi";
import { FaUser } from "react-icons/fa";

/* ---------------------------------------------------------
   Tipos de orden
--------------------------------------------------------- */
type SortKey = "name" | "email" | "last_login" | "createdAt" | "amount_suscribed";
type SortDirection = "asc" | "desc";

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

type DetailPanel = "neighborhood" | "vehicle" | null;

interface VehicleForm {
  plate: string;
  alias: string;
  brand: string;
  model: string;
  year: string;
  color: string;
}

const initialVehicleForm: VehicleForm = {
  plate: "",
  alias: "",
  brand: "",
  model: "",
  year: "",
  color: "",
};

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */
const getInitials = (name: string) => {
  const names = name.trim().split(" ");
  return names.slice(0, 2).map((n) => n.charAt(0).toUpperCase()).join("");
};

const formatDate = (value?: string | null) => {
  if (!value) return "Nunca";
  return new Date(value).toLocaleString("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const hasLocation = (user: User) => {
  const coords = user.lastLocation?.coordinates;
  return coords && (coords[0] !== 0 || coords[1] !== 0);
};

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [subscriptionType, setSubscriptionType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "name", direction: "asc" });

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [detailPanel, setDetailPanel] = useState<DetailPanel>(null);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState("");
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(initialVehicleForm);
  const [savingNeighborhood, setSavingNeighborhood] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await userService.getUsers();
        const filteredUsers = data.filter((user: User) => user.role?.name === "user");
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

  useEffect(() => {
    if (!selectedUser) return;

    setDetailPanel(null);
    setSelectedNeighborhoodId(selectedUser.neighborhood || "");
    setVehicleForm(initialVehicleForm);
    setActionMessage("");

    const fetchNeighborhoods = async () => {
      try {
        const data = await neighborhoodService.getAllNeighborhoods();
        setNeighborhoods(data.filter((neighborhood) => neighborhood.isActive));
      } catch (err) {
        console.error("Error al cargar barrios:", err);
        setActionMessage("No se pudieron cargar los barrios.");
      }
    };
    fetchNeighborhoods();
  }, [selectedUser?._id]);

  const handleAssignNeighborhood = async () => {
    if (!selectedUser || !selectedNeighborhoodId) return;
    try {
      setSavingNeighborhood(true);
      setActionMessage("");
      await neighborhoodService.addUserToNeighborhood(selectedNeighborhoodId, selectedUser._id);
      const neighborhood = neighborhoods.find((item) => item._id === selectedNeighborhoodId);
      console.log(neighborhood)
      const updatedUser = { ...selectedUser, neighborhood: selectedNeighborhoodId };
      setSelectedUser(updatedUser);
      setUsers((current) => current.map((user) => user._id === updatedUser._id ? updatedUser : user));
      setActionMessage("Barrio asignado correctamente.");
    } catch (err) {
      console.error("Error al asignar barrio:", err);
      setActionMessage("No se pudo asignar el barrio.");
    } finally {
      setSavingNeighborhood(false);
    }
  };

  const handleCreateVehicle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) return;
    try {
      setSavingVehicle(true);
      setActionMessage("");
      await trackingService.createVehicle({
        userId: selectedUser._id,
        plate: vehicleForm.plate,
        alias: vehicleForm.alias || undefined,
        brand: vehicleForm.brand || undefined,
        model: vehicleForm.model || undefined,
        year: vehicleForm.year ? Number(vehicleForm.year) : undefined,
        color: vehicleForm.color || undefined,
      });
      setVehicleForm(initialVehicleForm);
      setActionMessage("Vehículo creado correctamente.");
    } catch (err) {
      console.error("Error al crear vehículo:", err);
      setActionMessage("No se pudo crear el vehículo. Verifica los datos e inténtalo otra vez.");
    } finally {
      setSavingVehicle(false);
    }
  };

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedUser(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /* ------------------- Filtrado ------------------- */
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phone?.includes(searchTerm) ||
        user.ci?.includes(searchTerm);

      const matchesSubscription =
        subscriptionType === "all" ||
        user.type_suscription?.toLowerCase() === subscriptionType;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);

      return matchesSearch && matchesSubscription && matchesStatus;
    });
  }, [searchTerm, subscriptionType, statusFilter, users]);

  /* ------------------- Orden ------------------- */
  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers].sort((a, b) => {
      const { key, direction } = sortConfig;
      const dir = direction === "asc" ? 1 : -1;

      switch (key) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "email":
          return a.email.localeCompare(b.email) * dir;
        case "amount_suscribed":
          return ((a.amount_suscribed ?? 0) - (b.amount_suscribed ?? 0)) * dir;
        case "last_login": {
          const dateA = a.last_login ? new Date(a.last_login).getTime() : 0;
          const dateB = b.last_login ? new Date(b.last_login).getTime() : 0;
          return (dateA - dateB) * dir;
        }
        case "createdAt": {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return (dateA - dateB) * dir;
        }
        default:
          return 0;
      }
    });
    return sorted;
  }, [filteredUsers, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  // Reset de página cuando cambian filtros/búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, subscriptionType, statusFilter]);

  /* ------------------- Paginación ------------------- */
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) {
      return <FiChevronDown className="w-3.5 h-3.5 text-slate-300" />;
    }
    return sortConfig.direction === "asc" ? (
      <FiChevronUp className="w-3.5 h-3.5 text-slate-600" />
    ) : (
      <FiChevronDown className="w-3.5 h-3.5 text-slate-600" />
    );
  };

  const SortableHeader = ({ label, column }: { label: string; column: SortKey }) => (
    <th
      onClick={() => handleSort(column)}
      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 transition-colors"
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIcon column={column} />
      </span>
    </th>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      

      <div className="flex justify-between items-center mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">Usuarios del Sistema</h1>
          <div className="flex items-center text-slate-500">
            <FaUser className="mr-2" />
            <span className="text-sm">
              Aquí puedes ver todos los usuarios registrados en el sistema.
            </span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:space-x-6 space-y-4 md:space-y-0">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, correo, teléfono o CI..."
            className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent hover:border-slate-400 transition-all duration-200 text-slate-700 placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <FiX className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" />
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tipo de suscripción
          </label>
          <select
            value={subscriptionType}
            onChange={(e) => setSubscriptionType(e.target.value)}
            className="block w-full max-w-xs px-4 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-slate-700"
          >
            <option value="all">Todos</option>
            <option value="viored">Viored</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full max-w-xs px-4 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-slate-700"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>

        <div className="md:ml-auto text-sm text-slate-500">
          {sortedUsers.length} usuario{sortedUsers.length !== 1 ? "s" : ""} encontrado
          {sortedUsers.length !== 1 ? "s" : ""}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : (
        <>
          {/* Tabla */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <SortableHeader label="Usuario" column="name" />
                    <SortableHeader label="Correo" column="email" />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Suscripción
                    </th>
                    <SortableHeader label="Últ. acceso" column="last_login" />
                    <SortableHeader label="Registrado" column="createdAt" />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user) => (
                      <tr
                        key={user._id}
                        onClick={() => setSelectedUser(user)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-semibold">
                                {getInitials(user.name)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate max-w-[180px]">
                                {user.name}
                              </p>
                              {user.ci && (
                                <p className="text-xs text-slate-400">CI: {user.ci}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 truncate max-w-[200px]">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {user.phone || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 capitalize">
                            {user.type_suscription || "Sin definir"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                          {formatDate(user.last_login)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                              user.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {user.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-slate-400"
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
                        <h3 className="mt-2 text-sm font-medium text-slate-800">
                          {searchTerm ? "No se encontraron usuarios" : "No hay usuarios disponibles"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {searchTerm
                            ? "Intenta con otro término de búsqueda"
                            : "Crea un nuevo usuario para comenzar"}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </>
      )}

      {/* Modal de detalles */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">Detalles del usuario</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FiX className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Encabezado con avatar */}
              <div className="flex items-center gap-4 mb-6">
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-orange-600 flex items-center justify-center text-white font-semibold text-lg">
                    {getInitials(selectedUser.name)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{selectedUser.name}</h3>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${
                      selectedUser.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {selectedUser.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              {/* Info detallada */}
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow icon={FiMail} label="Correo" value={selectedUser.email} />
                <DetailRow icon={FiPhone} label="Teléfono" value={selectedUser.phone || "No registrado"} />
                <DetailRow icon={FiShield} label="Cédula (CI)" value={selectedUser.ci || "No registrada"} />
                <DetailRow icon={FiShield} label="Rol" value={selectedUser.role?.name || "—"} capitalize />
                <DetailRow
                  icon={FiCreditCard}
                  label="Tipo de suscripción"
                  value={selectedUser.type_suscription || "Sin definir"}
                  capitalize
                />
                <DetailRow
                  icon={FiCreditCard}
                  label="Suscripciones usadas"
                  value={`${selectedUser.amount_suscribed ?? 0} / ${selectedUser.max_limit_suscribed ?? 0}`}
                />
                <DetailRow
                  icon={FiMapPin}
                  label="Barrio"
                  value={neighborhoods.find((neighborhood) => neighborhood._id === selectedUser.neighborhood)?.name || selectedUser.neighborhood || "Sin barrio asignado"}
                />
                <DetailRow
                  icon={FiMapPin}
                  label="Última ubicación"
                  value={
                    hasLocation(selectedUser)
                      ? `${selectedUser.lastLocation!.coordinates[1]}, ${selectedUser.lastLocation!.coordinates[0]}`
                      : "Sin ubicación registrada"
                  }
                />
                <DetailRow icon={FiClock} label="Último acceso" value={formatDate(selectedUser.last_login)} />
                <DetailRow icon={FiCalendar} label="Registrado el" value={formatDate(selectedUser.createdAt)} />
              </div>

              {actionMessage && <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{actionMessage}</p>}

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <section className="rounded-xl border border-slate-200">
                  <button type="button" onClick={() => setDetailPanel((panel) => panel === "neighborhood" ? null : "neighborhood")} className="flex w-full items-center justify-between px-4 py-3 text-left" aria-expanded={detailPanel === "neighborhood"}>
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700"><FiMapPin className="text-blue-600" /> Asignar barrio</span>
                    {detailPanel === "neighborhood" ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                  {detailPanel === "neighborhood" && (
                    <div className="border-t border-slate-100 p-4">
                      <label className="mb-2 block text-xs font-medium text-slate-500">Barrio</label>
                      <select value={selectedNeighborhoodId} onChange={(event) => setSelectedNeighborhoodId(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                        <option value="">Selecciona un barrio</option>
                        {neighborhoods.map((neighborhood) => <option key={neighborhood._id} value={neighborhood._id}>{neighborhood.name}</option>)}
                      </select>
                      <button type="button" disabled={!selectedNeighborhoodId || savingNeighborhood} onClick={handleAssignNeighborhood} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><FiCheck /> {savingNeighborhood ? "Asignando..." : "Asignar barrio"}</button>
                    </div>
                  )}
                </section>

                <section className="rounded-xl border border-slate-200">
                  <button type="button" onClick={() => setDetailPanel((panel) => panel === "vehicle" ? null : "vehicle")} className="flex w-full items-center justify-between px-4 py-3 text-left" aria-expanded={detailPanel === "vehicle"}>
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700"><FiTruck className="text-blue-600" /> Crear vehículo</span>
                    {detailPanel === "vehicle" ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                  {detailPanel === "vehicle" && (
                    <form onSubmit={handleCreateVehicle} className="grid gap-3 border-t border-slate-100 p-4">
                      <input required value={vehicleForm.plate} onChange={(event) => setVehicleForm((form) => ({ ...form, plate: event.target.value }))} placeholder="Placa *" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                      <input value={vehicleForm.alias} onChange={(event) => setVehicleForm((form) => ({ ...form, alias: event.target.value }))} placeholder="Alias" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                      <div className="grid grid-cols-2 gap-3">
                        <input value={vehicleForm.brand} onChange={(event) => setVehicleForm((form) => ({ ...form, brand: event.target.value }))} placeholder="Marca" className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                        <input value={vehicleForm.model} onChange={(event) => setVehicleForm((form) => ({ ...form, model: event.target.value }))} placeholder="Modelo" className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="number" min="1900" max="2100" value={vehicleForm.year} onChange={(event) => setVehicleForm((form) => ({ ...form, year: event.target.value }))} placeholder="Año" className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                        <input value={vehicleForm.color} onChange={(event) => setVehicleForm((form) => ({ ...form, color: event.target.value }))} placeholder="Color" className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                      </div>
                      <button disabled={savingVehicle} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><FiTruck /> {savingVehicle ? "Creando..." : "Crear vehículo"}</button>
                    </form>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------------------
   Fila de detalle reutilizable dentro del modal
--------------------------------------------------------- */
interface DetailRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  capitalize?: boolean;
}

const DetailRow = ({ icon: Icon, label, value, capitalize }: DetailRowProps) => (
  <div className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
    <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-sm text-slate-700 break-words ${capitalize ? "capitalize" : ""}`}>{value}</p>
    </div>
  </div>
);

export default UsersList;
