import React from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { EmergencyMarker } from './EmergencyMarket';
import { AlertData } from './AlertMapContainer';

type MapAlertProps = {
  markers: AlertData[];
  zoom?: number;
  height?: string;
  width?: string;
  onAttend: (
    id: string,
    notifyId: string,
    userId: string,
    recipientId: string
  ) => void;
};

const MapAlert: React.FC<MapAlertProps> = ({
  markers,
  zoom = 14,
  height = '100vh',
  width = '100%',
  onAttend,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyBJV8sX5ObZJB4V0gy6ILSqjEcVOYOMcZ4',
  });

  if (loadError) return <div>Error al cargar el mapa</div>;
  if (!isLoaded) return <div>Cargando mapa...</div>;

  const center =
    markers.length > 0
      ? { lat: markers[0].lat, lng: markers[0].lng }
      : { lat: -3.6811, lng: -79.6801 };

  return (
    <div style={{ width, height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={zoom}
        options={{ disableDefaultUI: true, zoomControl: true }}
      >
        {markers.map((alert) => (
          <EmergencyMarker
            key={alert.id}
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
        ))}
      </GoogleMap>
    </div>
  );
};

export default MapAlert;
