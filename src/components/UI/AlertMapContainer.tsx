// ✅ CORREGIDO - AlertMapContainer.tsx
import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../utils/socket";
import MapAlert from "./MapAlert";

export type AlertData = {
  id: string;
  notifyId: string;
  lat: number;
  lng: number;
  emitterName: string;
  emitterPhone: string;
  emitterId: string;
};

const AlertMapContainer: React.FC = () => {
  const [emergencies, setEmergencies] = useState<AlertData[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const entityId = localStorage.getItem("entity_sonId");

    socket.on("connect", () => {
      console.log("✅ Conectado al socket:", socket.id);
      socket.emit("join-entity", entityId);
      console.log("🔗 Unido a la entidad:", entityId);
    });

    socket.on("panicAlert", (data) => {
      console.log("🔔 Nueva alerta recibida:", data);
      const match = data.locationUrl?.match(/query=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (!match) return;
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);

      const newAlert: AlertData = {
        id: String(data.notifyId || Date.now()),
        notifyId: data.notifyId,
        lat,
        lng,
        emitterName: data.emitterName,
        emitterPhone: data.emitterPhone,
        emitterId: data.userId,
      };

      setEmergencies((prev) => [...prev, newAlert]);

      if (audioRef.current) {
        audioRef.current.play().catch((err) => {
          console.error("❌ Error al reproducir sonido:", err.message);
        });
      }
    });

    socket.on("alerta-atendida", ({ notifyId }) => {
      console.log(`🚫 Eliminar alerta atendida: ${notifyId}`);
      setEmergencies((prev) => prev.filter((alert) => alert.notifyId !== notifyId));
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    });

    return () => {
      socket.off("connect");
      socket.off("panicAlert");
      socket.off("alerta-atendida");
    };
  }, []);

  const handleAttend = (id: string, notifyId: string, userId: string, recipientId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

     recipientId = localStorage.getItem('userId') || ''; // Asegurarse de que recipientId tenga un valor válido
    console.log(`✅ Atender alerta: ${id}, notifyId: ${notifyId}, userId: ${userId}, recipientId: ${recipientId}`);
    socket.emit("atender-alerta", {
      notifyId,
      userId,
      recipientId,
    });

    setEmergencies((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <>
      <audio ref={audioRef} src="/sounds/alarm.mp3" loop preload="auto" />
      <MapAlert markers={emergencies} onAttend={handleAttend} />
    </>
  );
};

export default AlertMapContainer;





