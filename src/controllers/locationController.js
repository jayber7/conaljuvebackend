// src/controllers/locationController.js
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError.js');

// ESTO ES UN PLACEHOLDER - Necesitarías datos reales o una API externa

// Datos de ejemplo (deberían venir de una DB o config)
const departments = [
    { id: 'LP', name: 'La Paz' }, { id: 'CB', name: 'Cochabamba'}, { id: 'SC', name: 'Santa Cruz'}, /* ...otros */
];
const provinces = {
    LP: [{id: 'MURILLO', name: 'Murillo'}, {id: 'OMA', name: 'Omasuyos'} /* ... */],
    CB: [{id: 'CERCADO', name: 'Cercado'}, {id: 'QUILLACOLLO', name: 'Quillacollo'} /* ... */],
    // ... otras
};
const municipalities = {
    MURILLO: [{id: 'LPZ', name: 'La Paz'}, {id: 'ALT', name: 'El Alto'} /* ... */],
    CERCADO: [{id: 'CBBA', name: 'Cochabamba'} /* ... */],
     // ... otras
};


// @desc    Obtener lista de departamentos
// @route   GET /api/locations/departments
// @access  Public
const getDepartments = asyncHandler(async (req, res, next) => {
    // En un caso real, harías: const departments = await LocationModel.find({ type: 'department' });
    res.status(200).json({ status: 'success', data: { departments }});
});

// @desc    Obtener lista de provincias por departamento
// @route   GET /api/locations/provinces?departmentId=LP
// @access  Public
const getProvinces = asyncHandler(async (req, res, next) => {
    const { departmentId } = req.query;
    if (!departmentId) {
        return next(new AppError('Se requiere el parámetro departmentId', 400));
    }
    // En un caso real: const provinces = await LocationModel.find({ type: 'province', parent: departmentId });
    const departmentProvinces = provinces[departmentId.toUpperCase()] || [];
    res.status(200).json({ status: 'success', data: { provinces: departmentProvinces }});
});

// @desc    Obtener lista de municipios por provincia
// @route   GET /api/locations/municipalities?provinceId=MURILLO
// @access  Public
const getMunicipalities = asyncHandler(async (req, res, next) => {
    const { provinceId } = req.query;
     if (!provinceId) {
        return next(new AppError('Se requiere el parámetro provinceId', 400));
    }
     // En un caso real: const municipalities = await LocationModel.find({ type: 'municipality', parent: provinceId });
    const provinceMunicipalities = municipalities[provinceId.toUpperCase()] || [];
    res.status(200).json({ status: 'success', data: { municipalities: provinceMunicipalities }});
});


// @desc    Obtener sugerencias de ubicación por coordenadas (PLACEHOLDER)
// @route   GET /api/locations/suggestions?lat=X&lon=Y
// @access  Public
const getLocationSuggestions = asyncHandler(async (req, res, next) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return next(new AppError('Se requieren los parámetros lat y lon', 400));
    }

    // --- Lógica de Geocodificación Inversa ---
    // Aquí llamarías a una API externa (Nominatim, Mapbox, Google)
    // O consultarías una base de datos geoespacial local
    // Por ahora, devolvemos un ejemplo:
    const suggestion = {
        department: 'La Paz',
        province: 'Murillo',
        municipality: 'La Paz',
        zone: 'Sopocachi (Ejemplo)', // La zona es más difícil de obtener con precisión
        coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) }
    };
     // Simular un pequeño retraso
    await new Promise(resolve => setTimeout(resolve, 300));

    res.status(200).json({ status: 'success', data: { suggestion }});
});


module.exports = {
    getDepartments,
    getProvinces,
    getMunicipalities,
    getLocationSuggestions,
};