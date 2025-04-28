// src/controllers/locationController.js
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError.js'); // Asegúrate que la ruta es correcta
const Department = require('../models/Department'); // Importar modelos
const Province = require('../models/Province');
const Municipality = require('../models/Municipality');
const axios = require('axios'); // Para llamar a APIs externas (geocodificación)

// @desc    Obtener lista de departamentos
// @route   GET /api/locations/departments
// @access  Public
const getDepartments = asyncHandler(async (req, res, next) => {
    // Consulta todos los departamentos, ordena por nombre
    const departments = await Department.find().sort({ name: 1 }).select('code name abbreviation').lean(); // .lean() para objetos JS planos
    res.status(200).json({ status: 'success', data: { departments }});
});

// @desc    Obtener lista de provincias por código de departamento
// @route   GET /api/locations/provinces?departmentCode=LP
// @access  Public
const getProvinces = asyncHandler(async (req, res, next) => {
    const { departmentCode } = req.query;
    if (!departmentCode) {
        return next(new AppError('Se requiere el parámetro departmentCode', 400));
    }

    // Busca provincias que coincidan con el departmentCode, ordena por nombre
    const provinces = await Province.find({ departmentCode: departmentCode })
                                     .sort({ name: 1 })
                                     .lean();

    res.status(200).json({ status: 'success', data: { provinces }});
});

// @desc    Obtener lista de municipios por código de provincia
// @route   GET /api/locations/municipalities?provinceCode=MURILLO
// @access  Public
const getMunicipalities = asyncHandler(async (req, res, next) => {
    const { provinceCode } = req.query;
     if (!provinceCode) {
        return next(new AppError('Se requiere el parámetro provinceCode', 400));
    }

    // Busca municipios que coincidan con el provinceCode, ordena por nombre
    const municipalities = await Municipality.find({ provinceCode: provinceCode })
                                              .sort({ name: 1 })
                                              .lean();

    res.status(200).json({ status: 'success', data: { municipalities }});
});


// @desc    Obtener sugerencias de ubicación por coordenadas
// @route   GET /api/locations/suggestions?lat=X&lon=Y
// @access  Public
const getLocationSuggestions = asyncHandler(async (req, res, next) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return next(new AppError('Se requieren los parámetros lat y lon', 400));
    }

    // --- Lógica de Geocodificación Inversa Real ---
    try {
        // Ejemplo usando Nominatim (OSM) - ¡RESPETA SU POLÍTICA DE USO!
        // https://operations.osmfoundation.org/policies/nominatim/
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=es`;

        // Añade un User-Agent descriptivo
        const config = {
             headers: {
               'User-Agent': 'CONALJUVEApp/1.0 (contacto@conaljuve.org.bo)', // Cambia esto
             }
           };

        const response = await axios.get(nominatimUrl, config);
        const address = response.data?.address;

        if (!address) {
            console.warn(`Nominatim no devolvió dirección para ${lat},${lon}`);
            return next(new AppError('No se pudo determinar la ubicación para estas coordenadas.', 404));
        }

        // Mapear la respuesta de Nominatim a nuestra estructura
        // ¡OJO! Los nombres pueden variar mucho (ej. state vs department). Necesitarás ajustar esto.
        // 'state' suele ser Departamento en Bolivia según Nominatim.
        // 'county' a veces es Provincia.
        // 'city', 'town', 'village' pueden ser Municipio.
        const suggestedDepartmentName = address.state;
        const suggestedProvinceName = address.county; // Puede no ser siempre Provincia
        const suggestedMunicipalityName = address.city || address.town || address.village || address.municipality;
        const suggestedZone = address.suburb || address.neighbourhood || address.road; // La zona es aún menos precisa

        // Buscar los códigos correspondientes en nuestra DB (importante si usamos códigos)
        // Esta parte asume que los nombres son únicos o busca el más probable
        const dep = suggestedDepartmentName ? await Department.findOne({ name: new RegExp(`^${suggestedDepartmentName}$`, 'i') }).lean() : null;
        const prov = (dep && suggestedProvinceName) ? await Province.findOne({ departmentCode: dep.code, name: new RegExp(`^${suggestedProvinceName}$`, 'i') }).lean() : null;
        const mun = (prov && suggestedMunicipalityName) ? await Municipality.findOne({ provinceCode: prov.code, name: new RegExp(`^${suggestedMunicipalityName}$`, 'i') }).lean() : null;


        const suggestion = {
            department: dep?.code || null, // Devolver código si lo encontramos
            departmentName: dep?.name || suggestedDepartmentName || null, // Devolver nombre siempre
            province: prov?.code || null,
            provinceName: prov?.name || suggestedProvinceName || null,
            municipality: mun?.code || null,
            municipalityName: mun?.name || suggestedMunicipalityName || null,
            zone: suggestedZone || null, // Zona directamente de Nominatim
            fullAddress: response.data.display_name, // Dirección completa de Nominatim
            coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) }
        };

        res.status(200).json({ status: 'success', data: { suggestion }});

    } catch (error) {
         console.error("Error en geocodificación inversa:", error.response?.data || error.message);
         // Evitar exponer detalles internos del error al cliente
         return next(new AppError('Error al procesar la solicitud de sugerencia de ubicación.', 500));
    }
});


module.exports = {
    getDepartments,
    getProvinces,
    getMunicipalities,
    getLocationSuggestions,
};