import  { useEffect, useMemo, useState } from "react";
import {
  FiX,
  FiPhone,
  FiMapPin,
  FiClock,
  FiAlertTriangle,
  FiMaximize2,
  FiUsers,
  FiCheckCircle,
  FiArrowRight,
  FiRadio,
  FiSend,
  FiInfo,
  FiDownload,
  FiUser,
  FiFileText,
} from "react-icons/fi";
import html2canvas from "html2canvas";
import api from "../../../services/api";
import authService from "../../../services/auth-service";
import socketService from "../../../services/socket.service";
import { useSocketConnection } from "../../../hooks/useSocketListener";
import MapAlert from "../../../components/UI/MapAlert";
import ModalTracking from "../../../components/UI/ModalTracking";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type Prioridad = "Alta" | "Media" | "Baja";
type EstadoAlerta = "pendiente" | "en_atencion" | "cerrada";
type TabDerecha = "seguimiento" | "bitacora" | "reportes";

interface EmergencyAlert {
  id: string;
  nombre: string;
  email: string;
  descripcion: string;
  telefono: string;
  coords: string;
  direccion: string;
  distancia?: string;
  hora: string;
  haceMin: number;
  prioridad: Prioridad;
  asignadoA: string | null;
  transferredTo: any;
  statusOriginal: any;
  reportedAt: string;
  closedAt: string;
  rawAlert: any;
  attendedAt?: any;
  attendedBy?: any;
  estado: EstadoAlerta;
  lat: number;
  lng: number;
  visibleOnMap: boolean;
  transferedTo: string;
  x: number; // posición mock en el mapa (%)
  y: number;
  avatar?: string;
}

interface BitacoraEvento {
  id: string;
  hora: string;
  autor: string;
  mensaje: string;
  tipo: "operador" | "unidad" | "sistema";
}

interface Camara {
  id: string;
  nombre: string;
  enVivo: boolean;
  gradient: string;
}

/* -------------------------------------------------------------------------- */
/*                           API helpers / normalization                        */
/* -------------------------------------------------------------------------- */

interface AlertsApiResponse {
  message: string;
  alerts: any[];
  count: number;
}

const estadoFromStatus = (status?: string): EstadoAlerta => {
  if (status === "active") return "pendiente";
  if (status === "attended" || status === "en_atencion" || status === "in_progress") {
    return "en_atencion";
  }
  if (status === "closed" || status === "cerrada" || status === "finalized" || status === "canceled") {
    return "cerrada";
  }
  return "pendiente";
};

const prioridadFromStatus = (status?: string): Prioridad => {
  if (status === "active") return "Alta";
  if (status === "attended" || status === "in_progress") return "Media";
  if (status === "closed" || status === "cerrada" || status === "finalized" || status === "canceled") return "Baja";
  return "Alta";
};

const formatAlertTime = (value?: string) => {
  if (!value) return "--:--";
  try {
    return new Date(value).toLocaleTimeString("es-EC", { hour12: false });
  } catch {
    return "--:--";
  }
};

const getAlertCoordinates = (alert: any): [number, number] => {
  const coordinates =
    alert?.lastLocation?.coordinates ??
    alert?.location?.coordinates ??
    alert?.coordinates;

  if (Array.isArray(coordinates)) {
    return [Number(coordinates[0]) || 0, Number(coordinates[1]) || 0];
  }

  if (coordinates && typeof coordinates === "object") {
    return [
      Number(coordinates.lng ?? coordinates.longitude) || 0,
      Number(coordinates.lat ?? coordinates.latitude) || 0,
    ];
  }

  return [0, 0];
};

const toDisplayText = (value: unknown): string => {
  if (typeof value === "string") {
    const text = value.trim();
    return text || "Sistema";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (value && typeof value === "object") {
    const candidate = (value as any).name ?? (value as any).fullName ?? (value as any).username ?? (value as any).email ?? (value as any).title ?? (value as any).id;
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
    if (typeof candidate === "number") {
      return String(candidate);
    }
  }

  return "Sistema";
};

const buildBitacoraEvents = (alert: any): BitacoraEvento[] => {
  const rawEvents = Array.isArray(alert?.events) ? alert.events : [];
  const eventos = rawEvents
    .map((event: any, index: number) => {
      const mensaje =
        event?.message ??
        event?.description ??
        event?.details ??
        event?.title ??
        event?.comment ??
        "";

      if (!mensaje) return null;

      const tipo: BitacoraEvento["tipo"] =
        event?.type === "operator"
          ? "operador"
          : event?.type === "unit"
          ? "unidad"
          : "sistema";

      return {
        id: `${alert?._id ?? alert?.id ?? "event"}-${index}`,
        hora: formatAlertTime(event?.timestamp ?? event?.createdAt ?? event?.date ?? event?.time ?? alert?.reportedAt),
        autor: toDisplayText(event?.author ?? event?.createdBy ?? event?.user ?? event?.entity ?? event?.user?.name ?? event?.entity?.name),
        mensaje,
        tipo,
      } satisfies BitacoraEvento;
    })
    .filter(Boolean) as BitacoraEvento[];

  if (eventos.length > 0) {
    return eventos;
  }

  return [
    {
      id: `${alert?._id ?? alert?.id ?? "event"}-init`,
      hora: formatAlertTime(alert?.reportedAt ?? alert?.createdAt),
      autor: "Sistema",
      mensaje: alert?.message ?? "Emergencia recibida y registrada desde la API.",
      tipo: "sistema",
    },
  ];
};

const buildEmergencyAlert = (alert: any, index = 0): EmergencyAlert => {
  const [lng, lat] = getAlertCoordinates(alert);

  const safeLat = Number.isFinite(lat) ? lat : 0;
  const safeLng = Number.isFinite(lng) ? lng : 0;
  const status = alert.status ?? "active";
  const estado = estadoFromStatus(status);
  const prioridad = prioridadFromStatus(status);
  const reporter = alert.reporter ?? {};
  const entityName = alert.entities?.[0]?.entityId?.name ?? null;
  const id = alert._id ?? alert.id ?? `alert-${index + 1}`;
  const visibleOnMap = status === "active" || status === "attended";

  const attendedBy = alert.attendedBy ? {
    _id: alert.attendedBy._id || alert.attendedBy,
    name: alert.attendedBy.name || alert.attendedBy.email || "Operador",
    email: alert.attendedBy.email,
  } : null;

  const transferredTo = alert.transferredTo ? {
    _id: alert.transferredTo._id || alert.transferredTo,
    name: alert.transferredTo.name || alert.transferredTo.email || "Colaborador",
    email: alert.transferredTo.email,
  } : null;

  const asignadoNombre = transferredTo
    ? `${transferredTo.name} (Delegado)`
    : attendedBy
    ? attendedBy.name
    : entityName ?? "Operador asignado";

  return {
    id,
    nombre: reporter.name ?? reporter.fullName ?? alert.emitterName ?? "Usuario no identificado",
    email: reporter.email,
    descripcion:
      alert.events?.[0]?.message ??
      alert.description ??
      alert.message ??
      "Alerta de pánico",
    telefono: reporter.phone ?? reporter.phoneNumber ?? reporter.telefono ?? alert.emitterPhone ?? "Sin teléfono",
    coords: `${safeLat.toFixed(4)}, ${safeLng.toFixed(4)}`,
    direccion: alert.lastLocation?.address ?? "Ubicación en tiempo real",
    hora: formatAlertTime(alert.reportedAt ?? alert.createdAt),
    reportedAt: alert.reportedAt ?? alert.createdAt,
    closedAt: alert.closedAt,
    attendedAt: alert.attendedAt ?? null,
    haceMin: 0,
    prioridad,
    asignadoA: estado !== "pendiente" ? asignadoNombre : null,
    transferredTo,
    attendedBy,
    estado,
    statusOriginal: status,
    lat: safeLat,
    lng: safeLng,
    visibleOnMap,
    transferedTo: transferredTo?.name ?? "",
    x: 12 + (index % 5) * 16 + (index % 2 ? 8 : 0),
    y: 16 + (index % 4) * 16,
    avatar: reporter.avatar ?? alert.avatar ?? "",
    rawAlert: alert,
  };
};

const CAMARAS_INICIALES: Camara[] = [
  {
    id: "cam-01",
    nombre: "Cámara 01 - Frente",
    enVivo: true,
    gradient: "from-slate-400 to-slate-600",
  },
  {
    id: "cam-02",
    nombre: "Cámara 02 - Entrada",
    enVivo: true,
    gradient: "from-emerald-700 to-emerald-900",
  },
];

/* -------------------------------------------------------------------------- */
/*                              Helper components                             */
/* -------------------------------------------------------------------------- */

const prioridadStyles: Record<Prioridad, string> = {
  Alta: "text-red-600 bg-red-50",
  Media: "text-amber-600 bg-amber-50",
  Baja: "text-emerald-600 bg-emerald-50",
};

function EstadoBadge({ estado }: { estado: EstadoAlerta }) {
  if (estado === "en_atencion") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
        <FiClock className="h-3.5 w-3.5" /> EN ATENCIÓN
      </span>
    );
  }
  if (estado === "cerrada") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
        <FiCheckCircle className="h-3.5 w-3.5" /> CERRADA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
      <FiAlertTriangle className="h-3.5 w-3.5" /> PENDIENTE
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Main page                                  */
/* -------------------------------------------------------------------------- */

export default function Live() {
  const [alertas, setAlertas] = useState<EmergencyAlert[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCameras, setShowCameras] = useState(false);
  const [showFullCamera, setShowFullCamera] = useState<Camara | null>(null);
  const [activeTab, setActiveTab] = useState<TabDerecha>("seguimiento");
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [bitacoraDraft, setBitacoraDraft] = useState("");
  const [bitacoraPorAlerta, setBitacoraPorAlerta] = useState<
    Record<string, BitacoraEvento[]>
  >({});
  const [collaborators, setCollaborators] = useState<{ _id: string; name: string; email?: string }[]>([]);
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState<boolean>(false);

  const entityId = authService.getEntityIdFromToken?.() || authService.getUserIdFromToken?.() || "";
  const currentUserId = authService.getUserIdFromToken?.() || "";
  useSocketConnection(entityId || "");

  // Cargar colaboradores de la entidad
  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const idToFetch = entityId || currentUserId || "mine";
        console.log("📋 Entity ID for collaborators:", idToFetch);
        const response = await api.get(`/api/entity/${idToFetch}/sons`);
        console
        if (Array.isArray(response.data)) {
          setCollaborators(response.data);
        }
      } catch (error) {
        console.error("❌ Error al cargar colaboradores de la entidad:", error);
      }
    };
    void fetchCollaborators();
  }, [entityId, currentUserId]);

  const fetchBitacoraEvents = async (alertId: string) => {
    try {
      const response = await api.get(`/api/alert-events/${alertId}`);
      const rawEvents = Array.isArray(response.data?.alertEvents)
        ? response.data.alertEvents
        : [];

      const eventos: BitacoraEvento[] = rawEvents.map((ev: any, idx: number) => ({
        id: ev._id || `ev-${idx}`,
        hora: formatAlertTime(ev.createdAt),
        autor: toDisplayText(ev.createdBy?.name || ev.createdBy?.email || "Usuario"),
        mensaje: ev.description || ev.mensaje || "",
        tipo: "operador",
      }));

      setBitacoraPorAlerta((prev) => ({
        ...prev,
        [alertId]: eventos,
      }));
    } catch (error) {
      console.error("❌ Error al obtener eventos de bitácora:", error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await api.get<AlertsApiResponse>("/api/alerts");
      const payload = Array.isArray(response.data?.alerts)
        ? response.data.alerts
        : [];

      const mappedAlerts = payload.map((alert, index) => buildEmergencyAlert(alert, index));

      setAlertas(mappedAlerts);
      setSelectedId((currentId) => {
        if (currentId && mappedAlerts.some((alert) => alert.id === currentId)) {
          return currentId;
        }
        return null;
      });

      payload.forEach((alert, index) => {
        const alertId = mappedAlerts[index]?.id;
        if (!alertId) return;
        const eventos = buildBitacoraEvents(alert);
        setBitacoraPorAlerta((prev) => ({
          ...prev,
          [alertId]: prev[alertId] && prev[alertId].length > 0 ? prev[alertId] : eventos,
        }));
      });
    } catch (error) {
      console.error("❌ Error al cargar alertas desde la API:", error);
    }
  };

  useEffect(() => {
    void fetchAlerts();
    const intervalId = window.setInterval(() => {
      void fetchAlerts();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [entityId]);

  // Cargar eventos de bitácora cuando cambia la alerta seleccionada
  useEffect(() => {
    if (selectedId) {
      void fetchBitacoraEvents(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    const handlePanicAlert = (data: any) => {
      const alertId = data?.alertId ?? data?._id ?? data?.id;
      if (!alertId) return;

      void fetchAlerts();
    };

    const handleAlertAttended = (data: any) => {
      console.log(data)
      void fetchAlerts();
    };

    const handleAlertFinalized = (data: any) => {
      console.log(data)
      void fetchAlerts();
    };

    const handleLocationUpdate = (data: any) => {
      const alertId = data?.alertId ?? data?._id ?? data?.id;
      if (!alertId) return;
      const [lng, lat] = Array.isArray(data?.coordinates) ? data.coordinates : [0, 0];
      const safeLat = Number.isFinite(lat) ? lat : 0;
      const safeLng = Number.isFinite(lng) ? lng : 0;
      setAlertas((prev) =>
        prev.map((alert) =>
          alert.id === String(alertId)
            ? {
                ...alert,
                lat: safeLat,
                lng: safeLng,
                coords: `${safeLat.toFixed(4)}, ${safeLng.toFixed(4)}`,
              }
            : alert
        )
      );
    };

    socketService.on("panic-alert", handlePanicAlert);
    socketService.on("alert-attended", handleAlertAttended);
    socketService.on("alert-finalized", handleAlertFinalized);
    socketService.on("location-update", handleLocationUpdate);

    return () => {
      socketService.off("panic-alert", handlePanicAlert);
      socketService.off("alert-attended", handleAlertAttended);
      socketService.off("alert-finalized", handleAlertFinalized);
      socketService.off("location-update", handleLocationUpdate);
    };
  }, []);

  const selectedAlert = useMemo(
    () => alertas.find((a) => a.id === selectedId) ?? null,
    [alertas, selectedId]
  );
  const activeAlertsOnMap = useMemo(
    () => alertas.filter((alert) => alert.visibleOnMap),
    [alertas]
  );
  const mapMarkers = useMemo(
    () =>
      activeAlertsOnMap.map((alert) => ({
        id: alert.id,
        alertId: alert.id,
        lat: alert.lat,
        lng: alert.lng,
        emitterName: alert.nombre,
        emitterPhone: alert.telefono,
        emitterId: alert.id,
        createdAt: alert.hora,
        status: alert.estado === "cerrada" ? "closed" : alert.estado === "en_atencion" ? "attended" : "active",
        avatar: alert.avatar || "",
      })),
    [activeAlertsOnMap]
  );

  const eventosBitacora = selectedId ? bitacoraPorAlerta[selectedId] ?? [] : [];

  // Verificación de permisos de transferencia y cierre
  const isTransferredToOther = useMemo(() => {
    if (!selectedAlert || !selectedAlert.transferredTo) return false;
    const targetId = selectedAlert.transferredTo._id || String(selectedAlert.transferredTo);
    return currentUserId !== targetId;
  }, [selectedAlert, currentUserId]);

  const selectedAlertRoute = useMemo(() => {
    if (!selectedAlert || !selectedAlert.rawAlert) return [];
    const locs = selectedAlert.rawAlert.locations || selectedAlert.rawAlert.lastLocation?.coordinates;
    if (Array.isArray(locs)) {
      return locs.map((loc: any) => {
        const coords = loc.coordinates || loc;
        return {
          lng: Number(coords[0]) || 0,
          lat: Number(coords[1]) || 0,
        };
      }).filter(p => p.lat !== 0 && p.lng !== 0);
    }
    return [];
  }, [selectedAlert]);

  /* --------------------------- actions --------------------------- */

  function handleSelectAlert(id: string) {
    setSelectedId(id);
    setShowCameras(false);
  }

  async function handleAtender(id: string) {
    try {
      await api.put(`/api/alerts/${id}/attend`);
      setSelectedId(id);
      setActiveTab("seguimiento");
      void fetchAlerts();
      void fetchBitacoraEvents(id);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al atender la emergencia");
    }
  }

  async function handleTransferir() {
    if (!selectedId || !selectedCollaboratorId) {
      alert("Por favor seleccione un colaborador de la lista para transferir la emergencia.");
      return;
    }
    try {
      setIsTransferring(true);
      const response = await api.put(`/api/alerts/${selectedId}/transfer`, {
        targetUserId: selectedCollaboratorId,
      });
      alert(response.data?.message || "Emergencia transferida correctamente");
      setSelectedCollaboratorId("");
      void fetchAlerts();
      void fetchBitacoraEvents(selectedId);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al transferir la emergencia");
    } finally {
      setIsTransferring(false);
    }
  }

  async function handleCerrarEmergencia() {
    if (!selectedId) return;
    if (isTransferredToOther) {
      alert("La emergencia fue transferida a otro colaborador. Solo el usuario delegado puede cerrarla.");
      return;
    }
    try {
      await api.put(`/api/alerts/${selectedId}/close`);
      alert("Emergencia cerrada exitosamente");
      void fetchAlerts();
      void fetchBitacoraEvents(selectedId);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al cerrar la emergencia");
    }
  }

  async function handleRegistrarEvento() {
    if (!selectedId || !bitacoraDraft.trim()) return;
    try {
      await api.post("/api/alert-events", {
        alertId: selectedId,
        description: bitacoraDraft.trim(),
      });
      setBitacoraDraft("");
      void fetchBitacoraEvents(selectedId);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al registrar evento en bitácora");
    }
  }

  async function generarPDF() {
    if (!selectedAlert) return;
    if (selectedAlert.estado !== "cerrada") {
      alert("El informe de emergencia solo se puede generar una vez que la alerta esté CERRADA.");
      return;
    }

    let mapImageDataUrl = "";
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
      console.warn("⚠️ No se pudo capturar la vista del mapa en Live:", err);
    }

    try {
      const response = await api.post(`/api/reports/alerts/${selectedAlert.id}/pdf`, {
        mapImage: mapImageDataUrl,
      }, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `INFORME-EMERGENCIA-${selectedAlert.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("❌ Error al generar PDF desde el backend:", err);
      alert("Error al descargar el informe PDF desde el servidor.");
    }
  }

  /* ------------------------------------------------------------------ */

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 text-slate-800">
      {/* ---------------------------- Top bar ---------------------------- */}
      <header className="flex items-center justify-between  px-6 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            Mapa en vivo <span className="h-2 w-2 rounded-full bg-red-500" />
          </h1>
          <p className="text-sm text-slate-500">
            Monitoreo y gestión de emergencias en tiempo real
          </p>
        </div>
      
      </header>

      {/* ---------------------------- Body ---------------------------- */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* -------------------- Left/center column -------------------- */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {/* Map area */}
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-[#eef1f4]">
           

            
            <div className="absolute inset-0 z-0">
              <MapAlert
                markers={mapMarkers}
                route={selectedAlertRoute}
                zoom={12}
                alertZoom={14}
                height="100%"
                width="100%"
                onAttend={() => undefined}
              />
            </div>

            {/* Cameras panel — only visible after "Ver cámaras" */}
            {showCameras && (
              <div className="absolute right-4 top-20 z-20 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Cámaras asignadas ({CAMARAS_INICIALES.length})
                  </h3>
                  <button
                    onClick={() => setShowCameras(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {CAMARAS_INICIALES.map((cam) => (
                    <div key={cam.id}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700">
                          {cam.nombre}
                        </span>
                        {cam.enVivo && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            En vivo
                          </span>
                        )}
                      </div>
                      <div
                        className={`relative h-24 w-full overflow-hidden rounded-lg bg-gradient-to-br ${cam.gradient}`}
                      >
                        <button
                          onClick={() => setShowFullCamera(cam)}
                          className="absolute bottom-1.5 right-1.5 rounded-md bg-black/40 p-1.5 text-white hover:bg-black/60"
                        >
                          <FiMaximize2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="mt-3 w-full rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  Ver todas las cámaras
                </button>
              </div>
            )}

            {/* Map controls */}
            
          </div>

          {/* ------------------------ Alerts table ------------------------ */}
          <div className="max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Alertas ({alertas.length})
              </h3>
              
            </div>

            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="px-5 py-2 font-medium">Estado</th>
                  <th className="px-5 py-2 font-medium">Nombre / Descripción</th>
                  <th className="px-5 py-2 font-medium">Ubicación</th>
                  <th className="px-5 py-2 font-medium">Hora</th>
                  <th className="px-5 py-2 font-medium">Prioridad</th>
                  <th className="px-5 py-2 font-medium">Asignado a</th>
                  <th className="px-5 py-2 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {alertas.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => handleSelectAlert(a.id)}
                      className={`cursor-pointer border-b border-slate-50 hover:bg-slate-50 ${
                        a.id === selectedId ? "bg-slate-50" : ""
                      }`}
                    >
                      <td className="px-5 py-3">
                        <EstadoBadge estado={a.estado} />
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{a.nombre}</p>
                        <p className="text-xs text-slate-500">{a.descripcion}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        <p>{a.coords}</p>
                        <p className="text-xs text-slate-400">{a.direccion}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        <p>{a.hora}</p>
                        <p className="text-xs text-slate-400">
                          Hace {a.haceMin} min
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-md px-2 py-1 text-xs font-medium ${
                            prioridadStyles[a.prioridad]
                          }`}
                        >
                          {a.prioridad}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {a.asignadoA ?? "Sin asignar"}
                      </td>
                      <td className="px-5 py-3">
                        {a.estado === "pendiente" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAtender(a.id);
                            }}
                            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                          >
                            Atender
                          </button>
                        ) : a.estado === "en_atencion" ? (
                          <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600">
                            En atención
                          </span>
                        ) : (
                          <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                            Cerrada
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            <div className="border-t border-slate-100 py-3 text-center">
              <button className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700">
                Ver todas las alertas <FiArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* --------------------------- Right panel --------------------------- */}
        <aside className="flex w-96 flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Atención de emergencia
            </h2>
            {selectedAlert && (
              <button
                onClick={() => setSelectedId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>

          {!selectedAlert ? (
            /* -------- Disabled / empty state: unlocks only on "Atender" -------- */
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <FiAlertTriangle className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                Ningún caso seleccionado
              </p>
              <p className="text-xs text-slate-400">
                Selecciona una alerta de la tabla o del mapa para ver su detalle, bitácora y reportes.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Info summary */}
              <div className="space-y-3 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center justify-between">
                  <EstadoBadge estado={selectedAlert.estado} />
                  <span className="text-xs text-slate-400">
                    ID: #{selectedAlert.id}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Información de la emergencia
                  </p>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                      prioridadStyles[selectedAlert.prioridad]
                    }`}
                  >
                    {selectedAlert.prioridad}
                  </span>
                </div>

                <dl className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <FiUser className="h-4 w-4 text-slate-400" />
                    <dt className="text-slate-400">Usuario:</dt>
                    <dd className="ml-auto font-medium text-slate-800">
                      {selectedAlert.nombre}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className="h-4 w-4 text-slate-400" />
                    <dt className="text-slate-400">Teléfono:</dt>
                    <dd className="ml-auto font-medium text-slate-800">
                      {selectedAlert.telefono}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMapPin className="h-4 w-4 text-slate-400" />
                    <dt className="text-slate-400">Ubicación:</dt>
                    <dd className="ml-auto font-medium text-slate-800">
                      {selectedAlert.coords}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiInfo className="h-4 w-4 text-slate-400" />
                    <dt className="text-slate-400">Tipo:</dt>
                    <dd className="ml-auto font-medium text-slate-800">
                      {selectedAlert.descripcion}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock className="h-4 w-4 text-slate-400" />
                    <dt className="text-slate-400">Hora de activación:</dt>
                    <dd className="ml-auto font-medium text-slate-800">
                      {selectedAlert.hora}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 px-5">
                {(
                  [
                    ["seguimiento", "Seguimiento"],
                    ["bitacora", "Bitácora"],
                    ["reportes", "Reportes"],
                  ] as [TabDerecha, string][]
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`-mb-px border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                      activeTab === key
                        ? "border-emerald-600 text-emerald-600"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-auto px-5 py-4">
                {activeTab === "seguimiento" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Seguimiento en tiempo real
                      </h3>
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        En seguimiento
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-100 p-3">
                        <p className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
                          <FiClock className="h-3.5 w-3.5" /> Estado actual
                        </p>
                        <p className="text-sm font-semibold uppercase text-slate-900">
                          {selectedAlert.estado === "en_atencion" ? "En Atención" : selectedAlert.estado === "cerrada" ? "Cerrada" : "Pendiente"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-100 p-3">
                        <p className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
                          <FiUsers className="h-3.5 w-3.5" /> Atendido por
                        </p>
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {selectedAlert.asignadoA || "Sin asignar"}
                        </p>
                      </div>
                    </div>

                    {/* Sección de Transferencia / Delegación de Emergencia */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                      <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <FiUsers className="h-3.5 w-3.5 text-blue-600" /> Transferir / Delegar Emergencia
                      </p>
                      {selectedAlert.estado === "cerrada" ? (
                        <p className="text-xs text-slate-400">Esta emergencia ya está cerrada.</p>
                      ) : (
                        <>
                          <select
                            value={selectedCollaboratorId}
                            onChange={(e) => setSelectedCollaboratorId(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 font-medium"
                          >
                            <option value="">Seleccionar colaborador de la entidad...</option>
                            {collaborators.map((c: any) => {
                              const roleName = typeof c.role === "object" ? c.role?.name : c.role || "Colaborador";
                              return (
                                <option key={c._id} value={c._id}>
                                  {c.name} — [{roleName}] ({c.email || "Colaborador"})
                                </option>
                              );
                            })}
                          </select>
                          <button
                            onClick={handleTransferir}
                            disabled={!selectedCollaboratorId || isTransferring}
                            className="w-full rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
                          >
                            {isTransferring ? "Transferiendo..." : "Transferir emergencia"}
                          </button>
                        </>
                      )}
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                        Rastreo en vivo
                      </p>
                      <div className="relative h-40 overflow-hidden rounded-xl bg-slate-900">
                        <img
                          src="https://gesturbanos.wordpress.com/wp-content/uploads/2021/04/cpguaman_t1_03.jpg?w=449"
                          alt="Vista previa del área de rastreo"
                          className="absolute inset-0 h-full w-full object-cover opacity-55 grayscale-[20%]"
                        />
                        <div className="absolute inset-0 bg-slate-950/45" />

                        <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                          {selectedAlert.estado === "pendiente" && (
                            <>
                              <span className="absolute h-24 w-24 rounded-full border border-emerald-300/70 animate-ping" />
                              <span className="absolute h-16 w-16 rounded-full border border-emerald-300/80 animate-ping [animation-delay:0.5s]" />
                              <span className="absolute h-10 w-10 rounded-full bg-emerald-400/25 animate-pulse" />
                            </>
                          )}
                          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-lg shadow-emerald-950/60">
                            <FiRadio className="h-5 w-5" />
                          </span>
                        </div>
                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-medium text-emerald-100">
                          {selectedAlert.estado === "cerrada" ? "Emergencia Finalizada" : selectedAlert.estado === "en_atencion" ? "En Atención" : "Señal de rastreo activa"}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowTracking(true)}
                        className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Ver ruta
                        <FiArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "bitacora" && (
                  <div className="flex h-full flex-col gap-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Bitácora de eventos
                    </h3>

                    <textarea
                      value={bitacoraDraft}
                      onChange={(e) => setBitacoraDraft(e.target.value)}
                      placeholder="Escribe una actualización del estado de la emergencia..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleRegistrarEvento}
                      disabled={!bitacoraDraft.trim()}
                      className="flex items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FiSend className="h-4 w-4" /> Registrar evento
                    </button>

                    <div className="mt-2 space-y-4 border-t border-slate-100 pt-3">
                      {[...eventosBitacora].reverse().map((ev) => (
                        <div key={ev.id} className="flex gap-3 text-sm">
                          <span
                            className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                              ev.tipo === "sistema"
                                ? "bg-slate-300"
                                : ev.tipo === "unidad"
                                ? "bg-red-500"
                                : "bg-emerald-500"
                            }`}
                          />
                          <div>
                            <p className="text-xs text-slate-400">
                              {ev.hora} · {ev.autor}
                            </p>
                            <p className="text-slate-700">{ev.mensaje}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "reportes" && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Reporte Oficial de Emergencia
                    </h3>

                    {selectedAlert.estado !== "cerrada" ? (
                      <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
                        <FiInfo className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                        <div>
                          <p className="font-semibold mb-0.5">Reporte Bloqueado</p>
                          <p>
                            El informe oficial completo estará disponible únicamente cuando la alerta haya sido <strong>CERRADA</strong>.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
                        <FiCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                        <div>
                          <p className="font-semibold mb-0.5">Emergencia Finalizada</p>
                          <p>
                            El informe oficial con cronología de bitácora y ruta en mapa ya está listo para descarga.
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={generarPDF}
                      disabled={selectedAlert.estado !== "cerrada"}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-medium text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FiFileText className="h-4 w-4" />
                      Descargar reporte en PDF
                    </button>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4">
                {isTransferredToOther && (
                  <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                    ⚠️ Esta emergencia fue delegada a <strong>{selectedAlert.transferredTo?.name}</strong>. Solo el colaborador delegado puede cerrarla.
                  </p>
                )}

                <div className="flex gap-3">
                  {selectedAlert.estado === "pendiente" ? (
                    <button
                      onClick={() => handleAtender(selectedAlert.id)}
                      className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-700"
                    >
                      Atender emergencia
                    </button>
                  ) : selectedAlert.estado === "en_atencion" ? (
                    <button
                      onClick={handleCerrarEmergencia}
                      disabled={isTransferredToOther}
                      className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FiCheckCircle className="inline h-4 w-4 mr-1" /> Cerrar emergencia
                    </button>
                  ) : (
                    <button
                      onClick={generarPDF}
                      className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700"
                    >
                      <FiFileText className="inline h-4 w-4 mr-1" /> DESCARGAR INFORME PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* --------------------------- Camera modal --------------------------- */}
      {showFullCamera && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setShowFullCamera(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <p className="text-sm font-semibold text-slate-900">
                {showFullCamera.nombre}
              </p>
              <button
                onClick={() => setShowFullCamera(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div
              className={`h-96 w-full bg-gradient-to-br ${showFullCamera.gradient}`}
            />
          </div>
        </div>
      )}

      {showTracking && selectedAlert && (
        <ModalTracking
          alertId={selectedAlert.id}
          initialAlert={{
            name: selectedAlert.nombre,
            phone: selectedAlert.telefono,
            lat: selectedAlert.lat,
            lng: selectedAlert.lng,
            time: selectedAlert.hora,
            avatar: selectedAlert.avatar,
          }}
          onClose={() => setShowTracking(false)}
        />
      )}

      {/* --------------------------- Report preview modal --------------------------- */}
      {showReportPreview && selectedAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setShowReportPreview(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <p className="text-sm font-semibold text-slate-900">
                Vista previa del reporte — #{selectedAlert.id}
              </p>
              <button
                onClick={() => setShowReportPreview(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto px-6 py-5">
              <h4 className="mb-3 text-xs font-semibold uppercase text-slate-400">
                Información de la emergencia
              </h4>
              <dl className="mb-6 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-400">Usuario</dt>
                  <dd className="font-medium text-slate-800">
                    {selectedAlert.nombre}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Teléfono</dt>
                  <dd className="font-medium text-slate-800">
                    {selectedAlert.telefono}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Ubicación</dt>
                  <dd className="font-medium text-slate-800">
                    {selectedAlert.coords}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Dirección</dt>
                  <dd className="font-medium text-slate-800">
                    {selectedAlert.direccion}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Tipo</dt>
                  <dd className="font-medium text-slate-800">
                    {selectedAlert.descripcion}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Hora de activación</dt>
                  <dd className="font-medium text-slate-800">
                    {selectedAlert.hora}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Prioridad</dt>
                  <dd className="font-medium text-slate-800">
                    {selectedAlert.prioridad}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Asignado a</dt>
                  <dd className="font-medium text-slate-800">
                    {selectedAlert.asignadoA ?? "Sin asignar"}
                  </dd>
                </div>
              </dl>

              <h4 className="mb-3 text-xs font-semibold uppercase text-slate-400">
                Bitácora de eventos
              </h4>
              <div className="space-y-3">
                {eventosBitacora.map((ev) => (
                  <div key={ev.id} className="flex gap-3 text-sm">
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-slate-300" />
                    <div>
                      <p className="text-xs text-slate-400">
                        {ev.hora} · {ev.autor}
                      </p>
                      <p className="text-slate-700">{ev.mensaje}</p>
                    </div>
                  </div>
                ))}
                {eventosBitacora.length === 0 && (
                  <p className="text-sm text-slate-400">
                    Aún no hay eventos registrados.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setShowReportPreview(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cerrar
              </button>
              <button
                onClick={generarPDF}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <FiDownload className="h-4 w-4" /> Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
