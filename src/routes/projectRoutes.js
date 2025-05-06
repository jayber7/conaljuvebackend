// src/routes/projectRoutes.js
const express = require('express');
const { body, param, query } = require('express-validator');
const {
    getProjects, createProject, getProjectById, updateProject, deleteProject
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { staffOrAdmin } = require('../middleware/staffOrAdminMiddleware'); // Usar para crear/editar
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validación para crear/actualizar proyecto
const projectValidation = [
    body('projectName', 'Nombre del proyecto es requerido').not().isEmpty().trim().escape(),
    body('objective', 'Objetivo es requerido').not().isEmpty().trim().escape(),
    body('location.departmentCode', 'Depto. requerido').not().isEmpty().isInt({ min: 0 }).toInt(),
    body('location.provinceCode', 'Provincia requerida').not().isEmpty().isInt({ min: 0 }).toInt(),
    body('location.municipalityCode', 'Municipio requerido').not().isEmpty().isInt({ min: 0 }).toInt(),
    body('location.zone', 'Zona requerida').not().isEmpty().trim().escape(),
    body('location.barrio', 'Barrio requerido').not().isEmpty().trim().escape(),
    body('fundingSource', 'Fuente de financiamiento requerida').not().isEmpty().trim().escape(),
    body('beneficiaries', 'Beneficiarios requeridos').not().isEmpty().trim().escape(),
    body('startDate', 'Fecha de inicio requerida').not().isEmpty().isISO8601().toDate(),
    body('endDate', 'Fecha de finalización requerida').not().isEmpty().isISO8601().toDate(),
    // Validar status si se permite enviarlo/actualizarlo
    body('status').optional().trim().toUpperCase().isIn(['PLANIFICADO', 'EN_EJECUCION', 'COMPLETADO', 'CANCELADO', 'SUSPENDIDO']),
];

// Validación de ID de Mongo para GET/PUT/DELETE por ID
const idParamValidation = [ param('id', 'ID de Proyecto inválido').isMongoId() ];

// Validación Query Params para GET /
const getProjectsQueryValidation = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sort').optional().isString().trim().escape(),
    query('status').optional().trim().toUpperCase().isIn(['PLANIFICADO', 'EN_EJECUCION', 'COMPLETADO', 'CANCELADO', 'SUSPENDIDO']),
    query('location.departmentCode').optional().isInt({ min: 0 }).toInt(),
    query('location.provinceCode').optional().isInt({ min: 0 }).toInt(),
    query('location.municipalityCode').optional().isInt({ min: 0 }).toInt(),
    query('location.zone').optional().isString().trim().escape(),
    query('location.barrio').optional().isString().trim().escape(),
    query('projectName').optional().isString().trim().escape(),
];

// --- Definición de Rutas ---

// GET /api/projects - Listar proyectos (protegido, decide quién puede ver)
router.get('/', protect, getProjectsQueryValidation, handleValidationErrors, getProjects);

// POST /api/projects - Crear proyecto (Staff o Admin)
router.post('/', protect, staffOrAdmin, projectValidation, handleValidationErrors, createProject);

// GET /api/projects/:id - Ver un proyecto (protegido)
router.get('/:id', protect, idParamValidation, handleValidationErrors, getProjectById);

// PUT /api/projects/:id - Actualizar proyecto (Staff o Admin)
router.put('/:id', protect, staffOrAdmin, idParamValidation, projectValidation, handleValidationErrors, updateProject);

// DELETE /api/projects/:id - Eliminar proyecto (Admin)
router.delete('/:id', protect, admin, idParamValidation, handleValidationErrors, deleteProject);


module.exports = router;