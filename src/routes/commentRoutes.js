// src/routes/commentRoutes.js
const express = require('express');
const { body, param } = require('express-validator');
const {
  getCommentsByArticle,
  createComment,
  deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware'); // Todos requieren al menos estar logueado para crear/borrar
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validación de ID de Noticia
const newsIdParamValidation = [
    param('newsId', 'ID de noticia inválido').isMongoId()
];

// Validación de ID de Comentario
const commentIdParamValidation = [
     param('commentId', 'ID de comentario inválido').isMongoId()
];

// Validación del cuerpo del comentario
const commentBodyValidation = [
    body('text', 'El texto del comentario es requerido').not().isEmpty().trim().escape(),
];

// Rutas
router.get('/news/:newsId', newsIdParamValidation, handleValidationErrors, getCommentsByArticle);
router.post('/news/:newsId', protect, newsIdParamValidation, commentBodyValidation, handleValidationErrors, createComment);
router.delete('/:commentId', protect, commentIdParamValidation, handleValidationErrors, deleteComment);

module.exports = router;