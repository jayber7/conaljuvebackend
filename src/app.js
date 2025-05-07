const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session'); // Importar express-session
const passport = require('passport');      // Importar passport
const cookieParser = require('cookie-parser'); // Importar cookie-parser
const connectDB = require('./config/db'); // Importar conexión DB
require('./config/passportConfig'); // <--- IMPORTANTE: Ejecuta la configuración de Passport
//--- Rutas (Importar y usar cuando estén listas) ---
const authRoutes = require('./routes/authRoutes');
const newsRoutes = require('./routes/newsRoutes');
const commentRoutes = require('./routes/commentRoutes');
const userRoutes = require('./routes/userRoutes'); // Necesitará nueva ruta para completar perfil
const locationRoutes = require('./routes/locationRoutes');
const memberRoutes = require('./routes/memberRoutes'); // Importar nuevas rutas
const projectRoutes = require('./routes/projectRoutes'); // <-- Importar
const statsRoutes = require('./routes/statsRoutes');


// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();
// --- Swagger Imports ---
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swaggerConfig'); // 
const app = express();

// Middlewares esenciales
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Permitir origen del frontend
  credentials: true // IMPORTANTE para cookies de sesión entre dominios/puertos
})); // Habilitar CORS (configurar orígenes específicos en producción)
app.use(express.json()); // Para parsear JSON bodies
app.use(express.urlencoded({ extended: true })); // Para parsear form-data
app.use(cookieParser()); // Usar cookie-parser ANTES de session


// --- Configuración de Sesión ---
app.use(session({
  secret: process.env.SESSION_SECRET, // Secreto para firmar la cookie de sesión
  resave: false, // No volver a guardar si no hay cambios
  saveUninitialized: false, // No guardar sesiones vacías
  // Opciones adicionales (ej. store para producción, cookie settings)
  // cookie: { secure: process.env.NODE_ENV === 'production', maxAge: ... } // secure: true en producción (HTTPS)
}));
// --- FIN Configuración Sesión ---

// --- Inicializar Passport y Sesión de Passport ---
app.use(passport.initialize()); // Inicia Passport
app.use(passport.session());    // Permite sesiones persistentes de login
// --- FIN Passport ---

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
app.use('/api/users', userRoutes); 
app.use('/api/locations', locationRoutes); 
app.use('/api/members', memberRoutes); 
app.use('/api/projects', projectRoutes); 
app.use('/api/stats', statsRoutes);
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
