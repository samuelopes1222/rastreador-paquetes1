const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = require('./src/app');
const packagesRouter = require('./src/routes/packages');
const sequelize = require('./src/config/database');
const DriverSimulator = require('./src/services/driverSimulator');

// Cargar modelos para registro en Sequelize
require('./src/models/Driver');
require('./src/models/Package');
require('./src/models/TrackingHistory');
require('./src/models/DriverApplication');

// Create HTTP server
const server = http.createServer(app);

// Socket.io configuration
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Inicializar simulador de repartidores (para demostración)
const driverSimulator = new DriverSimulator(io);

// Exponer io a los middlewares y rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io - Real-time tracking
const activeTracking = new Map(); // PackageId -> tracking data
const activeDriversSubscribers = new Set(); // Rastrear clientes suscritos a actualizaciones de repartidores
const driverPackageMap = new Map(); // DriverId -> Set of PackageIds (para notificación cruzada)

io.on('connection', (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id}`);

  // Subscribe to driver location updates
  socket.on('subscribe-drivers', () => {
    activeDriversSubscribers.add(socket.id);
    console.log(`👥 ${socket.id} suscrito a actualizaciones de repartidores (total: ${activeDriversSubscribers.size})`);
  });

  // Unsubscribe from driver updates
  socket.on('unsubscribe-drivers', () => {
    activeDriversSubscribers.delete(socket.id);
    console.log(`👥 ${socket.id} desuscrito de actualizaciones de repartidores (total: ${activeDriversSubscribers.size})`);
  });

  // Subscribe to package tracking
  socket.on('subscribe-package', (packageId) => {
    socket.join(`package-${packageId}`);
    console.log(`📦 ${socket.id} suscrito a paquete: ${packageId}`);
    
    // Send current tracking if exists
    if (activeTracking.has(packageId)) {
      socket.emit('location-update', activeTracking.get(packageId));
    }
  });

  // Unsubscribe from package
  socket.on('unsubscribe-package', (packageId) => {
    socket.leave(`package-${packageId}`);
    console.log(`📦 ${socket.id} desuscrito de paquete: ${packageId}`);
  });

  // Update driver location
  socket.on('update-location', (data) => {
    const { packageId, driverId, lat, lng } = data;
    
    const trackingData = {
      packageId,
      driverId,
      lat,
      lng,
      timestamp: new Date().toISOString(),
      accuracy: data.accuracy,
    };

    // Store active tracking
    activeTracking.set(packageId, trackingData);

    // Broadcast to all subscribed to this package
    io.to(`package-${packageId}`).emit('location-update', trackingData);
    
    console.log(`📍 Ubicación actualizada - Paquete: ${packageId}, Coordenadas: ${lat}, ${lng}`);
  });

  // Driver status update
  socket.on('driver-status', (data) => {
    const { driverId, status } = data;
    io.emit('driver-status-update', { driverId, status, timestamp: new Date() });
  });

  // Driver location update from mobile app
  socket.on('driver-location-update', (data) => {
    const { driverId, lat, lng, timestamp, status } = data;
    
    const locationData = {
      driverId,
      lat,
      lng,
      timestamp: timestamp || new Date().toISOString(),
      status: status || 'active'
    };

    // Broadcast only to subscribed clients
    if (activeDriversSubscribers.size > 0) {
      io.emit('driver-location-update', locationData);
    }

    // También notificar a los clientes que rastrean paquetes del repartidor
    if (driverPackageMap.has(driverId)) {
      const packageIds = driverPackageMap.get(driverId);
      packageIds.forEach(packageId => {
        io.to(`package-${packageId}`).emit('driver-location-realtime', {
          driverId,
          lat,
          lng,
          timestamp: locationData.timestamp,
          status
        });
      });
    }
    
    console.log(`📍 Ubicación repartidor: ${driverId} - Lat: ${lat}, Lng: ${lng}`);
  });

  // Register driver's assigned packages (called by driver app when loading packages)
  socket.on('register-assigned-packages', (data) => {
    const { driverId, packageIds } = data;
    if (driverId && packageIds && Array.isArray(packageIds)) {
      driverPackageMap.set(driverId, new Set(packageIds));
      console.log(`✅ Repartidor ${driverId} registrado con ${packageIds.length} paquetes asignados`);
    }
  });

  // Delivery notification
  socket.on('delivery-complete', (data) => {
    const { packageId, rating, feedback } = data;
    io.to(`package-${packageId}`).emit('delivery-completed', {
      packageId,
      rating,
      feedback,
      timestamp: new Date().toISOString(),
    });
    activeTracking.delete(packageId);
  });

  // Disconnect
  socket.on('disconnect', () => {
    activeDriversSubscribers.delete(socket.id);
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });

  // Error handling
  socket.on('error', (err) => {
    console.error(`Socket error (${socket.id}):`, err);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('✅ Base de datos sincronizada');
    server.listen(PORT, () => {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📍 Cliente URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
      console.log(`${'='.repeat(50)}\n`);

      // Simulación de repartidores DESACTIVADA - Usar solo ubicaciones reales de GPS
      // Para activar en desarrollo: driverSimulator.start();
      // driverSimulator.start();

      // Iniciar simulación de movimiento de paquetes
      packagesRouter.startSimulation(io);
    });
  })
  .catch((err) => {
    console.error('❌ Error sincronizando la base de datos:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📡 SIGTERM recibido. Cerrando servidor...');
  // driverSimulator.stop(); // Simulador desactivado
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

module.exports = { app, io, server };
