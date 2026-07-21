import { Marker } from "react-map-gl";
import { Position } from "../../services/tracking-service";

export function VehicleMarker({ position, color = "#2563eb" }: { position: Position; color?: string }) {
  const rotation = position.heading ?? 0;
  return (
    <Marker longitude={position.longitude} latitude={position.latitude} anchor="bottom">
      <div
        className="drop-shadow-lg"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
          {/* Carrocería principal */}
          <rect x="10" y="30" width="80" height="40" rx="8" fill={color} />
          {/* Techo */}
          <rect x="25" y="15" width="50" height="25" rx="6" fill={color} opacity="0.8" />
          {/* Ventanas */}
          <rect x="28" y="18" width="44" height="18" rx="4" fill="#1e293b" opacity="0.3" />
          {/* Faros delanteros */}
          <circle cx="20" cy="40" r="6" fill="#facc15" />
          <circle cx="80" cy="40" r="6" fill="#facc15" />
          {/* Faros traseros */}
          <circle cx="18" cy="60" r="5" fill="#ef4444" />
          <circle cx="82" cy="60" r="5" fill="#ef4444" />
          {/* Línea de detalle */}
          <line x1="10" y1="50" x2="90" y2="50" stroke="#fff" strokeWidth="1.5" opacity="0.3" />
        </svg>
      </div>
    </Marker>
  );
}