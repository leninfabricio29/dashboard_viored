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

async function streetFromPosition(position?: Position) {
  if (!position) return "Sin ubicación";
  const key = `${position.longitude.toFixed(5)},${position.latitude.toFixed(5)}`;
  if (addressCache.has(key)) return addressCache.get(key)!;
  if (!MAPBOX_TOKEN) return coord(position);
  try {
    const query = new URLSearchParams({ longitude: String(position.longitude), latitude: String(position.latitude), access_token: MAPBOX_TOKEN });
    const response = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?${query}`);
    const data = await response.json() as { features?: Array<{ properties?: { full_address?: string; name_preferred?: string }; place_formatted?: string; text?: string }> };
    const feature = data.features?.[0];
    const address = feature?.properties?.full_address ?? feature?.place_formatted ?? feature?.properties?.name_preferred ?? feature?.text ?? coord(position);
    addressCache.set(key, address);
    return address;
  } catch { return coord(position); }
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
  const exportReportPdf = () => {
    if (!report || !selected) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(18); doc.text("Reporte de rastreo satelital", 40, 42);
    doc.setFontSize(10); doc.text(`${selected.alias || selected.plate} · Período: ${from} al ${to}`, 40, 62);
    doc.setFontSize(11); doc.text(`Viajes: ${report.summary.trips}   Distancia: ${distance(report.summary.distanceMeters)}   Conducción: ${duration(report.summary.drivingSeconds)}   Paradas: ${report.summary.stops}   Velocidad media: ${report.summary.averageSpeed} km/h`, 40, 86, { maxWidth: 510 });
    const image = reportMapReady ? reportMapRef.current?.getCanvas().toDataURL("image/png") : undefined;
    if (image) doc.addImage(image, "PNG", 40, 108, 515, 260); else doc.text("Mapa no disponible al momento de generar el documento.", 40, 125);
    doc.addPage(); doc.setFontSize(14); doc.text("Viajes", 40, 38);
    autoTable(doc, { startY: 50, head: [["Inicio", "Fin", "Distancia", "Duración", "Paradas"]], body: report.trips.map((trip) => [formatDate(trip.startTime), formatDate(trip.endTime), distance(trip.distance), duration(trip.duration), String(report.stops.filter((stop) => stop.trip === trip._id).length)]), styles: { fontSize: 8 }, headStyles: { fillColor: [37, 99, 235] } });
    doc.addPage(); doc.setFontSize(14); doc.text("Detalle de paradas", 40, 38);
    autoTable(doc, { startY: 50, head: [["Llegada", "Salida", "Duración", "Coordenadas"]], body: report.stops.map((stop) => [formatDate(stop.arrivalTime), formatDate(stop.departureTime), duration(stop.duration), coord(stop)]), styles: { fontSize: 8 }, headStyles: { fillColor: [37, 99, 235] } });
    doc.save(`reporte-rastreo-${selected.plate}-${from}-${to}.pdf`);
  };
  const currentTrip = liveReport?.trips.find((item) => item.status === "running");
  const tabs: Array<{ id: Tab; label: string; icon: typeof Navigation }> = [{ id: "live", label: "Rastreo en vivo", icon: Navigation }, { id: "history", label: "Historial de rutas", icon: Route }, { id: "reports", label: "Reportes", icon: FileText }];

  return <div className="flex min-h-[calc(100vh-7rem)] gap-4 bg-slate-50 p-4 lg:p-6">
    <aside className="w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-4 flex items-center gap-2"><Navigation className="text-blue-600" /><div><h1 className="font-semibold text-slate-900">Rastreo satelital</h1><p className="text-xs text-slate-500">{vehicles.length} vehículo(s) activo(s)</p></div></div><div className="space-y-2">{loading && <p className="p-3 text-sm text-slate-500">Cargando flota…</p>}{vehicles.map((vehicle) => <button key={vehicle._id} onClick={() => setSelected(vehicle)} className={`w-full rounded-xl border p-3 text-left transition ${selected?._id === vehicle._id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}><div className="flex justify-between gap-2"><span className="font-medium text-slate-800">{vehicle.alias || vehicle.plate}</span><span className={`h-2 w-2 rounded-full ${vehicle.gpsDevice?.lastConnection ? "bg-emerald-500" : "bg-slate-300"}`} /></div><p className="mt-1 text-xs text-slate-500">{vehicle.plate} · {vehicle.brand} {vehicle.model}</p></button>)}{!loading && !vehicles.length && <p className="p-3 text-sm text-slate-500">No hay vehículos activos asociados.</p>}</div></aside>
    <main className="min-w-0 flex-1">{!selected ? <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 text-slate-500">Selecciona un vehículo para comenzar el rastreo.</div> : <>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">{selected.alias || selected.plate}</h2><p className="text-sm text-slate-500">{selected.plate} · {selected.brand} {selected.model}</p></div><div className="flex rounded-lg bg-slate-100 p-1">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${tab === id ? "bg-white font-medium text-blue-700 shadow-sm" : "text-slate-600"}`}><Icon size={16} />{label}</button>)}</div></div></div>
      {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {tab === "live" && <div className="grid min-h-[620px] grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="h-[620px]"><TrackingMap position={latest} positions={livePositions} /></div></section><section className="space-y-3"><div className="rounded-2xl bg-slate-900 p-4 text-white"><p className="text-sm text-slate-300">Estado actual</p><p className="mt-1 text-xl font-semibold">{latest ? (latest.ignition || latest.speed > 3 ? "En movimiento" : "Detenido") : "Sin señal GPS"}</p><p className="mt-3 text-xs text-slate-300">Actualización: {formatDate(latest?.gpsTime)}</p></div><div className="grid grid-cols-2 gap-3"><Stat label="Velocidad" value={latest ? `${Math.round(latest.speed)} km/h` : "—"} icon={Gauge} /><Stat label="Batería GPS" value="No disponible" icon={Battery} /><Stat label="GPS" value={latest ? `${latest.latitude.toFixed(5)}, ${latest.longitude.toFixed(5)}` : "—"} icon={MapPin} /><Stat label="Rumbo" value={latest?.heading !== undefined ? `${Math.round(latest.heading)}°` : "—"} icon={Navigation} /></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="font-medium text-slate-800">Resumen del viaje</h3>{currentTrip ? <div className="mt-3 space-y-2 text-sm text-slate-600"><p><b>Inicio:</b> {formatDate(currentTrip.startTime)}</p><p><b>Distancia:</b> {distance(currentTrip.distance)}</p><p><b>Duración:</b> {duration(currentTrip.duration)}</p><p><b>Velocidad media:</b> {currentTrip.averageSpeed} km/h</p></div> : <p className="mt-2 text-sm text-slate-500">No hay un viaje en curso.</p>}</div></section></div>}
      {tab === "history" && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><Filters from={from} to={to} setFrom={setFrom} setTo={setTo} onSearch={searchHistory} loading={searching} label="Buscar rutas" /><div className="mt-4 overflow-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Ver</th><th className="p-3">Fecha / ruta</th><th className="p-3">Distancia</th><th className="p-3">Duración</th><th className="p-3">Paradas</th></tr></thead><tbody>{history?.trips.map((trip) => <tr key={trip._id} className="border-t border-slate-100"><td className="p-3"><button onClick={() => void viewTrip(trip)} className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50" title="Ver ruta"><Eye size={17} /></button></td><td className="p-3"><p>{formatDate(trip.startTime)}</p><p className="mt-1 max-w-80 truncate text-xs text-slate-500">{coord(trip.startLocation)} → {coord(trip.endLocation)}</p></td><td className="p-3">{distance(trip.distance)}</td><td className="p-3">{duration(trip.duration)}</td><td className="p-3">{history.stops.filter((stop) => stop.trip === trip._id).length}</td></tr>)}{history && !history.trips.length && <tr><td className="p-5 text-slate-500" colSpan={5}>No hay viajes en el rango seleccionado.</td></tr>}{!history && <tr><td className="p-5 text-slate-500" colSpan={5}>Selecciona un rango de fechas y consulta las rutas.</td></tr>}</tbody></table></div></section>}
      <RouteModal trip={selectedTrip} positions={tripPositions} stops={history?.stops.filter((stop) => stop.trip === selectedTrip?._id) ?? []} street={tripStreet} playing={playing} progress={playProgress} speed={speed} setSpeed={setSpeed} onPlay={togglePlayback} onClose={() => { setPlaying(false); setSelectedTrip(null); }} />
      {tab === "reports" && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Filters from={from} to={to} setFrom={setFrom} setTo={setTo} onSearch={loadReport} loading={searching} label="Generar reporte completo" />
        <p className="mt-2 text-xs text-slate-500">Incluye resumen, viajes, paradas y la ruta pintada del período.</p>
        {report && <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-5"><Stat label="Viajes" value={String(report.summary.trips)} icon={Route} /><Stat label="Distancia" value={distance(report.summary.distanceMeters)} icon={Navigation} /><Stat label="Conducción" value={duration(report.summary.drivingSeconds)} icon={Clock3} /><Stat label="Paradas" value={String(report.summary.stops)} icon={MapPin} /><Stat label="Vel. promedio" value={`${report.summary.averageSpeed} km/h`} icon={Gauge} /></div><button onClick={exportReportPdf} disabled={!reportMapReady} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"><Download size={16} />{reportMapReady ? "Descargar PDF" : "Preparando mapa…"}</button></div>
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200"><div className="h-80"><TrackingMap position={reportPositions[reportPositions.length - 1] ?? null} positions={reportPositions} stops={report.stops} mapRef={reportMapRef} onLoad={() => setReportMapReady(true)} /></div></div>
          <h3 className="mt-6 font-semibold text-slate-800">Detalle de paradas</h3><div className="mt-2 overflow-auto rounded-xl border border-slate-200"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Llegada</th><th className="p-3">Salida</th><th className="p-3">Duración</th><th className="p-3">Ubicación GPS</th></tr></thead><tbody>{report.stops.map((stop) => <tr key={stop._id} className="border-t border-slate-100"><td className="p-3">{formatDate(stop.arrivalTime)}</td><td className="p-3">{formatDate(stop.departureTime)}</td><td className="p-3">{duration(stop.duration)}</td><td className="p-3">{coord(stop)}</td></tr>)}{!report.stops.length && <tr><td className="p-4 text-slate-500" colSpan={4}>No se registraron paradas.</td></tr>}</tbody></table></div>
        </div>}
      </section>}
    </>}</main></div>;
}

function Filters({ from, to, setFrom, setTo, onSearch, loading, label }: { from: string; to: string; setFrom: (value: string) => void; setTo: (value: string) => void; onSearch: () => void; loading: boolean; label: string }) { return <div className="flex flex-wrap items-end gap-3"><label className="text-sm text-slate-600">Desde<input value={from} onChange={(event) => setFrom(event.target.value)} type="date" className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-slate-800" /></label><label className="text-sm text-slate-600">Hasta<input value={to} onChange={(event) => setTo(event.target.value)} type="date" min={from} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-slate-800" /></label><button disabled={loading} onClick={onSearch} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={16} /> : <Search size={16} />}{label}</button></div>; }
