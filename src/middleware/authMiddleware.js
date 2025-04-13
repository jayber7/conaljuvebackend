// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User'); // Asegúrate que la ruta es correcta
const AppError = require('../utils/appError.js'); // Necesitarás crear este helper de errores

// Helper simple para errores personalizados (crea src/utils/appError.js)
// class AppError extends Error {
//   constructor(message, statusCode) {
//     super(message);
//     this.statusCode = statusCode;
//     this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
//     this.isOperational = true;
//     Error.captureStackTrace(this, this.constructor);
//   }
// }
// module.exports = AppError;

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(' ')[1];

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obtener usuario del token (sin la contraseña)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
          return next(new AppError('El usuario perteneciente a este token ya no existe.', 401));
      }

      next();
    } catch (error) {
      console.error('Error de autenticación:', error.message);
       if (error.name === 'JsonWebTokenError') {
           return next(new AppError('Token inválido. Por favor inicie sesión de nuevo.', 401));
       } else if (error.name === 'TokenExpiredError') {
           return next(new AppError('Su sesión ha expirado. Por favor inicie sesión de nuevo.', 401));
       }
       return next(new AppError('No autorizado, fallo en la verificación del token.', 401));
    }
  }

  if (!token) {
    return next(new AppError('No autorizado, no se proporcionó token.', 401));
  }
});

module.exports = { protect };