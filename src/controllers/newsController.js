// src/controllers/newsController.js
const NewsArticle = require('../models/NewsArticle');
const Comment = require('../models/Comment');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const Department = require('../models/Department');
const Province = require('../models/Province');
const Municipality = require('../models/Municipality');

// Helper para convertir valores de query a número si es posible
const parseQueryNumber = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num; // Devuelve undefined si no es un número válido
};


// @desc    Obtener todas las noticias con filtros, paginación y ordenamiento
// @route   GET /api/news
// @access  Public
const getNews = asyncHandler(async (req, res, next) => {
  // --- MODIFICACIÓN: Adaptar el objeto query antes de pasarlo a APIFeatures ---
  const modifiedQuery = { ...req.query };

  // Convertir filtros de ubicación a números si existen
  if (modifiedQuery['locationScope.departmentCode']) {
      modifiedQuery['locationScope.departmentCode'] = parseQueryNumber(modifiedQuery['locationScope.departmentCode']);
      if (modifiedQuery['locationScope.departmentCode'] === undefined) {
          // Si no es un número válido, eliminar el filtro para no causar error en Mongo
           delete modifiedQuery['locationScope.departmentCode'];
           console.warn('departmentCode inválido en query, filtro ignorado.');
      }
  }
   if (modifiedQuery['locationScope.provinceCode']) {
      modifiedQuery['locationScope.provinceCode'] = parseQueryNumber(modifiedQuery['locationScope.provinceCode']);
       if (modifiedQuery['locationScope.provinceCode'] === undefined) {
           delete modifiedQuery['locationScope.provinceCode'];
            console.warn('provinceCode inválido en query, filtro ignorado.');
       }
  }
   if (modifiedQuery['locationScope.municipalityCode']) {
      modifiedQuery['locationScope.municipalityCode'] = parseQueryNumber(modifiedQuery['locationScope.municipalityCode']);
       if (modifiedQuery['locationScope.municipalityCode'] === undefined) {
           delete modifiedQuery['locationScope.municipalityCode'];
           console.warn('municipalityCode inválido en query, filtro ignorado.');
       }
  }
  // --- FIN MODIFICACIÓN ---


  // Usar APIFeatures con el query modificado
  const features = new APIFeatures(NewsArticle.find({ isPublished: true }), modifiedQuery)
    .filter() // filter() ahora buscará por los campos correctos (ej. "locationScope.departmentCode")
    .sort()
    .limitFields()
    .paginate();

  // Populate para obtener nombres de ubicación (si guardaste referencias - opcional)
  // Si solo guardas códigos, no necesitas poblar aquí, pero sí en getNewsById
  // const newsArticles = await features.query.populate('author', 'name username').populate('locationScope.departmentRef')...;
   const newsArticles = await features.query.populate('author', 'name username').lean(); // Usar lean para eficiencia


  // Conteo total (usando el query modificado también)
  const totalFeatures = new APIFeatures(NewsArticle.find({ isPublished: true }), modifiedQuery).filter();
  const totalCount = await NewsArticle.countDocuments(totalFeatures.query.getQuery());


  res.status(200).json({
    status: 'success',
    results: newsArticles.length,
    totalCount: totalCount,
    data: {
      news: newsArticles,
    },
  });
});

// @desc    Obtener una noticia por ID
// @route   GET /api/news/:id
// @access  Public
const getNewsById = asyncHandler(async (req, res, next) => {
  // --- MODIFICACIÓN: Poblar referencias si se usan, o hacer búsquedas separadas ---
  // Opción A: Si NO usas ref en el schema (solo guardas códigos)
  //  const newsArticle = await NewsArticle.findById(req.params.id)
  //                                        .where({ isPublished: true })
  //                                        .populate('author', 'name username') // Poblar autor
  //                                        .lean(); // Usar lean

  //  if (!newsArticle) {
  //   return next(new AppError('Noticia no encontrada', 404));
  //  }

  //  // Opcional: Buscar nombres de ubicación basados en los códigos guardados
  //  // Esto requiere importar los modelos Department, Province, Municipality
  //  // const Department = require('../models/Department');
  //  // const Province = require('../models/Province');
  //  // const Municipality = require('../models/Municipality');

  //  let populatedLocation = { ...newsArticle.locationScope }; // Copia inicial

  //  if (newsArticle.locationScope?.departmentCode) {
  //      const dept = await Department.findOne({ code: newsArticle.locationScope.departmentCode }).select('name').lean();
  //      populatedLocation.departmentName = dept?.name || null;
  //  }
  //  if (newsArticle.locationScope?.provinceCode) {
  //      const prov = await Province.findOne({ code: newsArticle.locationScope.provinceCode }).select('name').lean();
  //      populatedLocation.provinceName = prov?.name || null;
  //  }
  //   if (newsArticle.locationScope?.municipalityCode) {
  //      const muni = await Municipality.findOne({ code: newsArticle.locationScope.municipalityCode }).select('name').lean();
  //      populatedLocation.municipalityName = muni?.name || null;
  //  }
  //  // --- FIN MODIFICACIÓN (Opción A) ---


   // Opción B: Si SÍ usaste ref en el schema (ej. departmentCode: { type: Number, ref: 'Department', ... })
   const newsArticle = await NewsArticle.findById(req.params.id)
                                        .where({ isPublished: true })
                                        .populate('author', 'name username')
                                        .lean();
   if (!newsArticle) {
     return next(new AppError('Noticia no encontrada', 404));
   }
   // --- LÓGICA COMPLETA PARA POBLAR NOMBRES DE UBICACIÓN ---
   let populatedLocationScope = { ...newsArticle.locationScope }; // Copia inicial

   // Usamos Promise.all para hacer las búsquedas en paralelo (más eficiente)
   const [dept, prov, muni] = await Promise.all([
       newsArticle.locationScope?.departmentCode
           ? Department.findOne({ code: newsArticle.locationScope.departmentCode }).select('name').lean()
           : Promise.resolve(null), // Si no hay código, resuelve a null
       newsArticle.locationScope?.provinceCode
           ? Province.findOne({ code: newsArticle.locationScope.provinceCode }).select('name').lean()
           : Promise.resolve(null),
       newsArticle.locationScope?.municipalityCode
           ? Municipality.findOne({ code: newsArticle.locationScope.municipalityCode }).select('name').lean()
           : Promise.resolve(null)
   ]);

   populatedLocationScope.departmentName = dept?.name || null;
   populatedLocationScope.provinceName = prov?.name || null;
   populatedLocationScope.municipalityName = muni?.name || null;
   // --- FIN LÓGICA COMPLETA ---

  res.status(200).json({
    status: 'success',
    data: {
      // Devolver el artículo con la ubicación poblada (si se hizo) o con los códigos
      news: { ...newsArticle, locationScope: populatedLocationScope  },
    },
  });
});

// @desc    Crear una nueva noticia
// @route   POST /api/news
// @access  Private/Admin
const createNews = asyncHandler(async (req, res, next) => {
  // --- MODIFICACIÓN: Asegurar que los códigos de ubicación sean números ---
  const { title, summary, content, imageUrl, publicationDate, tags, locationScope, isPublished } = req.body;

  // Convertir códigos de ubicación a números (si vienen como string del form)
  const formattedLocationScope = locationScope ? {
      departmentCode: parseQueryNumber(locationScope.departmentCode), // Usar helper
      provinceCode: parseQueryNumber(locationScope.provinceCode),
      municipalityCode: parseQueryNumber(locationScope.municipalityCode),
      zone: locationScope.zone?.trim() || undefined // Limpiar zona
  } : {};

  // Eliminar claves con valor undefined para no guardarlas en la DB
  Object.keys(formattedLocationScope).forEach(key => formattedLocationScope[key] === undefined && delete formattedLocationScope[key]);
 // --- FIN MODIFICACIÓN ---


  const newArticle = await NewsArticle.create({
    title,
    summary,
    content,
    imageUrl,
    publicationDate: publicationDate || Date.now(),
    tags,
    locationScope: formattedLocationScope, // Usar el objeto formateado
    author: req.user._id,
    isPublished: isPublished !== undefined ? isPublished : true,
  });

  // Opcional: Poblar autor para la respuesta
  const populatedArticle = await NewsArticle.findById(newArticle._id)
                                             .populate('author', 'name username')
                                             .lean();


  res.status(201).json({
    status: 'success',
    data: {
      news: populatedArticle || newArticle, // Devolver poblado si se pudo
    },
  });
});

// @desc    Actualizar una noticia
// @route   PUT /api/news/:id
// @access  Private/Admin
// --- updateNews ---
const updateNews = asyncHandler(async (req, res, next) => {
  const allowedUpdates = { ...req.body };
  delete allowedUpdates.author;

   if (allowedUpdates.locationScope) {
       allowedUpdates.locationScope = {
           departmentCode: parseQueryNumber(allowedUpdates.locationScope.departmentCode),
           provinceCode: parseQueryNumber(allowedUpdates.locationScope.provinceCode),
           municipalityCode: parseQueryNumber(allowedUpdates.locationScope.municipalityCode),
           zone: allowedUpdates.locationScope.zone?.trim() || undefined
       };
        Object.keys(allowedUpdates.locationScope).forEach(key => allowedUpdates.locationScope[key] === undefined && delete allowedUpdates.locationScope[key]);
   }

  // Primero actualiza y obtén el documento actualizado
  const updatedNewsArticle = await NewsArticle.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { new: true, runValidators: true }
  ).populate('author', 'name username').lean(); // Aún necesitas poblar autor aquí

  if (!updatedNewsArticle) {
    return next(new AppError('Noticia no encontrada para actualizar', 404));
  }

  // --- LÓGICA COMPLETA PARA POBLAR NOMBRES DE UBICACIÓN (igual que en getNewsById) ---
  let populatedLocationScope = { ...updatedNewsArticle.locationScope };

  const [dept, prov, muni] = await Promise.all([
      updatedNewsArticle.locationScope?.departmentCode
          ? Department.findOne({ code: updatedNewsArticle.locationScope.departmentCode }).select('name').lean()
          : Promise.resolve(null),
      updatedNewsArticle.locationScope?.provinceCode
          ? Province.findOne({ code: updatedNewsArticle.locationScope.provinceCode }).select('name').lean()
          : Promise.resolve(null),
      updatedNewsArticle.locationScope?.municipalityCode
          ? Municipality.findOne({ code: updatedNewsArticle.locationScope.municipalityCode }).select('name').lean()
          : Promise.resolve(null)
  ]);

  populatedLocationScope.departmentName = dept?.name || null;
  populatedLocationScope.provinceName = prov?.name || null;
  populatedLocationScope.municipalityName = muni?.name || null;
  // --- FIN LÓGICA COMPLETA ---

  res.status(200).json({
    status: 'success',
    data: {
       // Enviar el artículo actualizado con los nombres de ubicación poblados
       news: { ...updatedNewsArticle, locationScope: populatedLocationScope },
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

  // Borrar comentarios asociados (si se decide hacerlo)
   // await Comment.deleteMany({ article: newsArticle._id });

  await newsArticle.deleteOne();

  res.status(204).json({
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