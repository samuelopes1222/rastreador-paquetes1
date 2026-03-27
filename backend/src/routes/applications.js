const express = require('express');
const {
  createApplication,
  getApplicationStatus,
  approveApplication,
  rejectApplication,
  listApplications
} = require('../controllers/applicationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/drivers/applications - Crear nueva solicitud de registro
router.post('/', createApplication);

// GET /api/drivers/applications/:id - Obtener estado de la solicitud
router.get('/:id', getApplicationStatus);

// POST /api/drivers/applications/:id/approve - Aprobar solicitud (Admin)
router.post('/:id/approve', approveApplication);

// POST /api/drivers/applications/:id/reject - Rechazar solicitud (Admin)
router.post('/:id/reject', rejectApplication);

// GET /api/drivers/applications - Listar solicitudes (Admin)
router.get('/', listApplications);

module.exports = router;
