// src/routes/newsRoutes.js
const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
} = require('../controllers/newsController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware'); // Middleware de rol Admin
const { staffOrAdmin } = require('../middleware/staffOrAdminMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');
const router = express.Router();
// Reglas de validación para crear/actualizar noticia
const newsValidation = [
    body('title', 'El título es requerido').not().isEmpty().trim().escape(),
    body('summary', 'El resumen es requerido').not().isEmpty().trim().escape(),
    body('content', 'El contenido es requerido').not().isEmpty(), // No escapar HTML si usas editor enriquecido
    body('imageUrl', 'URL de imagen inválida').optional({ checkFalsy: true }).isURL(),
    body('publicationDate', 'Fecha de publicación inválida').optional().isISO8601().toDate(),
    body('tags').optional().isArray().withMessage('Las etiquetas deben ser un array'),
    body('tags.*').optional().isString().trim().escape(), // Validar cada tag
    body('locationScope.department').optional().isString().trim().escape(),
    body('locationScope.province').optional().isString().trim().escape(),
    body('locationScope.municipality').optional().isString().trim().escape(),
    body('locationScope.zone').optional().isString().trim().escape(),
    body('isPublished').optional().isBoolean().withMessage('isPublished debe ser un booleano'),
];

// Validación del ID en parámetros
const idParamValidation = [
    param('id', 'ID inválido').isMongoId()
];
// --- MODIFICACIÓN: Validación para Query Params de Ubicación ---
const locationQueryValidation = [
    query('locationScope.departmentCode', 'Filtro de departamento inválido').optional().isInt({ min: 0 }),
    query('locationScope.provinceCode', 'Filtro de provincia inválido').optional().isInt({ min: 0 }),
    query('locationScope.municipalityCode', 'Filtro de municipio inválido').optional().isInt({ min: 0 }),
    // Puedes añadir validación para otros query params como page, limit, sort
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(), // Limitar el máx limit
    query('sort').optional().isString().trim().escape(),
];
// --- FIN MODIFICACIÓN ---

/**
 * @swagger
 * tags:
 *   name: Noticias
 *   description: Endpoints para la gestión de artículos de noticias.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     NewsArticleInput:
 *       type: object
 *       properties:
 *         title: { type: string, example: 'Título de la Noticia' }
 *         summary: { type: string, example: 'Resumen corto...' }
 *         content: { type: string, example: 'Contenido completo...' }
 *         imageUrl: { type: string, format: 'url', example: 'http://...' }
 *         publicationDate: { type: string, format: 'date' } # O date-time
 *         tags: { type: array, items: { type: string }, example: ['tag1', 'tag2'] }
 *         locationScope: { type: object, properties: { department: string, province: string, municipality: string, zone: string } }
 *         isPublished: { type: boolean, default: true }
 *       required:
 *         - title
 *         - summary
 *         - content
 */

/**
 * @swagger
 * /news:
 *   get:
 *     summary: Obtiene una lista paginada y filtrable de noticias publicadas.
 *     tags: [Noticias]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Número de página.
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Cantidad de resultados por página.
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *         description: Campo por el cual ordenar (ej. 'publicationDate', '-createdAt').
 *       - in: query
 *         name: locationScope[department]
 *         schema: { type: string }
 *         description: Filtrar por departamento.
 *       - in: query
 *         name: tags
 *         schema: { type: string }
 *         description: Filtrar por etiqueta (proporcionar una etiqueta).
 *       # Añadir más parámetros de filtro según APIFeatures
 *     responses:
 *       200:
 *         description: Lista de noticias.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: 'success' }
 *                 results: { type: integer, example: 5 }
 *                 totalCount: { type: integer, example: 50 }
 *                 data:
 *                   type: object
 *                   properties:
 *                     news:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/NewsArticle' # Referencia al schema de noticia
 *       500:
 *          description: Error interno del servidor.
 */
// Rutas públicas
router.get('/', locationQueryValidation, handleValidationErrors, getNews); // Añadir validación de query
//router.get('/', getNews);

/**
 * @swagger
 * /news/{id}:
 *   get:
 *     summary: Obtiene los detalles de una noticia específica por su ID.
 *     tags: [Noticias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID de la noticia (MongoDB ObjectId).
 *     responses:
 *       200:
 *         description: Detalles de la noticia.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: 'success' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     news:
 *                       $ref: '#/components/schemas/NewsArticle'
 *       404:
 *         description: Noticia no encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *          description: ID inválido.
 *          content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor.
 */
//router.get('/:id', /* validaciones */ getNewsById);
router.get('/:id', idParamValidation, handleValidationErrors, getNewsById);
/**
 * @swagger
 * /news:
 *   post:
 *     summary: Crea una nueva noticia (Requiere rol Admin).
 *     tags: [Noticias]
 *     security:
 *       - bearerAuth: [] # Requiere token de admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewsArticleInput'
 *     responses:
 *       201:
 *         description: Noticia creada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                 status: { type: string, example: 'success' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     news:
 *                       $ref: '#/components/schemas/NewsArticle'
 *       400: { $ref: '#/components/responses/BadRequest' } # Puedes definir respuestas reutilizables
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
// Define respuestas reutilizables en swaggerConfig.js -> components -> responses
// router.post('/', protect, admin, /* validaciones */ createNews);
// router.put('/:id', protect, admin, idParamValidation, newsValidation, handleValidationErrors, updateNews);
// router.delete('/:id', protect, admin, idParamValidation, handleValidationErrors, deleteNews);
// Rutas protegidas para Admin
router.post('/', protect, staffOrAdmin, newsValidation, handleValidationErrors, createNews);
router.put('/:id', protect, staffOrAdmin, idParamValidation, newsValidation, handleValidationErrors, updateNews);
router.delete('/:id', protect, admin, idParamValidation, handleValidationErrors, deleteNews);
// --- Rutas Protegidas por Rol ---
// STAFF o ADMIN pueden Crear y Actualizar
router.post('/', protect, staffOrAdmin, newsValidation, handleValidationErrors, createNews);
router.put('/:id', protect, staffOrAdmin, idParamValidation, newsValidation, handleValidationErrors, updateNews);
// Solo ADMIN puede Eliminar
router.delete('/:id', protect, admin, idParamValidation, handleValidationErrors, deleteNews);
// --- FIN Rutas Protegidas ---
module.exports = router;