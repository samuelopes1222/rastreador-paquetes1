/**
 * Simulador de movimiento de repartidores
 * Simula actualizaciones de ubicación para demostración
 * 
 * En producción, reemplazar con ubicaciones reales de GPS
 */

const Driver = require('../models/Driver');

class DriverSimulator {
  constructor(io) {
    this.io = io;
    this.simulationInterval = null;
    this.driverRoutes = new Map();
  }

  /**
   * Iniciar simulador de movimiento
   */
  start() {
    console.log('🚗 Iniciando simulador de movimiento de repartidores');
    
    // Actualizar ubicación cada 5 segundos
    this.simulationInterval = setInterval(async () => {
      await this.simulateDriverMovement();
    }, 5000);
  }

  /**
   * Detener simulador
   */
  stop() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      console.log('🛑 Simulador detenido');
    }
  }

  /**
   * Simular movimiento de repartidores activos
   */
  async simulateDriverMovement() {
    try {
      // Obtener todos los repartidores activos
      const activeDrivers = await Driver.findAll({
        where: { status: 'active' }
      });

      for (const driver of activeDrivers) {
        // Si el repartidor no tiene ruta, crear una
        if (!this.driverRoutes.has(driver.id)) {
          this.createRandomRoute(driver.id);
        }

        // Obtener la ruta actual
        const route = this.driverRoutes.get(driver.id);
        
        // Mover al siguiente punto
        const nextPoint = route.points[route.currentPointIndex];
        
        // Actualizar ubicación en la base de datos
        await driver.update({
          currentLat: nextPoint.lat,
          currentLng: nextPoint.lng,
          lastLocationUpdate: new Date()
        });

        // Emitir evento vía Socket.io
        if (this.io) {
          this.io.emit('driver-location-update', {
            driverId: driver.id,
            lat: nextPoint.lat,
            lng: nextPoint.lng,
            status: 'active',
            timestamp: new Date().toISOString()
          });
        }

        // Avanzar al siguiente punto
        route.currentPointIndex = (route.currentPointIndex + 1) % route.points.length;
      }
    } catch (error) {
      console.error('Error en simulador:', error);
    }
  }

  /**
   * Crear una ruta aleatoria para un repartidor
   * Las rutas son puntos en Santo Domingo, República Dominicana
   */
  createRandomRoute(driverId) {
    const baseZones = [
      { center: { lat: 18.4861, lng: -69.9312 }, name: 'Centro' },
      { center: { lat: 18.5095, lng: -69.8774 }, name: 'Zona Este' },
      { center: { lat: 18.4521, lng: -69.9586 }, name: 'Zona Sur' },
      { center: { lat: 18.5152, lng: -69.9871 }, name: 'Zona Oeste' },
      { center: { lat: 18.5267, lng: -69.9312 }, name: 'Zona Norte' },
    ];

    // Seleccionar una zona aleatoria
    const zone = baseZones[Math.floor(Math.random() * baseZones.length)];
    
    // Generar 5-8 puntos alrededor de la zona
    const points = [];
    const pointCount = Math.floor(Math.random() * 4) + 5; // 5-8 puntos
    
    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * 2 * Math.PI;
      const distance = (Math.random() * 0.03 + 0.01); // 1-4 km aprox
      
      points.push({
        lat: zone.center.lat + distance * Math.cos(angle),
        lng: zone.center.lng + distance * Math.sin(angle),
        zone: zone.name
      });
    }

    // Guardar la ruta
    this.driverRoutes.set(driverId, {
      driverId,
      zone: zone.name,
      points,
      currentPointIndex: 0,
      createdAt: new Date()
    });

    console.log(`📍 Ruta creada para repartidor ${driverId} en ${zone.name}`);
  }

  /**
   * Obtener información de la ruta de un repartidor
   */
  getDriverRoute(driverId) {
    return this.driverRoutes.get(driverId);
  }

  /**
   * Resetear todas las rutas (útil para reinicio)
   */
  resetAllRoutes() {
    this.driverRoutes.clear();
    console.log('🔄 Todas las rutas fueron reseteadas');
  }
}

module.exports = DriverSimulator;
