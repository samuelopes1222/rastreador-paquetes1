const express = require('express');
const router = express.Router();

// Datos simulados de quejas (en producción usarías una base de datos)
let complaints = [];

// POST /complaints - Crear nueva queja
router.post('/', async (req, res) => {
  try {
    const { trackingNumber, description } = req.body;

    if (!trackingNumber || !description) {
      return res.status(400).json({
        success: false,
        error: 'Número de seguimiento y descripción son requeridos'
      });
    }

    const newComplaint = {
      id: `COMP-${Date.now()}`,
      trackingNumber,
      description,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      response: null
    };

    complaints.push(newComplaint);

    console.log('📋 Nueva queja registrada:', {
      id: newComplaint.id,
      trackingNumber,
      createdAt: newComplaint.createdAt
    });

    res.status(201).json({
      success: true,
      message: 'Queja registrada exitosamente',
      id: newComplaint.id,
      data: newComplaint
    });
  } catch (error) {
    console.error('Error registrando queja:', error);
    res.status(500).json({
      success: false,
      error: 'Error registrando la queja'
    });
  }
});

// GET /complaints - Obtener todas las quejas
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo quejas'
    });
  }
});

// GET /complaints/:id - Obtener queja por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = complaints.find(c => c.id === id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Queja no encontrada'
      });
    }

    res.json({
      success: true,
      data: complaint
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo la queja'
    });
  }
});

// PUT /complaints/:id - Actualizar queja o responder
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    const complaintIndex = complaints.findIndex(c => c.id === id);

    if (complaintIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Queja no encontrada'
      });
    }

    complaints[complaintIndex] = {
      ...complaints[complaintIndex],
      ...(status && { status }),
      ...(response && { response }),
      updatedAt: new Date().toISOString()
    };

    console.log('📋 Queja actualizada:', id);

    res.json({
      success: true,
      message: 'Queja actualizada exitosamente',
      data: complaints[complaintIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error actualizando la queja'
    });
  }
});

// DELETE /complaints/:id - Eliminar queja
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const complaintIndex = complaints.findIndex(c => c.id === id);

    if (complaintIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Queja no encontrada'
      });
    }

    const deletedComplaint = complaints.splice(complaintIndex, 1);

    console.log('🗑️ Queja eliminada:', id);

    res.json({
      success: true,
      message: 'Queja eliminada exitosamente',
      data: deletedComplaint[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error eliminando la queja'
    });
  }
});

module.exports = router;
