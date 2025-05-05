// NeighborhoodMapEditor.tsx (nuevo componente basado en NeighborhoodsMap)
import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Polygon, InfoWindow } from '@react-google-maps/api';

interface NeighborhoodMapEditorProps {
  initialCoordinates?: [number, number][];
  onPolygonComplete?: (coordinates: [number, number][]) => void;
}

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem'
};

const NeighborhoodMapEditor = ({ 
  initialCoordinates = [0, 0],
  onPolygonComplete 
}: NeighborhoodMapEditorProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingMode, setDrawingMode] = useState<boolean>(true);
  const [polygonPath, setPolygonPath] = useState<google.maps.LatLng[]>([]);
  const [mapCenter] = useState({ lat: -3.683, lng: -79.675 });

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyBJV8sX5ObZJB4V0gy6ILSqjEcVOYOMcZ4'
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!drawingMode || !e.latLng) return;
    
    const newPath = [...polygonPath, e.latLng];
    setPolygonPath(newPath);
    
    // Si hay al menos 3 puntos, podemos considerar un polígono válido
    if (newPath.length >= 3 && onPolygonComplete) {
      const coordinates = newPath.map(latLng => [latLng.lng(), latLng.lat()] as [number, number]);
      onPolygonComplete(coordinates);
    }
  }, [drawingMode, polygonPath, onPolygonComplete]);

  const resetDrawing = useCallback(() => {
    setPolygonPath([]);
  }, []);

  if (loadError) {
    return <div className="h-full w-full rounded-md bg-red-100 flex items-center justify-center text-red-500">Error al cargar el mapa</div>;
  }

  if (!isLoaded) {
    return <div className="h-full w-full rounded-md bg-gray-100 flex items-center justify-center">Cargando mapa...</div>;
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium">Dibuja el área del barrio</h4>
        <button 
          onClick={resetDrawing}
          className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
        >
          Reiniciar dibujo
        </button>
      </div>
      
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          fullscreenControl: true,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          draggableCursor: drawingMode ? 'crosshair' : 'pointer'
        }}
      >
        {polygonPath.length > 0 && (
          <Polygon
            paths={polygonPath}
            options={{
              fillColor: '#3b82f6',
              fillOpacity: 0.4,
              strokeColor: '#1d4ed8',
              strokeOpacity: 1,
              strokeWeight: 2,
              clickable: false
            }}
          />
        )}
        
        {polygonPath.length > 0 && (
          <InfoWindow
            position={polygonPath[polygonPath.length - 1]}
          >
            <div className="text-xs p-1">
              {polygonPath.length} puntos<br />
              {polygonPath.length >= 3 ? 'Polígono válido' : 'Necesitas al menos 3 puntos'}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

    </div>
  );
};

export default NeighborhoodMapEditor;