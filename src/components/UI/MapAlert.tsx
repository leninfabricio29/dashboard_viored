import React, { useEffect, useState, useRef } from 'react';
import Map, { Marker, useMap, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AlertData } from './AlertMapContainer';
import { EmergencyMarker } from './EmergencyMarket';

type MapAlertProps = {
  markers: AlertData[];
  zoom?: number;
  alertZoom?: number; // Nuevo prop para el zoom de alertas
  route?: {lat: number; lng: number}[]; // Nueva prop para la ruta
  height?: string;
  width?: string;
  onAttend: (
    id: string,
    alertId: string,
    userId: string,
    recipientId: string
  ) => void;
};

export const mapboxStyles: { key: string; value: string; name: string }[] = [
  {
    key: 'dark',
    value: 'mapbox://styles/mapbox/navigation-night-v1',
    name: 'Oscuro'
  },
  {
    key: 'light',
    value: 'mapbox://styles/mapbox/light-v11',
    name: 'Claro'
  },
  {
    key: 'satellite',
    value: 'mapbox://styles/mapbox/satellite-streets-v11',
    name: 'Satélite'
  }
];

function getMapboxStyle(index: number = 0): string {
  return mapboxStyles[index]?.value || mapboxStyles[0].value;
}

// Componente interno que usa useMap()
const MapController: React.FC<{ markers: AlertData[], zoom: number, alertZoom?: number, isMapLoaded: boolean }> = ({ 
  markers,  
  alertZoom = 17, // Zoom muy cercano para ver la alerta
  isMapLoaded
}) => {
  const { current: map } = useMap();
  const lastMarkerId = useRef<string | null>(null);

  useEffect(() => {
    console.log('MapController useEffect triggered:', { 
      mapExists: !!map, 
      markersLength: markers.length,
      lastMarkerId: lastMarkerId.current,
      isMapLoaded
    });

    // Esperar a que el mapa esté cargado y haya marcadores
    if (!map || !isMapLoaded || markers.length === 0) return;

    const lastAlert = markers[markers.length - 1];
    console.log('Last alert:', lastAlert);

    // Si es una nueva alerta (diferente a la última procesada)
    if (lastAlert.id !== lastMarkerId.current) {
      console.log('Flying to alert:', {
        center: [lastAlert.lng, lastAlert.lat],
        zoom: alertZoom,
        newAlertId: lastAlert.id,
        previousAlertId: lastMarkerId.current
      });

      try {
        map.flyTo({
          center: [lastAlert.lng, lastAlert.lat],
          zoom: alertZoom,
          duration: 2000,
          essential: true
        });

        // Actualizar la referencia de la última alerta procesada
        lastMarkerId.current = lastAlert.id;
      } catch (error) {
        console.error('Error during flyTo:', error);
      }
    }
  }, [map, markers, alertZoom, isMapLoaded]);

  return null; // Este componente no renderiza nada
};

const MapAlert: React.FC<MapAlertProps> = ({ 
  markers, 
  route = [],
  zoom = 14, 
  alertZoom = 17, // Zoom muy cercano por defecto
  height = '100vh', 
  width = '100%', 
  onAttend 
}) => {
  const [styleIndex, setStyleIndex] = useState(0);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Centro inicial basado en la primera alerta o una ubicación por defecto
  const initialCenter = markers.length > 0
    ? { latitude: markers[0].lat, longitude: markers[0].lng }
    : { latitude: -3.6811, longitude: -79.6801 };
  
  const handleMapLoad = () => {
    console.log('✅ Mapa completamente cargado');
    setIsMapLoaded(true);
  };
  
  // Resetear isMapLoaded cuando cambia el estilo
  const handleStyleChange = (newIndex: number) => {
    setIsMapLoaded(false);
    setStyleIndex(newIndex);
  };

  return (
    <div style={{ width, height }}>
      <div className="absolute left-5 top-5 z-10 bg-white/95 rounded-lg shadow-lg px-4 py-2 flex items-center">
        <label htmlFor="map-style-select" className="mr-2 font-medium text-gray-700">
          Estilo de mapa:
        </label>
        <select
          id="map-style-select"
          value={styleIndex}
          onChange={(e) => handleStyleChange(Number(e.target.value))}
          className="px-3 py-1 rounded border border-gray-300 bg-white text-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-400"
        >
            {mapboxStyles.map((style, idx) => (
            <option key={style.key} value={idx}>
              {style.name}
            </option>
            ))}
        </select>
      </div>
      
      <Map
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        initialViewState={{
          longitude: initialCenter.longitude,
          latitude: initialCenter.latitude,
          zoom: zoom
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={getMapboxStyle(styleIndex)}
        onLoad={handleMapLoad}
      >
        {route.length > 1 && (
  <Source
    id="route"
    type="geojson"
    data={{
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: route.map(point => [point.lng, point.lat])
      },
      properties: {}
    }}
  >
    <Layer
      id="route-line"
      type="line"
      paint={{
        "line-color": "#ff0000",
        "line-width": 4
      }}
    />
  </Source>
)}
        {/* Componente que maneja la navegación del mapa */}
        <MapController markers={markers} zoom={zoom} alertZoom={alertZoom} isMapLoaded={isMapLoaded} />
        
        {markers.map((alert) => (
          <Marker
        key={alert.id}
        longitude={alert.lng}
        latitude={alert.lat}
          >
        <EmergencyMarker
          alert={{
            id: alert.id,
            alertId: alert.alertId,
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