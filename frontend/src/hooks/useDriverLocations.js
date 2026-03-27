import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

/**
 * Hook personalizado para escuchar actualizaciones de ubicación de repartidores en tiempo real
 * Usa Socket.io para recibir cambios de ubicación y emite eventos
 */
function useDriverLocations() {
  const [drivers, setDrivers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const getApiBaseUrl = () => {
      const envUrl = process.env.REACT_APP_API_URL?.trim() || 'http://localhost:5000';
      return envUrl.replace(/\/api\/?$/, '');
    };

    // Conectar a Socket.io
    const socketURL = getApiBaseUrl();
    
    socketRef.current = io(socketURL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Evento de conexión
    socketRef.current.on('connect', () => {
      console.log('✅ Conectado a Socket.io para ubicaciones de repartidores');
      setIsConnected(true);
      // Suscribirse a actualizaciones de conductor
      socketRef.current.emit('subscribe-drivers');
      
      // Obtener la lista inicial de repartidores activos por API
      fetchActiveDrivers();
    });

    // Función para obtener repartidores activos del API
    const fetchActiveDrivers = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/api/drivers/active`);
        if (response.ok) {
          const result = await response.json();
          const activeDriversList = result.data || result || [];
          console.log('✅ Repartidores activos cargados:', activeDriversList.length);
          setDrivers(activeDriversList);
        }
      } catch (error) {
        console.warn('⚠️ Error cargando repartidores activos:', error);
      }
    };

    // Recargar repartidores activos cada 30 segundos
    const refreshInterval = setInterval(fetchActiveDrivers, 30000);

    // Escuchar actualizaciones de ubicación de repartidores
    socketRef.current.on('driver-location-update', (data) => {
      const { driverId, lat, lng, status } = data;
      
      setDrivers(prevDrivers => {
        const existingDriver = prevDrivers.find(d => d.id === driverId);
        
        if (existingDriver) {
          // Actualizar ubicación del repartidor existente
          return prevDrivers.map(d => 
            d.id === driverId 
              ? {
                  ...d,
                  currentLat: lat,
                  currentLng: lng,
                  status: status || d.status,
                  lastLocationUpdate: new Date().toISOString()
                }
              : d
          );
        } else {
          // Agregar nuevo repartidor
          return [...prevDrivers, {
            id: driverId,
            currentLat: lat,
            currentLng: lng,
            status: status || 'active',
            lastLocationUpdate: new Date().toISOString(),
            name: 'Repartidor',
            vehicle: 'Motocicleta'
          }];
        }
      });
    });

    // Escuchar actualizaciones de estado de repartidores
    socketRef.current.on('driver-status-update', (data) => {
      const { driverId, status } = data;
      
      setDrivers(prevDrivers =>
        prevDrivers.map(d =>
          d.id === driverId
            ? { ...d, status }
            : d
        )
      );
    });

    // Escuchar lista completa de conductores activos
    socketRef.current.on('active-drivers-update', (activeDrivers) => {
      console.log('📍 Actualizando lista de repartidores activos:', activeDrivers.length);
      setDrivers(activeDrivers);
    });

    // Evento de desconexión
    socketRef.current.on('disconnect', () => {
      console.log('❌ Desconectado de Socket.io');
      setIsConnected(false);
    });

    // Evento de reconexión
    socketRef.current.on('reconnect', () => {
      console.log('🔄 Reconectado a Socket.io');
      setIsConnected(true);
      socketRef.current.emit('subscribe-drivers');
    });

    // Función de limpieza
    return () => {
      clearInterval(refreshInterval); // Limpiar intervalo
      if (socketRef.current) {
        socketRef.current.emit('unsubscribe-drivers');
        socketRef.current.disconnect();
      }
    };
  }, []);

  /**
   * Función para actualizar la ubicación de un repartidor
   * Se usa desde la app móvil del repartidor
   */
  const updateDriverLocation = (driverId, lat, lng) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('driver-location-update', {
        driverId,
        lat,
        lng,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('Socket.io no conectado');
    }
  };

  return {
    drivers,
    isConnected,
    updateDriverLocation
  };
}

export default useDriverLocations;
