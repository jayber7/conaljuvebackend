// src/routes/userRoutes.js
const express = require('express');
const { body } = require('express-validator');
const { updateUserLocation } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validación para actualizar ubicación
const locationValidation = [
    body('department', 'El departamento es requerido').not().isEmpty().trim().escape(),
    body('province').optional().trim().escape(),
    body('municipality').optional().trim().escape(),
    body('zone').optional().trim().escape(),
];

// Rutas (prefijo /api/users definido en app.js)
router.put('/me/location', protect, locationValidation, handleValidationErrors, updateUserLocation);
// Añadir más rutas de usuario aquí si es necesario (ej. cambiar contraseña)

module.exports = router;