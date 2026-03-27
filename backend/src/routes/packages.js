const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');

// Lazy load Driver model to avoid circular dependencies
let Driver;
try {
  Driver = require('../models/Driver');
} catch (e) {
  // Fallback if model not available
  Driver = null;
}

// Ruta al archivo de datos persistentes
const PACKAGES_FILE = path.join(__dirname, '../../data/packages.json');

// Crear directorio si no existe
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Simular datos de paquetes
let packages = [];

// Función para cargar paquetes desde archivo
function loadPackagesFromFile() {
  try {
    if (fs.existsSync(PACKAGES_FILE)) {
      const data = fs.readFileSync(PACKAGES_FILE, 'utf-8');
      packages = JSON.parse(data || '[]');
      console.log(`📦 ${packages.length} paquetes cargados desde persistencia`);
    } else {
      console.log('📦 Archivo de paquetes no existe, iniciando vacío');
    }
  } catch (error) {
    console.error('Error cargando paquetes desde archivo:', error);
    packages = [];
  }
}

// Función para guardar paquetes en archivo
function savePackagesToFile() {
  try {
    fs.writeFileSync(PACKAGES_FILE, JSON.stringify(packages, null, 2), 'utf-8');
    console.log(`💾 ${packages.length} paquetes guardados en persistencia`);
  } catch (error) {
    console.error('Error guardando paquetes en archivo:', error);
  }
}

// Cargar paquetes al iniciar
loadPackagesFromFile();

// Simulación de movimiento en tiempo real
let simulationInterval = null;

// Helper para identificar ruta única (origen-destino)
function getPackageRouteKey(pkg) {
  const origin = pkg.originAddress || pkg.address || 'origen-desconocido';
  const destination = pkg.destinationAddress || 'destino-desconocido';
  return `${origin}|${destination}`;
}

// Asigna hasta `maxPackages` al conductor, preferencia rutas diferentes
async function assignPackagesToDriver(driver, maxPackages = 5) {
  if (!driver || !driver.id) return [];

  const activeDriverPackages = packages.filter(p => p.assignedDriverId === driver.id && !['delivered', 'failed'].includes(p.status));
  const activeCount = activeDriverPackages.length;
  const toAssignCount = Math.max(0, maxPackages - activeCount);

  if (toAssignCount <= 0) return activeDriverPackages;

  const assignedRouteKeys = new Set(activeDriverPackages.map(getPackageRouteKey));

  const candidates = packages.filter(p => !p.assignedDriverId && ['pending', 'pending_pickup', 'pending_payment'].includes(p.status));

  const newAssigned = [];

  // Fase 1: buscar paquetes de rutas distintas
  for (const pkg of candidates) {
    if (newAssigned.length >= toAssignCount) break;
    const routeKey = getPackageRouteKey(pkg);
    if (assignedRouteKeys.has(routeKey)) continue;

    assignedRouteKeys.add(routeKey);
    pkg.assignedDriverId = driver.id;
    pkg.assignedDriverName = driver.name;
    pkg.status = 'pending_pickup';
    pkg.history = pkg.history || [];
    pkg.history.push({ timestamp: new Date().toISOString(), status: 'assigned', description: 'Asignado automáticamente al conductor' });
    newAssigned.push(pkg);

    try {
      const notificationService = require('../services/notificationService');
      await notificationService.sendPackageToDriver(driver, {
        packageCode: pkg.packageCode || pkg.code || `PKG-${pkg.id}`,
        originAddress: pkg.originAddress || pkg.address || 'Orígen desconocido',
        destinationAddress: pkg.destinationAddress || 'Destino desconocido',
        recipient: pkg.recipient || 'Destinatario',
        recipientPhone: pkg.recipientPhone || 'N/A',
        sender: pkg.sender || 'Remitente'
      });
    } catch (err) {
      console.error('Error notificando paquete asignado al conductor:', err.message);
    }
  }

  // Fase 2: si aún faltan paquetes, asignar cualquier paquete disponible (incluso rutas repetidas)
  if (newAssigned.length < toAssignCount) {
    for (const pkg of candidates) {
      if (newAssigned.length >= toAssignCount) break;
      if (pkg.assignedDriverId) continue; // ya asignado

      pkg.assignedDriverId = driver.id;
      pkg.assignedDriverName = driver.name;
      pkg.status = 'pending_pickup';
      pkg.history = pkg.history || [];
      pkg.history.push({ timestamp: new Date().toISOString(), status: 'assigned', description: 'Asignado automáticamente (ruta repetida)' });
      newAssigned.push(pkg);

      try {
        const notificationService = require('../services/notificationService');
        await notificationService.sendPackageToDriver(driver, {
          packageCode: pkg.packageCode || pkg.code || `PKG-${pkg.id}`,
          originAddress: pkg.originAddress || pkg.address || 'Orígen desconocido',
          destinationAddress: pkg.destinationAddress || 'Destino desconocido',
          recipient: pkg.recipient || 'Destinatario',
          recipientPhone: pkg.recipientPhone || 'N/A',
          sender: pkg.sender || 'Remitente'
        });
      } catch (err) {
        console.error('Error notificando paquete asignado al conductor en fase 2:', err.message);
      }
    }
  }

  return activeDriverPackages.concat(newAssigned);
}

function startLocationSimulation(io) {
  if (simulationInterval) return; // Ya está corriendo

  console.log('🚗 Iniciando simulación de movimiento de repartidores...');

  simulationInterval = setInterval(() => {
    packages.forEach(pkg => {
      if (pkg.status === 'in_transit') {
        // Simular movimiento hacia el destino
        const currentLat = pkg.location.lat;
        const currentLng = pkg.location.lng;
        const destLat = pkg.destinationLocation.lat;
        const destLng = pkg.destinationLocation.lng;

        // Calcular dirección hacia el destino
        const latDiff = destLat - currentLat;
        const lngDiff = destLng - currentLng;

        // Movimiento pequeño (simulando velocidad realista)
        const speed = 0.0001; // grados por actualización
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

        if (distance > 0.001) { // Si no está cerca del destino
          const newLat = currentLat + (latDiff / distance) * speed;
          const newLng = currentLng + (lngDiff / distance) * speed;

          pkg.location = {
            lat: newLat,
            lng: newLng,
            timestamp: Date.now()
          };

          // Emitir actualización a clientes suscritos
          io.to(`package-${pkg.id}`).emit('location-update', {
            packageId: pkg.id,
            driverId: pkg.assignedDriver,
            driverName: pkg.driverName,
            location: pkg.location,
            status: pkg.status,
            destination: pkg.destinationLocation,
            eta: '15 minutos'
          });

          console.log(`📍 Paquete ${pkg.id} movido a: ${newLat.toFixed(6)}, ${newLng.toFixed(6)}`);
        } else {
          // Llegó al destino
          pkg.status = 'out_for_delivery';
          pkg.location = pkg.destinationLocation;

          // Agregar al historial
          pkg.history.push({
            timestamp: new Date().toISOString(),
            status: 'out_for_delivery',
            description: 'Llegó al área de entrega'
          });

          io.to(`package-${pkg.id}`).emit('location-update', {
            packageId: pkg.id,
            driverId: pkg.assignedDriver,
            driverName: pkg.driverName,
            location: pkg.location,
            status: pkg.status,
            message: '¡El repartidor está en tu área!'
          });

          console.log(`🎯 Paquete ${pkg.id} llegó al destino`);
        }
      }
    });
  }, 5000); // Actualizar cada 5 segundos
}

function stopLocationSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('🛑 Simulación de movimiento detenida');
  }
}

// Exportar funciones para el servidor
router.startSimulation = (io) => startLocationSimulation(io);
router.stopSimulation = stopLocationSimulation;

// GET /api/packages - Obtener todos los paquetes (para admin)
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo paquetes'
    });
  }
});

// GET /api/packages/driver/:driverId - Obtener paquetes asignados a un conductor
router.get('/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const driverPackages = packages.filter(pkg => pkg.assignedDriver === driverId);

    res.json({
      success: true,
      data: driverPackages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo paquetes del conductor'
    });
  }
});

// GET /api/packages/my-driver - Obtener repartidor asignado al cliente (basado en sus paquetes)
router.get('/my-driver', async (req, res) => {
  try {
    console.log('🔍 Endpoint /my-driver llamado');
    // Obtener el teléfono del cliente desde query params o headers
    const clientPhone = req.query.phone || req.headers['x-client-phone'];
    console.log('📞 Teléfono del cliente:', clientPhone);

    if (!clientPhone) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el teléfono del cliente'
      });
    }

    // Buscar paquetes del cliente que tengan repartidor asignado
    const clientPackages = packages.filter(pkg =>
      (pkg.senderPhone === clientPhone || pkg.recipientPhone === clientPhone) &&
      pkg.assignedDriverId &&
      !['delivered', 'failed', 'cancelled'].includes(pkg.status)
    );

    console.log(`📦 Paquetes encontrados para ${clientPhone}:`, clientPackages.length);

    if (clientPackages.length === 0) {
      return res.json({
        success: true,
        hasDriver: false,
        message: 'No tienes paquetes con repartidor asignado actualmente'
      });
    }

    // Obtener el repartidor más reciente asignado
    const latestPackage = clientPackages.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    )[0];

    // Obtener información completa del repartidor desde la base de datos
    let driverInfo = null;
    if (Driver && latestPackage.assignedDriverId) {
      try {
        const driver = await Driver.findByPk(latestPackage.assignedDriverId);
        if (driver) {
          driverInfo = {
            id: driver.id,
            name: driver.name,
            phone: driver.phone,
            vehicle: driver.vehicle,
            plate: driver.plate,
            rating: driver.rating || 5.0,
            totalDeliveries: driver.totalDeliveries || 0
          };
        }
      } catch (error) {
        console.error('Error obteniendo info del repartidor:', error);
      }
    }

    // Si no se encontró en BD, usar la info básica del paquete
    if (!driverInfo && latestPackage.assignedDriverName) {
      driverInfo = {
        id: latestPackage.assignedDriverId,
        name: latestPackage.assignedDriverName,
        phone: 'No disponible',
        vehicle: 'No disponible',
        plate: 'No disponible',
        rating: 5.0,
        totalDeliveries: 0
      };
    }

    res.json({
      success: true,
      hasDriver: !!driverInfo,
      driver: driverInfo,
      packageInfo: {
        packageCode: latestPackage.packageCode,
        status: latestPackage.status,
        createdAt: latestPackage.createdAt
      }
    });

  } catch (error) {
    console.error('Error obteniendo repartidor del cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/packages/:id - Obtener paquete específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const package = packages.find(pkg => pkg.id === id || pkg.trackingNumber === id);

    if (!package) {
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado'
      });
    }

    res.json({
      success: true,
      data: package
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo paquete'
    });
  }
});

// GET /api/packages/tracking/:trackingNumber - Obtener paquete por número de rastreo
router.get('/tracking/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const package = packages.find(pkg => pkg.trackingNumber === trackingNumber);

    if (!package) {
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado'
      });
    }

    res.json({
      success: true,
      data: package
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo paquete'
    });
  }
});

// POST /api/packages/:id/confirm-payment - Marcar pago como recibido y activar rastreo
router.post('/:id/confirm-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const packageIndex = packages.findIndex(pkg => pkg.id === id);

    if (packageIndex === -1) {
      return res.status(404).json({ success: false, error: 'Paquete no encontrado' });
    }

    const pkg = packages[packageIndex];

    if (pkg.status === 'delivered') {
      return res.status(400).json({ success: false, error: 'El paquete ya fue entregado' });
    }

    // El admin puede confirmar el pago en cualquier momento - es su responsabilidad
    // No se requieren comprobantes ya que el admin asume la responsabilidad
    console.log('✅ Admin confirmando pago para paquete:', pkg.id, '- Responsabilidad del admin');

    // Validar coincidencia de referencia si el cliente subió una y existe referencia inicial
    if (pkg.transferReference && pkg.submittedReference && pkg.transferReference !== pkg.submittedReference) {
      return res.status(400).json({
        success: false,
        error: 'La referencia no coincide con el valor esperado. Verifica con el cliente.'
      });
    }

    pkg.status = 'in-transit';
    pkg.paymentStatus = 'paid';
    pkg.updatedAt = new Date().toISOString();
    pkg.history = pkg.history || [];
    pkg.history.push({ timestamp: new Date().toISOString(), status: 'payment_confirmed', description: 'Pago confirmado por admin' });

    if (!pkg.location && pkg.originLocation) {
      pkg.location = { ...pkg.originLocation, timestamp: Date.now() };
    }

    savePackagesToFile(); // Guardar cambios

    res.json({ success: true, message: 'Pago confirmado y rastreo activado', data: pkg });
  } catch (error) {
    console.error('Error confirmando pago:', error);
    res.status(500).json({ success: false, error: 'Error confirmando pago' });
  }
});

// POST /api/packages/:id/submit-payment-proof - El cliente sube referencia o comprobante
router.post('/:id/submit-payment-proof', async (req, res) => {
  try {
    const { id } = req.params;
    const { reference, imageBase64 } = req.body;

    const packageIndex = packages.findIndex(pkg => pkg.id === id);
    if (packageIndex === -1) {
      return res.status(404).json({ success: false, error: 'Paquete no encontrado' });
    }

    const pkg = packages[packageIndex];
    pkg.submittedReference = reference || pkg.submittedReference;
    pkg.submittedVoucherImage = imageBase64 || pkg.submittedVoucherImage;
    pkg.paymentStatus = 'pending_admin_review';
    pkg.status = 'payment_submitted';
    pkg.updatedAt = new Date().toISOString();
    pkg.history = pkg.history || [];
    pkg.history.push({
      timestamp: new Date().toISOString(),
      status: 'payment_submitted',
      description: `Comprobante de pago enviado por cliente${reference ? ` (ref ${reference})` : ''}`
    });

    savePackagesToFile(); // Guardar cambios

    res.json({ success: true, message: 'Comprobante recibido. Esperando revisión de admin.', data: pkg });
  } catch (error) {
    console.error('Error subiendo comprobante:', error);
    res.status(500).json({ success: false, error: 'Error subiendo comprobante' });
  }
});

// GET /api/packages/:id/payment-status - Retorna estado de pago y estado de paquete
router.get('/:id/payment-status', async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = packages.find(p => p.id === id);

    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Paquete no encontrado' });
    }

    const data = {
      status: pkg.status,
      paymentStatus: pkg.paymentStatus || (pkg.status === 'payment_required' ? 'pending' : 'paid'),
      submittedReference: pkg.submittedReference || null,
      submittedVoucherImage: pkg.submittedVoucherImage || null,
      transferReference: pkg.transferReference || null,
      voucherImage: pkg.voucherImage || null,
      location: pkg.location,
      origin: pkg.originLocation || pkg.origin,
      destination: pkg.destinationLocation || pkg.destination,
      history: pkg.history,
      trackingCode: pkg.trackingNumber || pkg.trackingCode || pkg.id,
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error consultando estado de pago:', error);
    res.status(500).json({ success: false, error: 'Error consultando estado de pago' });
  }
});

// PUT /api/packages/:id/status - Actualizar estado del paquete
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const packageIndex = packages.findIndex(pkg => pkg.id === id);

    if (packageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado'
      });
    }

    packages[packageIndex].status = status;
    packages[packageIndex].updatedAt = new Date().toISOString();

    if (status === 'delivered') {
      packages[packageIndex].deliveredAt = new Date().toISOString();
    }

    // Agregar al historial
    packages[packageIndex].history.push({
      timestamp: new Date().toISOString(),
      status,
      description: notes || `Estado actualizado a ${status}`
    });

    // Emitir evento WebSocket para actualizaciones en tiempo real
    if (req.io) {
      req.io.emit('packageStatusUpdate', {
        packageId: id,
        status,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Estado del paquete actualizado',
      data: packages[packageIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error actualizando estado del paquete'
    });
  }
});

// POST /api/packages/:id/confirm-delivery - Confirmar entrega (con geolocalización)
router.post('/:id/confirm-delivery', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, driverLat, driverLng, clientConfirmation, signature, photo } = req.body;

    const packageIndex = packages.findIndex(pkg => pkg.id === id);

    if (packageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado'
      });
    }

    const pkg = packages[packageIndex];

    // Validar que el repartidor está asignado a este paquete
    if (pkg.assignedDriverId !== driverId) {
      return res.status(403).json({
        success: false,
        error: 'Repartidor no autorizado para este paquete'
      });
    }

    // Calcular distancia entre repartidor y punto de entrega
    const destLat = parseFloat(pkg.destinationLat || pkg.lat);
    const destLng = parseFloat(pkg.destinationLng || pkg.lng);
    const dLat = parseFloat(driverLat);
    const dLng = parseFloat(driverLng);

    // Fórmula de Haversine (distancia en km)
    const R = 6371; // Radio de la Tierra en km
    const dLatRad = (destLat - dLat) * Math.PI / 180;
    const dLngRad = (destLng - dLng) * Math.PI / 180;
    const a = 
      Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
      Math.cos(dLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
      Math.sin(dLngRad / 2) * Math.sin(dLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // Convertir a metros

    const MAX_DISTANCE = 500; // Máximo 500 metros

    if (distance > MAX_DISTANCE) {
      return res.status(400).json({
        success: false,
        error: `Repartidor muy lejos del destino (${Math.round(distance)}m de distancia). Necesita estar a máximo ${MAX_DISTANCE}m.`,
        distance: Math.round(distance),
        maxDistance: MAX_DISTANCE
      });
    }

    // Validar confirmación del cliente
    if (!clientConfirmation) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere confirmación del cliente'
      });
    }

    // Marcar como entregado
    pkg.status = 'delivered';
    pkg.deliveredAt = new Date().toISOString();
    pkg.deliveryConfirmedBy = clientConfirmation; // Quién confirmó (nombre del cliente)
    pkg.signature = signature || null;
    pkg.deliveryPhoto = photo || null;
    pkg.deliveryDistance = distance;

    // Agregar al historial
    pkg.history = pkg.history || [];
    pkg.history.push({
      timestamp: new Date().toISOString(),
      status: 'delivered',
      description: `Entregado a ${clientConfirmation} a ${Math.round(distance)}m de distancia`
    });

    // Emitir evento WebSocket para actualizar panel admin en tiempo real
    if (req.io) {
      req.io.emit('packageDelivered', {
        packageId: id,
        packageCode: pkg.packageCode,
        status: 'delivered',
        deliveredAt: pkg.deliveredAt,
        clientConfirmation: clientConfirmation,
        driverName: driver.name,
        driverId: driver.id,
        timestamp: new Date().toISOString()
      });

      // También emitir a clientes rastreando este paquete
      req.io.to(`package-${id}`).emit('delivery-completed', {
        packageId: id,
        status: 'delivered',
        timestamp: pkg.deliveredAt,
        deliveredBy: clientConfirmation,
        message: `¡Tu paquete fue entregado exitosamente a ${clientConfirmation}!`
      });
    }

    // Enviar notificación al cliente
    try {
      const notificationService = require('../services/notificationService');
      await notificationService.notifyDelivery(
        pkg.recipientPhone,
        pkg.packageCode,
        pkg.assignedDriverName || 'Repartidor'
      );
    } catch (notifErr) {
      console.error('Error enviando notificación de entrega:', notifErr.message);
    }

    savePackagesToFile(); // Guardar cambios

    res.json({
      success: true,
      message: '✅ Paquete entregado exitosamente',
      data: pkg,
      distance: `${Math.round(distance)}m`
    });

  } catch (error) {
    console.error('Error confirmando entrega:', error);
    res.status(500).json({
      success: false,
      error: 'Error confirmando entrega'
    });
  }
});

// GET /api/packages/:id/delivery-proximity - Verificar si repartidor está cerca del destino
router.get('/:id/delivery-proximity', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, driverLat, driverLng } = req.query;

    const pkg = packages.find(p => p.id === id);

    if (!pkg) {
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado'
      });
    }

    // Validar que es el repartidor asignado
    if (pkg.assignedDriverId !== driverId) {
      return res.status(403).json({
        success: false,
        error: 'No autorizado'
      });
    }

    // Calcular distancia
    const destLat = parseFloat(pkg.destinationLat || pkg.lat);
    const destLng = parseFloat(pkg.destinationLng || pkg.lng);
    const dLat = parseFloat(driverLat);
    const dLng = parseFloat(driverLng);

    const R = 6371;
    const dLatRad = (destLat - dLat) * Math.PI / 180;
    const dLngRad = (destLng - dLng) * Math.PI / 180;
    const a = 
      Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
      Math.cos(dLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
      Math.sin(dLngRad / 2) * Math.sin(dLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // metros

    const MAX_DISTANCE = 500;
    const isNear = distance <= MAX_DISTANCE;

    res.json({
      success: true,
      isNear,
      distance: Math.round(distance),
      maxDistance: MAX_DISTANCE,
      message: isNear 
        ? `✅ ¡Llegaste! Estás a ${Math.round(distance)}m del destino`
        : `⏳ Aún falta ${Math.round(distance - MAX_DISTANCE)}m para llegar`,
      destinationAddress: pkg.destinationAddress || pkg.address,
      recipientName: pkg.recipient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error calculando proximidad'
    });
  }
});

// POST /api/packages - Crear nuevo paquete
router.post('/', async (req, res) => {
  try {
    const {
      paymentMethod,
      transferAmount,
      transferReference,
      transferDate,
      voucherImage,
      senderName,
      ...packageData
    } = req.body;

    console.log('📦 Creando paquete - Datos de pago:', {
      paymentMethod,
      transferAmount,
      transferReference: transferReference ? 'presente' : 'ausente',
      voucherImage: voucherImage ? 'presente' : 'ausente',
      transferDate
    });

    // Validar que si es por transferencia, tenga los datos requeridos
    if (paymentMethod === 'transfer') {
      if (!transferAmount) {
        return res.status(400).json({
          success: false,
          error: 'Para pago por transferencia, se requiere monto'
        });
      }

      // Validar que al menos se proporcione referencia O imagen
      const hasReference = transferReference && typeof transferReference === 'string' && transferReference.trim() !== '';
      const hasImage = voucherImage && typeof voucherImage === 'string' && voucherImage.trim() !== '';

      if (!hasReference && !hasImage) {
        console.log('Validación fallida - transferReference:', transferReference, 'voucherImage:', voucherImage ? 'presente' : 'ausente');
        return res.status(400).json({
          success: false,
          error: 'Se requiere el número de referencia O la imagen del comprobante'
        });
      }

      console.log('Validación exitosa - reference:', hasReference, 'image:', hasImage);
    }

    // Generar código del paquete simple y memorable
    const packageCode = `PKG-${Date.now().toString().slice(-6)}`;

    // Obtener un repartidor disponible/activo con menos paquetes asignados
    let assignedDriver = null;
    console.log('🔍 Iniciando búsqueda de driver...');

    if (Driver) {
      console.log('✅ Driver model disponible');
      try {
        console.log('🔍 Buscando drivers activos...');
        // Obtener todos los drivers activos
        const activeDrivers = await Driver.findAll({
          where: { status: 'active' }
        });

        console.log(`📊 Encontrados ${activeDrivers.length} drivers activos`);

        if (activeDrivers.length > 0) {
          console.log('📦 Calculando carga de trabajo...');
          // Contar paquetes activos por driver usando el array de paquetes
          const driverWorkload = activeDrivers.map(driver => {
            const activePackages = packages.filter(p =>
              p.assignedDriverId === driver.id &&
              ['pending_pickup', 'in_transit', 'pending_payment'].includes(p.status)
            );
            console.log(`👤 Driver ${driver.name} (${driver.id}): ${activePackages.length} paquetes activos`);
            return {
              driver: driver,
              activePackageCount: activePackages.length
            };
          });

          // Ordenar por menor cantidad de paquetes activos
          driverWorkload.sort((a, b) => a.activePackageCount - b.activePackageCount);

          // Asignar al driver con menos paquetes
          assignedDriver = driverWorkload[0].driver;
          console.log(`✅ Asignado automáticamente a ${assignedDriver.name} (${driverWorkload[0].activePackageCount} paquetes activos)`);
        } else {
          console.log('⚠️ No hay repartidores activos disponibles');
        }
      } catch (driverError) {
        console.error('⚠️ Error buscando repartidor:', driverError.message);
        console.error('Stack:', driverError.stack);
      }
    } else {
      console.log('⚠️ Driver model no disponible');
    }

    console.log('🎯 Driver asignado:', assignedDriver ? assignedDriver.name : 'NINGUNO');

    const newPackage = {
      id: `PKG-${Date.now()}`,
      packageCode: packageCode, // Código simple para el cliente
      trackingNumber: `ELIA-2024-${Date.now()}`,
      status: paymentMethod === 'transfer' ? 'pending_payment' : 'pending_pickup',
      paymentMethod: paymentMethod || 'transfer',
      paymentStatus: paymentMethod === 'transfer' ? 'confirmed' : 'pending',
      transferAmount: transferAmount || null,
      transferReference: transferReference || null,
      voucherImage: voucherImage || null, // Guardar imagen en base64
      transferDate: transferDate || null,
      senderName: senderName || packageData.sender || 'Cliente',
      assignedDriverId: assignedDriver?.id || null,
      assignedDriverName: assignedDriver?.name || null,
      ...packageData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          timestamp: new Date().toISOString(),
          status: paymentMethod === 'transfer' ? 'pending_payment' : 'pending_pickup',
          description: paymentMethod === 'transfer' 
            ? transferReference 
              ? `Pago por transferencia solicitado - Ref: ${transferReference}`
              : 'Pago por transferencia solicitado - Comprobante subido'
            : 'Paquete creado y asignado'
        }
      ]
    };

    packages.push(newPackage);
    savePackagesToFile(); // Guardar en archivo para persistencia

    // Enviar notificación al admin si es pago por transferencia
    if (paymentMethod === 'transfer') {
      try {
        await notificationService.sendVoucherToAdmin(
          packageCode,
          voucherImage || null,
          senderName || packageData.sender || 'Cliente',
          transferAmount
        );
        console.log('Notificación de pago enviada al admin para paquete:', packageCode);
      } catch (notificationError) {
        console.error('Error enviando notificación al admin, pero paquete creado:', notificationError.message);
      }

      // Intentar enviar instrucciones de pago al remitente
      try {
        if (packageData.senderPhone) {
          await notificationService.sendPaymentInstructionsToSender(
            packageData.senderPhone,
            packageCode,
            transferAmount
          );
          console.log('Instrucciones de pago enviadas al remitente para paquete:', packageCode);
        }
      } catch (senderNotificationError) {
        console.error('Error enviando instrucciones al remitente, pero paquete creado:', senderNotificationError.message);
      }
    }

    // Enviar información del paquete al repartidor si está asignado
    if (assignedDriver) {
      try {
        await notificationService.sendPackageToDriver(assignedDriver, {
          packageCode: packageCode,
          originAddress: packageData.originAddress || 'Ubicación de origen',
          destinationAddress: packageData.destinationAddress || 'Ubicación de destino',
          recipient: packageData.recipient || 'Destinatario',
          recipientPhone: packageData.recipientPhone || 'N/A',
          sender: packageData.sender || 'Remitente',
          senderPhone: packageData.senderPhone || 'N/A'
        });
        console.log('✅ Paquete enviado al repartidor:', assignedDriver.name);
      } catch (driverNotificationError) {
        console.error('⚠️ Error enviando paquete al repartidor:', driverNotificationError.message);
        // No fallar la creación del paquete si falla la notificación
      }
    }

    console.log('📦 Nuevo paquete creado:', {
      id: newPackage.id,
      packageCode: newPackage.packageCode,
      trackingNumber: newPackage.trackingNumber,
      recipient: newPackage.recipient,
      assignedDriver: assignedDriver?.name || 'Sin asignar',
      paymentMethod: newPackage.paymentMethod,
      transferAmount: newPackage.transferAmount,
      createdAt: newPackage.createdAt
    });

    res.status(201).json({
      success: true,
      message: 'Paquete creado exitosamente',
      id: newPackage.id,
      packageCode: newPackage.packageCode, // Devolver el código para el cliente
      trackingNumber: newPackage.trackingNumber,
      assignedDriver: assignedDriver ? {
        id: assignedDriver.id,
        name: assignedDriver.name,
        phone: assignedDriver.phone
      } : null,
      data: newPackage
    });
  } catch (error) {
    console.error('Error creando paquete:', error);
    res.status(500).json({
      success: false,
      error: 'Error creando paquete'
    });
  }
});

// PUT /api/packages/:id - Actualizar paquete
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const packageIndex = packages.findIndex(pkg => pkg.id === id);

    if (packageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado'
      });
    }

    packages[packageIndex] = {
      ...packages[packageIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Paquete actualizado',
      data: packages[packageIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error actualizando paquete'
    });
  }
});

// DELETE /api/packages/:id - Eliminar paquete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const packageIndex = packages.findIndex(pkg => pkg.id === id);

    if (packageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado'
      });
    }

    packages.splice(packageIndex, 1);
    savePackagesToFile(); // Guardar cambios

    res.json({
      success: true,
      message: 'Paquete eliminado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error eliminando paquete'
    });
  }
});

// Exponer función de asignación para ser usada desde otros módulos (login de driver)
router.assignPackagesToDriver = assignPackagesToDriver;

module.exports = router;