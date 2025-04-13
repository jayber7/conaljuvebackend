// src/controllers/newsController.js
const NewsArticle = require('../models/NewsArticle');
const Comment = require('../models/Comment'); // Para borrar comentarios asociados
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError.js');
const APIFeatures = require('../utils/apiFeatures'); // Para filtros/paginación

// @desc    Obtener todas las noticias con filtros, paginación y ordenamiento
// @route   GET /api/news
// @access  Public
const getNews = asyncHandler(async (req, res, next) => {
  // Usar APIFeatures para manejar query params
  const features = new APIFeatures(NewsArticle.find({ isPublished: true }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const newsArticles = await features.query.populate('author', 'name username'); // Poblar autor

  // Opcional: Obtener conteo total para paginación en el frontend
  const totalFeatures = new APIFeatures(NewsArticle.find({ isPublished: true }), req.query).filter();
  const totalCount = await NewsArticle.countDocuments(totalFeatures.query.getQuery());


  res.status(200).json({
    status: 'success',
    results: newsArticles.length,
    totalCount: totalCount, // Enviar conteo total
    data: {
      news: newsArticles,
    },
  });
});

// @desc    Obtener una noticia por ID
// @route   GET /api/news/:id
// @access  Public
const getNewsById = asyncHandler(async (req, res, next) => {
  const newsArticle = await NewsArticle.findById(req.params.id)
                                         .where({ isPublished: true }) // Asegurarse que esté publicada
                                         .populate('author', 'name username'); // Poblar autor

  if (!newsArticle) {
    return next(new AppError('Noticia no encontrada', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      news: newsArticle,
    },
  });
});

// @desc    Crear una nueva noticia
// @route   POST /api/news
// @access  Private/Admin
const createNews = asyncHandler(async (req, res, next) => {
  // Los datos vienen validados por express-validator
  const { title, summary, content, imageUrl, publicationDate, tags, locationScope } = req.body;

  const newArticle = await NewsArticle.create({
    title,
    summary,
    content,
    imageUrl,
    publicationDate: publicationDate || Date.now(), // Default a ahora si no se envía
    tags,
    locationScope,
    author: req.user._id, // ID del admin logueado
    isPublished: req.body.isPublished !== undefined ? req.body.isPublished : true, // Permitir crear como borrador
  });

  res.status(201).json({
    status: 'success',
    data: {
      news: newArticle,
    },
  });
});

// @desc    Actualizar una noticia
// @route   PUT /api/news/:id
// @access  Private/Admin
const updateNews = asyncHandler(async (req, res, next) => {
  // Excluir campos que no deberían actualizarse directamente así (ej. author)
  const allowedUpdates = { ...req.body };
  delete allowedUpdates.author; // El autor no se cambia

  const newsArticle = await NewsArticle.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      {
          new: true, // Devolver el documento modificado
          runValidators: true, // Correr validaciones del schema en la actualización
      }
  ).populate('author', 'name username');

  if (!newsArticle) {
    return next(new AppError('Noticia no encontrada para actualizar', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      news: newsArticle,
    },
  });
});

// @desc    Eliminar una noticia
// @route   DELETE /api/news/:id
// @access  Private/Admin
const deleteNews = asyncHandler(async (req, res, next) => {
  const newsArticle = await NewsArticle.findById(req.params.id);

  if (!newsArticle) {
    return next(new AppError('Noticia no encontrada para eliminar', 404));
  }

  // TODO: Considerar qué hacer con los comentarios asociados.
  // Opción 1: Borrarlos también
  // await Comment.deleteMany({ article: newsArticle._id });
  // Opción 2: Dejarlos (pueden quedar huérfanos si no se manejan bien)

  await newsArticle.deleteOne(); // Usar deleteOne() en el documento encontrado

  res.status(204).json({ // 204 No Content: Éxito sin cuerpo de respuesta
    status: 'success',
    data: null,
  });
});


module.exports = {
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
};