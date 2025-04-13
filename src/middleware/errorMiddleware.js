// src/middleware/errorMiddleware.js

// Middleware para rutas no encontradas (404)
const notFound = (req, res, next) => {
    const error = new Error(`No encontrado - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pasa el error al siguiente middleware
  };
  
  // Middleware manejador de errores general
  const errorHandler = (err, req, res, next) => {
    // A veces un error puede venir sin statusCode, poner 500 por defecto
    let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
    let message = err.message || 'Error interno del servidor';
  
    // Errores específicos de Mongoose que podemos hacer más amigables
    if (err.name === 'CastError') {
      message = `Recurso no encontrado. Inválido ${err.path}: ${err.value}`;
      statusCode = 404;
    }
    // Error de clave duplicada (ej. username o email ya existen)
    if (err.code === 11000) {
      const value = Object.keys(err.keyValue)[0]; // Obtiene el campo duplicado
      message = `Valor duplicado para el campo ${value}. Por favor use otro valor.`;
      statusCode = 400; // Bad Request
    }
    // Errores de validación de Mongoose
    if (err.name === 'ValidationError') {
      // Extrae los mensajes de error de cada campo
      const errors = Object.values(err.errors).map(el => el.message);
      message = `Datos de entrada inválidos: ${errors.join('. ')}`;
      statusCode = 400;
    }
     // Errores de JWT (ya manejados en protect, pero por si acaso)
     if (err.name === 'JsonWebTokenError') {
       message = 'Token inválido. Por favor inicie sesión de nuevo.';
       statusCode = 401;
     }
     if (err.name === 'TokenExpiredError') {
       message = 'Su sesión ha expirado. Por favor inicie sesión de nuevo.';
       statusCode = 401;
     }
  
  
    console.error('ERROR:', err); // Loggear el error completo en el servidor
  
    res.status(statusCode).json({
      message: message,
      // Solo mostrar stack en desarrollo
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
      status: err.status, // Incluye el status de AppError si existe
      isOperational: err.isOperational // Incluye si es un error operacional conocido
    });
  };
  
  module.exports = { notFound, errorHandler };