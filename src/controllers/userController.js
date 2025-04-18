// src/controllers/userController.js
const User = require('../models/User');
const Department = require('../models/Department'); // <--- Importar Department
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError.js');
const APIFeatures = require('../utils/apiFeatures'); // Para paginación/filtros opcionales
// Helper para parsear números (lo necesitaremos aquí también)
const parseQueryNumber = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num; // Devuelve undefined si no es un número válido
};
// @desc    Actualizar ubicación del usuario logueado
// @route   PUT /api/users/me/location  (o tal vez /api/auth/me/location)
// @access  Private
const updateUserLocation = asyncHandler(async (req, res, next) => {
    // Validar datos de ubicación con express-validator en la ruta
    const { departmentCode, provinceCode, municipalityCode, zone } = req.body;
     // Crear el objeto location con los códigos parseados
     const locationData = {
        departmentCode: parseQueryNumber(departmentCode), // Usar helper
        provinceCode: parseQueryNumber(provinceCode),
        municipalityCode: parseQueryNumber(municipalityCode),
        zone: zone?.trim() || undefined // Limpiar zona
   };
    // Eliminar claves con valor undefined para no guardarlas en la DB si no se enviaron
    Object.keys(locationData).forEach(key => locationData[key] === undefined && delete locationData[key]);
     // Asegurarse de que al menos el departmentCode esté presente si es requerido en el modelo
     if (locationData.departmentCode === undefined) {
        // Ajusta este error si departmentCode es opcional en tu modelo User
        return next(new AppError('El código de departamento es requerido.', 400));
   }
   // --- FIN MODIFICACIÓN -
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id, // ID del usuario logueado desde 'protect'
        { location: locationData },
        { new: true, runValidators: true } // Devolver usuario actualizado y correr validaciones
    ).select('-password'); // Excluir contraseña

    if (!updatedUser) {
        return next(new AppError('Usuario no encontrado', 404));
    }
 // Opcional: Poblar nombres de ubicación para la respuesta (similar a newsController)
    // Si el frontend necesita mostrar los nombres inmediatamente después de actualizar
    let populatedLocation = { ...updatedUser.location };
    // const Department = require('../models/Department'); ... etc
    const [dept, prov, muni] = await Promise.all([ /* ... Búsquedas en paralelo ... */ ]);
    populatedLocation.departmentName = dept?.name || null;
    populatedLocation.provinceName = prov?.name || null;
    populatedLocation.municipalityName = muni?.name || null;
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser // Devolver el perfil actualizado
        }
    });
});

// Puedes añadir más funciones aquí si necesitas (ej. cambiar contraseña, actualizar perfil)
// @desc    Obtener todos los usuarios (para Admin)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res, next) => {
    // Excluir contraseñas por defecto
    // Opcional: Añadir paginación/filtrado/ordenamiento si la lista crece mucho
    const features = new APIFeatures(User.find(), req.query)
        .filter() // Permitir filtrar por username, email, role, etc. si se necesita
        .sort()   // Permitir ordenar
        .limitFields('-password') // Siempre excluir contraseña
        .paginate(); // Paginación básica

    let users = await features.query.lean();
    
    
     // --- POBLAR NOMBRES DE DEPARTAMENTO MANUALMENTE ---
     if (users.length > 0) {
        // 1. Obtener todos los códigos de departamento únicos de la lista de usuarios
        const departmentCodes = [...new Set(users.map(user => user.location?.departmentCode).filter(code => code != null))];

        // 2. Buscar los documentos de departamento correspondientes a esos códigos
        if (departmentCodes.length > 0) {
            const departmentsFound = await Department.find({ code: { $in: departmentCodes } }).select('code name').lean();
            // 3. Crear un mapa para búsqueda rápida: { code: name }
            const departmentMap = new Map(departmentsFound.map(dept => [dept.code, dept.name]));

            // 4. Añadir el departmentName a cada usuario en la lista
            users = users.map(user => {
                if (user.location?.departmentCode) {
                    return {
                        ...user,
                        location: {
                            ...user.location,
                            departmentName: departmentMap.get(user.location.departmentCode) || null // Añadir nombre
                        }
                    };
                }
                return user; // Devolver usuario sin cambios si no tiene código de depto
            });
        }
    }
    // --- FIN POBLAR NOMBRES ---
    // Opcional: Conteo total para paginación frontend
    const totalUsers = await User.countDocuments(new APIFeatures(User.find(), req.query).filter().query.getQuery());


    res.status(200).json({
        status: 'success',
        results: users.length,
        totalCount: totalUsers, // Enviar conteo si usas paginación
        data: {
            users,
        },
    });
});

// @desc    Actualizar rol de un usuario específico (por Admin)
// @route   PUT /api/users/:userId/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res, next) => {
    console.log('--> updateUserRole Controller - INICIO');
    console.log('req.params.userId:', req.params.userId);
    console.log('req.body.role:', req.body.role);

    const { role } = req.body;
    const { userId } = req.params;

    // Validar el rol recibido
    const validRoles = ['USER', 'STAFF', 'ADMIN']; // <-- Añadir STAFF
    if (!role || !validRoles.includes(role.toUpperCase())) {
        // Actualizar mensaje de error también
        return next(new AppError('Rol inválido proporcionado. Debe ser USER, STAFF o ADMIN.', 400));
    }

    // No permitir que un admin se quite el rol a sí mismo por accidente (opcional pero seguro)
    // if (req.user._id.toString() === userId && role.toUpperCase() !== 'ADMIN') {
    //     return next(new AppError('Un administrador no puede quitarse su propio rol.', 400));
    // }

    // Buscar y actualizar usuario
    const user = await User.findByIdAndUpdate(
        userId,
        { role: role.toUpperCase() }, // Guardar en mayúsculas
        { new: true, runValidators: true } // Devolver documento actualizado
    ).select('-password'); // Excluir contraseña de la respuesta

    if (!user) {
        return next(new AppError('Usuario no encontrado', 404));
    }

    res.status(200).json({
        status: 'success',
        message: `Rol del usuario ${user.username} actualizado a ${user.role}`,
        data: {
            user, // Devolver usuario actualizado
        }
    });
});


module.exports = {
    updateUserLocation,
    getUsers, // Exportar nueva función
    updateUserRole,
};