import React, { useState, useEffect } from "react";
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
  avatar: string;
  emitterPhone: string;
  emitterId: string;
  createdAt?: string;
  status?: string;
}

interface AlertMapContainerProps {
  alertId: string; // ID de la alerta a rastrear
}

/** --- Componente principal --- */
const AlertMapContainer: React.FC<AlertMapContainerProps> = ({ alertId }) => {
  const [emergencies, setEmergencies] = useState<AlertData[]>([]);
  const [route, setRoute] = useState<{lat: number; lng: number}[]>([]);


  const navigate = useNavigate();

  // ====================================================================
  // SOCKET.IO: Obtener IDs y conectar
  // ====================================================================
  const entityId = authService.getEntityIdFromToken?.() || authService.getUserIdFromToken() || "";

  // Conectar al socket para escuchar cambios de estado y ubicaciones
  useSocketConnection(entityId, alertId);

  // Unirse explícitamente a la sala de la alerta
  useEffect(() => {
    if (alertId) {
      socketService.joinAlertRoom(alertId);
    }
  }, [alertId]);

  // ====================================================================
  // CARGA INICIAL (Carga inicial única sin polling)
  // ====================================================================
  const fetchInitialAlertData = async () => {
    try {
      const response = await api.get(`/api/alerts/${alertId}`);
      const alert = response.data?.alert || response.data;

      if (!alert) return;

      const [lng, lat] = alert.lastLocation?.coordinates || [0, 0];

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        setEmergencies([
          {
            id: alertId,
            alertId,
            lat,
            lng,
            emitterName: alert.reporter?.name || "Desconocido",
            avatar:
              (alert.reporter?.avatar && alert.reporter.avatar.trim() !== "")
                ? alert.reporter.avatar
                : "https://ui-avatars.com/api/?background=ef4444&color=fff&name=" +
                  encodeURIComponent(alert.reporter?.name || "Usuario"),
            emitterPhone: alert.reporter?.phone || "-",
            emitterId: alert.reporter?._id || "",
            createdAt: alert.reportedAt || alert.createdAt,
            status: alert.status,
          },
        ]);

        if (alert.locations && alert.locations.length > 0) {
          setRoute(
            alert.locations.map((loc: any) => ({
              lat: loc.coordinates[1],
              lng: loc.coordinates[0],
            }))
          );
        } else {
          setRoute([{ lat, lng }]);
        }
      }
    } catch (error: any) {
      console.error("❌ Error al obtener datos iniciales de la alerta:", error?.response?.data || error.message);
    }
  };

  useEffect(() => {
    console.log(`🗺️ Iniciando mapa para alerta: ${alertId}`);
    fetchInitialAlertData();
  }, [alertId]);

  // ====================================================================
  // SOCKET LISTENERS: Detectar cambios de estado
  // ====================================================================

  useSocketListener("alert-attended", (data: any) => {
    console.log(`👤 Alerta atendida desde socket: ${data.alertId}`);
    if (data.alertId === alertId) {
      setEmergencies([]);
    }
  });

  useSocketListener("alert-finalized", (data: any) => {
    if (data.alertId === alertId) {
      setEmergencies([]);
    }
  });

  // ====================================================================
  // LISTENER DE UBICACIÓN EN TIEMPO REAL VÍA SOCKET.IO
  // ====================================================================
  const handleLocationUpdate = (data: any) => {
    if (!data?.alertId || data.alertId !== alertId) return;

    const [lng, lat] = data.coordinates || [0, 0];

    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
      console.warn("⚠️ Coordenadas inválidas en socket:", { lat, lng });
      return;
    }

    console.log(`📍 Real-time location update para alerta ${alertId}:`, { lat, lng });

    // Actualizar marcador
    setEmergencies((prev) =>
      prev.map((alert) =>
        alert.alertId === data.alertId
          ? { ...alert, lat, lng }
          : alert
      )
    );

    // Acumular ruta
    setRoute((prev) => {
      const lastPoint = prev[prev.length - 1];
      if (lastPoint && lastPoint.lat === lat && lastPoint.lng === lng) {
        return prev;
      }
      return [...prev, { lat, lng }];
    });
  };

  useEffect(() => {
    socketService.on("location-update", handleLocationUpdate, alertId);
    socketService.on("alert:location", handleLocationUpdate, alertId);

    return () => {
      socketService.off("location-update", handleLocationUpdate, alertId);
      socketService.off("alert:location", handleLocationUpdate, alertId);
    };
  }, [alertId]);


  // ====================================================================
  // AUDIO: Manejado globalmente en DashboardEntity
  // ====================================================================

  /** ────────────────── FUNCIONES HANDLER ────────────────── */
  const handleAttend = async (
    id: string,
    _alertId?: string,
    emitterId?: string
  ) => {
    const targetAlertId = id || alertId;
    const targetEmitterId = emitterId || "";
    const recipientId = entityId || "";

    console.log(
      `✅ Atender alerta: alertId(${targetAlertId}) recipientId(${recipientId})`
    );

    // Emitir evento Socket.IO al worker para que encole el job
    socketService.attendAlert(targetAlertId, targetEmitterId, recipientId);

    setEmergencies([]);

    window.alert("Emergencia atendida correctamente.");
    navigate("/monitoring", { replace: true });
  };
  return (
    <MapAlert markers={emergencies} route={route} onAttend={handleAttend} />
  );
};

export default AlertMapContainer;
