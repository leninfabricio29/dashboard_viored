import { Marker, InfoWindow } from "@react-google-maps/api";
import { useState } from "react";

type EmergencyMarkerProps = {
  alert: {
    id: string;
    notifyId: string;
    lat: number;
    lng: number;
    name: string;
    phone: string;
    emitterId: string;
  };
  onAttend: (
    id: string,
    notifyId: string,
    userId: string,
    recipientId: string
  ) => void;
};

export const EmergencyMarker = ({ alert, onAttend }: EmergencyMarkerProps) => {
  const [showInfo, setShowInfo] = useState(true);

  const emergencyIcon = {
    url:
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#FF1744" stroke="#fff" stroke-width="3"/>
        <circle cx="20" cy="20" r="12" fill="#fff"/>
        <text x="20" y="26" font-family="Arial" font-size="16" font-weight="bold" 
              text-anchor="middle" fill="#FF1744">⚠</text>
      </svg>
    `),
    scaledSize: new window.google.maps.Size(40, 40),
    anchor: new window.google.maps.Point(20, 20),
  };

  return (
    <>
      <Marker
        position={{ lat: alert.lat, lng: alert.lng }}
        onClick={() => setShowInfo(true)}
        icon={emergencyIcon}
      />

      {showInfo && (
        <InfoWindow
          position={{ lat: alert.lat, lng: alert.lng }}
          onCloseClick={() => setShowInfo(false)}
          options={{ pixelOffset: new window.google.maps.Size(0, -40) }}
        >
          <div className="min-w-[220px] p-3 font-sans bg-gradient-to-br from-white to-gray-50 rounded-md shadow border">
            <div className="flex items-center mb-3 pb-2 border-b border-red-500">
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center mr-2 text-sm">🚨</div>
              <div>
                <h4 className="m-0 text-base font-bold text-gray-900 leading-tight">Alerta</h4>
                <p className="m-0 text-[10px] text-gray-600">Atención inmediata</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center p-1.5 bg-gray-50 rounded">
                <span className="text-sm mr-1.5">👤</span>
                <div className="text-[11px] leading-tight">
                  <p className="m-0 text-gray-500 font-semibold uppercase">Nombre</p>
                  <p className="m-0 text-gray-900 font-medium">{alert.name}</p>
                </div>
              </div>

              <div className="flex items-center p-1.5 bg-gray-50 rounded">
                <span className="text-sm mr-1.5">📞</span>
                <div className="text-[11px] leading-tight">
                  <p className="m-0 text-gray-500 font-semibold uppercase">Teléfono</p>
                  <p className="m-0 text-gray-900 font-medium">{alert.phone}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-1 mt-3">
              <button
                onClick={() =>
                  onAttend(
                    alert.id,
                    alert.notifyId,
                    alert.emitterId, // quien atiende (simulación)
                    alert.emitterId  // quien emitió la alerta
                  )
                }
                className="flex-1 px-2.5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-all"
              >
                Atender
              </button>
            </div>

            <div className="mt-2 px-2 py-1 bg-orange-50 rounded border border-orange-200 flex items-center justify-center text-[10px] text-orange-800 font-semibold">
              <div className="w-1 h-1 bg-orange-500 rounded-full mr-1 animate-pulse"></div>
              EMERGENCIA ACTIVA
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};
