// src/routes/memberRoutes.js
const express = require('express');
const { body, param } = require('express-validator');
const {
    registerNewMember,
    getMembers,
    updateMemberStatus,
    // Importar otros si los creas (getMemberById, etc.)
} = require('../controllers/memberController'); // Cambiar a memberController
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware'); // Solo Admin gestiona miembros
const { handleValidationErrors } = require('../middleware/validationMiddleware');
const { upload } = require('../config/cloudinaryConfig'); // Para subida de foto

const router = express.Router();

// Validación para registro de miembro (más estricta)
const memberRegisterValidation = [
    body('fullName', 'Nombre completo es requerido').not().isEmpty().trim().escape(),
    body('idCard', 'Número de CI es requerido').not().isEmpty().trim().escape(),    
    body('idCardExtension', 'Extensión de CI inválida (código numérico)').optional({ checkFalsy: true }).isInt({ min: 1, max: 9 }) .toInt(),
    body('birthDate', 'Fecha de nacimiento inválida').optional({checkFalsy: true}).isISO8601().toDate(),
    body('sex', 'Sexo inválido').optional().isBoolean(),
    body('phoneNumber', 'Teléfono inválido').optional({checkFalsy: true}).isString().trim().escape(),
    body('location.departmentCode', 'Depto. requerido').not().isEmpty().isInt({min: 0}).toInt(),
    body('location.provinceCode', 'Provincia requerida').not().isEmpty().isInt({min: 0}).toInt(),
    body('location.municipalityCode', 'Municipio requerido').not().isEmpty().isInt({min: 0}).toInt(),
    body('location.zone', 'Zona/Barrio requerido').not().isEmpty().trim().escape(),
    body('neighborhoodCouncilName', 'Nombre de Junta Vecinal requerido').not().isEmpty().trim().escape(),    
    body('memberRoleInCouncilCode', 'Cargo en Junta Vecinal inválido').not().isEmpty().withMessage('El Cargo es requerido').isInt({ min: 1 }).withMessage('Seleccione un cargo válido').toInt(),
];

// Validación para actualizar estado
const statusUpdateValidation = [
    param('code', 'Código de registro inválido').not().isEmpty().trim().escape(), // Validar param
    body('status', 'Estado requerido').not().isEmpty().trim().toUpperCase().isIn(['PENDING', 'VERIFIED', 'REJECTED', 'INACTIVE']),
];

// Rutas (prefijo /api/members definido en app.js)

// POST /api/members/register - Registro público (o semi-público)
router.post(
    '/register',
    upload.single('memberPhoto'), // Campo para la foto específica del miembro
    memberRegisterValidation,
    handleValidationErrors,
    registerNewMember
);

// GET /api/members - Listar miembros (Admin)
router.get('/', protect, admin, handleValidationErrors, getMembers);

// PUT /api/members/:code/status - Actualizar estado (Admin)
router.put('/:code/status', protect, admin, statusUpdateValidation, handleValidationErrors, updateMemberStatus);

// Añadir rutas GET /:code, PUT /:code, DELETE /:code (todas protegidas por Admin) si son necesarias

module.exports = router;