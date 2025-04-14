// src/components/ui/UsersMap.tsx
import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { User } from '../../../types/user.types';

interface UsersMapProps {
  users: User[];
  zoom?: number;
}

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem'
};

// Centro predeterminado (Piñas, Ecuador)
const defaultCenter = { lat: -3.683, lng: -79.675 };

const UsersMap = ({ users, zoom = 15 }: UsersMapProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Cargar la API de Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyBJV8sX5ObZJB4V0gy6ILSqjEcVOYOMcZ4'
  });

  // Callbacks para gestionar el mapa
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Filtrar usuarios con ubicación válida
  const validUsers = users.filter(user => 
    user.lastLocation?.coordinates && 
    user.lastLocation.coordinates.length === 2 &&
    (user.lastLocation.coordinates[0] !== 0 || user.lastLocation.coordinates[1] !== 0)
  );

  // Ajustar los límites del mapa para mostrar todos los marcadores
  useEffect(() => {
    if (map && validUsers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      
      validUsers.forEach(user => {
        if (user.lastLocation?.coordinates) {
          // GeoJSON usa [longitud, latitud]
          const lng = user.lastLocation.coordinates[0];
          const lat = user.lastLocation.coordinates[1];
          bounds.extend({ lat, lng });
        }
      });
      
      map.fitBounds(bounds);
      
      // Si solo hay un marcador, aplicar el zoom especificado en las props
      if (validUsers.length === 1) {
        // Usar setTimeout para asegurar que se aplique después de fitBounds
        setTimeout(() => {
          if (map) map.setZoom(zoom);
        }, 100);
      }
    } else if (map) {
      // Si no hay usuarios válidos, centrar el mapa en Piñas
      map.setCenter(defaultCenter);
      map.setZoom(zoom);
    }
  }, [map, validUsers, zoom]);

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Mostrar mensaje de carga o error
  if (loadError) {
    return <div className="h-full w-full rounded-md bg-red-100 flex items-center justify-center text-red-500">Error al cargar el mapa</div>;
  }

  if (!isLoaded) {
    return <div className="h-full w-full rounded-md bg-gray-100 flex items-center justify-center">Cargando mapa...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={validUsers.length === 0 ? defaultCenter : undefined}
      zoom={validUsers.length === 0 ? zoom : undefined}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
        mapTypeControl: true
      }}
    >
      {validUsers.map(user => {
        // GeoJSON usa [longitud, latitud]
        const lng = user.lastLocation!.coordinates[0];
        const lat = user.lastLocation!.coordinates[1];
        
        return (
          <Marker
            key={user._id}
            position={{ lat, lng }}
            onClick={() => setSelectedUser(user)}
          />
        );
      })}

      {selectedUser && selectedUser.lastLocation && (
        <InfoWindow
          position={{
            lat: selectedUser.lastLocation.coordinates[1],
            lng: selectedUser.lastLocation.coordinates[0]
          }}
          onCloseClick={() => setSelectedUser(null)}
        >
          <div className="p-2 max-w-xs">
            <h3 className="font-bold text-base mb-1">{selectedUser.name}</h3>
            <p className="text-sm mb-1">{selectedUser.email}</p>
            <p className="text-sm mb-1">{selectedUser.phone}</p>
            <p className="text-xs text-gray-500 mt-1">
              Última actualización: {formatDate(selectedUser.lastLocation.lastUpdated)}
            </p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default UsersMap;