import { useCallback, useMemo, useState } from "react";
import Map, { Layer, Marker, NavigationControl, Popup, Source, type MapLayerMouseEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface NeighborhoodMapEditorProps {
  initialCoordinates?: [number, number][];
  onPolygonComplete?: (coordinates: [number, number][]) => void;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const mapCenter = { lat: -3.683, lng: -79.675 };

const NeighborhoodMapEditor = ({ initialCoordinates = [], onPolygonComplete }: NeighborhoodMapEditorProps) => {
  const [polygonPath, setPolygonPath] = useState<[number, number][]>(initialCoordinates);

  const polygonData = useMemo(() => ({
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [polygonPath.length >= 3 ? [...polygonPath, polygonPath[0]] : polygonPath],
    },
  }), [polygonPath]);

  const handleMapClick = useCallback((event: MapLayerMouseEvent) => {
    const point: [number, number] = [event.lngLat.lng, event.lngLat.lat];
    setPolygonPath((currentPath) => {
      const nextPath = [...currentPath, point];
      if (nextPath.length >= 3) onPolygonComplete?.([...nextPath, nextPath[0]]);
      return nextPath;
    });
  }, [onPolygonComplete]);

  const resetDrawing = useCallback(() => setPolygonPath([]), []);

  if (!MAPBOX_TOKEN) {
    return <div className="flex h-full w-full items-center justify-center rounded-md bg-red-100 text-red-600">Configura VITE_MAPBOX_TOKEN para cargar el mapa.</div>;
  }

const lastPoint = polygonPath[polygonPath.length - 1];
  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-medium">Dibuja el área del barrio</h4>
        <button
          onClick={resetDrawing}
          className="rounded bg-gray-200 px-2 py-1 text-xs transition-colors hover:bg-gray-300"
          disabled={polygonPath.length === 0}
        >
          Reiniciar dibujo
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg">
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{ longitude: mapCenter.lng, latitude: mapCenter.lat, zoom: 14 }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          style={{ width: "100%", height: "100%" }}
          cursor="crosshair"
          onClick={handleMapClick}
        >
          <NavigationControl position="top-right" />
          {polygonPath.length >= 3 && (
            <Source id="drawing-polygon" type="geojson" data={polygonData}>
              <Layer id="drawing-polygon-fill" type="fill" paint={{ "fill-color": "#3b82f6", "fill-opacity": 0.4 }} />
              <Layer id="drawing-polygon-outline" type="line" paint={{ "line-color": "#1d4ed8", "line-width": 2 }} />
            </Source>
          )}
          {polygonPath.map(([lng, lat], index) => <Marker key={`${lng}-${lat}-${index}`} longitude={lng} latitude={lat} color="#1d4ed8" />)}
          {lastPoint && (
            <Popup longitude={lastPoint[0]} latitude={lastPoint[1]} closeButton={false} closeOnClick={false} anchor="bottom">
              <div className="p-1 text-xs">
                {polygonPath.length} puntos<br />
                {polygonPath.length >= 3 ? "Polígono válido" : "Necesitas al menos 3 puntos"}
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
};

export default NeighborhoodMapEditor;
