// src/controllers/commentController.js
const Comment = require('../models/Comment');
const NewsArticle = require('../models/NewsArticle'); // Para verificar que la noticia existe
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError.js');

// @desc    Obtener comentarios de una noticia específica
// @route   GET /api/comments/news/:newsId
// @access  Public
const getCommentsByArticle = asyncHandler(async (req, res, next) => {
  const newsId = req.params.newsId;

  // Opcional: verificar si la noticia existe
  const newsExists = await NewsArticle.findById(newsId).select('_id');
  if (!newsExists) {
      return next(new AppError('Noticia no encontrada', 404));
  }

  const comments = await Comment.find({ article: newsId })
                                .populate('author', 'name username') // Mostrar nombre y username del autor
                                .sort('-createdAt'); // Más recientes primero

  res.status(200).json({
    status: 'success',
    results: comments.length,
    data: {
      comments,
    },
  });
});

// @desc    Crear un nuevo comentario
// @route   POST /api/comments/news/:newsId
// @access  Private (Usuario logueado)
const createComment = asyncHandler(async (req, res, next) => {
  const { text } = req.body;
  const articleId = req.params.newsId;
  const authorId = req.user._id; // Del middleware protect

  // 1. Validar entrada (con express-validator en la ruta)

  // 2. Verificar que la noticia exista (importante)
  const newsArticle = await NewsArticle.findById(articleId).select('_id');
  if (!newsArticle) {
    return next(new AppError('No se puede comentar en una noticia que no existe', 404));
  }

  // 3. Crear comentario
  const newComment = await Comment.create({
    text,
    article: articleId,
    author: authorId,
  });

  // Poblar autor para devolverlo en la respuesta
  const populatedComment = await Comment.findById(newComment._id).populate('author', 'name username');

  res.status(201).json({
    status: 'success',
    data: {
      comment: populatedComment,
    },
  });
});

// @desc    Eliminar un comentario
// @route   DELETE /api/comments/:commentId
// @access  Private (Autor del comentario o Admin)
const deleteComment = asyncHandler(async (req, res, next) => {
  const commentId = req.params.commentId;
  const userId = req.user._id;
  const userRole = req.user.role;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(new AppError('Comentario no encontrado', 404));
  }

  // Verificar permisos: O es el autor O es admin
  if (comment.author.toString() !== userId.toString() && userRole !== 'ADMIN') {
      return next(new AppError('No tienes permiso para eliminar este comentario', 403)); // 403 Forbidden
  }

  await comment.deleteOne();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});


module.exports = {
  getCommentsByArticle,
  createComment,
  deleteComment,
};