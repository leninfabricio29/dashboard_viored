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
        <div className="absolute inset-0 w-6 h-6 bg-red-500 rounded-full animate-ping opacity-70"></div>
        <div className="absolute inset-1 w-4 h-4 bg-red-600 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.4s' }}></div>

        {/* Center dot */}
        <div className="relative w-3.5 h-3.5 bg-red-700 rounded-full border-2 border-white z-10 shadow-md"></div>
        {/* Show alert name below marker */}
        <div className="absolute left-1/2 -translate-x-1/2 top-7 text-xs bg-white px-2 py-0.5 rounded shadow text-gray-800 font-semibold pointer-events-none">
          {alert.name}
        </div>
      </div>

      {showPopup && (
        <Popup
          longitude={alert.lng}
          latitude={alert.lat}
          onClose={() => setShowPopup(false)}
          closeOnClick={false}
          anchor="top"
          offset={[0, 10]}
        >
          <div className="text-sm p-2 rounded bg-white shadow border w-56 space-y-2">
            <p className="text-gray-800 font-bold truncate">Llamar a: {alert.phone}</p>
            <button
              onClick={() =>
                onAttend(alert.id, alert.alertId, alert.emitterId, alert.emitterId)
              }
              className="w-full py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded"
            >
              Atender
            </button>
          </div>
        </Popup>
      )}
    </>
  );
};