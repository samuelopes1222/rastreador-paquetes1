const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const Driver = require('../models/Driver');
const Package = require('../models/Package');
const { sendSMS, sendWhatsAppWithImage } = require('../services/notificationService');

const router = express.Router();

// Helper para filtrar campos sensibles
function driverSafe(driver) {
  if (!driver) return null;
  const { id, name, phone, email, vehicle, plate, status, isTrackingEnabled, currentLat, currentLng, lastLocationUpdate, activePackages, rating, totalDeliveries, cedula } = driver;
  return { id, name, phone, email, vehicle, plate, status, isTrackingEnabled, cedula, currentLat, currentLng, lastLocationUpdate, activePackages, rating, totalDeliveries };
}

// POST /api/drivers/login
router.post('/login', async (req, res) => {
  try {
    const { cedula, phone, password } = req.body;

    let driver;
    if (cedula) {
      driver = await Driver.findOne({ where: { cedula } });
    } else if (phone) {
      driver = await Driver.findOne({ where: { phone } });
    } else {
      return res.status(400).json({ success: false, error: 'Cédula o teléfono requerido' });
    }

    if (!driver) {
      return res.status(401).json({ success: false, error: 'Conductor no encontrado' });
    }

    // Si no hay password en la solicitud y no hay password en DB, se permite login (modo sin contraseña)
    if (!password && !driver.passwordHash) {
      const token = jwt.sign({ driverId: driver.id }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ success: true, token, driver: driverSafe(driver) });
    }

    if (!password || !driver.passwordHash) {
      return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
    }

    const isValid = await bcrypt.compare(password, driver.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Cédula o contraseña inválidos' });
    }

    const token = jwt.sign({ driverId: driver.id }, JWT_SECRET, { expiresIn: '7d' });

    // Asignar automáticamente hasta 5 paquetes de rutas diferentes al conductor
    try {
      const packagesRouter = require('./packages');
      if (packagesRouter && typeof packagesRouter.assignPackagesToDriver === 'function') {
        await packagesRouter.assignPackagesToDriver(driver, 5);
      }
    } catch (assignError) {
      console.error('Error asignando paquetes automáticos al login:', assignError.message);
    }

    res.json({ success: true, token, driver: driverSafe(driver) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
});

// GET /api/drivers/me (perfil) - requiere token
router.get('/me', authenticate, async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.user.driverId);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Conductor no encontrado' });
    }
    res.json({ success: true, data: driverSafe(driver) });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo perfil' });
  }
});

// GET /api/drivers/active - Conductores en estado activo (público)
router.get('/active', async (req, res) => {
  try {
    const drivers = await Driver.findAll({
      where: { status: 'active' },
      order: [['updatedAt', 'DESC']],
    });
    res.json({ success: true, data: drivers.map(driverSafe) });
  } catch (error) {
    console.error('Active drivers error:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo conductores activos' });
  }
});

// POST /api/drivers - Crear nuevo conductor (admin)
router.post('/', async (req, res) => {
  try {
    const { name, cedula, phone, email, vehicle, plate, password, currentLat, currentLng, status } = req.body;
    const cedulaValue = cedula && String(cedula).trim() ? String(cedula).trim() : null;
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    let finalLat = currentLat ? parseFloat(currentLat) : null;
    let finalLng = currentLng ? parseFloat(currentLng) : null;

    // Si no se proporciona ubicación, asignar una ubicación inicial de prueba en Santo Domingo
    if (!finalLat || !finalLng) {
      const center = { lat: 18.4861, lng: -69.9312 };
      finalLat = center.lat + (Math.random() - 0.5) * 0.02;
      finalLng = center.lng + (Math.random() - 0.5) * 0.02;
    }

    // Validar que el campo phone sea obligatorio
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ success: false, error: 'El número de teléfono es obligatorio.' });
    }

    const driver = await Driver.create({
      name,
      cedula: cedulaValue,
      phone,
      email,
      vehicle,
      plate,
      passwordHash,
      status: status || 'active',
      currentLat: finalLat,
      currentLng: finalLng,
      lastLocationUpdate: new Date(),
    });

    res.status(201).json({ success: true, data: driverSafe(driver) });
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({ success: false, error: 'Error creando conductor' });
  }
});

// PUT /api/drivers/:id - Actualizar datos del conductor (admin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.password) {
      updates.passwordHash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }

    await Driver.update(updates, { where: { id } });
    const updated = await Driver.findByPk(id);

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Conductor no encontrado' });
    }

    res.json({ success: true, data: driverSafe(updated) });
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ success: false, error: 'Error actualizando conductor' });
  }
});

// DELETE /api/drivers/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findByPk(id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Conductor no encontrado' });
    }
    await driver.destroy();
    res.json({ success: true, message: 'Conductor eliminado' });
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({ success: false, error: 'Error eliminando conductor' });
  }
});

// PATCH /api/drivers/:id/status - Actualizar estado (online/offline)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const driver = await Driver.findByPk(id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Conductor no encontrado' });
    }

    driver.status = status;
    await driver.save();

    // Broadcast status update via WebSocket
    if (req.io) {
      req.io.emit('driver-status-update', {
        driverId: driver.id,
        status: driver.status,
      });
    }

    res.json({ success: true, data: driverSafe(driver) });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, error: 'Error actualizando estado' });
  }
});

// PATCH /api/drivers/:id/location - Actualizar ubicación
router.patch('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;

    const driver = await Driver.findByPk(id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Conductor no encontrado' });
    }

    driver.currentLat = lat;
    driver.currentLng = lng;
    driver.lastLocationUpdate = new Date();
    driver.isTrackingEnabled = true;
    await driver.save();

    // Broadcast location update
    if (req.io) {
      req.io.emit('driver-location-update', {
        driverId: driver.id,
        lat,
        lng,
        status: driver.status,
      });
    }

    res.json({ success: true, data: driverSafe(driver) });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, error: 'Error actualizando ubicación' });
  }
});

// GET /api/drivers - Obtener todos los conductores (para admin)
router.get('/', async (req, res) => {
  try {
    const drivers = await Driver.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: drivers.map(driverSafe) });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo conductores' });
  }
});

// PATCH /api/drivers/:id/tracking - Actualizar estado de tracking (on/off)
router.patch('/:id/tracking', async (req, res) => {
  try {
    const { id } = req.params;
    const { isTrackingEnabled } = req.body;

    const driver = await Driver.findByPk(id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Conductor no encontrado' });
    }

    driver.isTrackingEnabled = !!isTrackingEnabled;
    await driver.save();

    res.json({ success: true, data: driverSafe(driver) });
  } catch (error) {
    console.error('Update tracking error:', error);
    res.status(500).json({ success: false, error: 'Error actualizando tracking' });
  }
});

// POST /api/drivers/:id/gps-notification - Enviar notificación GPS al conductor
router.post('/:id/gps-notification', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const driver = await Driver.findByPk(id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Conductor no encontrado' });
    }

    if (!driver.phone) {
      return res.status(400).json({ success: false, error: 'Conductor no tiene teléfono registrado' });
    }

    // Enviar WhatsApp de notificación GPS
    const whatsappMessage = message || 'El administrador solicita que actives tu GPS para el rastreo en tiempo real.';
    await sendWhatsAppWithImage(driver.phone, `📍 ${whatsappMessage}`);

    res.json({ success: true, message: 'Notificación GPS enviada por WhatsApp' });
  } catch (error) {
    console.error('GPS notification error:', error);
    res.status(500).json({ success: false, error: 'Error enviando notificación GPS por WhatsApp' });
  }
});

// POST /api/drivers/:id/message-client - Enviar mensaje del repartidor al cliente
router.post('/:id/message-client', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { packageId, message, channel = 'sms' } = req.body;

    if (!packageId || !message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'packageId y message son requeridos' });
    }

    const driver = await Driver.findByPk(id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Conductor no encontrado' });
    }

    const pkg = await Package.findByPk(packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Paquete no encontrado' });
    }

    // Validar que el paquete está asignado al conductor para seguridad
    if (pkg.driverId && pkg.driverId !== driver.id) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para enviar mensajes a este cliente' });
    }

    const clientPhone = pkg.recipientPhone || pkg.senderPhone;
    if (!clientPhone) {
      return res.status(400).json({ success: false, error: 'No hay teléfono de cliente disponible' });
    }

    const text = `📦 Mensaje de ${driver.name || 'el repartidor'}: ${message}`;

    if (channel === 'whatsapp') {
      await sendWhatsAppWithImage(clientPhone, text);
    } else {
      await sendSMS(clientPhone, text);
    }

    // Guardar en historial de paquete si se quiere (opcional)
    if (!pkg.history) {
      pkg.history = [];
    }

    pkg.history.push({
      timestamp: new Date().toISOString(),
      status: 'driver_message',
      description: `Mensaje enviado al cliente: ${message}`
    });

    await pkg.save();

    res.json({ success: true, message: 'Mensaje enviado al cliente' });
  } catch (error) {
    console.error('Message client error:', error);
    res.status(500).json({ success: false, error: 'Error enviando mensaje al cliente' });
  }
});

// GET /api/drivers/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findByPk(id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Conductor no encontrado' });
    }
    res.json({ success: true, data: driverSafe(driver) });
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo conductor' });
  }
});

module.exports = router;
