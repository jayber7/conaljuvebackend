const app = require('./app');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>
  console.log(`🚀 Servidor corriendo en modo ${process.env.NODE_ENV || 'development'} en el puerto ${PORT}`)
);

// Manejo de promesas no capturadas (opcional pero recomendado)
process.on('unhandledRejection', (err, promise) => {
  console.error(`❌ Error: ${err.message}`);
  // Cerrar servidor y salir
  server.close(() => process.exit(1));
});
