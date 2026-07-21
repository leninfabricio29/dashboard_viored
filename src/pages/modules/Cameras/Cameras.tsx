import { useEffect, useMemo, useState } from "react";
import {
  FiVideoOff,
  FiMaximize2,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiMapPin,
  FiDownload,
  FiRotateCw,
  FiWifi,
  FiWifiOff,
  FiGrid,
  FiMap,
  FiPlus,
  FiUsers,
} from "react-icons/fi";
import Map, { Marker, NavigationControl, Popup, type MapLayerMouseEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import cameraService from "../../../services/camera-service";

/* ------------------------------------------------------------------ */
/*  Tipos                                                              */
/* ------------------------------------------------------------------ */

type CameraTab = "records" | "map";

interface CameraRecord {
  _id: string;
  name: string;
  description: string;
  location: {
    type: "Point";
    coordinates: [number, number];
    address?: string;
  };
  streamUrl: string;
  status: string;
  assignedUsers?: AssignedUser[];
  createdAt?: string;
  updatedAt?: string;
}

interface DraftLocation {
  lat: number;
  lng: number;
  address: string;
}

const PAGE_SIZE = 8;
const DEFAULT_CENTER = { lat: -3.6800673994997517, lng: -79.68074791747131 };
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

/* ------------------------------------------------------------------ */
/*  Componente principal                                               */
/* ------------------------------------------------------------------ */

export default function Cameras() {
  const [cameras, setCameras] = useState<CameraRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CameraTab>("records");
  const [selectedMapCameraId, setSelectedMapCameraId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [usersCamera, setUsersCamera] = useState<CameraRecord | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCameras = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await cameraService.getCameras();
        if (mounted) {
          setCameras(Array.isArray(data) ? data : [] as any);
        }
      } catch (err) {
        if (mounted) {
          setError("No se pudieron cargar las cámaras desde la API.");
          console.error(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadCameras();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [cameras.length]);

  const totalPages = Math.max(1, Math.ceil(cameras.length / PAGE_SIZE));

  const pageCameras = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return cameras.slice(start, start + PAGE_SIZE);
  }, [cameras, page]);

  const expandedCamera = cameras.find((c) => c._id === expandedId) || null;
  const liveCount = cameras.filter((c) => c.status === "online" || c.status === "live").length;

  function goTo(p: number) {
    setPage(Math.min(Math.max(1, p), totalPages));
  }

  async function handleCreateCamera(payload: {
    description: string;
    streamUrl: string;
    location: {
      type: "Point";
      coordinates: [number, number];
      address: string;
    };
  }) {
    try {
      const created = await cameraService.createCamera(payload);
      setCameras((prev) => [created, ...prev] as any);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  return (
    <div className="flex h-screen w-full flex-col bg-white font-sans text-slate-800">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <FiGrid className="text-blue-600" size={18} />
          <div>
            <h1 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
              Cámaras
            </h1>
            <p className="text-xs text-slate-400">{cameras.length} cámaras registradas</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {liveCount} en línea
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            {cameras.length - liveCount} sin señal
          </span>
        </div>
      </header>

      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-6 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("records")}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === "records"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
          >
            <FiGrid size={14} /> Registros
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === "map"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
          >
            <FiMap size={14} /> Mapa
          </button>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <FiPlus size={14} /> Nueva cámara
        </button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
          Cargando cámaras...
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-red-600">
          {error}
        </div>
      ) : activeTab === "records" ? (
        <>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {pageCameras.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                No hay cámaras para mostrar.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {pageCameras.map((cam) => (
                  <CameraTile
                    key={cam._id} camera={cam}
                    onExpand={() => setExpandedId(cam._id)}
                    onShowUsers={() => setUsersCamera(cam)}

                  />
                ))}
              </div>
            )}
          </div>

          {cameras.length > PAGE_SIZE && (
            <footer className="flex items-center justify-center gap-1 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => goTo(page - 1)}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <FiChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  className={`h-8 min-w-8 rounded-md px-2 text-xs font-medium transition-colors ${p === page ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
                    }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => goTo(page + 1)}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <FiChevronRight size={16} />
              </button>
            </footer>
          )}
        </>
      ) : (
        <div className="flex-1 px-6 py-6">
          <CamerasMapView
            cameras={cameras}
            selectedCameraId={selectedMapCameraId}
            onSelectCamera={setSelectedMapCameraId}
          />
        </div>
      )}

      {expandedCamera && <ExpandedView camera={expandedCamera} onClose={() => setExpandedId(null)} />}
      {usersCamera && <CameraUsersModal camera={usersCamera} onClose={() => setUsersCamera(null)} />}

      {isCreateModalOpen && (
        <CreateCameraModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateCamera}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tile individual                                                     */
/* ------------------------------------------------------------------ */

function CameraTile({ camera, onExpand, onShowUsers }: { camera: CameraRecord; onExpand: () => void; onShowUsers: () => void }) {
  const isLive = camera.status === "online" || camera.status === "live";
  const address = camera.location.address || "Sin dirección registrada";

  return (
    <button
      onClick={onExpand}
      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    >
      <div className="aspect-video w-full overflow-hidden bg-slate-100">
        {isLive ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 p-4 text-center text-white">
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-300">Stream</p>
              <p className="mt-1 text-sm font-semibold">{camera.name}</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-slate-100">
            <FiVideoOff className="text-slate-300" size={22} />
            <span className="text-[11px] text-slate-400">Sin señal</span>
          </div>
        )}
      </div>

      <div className="absolute left-2 top-2 flex items-center gap-1.5">
        {isLive ? (
          <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            EN VIVO
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-slate-800/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            <FiWifiOff size={10} />
            OFFLINE
          </span>
        )}
      </div>

      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-black/55 text-white backdrop-blur-sm">
          <FiMaximize2 size={12} />
        </span>
      </div>

      <div className="bg-white px-3 py-2">
        <p className="truncate text-sm font-medium text-slate-800">{camera.name}</p>
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-400">
          <FiMapPin size={10} />
          {address}
        </p>
        <button onClick={(e) => {
          e.stopPropagation();
          onShowUsers()
        }} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          <FiUsers size={13} /> {(camera.assignedUsers || []).length} clientes
        </button>
      </div>
    </button>
  );
}

function CameraUsersModal({ camera, onClose }: { camera: CameraRecord; onClose: () => void }) {
  const users = camera.assignedUsers || [];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Clientes asociados</h3>
            <p className="mt-1 text-sm text-slate-500">{camera.name} · {users.length} clientes</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Cerrar"><FiX size={18} /></button>
        </div>
        <div className="max-h-80 overflow-y-auto p-5">
          {users.length ? (
            <ul className="space-y-2">
              {users.map((user) => (
                <li key={user._id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700"><FiUsers size={14} /></span>
                  {user.name}
                </li>
              ))}
            </ul>
          ) : <p className="py-6 text-center text-sm text-slate-500">No hay clientes asociados a esta cámara.</p>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Vista expandida (pantalla completa)                                 */
/* ------------------------------------------------------------------ */

function ExpandedView({ camera, onClose }: { camera: CameraRecord; onClose: () => void }) {
  const isLive = camera.status === "online" || camera.status === "live";
  const address = camera.location.address || "Sin dirección registrada";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">{camera.name}</h2>
            {isLive ? (
              <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                EN VIVO
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                <FiWifiOff size={10} />
                OFFLINE
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <FiMapPin size={11} /> {address}
            </span>
            <span className="font-mono">{camera.streamUrl}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100"
            title="Actualizar"
          >
            <FiRotateCw size={16} />
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100"
            title="Descargar snapshot"
          >
            <FiDownload size={16} />
          </button>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100"
            title="Cerrar"
          >
            <FiX size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-slate-900 p-4">
        {isLive ? (
          <div className="w-full max-w-3xl rounded-xl border border-slate-700 bg-slate-950 p-6 text-center text-white shadow-lg">
            <div className="flex justify-center">
              <FiWifi className="text-emerald-400" size={28} />
            </div>
            <p className="mt-3 text-sm uppercase tracking-[0.3em] text-slate-400">Stream</p>
            <p className="mt-2 break-all text-sm text-slate-200">{camera.streamUrl}</p>
            <p className="mt-4 text-xs text-slate-500">{camera.description}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <FiVideoOff size={32} />
            <p className="text-sm">Sin señal de la cámara</p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 px-6 py-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Descripción</p>
            <p className="mt-1 text-sm text-slate-700">{camera.description}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Ubicación</p>
            <p className="mt-1 text-sm text-slate-700">{address}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Coordenadas</p>
            <p className="mt-1 text-sm text-slate-700">
              {camera.location.coordinates[1].toFixed(4)}, {camera.location.coordinates[0].toFixed(4)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal de creación                                                 */
/* ------------------------------------------------------------------ */

function CreateCameraModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (payload: {
    description: string;
    streamUrl: string;
    location: {
      type: "Point";
      coordinates: [number, number];
      address: string;
    };
  }) => Promise<void>;
}) {
  const [description, setDescription] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<DraftLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  async function handleMapClick(event: MapLayerMouseEvent) {
    const { lat, lng } = event.lngLat;
    setSelectedLocation({ lat, lng, address: "Buscando dirección..." });
    setIsResolving(true);

    try {
      if (!MAPBOX_TOKEN) throw new Error("Falta VITE_MAPBOX_TOKEN");
      const params = new URLSearchParams({ longitude: String(lng), latitude: String(lat), language: "es", permanent: "true", access_token: MAPBOX_TOKEN });
      const response = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?${params}`);
      if (!response.ok) throw new Error("No se pudo obtener la dirección de Mapbox");
      const data = await response.json();
      const feature = data.features?.[0];
      const address = feature?.properties?.full_address || feature?.properties?.name_preferred || feature?.place_name || "Dirección no disponible";
      setSelectedLocation({ lat, lng, address });
    } catch (error) {
      console.error(error);
      setSelectedLocation({ lat, lng, address: "No se pudo resolver la dirección" });
    } finally {
      setIsResolving(false);
    }
  }

  async function handleSubmit() {
    if (!description.trim()) {
      setFormError("La descripción es obligatoria.");
      return;
    }

    if (!streamUrl.trim()) {
      setFormError("La URL del stream es obligatoria.");
      return;
    }

    if (!selectedLocation) {
      setFormError("Selecciona la ubicación de la cámara en el mapa.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        description: description.trim(),
        streamUrl: streamUrl.trim(),
        location: {
          type: "Point",
          coordinates: [selectedLocation.lng, selectedLocation.lat],
          address: selectedLocation.address,
        },
      });
    } catch (error) {
      console.error(error);
      setFormError("No se pudo crear la cámara. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Nueva cámara</h3>
            <p className="text-sm text-slate-500">Haz clic sobre el mapa para seleccionar la ubicación.</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100">
            <FiX size={18} />
          </button>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-[0.9fr,1.1fr]">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-0 focus:border-blue-500"
                placeholder="Cámara principal del acceso norte"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Stream URL</label>
              <input
                value={streamUrl}
                onChange={(event) => setStreamUrl(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-0 focus:border-blue-500"
                placeholder="rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Dirección</label>
              <input
                readOnly
                value={selectedLocation?.address || "Selecciona una ubicación en el mapa"}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
              />
              {selectedLocation && (
                <p className="mt-1 text-xs text-slate-500">
                  {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                </p>
              )}
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>

          <div className="h-[360px] overflow-hidden rounded-xl border border-slate-200">
            {!MAPBOX_TOKEN ? (
              <div className="flex h-full items-center justify-center bg-red-50 p-4 text-center text-sm text-red-600">
                Configura VITE_MAPBOX_TOKEN para cargar el mapa.
              </div>
            ) : (
              <Map
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={{ longitude: DEFAULT_CENTER.lng, latitude: DEFAULT_CENTER.lat, zoom: 13 }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                style={{ width: "100%", height: "100%" }}
                onClick={handleMapClick}
              >
                <NavigationControl position="top-right" />
                {selectedLocation && <Marker longitude={selectedLocation.lng} latitude={selectedLocation.lat} anchor="bottom" color="#2563eb" />}
              </Map>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-500">{isResolving ? "Resolviendo dirección..." : "La dirección se completa automáticamente al seleccionar una ubicación."}</p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Guardando..." : "Crear cámara"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mapa                                                               */
/* ------------------------------------------------------------------ */

function CamerasMapView({
  cameras,
  selectedCameraId,
  onSelectCamera,
}: {
  cameras: CameraRecord[];
  selectedCameraId: string | null;
  onSelectCamera: (id: string | null) => void;
}) {
  const center = useMemo(() => {
    if (!cameras.length) return DEFAULT_CENTER;

    const lng = cameras.reduce((sum, camera) => sum + camera.location.coordinates[0], 0) / cameras.length;
    const lat = cameras.reduce((sum, camera) => sum + camera.location.coordinates[1], 0) / cameras.length;

    return { lng, lat };
  }, [cameras]);

  const selectedCamera = cameras.find((camera) => camera._id === selectedCameraId) || null;

  if (!MAPBOX_TOKEN) {
    return <div className="flex h-[calc(100vh-13rem)] items-center justify-center rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">Configura VITE_MAPBOX_TOKEN para cargar el mapa.</div>;
  }

  return (
    <div className="h-[calc(100vh-13rem)] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: center.lng, latitude: center.lat, zoom: 12 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />
        {cameras.map((camera) => {
          return (
            <Marker
              key={camera._id}
              longitude={camera.location.coordinates[0]}
              latitude={camera.location.coordinates[1]}
              anchor="bottom"
              onClick={() => onSelectCamera(camera._id)}
              color="#2563eb"
            />
          );
        })}

        {selectedCamera && (
          <Popup
            longitude={selectedCamera.location.coordinates[0]}
            latitude={selectedCamera.location.coordinates[1]}
            anchor="bottom"
            closeOnClick={false}
            onClose={() => onSelectCamera(null)}
          >
            <div className="max-w-[220px] p-1">
              <p className="text-sm font-semibold text-slate-900">{selectedCamera.name}</p>
              <p className="mt-1 text-xs text-slate-600">{selectedCamera.location.address || "Sin dirección"}</p>
              <p className="mt-1 text-[11px] text-slate-500">{selectedCamera.description}</p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

interface AssignedUser {
  _id: string;
  name: string;
}
