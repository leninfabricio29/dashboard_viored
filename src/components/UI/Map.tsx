// src/components/ui/Map.tsx
import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

interface MapProps {
  coordinates: [number, number]; // [longitud, latitud] en formato GeoJSON
  zoom?: number;
}

// Estilos para el contenedor del mapa
const containerStyle = {
  width: '100%',
  height: '24rem', // Equivalente a h-96 en Tailwind
  borderRadius: '0.375rem' // Equivalente a rounded-md en Tailwind
};

const Map = ({ coordinates, zoom = 18 }: MapProps) => {
  // Invertimos las coordenadas para Google Maps [lng, lat] → {lat, lng}
  console.log(coordinates)
  const [lng, lat] = coordinates;
  console.log(lng, lat)

  const center = { lng, lat }; // Nota la inversión aquí
  console.log(center)
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  console.log(map)
  const [infoOpen, setInfoOpen] = useState(false);

  // Cargar la API de Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyBJV8sX5ObZJB4V0gy6ILSqjEcVOYOMcZ4' // Reemplaza con tu API key
  });

  // Callbacks para gestionar el mapa
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Mostrar mensaje de carga o error
  if (loadError) {
    return <div className="h-96 w-full rounded-md bg-red-100 flex items-center justify-center text-red-500">Error al cargar el mapa</div>;
  }

  if (!isLoaded) {
    return <div className="h-96 w-full rounded-md bg-gray-100 flex items-center justify-center">Cargando mapa...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
        mapTypeControl: true
      }}
    >
      <Marker
        position={center}
        onClick={() => setInfoOpen(true)}
      />
      
      {infoOpen && (
        <InfoWindow
          position={center}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div className="p-2">
            <p className="font-medium">Ubicación del usuario</p>
            <p className="text-sm text-gray-600">
              Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}
            </p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default Map;