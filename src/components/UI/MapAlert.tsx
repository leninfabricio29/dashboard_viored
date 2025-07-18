import React, { useEffect, useState, useRef } from 'react';
import Map, { Marker, useMap } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AlertData } from './AlertMapContainer';
import { EmergencyMarker } from './EmergencyMarket';

type MapAlertProps = {
  markers: AlertData[];
  zoom?: number;
  alertZoom?: number; // Nuevo prop para el zoom de alertas
  height?: string;
  width?: string;
  onAttend: (
    id: string,
    notifyId: string,
    userId: string,
    recipientId: string
  ) => void;
};

export const mapboxStyles: string[] = [
  'mapbox://styles/mapbox/light-v11',
  'mapbox://styles/mapbox/navigation-night-v1',
  'mapbox://styles/mapbox/satellite-streets-v11'
];

function getMapboxStyle(index: number = 0): string {
  return mapboxStyles[index] || mapboxStyles[0];
}

// Componente interno que usa useMap()
const MapController: React.FC<{ markers: AlertData[], zoom: number, alertZoom?: number }> = ({ 
  markers,  
  alertZoom = 17 // Zoom muy cercano para ver la alerta
}) => {
  const { current: map } = useMap();
  const lastMarkerId = useRef<string | null>(null);

  useEffect(() => {
    console.log('MapController useEffect triggered:', { 
      mapExists: !!map, 
      markersLength: markers.length,
      lastMarkerId: lastMarkerId.current
    });

    if (!map || markers.length === 0) return;

    const lastAlert = markers[markers.length - 1];
    console.log('Last alert:', lastAlert);

    // Si es una nueva alerta (diferente a la última procesada)
    if (lastAlert.id !== lastMarkerId.current) {
      console.log('Flying to alert:', {
        center: [lastAlert.lng, lastAlert.lat],
        zoom: alertZoom, // SIEMPRE usa alertZoom para TODAS las alertas
        newAlertId: lastAlert.id,
        previousAlertId: lastMarkerId.current
      });

      map.flyTo({
        center: [lastAlert.lng, lastAlert.lat],
        zoom: alertZoom, // SIEMPRE zoom 19 para alertas
        duration: 2000,
        essential: true
      });

      // Actualizar la referencia de la última alerta procesada
      lastMarkerId.current = lastAlert.id;
    }
  }, [map, markers, alertZoom]);

  return null; // Este componente no renderiza nada
};

const MapAlert: React.FC<MapAlertProps> = ({ 
  markers, 
  zoom = 14, 
  alertZoom = 17, // Zoom muy cercano por defecto
  height = '100vh', 
  width = '100%', 
  onAttend 
}) => {
  const [styleIndex, setStyleIndex] = useState(0);

  // Centro inicial basado en la primera alerta o una ubicación por defecto
  const initialCenter = markers.length > 0
    ? { latitude: markers[0].lat, longitude: markers[0].lng }
    : { latitude: -3.6811, longitude: -79.6801 };

  return (
    <div style={{ width, height }}>
      <div className="absolute left-5 top-5 z-10 bg-white/95 rounded-lg shadow-lg px-4 py-2 flex items-center">
        <label htmlFor="map-style-select" className="mr-2 font-medium text-gray-700">
          Estilo de mapa:
        </label>
        <select
          id="map-style-select"
          value={styleIndex}
          onChange={(e) => setStyleIndex(Number(e.target.value))}
          className="px-3 py-1 rounded border border-gray-300 bg-white text-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-400"
        >
          {mapboxStyles.map((style, idx) => (
            <option key={style} value={idx}>
              {style.split('/').pop()}
            </option>
          ))}
        </select>
      </div>
      
      <Map
        mapboxAccessToken={"pk.eyJ1IjoibGVuaW5mYWJyaWNpbyIsImEiOiJjbWQ2YXRtOXkwN2hjMm1vbHR4ajB3aWZ1In0.jqum9A3LkzXukkDLBLO9kQ"}
        initialViewState={{
          longitude: initialCenter.longitude,
          latitude: initialCenter.latitude,
          zoom: zoom
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={getMapboxStyle(styleIndex)}
      >
        {/* Componente que maneja la navegación del mapa */}
        <MapController markers={markers} zoom={zoom} alertZoom={alertZoom} />
        
        {markers.map((alert) => (
          <Marker
        key={alert.id}
        longitude={alert.lng}
        latitude={alert.lat}
          >
        <EmergencyMarker
          alert={{
            id: alert.id,
            notifyId: alert.notifyId,
            lat: alert.lat,
            lng: alert.lng,
            name: alert.emitterName,
            phone: alert.emitterPhone,
            emitterId: alert.emitterId,
          }}
          onAttend={onAttend}
        />
          </Marker>
        ))}
      </Map>
    </div>
  );
};

export default MapAlert;