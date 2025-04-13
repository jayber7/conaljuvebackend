// src/middleware/validationMiddleware.js
const { validationResult } = require('express-validator');
const AppError = require('../utils/appError.js');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Formatea los errores para que sean más legibles
    const formattedErrors = errors.array().map(err => ({ field: err.path, message: err.msg }));
    // Usa el helper AppError con código 400 Bad Request
    return next(new AppError(`Datos de entrada inválidos: ${JSON.stringify(formattedErrors)}`, 400));
  }
  next();
};

// Aquí también puedes definir tus reglas de validación específicas y exportarlas
// Ejemplo: Reglas para registro
const registerValidationRules = [
    // ... tus reglas con check() o body()
];


module.exports = {
    handleValidationErrors,
    // registerValidationRules, // Exporta si defines reglas aquí
};