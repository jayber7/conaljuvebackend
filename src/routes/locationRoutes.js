// src/routes/locationRoutes.js
const express = require('express');
const { query } = require('express-validator');
const {
    getDepartments,
    getProvinces,
    getMunicipalities,
    getLocationSuggestions,
    getCouncilRoles 
} = require('../controllers/locationController');
const { handleValidationErrors } = require('../middleware/validationMiddleware'); // Reutilizar handler

const router = express.Router();

// Validación para parámetros de query
const provinceQueryValidation = [
    query('departmentCode', 'Se requiere departmentCode').not().isEmpty().trim().escape()
];
const municipalityQueryValidation = [
    query('provinceCode', 'Se requiere provinceCode').not().isEmpty().trim().escape()
];
const suggestionQueryValidation = [
    query('lat', 'Se requiere latitud (lat)').isFloat(),
    query('lon', 'Se requiere longitud (lon)').isFloat()
];

// Rutas (prefijo /api/locations definido en app.js)
router.get('/departments', getDepartments);
router.get('/provinces', provinceQueryValidation, handleValidationErrors, getProvinces);
router.get('/municipalities', municipalityQueryValidation, handleValidationErrors, getMunicipalities);
router.get('/suggestions', suggestionQueryValidation, handleValidationErrors, getLocationSuggestions);
router.get('/council-roles', getCouncilRoles);

module.exports = router;