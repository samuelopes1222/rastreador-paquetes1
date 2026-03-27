import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Hook personalizado para Socket.io
 * Maneja conexión, reconexión y limpieza
 */
export function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Inicializar socket
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    // Listeners de conexión
    socket.on('connect', () => {
      console.log('✅ Conectado a servidor WebSocket');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('⚠️ Error de conexión:', error);
    });

    socketRef.current = socket;

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = (event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('⚠️ Socket no conectado');
    }
  };

  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    emit,
    on,
    off
  };
}

/**
 * Hook para rastrear paquete en tiempo real
 */
export function usePackageTracking(packageId) {
  const { emit, on, off } = useSocket();
  const [location, setLocation] = useState(null);
  const [error] = useState(null);

  useEffect(() => {
    if (!packageId) return;

    // Suscribirse al paquete
    emit('subscribe-package', packageId);

    // Escuchar actualizaciones
    const handleLocationUpdate = (data) => {
      if (data.packageId === packageId) {
        setLocation(data);
      }
    };

    on('location-update', handleLocationUpdate);

    // Cleanup
    return () => {
      emit('unsubscribe-package', packageId);
      off('location-update', handleLocationUpdate);
    };
  }, [packageId, emit, on, off]);

  return { location, error };
}

export default useSocket;
