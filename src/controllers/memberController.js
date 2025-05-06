// src/controllers/memberController.js
const Member = require('../models/Member'); // Importar modelo Member
const User = require('../models/User'); // Necesario para vincular/desvincular
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// @desc    Registrar un nuevo miembro potencial
// @route   POST /api/members/register
// @access  Public
const registerNewMember = asyncHandler(async (req, res, next) => {
    // Campos de texto vienen en req.body
    const {
        fullName, idCard, idCardExtension, birthDate, sex, phoneNumber,
        location, neighborhoodCouncilName, memberRoleInCouncilCode 
    } = req.body;

    // Foto viene en req.file (si se usa upload.single('memberPhoto'))
    const photoFile = req.file;
    const photoUrl = photoFile ? photoFile.path : undefined;

    // --- Validación Adicional (Complementa express-validator) ---
    // Verificar si ya existe CI+Extensión
    const existingMember = await Member.findOne({ idCard, idCardExtension: idCardExtension });
    if (existingMember) {
        return next(new AppError(`El Carnet de Identidad ${idCard} ${idCardExtension} ya está registrado.`, 400));
    }
    // Asegurar que la ubicación tenga los campos requeridos
    if (!location || !location.departmentCode || !location.provinceCode || !location.municipalityCode || !location.zone  || !location.neighborhood  || !location.street) {
         return next(new AppError('La información completa de ubicación (Departamento, Provincia, Municipio, Zona, Barrio y Calle) es requerida.', 400));
    }
    // --- Fin Validación ---

    // Crear el objeto miembro (el código se genera por defecto)
    const memberData = {
        fullName, idCard,
        idCardExtension: idCardExtension,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        sex: typeof sex === 'boolean' ? sex : (sex === 'true' ? true : (sex === 'false' ? false : undefined)),
        phoneNumber: phoneNumber || undefined,
        location: {
            departmentCode: Number(location.departmentCode),
            provinceCode: Number(location.provinceCode),
            municipalityCode: Number(location.municipalityCode),
            zone: location.zone.trim(),
            neighborhood: location.neighborhood.trim(),
            street: location.street.trim(),
        },
        neighborhoodCouncilName,
        memberRoleInCouncilCode: Number(memberRoleInCouncilCode), // <-- Guardar código numérico
        photoUrl: photoUrl,
        status: 'PENDING', // Siempre empieza como pendiente
    };
     // Limpiar undefined
    Object.keys(memberData).forEach(key => memberData[key] === undefined && delete memberData[key]);
    Object.keys(memberData.location).forEach(key => memberData.location[key] === undefined && delete memberData.location[key]);


    const newMember = await Member.create(memberData);

    // Respuesta - NO se loguea, solo confirma recepción
    res.status(201).json({
        status: 'success',
        message: 'Registro de miembro recibido. Su solicitud está pendiente de verificación.',
        data: {
            registrationCode: newMember.registrationCode, // Devolver el código generado
            // Puedes devolver más datos si el frontend los necesita para el PDF
            fullName: newMember.fullName,
            idCard: newMember.idCard,
            idCardExtension: newMember.idCardExtension,
            memberRoleInCouncilCode: newMember.memberRoleInCouncilCode, // Enviar código de cargo
            location: newMember.location, // Enviar códigos de ubicación

        }
    });
});


// @desc    Obtener lista de miembros (Admin)
// @route   GET /api/members
// @access  Private/Admin
const getMembers = asyncHandler(async (req, res, next) => {
    const features = new APIFeatures(Member.find(), req.query)
        .filter() // Filtrar por status, nombre, etc.
        .sort()
        .limitFields('-__v') // Excluir versión de Mongoose
        .paginate();

    const members = await features.query.lean(); // Usar lean

    // Opcional: poblar nombres de ubicación
    // ... (lógica similar a newsController/userController para buscar dept/prov/muni) ...

    const totalMembers = await Member.countDocuments(new APIFeatures(Member.find(), req.query).filter().query.getQuery());

    res.status(200).json({
        status: 'success',
        results: members.length,
        totalCount: totalMembers,
        data: { members }
    });
});


// @desc    Actualizar estado de un miembro (Admin)
// @route   PUT /api/members/:code/status
// @access  Private/Admin
const updateMemberStatus = asyncHandler(async (req, res, next) => {
    const { status } = req.body;
    const { code } = req.params; // Buscar por registrationCode

    const validStatuses = ['PENDING', 'VERIFIED', 'REJECTED', 'INACTIVE'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
        return next(new AppError(`Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}`, 400));
    }

    const member = await Member.findOneAndUpdate(
        { registrationCode: code },
        { status: status.toUpperCase() },
        { new: true, runValidators: true }
    );

    if (!member) {
        return next(new AppError(`No se encontró registro de miembro con código ${code}`, 404));
    }

    // Opcional: Si apruebas (VERIFIED) y estaba vinculado, ¿actualizar rol en User?
    // if (status.toUpperCase() === 'VERIFIED' && member.linkedUserId) {
    //    await User.findByIdAndUpdate(member.linkedUserId, { role: 'MEMBER' }); // Si creas rol MEMBER
    // }

    res.status(200).json({
        status: 'success',
        message: `Estado del miembro ${member.fullName} actualizado a ${member.status}`,
        data: { member }
    });
});



module.exports = {
    registerNewMember,
    getMembers,
    updateMemberStatus,
    //linkMemberRegistration, // Exportar nueva función para userController/userRoutes
    // Añadir getMemberById, updateMember, deleteMember si los necesitas
};