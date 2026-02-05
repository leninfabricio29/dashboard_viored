// src/hooks/useSocketListener.ts
import { useEffect } from 'react';
import socketService from '../services/socket.service';

/**
 * Hook para escuchar eventos de socket
 * @param eventName - Nombre del evento a escuchar
 * @param onEvent - Callback cuando se recibe el evento
 * @param alertId - ID de la alerta (opcional, para location-update)
 */
export const useSocketListener = (
  eventName: string,
  onEvent: (data: any) => void,
  alertId?: string
) => {
  useEffect(() => {

    // Registrar el listener con socketService
    socketService.on(eventName, onEvent, alertId);

    // Cleanup: Desregistrar listener al desmontar componente
    return () => {
      socketService.off(eventName, onEvent, alertId);
    };
  }, [eventName, onEvent, alertId]);
};

/**
 * Hook para manejar la conexión de socket
 * @param entityId - ID de la entidad para unirse a salas
 * @param alertId - ID opcional de alerta en seguimiento
 */
export const useSocketConnection = (entityId: string, alertId?: string) => {
  useEffect(() => {
    console.log(
      `🔌 Conectando socket con entityId: ${entityId}${alertId ? `, alertId: ${alertId}` : ''}`
    );

    if (!entityId || entityId.trim() === '') {
      console.warn('⚠️ entityId vacío, no se establece conexión Socket.IO');
      return;
    }

    // Conectar al socket
    socketService.connect(entityId, alertId);

    // Cleanup: Desconectar al desmontar
    return () => {
      console.log('🔌 Cleanup de socket connection');
      socketService.disconnect();
    };
  }, [entityId, alertId]);
};

/**
 * Hook combinado para conectar y escuchar todos los eventos de alerta
 * @param entityId - ID de la entidad
 * @param callbacks - Objeto con callbacks para cada evento
 * @param alertIds - Array de alertIds activos para filtrar location-updates
 */
export const usePanicAlerts = (
  entityId: string,
  callbacks: {
    onPanicAlert?: (data: any) => void;
    onAlertCreated?: (data: any) => void;
    onAlertAttended?: (data: any) => void;
    onAlertFinalized?: (data: any) => void;
    onLocationUpdate?: (data: any) => void;
  },
  alertIds?: string[]
) => {
  // Conectar socket
  useSocketConnection(entityId);

  // Escuchar cada evento si se proporcionó un callback
  if (callbacks.onPanicAlert) {
    useSocketListener('panic-alert', callbacks.onPanicAlert);
  }

  if (callbacks.onAlertCreated) {
    useSocketListener('alert-created', callbacks.onAlertCreated);
  }

  if (callbacks.onAlertAttended) {
    useSocketListener('alert-attended', callbacks.onAlertAttended);
  }

  if (callbacks.onAlertFinalized) {
    useSocketListener('alert-finalized', callbacks.onAlertFinalized);
  }

  // Para location-update, registrar listeners por alertId
  if (callbacks.onLocationUpdate && alertIds && alertIds.length > 0) {
    alertIds.forEach((alertId) => {
      useSocketListener('location-update', callbacks.onLocationUpdate!, alertId);
    });
  }
};
