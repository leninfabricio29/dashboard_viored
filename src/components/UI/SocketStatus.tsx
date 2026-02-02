// src/components/UI/SocketStatus.tsx
import React, { useEffect, useState } from 'react';
import socketService from '../../services/socket.service';

const SocketStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(socketService.isConnected());
    };

    // Verificar cada 1 segundo
    const interval = setInterval(checkConnection, 1000);
    checkConnection(); // Verificar inmediatamente

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-xs font-semibold">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span className={isConnected ? 'text-green-700' : 'text-red-700'}>
        {isConnected ? '📡 Conectado' : '⚠️ Sin conexión'}
      </span>
    </div>
  );
};

export default SocketStatus;
