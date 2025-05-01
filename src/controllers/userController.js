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

// @desc    Vincular registro de miembro a usuario logueado
// @route   PUT /api/users/me/link-member
// @access  Private (Usuario logueado)
const linkMemberRegistration = asyncHandler(async (req, res, next) => {
    const { registrationCode } = req.body;
    const userId = req.user._id; // Usuario logueado desde 'protect'

    if (!registrationCode) {
        return next(new AppError('Se requiere el código de registro del miembro.', 400));
    }

    // 1. Buscar el registro de miembro por código
    const memberRecord = await Member.findOne({ registrationCode: registrationCode.toUpperCase() });

    if (!memberRecord) {
        return next(new AppError(`El código de registro "${registrationCode}" no fue encontrado.`, 404));
    }

    // 2. Verificar estado del miembro (solo vincular si está VERIFIED)
    if (memberRecord.status !== 'VERIFIED') {
         return next(new AppError(`El registro ${registrationCode} aún no ha sido verificado o está inactivo/rechazado.`, 403));
    }

    // 3. Verificar si el registro ya está vinculado a OTRO usuario
    if (memberRecord.linkedUserId && memberRecord.linkedUserId.toString() !== userId.toString()) {
        return next(new AppError(`Este registro de miembro ya está vinculado a otra cuenta de usuario.`, 409)); // 409 Conflict
    }

    // 4. Verificar si el usuario actual ya está vinculado a OTRO registro
    if (req.user.memberRegistrationCode && req.user.memberRegistrationCode !== registrationCode.toUpperCase()) {
         return next(new AppError(`Tu cuenta ya está vinculada al registro ${req.user.memberRegistrationCode}.`, 409));
    }

     // 5. Si ya está vinculado a ESTE usuario, no hacer nada extra
     if (memberRecord.linkedUserId && memberRecord.linkedUserId.toString() === userId.toString()) {
         return res.status(200).json({ status: 'success', message: 'Tu cuenta ya está vinculada a este registro.', data: { user: req.user } });
     }

    // 6. Realizar la vinculación bidireccional
    // Actualizar User
    req.user.memberRegistrationCode = memberRecord.registrationCode;
    await req.user.save({ validateBeforeSave: false }); // Guardar usuario (saltar validaciones si es necesario)

    // Actualizar MemberRegistry
    memberRecord.linkedUserId = userId;
    await memberRecord.save();

    console.log(`Usuario ${req.user.email} vinculado exitosamente al registro ${memberRecord.registrationCode}`);

    // Devolver el usuario actualizado (sin contraseña)
     const updatedUserResponse = req.user.toObject();
     delete updatedUserResponse.password;

    res.status(200).json({
        status: 'success',
        message: `Registro ${memberRecord.registrationCode} vinculado exitosamente a tu cuenta.`,
        data: {
            user: updatedUserResponse
        }
    });
});


// @desc    Completar o actualizar perfil del usuario logueado
// @route   PUT /api/users/me/profile
// @access  Private
const completeUserProfile = asyncHandler(async (req, res, next) => {
    // Obtener ID del usuario logueado (desde sesión de Passport o token JWT via 'protect')
    const userId = req.user._id;

    // Obtener los datos permitidos del body
    const {
        name, location, birthDate, sex, idCard, idCardExtension, phoneNumber
    } = req.body;

    // Construir objeto de actualización solo con los campos proporcionados
    const updates = {};
    if (name) updates.name = name;
    // Formatear location (asumiendo que viene con códigos)
    if (location) {
        updates.location = {
             departmentCode: location.departmentCode ? Number(location.departmentCode) : undefined,
             provinceCode: location.provinceCode ? Number(location.provinceCode) : undefined,
             municipalityCode: location.municipalityCode ? Number(location.municipalityCode) : undefined,
             zone: location.zone || undefined,
        };
         Object.keys(updates.location).forEach(key => updates.location[key] === undefined && delete updates.location[key]);
         if (Object.keys(updates.location).length === 0) delete updates.location;
    }
    if (birthDate) updates.birthDate = new Date(birthDate); // Asegurar que sea Date
    const sexValue = typeof sex === 'boolean' ? sex : (sex === 'true' ? true : (sex === 'false' ? false : undefined));
    if (sexValue !== undefined) updates.sex = sexValue;
    if (idCard !== undefined) updates.idCard = idCard; // Permitir string vacío si se quiere borrar?
    if (idCardExtension !== undefined) updates.idCardExtension = idCardExtension;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;

    // Marcar perfil como completo si se actualizan campos clave (ej. ubicación)
    if (updates.location?.departmentCode) { // Si al menos el depto se completó
        updates.isProfileComplete = true;
    }

    // Realizar la actualización
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        updates, // Aplicar solo los campos que vienen
        { new: true, runValidators: true } // Devolver actualizado, correr validaciones
    ).select('-password'); // Excluir contraseña

    if (!updatedUser) {
        return next(new AppError('Usuario no encontrado', 404));
    }

    res.status(200).json({
        status: 'success',
        message: 'Perfil actualizado exitosamente.',
        data: {
            user: updatedUser // Devolver perfil completo y actualizado
        }
    });
});

module.exports = {
    //updateUserLocation,
    getUsers, // Exportar nueva función
    updateUserRole,
    completeUserProfile, // Exportar nueva función
    linkMemberRegistration
};