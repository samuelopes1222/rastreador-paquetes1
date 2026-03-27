const DriverApplication = require('../models/DriverApplication');
const { sendNuevaSolicitudTemplate, sendBienvenidaTemplate } = require('../services/notificationService');
const bcrypt = require('bcryptjs');
const Driver = require('../models/Driver');

/**
 * Crear nueva solicitud de registro
 * POST /api/drivers/applications
 */
async function createApplication(req, res) {
  try {
    const { 
      firstName, 
      lastName, 
      cedula, 
      phone, 
      email,
      house,
      street,
      address,
      screenshot // base64 string de la imagen
    } = req.body;

    // Normalizar cédula opcional ("sin cédula")
    const cedulaValue = cedula && String(cedula).trim() ? String(cedula).trim() : null;

    // Validar que no existe ya una solicitud pendiente con esta cédula
    const existingApp = await DriverApplication.findOne({
      where: { cedula: cedulaValue, status: 'pending' }
    });

    // Limpiar email: si está vacío, convertir a null
    const cleanEmail = email && email.trim() ? email.trim() : null;

    if (existingApp) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una solicitud pendiente con esta cédula de identidad'
      });
    }

    // Validar que el número de teléfono no esté ya registrado
    const existingPhone = await Driver.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        error: 'El número de teléfono ya está registrado'
      });
    }

    // Calcular fecha de expiración (72 horas)
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    // Crear la solicitud
    const application = await DriverApplication.create({
      firstName,
      lastName,
      cedula: cedulaValue,
      phone,
      email: cleanEmail,
      house,
      street,
      address,
      screenshotData: screenshot ? Buffer.from(screenshot, 'base64') : null,
      status: 'pending',
      expiresAt
    });

    // Enviar mensaje por WhatsApp con la captura
    if (screenshot) {
      try {
        await sendNuevaSolicitudTemplate(
          application.firstName,
          application.lastName,
          application.phone,
          application.cedula,
          `${application.house}, ${application.street}, ${application.address}`,
          application.id
        );

        application.whatsappSentAt = new Date();
        await application.save();
      } catch (whatsappError) {
        console.error('Error enviando WhatsApp:', whatsappError);
        // No rechazar la solicitud si falla WhatsApp, solo registrar el error
      }
    }

    res.status(201).json({
      success: true,
      message: 'Solicitud de registro enviada correctamente',
      data: {
        id: application.id,
        status: application.status,
        expiresAt: application.expiresAt,
        message: 'Tu solicitud será revisada en las próximas 72 horas. Recibirás confirmación por WhatsApp.'
      }
    });

  } catch (error) {
    console.error('Error creando solicitud:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar la solicitud de registro',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error
      } : undefined
    });
  }
}

/**
 * Obtener estado de la solicitud
 * GET /api/drivers/applications/:id
 */
async function getApplicationStatus(req, res) {
  try {
    const { id } = req.params;

    const application = await DriverApplication.findByPk(id, {
      attributes: {
        exclude: ['screenshotData'] // No enviar los datos binarios al frontend
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      });
    }

    // Validar si la solicitud expiró
    if (application.status === 'pending' && new Date() > application.expiresAt) {
      application.status = 'expired';
      await application.save();
    }

    res.json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('Error obteniendo solicitud:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estado de solicitud'
    });
  }
}

/**
 * Aprobar solicitud de registro (Admin)
 * POST /api/drivers/applications/:id/approve
 */
async function approveApplication(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const application = await DriverApplication.findByPk(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `No se puede aprobar una solicitud con estado ${application.status}`
      });
    }

    // Crear el conductor
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const driver = await Driver.create({
      name: `${application.firstName} ${application.lastName}`,
      cedula: application.cedula,
      phone: application.phone,
      email: application.email,
      vehicle: '',
      plate: '',
      passwordHash,
      status: 'active'
    });

    // Marcar solicitud como aprobada
    application.status = 'approved';
    application.approvedAt = new Date();
    await application.save();

    // Enviar confirmación por WhatsApp
    try {
      await sendBienvenidaTemplate(
        application.phone,
        application.firstName,
        application.cedula
      );
    } catch (whatsappError) {
      console.error('Error enviando confirmación:', whatsappError);
    }

    res.json({
      success: true,
      message: 'Solicitud aprobada',
      data: driver
    });

  } catch (error) {
    console.error('Error aprobando solicitud:', error);
    res.status(500).json({
      success: false,
      error: 'Error al aprobar solicitud'
    });
  }
}

/**
 * Rechazar solicitud de registro (Admin)
 * POST /api/drivers/applications/:id/reject
 */
async function rejectApplication(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await DriverApplication.findByPk(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `No se puede rechazar una solicitud con estado ${application.status}`
      });
    }

    application.status = 'rejected';
    application.rejectionReason = reason;
    await application.save();

    // Enviar rechazo por WhatsApp
    try {
      const { sendWhatsAppWithImage } = require('../services/notificationService');
      const rejectionMessage = `❌ Tu solicitud de registro fue rechazada\n\nMotivo: ${reason}\n\nSi tienes dudas, contáctanos.`;
      
      await sendWhatsAppWithImage(application.phone, rejectionMessage);
    } catch (whatsappError) {
      console.error('Error enviando rechazo:', whatsappError);
    }

    res.json({
      success: true,
      message: 'Solicitud rechazada'
    });

  } catch (error) {
    console.error('Error rechazando solicitud:', error);
    res.status(500).json({
      success: false,
      error: 'Error al rechazar solicitud'
    });
  }
}

/**
 * Listar todas las solicitudes (Admin)
 * GET /api/drivers/applications
 */
async function listApplications(req, res) {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const where = status ? { status } : {};
    const offset = (page - 1) * limit;

    const { count, rows } = await DriverApplication.findAndCountAll({
      where,
      attributes: { exclude: ['screenshotData'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error listando solicitudes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al listar solicitudes'
    });
  }
}

module.exports = {
  createApplication,
  getApplicationStatus,
  approveApplication,
  rejectApplication,
  listApplications
};
