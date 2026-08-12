import { useEffect, useMemo, useState, useRef } from "react";
import {
  FiVideoOff,
  FiMaximize2,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiMapPin,
  FiRotateCw,
  FiWifiOff,
  FiGrid,
  FiMap,
  FiPlus,
  FiUsers,
  FiTv,
  FiCopy,
  FiCheck,
  FiTrash2,
  FiLayers,
} from "react-icons/fi";
import Map, { Marker, NavigationControl, Popup, type MapLayerMouseEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import cameraService, { DiscoverDevice, OpenCameraResponse } from "../../../services/camera-service";
import userService from "../../../services/user-service";
import { User } from "../../../types/user.types";

/* ------------------------------------------------------------------ */
/*  Componente de Reproductor WebRTC / HLS                            */
/* ------------------------------------------------------------------ */

export function LiveStreamPlayer({
  webrtcUrl,
  hlsUrl,
  channelName,
  isChangingChannel,
}: {
  webrtcUrl?: string;
  hlsUrl?: string;
  channelName: string;
  isChangingChannel?: boolean;
}) {
  const cleanWebrtcUrl = useMemo(() => {
    if (!webrtcUrl) return "";
    return webrtcUrl.replace(/\/whep\/?$/i, "");
  }, [webrtcUrl]);

  const iframeSrc = useMemo(() => {
    if (!cleanWebrtcUrl) return "";
    const separator = cleanWebrtcUrl.includes("?") ? "&" : "?";
    return `${cleanWebrtcUrl}${separator}controls=1&muted=1&autoplay=1&playsinline=1`;
  }, [cleanWebrtcUrl]);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  if (cleanWebrtcUrl) {
    return (
      <div className="relative flex-1 w-full h-full min-h-[420px] flex items-center justify-center bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
        {isChangingChannel && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white transition-opacity duration-300 z-20">
            <div className="relative flex items-center justify-center">
              <div className="h-12 w-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <FiTv className="absolute text-blue-400" size={18} />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Cambiando de canal...
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{channelName}</p>
            </div>
          </div>
        )}

        <iframe
          src={iframeSrc}
          className="w-full h-full min-h-[420px] border-0 rounded-2xl bg-black"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={`Live Stream - ${channelName}`}
        />

        {/* Etiqueta de Canal */}
        <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-2 z-10 shadow-lg pointer-events-none">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <FiTv className="text-emerald-400" size={14} />
          <span className="truncate max-w-[240px]">{channelName}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 w-full h-full min-h-[420px] flex items-center justify-center bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
      <video
        ref={videoRef}
        src={hlsUrl}
        controls
        autoPlay
        muted
        playsInline
        className="h-full w-full object-contain"
      />

      {/* Etiqueta de Canal */}
      <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-2 z-10 shadow-lg">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <FiTv className="text-emerald-400" size={14} />
        <span className="truncate max-w-[240px]">{channelName}</span>
      </div>
    </div>
  );
}  

type CameraTab = "records" | "map";

interface CameraRecord {
  _id: string;
  name: string;
  cameraId?: string;
  description: string;
  location: {
    type: "Point";
    coordinates: [number, number];
    address?: string;
  };
  streamUrl?: string;
  status: string;
  assignedUser?: any;
  channels?: number[];
  assignedUsers?: any[];
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

  const loadCameras = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cameraService.getCameras();
      setCameras(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("No se pudieron cargar las cámaras desde la API.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCameras();
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
    cameraId?: string;
    streamUrl?: string;
    location: {
      type: "Point";
      coordinates: [number, number];
      address: string;
    };
  }) {
    try {
      const created = await cameraService.createCamera(payload);
      setCameras((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  function handleCameraUpdated(updatedCamera: CameraRecord) {
    setCameras((prev) => prev.map((c) => (c._id === updatedCamera._id ? updatedCamera : c)));
    if (usersCamera?._id === updatedCamera._id) {
      setUsersCamera(updatedCamera);
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
                    key={cam._id}
                    camera={cam}
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
      {usersCamera && (
        <CameraUsersModal
          camera={usersCamera}
          onClose={() => setUsersCamera(null)}
          onCameraUpdated={handleCameraUpdated}
        />
      )}

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

function CameraTile({
  camera,
  onExpand,
  onShowUsers,
}: {
  camera: CameraRecord;
  onExpand: () => void;
  onShowUsers: () => void;
}) {
  const isLive = camera.status === "online" || camera.status === "live";
  const address = camera.location?.address || "Sin dirección registrada";
  const assignedCount =
    camera.assignedUsers && camera.assignedUsers.length > 0
      ? camera.assignedUsers.length
      : camera.assignedUser
      ? 1
      : 0;

  return (
    <button
      onClick={onExpand}
      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    >
      <div className="aspect-video w-full overflow-hidden bg-slate-100">
        {isLive ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 p-4 text-center text-white">
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-300">
                {camera.cameraId ? `SN: ${camera.cameraId}` : "Stream"}
              </p>
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowUsers();
          }}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <FiUsers size={13} /> {assignedCount} {assignedCount === 1 ? "cliente" : "clientes"}
        </button>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Vista expandida con Streaming Proxy & Selector de Canales        */
/* ------------------------------------------------------------------ */

function ExpandedView({ camera, onClose }: { camera: CameraRecord; onClose: () => void }) {
  const targetCameraId = camera.cameraId || camera.name || camera._id;
  const address = camera.location?.address || "Sin dirección registrada";

  const [loadingDevice, setLoadingDevice] = useState(true);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [device, setDevice] = useState<DiscoverDevice | null>(null);

  const [selectedChannelSeq, setSelectedChannelSeq] = useState<number>(0);
  const [loadingStream, setLoadingStream] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamData, setStreamData] = useState<OpenCameraResponse | null>(null);

  const [copiedType, setCopiedType] = useState<"webrtc" | "hls" | null>(null);
  const activeChannelSeqRef = useRef<number | null>(null);

  // Descubrir dispositivo al abrir
  useEffect(() => {
    let isMounted = true;

    const discover = async () => {
      try {
        setLoadingDevice(true);
        setDeviceError(null);
        const res = await cameraService.discoverDevice(targetCameraId);
        if (isMounted) {
          if (res.success && res.device) {
            setDevice(res.device);
            if (res.device.channels && res.device.channels.length > 0) {
              setSelectedChannelSeq(res.device.channels[0].channelSeq);
            } else {
              setSelectedChannelSeq(0);
            }
          } else {
            setDeviceError("No se pudo obtener información del dispositivo.");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Error al descubrir dispositivo:", err);
          setDeviceError(err.response?.data?.message || "No se pudo conectar con el servicio externo.");
        }
      } finally {
        if (isMounted) setLoadingDevice(false);
      }
    };

    void discover();

    return () => {
      isMounted = false;
    };
  }, [targetCameraId]);

  // Abrir stream del canal seleccionado y asegurar cierre al cambiar o desmontar
  useEffect(() => {
    if (loadingDevice) return;

    let isMounted = true;
    const currentSeq = selectedChannelSeq;

    const openStream = async () => {
      try {
        setLoadingStream(true);
        setStreamError(null);
        const res = await cameraService.openCamera(targetCameraId, currentSeq);
        if (isMounted) {
          if (res.success) {
            setStreamData(res);
            activeChannelSeqRef.current = currentSeq;
          } else {
            setStreamError("No se pudo iniciar la transmisión.");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Error al abrir stream:", err);
          setStreamError(err.response?.data?.message || "Error al abrir el canal de transmisión.");
        }
      } finally {
        if (isMounted) setLoadingStream(false);
      }
    };

    void openStream();

    return () => {
      isMounted = false;
      // Cerrar canal al cambiar o salir
      if (activeChannelSeqRef.current !== null) {
        const seqToClose = activeChannelSeqRef.current;
        activeChannelSeqRef.current = null;
        cameraService.closeCamera(targetCameraId, seqToClose).catch((e) =>
          console.error(`Error cerrando canal ${seqToClose}:`, e)
        );
      }
    };
  }, [targetCameraId, selectedChannelSeq, loadingDevice]);

  function copyToClipboard(text: string, type: "webrtc" | "hls") {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  }

  const isRecorder = device?.type === "recorder";
  const activeChannelName =
    device?.channels?.find((ch) => ch.channelSeq === selectedChannelSeq)?.channelName ||
    `Canal ${selectedChannelSeq}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-white">{camera.name}</h2>
            {device && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                  isRecorder ? "bg-purple-950 text-purple-300 border border-purple-800" : "bg-blue-950 text-blue-300 border border-blue-800"
                }`}
              >
                {isRecorder ? "Grabador (NVR/DVR)" : "Cámara Sencilla"}
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full bg-emerald-950 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CONECTADO
            </span>
          </div>
          <p className="mt-1 flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <FiMapPin size={11} /> {address}
            </span>
            {targetCameraId && <span className="font-mono text-slate-400">ID/SN: {targetCameraId}</span>}
            {device?.model && <span className="text-slate-400">Modelo: {device.model}</span>}
          </p>
        </div>

        {/* Controles de Header & Dropdown de Canales */}
        <div className="flex items-center gap-4">
          {isRecorder && device?.channels && device.channels.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <FiLayers className="text-purple-400" size={16} />
              <label htmlFor="channel-select" className="text-xs font-medium text-slate-300">
                Canal:
              </label>
              <select
                id="channel-select"
                value={selectedChannelSeq}
                onChange={(e) => setSelectedChannelSeq(Number(e.target.value))}
                className="bg-slate-900 text-white text-xs font-medium rounded-md px-2 py-1 border border-slate-700 outline-none focus:border-purple-500 cursor-pointer max-w-[240px] truncate"
              >
                {device.channels.map((ch) => (
                  <option key={`${ch.channelSeq}-${ch.channelName}`} value={ch.channelSeq}>
                    Canal {ch.channelSeq}: {ch.channelName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            title="Cerrar reproductor"
          >
            <FiX size={20} />
          </button>
        </div>
      </div>

      {/* Main Stream Area */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 bg-black relative">
        {loadingDevice || loadingStream ? (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <FiRotateCw size={32} className="animate-spin text-blue-500" />
            <p className="text-sm font-medium">
              {loadingDevice ? "Descubriendo dispositivo..." : `Conectando stream (${activeChannelName})...`}
            </p>
          </div>
        ) : deviceError || streamError ? (
          <div className="flex flex-col items-center gap-3 text-center text-red-400 max-w-md">
            <FiVideoOff size={40} className="text-red-500" />
            <p className="text-sm font-medium">{deviceError || streamError}</p>
            <button
              onClick={() => setSelectedChannelSeq((prev) => prev)}
              className="mt-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700"
            >
              Reintentar conexión
            </button>
          </div>
        ) : streamData ? (
          <div className="flex flex-col items-center w-full max-w-5xl h-full justify-between">
            {/* Reproductor de Video Optimizado HLS */}
            <LiveStreamPlayer
              hlsUrl={streamData.hls}
              webrtcUrl={streamData.webrtc}
              channelName={activeChannelName}
              isChangingChannel={loadingStream}
            />

            {/* Panel de Enlaces Proxy */}
            <div className="mt-4 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs">
                <div className="truncate pr-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                    WebRTC Stream
                  </span>
                  <span className="font-mono text-slate-300 truncate block mt-0.5">
                    {streamData.webrtc ? streamData.webrtc.replace(/\/whep\/?$/i, "") : ""}
                  </span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      streamData.webrtc ? streamData.webrtc.replace(/\/whep\/?$/i, "") : "",
                      "webrtc"
                    )
                  }
                  className="flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1.5 font-medium text-slate-200 hover:bg-slate-700 transition-colors shrink-0"
                >
                  {copiedType === "webrtc" ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                  {copiedType === "webrtc" ? "Copiado" : "Copiar"}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs">
                <div className="truncate pr-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                    HLS (m3u8)
                  </span>
                  <span className="font-mono text-slate-300 truncate block mt-0.5">{streamData.hls}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(streamData.hls, "hls")}
                  className="flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1.5 font-medium text-slate-200 hover:bg-slate-700 transition-colors shrink-0"
                >
                  {copiedType === "hls" ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                  {copiedType === "hls" ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-800 bg-slate-900 px-6 py-3">
        <div className="grid gap-3 md:grid-cols-3 text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Descripción</span>
            <p className="text-slate-300 mt-0.5">{camera.description || "Sin descripción"}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Ubicación</span>
            <p className="text-slate-300 mt-0.5">{address}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Coordenadas</span>
            <p className="text-slate-300 mt-0.5">
              {camera.location.coordinates[1].toFixed(4)}, {camera.location.coordinates[0].toFixed(4)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal de asignación de usuarios y selección de canales           */
/* ------------------------------------------------------------------ */

function CameraUsersModal({
  camera,
  onClose,
  onCameraUpdated,
}: {
  camera: CameraRecord;
  onClose: () => void;
  onCameraUpdated: (camera: CameraRecord) => void;
}) {
  const targetCameraId = camera.cameraId || camera.name || camera._id;
  const [device, setDevice] = useState<DiscoverDevice | null>(null);
  const [loadingDevice, setLoadingDevice] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentAssignedUser = (camera as any).assignedUser
    ? (typeof (camera as any).assignedUser === "object" ? (camera as any).assignedUser : { _id: (camera as any).assignedUser, name: "Cliente Asignado" })
    : (camera.assignedUsers && camera.assignedUsers.length > 0
        ? (typeof camera.assignedUsers[0].user === "object" ? camera.assignedUsers[0].user : { _id: camera.assignedUsers[0].user || camera.assignedUsers[0], name: "Cliente Asignado" })
        : null);

  const currentChannels: number[] = (camera as any).channels || camera.assignedUsers?.[0]?.channels || [];

  const [assignedUser, setAssignedUser] = useState<any>(currentAssignedUser);
  const [assignedChannels, setAssignedChannels] = useState<number[]>(currentChannels);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoadingDevice(true);
        setLoadingUsers(true);

        const [deviceRes, usersRes] = await Promise.allSettled([
          cameraService.discoverDevice(targetCameraId),
          userService.getUsers(),
        ]);

        if (mounted) {
          if (deviceRes.status === "fulfilled" && deviceRes.value.success) {
            setDevice(deviceRes.value.device);
          }
          if (usersRes.status === "fulfilled") {
            setUsers(Array.isArray(usersRes.value) ? usersRes.value : []);
          }
        }
      } catch (err) {
        console.error("Error cargando datos para asignación:", err);
      } finally {
        if (mounted) {
          setLoadingDevice(false);
          setLoadingUsers(false);
        }
      }
    };

    void fetchData();

    return () => {
      mounted = false;
    };
  }, [targetCameraId]);

  const isRecorder = device?.type === "recorder";

  function toggleChannel(seq: number) {
    setSelectedChannels((prev) =>
      prev.includes(seq) ? prev.filter((s) => s !== seq) : [...prev, seq]
    );
  }

  async function handleAssignUser() {
    if (!selectedUserId) {
      setError("Por favor selecciona un cliente/usuario.");
      return;
    }

    if (isRecorder && selectedChannels.length === 0) {
      setError("Por favor selecciona al menos un canal para el grabador.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await cameraService.assignCameraToUser(
        camera._id,
        selectedUserId,
        isRecorder ? selectedChannels : undefined
      );

      setAssignedUser((res.camera as any).assignedUser || null);
      setAssignedChannels((res.camera as any).channels || []);
      onCameraUpdated(res.camera as any);
      setSelectedUserId("");
      setSelectedChannels([]);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Error al asignar usuario.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUnassignUser() {
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await cameraService.unassignCameraFromUser(camera._id);
      setAssignedUser(null);
      setAssignedChannels([]);
      onCameraUpdated(res.camera as any);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Error al desvincular usuario.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Asignación de Clientes</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {camera.name} · {isRecorder ? "Grabador Multicanal" : "Cámara Individual"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Form de Asignación */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Vincular nuevo cliente
            </h4>

            {/* Selector de Usuario */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cliente / Usuario</label>
              {loadingUsers ? (
                <p className="text-xs text-slate-400">Cargando usuarios...</p>
              ) : (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="">-- Selecciona un usuario --</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email || u.phone || u._id})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Seleccionador Multicanal si es Grabador */}
            {isRecorder && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Canales asignados del Grabador
                </label>

                {loadingDevice ? (
                  <p className="text-xs text-slate-400">Cargando canales del dispositivo...</p>
                ) : device?.channels && device.channels.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 space-y-1">
                    {device.channels.map((ch) => {
                      const isChecked = selectedChannels.includes(ch.channelSeq);
                      return (
                        <label
                          key={`${ch.channelSeq}-${ch.channelName}`}
                          className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-xs hover:bg-slate-50 cursor-pointer text-slate-700"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleChannel(ch.channelSeq)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="font-semibold text-slate-900">Canal {ch.channelSeq}:</span>
                            <span className="truncate">{ch.channelName}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No se encontraron canales para este grabador.</p>
                )}
              </div>
            )}

            {assignedUser && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                ⚠️ Esta cámara ya tiene un cliente asignado (<strong>{assignedUser.name || "Cliente"}</strong>). Desvincula el cliente actual si deseas asignarla a otro.
              </div>
            )}

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <button
              onClick={handleAssignUser}
              disabled={isSubmitting || !selectedUserId || Boolean(assignedUser)}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Guardando..." : "Asignar a cliente"}
            </button>
          </div>

          {/* Lista de Usuarios Asignados */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Cliente vinculado ({assignedUser ? 1 : 0})
            </h4>

            {!assignedUser ? (
              <p className="py-4 text-center text-xs text-slate-400">
                No hay ningún cliente vinculado actualmente a esta cámara.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {assignedUser.name || assignedUser.email || "Cliente asignado"}
                    </p>
                    {isRecorder ? (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Canales:{" "}
                        {assignedChannels.length > 0 ? (
                          <span className="font-medium text-blue-600">
                            [{assignedChannels.join(", ")}]
                          </span>
                        ) : (
                          <span className="text-slate-400">Sin canales especificados</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-600 mt-0.5">Cámara completa</p>
                    )}
                  </div>

                  <button
                    onClick={handleUnassignUser}
                    disabled={isSubmitting}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Desvincular cliente"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            )}
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
    cameraId?: string;
    streamUrl?: string;
    location: {
      type: "Point";
      coordinates: [number, number];
      address: string;
    };
  }) => Promise<void>;
}) {
  const [description, setDescription] = useState("");
  const [cameraId, setCameraId] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<DraftLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Cola que serializa las llamadas a Nominatim en el módulo de cámaras
  async function handleMapClick(event: MapLayerMouseEvent) {
    const { lat, lng } = event.lngLat;
    setSelectedLocation({ lat, lng, address: "Buscando dirección..." });
    setIsResolving(true);

    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        lat: String(lat),
        lon: String(lng),
        zoom: "18",
        addressdetails: "0",
        email: "soporte@viryx.net",
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
        headers: { "Accept-Language": "es" },
      });
      if (!response.ok) throw new Error("No se pudo obtener la dirección de Nominatim");
      const data = (await response.json()) as { display_name?: string; error?: string };
      const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setSelectedLocation({ lat, lng, address });
    } catch (error) {
      console.error(error);
      setSelectedLocation({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    } finally {
      setIsResolving(false);
    }
  }

  async function handleSubmit() {
    if (!description.trim()) {
      setFormError("La descripción es obligatoria.");
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
        cameraId: cameraId.trim() || undefined,
        streamUrl: streamUrl.trim() || undefined,
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
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-[0.9fr,1.1fr]">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">ID / Nro. Serie de Cámara</label>
              <input
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-0 focus:border-blue-500 font-mono"
                placeholder="Ej. 9G0D5F2PAZ6F82F"
              />
            </div>

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
              <label className="mb-1 block text-sm font-medium text-slate-700">Stream URL (Opcional)</label>
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
                {selectedLocation && (
                  <Marker
                    longitude={selectedLocation.lng}
                    latitude={selectedLocation.lat}
                    anchor="bottom"
                    color="#2563eb"
                  />
                )}
              </Map>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-500">
            {isResolving
              ? "Resolviendo dirección..."
              : "La dirección se completa automáticamente al seleccionar una ubicación."}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
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
    return (
      <div className="flex h-[calc(100vh-13rem)] items-center justify-center rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
        Configura VITE_MAPBOX_TOKEN para cargar el mapa.
      </div>
    );
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
              <p className="mt-1 text-xs text-slate-600">{selectedCamera.location?.address || "Sin dirección"}</p>
              <p className="mt-1 text-[11px] text-slate-500">{selectedCamera.description}</p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
