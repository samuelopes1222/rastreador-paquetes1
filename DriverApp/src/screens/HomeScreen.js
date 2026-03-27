import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  Linking,
  Platform,
  TextInput,
  // PermissionsAndroid, // GPS DESACTIVADO
} from 'react-native';
// import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'; // GPS DESACTIVADO
// import Geolocation from '@react-native-community/geolocation'; // GPS DESACTIVADO
// import { request, PERMISSIONS, RESULTS } from 'react-native-permissions'; // GPS DESACTIVADO
import { useDriver } from '../context/DriverContext';
import driverService from '../services/DriverService';

export default function HomeScreen() {
  const {
    driver,
    currentLocation,
    activeOrder,
    isOnline,
    setOnlineStatus,
    updateLocation,
    logout
  } = useDriver();

  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationRetrying, setLocationRetrying] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Función para pedir permisos de ubicación - DESACTIVADA
  const requestLocationPermission = async () => {
    console.log('🚫 GPS DESACTIVADO - No se piden permisos de ubicación');
    return true; // Simular que los permisos están OK
  };

  // Verificar permisos al iniciar la app
  const checkInitialPermissions = async () => {
    console.log('🚀 Iniciando verificación de permisos...');
    const hasPermission = await requestLocationPermission();
    console.log('🔐 ¿Tiene permisos?', hasPermission);

    if (!hasPermission) {
      console.log('❌ No tiene permisos, mostrando alert...');
      Alert.alert(
        'Permisos requeridos',
        'Para usar esta app necesitas conceder permisos de ubicación. Ve a ajustes y activa la ubicación para esta app.',
        [
          { text: 'OK', onPress: () => console.log('✅ Usuario hizo clic en OK del alert') }
        ]
      );
    } else {
      console.log('✅ Tiene permisos, intentando obtener ubicación inicial...');
      // GPS DESACTIVADO - No obtener ubicación inicial
      // try {
      //   await getCurrentLocation();
      //   console.log('✅ Ubicación inicial obtenida correctamente');
      // } catch (error) {
      //   console.warn('❌ Error obteniendo ubicación inicial:', error);
      // }
    }
  };

  useEffect(() => {
    // Verificar permisos al iniciar la app
    checkInitialPermissions();

    // Conectar al WebSocket
    driverService.connect();

    // Escuchar actualizaciones de ubicación de otros conductores
    driverService.onDriverLocationUpdate((data) => {
      setActiveDrivers(prev => {
        const existing = prev.find(d => d.id === data.driverId);
        if (existing) {
          return prev.map(d => d.id === data.driverId ? { ...d, currentLat: data.lat, currentLng: data.lng } : d);
        } else {
          return [...prev, { id: data.driverId, name: data.name || 'Conductor', currentLat: data.lat, currentLng: data.lng }];
        }
      });
    });

    return () => {
      driverService.disconnect();
    };
  }, []);

  // Actualizar ubicación cada 10 segundos si está online - GPS DESACTIVADO
  // useEffect(() => {
  //   let interval;
  //   if (isOnline) {
  //     interval = setInterval(() => {
  //       getCurrentLocation();
  //     }, 10000); // Cada 10 segundos
  //   }
  //   return () => clearInterval(interval);
  // }, [isOnline]);

  const getCurrentLocation = async (showPermissionModal = false) => {
    console.log('� GPS DESACTIVADO - getCurrentLocation no hace nada');
    return null; // GPS desactivado
  };

  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;

    if (newStatus) {
      console.log('🔄 Activando online (GPS DESACTIVADO)...');

      // GPS DESACTIVADO - No mostrar modal ni pedir permisos
      setOnlineStatus(true);
      Alert.alert('✅ Éxito', 'Ahora estás en línea y puedes recibir pedidos (GPS desactivado)');
    } else {
      setOnlineStatus(false);
      setLocationModalVisible(false);
      Alert.alert('Estado', 'Ahora estás fuera de línea');
    }
  };

  // const openLocationSettings = () => { // GPS DESACTIVADO
  //   if (Platform.OS === 'ios') {
  //     Linking.openURL('app-settings:');
  //   } else {
  //     Linking.openSettings();
  //   }
  // };

  const handleRetryLocation = async () => {
    console.log('🔄 Reintentando obtener ubicación...');
    setLocationRetrying(true);

    try {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        await getCurrentLocation(false);
        setLocationModalVisible(false);
        Alert.alert('✅ Éxito', 'Ubicación obtenida correctamente. Ahora puedes activarte online.');
      } else {
        Alert.alert('Permisos requeridos', 'Necesitas conceder permisos de ubicación para continuar.');
      }
    } catch (error) {
      console.warn('❌ Error en reintento:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación. Intenta de nuevo.');
    } finally {
      setLocationRetrying(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: logout
        },
      ]
    );
  };

  const acceptOrder = async (order) => {
    try {
      setLoading(true);
      await driverService.acceptOrder(order.id);
      Alert.alert('Éxito', `Pedido ${order.id} aceptado`);
      // Aquí se actualizaría el estado del pedido activo
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!activeOrder) {
      return Alert.alert('Error', 'No hay un pedido activo para enviar mensaje');
    }

    if (!messageText.trim()) {
      return Alert.alert('Error', 'Ingresa un mensaje antes de enviar');
    }

    try {
      setSendingMessage(true);
      await driverService.sendMessageToClient(driver.id, activeOrder.id, messageText.trim(), 'sms');
      Alert.alert('✅ Mensaje enviado', 'El cliente ha recibido tu mensaje');
      setMessageText('');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      Alert.alert('Error', error.message || 'No se pudo enviar el mensaje');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>
            {driver?.name || 'Conductor'}
          </Text>
          <Text style={styles.driverStatus}>
            {isOnline ? 'En línea' : 'Fuera de línea'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.onlineButton, isOnline && styles.onlineButtonActive]}
          onPress={toggleOnlineStatus}
        >
          <Text style={[styles.onlineButtonText, isOnline && styles.onlineButtonTextActive]}>
            {isOnline ? 'En línea' : 'Fuera de línea'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mapa - GPS DESACTIVADO */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text>🗺️ Mapa desactivado (GPS no disponible)</Text>
          <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
            La funcionalidad de GPS está temporalmente desactivada
          </Text>
        </View>
      </View>

      {/* Modal GPS DESACTIVADO */}
      {/* <Modal
        visible={locationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Activa GPS</Text>
            <Text style={styles.modalText}>
              Para que el rastreo funcione correctamente necesitas habilitar los permisos de ubicación.
            </Text>
            <Text style={styles.modalSubTitle}>Android</Text>
            <Text style={styles.modalText}>Ajustes → Aplicaciones → Rastreador de Paquetes → Permisos → Ubicación</Text>
            <Text style={styles.modalSubTitle}>iOS</Text>
            <Text style={styles.modalText}>Ajustes → Privacidad → Localización → Rastreador de Paquetes → "Al usar" o "Siempre"</Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalButton} onPress={openLocationSettings}>
                <Text style={styles.modalButtonText}>Abrir ajustes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonSecondary} onPress={handleRetryLocation} disabled={locationRetrying}>
                <Text style={styles.modalButtonText}>{locationRetrying ? 'Reintentando...' : 'Reintentar'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setLocationModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: '#444' }]}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal> */}

      {/* Controles inferiores */}
      <View style={styles.bottomControls}>
        {activeOrder ? (
          <View style={styles.activeOrderCard}>
            <Text style={styles.orderTitle}>Pedido Activo</Text>
            <Text style={styles.orderId}>#{activeOrder.id}</Text>
            <Text style={styles.orderAddress}>
              Destino: {activeOrder.deliveryAddress}
            </Text>

            <TextInput
              style={styles.messageInput}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Escribe mensaje para el cliente..."
              multiline
            />

            <TouchableOpacity
              style={[styles.sendMessageButton, sendingMessage ? styles.buttonDisabled : null]}
              onPress={handleSendMessage}
              disabled={sendingMessage}
            >
              <Text style={styles.sendMessageButtonText}>
                {sendingMessage ? 'Enviando...' : 'Enviar mensaje al cliente'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.completeButton}>
              <Text style={styles.completeButtonText}>Completar Entrega</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.availableOrders}>
            <Text style={styles.availableTitle}>
              Pedidos disponibles: {availableOrders.length}
            </Text>
            {availableOrders.slice(0, 2).map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => acceptOrder(order)}
                disabled={loading}
              >
                <Text style={styles.orderCardTitle}>Pedido #{order.id}</Text>
                <Text style={styles.orderCardAddress}>
                  {order.pickupAddress}
                </Text>
                <Text style={styles.orderCardReward}>RD$ {order.reward}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  driverStatus: {
    fontSize: 14,
    color: '#666',
  },
  onlineButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  onlineButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  onlineButtonText: {
    fontSize: 14,
    color: '#666',
  },
  onlineButtonTextActive: {
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  bottomControls: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  activeOrderCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  orderAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  availableOrders: {
    marginBottom: 16,
  },
  availableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  orderCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderCardAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  orderCardReward: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  messageInput: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  sendMessageButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  sendMessageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalSubTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  modalText: {
    fontSize: 13,
    color: '#333',
    marginVertical: 4,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 10,
    marginRight: 6,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: '#5a5a5a',
    borderRadius: 8,
    padding: 10,
    marginLeft: 6,
    alignItems: 'center',
  },
  modalCloseButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});