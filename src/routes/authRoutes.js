// src/routes/authRoutes.js
const express = require('express');
const { body } = require('express-validator');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

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
const registerValidation = [ /* ... tus reglas de validación ... */ ];
router.post('/register', registerValidation, handleValidationErrors, registerUser);


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
router.post('/login', loginValidation, handleValidationErrors, loginUser);

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
router.get('/me', protect, getMe);

module.exports = router;