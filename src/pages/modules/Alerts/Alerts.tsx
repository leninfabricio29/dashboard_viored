import  { useRef,useState, useEffect, useMemo } from "react";
import {
  FiEye,
  FiX,
  FiMapPin,
  FiUser,
  FiPhone,
  FiMail,
  FiClock,
  FiAlertCircle,
  FiFileText,
  FiSearch,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiUsers,
  FiList,
} from "react-icons/fi";
import api from "../../../services/api";
import MapAlert from "../../../components/UI/MapAlert";
import html2canvas from "html2canvas";

interface Coordinates {
  type: string;
  coordinates: [number, number];
  updatedAt?: string;
}

interface Entity {
  entityId: {
    _id: string;
    name: string;
    kind: string;
  };
  status: string;
  attendedBy: string;
  attendedAt: string;
  _id: string;
}

interface UserRef {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Reporter {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface Alert {
  _id: string;
  reporter: Reporter;
  status: string;
  entities: Entity[];
  attendedBy?: UserRef;
  transferredTo?: UserRef;
  receptors: any[];
  lastLocation: Coordinates;
  locations?: Coordinates[];
  reportedAt: string;
  closedAt?: string;
  __v: number;
}

interface ApiResponse {
  message: string;
  alerts: Alert[];
  count: number;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const alertMapRef = useRef<any>(null);

  // Bitácora para la alerta seleccionada
  const [bitacoraEvents, setBitacoraEvents] = useState<any[]>([]);
  const [loadingBitacora, setLoadingBitacora] = useState<boolean>(false);

  // Filtros y Buscador
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Cargar alertas desde el Backend
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse | Alert[]>("/api/alerts");
      const rawList = Array.isArray(data) ? data : data.alerts || [];
      setAlerts(rawList);
    } catch (error) {
      console.error("❌ Error al cargar alertas:", error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAlerts();
  }, []);

  // Cargar eventos de bitácora cuando se selecciona una alerta
  useEffect(() => {
    if (!selectedAlert) {
      setBitacoraEvents([]);
      return;
    }
    const fetchBitacora = async () => {
      setLoadingBitacora(true);
      try {
        const res = await api.get(`/api/alert-events/${selectedAlert._id}`);
        const rawEvents = Array.isArray(res.data?.alertEvents) ? res.data.alertEvents : [];
        setBitacoraEvents(rawEvents);
      } catch (e) {
        console.error("❌ Error al cargar bitácora en detalles:", e);
        setBitacoraEvents([]);
      } finally {
        setLoadingBitacora(false);
      }
    };
    void fetchBitacora();
  }, [selectedAlert]);

  // Ruta calculada para el mapa de la alerta seleccionada
  const selectedAlertRoute = useMemo(() => {
    if (!selectedAlert) return [];

    const getNormalized = (raw: any) => {
      const c = raw.coordinates || raw;
      if (!Array.isArray(c) || c.length < 2) return null;
      const v1 = Number(c[0]);
      const v2 = Number(c[1]);
      if (isNaN(v1) || isNaN(v2)) return null;
      if (Math.abs(v1) < Math.abs(v2)) {
        return { lat: v1, lng: v2 };
      }
      return { lng: v1, lat: v2 };
    };

    const pts = (selectedAlert.locations && selectedAlert.locations.length > 0)
      ? selectedAlert.locations
      : (selectedAlert.lastLocation?.coordinates ? [{ coordinates: selectedAlert.lastLocation.coordinates }] : []);

    return pts.map(getNormalized).filter(Boolean) as { lat: number; lng: number }[];
  }, [selectedAlert]);

  // Marcador para el mapa de la alerta seleccionada
  const selectedAlertMarker = useMemo(() => {
    if (!selectedAlert) return [];
    const lastP = selectedAlertRoute[selectedAlertRoute.length - 1];
    if (!lastP) return [];
    return [{
      id: selectedAlert._id,
      alertId: selectedAlert._id,
      lat: lastP.lat,
      lng: lastP.lng,
      emitterName: selectedAlert.reporter?.name || "Afectado",
      emitterPhone: selectedAlert.reporter?.phone || "",
      emitterId: selectedAlert.reporter?._id || "",
      createdAt: selectedAlert.reportedAt,
      status: selectedAlert.status === "closed" ? "closed" : selectedAlert.status === "attended" ? "attended" : "active",
      avatar: "",
    }];
  }, [selectedAlert, selectedAlertRoute]);

  // Filtrado de alertas en memoria
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const reporterName = alert.reporter?.name?.toLowerCase() || "";
        const reporterEmail = alert.reporter?.email?.toLowerCase() || "";
        const idStr = alert._id?.toLowerCase() || "";
        if (!reporterName.includes(q) && !reporterEmail.includes(q) && !idStr.includes(q)) {
          return false;
        }
      }

      if (statusFilter !== "all") {
        if (statusFilter === "active" && alert.status !== "active") return false;
        if (statusFilter === "attended" && alert.status !== "attended") return false;
        if (statusFilter === "closed" && alert.status !== "closed") return false;
      }

      if (startDate) {
        const repDate = new Date(alert.reportedAt);
        if (repDate < new Date(startDate)) return false;
      }
      if (endDate) {
        const repDate = new Date(alert.reportedAt);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (repDate > end) return false;
      }

      return true;
    });
  }, [alerts, searchQuery, statusFilter, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, startDate, endDate]);

  const totalPages = Math.ceil(filteredAlerts.length / pageSize) || 1;
  const paginatedAlerts = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredAlerts.slice(startIdx, startIdx + pageSize);
  }, [filteredAlerts, currentPage, pageSize]);

  const downloadSingleAlertPdf = async (alertId: string, alertStatus: string) => {
    if (alertStatus !== "closed") {
      alert("El informe oficial de emergencia solo se puede descargar para alertas CERRADAS / FINALIZADAS.");
      return;
    }

    setDownloadingId(alertId);

    let mapImageDataUrl = "";
    try {
      if (alertMapRef.current) {
        const canvas = alertMapRef.current.getCanvas();
        if (canvas) {
          mapImageDataUrl = canvas.toDataURL("image/png");
        }
      }
    } catch (err) {
      console.warn("⚠️ No se pudo obtener canvas desde alertMapRef:", err);
    }

    if (!mapImageDataUrl) {
      try {
        const mapContainer = document.querySelector(".mapboxgl-map") || document.querySelector(".mapboxgl-canvas");
        if (mapContainer) {
          const canvas = await html2canvas(mapContainer as HTMLElement, {
            useCORS: true,
            logging: false,
            allowTaint: true,
          });
          mapImageDataUrl = canvas.toDataURL("image/png");
        }
      } catch (err) {
        console.warn("⚠️ No se pudo capturar la vista del mapa desde el cliente:", err);
      }
    }

    try {
      const response = await api.post(`/api/reports/alerts/${alertId}/pdf`, {
        mapImage: mapImageDataUrl,
      }, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `INFORME-EMERGENCIA-${alertId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Error al descargar informe PDF:", err);
      alert("Error al descargar el informe oficial en PDF desde el servidor.");
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("es-EC", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      closed: { label: "Cerrada", color: "bg-emerald-100 text-emerald-800" },
      attended: { label: "En Atención", color: "bg-amber-100 text-amber-800" },
      active: { label: "Pendiente", color: "bg-red-100 text-red-800 font-bold" },
    };
    const { label, color } = statusMap[status] || {
      label: status,
      color: "bg-slate-100 text-slate-800",
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>{label}</span>;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Contenedor principal */}
      <div className={`flex-1 p-6 transition-all duration-300 ${selectedAlert ? "w-2/3" : "w-full"}`}>
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Encabezado */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <FiAlertCircle className="text-red-600" /> Módulo de Gestión de Alertas
              </h1>
              <p className="text-sm text-slate-500">
                Historial completo, filtros por fecha, estado e impresión de informes oficiales en PDF
              </p>
            </div>
            <div className="text-xs text-slate-500 font-semibold bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
              Mostrando {filteredAlerts.length} de {alerts.length} alertas
            </div>
          </div>

          {/* Barra de Filtros, Buscador y Fechas */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <label className="mb-1 block text-xs font-medium text-slate-500 uppercase tracking-wider">
                Buscador
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nombre, email o ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 uppercase tracking-wider">
                <FiCalendar className="inline mr-1" /> Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 uppercase tracking-wider">
                <FiCalendar className="inline mr-1" /> Fecha Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 uppercase tracking-wider">
                Estado de Alerta
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white font-medium"
              >
                <option value="all">Todas las Emergencias</option>
                <option value="active">Pendientes</option>
                <option value="attended">En Atención</option>
                <option value="closed">Cerradas</option>
              </select>
            </div>
          </div>

          {/* Tabla de Alertas */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : paginatedAlerts.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                No hay alertas que coincidan con los criterios de búsqueda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-5 py-3 text-left">Reportero / Afectado</th>
                      <th className="px-5 py-3 text-left">Estado</th>
                      <th className="px-5 py-3 text-left">Entidad Responsable</th>
                      <th className="px-5 py-3 text-left">Fecha Reporte</th>
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                    {paginatedAlerts.map((alert) => {
                      const entityName =
                        alert.entities?.[0]?.entityId?.name ||
                        alert.attendedBy?.name ||
                        alert.transferredTo?.name ||
                        "Policía / Centro de Monitoreo";

                      return (
                        <tr
                          key={alert._id}
                          onClick={() => setSelectedAlert(alert)}
                          className={`cursor-pointer hover:bg-slate-50 transition-colors ${
                            selectedAlert?._id === alert._id ? "bg-blue-50/70" : ""
                          }`}
                        >
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                                {alert.reporter?.name?.charAt(0) || "U"}
                              </div>
                              <div className="ml-3">
                                <div className="font-semibold text-slate-900">
                                  {alert.reporter?.name || "Usuario no identificado"}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {alert.reporter?.email || alert.reporter?.phone || "Sin contacto"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            {getStatusBadge(alert.status)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-700">
                            {entityName}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                            {formatDate(alert.reportedAt)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAlert(alert);
                                }}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                                title="Ver detalles"
                              >
                                <FiEye size={18} />
                              </button>
                              <button
                                disabled={alert.status !== "closed" || downloadingId === alert._id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void downloadSingleAlertPdf(alert._id, alert.status);
                                }}
                                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium text-xs transition ${
                                  alert.status === "closed"
                                    ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                }`}
                                title={alert.status === "closed" ? "Descargar Informe PDF Oficial" : "Disponible solo si la alerta está CERRADA"}
                              >
                                <FiFileText size={14} />
                                {downloadingId === alert._id ? "Descargando..." : "PDF Oficial"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación */}
            {!loading && filteredAlerts.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 bg-slate-50/50">
                <span className="text-xs text-slate-500">
                  Página <strong className="text-slate-800">{currentPage}</strong> de{" "}
                  <strong className="text-slate-800">{totalPages}</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft /> Anterior
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Siguiente <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel lateral de detalles (derecha) */}
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          selectedAlert ? "translate-x-0" : "translate-x-full"
        } w-full md:w-96 lg:w-1/3 z-50 overflow-y-auto border-l border-slate-200`}
      >
        {selectedAlert ? (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FiMapPin className="text-blue-600" /> Detalles de Emergencia
              </h3>
              <button
                onClick={() => setSelectedAlert(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Código ID */}
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">CÓDIGO DE ALERTA</span>
              <p className="text-xs font-mono font-bold text-slate-900 break-all">{selectedAlert._id}</p>
            </div>

            {/* Mapa Interactivo con Trazo de Ruta (locations) */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <FiMapPin size={14} className="text-red-600" /> Mapa de Ruta del Recorrido (locations: {selectedAlertRoute.length})
              </span>
              <div className="h-60 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-inner relative bg-slate-100">
                {selectedAlertRoute.length > 0 ? (
                  <MapAlert
                    mapRef={alertMapRef}
                    markers={selectedAlertMarker}
                    route={selectedAlertRoute}
                    zoom={14}
                    alertZoom={16}
                    height="100%"
                    width="100%"
                    onAttend={() => undefined}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    Sin coordenadas registradas para visualizar mapa.
                  </div>
                )}
              </div>
            </div>

            {/* Reportero */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                <FiUser size={14} className="text-blue-600" /> Reportero / Afectado
              </span>
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-sm font-bold text-slate-900">{selectedAlert.reporter?.name || "Usuario no identificado"}</p>
                <p className="text-xs text-slate-600 flex items-center gap-1.5"><FiMail size={12} /> {selectedAlert.reporter?.email || "No registrado"}</p>
                <p className="text-xs text-slate-600 flex items-center gap-1.5"><FiPhone size={12} /> {selectedAlert.reporter?.phone || "Sin teléfono"}</p>
              </div>
            </div>

            {/* Entidad y Personal de Respuesta */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                <FiUsers size={14} className="text-blue-600" /> Entidad y Personal de Respuesta
              </span>
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <p className="text-slate-700">
                  <strong className="text-slate-900">Entidad Responsable:</strong>{" "}
                  {selectedAlert.entities?.[0]?.entityId?.name || selectedAlert.attendedBy?.name || "Policía / Monitoreo Viored"}
                </p>
                <p className="text-slate-700">
                  <strong className="text-slate-900">Atendido Inicialmente Por:</strong>{" "}
                  {selectedAlert.attendedBy?.name || "Centro de Monitoreo"}
                </p>
                <p className="text-slate-700">
                  <strong className="text-slate-900">Delegado / Transferido A:</strong>{" "}
                  {selectedAlert.transferredTo?.name ? `${selectedAlert.transferredTo.name} (Delegado)` : "Sin transferencia"}
                </p>
              </div>
            </div>

            {/* Estado */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Estado Final</span>
              <div>{getStatusBadge(selectedAlert.status)}</div>
            </div>

            {/* Fechas */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                <FiClock size={14} className="text-blue-600" /> Fecha de Reporte
              </span>
              <p className="text-xs font-medium text-slate-800">{formatDate(selectedAlert.reportedAt)}</p>
            </div>

            {/* Ubicación Principal */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                <FiMapPin size={14} className="text-blue-600" /> Coordenadas Registradas (Última Ubicación)
              </span>
              <p className="text-xs font-mono text-slate-800">
                {selectedAlert.lastLocation?.coordinates
                  ? `${selectedAlert.lastLocation.coordinates[1].toFixed(6)}, ${selectedAlert.lastLocation.coordinates[0].toFixed(6)}`
                  : "N/A"}
              </p>
            </div>

            

            {/* Bitácora Cronológica de Eventos */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                <FiList size={14} className="text-blue-600" /> Bitácora Cronológica de Eventos ({bitacoraEvents.length})
              </span>
              <div className="max-h-44 overflow-y-auto space-y-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
                {loadingBitacora ? (
                  <p className="text-xs text-slate-400 italic">Cargando eventos de bitácora...</p>
                ) : bitacoraEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Sin observaciones registradas en la bitácora.</p>
                ) : (
                  bitacoraEvents.map((ev, idx) => (
                    <div key={ev._id || idx} className="border-b border-slate-200 pb-1.5 last:border-0 last:pb-0 text-xs">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>{ev.createdBy?.name || ev.createdBy?.email || "Sistema"}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(ev.createdAt).toLocaleTimeString("es-EC", { hour12: false })}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{ev.description || ev.mensaje}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Acciones del Panel */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                disabled={selectedAlert.status !== "closed" || downloadingId === selectedAlert._id}
                onClick={() => downloadSingleAlertPdf(selectedAlert._id, selectedAlert.status)}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition ${
                  selectedAlert.status === "closed"
                    ? "bg-red-600 text-white shadow-md hover:bg-red-700"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <FiDownload size={16} />
                {downloadingId === selectedAlert._id ? "Generando PDF Oficial..." : "Descargar Informe PDF Oficial"}
              </button>
              {selectedAlert.status !== "closed" && (
                <p className="text-[11px] text-slate-400 text-center italic">
                  El informe PDF oficial con bitácora y mapa sólo se emite al CERRAR la emergencia.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
