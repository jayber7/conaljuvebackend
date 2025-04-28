// src/routes/authRoutes.js
const express = require('express');
const { body } = require('express-validator');
const { getMe, verifyGoogleCode } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { completeUserProfile } = require('../controllers/userController');
const { handleValidationErrors } = require('../middleware/validationMiddleware');
const { upload } = require('../config/cloudinaryConfig'); // Ajusta la ruta si es necesario
const validDepartmentCodes = ['LP', 'CB', 'SC', 'OR', 'PO', 'CH', 'TJ', 'BE', 'PA'];
const passport = require('passport');
const jwt = require('jsonwebtoken'); // Para generar token JWT si quieres devolverlo además de la sesión
const generateToken = require('../utils/generateToken'); // Tu utilidad JWT



const router = express.Router();
// Reglas de validación para registro
const registerValidation = [
    // --- Validaciones existentes ---
    body('name', 'El nombre es requerido').not().isEmpty().trim().escape(),
    // body('username', 'Usuario requerido').not().isEmpty().trim().escape(),
    // body('email', 'Correo inválido').isEmail().normalizeEmail(),
    // body('password', 'Contraseña mín. 6 caracteres').isLength({ min: 6 }),
    body('location.departmentCode', 'Código Dept. requerido').optional().isEmpty().isInt({ min: 0 }).toInt(),
    body('location.provinceCode', 'Código Prov. inválido').optional().isInt({ min: 0 }).toInt(),
    body('location.municipalityCode', 'Código Muni. inválido').optional().isInt({ min: 0 }).toInt(),
    body('location.zone').optional().isString().trim().escape(),

    // --- NUEVAS VALIDACIONES ---
    body('birthDate', 'Fecha de nacimiento inválida (YYYY-MM-DD)')
        .optional({ checkFalsy: true }) // Hacerla opcional (elimina si es req.)
        .isISO8601() // Espera formato YYYY-MM-DD o completo ISO
        .toDate(), // Convertir a objeto Date
    body('gender', 'Género inválido')
        .optional()
        .isBoolean().withMessage('Debe ser true o false'), // Validar que sea booleano si se envía
    body('profilePictureUrl', 'URL de foto inválida')
        .optional({ checkFalsy: true })
        .isURL(),
    body('idCard', 'Número de carnet inválido')
        .optional({ checkFalsy: true }) // Hacerlo opcional
        .isString().trim().escape(), // Ajusta validación si tiene formato específico
    body('idCardExtension', 'Extensión de CI inválida (código numérico)')
        .optional({ checkFalsy: true })
        .isInt({ min: 1, max: 9 }) // Asumiendo códigos 1-9
        .toInt(), // Convertir a número entero
    body('phoneNumber', 'Número de celular inválido')
        .optional({ checkFalsy: true })
        .isString().trim().escape() // Validación simple, puede mejorarse
        // .matches(/^\+?[0-9\s\-()]+$/).withMessage('Formato de teléfono inválido'), // Ejemplo validación más estricta
    // --- FIN NUEVAS VALIDACIONES ---
];
// Ruta inicial: Redirige al usuario a Facebook para autenticarse
router.get('/facebook', passport.authenticate('facebook', {

    scope: ['email', 'public_profile'], // Permisos que solicitamos a Facebook
    session: false // Asegúrate que aquí también sea false si no usas sesión en absoluto
}));
// Ruta de Callback: Facebook redirige aquí después de la autenticación
router.get('/facebook/callback',
    passport.authenticate('facebook', {
        // failureRedirect: `${process.env.FRONTEND_URL}/login-error`, // A dónde redirigir si falla en FB
        failureRedirect: `${process.env.FRONTEND_URL}/?login_error=facebook_failed`, // Buena idea tener un redirect de fallo
        session: false // Usar sesión de passport
    }),
    // Si la autenticación es exitosa, esta función se ejecuta
    (req, res) => {
        // req.user contiene el usuario encontrado/creado por la estrategia de Passport
        console.log('Usuario autenticado por FB:', req.user.email);
        console.log('Perfil completo:', req.user.isProfileComplete);
        // --- Opción 1: Solo usar Sesión de Passport ---
        // La sesión ya está establecida por passport.authenticate. Solo redirigir.
        // El frontend necesitará hacer una llamada a /api/auth/me para obtener datos
        // y saber si necesita completar perfil.
        //const redirectUrl = req.user.isProfileComplete? `${process.env.FRONTEND_URL}/`: `${process.env.FRONTEND_URL}/completar-perfil`; // O solo '/' si usas Enfoque 2
        // --- Opción 2: Devolver un Token JWT (además de la sesión) ---
        // Útil si tu frontend prefiere manejar JWTs en lugar de depender solo de cookies de sesión.
        const token = generateToken(req.user._id);
        const userDataForFrontend = {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            profilePictureUrl: req.user.profilePictureUrl,
            isProfileComplete: req.user.isProfileComplete,
            // No enviar location, etc. aquí, se piden después si es necesario
        };
        // --- Devolver Script HTML para comunicarse con el opener (Frontend) ---
        // Este script se ejecutará en la ventana emergente
        const responseScript = `
            <script>
                try {
                    const payload = ${JSON.stringify({ user: userDataForFrontend, token })};
                    // Enviar mensaje a la ventana que abrió el popup
                    window.opener.postMessage({ type: 'auth-success', payload: payload }, '${process.env.FRONTEND_URL}');
                } catch (e) {
                    // Enviar error si algo falla al construir/enviar mensaje
                    window.opener.postMessage({ type: 'auth-error', error: 'Error procesando datos de login' }, '${process.env.FRONTEND_URL}');
                    console.error('Error sending message to opener:', e);
                } finally {
                    // Cerrar la ventana emergente
                    window.close();
                }
            </script>
        `;
        res.status(200).send(responseScript);
        // --- FIN DEVOLVER SCRIPT ---
        // --- Redirección al Frontend ---
        // Decide a dónde redirigir. Si el perfil no está completo, quizás a una página específica.
        // const redirectUrl = req.user.isProfileComplete
        //                    ? `${process.env.FRONTEND_URL}/` // Al inicio si está completo
        //                    : `${process.env.FRONTEND_URL}/completar-perfil`; // A completar perfil si no

        // // Puedes pasar el token en la URL (menos seguro) o hacer que el frontend lo pida a /me
        // // Redirigir:
        //  console.log(`Redirigiendo a: ${redirectUrl}`);
        //  res.redirect(redirectUrl);

         // O Enviar datos directamente (si el frontend abre una ventana y espera)
         // Necesitarías ajustar el flujo del frontend para manejar esto
        //  res.status(200).json({
        //      message: 'Autenticación con Facebook exitosa',
        //      user: { // Devolver datos básicos (sin contraseña)
        //          _id: req.user._id,
        //          name: req.user.name,
        //          email: req.user.email,
        //          role: req.user.role,
        //          profilePictureUrl: req.user.profilePictureUrl,
        //          isProfileComplete: req.user.isProfileComplete
        //      },
        //      token: token // Enviar token si usas Opción 2
        //  });
    }
);

// --- Documentación de Schemas para request bodies ---
/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterUserInput:
 *       type: object
 *       required:
 *         - name
 *         - username
 *         - email
 *         - password
 *         - location
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre completo del usuario.
 *           example: Maria Gomez
 *         username:
 *           type: string
 *           description: Nombre de usuario único para login.
 *           example: mariagomez
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico único.
 *           example: maria.gomez@email.com
 *         password:
 *           type: string
 *           format: password
 *           description: Contraseña (mínimo 6 caracteres).
 *           example: password123
 *         location:
 *           type: object
 *           required:
 *             - department
 *           properties:
 *             department:
 *               type: string
 *               description: Departamento de residencia.
 *               example: Cochabamba
 *             province:
 *               type: string
 *               description: Provincia de residencia (opcional).
 *               example: Cercado
 *             municipality:
 *               type: string
 *               description: Municipio de residencia (opcional).
 *               example: Cochabamba
 *             zone:
 *               type: string
 *               description: Zona/Barrio de residencia (opcional).
 *               example: Cala Cala
 *     LoginUserInput:
 *       type: object
 *       required:
 *         - usernameOrEmail
 *         - password
 *       properties:
 *         usernameOrEmail:
 *           type: string
 *           description: Nombre de usuario o correo electrónico.
 *           example: mariagomez
 *         password:
 *           type: string
 *           format: password
 *           description: Contraseña del usuario.
 *           example: password123
 *     AuthResponse:
 *       type: object
 *       properties:
 *          _id: { type: string }
 *          name: { type: string }
 *          username: { type: string }
 *          email: { type: string, format: email }
 *          role: { type: string, enum: ['USER', 'ADMIN'] }
 *          location: { $ref: '#/components/schemas/RegisterUserInput/properties/location' } # Reutilizar schema
 *          token: { type: string, description: 'JWT Token para autenticación' }
 */

// --- Definición de Rutas con Documentación ---

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registra un nuevo usuario.
 *     tags: [Autenticación]
 *     description: Crea una nueva cuenta de usuario en el sistema.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUserInput'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente. Devuelve datos del usuario y token JWT.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Datos de entrada inválidos o usuario ya existe.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

//router.post('/register', upload.single('profilePicture'), registerValidation, handleValidationErrors, registerUser);
router.post('/google/verify-code', verifyGoogleCode); // <-- ¿Está verifyGoogleCode importado correctamente?


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Inicia sesión de un usuario existente.
 *     tags: [Autenticación]
 *     description: Autentica al usuario con nombre de usuario/email y contraseña, devuelve datos y token JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUserInput'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Credenciales inválidas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Datos de entrada inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor.
 */
const loginValidation = [ /* ... tus reglas de validación ... */ ];
//router.post('/login', loginValidation, handleValidationErrors, loginUser);
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) { // Función de Passport
        return next();
    }
    res.status(401).json({ message: 'No autenticado (sesión)' });
};
// Ruta inicial: Redirige al usuario a Google
// scope: pide información básica del perfil y email
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false // No usar sesión de passport
}));

// Ruta de Callback: Google redirige aquí
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL}/?login_error=google_failed`,
        session: false // No usar sesión
    }),
    // Si authenticate tiene éxito, req.user está disponible
    (req, res) => {
        if (!req.user) {
             // ... devolver script de error al popup ...
             const errorScript = `<script> /* ... window.opener.postMessage({ type: 'auth-error', ...}) ... */ </script>`;
             return res.status(500).send(errorScript);
        }
        console.log('Usuario autenticado por Google (sin sesión):', req.user.email);

        // Generar JWT y datos para frontend
        const token = generateToken(req.user._id);
        const userDataForFrontend = {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            profilePictureUrl: req.user.profilePictureUrl,
            isProfileComplete: req.user.isProfileComplete,
        };

        // Devolver Script HTML al popup
        const responseScript = `
            <script>
                try {
                    const payload = ${JSON.stringify({ user: userDataForFrontend, token })};
                    window.opener.postMessage({ type: 'auth-success', payload: payload }, '${process.env.FRONTEND_URL}');
                } catch (e) { /* ... */ }
                finally { window.close(); }
            </script>
        `;
        res.status(200).send(responseScript);
    }
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtiene el perfil del usuario actualmente autenticado.
 *     tags: [Autenticación]
 *     description: Requiere un token JWT válido en la cabecera Authorization (Bearer Token).
 *     security:
 *       - bearerAuth: [] # Indica que este endpoint requiere el token
 *     responses:
 *       200:
 *         description: Perfil del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User' # Usar el schema base de User
 *       401:
 *         description: No autorizado (token inválido, expirado o no proporcionado).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *          description: Usuario no encontrado (el token es válido pero el usuario fue eliminado).
 *          content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/me', protect, getMe); // Usar middleware de sesión

// router.get('/me',
//     // protect, // Comenta 'protect' si te basarás SÓLO en la sesión de Passport
//     (req, res, next) => { // Middleware para verificar sesión de Passport si no usas JWT
//         if (req.isAuthenticated()) { // Función de Passport añadida a req
//             req.user = req.user; // Asegura que req.user esté disponible para getMe
//             return next();
//         }
//         // Si no está autenticado por sesión, Y NO usas JWT, devuelve error
//         // return res.status(401).json({ message: 'No autenticado (sesión)' });

//         // Si SÍ usas JWT como alternativa, deja que 'protect' (descomentado arriba) lo maneje
//         protect(req, res, next); // Llama a protect si la sesión no existe

//     }, getMe); // Reutiliza el controlador existente
// --- Ruta de Logout ---
router.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logout iniciado (cliente debe borrar token)' });

    // req.logout(function(err) { // Método de Passport para limpiar sesión
    //     if (err) { return next(err); }
    //     req.session.destroy((err) => { // Destruir sesión de express-session
    //          if (err) {
    //              console.error("Error destruyendo sesión:", err);
    //              return next(new AppError('Error al cerrar sesión', 500));
    //          }
    //          res.clearCookie('connect.sid'); // Limpiar cookie de sesión (nombre por defecto)
    //          res.status(200).json({ message: 'Sesión cerrada exitosamente' });
    //     });
    // });
});
// --- NUEVA RUTA PARA VERIFICAR CÓDIGO DESDE FRONTEND ---
router.post('/google/verify-code', verifyGoogleCode);
module.exports = router;