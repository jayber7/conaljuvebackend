// src/controllers/authController.js
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError.js');

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res, next) => {
  const { name, username, email, password, location } = req.body;

  // 1. Validar datos (hecho con express-validator en las rutas)

  // 2. Verificar si el usuario ya existe
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    return next(new AppError('El correo electrónico o nombre de usuario ya está registrado', 400));
  }

  // 3. Crear usuario (la contraseña se hashea en el pre-save hook del modelo)
  const user = await User.create({
    name,
    username,
    email,
    password, // Pasar la contraseña en texto plano, el modelo la hashea
    location, // Asegúrate que la estructura coincida con el modelo
  });

  // 4. Generar token y enviar respuesta
  if (user) {
    const token = generateToken(user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      location: user.location,
      token: token,
    });
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