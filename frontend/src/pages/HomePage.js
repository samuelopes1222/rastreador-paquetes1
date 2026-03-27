import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import TrackingMap from '../components/TrackingMap';
import RouteCalculator from '../components/RouteCalculator';
import AnnouncementModal from '../components/AnnouncementModal';
import AnnouncementCarousel from '../components/AnnouncementCarousel';
import useDriverLocations from '../hooks/useDriverLocations';
import '../styles/HomePage.css';

function HomePage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculatedRoute, setCalculatedRoute] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userZone, setUserZone] = useState(null);
  const [locationStatus, setLocationStatus] = useState('checking'); // 'checking', 'prompt', 'success', 'error', 'denied', etc
  const [isDriver, setIsDriver] = useState(false); // Verificar si es repartidor registrado
  const [assignedDriver, setAssignedDriver] = useState(null); // Repartidor asignado al cliente
  
  // Hook para actualizaciones de ubicación en tiempo real
  const { drivers: realTimeDrivers, isConnected } = useDriverLocations();

  // Verificar si el usuario es un repartidor registrado
  useEffect(() => {
    const driverId = localStorage.getItem('driverId') || sessionStorage.getItem('driverId');
    const driverToken = localStorage.getItem('driverToken') || sessionStorage.getItem('driverToken');
    
    if (driverId && driverToken) {
      setIsDriver(true);
      console.log('✅ Repartidor detectado:', driverId);
    } else {
      setIsDriver(false);
      console.log('ℹ️ Usuario normal (no repartidor)');
    }
  }, []);

  // Obtener repartidor asignado al cliente
  const fetchAssignedDriver = async () => {
    try {
      // Intentar obtener el teléfono del cliente desde localStorage o usar un teléfono de ejemplo
      const clientPhone = localStorage.getItem('clientPhone') || '809-555-0123'; // TODO: Implementar login de cliente
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/packages/my-driver?phone=${encodeURIComponent(clientPhone)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.hasDriver) {
          setAssignedDriver(data.driver);
          console.log('✅ Repartidor asignado encontrado:', data.driver.name);
        } else {
          setAssignedDriver(null);
        }
      }
    } catch (error) {
      console.error('Error obteniendo repartidor asignado:', error);
      setAssignedDriver(null);
    }
  };

  // Cargar repartidor asignado cuando se monta el componente
  useEffect(() => {
    fetchAssignedDriver();
  }, []);

  useEffect(() => {
    const getApiBaseUrl = () => {
      const envUrl = process.env.REACT_APP_API_URL?.trim() || 'http://localhost:5000';
      return envUrl.replace(/\/api\/?$/, '');
    };

    // Cargar paquetes una sola vez al montar
    const fetchPackages = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/packages`);
        if (response.ok) {
          const result = await response.json();
          const pkgs = result.data ? result.data.slice(0, 10) : result.slice(0, 10);
          setPackages(pkgs);
        }
      } catch (error) {
        console.error('Error cargando paquetes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
    
    // Refrescar paquetes cada 30 segundos (no los conductores, eso se hace via Socket.io)
    const interval = setInterval(fetchPackages, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Estado para controlar permisos de ubicación
  const [locationPermission, setLocationPermission] = useState('unknown'); // 'unknown', 'granted', 'denied', 'prompt'

  const getUserLocation = useCallback(() => {
    setLocationStatus('detecting');
    console.log('🔍 Obteniendo ubicación exacta...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const userLoc = { lat: latitude, lng: longitude };

        console.log('✅ ¡Ubicación exacta obtenida!', {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy.toFixed(2) + ' metros',
          timestamp: new Date(position.timestamp).toLocaleString()
        });

        setUserLocation(userLoc);
        setUserZone(getZoneName(latitude, longitude));
        setLocationStatus('success');
      },
      (error) => {
        console.warn('⚠️ Error obteniendo ubicación:', error.message);

        if (error.code === 1) {
          setLocationStatus('denied');
          setLocationPermission('denied');
        } else if (error.code === 2) {
          setLocationStatus('error');
        } else if (error.code === 3) {
          setLocationStatus('error');
        }

        setUserLocation(null);
      },
      {
        enableHighAccuracy: true,    // Máxima precisión (GPS)
        timeout: 60000,              // 60 segundos timeout
        maximumAge: 0                // No usar caché - ubicación siempre nueva
      }
    );
  }, []);

  // Detectar ubicación del usuario al cargar la página
  useEffect(() => {
    let timeoutId;
    
    const checkLocationPermission = async () => {
      setLocationStatus('checking');
      console.log('🔍 Verificando permisos de ubicación...');

      // Timeout de seguridad - si tarda más de 2 segundos, mostrar prompt
      timeoutId = setTimeout(() => {
        console.warn('⚠️ Verificación de permisos timeout, mostrando prompt');
        if (locationStatus === 'checking') {
          setLocationStatus('prompt');
        }
      }, 2000);

      // Verificar si la geolocalización está disponible
      if (!navigator.geolocation) {
        console.warn('⚠️ Geolocalización no soportada por este navegador');
        clearTimeout(timeoutId);
        setLocationStatus('unsupported');
        setLocationPermission('denied');
        return;
      }

      // Verificar permisos si está disponible
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          console.log('📍 Estado del permiso:', permission.state);

          clearTimeout(timeoutId);
          setLocationPermission(permission.state);

          if (permission.state === 'granted') {
            // Si ya tiene permisos, obtener ubicación automáticamente
            getUserLocation();
          } else if (permission.state === 'denied') {
            setLocationStatus('denied');
          } else {
            // prompt, unknown o cualquier otro estado
            setLocationStatus('prompt');
          }

          // Escuchar cambios en el permiso
          permission.addEventListener('change', () => {
            console.log('📍 Permiso cambió a:', permission.state);
            setLocationPermission(permission.state);

            if (permission.state === 'granted') {
              getUserLocation();
            } else if (permission.state === 'denied') {
              setLocationStatus('denied');
              setUserLocation(null);
            }
          });
        } catch (error) {
          console.warn('⚠️ Error verificando permisos:', error);
          clearTimeout(timeoutId);
          setLocationPermission('unknown');
          // Mostrar prompt para solicitar permiso
          setLocationStatus('prompt');
        }
      } else {
        // Fallback para navegadores que no soportan permissions API
        // Mostrar botón para solicitar permiso
        clearTimeout(timeoutId);
        console.log('⚠️ navigator.permissions no disponible, mostrando botón de solicitud');
        setLocationStatus('prompt');
        setLocationPermission('unknown');
      }
    };

    checkLocationPermission();

    return () => {
      // Limpiar timeout al desmontar
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [getUserLocation, locationStatus]);

  const requestLocationPermission = () => {
    setLocationStatus('requesting');
    console.log('🔄 Solicitando permisos de ubicación...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const userLoc = { lat: latitude, lng: longitude };

        console.log('✅ ¡Ubicación exacta obtenida!', {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy.toFixed(2) + ' metros',
          timestamp: new Date(position.timestamp).toLocaleString()
        });

        setUserLocation(userLoc);
        setUserZone(getZoneName(latitude, longitude));
        setLocationStatus('success');
        setLocationPermission('granted');
      },
      (error) => {
        console.warn('⚠️ Error obteniendo ubicación:', error.message);

        if (error.code === 1) {
          setLocationStatus('denied');
          setLocationPermission('denied');
          console.warn('❌ Permiso denegado - Por favor habilita la ubicación');
        } else if (error.code === 2) {
          setLocationStatus('error');
          console.warn('❌ Ubicación no disponible - Intenta en otro lugar');
        } else if (error.code === 3) {
          setLocationStatus('error');
          console.warn('❌ Timeout - Intenta de nuevo');
        }

        setUserLocation(null);
      },
      {
        enableHighAccuracy: true,    // Máxima precisión (GPS)
        timeout: 60000,              // 60 segundos timeout
        maximumAge: 0                // No usar caché - ubicación siempre nueva
      }
    );
  };

  const getZoneName = (lat, lng) => {
    // Función para determinar la zona basada en coordenadas (Santo Domingo)
    if (!lat || !lng) return 'Zona Desconocida';
    
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    // Dividir el área en zonas (ejemplo simplificado)
    if (latNum > 18.50 && lngNum < -69.88) return 'Zona Norte';
    if (latNum < 18.45 && lngNum < -69.88) return 'Zona Sur';
    if (latNum > 18.45 && latNum < 18.50 && lngNum >= -69.88) return 'Zona Este';
    if (latNum > 18.45 && latNum < 18.50 && lngNum < -69.98) return 'Zona Oeste';
    return 'Zona Centro';
  };

  const makeCall = (phoneNumber) => {
    // Crear enlace para WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    window.open(whatsappUrl, '_blank');
  };

  // Filtrar repartidores por zona del usuario
  const getDriversInUserZone = () => {
    if (!userZone || !realTimeDrivers.length) return realTimeDrivers;
    
    return realTimeDrivers.filter(driver => {
      if (!driver.currentLat || !driver.currentLng) return false;
      const driverZone = getZoneName(driver.currentLat, driver.currentLng);
      return driverZone === userZone;
    });
  };

  const getLocationStatusMessage = () => {
    switch (locationStatus) {
      case 'checking':
        return { text: 'Verificando permisos de ubicación...', icon: '🔍', className: 'status-detecting' };
      case 'prompt':
        return { text: 'Haz click para permitir ubicación', icon: '📍', className: 'status-prompt', showButton: true };
      case 'requesting':
        return { text: 'Solicitando permisos...', icon: '⏳', className: 'status-detecting' };
      case 'detecting':
        return { text: 'Obteniendo ubicación exacta...', icon: '🔄', className: 'status-detecting' };
      case 'success':
        return { text: 'Ubicación detectada correctamente', icon: '✅', className: 'status-success' };
      case 'error':
        return { text: 'Error obteniendo ubicación', icon: '⚠️', className: 'status-warning' };
      case 'denied':
        return { text: 'Permiso de ubicación denegado', icon: '❌', className: 'status-error' };
      case 'unsupported':
        return { text: 'Geolocalización no soportada', icon: '🚫', className: 'status-error' };
      default:
        return { text: 'Estado desconocido', icon: '❓', className: 'status-unknown' };
    }
  };

  const locationStatusInfo = getLocationStatusMessage();

  // Función para actualizar ubicación manualmente
  const refreshLocation = () => {
    if (locationPermission === 'denied') {
      // Si los permisos están denegados, intentar solicitarlos de nuevo
      requestLocationPermission();
    } else if (locationPermission === 'granted') {
      // Si ya tiene permisos, obtener ubicación
      getUserLocation();
    } else {
      // Si no se sabe el estado, verificar permisos primero
      requestLocationPermission();
    }
  };

  const driversInZone = getDriversInUserZone();

  return (
    <div className="home-page">
      {/* Modal de Anuncio */}
      <AnnouncementModal />
      
      {/* Sección Hero con Mapa */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">🚚 TRANSPORTE WILLMORE</h1>
            <p className="hero-subtitle">Sigue tu paquete en tiempo real</p>
            <p className="hero-description">Sistema de rastreo para entregas en República Dominicana</p>
            
            <div className="social-buttons">
              <a href="https://instagram.com/transporte_willmore" target="_blank" rel="noopener noreferrer" className="btn btn-social btn-instagram">
                📷 Instagram
              </a>
              <a href="https://facebook.com/transportewillmore" target="_blank" rel="noopener noreferrer" className="btn btn-social btn-facebook">
                👍 Facebook
              </a>
            </div>
            
            <div className="hero-buttons">
              <Link to="/track" className="btn btn-primary">
                🔍 Rastrear Mi Paquete
              </Link>
              <Link to="/driver-register" className="btn btn-secondary btn-small">
                💼 Solicitar Trabajo
              </Link>
            </div>
          </div>

          <div className="hero-map">
            {loading ? (
              <div className="map-loader">Cargando mapa...</div>
            ) : (
              <TrackingMap 
                activeDrivers={driversInZone}
                packages={packages}
                calculatedRoute={calculatedRoute}
                selectedLocation={selectedLocation}
                userLocation={userLocation}
              />
            )}
          </div>
        </div>

        {/* Calculador de Rutas */}
        <RouteCalculator 
          onRouteCalculated={setCalculatedRoute}
          onLocationSelected={setSelectedLocation}
        />

        {/* Sección de Repartidor Asignado - Solo visible para clientes con paquetes */}
        {assignedDriver && !isDriver && (
          <div className="assigned-driver-section">
            <h2>🚚 Tu Repartidor Asignado</h2>
            <div className="assigned-driver-card">
              <div className="driver-header">
                <div className="driver-status-badge active">● Activo</div>
                <span className="driver-zone">Asignado automáticamente</span>
              </div>

              <div className="driver-info">
                <h3 className="driver-name">👤 {assignedDriver.name}</h3>
                
                <div className="driver-detail">
                  <span className="label">Vehículo:</span>
                  <span className="value">{assignedDriver.vehicle}</span>
                </div>

                <div className="driver-detail">
                  <span className="label">Placa:</span>
                  <span className="value">{assignedDriver.plate}</span>
                </div>

                <div className="driver-detail">
                  <span className="label">Calificación:</span>
                  <span className="value rating">⭐ {assignedDriver.rating || 5.0}/5.0</span>
                </div>

                <div className="driver-detail">
                  <span className="label">Entregas realizadas:</span>
                  <span className="value">{assignedDriver.totalDeliveries || 0}</span>
                </div>
              </div>

              <div className="driver-actions">
                <button 
                  className="btn-call"
                  onClick={(e) => {
                    e.stopPropagation();
                    makeCall(assignedDriver.phone);
                  }}
                  title={`Contactar a ${assignedDriver.name}`}
                >
                  📞 Llamar: {assignedDriver.phone}
                </button>
                <button 
                  className="btn-whatsapp"
                  onClick={(e) => {
                    e.stopPropagation();
                    const message = encodeURIComponent(`Hola ${assignedDriver.name}, soy cliente de Transporte Willmore. ¿Puedes darme información sobre mi paquete?`);
                    const whatsappUrl = `https://wa.me/1${assignedDriver.phone.replace(/[^0-9]/g, '')}?text=${message}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  title={`Enviar mensaje por WhatsApp a ${assignedDriver.name}`}
                >
                  💬 WhatsApp: {assignedDriver.phone}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sección de Repartidores Activos - Solo visible para repartidores registrados */}
        {isDriver && (
        <div className="active-drivers-section">
          <h2>🚚 Repartidores Activos en tu Zona</h2>
          {userZone && (
            <div className="user-zone-info">
              <span className="zone-badge">📍 Tu zona: {userZone}</span>
              <div className={`location-status ${locationStatusInfo.className}`}>
                <span className="status-icon">{locationStatusInfo.icon}</span>
                <span className="status-text">{locationStatusInfo.text}</span>
                {locationStatusInfo.showButton ? (
                  <button
                    onClick={requestLocationPermission}
                    className="request-location-btn"
                    title="Permitir ubicación"
                  >
                    📍 Permitir
                  </button>
                ) : (locationStatus === 'success' || locationStatus === 'error') && (
                  <button
                    onClick={refreshLocation}
                    className="refresh-location-btn"
                    title="Actualizar ubicación"
                  >
                    🔄
                  </button>
                )}
              </div>
            </div>
          )}
          {!isConnected ? (
            <div className="loading-message">Conectando a repartidores en tiempo real...</div>
          ) : driversInZone.length > 0 ? (
            <div className="drivers-grid">
              {driversInZone.map((driver) => (
                <div 
                  key={driver.id} 
                  className="driver-card"
                >
                  <div className="driver-header">
                    <div className="driver-status-badge active">● Activo</div>
                    <span className="driver-zone">{getZoneName(driver.currentLat, driver.currentLng)}</span>
                  </div>

                  <div className="driver-info">
                    <h3 className="driver-name">👤 {driver.name}</h3>
                    
                    <div className="driver-detail">
                      <span className="label">Vehículo:</span>
                      <span className="value">{driver.vehicle}</span>
                    </div>

                    <div className="driver-detail">
                      <span className="label">Placa:</span>
                      <span className="value">{driver.plate || 'N/A'}</span>
                    </div>

                    <div className="driver-detail">
                      <span className="label">Entregas:</span>
                      <span className="value">{driver.activePackages || 0} activas</span>
                    </div>

                    <div className="driver-detail">
                      <span className="label">Calificación:</span>
                      <span className="value rating">⭐ {driver.rating || 5.0}/5.0</span>
                    </div>

                    <div className="driver-detail">
                      <span className="label">Total entregado:</span>
                      <span className="value">{driver.totalDeliveries || 0}</span>
                    </div>
                  </div>

                  <div className="driver-actions">
                    <button 
                      className="btn-call"
                      onClick={(e) => {
                        e.stopPropagation();
                        makeCall(driver.phone);
                      }}
                      title={`Enviar mensaje por WhatsApp a ${driver.name}`}
                    >
                      💬 WhatsApp: {driver.phone}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-drivers-message">
              <p>No hay repartidores activos en tu zona actualmente</p>
              {userZone && <p><small>Zona detectada: {userZone}</small></p>}
            </div>
          )}
        </div>
        )}
      </section>

      {/* Sección de Características con Carrusel de Anuncios */}
      <section className="features-section">
        <h2 className="section-title">Nuestros Servicios</h2>
        <AnnouncementCarousel />
      </section>

      {/* Sección de Estadísticas */}
      <section className="stats-section">
        <h2 className="section-title">Nuestras Cifras en Tiempo Real</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3 className="stat-number">100+</h3>
            <p className="stat-label">Paquetes Entregados</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-number">0</h3>
            <p className="stat-label">Conductores Activos</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-number">100%</h3>
            <p className="stat-label">Tasa de Entrega</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-number">&lt;30min</h3>
            <p className="stat-label">Tiempo Promedio</p>
          </div>
        </div>
      </section>

      {/* Sección CTA */}
      <section className="cta-section">
        <h2>¿Preparado para rastrear tu paquete?</h2>
        <p>Accede a nuestro sistema y obtén actualizaciones en tiempo real</p>
        <Link to="/track" className="btn btn-large">
          Comenzar Ahora →
        </Link>
      </section>
    </div>
  );
}

export default HomePage;
