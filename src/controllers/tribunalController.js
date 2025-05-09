// src/controllers/tribunalController.js
const Tribunal = require('../models/Tribunal');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
// Necesitarás los modelos de ubicación si quieres validar locationCode
// const Department = require('../models/Department');
// const Municipality = require('../models/Municipality');

// Helper para limpiar/formatear datos de directorio
const formatDirectory = (directory) => {
    if (!Array.isArray(directory)) return [];
    return directory.filter(m => m && m.role && m.fullName).map(m => ({
        role: m.role.trim(),
        fullName: m.fullName.trim(),
    }));
};

// @desc    Crear un nuevo Tribunal
// @route   POST /api/tribunals
// @access  Private/Admin
const createTribunal = asyncHandler(async (req, res, next) => {
    const { level, locationCode, locationName, directory, statuteUrl, regulationsUrl, termStartDate, termEndDate } = req.body;

    // Validaciones básicas (complementan express-validator)
    if (!level || !locationCode || !locationName) {
        return next(new AppError('Nivel, Código de Ubicación y Nombre de Ubicación son requeridos.', 400));
    }
    // Validar existencia de locationCode en Dept/Muni (opcional, más robusto)
    // ...

    // Verificar si ya existe
    const existing = await Tribunal.findOne({ level: level.toUpperCase(), locationCode });
    if (existing) {
        return next(new AppError(`Ya existe un tribunal ${level} para la ubicación ${locationCode}.`, 400));
    }

    const newTribunal = await Tribunal.create({
        level: level.toUpperCase(),
        locationCode,
        locationName,
        directory: formatDirectory(directory), // Limpiar directorio
        statuteUrl,
        regulationsUrl,
        termStartDate: termStartDate ? new Date(termStartDate) : undefined,
        termEndDate: termEndDate ? new Date(termEndDate) : undefined,
        // isActive por defecto es true
    });

    res.status(201).json({ status: 'success', data: { tribunal: newTribunal } });
});

// @desc    Obtener Tribunales (con filtros por nivel, locationCode)
// @route   GET /api/tribunals
// @access  Public (o Privado?) - Decide quién puede ver esta info
const getTribunals = asyncHandler(async (req, res, next) => {
    // Añadir lógica para convertir locationCode a número si se filtra por Dept/Muni
    const modifiedQuery = { ...req.query };
    if (modifiedQuery.locationCode && ['DEPARTAMENTAL', 'MUNICIPAL'].includes(modifiedQuery.level?.toUpperCase())) {
         const code = parseInt(modifiedQuery.locationCode, 10);
         if (!isNaN(code)) modifiedQuery.locationCode = code;
         else delete modifiedQuery.locationCode; // Ignorar si no es número válido
    }
     if (modifiedQuery.level) modifiedQuery.level = modifiedQuery.level.toUpperCase();


    const features = new APIFeatures(Tribunal.find({ isActive: true }), modifiedQuery)
        .filter()
        .sort('level locationName') // Ordenar
        .limitFields('-__v -isActive')
        .paginate(); // Opcional

    const tribunals = await features.query.lean();
    const totalTribunals = await Tribunal.countDocuments(new APIFeatures(Tribunal.find({ isActive: true }), modifiedQuery).filter().query.getQuery());

    res.status(200).json({
        status: 'success',
        results: tribunals.length,
        totalCount: totalTribunals,
        data: { tribunals }
    });
});

// @desc    Obtener un Tribunal por ID de Mongo
// @route   GET /api/tribunals/:id
// @access  Public (o Privado?)
const getTribunalById = asyncHandler(async (req, res, next) => {
    const tribunal = await Tribunal.findOne({ _id: req.params.id, isActive: true }).lean();
    if (!tribunal) {
        return next(new AppError('Tribunal no encontrado', 404));
    }
    res.status(200).json({ status: 'success', data: { tribunal } });
});


// @desc    Actualizar un Tribunal
// @route   PUT /api/tribunals/:id
// @access  Private/Admin
const updateTribunal = asyncHandler(async (req, res, next) => {
    const { directory, statuteUrl, regulationsUrl, termStartDate, termEndDate, isActive, locationName } = req.body;
    // No permitir cambiar level o locationCode fácilmente (requeriría borrar y crear)

    const updates = {};
    // Validar y formatear directorio si se envía
    if (directory !== undefined) updates.directory = formatDirectory(directory);
    // Permitir borrar URLs enviando null o string vacío
    if (statuteUrl !== undefined) updates.statuteUrl = statuteUrl || null;
    if (regulationsUrl !== undefined) updates.regulationsUrl = regulationsUrl || null;
    if (termStartDate !== undefined) updates.termStartDate = termStartDate ? new Date(termStartDate) : null;
    if (termEndDate !== undefined) updates.termEndDate = termEndDate ? new Date(termEndDate) : null;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);
    if (locationName !== undefined) updates.locationName = locationName;

    const tribunal = await Tribunal.findByIdAndUpdate(req.params.id, updates, {
        new: true, runValidators: true
    }).lean();

    if (!tribunal) {
        return next(new AppError('Tribunal no encontrado para actualizar', 404));
    }
    res.status(200).json({ status: 'success', data: { tribunal } });
});

// @desc    Eliminar un Tribunal (Soft delete o Hard delete)
// @route   DELETE /api/tribunals/:id
// @access  Private/Admin
const deleteTribunal = asyncHandler(async (req, res, next) => {
    // Opción 1: Soft delete (marcar como inactivo)
    // const tribunal = await Tribunal.findByIdAndUpdate(req.params.id, { isActive: false });
    // Opción 2: Hard delete
    const tribunal = await Tribunal.findByIdAndDelete(req.params.id);

    if (!tribunal) {
        return next(new AppError('Tribunal no encontrado para eliminar', 404));
    }
    res.status(204).json({ status: 'success', data: null });
});


module.exports = {
    createTribunal,
    getTribunals,
    getTribunalById,
    updateTribunal,
    deleteTribunal
};