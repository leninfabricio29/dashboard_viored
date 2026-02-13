import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socketService from "../../services/socket.service";
import authService from "../../services/auth-service";
import { useSocketConnection, useSocketListener } from "../../hooks/useSocketListener";
import MapAlert from "./MapAlert";
import api from "../../services/api";

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

interface AlertMapContainerProps {
  alertId: string; // ID de la alerta a rastrear
}

/** --- Componente principal --- */
const AlertMapContainer: React.FC<AlertMapContainerProps> = ({ alertId }) => {
  const [emergencies, setEmergencies] = useState<AlertData[]>([]);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [route, setRoute] = useState<{lat: number; lng: number}[]>([]);

  const navigate = useNavigate();

  // ====================================================================
  // SOCKET.IO: Obtener IDs y conectar
  // ====================================================================
  const entityId = authService.getEntityIdFromToken?.() || authService.getUserIdFromToken() || "";

  // Conectar al socket para escuchar cambios de estado
  useSocketConnection(entityId && entityId !== "" ? entityId : "");

  // ====================================================================
  // POLLING: Obtener ubicaciones actualizadas del endpoint
  // ====================================================================

 

 const pollAlertLocation = async () => {
  try {
    const response = await api.get(`/api/alerts/${alertId}`);
    const alert = response.data?.alert || response.data;

    if (!alert) return;

    const [lng, lat] = alert.lastLocation?.coordinates || [0, 0];

    if (isNaN(lat) || isNaN(lng)) {
      console.warn("⚠️ Coordenadas inválidas:", { lat, lng });
      return;
    }

    console.log(`📍 Alerta ${alertId} ubicación actualizada:`, { lat, lng });

    // 🔥 ACUMULAR RUTA
    setRoute((prev) => {
      const lastPoint = prev[prev.length - 1];

      // Evitar duplicados innecesarios
      if (lastPoint && lastPoint.lat === lat && lastPoint.lng === lng) {
        return prev;
      }

      const nextRoute = [...prev, { lat, lng }];
      return nextRoute;
    });
    // Actualizar marcador
    setEmergencies((prev) => {
      const exists = prev.find((e) => e.alertId === alertId);

      if (exists) {
        return prev.map((el) =>
          el.alertId === alertId ? { ...el, lat, lng } : el
        );
      } else {
        return [
          {
            id: alertId,
            alertId,
            lat,
            lng,
            emitterName: alert.reporter?.name || "Desconocido",
            emitterPhone: alert.reporter?.phone || "-",
            emitterId: alert.reporter?._id || "",
          },
        ];
      }
    });

  } catch (error: any) {
    console.error("❌ Error polando ubicación:", error?.response?.data || error.message);
  }
};


  // Iniciar polling al montar
  useEffect(() => {
    console.log(`🗺️ Iniciando mapa para alerta: ${alertId}`);
    
    // Polling inmediato y luego cada 3 segundos
    pollAlertLocation();
    pollingIntervalRef.current = setInterval(pollAlertLocation, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [alertId]);

  useEffect(() => {
    if (route.length === 0) return;
  }, [route]);

  // ====================================================================
  // SOCKET LISTENERS: Detectar cambios de estado
  // ====================================================================

  // Si la alerta se atiende o finaliza, detener
  useSocketListener("alerta-atendida", (data: any) => {
    console.log(`👤 Alerta atendida desde socket: ${data.alertId}`);
    if (data.alertId === alertId) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      setEmergencies([]);
    }
  });

  useSocketListener("alerta-finalizada", (data: any) => {
    if (data.alertId === alertId) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      setEmergencies([]);
    }
  });

  // ====================================================================
  // LISTENER ALTERNATIVO: location-update si sigue usando sockets
  // ====================================================================
  const handleLocationUpdate = (data: any) => {

    if (!data?.alertId || data.alertId !== alertId) return;

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

  useEffect(() => {
    socketService.on("location-update", handleLocationUpdate, alertId);

    return () => {
      socketService.off("location-update", handleLocationUpdate, alertId);
    };
  }, [alertId]);

  // ====================================================================
  // AUDIO: Manejado globalmente en DashboardEntity
  // ====================================================================

  /** ────────────────── FUNCIONES HANDLER ────────────────── */
  const handleAttend = async (alertId: string, emitterId: string) => {
    const recipientId = entityId || "";

    console.log(
      `✅ Atender alerta: alertId(${alertId}) recipientId(${recipientId})`
    );

    // Emitir evento Socket.IO al worker para que encole el job
    socketService.attendAlert(alertId, emitterId, recipientId);

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setEmergencies([]);
    window.alert("Emergencia atendida correctamente.");
    navigate("/monitoring", { replace: true });
  };
  return (
    <MapAlert markers={emergencies} route={route} onAttend={handleAttend} />
  );
};

export default AlertMapContainer;
