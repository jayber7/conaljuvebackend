// src/middleware/staffOrAdminMiddleware.js
const AppError = require('../utils/appError'); // Asegúrate que la ruta sea correcta

// Middleware para verificar si el usuario es STAFF o ADMIN
const staffOrAdmin = (req, res, next) => {
  // Asume que 'protect' ya se ejecutó y añadió req.user
  if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'STAFF')) {
    next(); // Permitir acceso
  } else {
    return next(new AppError('Acceso denegado. Se requiere rol de Staff o Administrador.', 403)); // 403 Forbidden
  }
};

module.exports = { staffOrAdmin };