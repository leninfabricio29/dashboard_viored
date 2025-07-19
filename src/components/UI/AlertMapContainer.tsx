import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../utils/socket";
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

  /** ────────────────── FUNCIONES HANDLER ────────────────── */
  const handlePanicAlert = (data: any) => {
    console.log("🔔 Nueva alerta recibida:", data);

    const match = data.locationUrl?.match(/query=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (!match) return;

    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);

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
  };

  const handleAlertaAtendida = ({ alertId }: { alertId: string }) => {
    console.log(`🚫 Alerta atendida: ${alertId}`);
    setEmergencies((prev) => prev.filter((a) => a.alertId !== alertId));

    if (audioRef.current && emergencies.length <= 1) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleAttend = (id: string, alertId: string, emitterId: string) => {
    const recipientId = localStorage.getItem("userId") || "";

    console.log(
      `✅ Atender alerta: id(${id}) alertId(${alertId}) userId(${emitterId}) recipientId(${recipientId})`
    );

    socket.emit("atender-alerta", {
      alertId,
      userId: emitterId,
      recipientId,
    });

    setEmergencies((prev) => prev.filter((e) => e.id !== id));

    if (audioRef.current && emergencies.length <= 1) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  /** ────────────────── SOCKET LISTENERS ────────────────── */
  useEffect(() => {
    const entityId = localStorage.getItem("entity_sonId");
    if (!entityId) return;

    if (socket.connected) {
      socket.emit("join-entity", entityId);
      console.log("🔗 Ya conectado. Emitiendo join-entity:", entityId);
    }

    const handleConnect = () => {
      console.log("✅ Conectado al socket:", socket.id);
      socket.emit("join-entity", entityId);
      console.log("🔗 Emitido join-entity tras connect:", entityId);
    };

    socket.on("connect", handleConnect);
    socket.on("panicAlert", handlePanicAlert);
    socket.on("alerta-atendida", handleAlertaAtendida);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("panicAlert", handlePanicAlert);
      socket.off("alerta-atendida", handleAlertaAtendida);
    };
  }, [emergencies.length]);

  /** ────────────────── RENDER ────────────────── */
  return (
    <>
      <audio ref={audioRef} src="/sounds/alarm.mp3" loop preload="auto" />
      <MapAlert markers={emergencies} onAttend={handleAttend} />
    </>
  );
};

export default AlertMapContainer;
