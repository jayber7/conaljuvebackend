// src/controllers/authController.js
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError.js');

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res, next) => {
  const { name, username, email, password, location, birthDate, gender, idCard, idCardExtension, phoneNumber } = req.body;

  // La información del archivo subido (si existe) está en req.file
  // multer-storage-cloudinary añade la propiedad 'path' con la URL segura de Cloudinary
  const profilePictureUrl = req.file ? req.file.path : undefined; // <-- OBTENER URL DE req.file
  // 1. Validar datos (hecho con express-validator en las rutas)

  // 2. Verificar si el usuario ya existe
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    return next(new AppError('El correo electrónico o nombre de usuario ya está registrado', 400));
  }

  // 3. Crear usuario (la contraseña se hashea en el pre-save hook del modelo)
  // 3. Crear objeto para el nuevo usuario
  const newUserInput = {
    name,
    username,
    email,
    password, // Se hashea en pre-save
    location, // Asegúrate que 'location' ya venga formateado con códigos numéricos
    // --- MODIFICACIÓN: Añadir nuevos campos (con validación básica) ---
    birthDate: birthDate ? new Date(birthDate) : undefined, // Convertir a Date si viene
    // Asegurarse que gender sea booleano o undefined
    gender: typeof gender === 'boolean' ? gender : undefined,
    profilePictureUrl: profilePictureUrl, // Usar URL si viene
    idCard: idCard || undefined,
    idCardExtension: idCardExtension ? idCardExtension.toUpperCase().trim() : undefined, // <-- Guardar si existe, en mayúsculas
    phoneNumber: phoneNumber || undefined,
    // --- FIN MODIFICACIÓN ---
  };
  // Limpiar campos undefined para no guardarlos si son opcionales
  Object.keys(newUserInput).forEach(key => newUserInput[key] === undefined && delete newUserInput[key]);
  if (newUserInput.location) {
      Object.keys(newUserInput.location).forEach(key => newUserInput.location[key] === undefined && delete newUserInput.location[key]);
  }
  // 4. Crear usuario en la DB
  const user = await User.create(newUserInput);

  // 4. Generar token y enviar respuesta
  if (user) {
    const token = generateToken(user._id);
    // Devolver los datos del usuario creado (excluyendo password por defecto)
    const userResponse = user.toObject(); // Convertir a objeto plano
    delete userResponse.password; // Doble check por si 'select: false' fallara
    res.status(201).json({ ...userResponse, token }); // Enviar datos + token
    // res.status(201).json({
    //   _id: user._id,
    //   name: user.name,
    //   username: user.username,
    //   email: user.email,
    //   role: user.role,
    //   location: user.location,
    //   token: token,
    // });
  } else {
    return next(new AppError('Datos de usuario inválidos', 400)); // Error genérico si falla la creación
  }
});

// @desc    Autenticar usuario y obtener token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res, next) => {
  const { usernameOrEmail, password } = req.body;

  // 1. Validar entrada (hecho con express-validator)

  // 2. Buscar usuario por email o username Y seleccionar la contraseña
  const user = await User.findOne({
    $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
  }).select('+password'); // IMPORTANTE: Seleccionar contraseña explícitamente

  // 3. Verificar si el usuario existe y la contraseña coincide
  if (user && (await user.matchPassword(password))) {
    const token = generateToken(user._id);
    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      location: user.location,
      birthDate: user.birthDate, 
      gender: user.gender, 
      profilePictureUrl:user.profilePictureUrl, 
      idCard: user.idCard, 
      phoneNumber: user.phoneNumber, 
      token: token,
    });
  } else {
    return next(new AppError('Credenciales inválidas', 401)); // Usar 401 Unauthorized
  }
});

// @desc    Obtener perfil del usuario logueado
// @route   GET /api/auth/me
// @access  Private (requiere 'protect' middleware)
const getMe = asyncHandler(async (req, res, next) => {
  // req.user es añadido por el middleware 'protect'
  const user = req.user;
  if (user) {
     res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      location: user.location,
      birthDate: user.birthDate, 
      gender: user.gender, 
      profilePictureUrl:user.profilePictureUrl, 
      idCard: user.idCard, 
      phoneNumber: user.phoneNumber,       
      createdAt: user.createdAt
    });
  } else {
      return next(new AppError('Usuario no encontrado', 404));
  }

});

module.exports = {
  registerUser,
  loginUser,
  getMe,
};