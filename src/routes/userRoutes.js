// src/routes/userRoutes.js
const express = require('express');
const { body, param, query } = require('express-validator');
const { updateUserLocation,getUsers,updateUserRole } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware'); // Necesario para proteger rutas de admin
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validación para actualizar ubicación
const locationUpdateValidation = [
    body('departmentCode', 'Código de Departamento inválido').not().isEmpty().withMessage('Dept. es requerido').isInt({ min: 0 }).toInt(), // Hacerlo requerido y validar como int
    body('provinceCode', 'Código de Provincia inválido').optional().isInt({ min: 0 }).toInt(),
    body('municipalityCode', 'Código de Municipio inválido').optional().isInt({ min: 0 }).toInt(),
    body('zone').optional().isString().trim().escape(),
];
// --- VALIDACIÓN ESPECÍFICA PARA ACTUALIZAR ROL ---
const roleUpdateValidation = [
    param('userId', 'ID de usuario inválido').isMongoId(), // Validar ID en la ruta
    // --- MODIFICACIÓN: Incluir STAFF y mensaje claro ---
    body('role', 'El rol es requerido y debe ser USER, STAFF o ADMIN')
        .isIn(['USER', 'STAFF', 'ADMIN']),
    // --- FIN MODIFICACIÓN ---
];
// --- FIN VALIDACIÓN ESPECÍFICA ---
// Validación opcional para query params de getUsers
const getUsersQueryValidation = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sort').optional().isString().trim().escape(),
    // Añadir filtros si son necesarios (ej. por rol)
    query('role').optional().isIn(['USER', 'ADMIN']).toUpperCase(),
];

// --- Rutas ---

// GET /api/users - Obtener todos los usuarios (Solo Admin)
router.get(
    '/',
    protect,
    admin,
    getUsersQueryValidation, // Añadir validación de query
    handleValidationErrors,
    getUsers
);

// PUT /api/users/me/location - Actualizar ubicación del usuario logueado (Usuario Normal o Admin)
router.put(
    '/me/location',
    protect, // Solo requiere estar logueado
    // locationValidation, // Asegúrate que esta validación exista y use códigos numéricos
    locationUpdateValidation,
    handleValidationErrors,
    updateUserLocation
);

// PUT /api/users/:userId/role - Actualizar rol de un usuario específico (Solo Admin)
router.put(
    '/:userId/role',
    protect,
    admin,
    (req, res, next) => { // Middleware temporal de log
        console.log('--> PUT /:userId/role - Llegó a la ruta');
        console.log('req.params:', req.params);
        console.log('req.body:', req.body);
        next(); // Continuar al siguiente middleware (validación)
    },
    roleUpdateValidation, // Validar ID y rol
    //locationUpdateValidation,
    handleValidationErrors,
    updateUserRole
);

// Puedes añadir más rutas aquí (GET /api/users/:id, DELETE /api/users/:id, etc.) si necesitas gestionar usuarios más a fondo


module.exports = router;