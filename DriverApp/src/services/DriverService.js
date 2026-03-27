import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class DriverService {
  constructor() {
    this.socket = null;
    this.apiUrl = 'http://localhost:5000/api'; // Cambiar por tu IP/URL en producción
  }

  // Conectar al servidor WebSocket
  connect() {
    if (this.socket?.connected) return;

    this.socket = io('http://localhost:5000', {
      transports: ['websocket'],
      upgrade: false,
    });

    this.socket.on('connect', () => {
      console.log('Conectado al servidor WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado del servidor WebSocket');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión WebSocket:', error);
    });
  }

  // Desconectar del servidor
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Obtener token de autenticación
  async getAuthToken() {
    return await AsyncStorage.getItem('driver_token');
  }

  // Headers con autenticación
  async getAuthHeaders() {
    const token = await this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Login del conductor
  async login(cedula, password) {
    try {
      const response = await fetch(`${this.apiUrl}/drivers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, password }),
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Obtener perfil del conductor
  async getDriverProfile() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.apiUrl}/drivers/profile`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Error al obtener perfil');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Obtener pedidos disponibles
  async getAvailableOrders() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.apiUrl}/packages/available`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Error al obtener pedidos');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Aceptar pedido
  async acceptOrder(orderId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.apiUrl}/packages/${orderId}/accept`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Error al aceptar pedido');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Actualizar estado del pedido
  async updateOrderStatus(orderId, status, location = null) {
    try {
      const headers = await this.getAuthHeaders();
      const body = { status };
      if (location) {
        body.location = location;
      }

      const response = await fetch(`${this.apiUrl}/packages/${orderId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Actualizar ubicación del conductor
  async updateDriverLocation(driverId, location) {
    try {
      const headers = await this.getAuthHeaders();
      
      // Actualizar en la API
      const response = await fetch(`${this.apiUrl}/drivers/${driverId}/location`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          lat: location.latitude,
          lng: location.longitude,
        }),
      });

      if (!response.ok) {
        throw new Error('Error actualizando ubicación');
      }

      // Emitir actualización por WebSocket para tiempo real
      if (this.socket?.connected) {
        this.socket.emit('driver-location-update', {
          driverId,
          lat: location.latitude,
          lng: location.longitude,
          status: 'active'
        });
        console.log('📍 Ubicación enviada (WebSocket):', { latitude: location.latitude, longitude: location.longitude });
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  // Registrar paquetes asignados al repartidor (para rastreo de cliente)
  registerAssignedPackages(driverId, packageIds = []) {
    if (this.socket?.connected) {
      this.socket.emit('register-assigned-packages', {
        driverId,
        packageIds
      });
      console.log('📦 Paquetes registrados para rastreo de cliente:', packageIds);
    }
  }

  // Suscribirse a actualizaciones de un pedido
  subscribeToOrder(orderId, callback) {
    if (this.socket) {
      this.socket.emit('subscribe-package', orderId);
      this.socket.on('location-update', callback);
      this.socket.on('order-update', callback);
    }
  }

  // Cancelar suscripción a pedido
  unsubscribeFromOrder(orderId) {
    if (this.socket) {
      this.socket.emit('unsubscribe-package', orderId);
      this.socket.off('location-update');
      this.socket.off('order-update');
    }
  }

  // Escuchar nuevos pedidos disponibles
  onNewOrderAvailable(callback) {
    if (this.socket) {
      this.socket.on('new-order', callback);
    }
  }

  // Escuchar actualizaciones de ubicación de conductores
  onDriverLocationUpdate(callback) {
    if (this.socket) {
      this.socket.on('driver-location-update', callback);
    }
  }

  // Verificar si el repartidor está cerca del destino de entrega
  async checkDeliveryProximity(packageId, driverId, location) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.apiUrl}/packages/${packageId}/delivery-proximity?driverId=${driverId}&driverLat=${location.latitude}&driverLng=${location.longitude}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error('Error verificando proximidad');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking delivery proximity:', error);
      throw error;
    }
  }

  // Enviar mensaje del repartidor al cliente
  async sendMessageToClient(driverId, packageId, message, channel = 'sms') {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.apiUrl}/drivers/${driverId}/message-client`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ packageId, message, channel }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar mensaje al cliente');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message to client:', error);
      throw error;
    }
  }

  // Confirmar entrega cuando el repartidor llegó al destino y el cliente confirmó
  async confirmDelivery(packageId, driverId, location, clientConfirmation, signature = null, photo = null) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.apiUrl}/packages/${packageId}/confirm-delivery`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          driverId,
          driverLat: location.latitude,
          driverLng: location.longitude,
          clientConfirmation, // Nombre o confirmación del cliente
          signature,           // Firma (opcional)
          photo                // Foto (opcional)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error confirmando entrega');
      }

      const result = await response.json();

      // Emitir evento de entrega completada por WebSocket
      if (this.socket?.connected) {
        this.socket.emit('delivery-complete', {
          packageId,
          driverId,
          clientConfirmation,
          timestamp: new Date().toISOString()
        });
        console.log('📦 Entrega confirmada:', packageId);
      }

      return result;
    } catch (error) {
      console.error('Error confirming delivery:', error);
      throw error;
    }
  }

  // Dejar de escuchar nuevos pedidos
  offNewOrderAvailable() {
    if (this.socket) {
      this.socket.off('new-order');
    }
  }
}

// Instancia singleton
const driverService = new DriverService();

export default driverService;