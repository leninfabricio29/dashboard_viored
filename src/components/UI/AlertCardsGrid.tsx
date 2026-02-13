import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socketService from "../../services/socket.service";
import authService from "../../services/auth-service";
import { useSocketConnection, useSocketListener } from "../../hooks/useSocketListener";
import styles from "./AlertCardsGrid.module.css";
import { calculateDistanceKm } from "../../utils/function";
import {
  ClockIcon,
  PinIcon as LocationMarkerIcon,
  PhoneIcon,
} from "lucide-react";

export interface AlertCardData {
  id: string;
  alertId: string;
  lat: number;
  lng: number;
  emitterName: string;
  emitterPhone: string;
  emitterId: string;
  reportedAt?: Date;
}

interface AlertCardsGridProps {
  onTrackingClick: (alertId: string, alertData: AlertCardData) => void;
}

const AlertCardsGrid: React.FC<AlertCardsGridProps> = ({ onTrackingClick }) => {
  const [alerts, setAlerts] = useState<AlertCardData[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.warn("No se pudo obtener ubicación", err),
      { enableHighAccuracy: true }
    );
  }, []);


  // ====================================================================
  // SOCKET.IO: Obtener entityId y conectar
  // ====================================================================
  const entityId = authService.getEntityIdFromToken?.() || authService.getUserIdFromToken() || "";

  // Conectar al socket
  useSocketConnection(entityId && entityId !== "" ? entityId : "");

  // ====================================================================
  // SOCKET LISTENERS
  // ====================================================================

  // 1️⃣ Nueva alerta recibida
  useSocketListener("panic-alert", (data: any) => {
    console.log("🚨 Nueva alerta recibida en tarjetas:", data);

    const [lng, lat] = data.coordinates || [0, 0];

    const newAlert: AlertCardData = {
      id: `${data.alertId}`,
      alertId: data.alertId,
      lat,
      lng,
      emitterName: data.emitterName,
      emitterPhone: data.emitterPhone,
      emitterId: data.userId,
      reportedAt: new Date(),
    };

    setAlerts((prev) => [...prev, newAlert]);

    // Reproducir sonido
    audioRef.current?.play().catch((err) =>
      console.error("❌ Error al reproducir sonido:", err.message)
    );
  });

  // 2️⃣ Alerta atendida
  useSocketListener("alert-attended", (data: any) => {
    console.log(`👤 Alerta atendida: ${data.alertId}`);
    setAlerts((prev) => prev.filter((a) => a.alertId !== data.alertId));

    if (audioRef.current && alerts.length <= 1) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  });

  // 3️⃣ Alerta finalizada
  useSocketListener("alert-finalized", (data: any) => {
    console.log(`🛑 Alerta finalizada: ${data.alertId}`);
    setAlerts((prev) => prev.filter((a) => a.alertId !== data.alertId));

    if (audioRef.current && alerts.length <= 1) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  });

  // 4️⃣ Actualización de ubicación
  const handleLocationUpdate = (data: any) => {
    console.log("📍 Ubicación actualizada en tarjetas:", data);

    if (!data?.alertId) return;

    const [lng, lat] = data.coordinates || [0, 0];

    if (isNaN(lat) || isNaN(lng)) {
      console.warn("⚠️ Coordenadas inválidas:", { lat, lng });
      return;
    }

    setAlerts((prev) =>
      prev.map((alert) =>
        alert.alertId === data.alertId
          ? { ...alert, lat, lng }
          : alert
      )
    );
  };

  // Registrar listeners de location-update
  useEffect(() => {
    alerts.forEach((alert) => {
      socketService.on("location-update", handleLocationUpdate, alert.alertId);
    });

    return () => {
      alerts.forEach((alert) => {
        socketService.off("location-update", handleLocationUpdate, alert.alertId);
      });
    };
  }, [alerts.map((e) => e.alertId).join(",")]);

  // ====================================================================
  // HANDLERS
  // ====================================================================

  const handleAttend = async (id: string, alertId: string, emitterId: string) => {
    const recipientId = entityId || "";

    console.log(
      `✅ Atender alerta: alertId(${alertId}) recipientId(${recipientId})`
    );

    // Emitir evento Socket.IO al worker
    socketService.attendAlert(alertId, emitterId, recipientId);

    // Remove from UI (socket "alerta-atendida" lo eliminará)
    setAlerts((prev) => prev.filter((e) => e.id !== id));

    if (audioRef.current && alerts.length <= 1) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    window.alert("Emergencia atendida correctamente.");
    navigate("/monitoring", { replace: true });
  };

  const handleTrackingClick = (alertId: string, alertData: AlertCardData) => {
    console.log(`🗺️ Ir a rastrear alerta: ${alertId}`);
    onTrackingClick(alertId, alertData);
  };

  // ====================================================================
  // RENDER
  // ====================================================================

  if (alerts.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <audio ref={audioRef} src="/sounds/alarm.mp3" loop preload="auto" />
        <div className={styles.emptyContent}>
          <h2> Sin alertas activas</h2>
          <p>Esperando nuevas alertas de pánico...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <audio ref={audioRef} src="/sounds/alarm.mp3" loop preload="auto" />
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {alerts.map((alert) => {
            const distanceKm =
              myLocation
                ? calculateDistanceKm(
                  myLocation.lat,
                  myLocation.lng,
                  alert.lat,
                  alert.lng
                )
                : null;

            const distanceLabel =
              distanceKm === null
                ? null
                : distanceKm >= 1
                  ? `${distanceKm.toFixed(2)} km`
                  : `${Math.round(distanceKm * 1000)} m`;

            return (
              <div
                key={alert.id}
                className="bg-white rounded-2xl shadow-lg border border-red-200 hover:shadow-xl transition p-5 flex flex-col justify-between"
              >
                {/* HEADER */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {alert.emitterName}
                    </h3>
                    <p className="text-sm text-gray-500"><PhoneIcon className="inline mr-1 w-4 h-4" /> {alert.emitterPhone}</p>
                  </div>

                  <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full animate-pulse">
                    ACTIVA
                  </span>
                </div>

                {/* BODY */}
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <LocationMarkerIcon className="inline mr-1 w-4 h-4" /> <span className="font-medium">Ubicación:</span>{" "}
                    {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
                  </p>

                  {distanceLabel && (
                    <p className="text-orange-600 font-semibold">
                      📏 Emergencia a {distanceLabel} de ti
                    </p>
                  )}

                  {alert.reportedAt && (
                    <p className="text-gray-500">
                      <ClockIcon className="inline mr-1 w-4 h-4" /> {new Date(alert.reportedAt).toLocaleTimeString("es-ES")}
                    </p>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => handleTrackingClick(alert.alertId, alert)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-medium transition"
                  >
                    Rastrear
                  </button>

                  <button
                    onClick={() =>
                      handleAttend(alert.id, alert.alertId, alert.emitterId)
                    }
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-medium transition"
                  >
                    Atender
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </>
  );
};

export default AlertCardsGrid;
