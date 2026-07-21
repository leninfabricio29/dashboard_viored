import { useState } from "react";
import { FiClock, FiMapPin, FiPhone, FiUser } from "react-icons/fi";
import { Popup } from "react-map-gl";

type EmergencyMarkerProps = {
  alert: {
    id: string;
    alertId: string;
    lat: number;
    lng: number;
    avatar: string;
    name: string;
    phone: string;
    emitterId: string;
    createdAt?: string;
    status?: string;
  };
  onAttend: (
    id: string,
    alertId: string,
    userId: string,
    recipientId: string
  ) => void;
};

export const EmergencyMarker = ({ alert, onAttend }: EmergencyMarkerProps) => {
  const [showPopup, setShowPopup] = useState(false);
  const isActive = alert.status === "active" || alert.status === "pendiente";
  const isClosed = alert.status === "closed" || alert.status === "cerrada" || alert.status === "finalized";
  const isAttended = alert.status === "attended" || alert.status === "en_atencion" || alert.status === "in_progress";
  const parsedEmergencyTime = alert.createdAt ? new Date(alert.createdAt) : null;
  const emergencyTime = parsedEmergencyTime && !Number.isNaN(parsedEmergencyTime.getTime())
    ? parsedEmergencyTime.toLocaleTimeString("es-EC", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : alert.createdAt || "Hora no registrada";

  return (
    <>
      <div
        onClick={() => setShowPopup(true)}
        className="relative cursor-pointer"
        title={alert.name}
      >
        {isActive && (
          <div className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-40"></div>
        )}

        <div
          className={`relative z-10 h-12 w-12 overflow-hidden rounded-full border-4 shadow-lg ${
            isClosed ? "border-emerald-600" : isAttended ? "border-amber-500" : "border-red-600"
          }`}
        >
          <img
            src={alert.avatar && alert.avatar.trim() !== "" ? alert.avatar : "https://ui-avatars.com/api/?background=ef4444&color=fff&name=" + encodeURIComponent(alert.name)}
            alt={alert.name}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              e.currentTarget.src =
                "https://ui-avatars.com/api/?background=ef4444&color=fff&name=" +
                encodeURIComponent(alert.name);
            }}
          />
        </div>

        <div className="absolute left-1/2 top-14 -translate-x-1/2 rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800 shadow pointer-events-none whitespace-nowrap">
          {alert.name}
        </div>
      </div>

      {showPopup && (
        <Popup
          longitude={alert.lng}
          latitude={alert.lat}
          onClose={() => setShowPopup(false)}
          closeOnClick={false}
          closeButton={false}
          anchor="top"
          offset={[0, 10]}
          className="custom-popup"
        >
          <div className={`relative flex w-[min(22rem,calc(100vw-2rem))] max-w-full flex-col space-y-3 rounded-md border-2 bg-white p-4 text-sm shadow-xl ${isClosed ? "border-emerald-500" : isAttended ? "border-amber-500" : "border-red-500"}`}>
            {/* CSS para ocultar el div por defecto del popup */}
            <style>{`
              .custom-popup .mapboxgl-popup-content {
                background: transparent !important;
                padding: 0 !important;
                box-shadow: none !important;
                border-radius: 0 !important;
              }
              .custom-popup .mapboxgl-popup-tip {
                display: none !important;
              }
            `}</style>
            {/* Botón X personalizado */}
            <button
              onClick={() => setShowPopup(false)}
              className={`absolute top-2 right-2 z-20 rounded-full p-1 shadow transition-colors ${isClosed ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : isAttended ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "bg-red-100 text-red-600 hover:bg-red-200"}`}
              aria-label="Cerrar alerta"
              tabIndex={0}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mt-2 flex items-center gap-2 pr-7">
              <svg className={`h-6 w-6 ${isClosed ? "text-emerald-600" : isAttended ? "text-amber-600" : isActive ? "animate-pulse text-red-600" : "text-red-600"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
              </svg>
              <span className={`font-extrabold uppercase tracking-wide ${isClosed ? "text-emerald-700" : isAttended ? "text-amber-700" : "text-red-700"}`}>
                {isClosed ? "EMERGENCIA CERRADA" : isAttended ? "EN ATENCIÓN" : "EMERGENCIA ACTIVA"}
              </span>
            </div>
           <div>
            <dl className="space-y-2 text-sm">
              <div className="grid grid-cols-[1rem_minmax(0,1fr)] items-start gap-2">
                <FiUser className="mt-0.5 h-4 w-4 text-slate-400" />
                <dd className="min-w-0 break-words font-medium text-slate-800"><span className="text-slate-400">Usuario: </span>{alert.name || "Usuario no identificado"}</dd>
              </div>
              <div className="grid grid-cols-[1rem_minmax(0,1fr)] items-start gap-2">
                <FiPhone className="mt-0.5 h-4 w-4 text-slate-400" />
                <dd className="min-w-0 break-all font-medium text-slate-800"><span className="text-slate-400">Teléfono: </span>{alert.phone || "Teléfono no registrado"}</dd>
              </div>
              <div className="grid grid-cols-[1rem_minmax(0,1fr)] items-start gap-2">
                <FiMapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                <dd className="min-w-0 break-words font-medium text-slate-800"><span className="text-slate-400">Coordenadas: </span>{alert.lat.toFixed(6)}, {alert.lng.toFixed(6)}</dd>
              </div>
              <div className="grid grid-cols-[1rem_minmax(0,1fr)] items-start gap-2">
                <FiClock className="mt-0.5 h-4 w-4 text-slate-400" />
                <dd className="min-w-0 break-words font-medium text-slate-800"><span className="text-slate-400">Hora: </span>{emergencyTime}</dd>
              </div>
            </dl>
           </div>

            {isClosed ? (
              <button className="w-full rounded bg-emerald-600 py-2 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700">
                Ver detalle
                <i className="fa-solid fa-angle-right ml-2" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onAttend(alert.id, alert.alertId, alert.emitterId, alert.emitterId)}
                  className="w-full rounded bg-red-600 py-2 text-sm font-bold text-white shadow-md transition hover:bg-red-700"
                >
                  Atender Emergencia
                  <i className="fa-solid fa-angle-right ml-2" />
                </button>
                <button className="w-full rounded bg-gray-200 py-2 text-sm font-bold text-gray-800 shadow-md transition hover:bg-gray-300">
                  Ver cámaras
                  <i className="fa-solid fa-camera ml-2" />
                </button>
              </>
            )}
          </div>
        </Popup>
      )}
    </>
  );
};
