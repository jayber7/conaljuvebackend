// src/controllers/projectController.js
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
// Importar modelos de ubicación si necesitas poblar nombres para la respuesta
const Department = require('../models/Department');
const Province = require('../models/Province');
const Municipality = require('../models/Municipality');

// Helper para parsear números (si es necesario para filtros)
const parseQueryNumber = (value) => { /* ... */ };

// @desc    Obtener todos los proyectos (con filtros, paginación)
// @route   GET /api/projects
// @access  Private (Staff/Admin o incluso Usuario para verlos?) -> Decide el acceso
const getProjects = asyncHandler(async (req, res, next) => {
    // --- Filtrado ---
    const modifiedQuery = { ...req.query };
   // const matchStage = { isPublished: true }; // Ejemplo filtro base
    const matchStage = {};
    // Parsear filtros de ubicación a números si vienen como string
    if (modifiedQuery['location.departmentCode']) matchStage['location.departmentCode'] = modifiedQuery['location.departmentCode'];
    if (modifiedQuery['location.provinceCode']) matchStage['location.provinceCode'] = modifiedQuery['location.provinceCode'];
     if (modifiedQuery['location.municipalityCode']) matchStage['location.municipalityCode'] = modifiedQuery['location.municipalityCode'];
    // Object.keys(modifiedQuery).forEach(key => (modifiedQuery[key] === undefined || modifiedQuery[key] === '') && delete modifiedQuery[key]);
     // Limpiar filtros inválidos o vacíos...
    
    // --- Fin Filtrado ---
    try { 
        const aggregationPipeline = [
            // 1. Filtrar Proyectos ($match)
            { $match: matchStage },
            // 2. Ordenar ($sort - opcional, puede ir después)
            { $sort: { startDate: -1 } },
            // 3. Paginación ($skip, $limit - opcional, puede ir después)
            // { $skip: (page - 1) * limit },
            // { $limit: limit },
    
            // --- $lookup para Autor (User) ---
            {
                $lookup: {
                    from: 'users', // Nombre de la colección de usuarios
                    localField: 'createdBy', // Campo en Project
                    foreignField: '_id', // Campo en User
                    as: 'authorInfo' // Nombre del nuevo array que se añadirá
                }
            },
            // Desconstruir el array authorInfo (usualmente solo tendrá 1 elemento)
            { $unwind: { path: '$authorInfo', preserveNullAndEmptyArrays: true } }, // preserveNull... por si createdBy es inválido
    
            // --- $lookup para Departamento ---
            {
                $lookup: {
                    from: 'departments', // Nombre de la colección de departamentos
                    localField: 'location.departmentCode', // Campo en Project
                    foreignField: 'code', // Campo en Department (el código numérico)
                    as: 'departmentInfo'
                }
            },
            { $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true } },
    
            // --- $lookup para Provincia ---
            {
                $lookup: {
                    from: 'provinces',
                    localField: 'location.provinceCode',
                    foreignField: 'code',
                    as: 'provinceInfo'
                }
            },
            { $unwind: { path: '$provinceInfo', preserveNullAndEmptyArrays: true } },
            
            // --- $lookup para Municipio ---
            {
                $lookup: {
                    from: 'municipalities',
                    localField: 'location.municipalityCode',
                    foreignField: 'code',
                    as: 'municipalityInfo'
                }
            },
            { $unwind: { path: '$municipalityInfo', preserveNullAndEmptyArrays: true } },
    
            // --- Proyectar ($project) para dar forma final a la respuesta ---
            {
                $project: {
                    // Incluir campos originales del proyecto
                    projectName: 1, objective: 1, /* ... otros campos directos del proyecto ... */
                    fundingSource: 1, beneficiaries: 1,
                    startDate: 1, endDate: 1, status: 1, createdAt: 1, updatedAt: 1, pdfUrl: 1, imageUrl: 1, tags: 1,
                    _id: 1, // No olvides el _id si lo necesitas
                
                    // Campos poblados de 'createdBy'
                    'createdBy._id': '$authorInfo._id',
                    'createdBy.name': '$authorInfo.name',
                
                    // --- RECONSTRUIR OBJETO LOCATION ---
                    location: {
                        // Mantener los códigos y campos originales de location
                        departmentCode: '$location.departmentCode',
                        provinceCode: '$location.provinceCode',
                        municipalityCode: '$location.municipalityCode',
                        zone: '$location.zone',
                        barrio: '$location.barrio',
                        
                        // Añadir los nombres poblados
                        departmentName: '$departmentInfo.name',
                        provinceName: '$provinceInfo.name',
                        municipalityName: '$municipalityInfo.name'
                    }
                    // --- FIN RECONSTRUIR ---
                }
            }
        ];
        console.log(JSON.stringify(matchStage, null, 2))
        // Ejecutar la agregación
        console.log("Ejecutando agregación de proyectos...");
        const projects = await Project.aggregate(aggregationPipeline);
        console.log(`Proyectos obtenidos por agregación: ${JSON.stringify(projects, null, 2)}`);
    
        // --- Conteo Total (requiere pipeline de conteo separada) ---
        const countPipeline = [
            { $match: matchStage },
            { $count: 'totalCount' }
        ];
        const countResult = await Project.aggregate(countPipeline);
        const totalProjects = countResult[0]?.totalCount || 0;
        console.log("Conteo total (agregación):", totalProjects);
        // --- Fin Conteo ---
    
    
        res.status(200).json({
            status: 'success',
            results: projects.length,
            totalCount: totalProjects,
            data: { projects } // Ya vienen con los nombres poblados
        });
    
    } catch (error) {
         console.error("--- ERROR DENTRO DE getProjects (Agregación) ---", error);
         next(error);
    }
});

// @desc    Crear un nuevo proyecto
// @route   POST /api/projects
// @access  Private/StaffOrAdmin
const createProject = asyncHandler(async (req, res, next) => {
    const {
        projectName, objective, location, fundingSource,
        beneficiaries, startDate, endDate, status
    } = req.body;

    // Validación básica adicional (complementa express-validator)
    if (!location || !location.departmentCode || !location.provinceCode || !location.municipalityCode || !location.zone || !location.barrio) {
        return next(new AppError('Faltan datos requeridos de ubicación (Depto, Prov, Muni, Zona, Barrio).', 400));
    }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
         return next(new AppError('La fecha de finalización no puede ser anterior a la fecha de inicio.', 400));
    }

    const newProjectData = {
        projectName, objective,
        location: {
            departmentCode: Number(location.departmentCode),
            provinceCode: Number(location.provinceCode),
            municipalityCode: Number(location.municipalityCode),
            zone: location.zone,
            barrio: location.barrio,
            
        },
        fundingSource, beneficiaries,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || 'PLANIFICADO', // Default si no se envía
        createdBy: req.user._id, // Usuario que lo registra
    };
    // Limpiar undefined
    Object.keys(newProjectData).forEach(key => newProjectData[key] === undefined && delete newProjectData[key]);
     if (newProjectData.location) {
       Object.keys(newProjectData.location).forEach(key => newProjectData.location[key] === undefined && delete newProjectData.location[key]);
       if (Object.keys(newProjectData.location).length < 5) { // Asegurar campos requeridos de location
           // Esto no debería pasar si la validación inicial funciona
           return next(new AppError('Faltan datos requeridos en la ubicación.', 400));
       }
     }


    const project = await Project.create(newProjectData);
    const populatedProject = await Project.findById(project._id).populate('createdBy', 'name').lean();

    res.status(201).json({
        status: 'success',
        data: { project: populatedProject || project }
    });
});

// --- Controladores Opcionales (CRUD Completo) ---

// @desc    Obtener un proyecto por ID
// @route   GET /api/projects/:id
// @access  Private (Staff/Admin o Usuario?)
const getProjectById = asyncHandler(async (req, res, next) => {
    const project = await Project.findById(req.params.id).populate('createdBy', 'name').lean();
    if (!project) {
        return next(new AppError('Proyecto no encontrado', 404));
    }
    // Poblar nombres de ubicación si es necesario para mostrar detalle
    res.status(200).json({ status: 'success', data: { project } });
});

// @desc    Actualizar un proyecto
// @route   PUT /api/projects/:id
// @access  Private/StaffOrAdmin
const updateProject = asyncHandler(async (req, res, next) => {
    const updates = { ...req.body };
    // No permitir cambiar createdBy
    delete updates.createdBy;
    // Formatear fechas y location si vienen
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);
     if (updates.location) { /* ... formatear códigos numéricos ... */ }
    // Añadir validación de fechas si ambas se actualizan
    if (updates.startDate && updates.endDate && updates.endDate < updates.startDate) { /* ... error ... */ }
     if (updates.startDate && !updates.endDate) { // Si se cambia inicio, verificar contra fecha final existente
        const existingProject = await Project.findById(req.params.id).select('endDate').lean();
        if (existingProject?.endDate && existingProject.endDate < updates.startDate) { /* ... error ... */}
     }
      if (updates.endDate && !updates.startDate) { // Si se cambia fin, verificar contra fecha inicio existente
          const existingProject = await Project.findById(req.params.id).select('startDate').lean();
         if (existingProject?.startDate && updates.endDate < existingProject.startDate) { /* ... error ... */}
     }


    const project = await Project.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true
    }).populate('createdBy', 'name').lean();

    if (!project) {
        return next(new AppError('Proyecto no encontrado para actualizar', 404));
    }
    res.status(200).json({ status: 'success', data: { project } });
});

// @desc    Eliminar un proyecto
// @route   DELETE /api/projects/:id
// @access  Private/Admin (O Staff/Admin?)
const deleteProject = asyncHandler(async (req, res, next) => {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
        return next(new AppError('Proyecto no encontrado para eliminar', 404));
    }
    res.status(204).json({ status: 'success', data: null });
});


module.exports = {
    getProjects,
    createProject,
    getProjectById, // Exportar si se implementa
    updateProject,  // Exportar si se implementa
    deleteProject   // Exportar si se implementa
};