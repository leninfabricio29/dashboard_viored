import { useEffect, useState } from "react";
import { FiClock, FiMapPin, FiX } from "react-icons/fi";
import api from "../../services/api";
import MapAlert from "./MapAlert";
import type { AlertData } from "./AlertMapContainer";

type RoutePoint = { lat: number; lng: number };

interface ModalTrackingProps {
  alertId: string;
  initialAlert: {
    name: string;
    phone: string;
    lat: number;
    lng: number;
    time: string;
    avatar?: string;
  };
  onClose: () => void;
}

const getCoordinates = (alert: any): RoutePoint | null => {
  const coordinates = alert?.lastLocation?.coordinates ?? alert?.coordinates;
  if (!Array.isArray(coordinates)) return null;

  const [lng, lat] = coordinates.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
};

export default function ModalTracking({ alertId, initialAlert, onClose }: ModalTrackingProps) {
  const [route, setRoute] = useState<RoutePoint[]>([
    { lat: initialAlert.lat, lng: initialAlert.lng },
  ]);
  const [marker, setMarker] = useState<AlertData>({
    id: alertId,
    alertId,
    lat: initialAlert.lat,
    lng: initialAlert.lng,
    emitterName: initialAlert.name,
    emitterPhone: initialAlert.phone,
    emitterId: "",
    avatar: initialAlert.avatar || "",
    createdAt: initialAlert.time,
    status: "active",
  });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const pollLocation = async () => {
      try {
        const response = await api.get(`/api/alerts/${alertId}`);
        const alert = response.data?.alert ?? response.data;
        const point = getCoordinates(alert);
        if (!mounted || !point) return;

        setMarker((current) => ({
          ...current,
          lat: point.lat,
          lng: point.lng,
          emitterName: alert?.reporter?.name ?? current.emitterName,
          emitterPhone: alert?.reporter?.phone ?? current.emitterPhone,
          emitterId: alert?.reporter?._id ?? current.emitterId,
          avatar: alert?.reporter?.avatar ?? current.avatar,
          createdAt: alert?.reportedAt ?? alert?.createdAt ?? current.createdAt,
          status: alert?.status ?? current.status,
        }));
        setRoute((current) => {
          if (current.length <= 1 && alert?.locations && alert.locations.length > 0) {
            const history = alert.locations.map((loc: any) => ({
              lat: loc.coordinates[1],
              lng: loc.coordinates[0],
            }));
            const lastHistoryPoint = history[history.length - 1];
            if (lastHistoryPoint && lastHistoryPoint.lat === point.lat && lastHistoryPoint.lng === point.lng) {
              return history;
            }
            return [...history, point];
          }

          const lastPoint = current[current.length - 1];
          if (lastPoint?.lat === point.lat && lastPoint.lng === point.lng) return current;
          return [...current, point];
        });
        setLastUpdate(new Date());
        setHasError(false);
      } catch (error) {
        if (mounted) setHasError(true);
        console.error("No se pudo actualizar el rastreo de la alerta:", error);
      }
    };

    void pollLocation();
    const intervalId = window.setInterval(() => void pollLocation(), 3000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [alertId]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4">
      <section className="flex h-[min(88vh,760px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Rastreo en vivo</h2>
            <p className="text-xs text-slate-500">{marker.emitterName} · Actualización cada 3 segundos</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar rastreo"
          >
            <FiX className="h-5 w-5" />
          </button>
        </header>

        <div className="relative min-h-0 flex-1 bg-slate-100">
          <MapAlert markers={[marker]} route={route} zoom={15} alertZoom={16} height="100%" width="100%" onAttend={() => undefined} />
        </div>

        <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 px-5 py-3 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><FiMapPin className="text-emerald-600" /> {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}</span>
          <span className="flex items-center gap-1.5"><FiClock className="text-emerald-600" /> {lastUpdate ? `Actualizado: ${lastUpdate.toLocaleTimeString("es-EC", { hour12: false })}` : "Conectando al rastreo..."}</span>
          <span className="ml-auto font-medium text-slate-500">{route.length} punto{route.length === 1 ? "" : "s"} en la ruta</span>
          {hasError && <span className="text-amber-600">No se pudo actualizar; se reintentará automáticamente.</span>}
        </footer>
      </section>
    </div>
  );
}
