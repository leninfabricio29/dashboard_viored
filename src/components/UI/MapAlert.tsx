import React, { useEffect, useState, useRef } from 'react';
import Map, { Marker, useMap, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import { AlertData } from './AlertMapContainer';
import { EmergencyMarker } from './EmergencyMarket';

type MapAlertProps = {
  markers: AlertData[];
  selectedAlertId?: string | null;
  zoom?: number;
  alertZoom?: number;
  route?: { lat: number; lng: number }[];
  height?: string;
  width?: string;
  mapRef?: React.MutableRefObject<any>;
  onAttend?: (
    id: string,
    alertId?: string,
    userId?: string,
    recipientId?: string
  ) => void;
  onViewCameras?: (alertId: string, cameras: any[]) => void;
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

// Componente interno que maneja la cámara y ajuste automático de límites (fitBounds)
const MapController: React.FC<{
  markers: AlertData[];
  selectedAlertId?: string | null;
  zoom: number;
  alertZoom?: number;
  isMapLoaded: boolean;
}> = ({ markers, selectedAlertId, alertZoom = 15 }) => {
  const { current: map } = useMap();
  const lastStateKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !markers || markers.length === 0) return;

    // Filtrar marcadores con coordenadas válidas
    const validMarkers = markers.filter(
      (m) => m && Number.isFinite(m.lat) && Number.isFinite(m.lng) && (m.lat !== 0 || m.lng !== 0)
    );

    if (validMarkers.length === 0) return;

    const currentSignature = `${selectedAlertId || "none"}|` + validMarkers.map((m) => `${m.id}:${m.lat.toFixed(5)},${m.lng.toFixed(5)}`).join(";");

    if (currentSignature === lastStateKeyRef.current) return;
    lastStateKeyRef.current = currentSignature;

    const applyView = () => {
      try {
        map.resize();
        if (validMarkers.length === 1) {
          map.flyTo({
            center: [validMarkers[0].lng, validMarkers[0].lat],
            zoom: alertZoom,
            duration: 1200,
            essential: true,
          });
        } else {
          // Si hay 2 o más alertas (N alertas), calcular límites con LngLatBounds
          const bounds = new mapboxgl.LngLatBounds();
          validMarkers.forEach((m) => {
            bounds.extend([m.lng, m.lat]);
          });

          map.fitBounds(bounds, {
            padding: 120,
            maxZoom: 15,
            duration: 1500,
            essential: true,
          });
        }
      } catch (error) {
        console.error("Error ajustando cámara de alertas:", error);
      }
    };

    applyView();
    const timer = setTimeout(applyView, 300);
    return () => clearTimeout(timer);
  }, [map, markers, selectedAlertId, alertZoom]);

  return null;
};

const MapAlert: React.FC<MapAlertProps> = ({
  markers,
  selectedAlertId,
  route = [],
  zoom = 14,
  alertZoom = 15,
  height = '100vh',
  width = '100%',
  mapRef,
  onAttend,
  onViewCameras,
}) => {
  const [styleIndex, setStyleIndex] = useState(0);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const initialCenter = markers.length > 0
    ? { latitude: markers[0].lat, longitude: markers[0].lng }
    : { latitude: -3.6811, longitude: -79.6801 };

  const handleMapLoad = () => {
    setIsMapLoaded(true);
  };

  const handleStyleChange = (newIndex: number) => {
    setIsMapLoaded(false);
    setStyleIndex(newIndex);
  };

  return (
    <div style={{ width, height }}>
      <div className="absolute left-5 top-5 z-10 bg-white/95 rounded-lg shadow-lg px-4 py-2 flex items-center border border-slate-200">
        <label htmlFor="map-style-select" className="mr-2 font-medium text-gray-700 text-xs">
          Estilo de mapa:
        </label>
        <select
          id="map-style-select"
          value={styleIndex}
          onChange={(e) => handleStyleChange(Number(e.target.value))}
          className="px-2.5 py-1 rounded border border-gray-300 bg-white text-xs outline-none cursor-pointer focus:ring-2 focus:ring-blue-400"
        >
          {mapboxStyles.map((style, idx) => (
            <option key={style.key} value={idx}>
              {style.name}
            </option>
          ))}
        </select>
      </div>

      <Map
        ref={mapRef}
        preserveDrawingBuffer={true}
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

        {/* Componente que maneja la cámara dinámica para enfocar todas las alertas (fitBounds) */}
        <MapController
          markers={markers}
          selectedAlertId={selectedAlertId}
          zoom={zoom}
          alertZoom={alertZoom}
          isMapLoaded={isMapLoaded}
        />

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
                avatar: alert.avatar,
                lng: alert.lng,
                name: alert.emitterName,
                phone: alert.emitterPhone,
                emitterId: alert.emitterId,
                createdAt: alert.createdAt,
                status: alert.status,
              }}
              onAttend={onAttend}
              onViewCameras={onViewCameras}
            />
          </Marker>
        ))}
      </Map>
    </div>
  );
};

export default MapAlert;
