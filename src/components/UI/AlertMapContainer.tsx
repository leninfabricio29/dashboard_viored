import React, { useRef, useState, useEffect } from "react";
import socketService from "../../services/socket.service";
import authService from "../../services/auth-service";
import { useSocketConnection, useSocketListener } from "../../hooks/useSocketListener";
import MapAlert from "./MapAlert";

/** --- Tipos --- */
export interface AlertData {
  id: string;            // Identificador interno (para la key)
  alertId: string;       // ID real del backend
  lat: number;
  lng: number;
  emitterName: string;
  emitterPhone: string;
  emitterId: string;
}

/** --- Componente principal --- */
const AlertMapContainer: React.FC = () => {
  const [emergencies, setEmergencies] = useState<AlertData[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ====================================================================
  // SOCKET.IO: Obtener IDs y conectar
  // ====================================================================
  //const userId = authService.getUserIdFromToken() || "";

  const entityId = authService.getEntityIdFromToken?.() || authService.getUserIdFromToken() || "";

  // Conectar al socket
  useSocketConnection(entityId && entityId !== "" ? entityId : "");

  // Escuchar eventos con callbacks
  useSocketListener("panic-alert", (data: any) => {
    console.log("🚨 Nueva alerta recibida:", data);

    const [lng, lat] = data.coordinates || [0, 0];

    const newAlert: AlertData = {
      id: `${data.alertId}`,
      alertId: data.alertId,
      lat,
      lng,
      emitterName: data.emitterName,
      emitterPhone: data.emitterPhone,
      emitterId: data.userId,
    };

    setEmergencies((prev) => [...prev, newAlert]);

    audioRef.current?.play().catch((err) =>
      console.error("❌ Error al reproducir sonido:", err.message)
    );
  });

  useSocketListener("alert-attended", (data: any) => {
    console.log(`👤 Alerta atendida: ${data.alertId}`);
    setEmergencies((prev) => prev.filter((a) => a.alertId !== data.alertId));

    if (audioRef.current && emergencies.length <= 1) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  });

  useSocketListener("alert-finalized", (data: any) => {
    console.log(`🛑 Alerta finalizada: ${data.alertId}`);
    setEmergencies((prev) => prev.filter((a) => a.alertId !== data.alertId));

    if (audioRef.current && emergencies.length <= 1) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  });

  // Listener para location-update por alertId
  const handleLocationUpdate = (data: any) => {
    console.log("📍 Ubicación actualizada:", data);

    if (!data?.alertId) return;

    const [lng, lat] = data.coordinates || [0, 0];

    if (isNaN(lat) || isNaN(lng)) {
      console.warn("⚠️ Coordenadas inválidas:", { lat, lng });
      return;
    }

    setEmergencies((prev) =>
      prev.map((alert) =>
        alert.alertId === data.alertId
          ? { ...alert, lat, lng }
          : alert
      )
    );
  };

  // Registrar/desregistrar listeners de location-update por alertId
  useEffect(() => {
    // Registrar listeners para cada alertId activo
    emergencies.forEach((emergency) => {
      socketService.on("location-update", handleLocationUpdate, emergency.alertId);
    });

    // Cleanup: desregistrar listeners
    return () => {
      emergencies.forEach((emergency) => {
        socketService.off("location-update", handleLocationUpdate, emergency.alertId);
      });
    };
  }, [emergencies.map((e) => e.alertId).join(",")]); // Dependencia: cambios en alertIds


  /** ────────────────── FUNCIONES HANDLER ────────────────── */
  const handleAttend = async (id: string, alertId: string, emitterId: string) => {
    const recipientId = entityId || "";

    console.log(
      `✅ Atender alerta: alertId(${alertId}) userId(${emitterId}) recipientId(${recipientId})`
    );

    // Emitir evento Socket.IO al worker para que encole el job
    socketService.attendAlert(alertId, emitterId, recipientId);

    // El socket recibirá el evento "alerta-atendida" desde el worker automáticamente
    setEmergencies((prev) => prev.filter((e) => e.id !== id));

    if (audioRef.current && emergencies.length <= 1) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };



  /** ────────────────── RENDER ────────────────── */
  return (
    <>
      <audio ref={audioRef} src="/sounds/alarm.mp3" loop preload="auto" />
      <MapAlert markers={emergencies} onAttend={handleAttend} />
    </>
  );
};

export default AlertMapContainer;
