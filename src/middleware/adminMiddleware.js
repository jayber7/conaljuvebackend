// src/middleware/adminMiddleware.js
const AppError = require('../utils/appError.js'); // Reutiliza el helper de errores

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return next(new AppError('Acceso denegado. Se requiere rol de Administrador.', 403)); // 403 Forbidden
  }
};

module.exports = { admin };