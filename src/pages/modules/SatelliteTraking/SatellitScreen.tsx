import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import Map, { Layer, Marker, NavigationControl, Source, type MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Clock3,
  FileText,
  Gauge,
  MapPin,
  Play,
  Pause,
  Search,
  LoaderCircle,
  Download,
  X,
  Car,
  Zap,
  Radio,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import trackingService, {
  type PeriodSummary,
  type RouteResponse,
  type TrackingEvent,
  type TrackingPosition,
  type TrackingStatus,
  type VehicleStateItem,
} from "../../../services/tracking-service";
import socketService from "../../../services/socket.service";
import authService from "../../../services/auth-service";


type MainTab = "live" | "history";
type PeriodPreset = "today" | "custom";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const VEHICLE_MARKER_ICON =
  "https://png.pngtree.com/png-clipart/20240811/original/pngtree-car-top-view-drawing-photos-png-image_15751161.png";

const DEFAULT_CENTER = { longitude: -79.675, latitude: -3.683 };
const todayDateStr = () => new Date().toISOString().slice(0, 10);

const dateStartISO = (date: string, time: string = "00:00") => `${date}T${time}:00`;
const dateEndISO = (date: string, time: string = "23:59") => `${date}T${time}:59.999`;

const formatDateStr = (date?: string | null) =>
  date
    ? new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(date))
    : "Sin registro";

const formatTimeString = (date?: string | null) =>
  date
    ? new Intl.DateTimeFormat("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(
        new Date(date)
      )
    : "--:--:--";

const formatDurationSec = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const addressCache = new globalThis.Map<string, string>();
let nominatimQueue: Promise<unknown> = Promise.resolve();

function throttledNominatimFetch(url: string): Promise<Response> {
  const run = nominatimQueue.then(async () => {
    const response = await fetch(url, { headers: { "Accept-Language": "es" } });
    await new Promise((resolve) => setTimeout(resolve, 1100));
    return response;
  });
  nominatimQueue = run.catch(() => {});
  return run;
}

async function streetFromPosition(lat?: number, lon?: number) {
  if (lat === undefined || lon === undefined || (lat === 0 && lon === 0) || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return "Sin ubicación";
  }
  const key = `${lon.toFixed(5)},${lat.toFixed(5)}`;
  if (addressCache.has(key)) return addressCache.get(key)!;
  try {
    const query = new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lon),
      zoom: "18",
      addressdetails: "0",
      email: "soporte@viryx.net",
    });
    const response = await throttledNominatimFetch(`https://nominatim.openstreetmap.org/reverse?${query}`);
    const data = (await response.json()) as { display_name?: string };
    const address = data.display_name ?? `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    addressCache.set(key, address);
    return address;
  } catch {
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }
}

function StatusBadge({ status }: { status: TrackingStatus }) {
  if (status === "MOVING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> En línea
      </span>
    );
  }
  if (status === "STOPPED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
        <span className="h-2 w-2 rounded-full bg-amber-500" /> Detenido
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
      <span className="h-2 w-2 rounded-full bg-slate-400" /> Desconectado
    </span>
  );
}

function TrackingMap({
  centerLat,
  centerLon,
  heading = 0,
  positions = [],
  stops = [],
  isPlaying = false,
  mapRef,
}: {
  centerLat?: number;
  centerLon?: number;
  heading?: number;
  positions?: TrackingPosition[];
  stops?: TrackingEvent[];
  events?: TrackingEvent[];
  isPlaying?: boolean;
  mapRef?: MutableRefObject<MapRef | null>;
}) {
  const validCenterLat = Number.isFinite(centerLat) && centerLat !== 0 ? centerLat : undefined;
  const validCenterLon = Number.isFinite(centerLon) && centerLon !== 0 ? centerLon : undefined;

  const validPositions = useMemo(() => {
    return (positions || []).filter(
      (p) => p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && (p.latitude !== 0 || p.longitude !== 0)
    );
  }, [positions]);

  const center = useMemo(() => {
    if (validCenterLat !== undefined && validCenterLon !== undefined) {
      return { latitude: validCenterLat, longitude: validCenterLon };
    }
    if (validPositions.length > 0) {
      return { latitude: validPositions[0].latitude, longitude: validPositions[0].longitude };
    }
    return DEFAULT_CENTER;
  }, [validCenterLat, validCenterLon, validPositions]);

  useEffect(() => {
    if (mapRef?.current && validCenterLat !== undefined && validCenterLon !== undefined) {
      try {
        mapRef.current.easeTo({
          center: [validCenterLon, validCenterLat],
          duration: isPlaying ? 0 : 300,
        });
      } catch (e) {}
    }
  }, [validCenterLat, validCenterLon, mapRef, isPlaying]);


  const routeGeoJson = useMemo(() => {
    if (validPositions.length < 2) return null;
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: validPositions.map((p) => [p.longitude, p.latitude]),
      },
    };
  }, [validPositions]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full items-center justify-center bg-amber-50 p-6 text-center text-sm text-amber-800">
        Configura <code>VITE_MAPBOX_TOKEN</code> para visualizar el mapa interactivo.
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      preserveDrawingBuffer={true}
      initialViewState={{ ...center, zoom: 15 }}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      style={{ width: "100%", height: "100%" }}
    >
      {/* Controles de Navegación abajo a la derecha para no obstruir paneles */}
      <NavigationControl position="bottom-right" />

      {/* Trazo continuo de la ruta */}
      {routeGeoJson && (
        <Source
          key={`route-source-${validPositions.length}-${validPositions[validPositions.length - 1]?.latitude || 0}-${validPositions[validPositions.length - 1]?.longitude || 0}`}
          id="route-source"
          type="geojson"
          data={routeGeoJson}
        >
          <Layer
            id="route-layer"
            type="line"
            paint={{
              "line-color": "#2563eb",
              "line-width": 5,
              "line-opacity": 0.85,
            }}
          />
        </Source>
      )}

      {/* Punto de Inicio (Verde) */}
      {validPositions.length > 0 && (
        <Marker longitude={validPositions[0].longitude} latitude={validPositions[0].latitude} anchor="bottom">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg border-2 border-white">
            <MapPin size={16} />
          </div>
        </Marker>
      )}

      {/* Punto de Fin (Rojo) */}
      {validPositions.length > 1 && (
        <Marker
          longitude={validPositions[validPositions.length - 1].longitude}
          latitude={validPositions[validPositions.length - 1].latitude}
          anchor="bottom"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg border-2 border-white">
            <MapPin size={16} />
          </div>
        </Marker>
      )}

      {/* Marcadores de Paradas */}
      {(stops || []).map((stop, idx) => {
        if (!stop || !Number.isFinite(stop.latitude) || !Number.isFinite(stop.longitude)) return null;
        return (
          <Marker key={stop._id || idx} longitude={stop.longitude!} latitude={stop.latitude!} anchor="bottom">
            <div
              title={`Parada: ${stop.duration ? formatDurationSec(stop.duration) : "En curso"}`}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow border border-white text-xs font-bold"
            >
              P
            </div>
          </Marker>
        );
      })}

      {/* Marcador del Vehículo con Rumbo */}
      {validCenterLat !== undefined && validCenterLon !== undefined && (
        <Marker longitude={validCenterLon} latitude={validCenterLat} anchor="center">
          <img
            src={VEHICLE_MARKER_ICON}
            alt="Vehículo"
            draggable={false}
            style={{
              width: 44,
              height: 44,
              transform: `rotate(${heading || 0}deg)`,
              transformOrigin: "center center",
              filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.3))",
              transition: "transform 0.3s ease-out",
            }}
          />
        </Marker>
      )}
    </Map>
  );
}

function interpolatePosition(points: TrackingPosition[], progress: number): TrackingPosition | null {
  if (!points || !points.length) return null;
  const safeProgress = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const step = Math.min(points.length - 1, safeProgress * (points.length - 1));
  const index = Math.floor(step);
  const next = points[Math.min(index + 1, points.length - 1)];
  const current = points[index];

  if (!current || !next || !Number.isFinite(current.latitude) || !Number.isFinite(current.longitude)) {
    return current || null;
  }

  const ratio = step - index;
  const lat = current.latitude + (next.latitude - current.latitude) * ratio;
  const lon = current.longitude + (next.longitude - current.longitude) * ratio;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return current;

  return {
    ...current,
    latitude: lat,
    longitude: lon,
    heading: current.heading !== undefined ? current.heading : next.heading,
  };
}

export default function SatellitScreen() {
  const [vehiclesState, setVehiclesState] = useState<VehicleStateItem[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mainTab, setMainTab] = useState<MainTab>("live");

  // Posiciones en tiempo real para pintar la línea en vivo
  const [livePositions, setLivePositions] = useState<TrackingPosition[]>([]);

  // Filtros de fecha y hora
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("today");
  const [fromDate, setFromDate] = useState(todayDateStr());
  const [toDate, setToDate] = useState(todayDateStr());
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");

  // Datos de Ruta e Historial
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [periodSummary, setPeriodSummary] = useState<PeriodSummary | null>(null);

  // Dirección Geocodificada
  const [currentAddress, setCurrentAddress] = useState<string>("Buscando dirección...");

  // Reproductor de Ruta
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const playProgressRef = useRef(0);

  const updateProgress = useCallback((val: number) => {
    const safeVal = Math.min(1, Math.max(0, Number.isFinite(val) ? val : 0));
    playProgressRef.current = safeVal;
    setPlayProgress(safeVal);
  }, []);

  // Modal de Reporte PDF
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeEvents, setIncludeEvents] = useState(true);
  const [includeStops, setIncludeStops] = useState(true);
  const [reportComment, setReportComment] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Estados de Carga y Error
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  console.log(error)

  const mapRef = useRef<MapRef | null>(null);

  // Redimensionar el mapa cuando cambia la pestaña (para evitar desajustes de canvas)
  useEffect(() => {
    setTimeout(() => {
      try {
        mapRef.current?.resize();
      } catch (e) {}
    }, 150);
  }, [mainTab]);

  // Limpiar paradas e historial al cambiar de vehículo
  useEffect(() => {
    setRouteData(null);
    setPeriodSummary(null);
    setLivePositions([]);
    setIsPlaying(false);
    updateProgress(0);
  }, [selectedVehicleId, updateProgress]);


  // Cargar lista de vehículos
  const loadFleetState = useCallback(async () => {
    try {
      const data = await trackingService.getAllVehiclesState();
      setVehiclesState(data);
      if (!selectedVehicleId && data.length > 0) {
        setSelectedVehicleId(data[0].vehicle._id);
      }
      setError("");
    } catch {
      setError("No se pudo conectar con el servicio de rastreo satelital.");
    } finally {
      setLoading(false);
    }
  }, [selectedVehicleId]);

  useEffect(() => {
    void loadFleetState();
  }, [loadFleetState]);

  // Cargar posiciones de hoy
  const loadLiveHistory = useCallback(async (vId: string) => {
    try {
      const fromISO = dateStartISO(fromDate, startTime);
      const toISO = dateEndISO(toDate, endTime);
      const points = await trackingService.getPositions(vId, fromISO, toISO);
      setLivePositions(points || []);
    } catch (e) {}
  }, [fromDate, startTime, toDate, endTime]);

  useEffect(() => {
    if (!selectedVehicleId) return;
    void loadLiveHistory(selectedVehicleId);
  }, [selectedVehicleId, loadLiveHistory]);

  // Escuchar Socket.IO
  useEffect(() => {
    const entityId = authService.getEntityIdFromToken() || authService.getUserIdFromToken() || "";
    socketService.connect(entityId);

    const handleUpdate = (data: any) => {
      if (!data) return;

      const vId = data.vehicleId || data.vehicle;
      const lat = data.latitude ?? data.coordinates?.[1];
      const lon = data.longitude ?? data.coordinates?.[0];

      if (!vId || !Number.isFinite(lat) || !Number.isFinite(lon)) return;

      setVehiclesState((prev) =>
        prev.map((item) => {
          if (item.vehicle._id === vId) {
            return {
              ...item,
              latitude: lat,
              longitude: lon,
              speed: data.speed ?? item.speed,
              heading: data.heading ?? item.heading,
              ignition: data.ignition ?? item.ignition,
              status: data.status ?? item.status,
              lastPositionAt: data.lastPositionAt || data.timestamp || item.lastPositionAt,
              lastCommunicationAt: data.lastCommunicationAt || new Date().toISOString(),
            };
          }
          return item;
        })
      );

      if (selectedVehicleId && String(vId) === String(selectedVehicleId)) {
        setLivePositions((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.latitude === lat && last.longitude === lon) {
            return prev;
          }
          const newPoint: TrackingPosition = {
            _id: `${Date.now()}-${Math.random()}`,
            vehicle: selectedVehicleId,
            latitude: lat,
            longitude: lon,
            speed: data.speed || 0,
            heading: data.heading || 0,
            ignition: data.ignition || false,
            timestamp: data.lastPositionAt || data.timestamp || new Date().toISOString(),
          };
          return [...prev, newPoint];
        });
      }
    };

    socketService.on("vehicle-state-update", handleUpdate);
    socketService.on("location-update", handleUpdate);

    return () => {
      socketService.off("vehicle-state-update", handleUpdate);
      socketService.off("location-update", handleUpdate);
    };
  }, [selectedVehicleId]);


  const selectedItem = useMemo(() => {
    return vehiclesState.find((item) => item.vehicle._id === selectedVehicleId) || null;
  }, [vehiclesState, selectedVehicleId]);

  useEffect(() => {
    if (!selectedItem) return;
    streetFromPosition(selectedItem.latitude, selectedItem.longitude).then(setCurrentAddress);
  }, [selectedItem?.latitude, selectedItem?.longitude]);

  const handlePresetChange = (preset: PeriodPreset) => {
    setPeriodPreset(preset);
    if (preset === "today") {
      setFromDate(todayDateStr());
      setToDate(todayDateStr());
      setStartTime("00:00");
      setEndTime("23:59");
    }
  };

  const handleSearchRoute = async () => {
    if (!selectedVehicleId) return;
    setSearching(true);
    setError("");
    try {
      const fromISO = dateStartISO(fromDate, startTime);
      const toISO = dateEndISO(toDate, endTime);

      const [route, summary] = await Promise.all([
        trackingService.getRoute(selectedVehicleId, fromISO, toISO),
        trackingService.getSummary(selectedVehicleId, fromISO, toISO),
      ]);

      setRouteData(route);
      setPeriodSummary(summary);
      setIsPlaying(false);
      updateProgress(0);
    } catch {
      setError("Error al consultar el historial del vehículo.");
    } finally {
      setSearching(false);
    }
  };

  const handlePlayToggle = () => {
    if (!routeData || !routeData.points || routeData.points.length < 2) return;
    if (!isPlaying) {
      if (playProgressRef.current >= 0.99) {
        updateProgress(0);
      }
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (!isPlaying || !routeData || !routeData.points || routeData.points.length < 2) return;
    const baseDuration = Math.min(Math.max(routeData.points.length * 150, 5000), 60000);
    const totalMs = baseDuration / playbackSpeed;
    const startedAt = performance.now() - playProgressRef.current * totalMs;
    let frameId = 0;

    const animate = (now: number) => {
      const next = Math.min(1, Math.max(0, (now - startedAt) / totalMs));
      playProgressRef.current = next;
      setPlayProgress(next);

      if (next < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, routeData, playbackSpeed]);


  const animatedPosition = useMemo(() => {
    if (!routeData || !routeData.points || routeData.points.length === 0) return null;
    return interpolatePosition(routeData.points, playProgress);
  }, [routeData, playProgress]);

  const filteredVehicles = useMemo(() => {
    return vehiclesState.filter((item) => {
      const text = `${item.vehicle.plate} ${item.vehicle.alias || ""} ${
        typeof item.vehicle.user === "object" ? item.vehicle.user?.name || "" : ""
      }`.toLowerCase();
      return text.includes(searchQuery.toLowerCase());
    });
  }, [vehiclesState, searchQuery]);

  const generatePdfReport = async () => {
    if (!selectedItem) return;
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const vehicleName =
        typeof selectedItem.vehicle.user === "object"
          ? selectedItem.vehicle.user?.name || "Usuario"
          : "Usuario";
      const plate = selectedItem.vehicle.plate;

      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("Reporte de Ruta Satelital", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Vehículo / Placa: ${vehicleName} (${plate})`, 14, 27);
      doc.text(`Periodo Consultado: ${fromDate} ${startTime} a ${toDate} ${endTime}`, 14, 33);
      doc.text(`Fecha de emisión: ${new Date().toLocaleString("es-EC")}`, 14, 39);

      let currentY = 46;

      const mapCanvas = mapRef.current?.getMap()?.getCanvas();
      if (mapCanvas) {
        try {
          const mapImageBase64 = mapCanvas.toDataURL("image/png");
          doc.setFontSize(12);
          doc.setTextColor(30, 41, 59);
          doc.text("Captura del Mapa y Recorrido de la Ruta:", 14, currentY);
          currentY += 4;
          doc.addImage(mapImageBase64, "PNG", 14, currentY, 182, 85);
          currentY += 92;
        } catch (e) {
          console.warn("No se pudo capturar el mapa:", e);
        }
      }

      if (includeSummary && periodSummary) {
        if (currentY > 230) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text("1. Resumen Ejecutivo del Periodo", 14, currentY);
        currentY += 4;

        autoTable(doc, {
          startY: currentY,
          head: [["Métrica", "Valor"]],
          body: [
            ["Distancia Total", `${periodSummary.distanceKm} km`],
            ["Tiempo Total de Conducción", formatDurationSec(periodSummary.durationTotal)],
            ["Velocidad Promedio", `${periodSummary.averageSpeed} km/h`],
            ["Velocidad Máxima", `${periodSummary.maxSpeed} km/h`],
            ["Total de Paradas", `${periodSummary.stops}`],
            ["Paradas Prolongadas (>10m)", `${periodSummary.prolongedStops}`],
            ["Excesos de Velocidad", `${periodSummary.speedingEvents}`],
          ],
          theme: "striped",
          headStyles: { fillColor: [37, 99, 235] },
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      if (includeStops && routeData && routeData.stops.length > 0) {
        if (currentY > 230) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text("2. Detalle de Paradas Registradas", 14, currentY);
        currentY += 4;

        const stopsTable = routeData.stops.map((s, idx) => [
          idx + 1,
          formatTimeString(s.startedAt),
          s.endedAt ? formatTimeString(s.endedAt) : "En curso",
          s.duration ? formatDurationSec(s.duration) : "N/A",
          `${s.latitude?.toFixed(5)}, ${s.longitude?.toFixed(5)}`,
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [["#", "Hora Llegada", "Hora Salida", "Duración", "Coordenadas"]],
          body: stopsTable,
          theme: "grid",
          headStyles: { fillColor: [217, 119, 6] },
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      if (includeEvents && routeData && routeData.events.length > 0) {
        if (currentY > 230) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text("3. Registro de Eventos Automáticos", 14, currentY);
        currentY += 4;

        const eventsTable = routeData.events.map((e, idx) => [
          idx + 1,
          e.type,
          formatDateStr(e.startedAt),
          e.duration ? formatDurationSec(e.duration) : "--",
          `${e.latitude?.toFixed(4)}, ${e.longitude?.toFixed(4)}`,
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [["#", "Tipo Evento", "Fecha / Hora", "Duración", "Ubicación"]],
          body: eventsTable,
          theme: "striped",
          headStyles: { fillColor: [15, 23, 42] },
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      if (reportComment.trim()) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text("Observaciones u Comentarios:", 14, currentY);
        currentY += 6;
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(reportComment, 14, currentY, { maxWidth: 180 });
      }

      doc.save(`Reporte_Rastreo_${plate}_${fromDate}.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
      setIsReportModalOpen(false);
    }
  };

  const mapPositions = useMemo(() => {
    if (mainTab === "live") return livePositions;
    return routeData?.points || [];
  }, [mainTab, livePositions, routeData]);

  const mapStops = useMemo(() => {
    if (mainTab === "history" && routeData) {
      return routeData.stops || [];
    }
    return [];
  }, [mainTab, routeData]);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* 1. BARRA LATERAL IZQUIERDA: LISTA DE VEHÍCULOS */}
      <aside className="flex w-80 flex-col border-r border-slate-200 bg-white shadow-md z-10 shrink-0">
        <header className="border-b border-slate-200 p-4 bg-white">
          <div className="flex items-center gap-2">
            <Radio className="text-blue-600 animate-pulse" size={22} />
            <h1 className="text-base font-bold text-slate-900 tracking-wide">Rastreo Satelital</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">Monitoreo continuo de flota en tiempo real</p>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar usuario o placa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-slate-50 border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>
        </header>

        {/* Pestañas (En vivo e Historial) */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
          <button
            onClick={() => setMainTab("live")}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 border-b-2 transition ${
              mainTab === "live"
                ? "border-blue-600 bg-white text-blue-600 font-semibold"
                : "border-transparent hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Radio size={14} /> En vivo
          </button>
          <button
            onClick={() => setMainTab("history")}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 border-b-2 transition ${
              mainTab === "history"
                ? "border-blue-600 bg-white text-blue-600 font-semibold"
                : "border-transparent hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Clock3 size={14} /> Historial
          </button>
        </div>

        {/* Lista de Vehículos */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="flex h-32 items-center justify-center gap-2 text-xs text-slate-500">
              <LoaderCircle className="animate-spin" size={18} /> Cargando vehículos...
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No se encontraron vehículos.</div>
          ) : (
            filteredVehicles.map((item) => {
              const isSelected = item.vehicle._id === selectedVehicleId;
              const userName =
                typeof item.vehicle.user === "object"
                  ? item.vehicle.user?.name || "Sin nombre"
                  : "Usuario";

              return (
                <button
                  key={item.vehicle._id}
                  onClick={() => setSelectedVehicleId(item.vehicle._id)}
                  className={`w-full text-left p-3.5 transition flex items-center justify-between ${
                    isSelected
                      ? "bg-blue-50/80 border-l-4 border-blue-600 shadow-sm"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Car size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{userName}</p>
                      <p className="text-[11px] font-medium text-slate-500">
                        {item.vehicle.plate} {item.vehicle.alias ? `· ${item.vehicle.alias}` : ""}
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={item.status} />
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL CENTRAL Y PANEL DERECHO */}
      <main className="relative flex flex-1 overflow-hidden">
        {/* MAPA INTERACTIVO (CENTRO) */}
        <div className="relative h-full flex-1 overflow-hidden min-w-0">
          {/* BANDEROLA DE TELEMETRÍA ULTRA COMPACTA QUE SE AJUSTA AL ANCHO DEL MAPA SIN SOBREPASAR */}
          {selectedItem && (
            <header className="absolute left-3 right-3 top-3 z-10 flex flex-wrap items-center justify-between gap-2.5 rounded-xl bg-white/95 px-3 py-2.5 shadow-md backdrop-blur-md border border-slate-200 text-slate-800 text-xs max-w-full">
              <div className="flex items-center gap-2.5 border-r border-slate-200 pr-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                  <Car size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 leading-tight">
                    {typeof selectedItem.vehicle.user === "object"
                      ? selectedItem.vehicle.user?.name
                      : "Usuario"}
                  </h2>
                  <p className="text-[11px] text-blue-600 font-bold">{selectedItem.vehicle.plate}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Velocidad</span>
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Gauge size={13} className="text-blue-600" /> {selectedItem.speed || 0} km/h
                  </p>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Última Act.</span>
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Clock3 size={13} className="text-amber-600" /> {formatTimeString(selectedItem.lastPositionAt)}
                  </p>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Ignición</span>
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Zap size={13} className={selectedItem.ignition ? "text-emerald-600" : "text-slate-400"} />
                    {selectedItem.ignition ? "Encendido" : "Apagado"}
                  </p>
                </div>

                <div className="max-w-[200px] truncate">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Dirección</span>
                  <p className="text-[11px] font-medium text-slate-700 truncate flex items-center gap-1">
                    <MapPin size={13} className="text-rose-500 shrink-0" /> {currentAddress}
                  </p>
                </div>

                <StatusBadge status={selectedItem.status} />
              </div>
            </header>
          )}

          <TrackingMap
            centerLat={
              mainTab === "history" && animatedPosition
                ? animatedPosition.latitude
                : selectedItem?.latitude
            }
            centerLon={
              mainTab === "history" && animatedPosition
                ? animatedPosition.longitude
                : selectedItem?.longitude
            }
            heading={
              mainTab === "history" && animatedPosition
                ? animatedPosition.heading
                : selectedItem?.heading
            }
            positions={mapPositions}
            stops={mapStops}
            events={routeData?.events || []}
            mapRef={mapRef}
            isPlaying={isPlaying}
          />

        </div>

        {/* 3. PANEL DERECHO DE FILTROS, HISTORIAL Y REPRODUCCIÓN */}
        {mainTab === "history" && (
          <aside className="w-80 flex flex-col border-l border-slate-200 bg-white p-4 shadow-xl overflow-y-auto z-10 shrink-0">
            <header className="border-b border-slate-200 pb-3 mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock3 className="text-blue-600" size={18} /> Consulta de Rutas
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Filtra la ruta por periodo y rango de horas</p>
            </header>

            {/* SELECCIÓN DE PERIODO */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Periodo de consulta</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePresetChange("today")}
                    className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                      periodPreset === "today"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => handlePresetChange("custom")}
                    className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                      periodPreset === "custom"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Personalizado
                  </button>
                </div>
              </div>

              {/* SELECCIÓN DE FECHAS */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Fecha(s)</label>
                <div className="flex flex-col gap-1.5">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Fecha de inicio:</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        if (periodPreset === "today") setPeriodPreset("custom");
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  {periodPreset === "custom" && (
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Fecha de fin:</span>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* SELECCIÓN DE HORARIO ESPECÍFICO */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Horario específico</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Hora Inicio:</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Hora Fin:</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleSearchRoute}
                  disabled={searching}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 p-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-500 disabled:opacity-50"
                >
                  {searching ? <LoaderCircle className="animate-spin" size={16} /> : <Search size={16} />} Buscar ruta
                </button>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 p-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500"
                >
                  <FileText size={16} /> Generar Reporte PDF
                </button>
              </div>
            </div>

            {/* DETALLE Y REPRODUCCIÓN DE RUTA */}
            {routeData && (
              <div className="mt-5 border-t border-slate-200 pt-3 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Resumen de la Ruta</h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Distancia</span>
                    <span className="font-bold text-slate-900 text-xs">{routeData.distanceKm} km</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Duración</span>
                    <span className="font-bold text-slate-900 text-xs">{formatDurationSec(routeData.duration)}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Paradas</span>
                    <span className="font-bold text-amber-600 text-xs">{routeData.stops.length}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Vel. Máx</span>
                    <span className="font-bold text-rose-600 text-xs">{routeData.maxSpeed} km/h</span>
                  </div>
                </div>

                {/* CONTROLES DE REPRODUCCIÓN */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Reproducción</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 4].map((s) => (
                        <button
                          key={s}
                          onClick={() => setPlaybackSpeed(s)}
                          className={`px-1.5 py-0.5 text-[11px] font-bold rounded ${
                            playbackSpeed === s ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {s}×
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.001}
                      value={playProgress}
                      onChange={(e) => {
                        setIsPlaying(false);
                        updateProgress(parseFloat(e.target.value));
                      }}
                      className="h-1.5 flex-1 accent-blue-600 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="text-xs font-bold text-blue-600">{Math.round(playProgress * 100)}%</span>
                  </div>

                  <button
                    onClick={handlePlayToggle}
                    disabled={!routeData.points || routeData.points.length < 2}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 p-2 text-xs font-bold text-white hover:bg-blue-500 shadow-sm disabled:opacity-50"
                  >

                    {isPlaying ? <Pause size={14} /> : <Play size={14} />} {isPlaying ? "Pausar" : "Reproducir Ruta"}
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </main>

      {/* MODAL BLANCO DE REPORTE PDF */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-800">
            <header className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-emerald-600" size={20} />
                <h3 className="text-base font-bold text-slate-900">Generar Reporte de Ruta</h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </header>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="text-slate-600 font-medium">Formato de salida</label>
                <input
                  type="text"
                  disabled
                  value="PDF (Documento Portable con Captura de Mapa)"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-700 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium mb-2 block">Secciones a Incluir</label>
                <div className="space-y-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-800">
                    <input
                      type="checkbox"
                      checked={includeSummary}
                      onChange={(e) => setIncludeSummary(e.target.checked)}
                      className="rounded accent-emerald-600"
                    />
                    Resumen ejecutivo de la ruta
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-800">
                    <input
                      type="checkbox"
                      checked={includeEvents}
                      onChange={(e) => setIncludeEvents(e.target.checked)}
                      className="rounded accent-emerald-600"
                    />
                    Registro de eventos detectados
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-800">
                    <input
                      type="checkbox"
                      checked={includeStops}
                      onChange={(e) => setIncludeStops(e.target.checked)}
                      className="rounded accent-emerald-600"
                    />
                    Detalle de paradas registradas
                  </label>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-medium">Comentarios u Observaciones (opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Escribe un comentario..."
                  value={reportComment}
                  onChange={(e) => setReportComment(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <footer className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                onClick={generatePdfReport}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 shadow-md"
              >
                {isGeneratingPdf ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <Download size={16} />
                )}
                Descargar Reporte PDF
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
