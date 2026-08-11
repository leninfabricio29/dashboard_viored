import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import Map, { Layer, Marker, NavigationControl, Source, type MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Clock3, FileText, Gauge, MapPin, Navigation, Play, Route, Search, Battery, Eye, LoaderCircle, Download, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import trackingService, { type Position, type Stop, type TrackingReport, type Trip, type Vehicle } from "../../../services/tracking-service";

type Tab = "live" | "history" | "reports";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

// Ruta de la imagen usada para representar el vehículo en el mapa.
// Colócala en /public (o ajusta la ruta) para que se sirva como asset estático.
const VEHICLE_MARKER_ICON = "https://png.pngtree.com/png-clipart/20240811/original/pngtree-car-top-view-drawing-photos-png-image_15751161.png";

const DEFAULT_CENTER = { longitude: -79.675, latitude: -3.683 };
const today = () => new Date().toISOString().slice(0, 10);
const dateStart = (date: string) => `${date}T00:00:00`;
const dateEnd = (date: string) => `${date}T23:59:59.999`;
const formatDate = (date?: string | null) => date ? new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date)) : "En curso";
const duration = (seconds: number) => { const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); return h ? `${h} h ${m} min` : `${m} min`; };
const distance = (meters: number) => `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`;
const coord = (point?: { latitude: number; longitude: number }) => point ? `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}` : "Sin ubicación";
const addressCache = new globalThis.Map<string, string>();

// Cola que serializa las llamadas a Nominatim, respetando su límite de 1 req/seg
let nominatimQueue: Promise<unknown> = Promise.resolve();
function throttledNominatimFetch(url: string): Promise<Response> {
  const run = nominatimQueue.then(async () => {
    const response = await fetch(url, {
      headers: { "Accept-Language": "es" },
    });
    await new Promise((resolve) => setTimeout(resolve, 1100)); // pausa antes de liberar el siguiente
    return response;
  });
  nominatimQueue = run.catch(() => {}); // evita que un error rompa la cola
  return run;
}

async function streetFromPosition(position?: Position) {
  if (!position) return "Sin ubicación";
  const key = `${position.longitude.toFixed(5)},${position.latitude.toFixed(5)}`;
  if (addressCache.has(key)) return addressCache.get(key)!;
  try {
    const query = new URLSearchParams({
      format: "jsonv2",
      lat: String(position.latitude),
      lon: String(position.longitude),
      zoom: "18",
      addressdetails: "0",
      email: "soporte@viryx.net",
    });
    const response = await throttledNominatimFetch(`https://nominatim.openstreetmap.org/reverse?${query}`);
    const data = (await response.json()) as { display_name?: string; error?: string };
    const address = data.display_name ?? coord(position);
    addressCache.set(key, address);
    return address;
  } catch {
    return coord(position);
  }
}

function TrackingMap({ position, positions = [], stops = [], mapRef, onLoad }: { position?: Position | null; positions?: Position[]; stops?: Stop[]; mapRef?: MutableRefObject<MapRef | null>; onLoad?: () => void }) {
  const center = position ? { longitude: position.longitude, latitude: position.latitude } : positions[0] ? { longitude: positions[0].longitude, latitude: positions[0].latitude } : DEFAULT_CENTER;
  const route = useMemo(() => ({ type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: positions.map((item) => [item.longitude, item.latitude]) } }), [positions]);
  if (!MAPBOX_TOKEN) return <div className="flex h-full items-center justify-center rounded-xl bg-amber-50 p-6 text-center text-sm text-amber-800">Configura <code>VITE_MAPBOX_TOKEN</code> para visualizar el mapa.</div>;
  return <Map key={`${positions[0]?.longitude ?? center.longitude}-${positions[0]?.latitude ?? center.latitude}`} ref={mapRef} preserveDrawingBuffer onLoad={onLoad} initialViewState={{ ...center, zoom: 15 }} mapboxAccessToken={MAPBOX_TOKEN} mapStyle="mapbox://styles/mapbox/streets-v12" style={{ width: "100%", height: "100%" }}>
    <NavigationControl position="top-right" />
    {positions.length > 1 && <Source id="track-route" type="geojson" data={route}><Layer id="track-line" type="line" paint={{ "line-color": "#2563eb", "line-width": 5, "line-opacity": 0.8 }} /></Source>}
    {stops.map((stop) => <Marker key={stop._id} longitude={stop.longitude} latitude={stop.latitude} anchor="bottom"><div title={`Parada: ${duration(stop.duration)}`} className="rounded-full border-2 border-white bg-amber-500 p-1 text-white shadow"><Clock3 size={14} /></div></Marker>)}
    {position && (
      <Marker longitude={position.longitude} latitude={position.latitude} anchor="center">
        <img
          src={VEHICLE_MARKER_ICON}
          alt="Vehículo"
          draggable={false}
          style={{
            width: 52,
            height: 52,
            transform: `rotate(${position.heading ?? 0}deg)`,
            transformOrigin: "center center",
            filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35))",
            pointerEvents: "none",
          }}
        />
      </Marker>
    )}
  </Map>;
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Gauge }) { return <div className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-center gap-2 text-xs text-slate-500"><Icon size={15} />{label}</div><p className="mt-1 text-base font-semibold text-slate-800">{value}</p></div>; }

function interpolatePosition(points: Position[], progress: number): Position | null {
  if (!points.length) return null;
  const step = Math.min(points.length - 1, progress * (points.length - 1));
  const index = Math.floor(step); const next = points[Math.min(index + 1, points.length - 1)]; const current = points[index]; const ratio = step - index;
  return { ...current, latitude: current.latitude + (next.latitude - current.latitude) * ratio, longitude: current.longitude + (next.longitude - current.longitude) * ratio, heading: current.heading ?? next.heading };
}

function RouteModal({
  trip,
  positions,
  stops,
  street,
  playing,
  progress,
  speed,
  setSpeed,
  onClose,
  onPlay,
}: {
  trip: Trip | null;
  positions: Position[];
  stops: Stop[];
  street: string;
  playing: boolean;
  progress: number;
  speed: number;
  setSpeed: (value: number) => void;
  onClose: () => void;
  onPlay: () => void;
}) {
  if (!trip) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4">
      <section className="flex h-[min(88vh,780px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-900">
              Ruta del {formatDate(trip.startTime)}
            </h3>

            <p className="mt-1 max-w-3xl text-xs text-slate-500">
              {street || "Buscando calles de la ruta…"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 bg-slate-100">
          <TrackingMap
            position={interpolatePosition(positions, progress)}
            positions={positions}
            stops={stops}
          />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
          <span className="text-sm text-slate-600">
            {distance(trip.distance)} · {duration(trip.duration)} ·{" "}
            {Math.round(progress * 100)}%
          </span>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Velocidad</span>
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 text-xs rounded ${speed === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
              >
                {s}×
              </button>
            ))}
          </div>

          <button
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={onPlay}
            disabled={positions.length < 2}
          >
            {playing ? (
              <>
                <Clock3 size={16} />
                Pausar
              </>
            ) : (
              <>
                <Play size={16} />
                Reproducir ruta
              </>
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default function SatellitScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [tab, setTab] = useState<Tab>("live");
  const [latest, setLatest] = useState<Position | null>(null);
  const [livePositions, setLivePositions] = useState<Position[]>([]);
  const [liveReport, setLiveReport] = useState<TrackingReport | null>(null);
  const [from, setFrom] = useState(today()); const [to, setTo] = useState(today());
  const [history, setHistory] = useState<TrackingReport | null>(null);
  const [report, setReport] = useState<TrackingReport | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripPositions, setTripPositions] = useState<Position[]>([]);
  const [tripStreet, setTripStreet] = useState("");
  const [playing, setPlaying] = useState(false); const [playProgress, setPlayProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [reportPositions, setReportPositions] = useState<Position[]>([]);
  const [reportMapReady, setReportMapReady] = useState(false);
  const reportMapRef = useRef<MapRef | null>(null);
  const [loading, setLoading] = useState(true); const [searching, setSearching] = useState(false); const [error, setError] = useState("");

  useEffect(() => { trackingService.getVehicles(true).then((data) => { setVehicles(data); setSelected(data[0] ?? null); }).catch(() => setError("No se pudo cargar la flota.")).finally(() => setLoading(false)); }, []);
  const loadLive = useCallback(async () => {
    if (!selected) return;
    try {
      const [position, currentReport, positions] = await Promise.all([
        trackingService.getLatestPosition(selected._id),
        trackingService.getReport(selected._id, dateStart(today()), new Date().toISOString()),
        trackingService.getPositions(selected._id, dateStart(today())),
      ]);
      setLatest(position); setLiveReport(currentReport); setLivePositions(positions); setError("");
    }
    catch { setError("No se pudo actualizar la posición del vehículo."); }
  }, [selected]);
  useEffect(() => { if (tab !== "live" || !selected) return; void loadLive(); const id = window.setInterval(() => void loadLive(), 3000); return () => window.clearInterval(id); }, [tab, selected, loadLive]);
  const searchHistory = async () => { if (!selected) return; setSearching(true); try { setHistory(await trackingService.getReport(selected._id, dateStart(from), dateEnd(to))); setSelectedTrip(null); setTripPositions([]); setTripStreet(""); setPlaying(false); } catch { setError("No se pudo consultar el historial."); } finally { setSearching(false); } };
  const viewTrip = async (trip: Trip) => { if (!selected) return; setSelectedTrip(trip); setPlaying(false); setPlayProgress(0); setSearching(true); try { const positions = await trackingService.getPositions(selected._id, trip.startTime, trip.endTime ?? new Date().toISOString()); setTripPositions(positions); const [start, end] = await Promise.all([streetFromPosition(positions[0]), streetFromPosition(positions[positions.length - 1])]); setTripStreet(`${start} → ${end}`); } catch { setError("No se pudo cargar la ruta del viaje."); } finally { setSearching(false); } };
  const loadReport = async () => { if (!selected) return; setSearching(true); setReportMapReady(false); try { const [nextReport, positions] = await Promise.all([trackingService.getReport(selected._id, dateStart(from), dateEnd(to)), trackingService.getPositions(selected._id, dateStart(from), dateEnd(to))]); setReport(nextReport); setReportPositions(positions); } catch { setError("No se pudo generar el reporte."); } finally { setSearching(false); } };
  useEffect(() => {
    if (!playing || tripPositions.length < 2) return;
    const baseDuration = Math.min(Math.max(tripPositions.length * 110, 8000), 60000);
    const totalMs = baseDuration / speed; // mayor velocidad => menor duración
    const startedAt = performance.now() - playProgress * totalMs;
    let frame = 0;
    const animate = (now: number) => {
      const next = Math.min(1, (now - startedAt) / totalMs);
      setPlayProgress(next);
      if (next < 1) frame = requestAnimationFrame(animate);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [playing, tripPositions.length, playProgress, speed]);
  const togglePlayback = () => { if (playing) { setPlaying(false); return; } if (playProgress >= 1) setPlayProgress(0); setPlaying(true); };
  const [exportingPdf, setExportingPdf] = useState(false);

  const exportReportPdf = async () => {
    if (!report || !selected) return;
    setExportingPdf(true);
    try {
      // 1. Resolver direcciones (calles) de origen y destino para cada viaje
      const tripLocations = await Promise.all(
        report.trips.map(async (trip) => {
          const startAddr = trip.startLocation
            ? await streetFromPosition({ latitude: trip.startLocation.latitude, longitude: trip.startLocation.longitude } as Position)
            : "Sin ubicación inicial";
          const endAddr = trip.endLocation
            ? await streetFromPosition({ latitude: trip.endLocation.latitude, longitude: trip.endLocation.longitude } as Position)
            : "Sin ubicación final";
          return { startAddr, endAddr };
        })
      );

      // 2. Resolver direcciones para las paradas
      const stopLocations = await Promise.all(
        report.stops.map(async (stop) => {
          return await streetFromPosition({ latitude: stop.latitude, longitude: stop.longitude } as Position);
        })
      );

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 36; // 36pt

      // ----- PÁGINA 1: ENCABEZADO Y RESUMEN TÉCNICO EN MAPA -----
      // Header Banner estilo corporativo
      doc.setFillColor(15, 23, 42); // Slate 900 #0F172A
      doc.rect(0, 0, pageWidth, 60, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text("INFORME TÉCNICO DE TELEMETRÍA Y RASTREO SATELITAL", margin, 36);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`OFICIAL · GENERADO: ${new Date().toLocaleDateString("es-EC")} ${new Date().toLocaleTimeString("es-EC")}`, pageWidth - margin - 220, 36);

      let yPos = 80;

      // Ficha Técnica del Vehículo & Dispositivo
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 70, 6, 6, "FD");

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59); // Slate 800
      doc.text("FICHA TÉCNICA DEL VEHÍCULO Y DISPOSITIVO GPS", margin + 12, yPos + 20);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);

      const vLine1 = `Vehículo: ${selected.alias || selected.plate} | Placa: ${selected.plate} | Marca/Modelo: ${selected.brand || "N/A"} ${selected.model || ""}`;
      const vLine2 = `Dispositivo GPS: ${selected.gpsDevice?.imei || "Auto-GPS"} (${selected.gpsDevice?.model || "Standard"}) | Estado: ${selected.active ? "Activo" : "Inactivo"}`;
      const vLine3 = `Rango del Reporte: Desde ${from} 00:00:00 Hasta ${to} 23:59:59`;

      doc.text(vLine1, margin + 12, yPos + 36);
      doc.text(vLine2, margin + 12, yPos + 48);
      doc.text(vLine3, margin + 12, yPos + 60);

      yPos += 85;

      // Resumen Ejecutivo de Métricas (KPIs)
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("RESUMEN OPERATIVO DE CONDUCCIÓN Y TELEMETRÍA", margin, yPos);

      yPos += 10;

      const maxSpeedCalc = report.trips.reduce((max, t) => Math.max(max, t.maxSpeed || 0), 0);

      autoTable(doc, {
        startY: yPos,
        margin: { left: margin, right: margin },
        head: [["Viajes Total", "Distancia Total", "Tiempo Conducción", "Tiempo Detenido", "Velocidad Promed.", "Velocidad Máx."]],
        body: [[
          String(report.summary.trips),
          distance(report.summary.distanceMeters),
          duration(report.summary.drivingSeconds),
          duration(report.summary.stopSeconds),
          `${report.summary.averageSpeed} km/h`,
          `${maxSpeedCalc} km/h`
        ]],
        styles: { fontSize: 9, halign: "center", cellPadding: 8, font: "helvetica" },
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold" },
        bodyStyles: { fillColor: [255, 255, 255], textColor: [15, 23, 42] },
        theme: "grid"
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Mapa de la ruta
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("MAPA DE RECORRIDO Y TRAYECTORIA", margin, yPos);

      yPos += 10;
      const mapCanvas = reportMapReady ? reportMapRef.current?.getCanvas().toDataURL("image/png") : undefined;

      if (mapCanvas) {
        doc.addImage(mapCanvas, "PNG", margin, yPos, pageWidth - margin * 2, 260);
      } else {
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, yPos, pageWidth - margin * 2, 100, "F");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text("Captura de mapa no disponible al momento del reporte.", margin + 15, yPos + 55);
      }

      // ----- PÁGINA 2: HISTORIAL DE VIAJES (CON ORIGEN Y DESTINO DETALLADO) -----
      doc.addPage();

      // Header de página secundaria
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DETALLE TÉCNICO DE VIAJES · PUNTO DE PARTIDA Y DESTINO", margin, 26);

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Historial detallado de trayectos registrados (${report.trips.length} viajes)`, margin, 56);

      autoTable(doc, {
        startY: 66,
        margin: { left: margin, right: margin },
        head: [["#", "Punto de Partida (Origen)", "Punto de Destino (Llegada)", "Hora Inicio", "Hora Fin", "Distancia", "Duración", "Vel. Prom / Máx"]],
        body: report.trips.map((trip, idx) => [
          String(idx + 1),
          `${tripLocations[idx]?.startAddr || "N/A"}\n(${coord(trip.startLocation)})`,
          `${tripLocations[idx]?.endAddr || "N/A"}\n(${coord(trip.endLocation)})`,
          formatDate(trip.startTime),
          formatDate(trip.endTime),
          distance(trip.distance),
          duration(trip.duration),
          `${trip.averageSpeed || 0} / ${trip.maxSpeed || 0} km/h`
        ]),
        styles: { fontSize: 8, cellPadding: 6, font: "helvetica", overflow: "linebreak" },
        columnStyles: {
          0: { cellWidth: 20, halign: "center" },
          1: { cellWidth: 125 },
          2: { cellWidth: 125 },
          3: { cellWidth: 70 },
          4: { cellWidth: 70 },
          5: { cellWidth: 50, halign: "right" },
          6: { cellWidth: 45, halign: "right" },
          7: { cellWidth: 55, halign: "center" }
        },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        theme: "striped"
      });

      // ----- PÁGINA 3: DETALLE TÉCNICO DE PARADAS -----
      doc.addPage();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DETALLE TÉCNICO DE PARADAS Y DETENCIONES", margin, 26);

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Registro completo de detenciones del vehículo (${report.stops.length} paradas)`, margin, 56);

      autoTable(doc, {
        startY: 66,
        margin: { left: margin, right: margin },
        head: [["#", "Ubicación (Calle & Coordenadas GPS)", "Llegada (Inicio Parada)", "Salida (Reinicio Marcha)", "Duración Detenido"]],
        body: report.stops.map((stop, idx) => [
          String(idx + 1),
          `${stopLocations[idx] || "N/A"}\n(${coord(stop)})`,
          formatDate(stop.arrivalTime),
          formatDate(stop.departureTime),
          duration(stop.duration)
        ]),
        styles: { fontSize: 8, cellPadding: 6, font: "helvetica", overflow: "linebreak" },
        columnStyles: {
          0: { cellWidth: 25, halign: "center" },
          1: { cellWidth: 210 },
          2: { cellWidth: 100 },
          3: { cellWidth: 100 },
          4: { cellWidth: 85, halign: "right" }
        },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        theme: "striped"
      });

      // Numeral de páginas en el pie de página
      const totalPages = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 50, pageHeight - 15);
        doc.text(`Vehículo: ${selected.plate} · Informe de Telemetría Oficial`, margin, pageHeight - 15);
      }

      doc.save(`reporte-tecnico-rastreo-${selected.plate}-${from}-${to}.pdf`);
    } catch (err) {
      console.error("Error al generar PDF técnico:", err);
      setError("No se pudo generar el reporte PDF.");
    } finally {
      setExportingPdf(false);
    }
  };
  const currentTrip = liveReport?.trips.find((item) => item.status === "running");
  const tabs: Array<{ id: Tab; label: string; icon: typeof Navigation }> = [{ id: "live", label: "Rastreo en vivo", icon: Navigation }, { id: "history", label: "Historial de rutas", icon: Route }, { id: "reports", label: "Reportes", icon: FileText }];

  return <div className="flex min-h-[calc(100vh-7rem)] gap-4 bg-slate-50 p-4 lg:p-6">
    <aside className="w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-4 flex items-center gap-2"><Navigation className="text-blue-600" /><div><h1 className="font-semibold text-slate-900">Rastreo satelital</h1><p className="text-xs text-slate-500">{vehicles.length} vehículo(s) activo(s)</p></div></div><div className="space-y-2">{loading && <p className="p-3 text-sm text-slate-500">Cargando flota…</p>}{vehicles.map((vehicle) => <button key={vehicle._id} onClick={() => setSelected(vehicle)} className={`w-full rounded-xl border p-3 text-left transition ${selected?._id === vehicle._id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}><div className="flex justify-between gap-2"><span className="font-medium text-slate-800">{vehicle.alias || vehicle.plate}</span><span className={`h-2 w-2 rounded-full ${vehicle.gpsDevice?.lastConnection ? "bg-emerald-500" : "bg-slate-300"}`} /></div><p className="mt-1 text-xs text-slate-500">{vehicle.plate} · {vehicle.brand} {vehicle.model}</p></button>)}{!loading && !vehicles.length && <p className="p-3 text-sm text-slate-500">No hay vehículos activos asociados.</p>}</div></aside>
    <main className="min-w-0 flex-1">{!selected ? <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 text-slate-500">Selecciona un vehículo para comenzar el rastreo.</div> : <>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">{selected.alias || selected.plate}</h2><p className="text-sm text-slate-500">{selected.plate} · {selected.brand} {selected.model}</p></div><div className="flex rounded-lg bg-slate-100 p-1">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${tab === id ? "bg-white font-medium text-blue-700 shadow-sm" : "text-slate-600"}`}><Icon size={16} />{label}</button>)}</div></div></div>
      {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {tab === "live" && <div className="grid min-h-[620px] grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="h-[620px]"><TrackingMap position={latest} positions={livePositions} /></div></section><section className="space-y-3"><div className="rounded-2xl bg-slate-900 p-4 text-white"><p className="text-sm text-slate-300">Estado actual</p><p className="mt-1 text-xl font-semibold">{latest ? (currentTrip && (latest.ignition || latest.speed > 3) ? "En movimiento" : "Detenido") : "Sin señal GPS"}</p><p className="mt-3 text-xs text-slate-300">Actualización: {formatDate(latest?.gpsTime)}</p></div><div className="grid grid-cols-2 gap-3"><Stat label="Velocidad" value={latest ? `${currentTrip ? Math.round(latest.speed) : 0} km/h` : "—"} icon={Gauge} /><Stat label="Batería GPS" value="No disponible" icon={Battery} /><Stat label="GPS" value={latest ? `${latest.latitude.toFixed(5)}, ${latest.longitude.toFixed(5)}` : "—"} icon={MapPin} /><Stat label="Rumbo" value={latest?.heading !== undefined ? `${Math.round(latest.heading)}°` : "—"} icon={Navigation} /></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="font-medium text-slate-800">Resumen del viaje</h3>{currentTrip ? <div className="mt-3 space-y-2 text-sm text-slate-600"><p><b>Inicio:</b> {formatDate(currentTrip.startTime)}</p><p><b>Distancia:</b> {distance(currentTrip.distance)}</p><p><b>Duración:</b> {duration(currentTrip.duration)}</p><p><b>Velocidad media:</b> {currentTrip.averageSpeed} km/h</p></div> : <p className="mt-2 text-sm text-slate-500">No hay un viaje en curso.</p>}</div></section></div>}
      {tab === "history" && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><Filters from={from} to={to} setFrom={setFrom} setTo={setTo} onSearch={searchHistory} loading={searching} label="Buscar rutas" /><div className="mt-4 overflow-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Ver</th><th className="p-3">Fecha / ruta</th><th className="p-3">Distancia</th><th className="p-3">Duración</th><th className="p-3">Paradas</th></tr></thead><tbody>{history?.trips.map((trip) => <tr key={trip._id} className="border-t border-slate-100"><td className="p-3"><button onClick={() => void viewTrip(trip)} className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50" title="Ver ruta"><Eye size={17} /></button></td><td className="p-3"><p>{formatDate(trip.startTime)}</p><p className="mt-1 max-w-80 truncate text-xs text-slate-500">{coord(trip.startLocation)} → {coord(trip.endLocation)}</p></td><td className="p-3">{distance(trip.distance)}</td><td className="p-3">{duration(trip.duration)}</td><td className="p-3">{history.stops.filter((stop) => stop.trip === trip._id).length}</td></tr>)}{history && !history.trips.length && <tr><td className="p-5 text-slate-500" colSpan={5}>No hay viajes en el rango seleccionado.</td></tr>}{!history && <tr><td className="p-5 text-slate-500" colSpan={5}>Selecciona un rango de fechas y consulta las rutas.</td></tr>}</tbody></table></div></section>}
      <RouteModal trip={selectedTrip} positions={tripPositions} stops={history?.stops.filter((stop) => stop.trip === selectedTrip?._id) ?? []} street={tripStreet} playing={playing} progress={playProgress} speed={speed} setSpeed={setSpeed} onPlay={togglePlayback} onClose={() => { setPlaying(false); setSelectedTrip(null); }} />
      {tab === "reports" && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Filters from={from} to={to} setFrom={setFrom} setTo={setTo} onSearch={loadReport} loading={searching} label="Generar reporte completo" />
        <p className="mt-2 text-xs text-slate-500">Incluye resumen, viajes, paradas y la ruta pintada del período.</p>
        {report && <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-5"><Stat label="Viajes" value={String(report.summary.trips)} icon={Route} /><Stat label="Distancia" value={distance(report.summary.distanceMeters)} icon={Navigation} /><Stat label="Conducción" value={duration(report.summary.drivingSeconds)} icon={Clock3} /><Stat label="Paradas" value={String(report.summary.stops)} icon={MapPin} /><Stat label="Vel. promedio" value={`${report.summary.averageSpeed} km/h`} icon={Gauge} /></div><button onClick={() => void exportReportPdf()} disabled={!reportMapReady || exportingPdf} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{exportingPdf ? <><LoaderCircle size={16} className="animate-spin" />Generando PDF…</> : <><Download size={16} />{reportMapReady ? "Descargar PDF" : "Preparando mapa…"}</>}</button></div>
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200"><div className="h-80"><TrackingMap position={reportPositions[reportPositions.length - 1] ?? null} positions={reportPositions} stops={report.stops} mapRef={reportMapRef} onLoad={() => setReportMapReady(true)} /></div></div>
          
          <h3 className="mt-6 font-semibold text-slate-800">Detalle de viajes (Origen y Destino)</h3>
          <div className="mt-2 overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Punto Partida (Origen)</th>
                  <th className="p-3">Punto Destino (Llegada)</th>
                  <th className="p-3">Inicio / Fin</th>
                  <th className="p-3">Distancia</th>
                  <th className="p-3">Duración</th>
                  <th className="p-3">Vel. Prom / Máx</th>
                </tr>
              </thead>
              <tbody>
                {report.trips.map((trip, idx) => (
                  <tr key={trip._id} className="border-t border-slate-100">
                    <td className="p-3 font-medium text-slate-500">#{idx + 1}</td>
                    <td className="p-3 text-xs text-slate-700">{coord(trip.startLocation)}</td>
                    <td className="p-3 text-xs text-slate-700">{coord(trip.endLocation)}</td>
                    <td className="p-3 text-xs">{formatDate(trip.startTime)}<br/><span className="text-slate-400">{formatDate(trip.endTime)}</span></td>
                    <td className="p-3">{distance(trip.distance)}</td>
                    <td className="p-3">{duration(trip.duration)}</td>
                    <td className="p-3 text-xs">{trip.averageSpeed || 0} / {trip.maxSpeed || 0} km/h</td>
                  </tr>
                ))}
                {!report.trips.length && (
                  <tr>
                    <td className="p-4 text-slate-500" colSpan={7}>No se registraron viajes en el período.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h3 className="mt-6 font-semibold text-slate-800">Detalle de paradas</h3><div className="mt-2 overflow-auto rounded-xl border border-slate-200"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Llegada</th><th className="p-3">Salida</th><th className="p-3">Duración</th><th className="p-3">Ubicación GPS</th></tr></thead><tbody>{report.stops.map((stop) => <tr key={stop._id} className="border-t border-slate-100"><td className="p-3">{formatDate(stop.arrivalTime)}</td><td className="p-3">{formatDate(stop.departureTime)}</td><td className="p-3">{duration(stop.duration)}</td><td className="p-3">{coord(stop)}</td></tr>)}{!report.stops.length && <tr><td className="p-4 text-slate-500" colSpan={4}>No se registraron paradas.</td></tr>}</tbody></table></div>
        </div>}
      </section>}
    </>}</main></div>;
}

function Filters({ from, to, setFrom, setTo, onSearch, loading, label }: { from: string; to: string; setFrom: (value: string) => void; setTo: (value: string) => void; onSearch: () => void; loading: boolean; label: string }) { return <div className="flex flex-wrap items-end gap-3"><label className="text-sm text-slate-600">Desde<input value={from} onChange={(event) => setFrom(event.target.value)} type="date" className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-slate-800" /></label><label className="text-sm text-slate-600">Hasta<input value={to} onChange={(event) => setTo(event.target.value)} type="date" min={from} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-slate-800" /></label><button disabled={loading} onClick={onSearch} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={16} /> : <Search size={16} />}{label}</button></div>; }
