const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db'); // Importar conexión DB

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();
// --- Swagger Imports ---
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swaggerConfig'); // 
const app = express();

// Middlewares esenciales
app.use(cors()); // Habilitar CORS (configurar orígenes específicos en producción)
app.use(express.json()); // Para parsear JSON bodies
app.use(express.urlencoded({ extended: true })); // Para parsear form-data

//--- Rutas (Importar y usar cuando estén listas) ---
const authRoutes = require('./routes/authRoutes');
const newsRoutes = require('./routes/newsRoutes');
const commentRoutes = require('./routes/commentRoutes');
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');

// --- Ruta para la Documentación Swagger ---
// Es bueno ponerla antes de las rutas de la API principal
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Puedes ver la documentación en http://localhost:5000/api-docs (o el puerto que uses)

app.get('/api', (req, res) => {
  res.json({ message: 'Bienvenido a la API de CONALJUVE v1.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes); // Ejemplo
app.use('/api/locations', locationRoutes); // Ejemplo

// --- Middleware de Manejo de Errores (Importar y usar al final) ---
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

// Placeholder simple para errores si no se importan los específicos
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Si no hay código, es 500
  res.status(statusCode);
  res.json({
    message: err.message,
    // Enviar stack solo en desarrollo
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});


module.exports = app;
