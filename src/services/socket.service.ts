// src/services/socket.service.ts
import { io, Socket } from 'socket.io-client';
import authService from './auth-service';

type EventCallback = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private activeEntityId: string = '';
  private registeredEntityRooms: Set<string> = new Set();
  private registeredAlertRooms: Set<string> = new Set();

  // Listeners registrados
  private listeners: { [key: string]: any } = {
    'panic-alert': [],
    'panicAlert': [],
    'alert-created': [],
    'alerta-creada': [],
    'alert-attended': [],
    'alerta-atendida': [],
    'alert:attended': [],
    'alert-finalized': [],
    'alerta-finalizada': [],
    'alert:closed': [],
    'location-update': {}, // Por alertId o global
    'alert:location': {}, // Por alertId o global
    'vehicle-state-update': [],
  };

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      console.log('🛑 Desconectado del worker Socket.IO');
    }
  }

  /**
   * Conectar al servidor Socket.IO del worker
   * @param entityId - ID de la entidad (opcional, si es vacío lo recupera del token/localStorage)
   * @param alertId - ID de la alerta actual (opcional, para tracking)
   */
  connect(entityId?: string, alertId?: string) {
    // Si no se pasó entityId, intentar obtenerlo automáticamente
    const resolvedEntityId =
      (entityId && entityId.trim() !== '')
        ? entityId.trim()
        : (authService.getEntityIdFromToken() || authService.getUserIdFromToken() || '');

    if (resolvedEntityId) {
      this.activeEntityId = resolvedEntityId;
    }

    if (this.socket?.connected) {
      if (resolvedEntityId) {
        this.joinEntityRoom(resolvedEntityId);
      }
      if (alertId) {
        this.joinAlertRoom(alertId);
      }
      return this.socket;
    }

    if (this.socket) {
      console.log('⏳ Socket en proceso de conexión...');
      return this.socket;
    }

    const socketURL = (import.meta as any).env?.VITE_SOCKET_URL || 'https://apipanic.viryx.net';
    console.log(`🔌 Intentando conectar a Socket.IO en: ${socketURL}`);

    this.socket = io(socketURL, {
      transports: ['websocket', 'polling'], // websocket preferido con fallback a polling si hay proxy
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      autoConnect: true,
      rejectUnauthorized: false,
    });

    // Evento: Conexión exitosa
    this.socket.on('connect', () => {
      console.log('✅ Conectado al worker Socket.IO:', this.socket?.id);
      this.reconnectAttempts = 0;

      setTimeout(() => {
        // Re-unirse a salas de entidad registradas
        if (this.activeEntityId) {
          this.joinEntityRoom(this.activeEntityId);
        }
        this.registeredEntityRooms.forEach((eId) => {
          this.joinEntityRoom(eId);
        });

        // Re-unirse a salas de alerta registradas
        if (alertId) {
          this.joinAlertRoom(alertId);
        }
        this.registeredAlertRooms.forEach((aId) => {
          this.joinAlertRoom(aId);
        });
      }, 100);
    });

    // Evento: Desconexión
    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Desconectado del worker Socket.IO. Razón:', reason);
    });

    // Evento: Error de conexión
    this.socket.on('connect_error', (error: any) => {
      this.reconnectAttempts++;
      console.error(
        `❌ Error de conexión Socket.IO (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts}):`,
        error?.message || error
      );
    });

    // ====================================================================
    // EVENTOS DEL BACKEND - Mapear y emitir internamente
    // ====================================================================

    // 🚨 Nueva alerta de pánico
    const handlePanicAlert = (data: any) => {
      console.log('🚨 panicAlert recibido desde server:', data);
      this.emit('panic-alert', data);
      this.emit('panicAlert', data);
    };
    this.socket.on('panicAlert', handlePanicAlert);
    this.socket.on('panic-alert', handlePanicAlert);

    // ✅ Alerta creada
    const handleAlertaCreada = (data: any) => {
      console.log('✅ alerta-creada recibido desde server:', data);
      this.emit('alert-created', data);
      this.emit('alerta-creada', data);
    };
    this.socket.on('alerta-creada', handleAlertaCreada);
    this.socket.on('alert-created', handleAlertaCreada);

    // 👤 Alerta atendida
    const handleAlertaAtendida = (data: any) => {
      console.log('👤 alerta-atendida recibido desde server:', data);
      this.emit('alert-attended', data);
      this.emit('alerta-atendida', data);
      this.emit('alert:attended', data);
    };
    this.socket.on('alerta-atendida', handleAlertaAtendida);
    this.socket.on('alert-attended', handleAlertaAtendida);
    this.socket.on('alert:attended', handleAlertaAtendida);

    // 🛑 Alerta finalizada / cerrada
    const handleAlertaFinalizada = (data: any) => {
      console.log('🛑 alerta-finalizada recibido desde server:', data);
      this.emit('alert-finalized', data);
      this.emit('alerta-finalizada', data);
      this.emit('alert:closed', data);
    };
    this.socket.on('alerta-finalizada', handleAlertaFinalizada);
    this.socket.on('alert-finalized', handleAlertaFinalizada);
    this.socket.on('alert:closed', handleAlertaFinalizada);

    // 📍 Ubicación en tiempo real
    const handleLocationUpdate = (data: any) => {
      console.log('📍 location-update recibido desde server:', data);
      this.emit('location-update', data);
      this.emit('alert:location', data);
    };
    this.socket.on('location-update', handleLocationUpdate);
    this.socket.on('alert:location', handleLocationUpdate);

    // 🚗 Rastreo Satelital GPS
    const handleVehicleUpdate = (data: any) => {
      console.log('🚗 vehicle-state-update recibido desde server:', data);
      this.emit('vehicle-state-update', data);
    };
    this.socket.on('vehicle-state-update', handleVehicleUpdate);

    return this.socket;
  }

  /**
   * Registrar un listener para un evento
   */
  on(eventName: string, callback: EventCallback, alertId?: string) {
    console.log(`🎧 Registrando listener para: ${eventName}${alertId ? ` [alertId: ${alertId}]` : ''}`);
    
    const isLocationEvent = eventName === 'location-update' || eventName === 'alert:location';

    if (!this.listeners[eventName]) {
      this.listeners[eventName] = isLocationEvent ? {} : [];
    }

    if (isLocationEvent && alertId) {
      if (!this.listeners[eventName][alertId]) {
        this.listeners[eventName][alertId] = [];
      }
      this.listeners[eventName][alertId].push(callback);
      // Asegurarse de estar unidos a la sala de la alerta
      this.joinAlertRoom(alertId);
    } else if (isLocationEvent) {
      if (!this.listeners[eventName]['global']) {
        this.listeners[eventName]['global'] = [];
      }
      this.listeners[eventName]['global'].push(callback);
    } else {
      this.listeners[eventName].push(callback);
    }
  }

  /**
   * Desregistrar un listener
   */
  off(eventName: string, callback: EventCallback, alertId?: string) {
    if (!this.listeners[eventName]) return;

    const isLocationEvent = eventName === 'location-update' || eventName === 'alert:location';

    if (isLocationEvent && alertId) {
      if (this.listeners[eventName][alertId]) {
        this.listeners[eventName][alertId] = this.listeners[eventName][alertId].filter(
          (cb: any) => cb !== callback
        );
      }
    } else if (isLocationEvent) {
      if (this.listeners[eventName]['global']) {
        this.listeners[eventName]['global'] = this.listeners[eventName]['global'].filter(
          (cb: any) => cb !== callback
        );
      }
    } else if (Array.isArray(this.listeners[eventName])) {
      this.listeners[eventName] = this.listeners[eventName].filter(
        (cb: any) => cb !== callback
      );
    }
  }

  /**
   * Emitir evento internamente a todos los listeners
   */
  private emit(eventName: string, data: any) {
    if (!this.listeners[eventName]) return;

    const isLocationEvent = eventName === 'location-update' || eventName === 'alert:location';

    if (isLocationEvent && data?.alertId) {
      const callbacks = this.listeners[eventName][data.alertId] || [];
      callbacks.forEach((callback: any) => {
        try { callback(data); } catch (error) { console.error(`Error en listener de ${eventName}:`, error); }
      });

      const globalCallbacks = this.listeners[eventName]['global'] || [];
      globalCallbacks.forEach((callback: any) => {
        try { callback(data); } catch (error) { console.error(`Error en listener global de ${eventName}:`, error); }
      });
    } else {
      const callbacks = Array.isArray(this.listeners[eventName]) ? this.listeners[eventName] : [];
      callbacks.forEach((callback: any) => {
        try { callback(data); } catch (error) { console.error(`Error en listener de ${eventName}:`, error); }
      });
    }
  }

  /**
   * Unirse a la sala de una entidad: entity:{entityId}
   */
  joinEntityRoom(entityId: string) {
    if (!entityId || entityId.trim() === '') return;
    this.registeredEntityRooms.add(entityId);

    if (!this.socket) {
      this.connect(entityId);
      return;
    }

    const room = `entity:${entityId}`;
    if (this.socket.connected) {
      this.socket.emit('join-room', { room });
      this.socket.emit('join-entity', entityId);
      console.log(`📤 Emitido join-room (${room}) y join-entity (${entityId})`);
    } else {
      this.socket.once('connect', () => {
        this.socket?.emit('join-room', { room });
        this.socket?.emit('join-entity', entityId);
      });
    }
  }

  /**
   * Unirse a la sala de una alerta: alert:{alertId}
   */
  joinAlertRoom(alertId: string) {
    if (!alertId || alertId.trim() === '') return;
    this.registeredAlertRooms.add(alertId);

    if (!this.socket) {
      this.connect(undefined, alertId);
      return;
    }

    const room = `alert:${alertId}`;
    if (this.socket.connected) {
      this.socket.emit('join-room', { room });
      this.socket.emit('join-panic-room', alertId);
      console.log(`📤 Emitido join-room (${room}) y join-panic-room (${alertId})`);
    } else {
      this.socket.once('connect', () => {
        this.socket?.emit('join-room', { room });
        this.socket?.emit('join-panic-room', alertId);
      });
    }
  }

  /**
   * Atender una alerta (enviar evento al worker para que encole job)
   */
  attendAlert(alertId: string, userId: string, recipientId: string) {
    if (!this.socket) {
      console.error('❌ Socket no está inicializado');
      return;
    }

    if (!this.socket.connected) {
      console.error('❌ Socket no está conectado');
      return;
    }

    console.log(
      `📤 Emitiendo attend-alert [alertId: ${alertId}, userId: ${userId}, recipientId: ${recipientId}]`
    );

    // Emitir eventos compatibles con panic.worker.js y socket.js
    this.socket.emit('attend-alert', { alertId, userId, recipientId });
    this.socket.emit('atender-alerta', { alertId, userId, recipientId });

    this.socket.once('attend-alert-ack', (response) => {
      console.log('✅ Servidor confirmó attend-alert:', response);
    });

    this.socket.once('attend-alert-error', (error) => {
      console.error('❌ Error en attend-alert:', error);
    });
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketService();

