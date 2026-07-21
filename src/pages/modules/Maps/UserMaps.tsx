import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, NavigationControl, Popup, type MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { User } from "../../../types/user.types";

interface UsersMapProps {
  users: User[];
  zoom?: number;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const defaultCenter = { lat: -3.683, lng: -79.675 };

const UsersMap = ({ users, zoom = 15 }: UsersMapProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const mapRef = useRef<MapRef | null>(null);

  const validUsers = useMemo(() => users.filter((user) => {
    const coordinates = user.lastLocation?.coordinates;
    return coordinates?.length === 2 && (coordinates[0] !== 0 || coordinates[1] !== 0);
  }), [users]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!validUsers.length) {
      map.flyTo({ center: [defaultCenter.lng, defaultCenter.lat], zoom });
      return;
    }

    const longitudes = validUsers.map((user) => user.lastLocation.coordinates[0]);
    const latitudes = validUsers.map((user) => user.lastLocation.coordinates[1]);
    map.fitBounds([[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]], {
      padding: 56,
      maxZoom: validUsers.length === 1 ? zoom : 16,
    });
  }, [validUsers, zoom]);

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
    >
      <NavigationControl position="top-right" />
      {validUsers.map((user) => (
        <Marker
          key={user._id}
          longitude={user.lastLocation.coordinates[0]}
          latitude={user.lastLocation.coordinates[1]}
          anchor="bottom"
          color="#0284c7"
          onClick={(event) => {
            event.originalEvent.stopPropagation();
            setSelectedUser(user);
          }}
        />
      ))}
      {selectedUser && (
        <Popup
          longitude={selectedUser.lastLocation.coordinates[0]}
          latitude={selectedUser.lastLocation.coordinates[1]}
          anchor="bottom"
          closeOnClick={false}
          onClose={() => setSelectedUser(null)}
        >
          <div className="max-w-xs p-1">
            <h3 className="mb-1 text-base font-bold">{selectedUser.name}</h3>
            <p className="mb-1 text-sm">{selectedUser.email}</p>
            <p className="mb-1 text-sm">{selectedUser.phone}</p>
            <p className="mt-1 text-xs text-gray-500">Última actualización: {new Date(selectedUser.lastLocation.lastUpdated).toLocaleString()}</p>
          </div>
        </Popup>
      )}
    </Map>
  );
};

export default UsersMap;
