import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, NavigationControl, Popup, Source, type MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Neighborhood } from "../../../types/neighborhood.types";

interface NeighborhoodsMapProps {
  neighborhoods: Neighborhood[];
  zoom?: number;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const defaultCenter = { lat: -3.683, lng: -79.675 };

const colorFor = (id: string) => {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) hash = id.charCodeAt(index) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360} 70% 45%)`;
};

const NeighborhoodsMap = ({ neighborhoods, zoom = 12 }: NeighborhoodsMapProps) => {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);
  const mapRef = useRef<MapRef | null>(null);
  const validNeighborhoods = useMemo(() => neighborhoods.filter((neighborhood) => (neighborhood.area?.coordinates?.[0]?.length ?? 0) >= 3), [neighborhoods]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const points = validNeighborhoods.flatMap((neighborhood) => neighborhood.area?.coordinates[0] || []);
    if (!points.length) {
      map.flyTo({ center: [defaultCenter.lng, defaultCenter.lat], zoom });
      return;
    }
    const longitudes = points.map(([lng]) => lng);
    const latitudes = points.map(([, lat]) => lat);
    map.fitBounds([[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]], { padding: 56, maxZoom: 16 });
  }, [validNeighborhoods, zoom]);

  const polygons = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: validNeighborhoods.map((neighborhood) => ({
      type: "Feature" as const,
      properties: { id: neighborhood._id, color: colorFor(neighborhood._id) },
      geometry: { type: "Polygon" as const, coordinates: neighborhood.area!.coordinates },
    })),
  }), [validNeighborhoods]);

  if (!MAPBOX_TOKEN) {
    return <div className="flex h-full w-full items-center justify-center rounded-md bg-red-100 text-red-600">Configura VITE_MAPBOX_TOKEN para cargar el mapa.</div>;
  }

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{ longitude: defaultCenter.lng, latitude: defaultCenter.lat, zoom }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      style={{ width: "100%", height: "100%", borderRadius: "0.5rem" }}
      interactiveLayerIds={["neighborhood-fill"]}
      onClick={(event) => {
        const id = event.features?.[0]?.properties?.id;
        setSelectedNeighborhood(validNeighborhoods.find((neighborhood) => neighborhood._id === id) || null);
      }}
    >
      <NavigationControl position="top-right" />
      <Source id="neighborhoods" type="geojson" data={polygons}>
        <Layer id="neighborhood-fill" type="fill" paint={{ "fill-color": ["get", "color"], "fill-opacity": 0.3 }} />
        <Layer id="neighborhood-outline" type="line" paint={{ "line-color": ["get", "color"], "line-width": 2 }} />
      </Source>
      {selectedNeighborhood?.area?.coordinates?.[0]?.[0] && (
        <Popup
          longitude={selectedNeighborhood.area.coordinates[0][0][0]}
          latitude={selectedNeighborhood.area.coordinates[0][0][1]}
          closeOnClick={false}
          onClose={() => setSelectedNeighborhood(null)}
        >
          <div className="max-w-xs p-1">
            <h3 className="mb-1 text-base font-bold">{selectedNeighborhood.name}</h3>
            {selectedNeighborhood.description && <p className="text-sm">{selectedNeighborhood.description}</p>}
          </div>
        </Popup>
      )}
    </Map>
  );
};

export default NeighborhoodsMap;
