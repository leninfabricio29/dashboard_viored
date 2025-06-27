// src/components/MapAlert.tsx

import React from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

type MapAlertProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  height?: string;
  width?: string;
};

const MapAlert: React.FC<MapAlertProps> = ({
  latitude,
  longitude,
  zoom = 15,
  height = '400px',
  width = '100%',
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyBJV8sX5ObZJB4V0gy6ILSqjEcVOYOMcZ4', // Tu clave aquí

  });

  if (loadError) return <div>Error al cargar el mapa</div>;
  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <div style={{ width, height, borderRadius: '12px', overflow: 'hidden' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat: latitude, lng: longitude }}
        zoom={zoom}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        <Marker position={{ lat: latitude, lng: longitude }} />
      </GoogleMap>
    </div>
  );
};

export default MapAlert;
