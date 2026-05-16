// src/utils/appError.js
class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
  
      this.statusCode = statusCode;
      // Determina 'fail' (4xx) o 'error' (5xx) basado en el código
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      // Marca errores operacionales (confiables) vs errores de programación
      this.isOperational = true;
  
      // Captura el stack trace, excluyendo la llamada al constructor
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  module.exports = AppError;