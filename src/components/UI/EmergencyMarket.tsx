import { useState } from "react";
import { Popup } from "react-map-gl";

type EmergencyMarkerProps = {
  alert: {
    id: string;
    alertId: string;
    lat: number;
    lng: number;
    name: string;
    phone: string;
    emitterId: string;
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

  return (
    <>
      <div
        onClick={() => setShowPopup(true)}
        className="relative w-6 h-6 z-10 cursor-pointer"
        title={alert.name}
      >
        {/* Outer ping effect */}
        <div className="absolute inset-0 w-8 h-8 bg-red-500 rounded-full animate-ping opacity-70"></div>
        <div className="absolute inset-1 w-6 h-6 bg-red-600 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.2s' }}></div>

        {/* Center dot */}
        <div className="relative w-3.5 h-3.5 bg-red-700 rounded-full border-2 border-white z-10 shadow-md"></div>
        {/* Show alert name below marker */}
        <div className="absolute left-1/2 -translate-x-1/2 top-7 text-xs bg-gray-100 px-2 py-0.5 rounded shadow text-gray-800 font-semibold pointer-events-none">
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
          <div className="relative bg-white text-sm p-4 rounded-xl border-2 border-red-500 shadow-xl w-64 min-w-[16rem] max-w-xs space-y-3 flex flex-col items-stretch">
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
              className="absolute top-2 right-2 z-20 p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors shadow"
              aria-label="Cerrar alerta"
              tabIndex={0}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center gap-2 mt-2">
              <svg className="w-6 h-6 text-red-600 animate-pulse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
              </svg>
              <span className="text-red-700 font-extrabold uppercase tracking-wide">Emergencia</span>
            </div>
            <p className="text-gray-800 font-bold truncate">Emisor: <span className=" text-red-700">{alert.name}</span></p>
            <p className="text-gray-800 font-bold truncate">Llamar a: <span className="text-red-700">{alert.phone}</span></p>
            <button
              onClick={() =>
                onAttend(alert.id, alert.alertId, alert.emitterId, alert.emitterId)
              }
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded shadow-md transition"
            >
               Atender Emergencia
            </button>
          </div>
        </Popup>
      )}
    </>
  );
};