// src/components/ui/NeighborhoodsMap.tsx
import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Polygon, InfoWindow } from '@react-google-maps/api';
import { Neighborhood } from '../../../types/neighborhood.types';

interface NeighborhoodsMapProps {
  neighborhoods: Neighborhood[];
  zoom?: number;
}

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem'
};

// Centro por defecto (Piñas, Ecuador)
const defaultCenter = { lat: -3.683, lng: -79.675 };

// Función para generar colores aleatorios
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const NeighborhoodsMap = ({ neighborhoods, zoom = 12 }: NeighborhoodsMapProps) => {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [neighborhoodColors] = useState(() => {
    const colors: Record<string, string> = {};
    neighborhoods.forEach(n => {
      colors[n._id] = getRandomColor();
    });
    return colors;
  });

  // Logs para debugging
  useEffect(() => {
    console.log(setMapCenter)
    neighborhoods.forEach(n => {
      if (n.area?.coordinates?.[0]) {
       
      } else {
        console.log(`Barrio ${n.name} no tiene coordenadas válidas`);
      }
    });
  }, [neighborhoods]);

  // Cargar la API de Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyBJV8sX5ObZJB4V0gy6ILSqjEcVOYOMcZ4'
  });

  // Callbacks para gestionar el mapa
  const onLoad = useCallback((map: google.maps.Map) => {
    console.log("Mapa cargado");
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Filtrar barrios con coordenadas válidas
  const validNeighborhoods = neighborhoods.filter(n => 
    (n.area?.coordinates?.[0]?.length ?? 0) >= 3
  );

  // Ajustar los límites del mapa para mostrar todos los polígonos
  useEffect(() => {
    if (map && validNeighborhoods.length > 0) {
      try {
        const bounds = new google.maps.LatLngBounds();
        let hasValidPoints = false;
        
        validNeighborhoods.forEach(neighborhood => {
          if (neighborhood.area?.coordinates && neighborhood.area.coordinates[0]) {
            neighborhood.area.coordinates[0].forEach(coord => {
              // GeoJSON usa [longitud, latitud]
              const lng = coord[0];
              const lat = coord[1];
              
              console.log(`Punto de ${neighborhood.name}:`, { lat, lng });
              
              // Verificar que las coordenadas están en rango
              if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                bounds.extend({ lat, lng });
                hasValidPoints = true;
              } else {
                console.warn(`Coordenada fuera de rango en ${neighborhood.name}:`, coord);
              }
            });
          }
        });
        
        if (hasValidPoints) {
          console.log("Ajustando mapa a los límites");
          map.fitBounds(bounds);
        } else {
          console.log("No hay puntos válidos, usando centro por defecto");
          map.setCenter(mapCenter);
          map.setZoom(zoom);
        }
      } catch (error) {
        console.error("Error al ajustar los límites del mapa:", error);
        map.setCenter(mapCenter);
        map.setZoom(zoom);
      }
    } else if (map) {
      console.log("No hay barrios válidos, usando centro por defecto");
      map.setCenter(mapCenter);
      map.setZoom(zoom);
    }
  }, [map, validNeighborhoods, mapCenter, zoom]);

  // Mostrar mensaje de carga o error
  if (loadError) {
    return <div className="h-full w-full rounded-md bg-red-100 flex items-center justify-center text-red-500">Error al cargar el mapa: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div className="h-full w-full rounded-md bg-gray-100 flex items-center justify-center">Cargando mapa...</div>;
  }

  if (validNeighborhoods.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-2">No hay barrios con coordenadas válidas</p>
        <GoogleMap
          mapContainerStyle={{ ...containerStyle, height: '90%' }}
          center={mapCenter}
          zoom={zoom}
          options={{
            fullscreenControl: true,
            zoomControl: true,
            streetViewControl: true,
            mapTypeControl: true
          }}
        />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
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
      {validNeighborhoods.map(neighborhood => {
        if (!neighborhood.area?.coordinates || !neighborhood.area.coordinates[0]) return null;
        
        // Convertir coordenadas al formato que espera Google Maps (corregido)
        const paths = neighborhood.area.coordinates[0].map(coord => {
          // GeoJSON usa [longitud, latitud]
          const lng = coord[0];
          const lat = coord[1];
          return { lat, lng };
        });
        
        console.log(`Polígono de ${neighborhood.name}:`, paths);
        
        const color = neighborhoodColors[neighborhood._id] || '#FF0000';
        
        return (
          <Polygon
            key={neighborhood._id}
            paths={paths}
            options={{
              fillColor: color,
              fillOpacity: 0.3,
              strokeColor: color,
              strokeOpacity: 1,
              strokeWeight: 2
            }}
            onClick={() => setSelectedNeighborhood(neighborhood)}
          />
        );
      })}

      {selectedNeighborhood && selectedNeighborhood.area?.coordinates && (
        <InfoWindow
          position={{
            // GeoJSON usa [longitud, latitud]
            lat: selectedNeighborhood.area.coordinates[0][0][1],
            lng: selectedNeighborhood.area.coordinates[0][0][0]
          }}
          onCloseClick={() => setSelectedNeighborhood(null)}
        >
          <div className="p-2 max-w-xs">
            <h3 className="font-bold text-base mb-1">{selectedNeighborhood.name}</h3>
            {selectedNeighborhood.description && (
              <p className="text-sm mb-1">{selectedNeighborhood.description}</p>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default NeighborhoodsMap;