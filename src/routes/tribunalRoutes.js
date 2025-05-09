// src/routes/tribunalRoutes.js
const express = require('express');
const { body, param, query } = require('express-validator');
const {
    createTribunal, getTribunals, getTribunalById, updateTribunal, deleteTribunal
} = require('../controllers/tribunalController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware'); // Solo Admin puede gestionar Tribunales
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

const tribunalLevels = ['DEPARTAMENTAL', 'MUNICIPAL', 'VECINAL'];

// Validación para Crear/Actualizar
const tribunalValidation = [
    body('level', 'Nivel inválido').trim().toUpperCase().isIn(tribunalLevels),
    body('locationCode', 'Código de ubicación requerido').not().isEmpty(), // Validación más específica puede depender del nivel
    body('locationName', 'Nombre de ubicación requerido').not().isEmpty().trim().escape(),
    body('directory').optional().isArray().withMessage('Directorio debe ser un array'),
    body('directory.*.role', 'Rol en directorio es requerido').if(body('directory').exists()).not().isEmpty().trim().escape(),
    body('directory.*.fullName', 'Nombre en directorio es requerido').if(body('directory').exists()).not().isEmpty().trim().escape(),
    body('statuteUrl').optional({ checkFalsy: true }).isURL().withMessage('URL de Estatuto inválida'),
    body('regulationsUrl').optional({ checkFalsy: true }).isURL().withMessage('URL de Normativa inválida'),
    body('termStartDate').optional({ checkFalsy: true }).isISO8601().toDate(),
    body('termEndDate').optional({ checkFalsy: true }).isISO8601().toDate(),
    // Añadir validación de fecha si es necesario: .custom((value, { req }) => value >= req.body.startDate)
];

// Validación Query Params GET /
const getTribunalsQueryValidation = [
     query('level').optional().trim().toUpperCase().isIn(tribunalLevels),
     query('locationCode').optional(), // Se parsea en el controller
     query('page').optional().isInt({ min: 1 }).toInt(),
     query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
     query('sort').optional().isString().trim().escape(),
];

const idParamValidation = [param('id', 'ID de Tribunal inválido').isMongoId()];

// --- Rutas ---
router.route('/')
    .post(protect, admin, tribunalValidation, handleValidationErrors, createTribunal) // Solo Admin crea
    .get(getTribunalsQueryValidation, handleValidationErrors, getTribunals); // Abierto o protegido? Decide

router.route('/:id')
    .get(idParamValidation, handleValidationErrors, getTribunalById) // Abierto o protegido?
    .put(protect, admin, idParamValidation, tribunalValidation, handleValidationErrors, updateTribunal) // Solo Admin actualiza
    .delete(protect, admin, idParamValidation, handleValidationErrors, deleteTribunal); // Solo Admin borra

module.exports = router;