// src/services/socket.service.ts
import { io, Socket } from 'socket.io-client';

type EventCallback = (data: any) => void;

class SocketService {
  
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  // Listeners registrados
  // Para location-update, guardamos por alertId para independencia
  private listeners: { [key: string]: any } = {
    'panic-alert': [],
    'alert-created': [],
    'alert-attended': [],
    'alert-finalized': [],
    'location-update': {}, // Por alertId
  };

  disconnect() {
    if (this.socket?.connected) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      console.log('🛑 Desconectado del worker Socket.IO');
    }
  }

  /**
   * Conectar al servidor Socket.IO del worker
   * @param entityId - ID de la entidad (para unirse a salas específicas)
   * @param alertId - ID de la alerta actual (opcional, para tracking)
   */
  connect(entityId: string, alertId?: string) {
    if (this.socket?.connected) {
      console.log('✅ Socket ya está conectado');
      return this.socket;
    }

    if (this.socket) {
      console.log('⏳ Socket en proceso de conexión...');
      return this.socket;
    }

    // Conectar al worker - usar WebSocket solo (no polling)
    this.socket = io('http://localhost:4000', {
      transports: ['websocket'], // Solo WebSocket, no polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      autoConnect: true,
    });

    // Evento: Conexión exitosa
    this.socket.on('connect', () => {
      console.log('✅ Conectado al worker Socket.IO:', this.socket?.id);
      this.reconnectAttempts = 0;

      // Esperar un pequeño delay para asegurar que el servidor está listo
      setTimeout(() => {
        // Unirse a sala de entidad: entity:{entityId}
        this.joinEntityRoom(entityId);

        // Si hay alerta activa, unirse a sala de alerta
        if (alertId) {
          this.joinAlertRoom(alertId);
        }
      }, 100);
    });

    // Evento: Desconexión
    this.socket.on('disconnect', () => {
      console.warn('⚠️ Desconectado del worker Socket.IO');
    });

    // Evento: Error de conexión
    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      console.error(
        `❌ Error de conexión Socket.IO (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts}):`,
        error.message
      );

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ No se pudo conectar al worker Socket.IO después de', this.maxReconnectAttempts, 'intentos');
      }
    });

    // ====================================================================
    // EVENTOS DE ALERTA - Escuchar emitidos por el worker
    // ====================================================================

    // Evento: Alerta de pánico recibida
    this.socket.on('panicAlert', (data) => {
      console.log('🚨 panicAlert recibido desde server:', data);
      this.emit('panic-alert', data);
    });

    // Evento: Alerta fue creada (confirmación)
    this.socket.on('alerta-creada', (data) => {
      console.log('✅ alerta-creada recibido desde server:', data);
      this.emit('alert-created', data);
    });

    // Evento: Alerta fue atendida por una entidad
    this.socket.on('alerta-atendida', (data) => {
      console.log('👤 alerta-atendida recibido desde server:', data);
      this.emit('alert-attended', data);
    });

    // Evento: Alerta fue finalizada (remover de vista)
    this.socket.on('alerta-finalizada', (data) => {
      console.log('🛑 alerta-finalizada recibido desde server:', data);
      this.emit('alert-finalized', data);
    });

    // Evento: Actualización de ubicación en tiempo real
    this.socket.on('location-update', (data) => {
      console.log('📍 location-update recibido desde server:', data);
      this.emit('location-update', data);
    });

    return this.socket;
  }

  /**
   * Registrar un listener para un evento
   * Para location-update, se puede especificar un alertId para independencia
   */
  on(eventName: string, callback: EventCallback, alertId?: string) {
    if (!this.listeners[eventName]) {
      if (eventName === 'location-update') {
        this.listeners[eventName] = {};
      } else {
        this.listeners[eventName] = [];
      }
    }

    // Si es location-update, guardar por alertId
    if (eventName === 'location-update' && alertId) {
      if (!this.listeners[eventName][alertId]) {
        this.listeners[eventName][alertId] = [];
      }
      this.listeners[eventName][alertId].push(callback);
      console.log(`📌 Listener registrado para: ${eventName} [alertId: ${alertId}]`);
    } else if (eventName === 'location-update') {
      // Si no hay alertId, usar clave 'global'
      if (!this.listeners[eventName]['global']) {
        this.listeners[eventName]['global'] = [];
      }
      this.listeners[eventName]['global'].push(callback);
      console.log(`📌 Listener registrado para: ${eventName} [global]`);
    } else {
      // Para otros eventos, es un array normal
      this.listeners[eventName].push(callback);
      console.log(`📌 Listener registrado para: ${eventName}`);
    }
  }

  /**
   * Desregistrar un listener
   */
  off(eventName: string, callback: EventCallback, alertId?: string) {
    if (!this.listeners[eventName]) return;

    if (eventName === 'location-update' && alertId) {
      if (this.listeners[eventName][alertId]) {
        this.listeners[eventName][alertId] = this.listeners[eventName][alertId].filter(
          (cb: any) => cb !== callback
        );
      }
    } else if (eventName === 'location-update') {
      if (this.listeners[eventName]['global']) {
        this.listeners[eventName]['global'] = this.listeners[eventName]['global'].filter(
          (cb: any) => cb !== callback
        );
      }
    } else {
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

    // Para location-update, emitir solo a listeners de esa alerta específica
    if (eventName === 'location-update' && data.alertId) {
      const callbacks = this.listeners[eventName][data.alertId] || [];
      callbacks.forEach((callback: any) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en listener de ${eventName}:`, error);
        }
      });

      // También emitir a listeners globales
      const globalCallbacks = this.listeners[eventName]['global'] || [];
      globalCallbacks.forEach((callback: any) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en listener global de ${eventName}:`, error);
        }
      });
    } else {
      // Para otros eventos
      const callbacks = Array.isArray(this.listeners[eventName])
        ? this.listeners[eventName]
        : [];
      callbacks.forEach((callback: any) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en listener de ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Unirse a la sala de una entidad: entity:{entityId}
   */
  joinEntityRoom(entityId: string) {
    if (!this.socket) {
      console.error('❌ Socket no está inicializado');
      return;
    }

    if (!entityId || entityId.trim() === '') {
      console.warn('⚠️ entityId vacío, no se puede unir a sala');
      return;
    }

    const room = `entity:${entityId}`;
    
    // Esperar a que esté conectado antes de emitir
    if (this.socket.connected) {
      this.socket.emit('join-room', { room });
      console.log(`✅ Unido a sala: ${room}`);
    } else {
      // Si aún no está conectado, esperar y luego emitir
      this.socket.once('connect', () => {
        this.socket?.emit('join-room', { room });
        console.log(`✅ Unido a sala (post-connect): ${room}`);
      });
    }
  }

  /**
   * Unirse a la sala de una alerta: alert:{alertId}
   */
  joinAlertRoom(alertId: string) {
    if (!this.socket) {
      console.error('❌ Socket no está inicializado');
      return;
    }

    if (!alertId || alertId.trim() === '') {
      console.warn('⚠️ alertId vacío, no se puede unir a sala');
      return;
    }

    const room = `alert:${alertId}`;
    
    if (this.socket.connected) {
      this.socket.emit('join-room', { room });
      console.log(`✅ Unido a sala: ${room}`);
    } else {
      this.socket.once('connect', () => {
        this.socket?.emit('join-room', { room });
        console.log(`✅ Unido a sala (post-connect): ${room}`);
      });
    }
  }

  /**
   * Atender una alerta (enviar evento al worker para que encole job)
   * @param alertId - ID de la alerta
   * @param userId - ID del usuario que atiende
   * @param recipientId - ID de la entidad que atiende
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

    // Emitir evento al worker
    this.socket.emit('attend-alert', {
      alertId,
      userId,
      recipientId,
    });

    // Escuchar respuesta del servidor
    this.socket.once('attend-alert-ack', (response) => {
      console.log('✅ Servidor confirmó attend-alert:', response);
    });

    this.socket.once('attend-alert-error', (error) => {
      console.error('❌ Error en attend-alert:', error);
    });
  }

  /**
    if (this.socket?.connected) {
      this.socket.disconnect();
      console.log('🛑 Desconectado del worker Socket.IO');
    }
  }

  /**
   * Obtener instancia del socket (para casos especiales)
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Exportar instancia singleton
export default new SocketService();
