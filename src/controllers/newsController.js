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
  const { title, summary, content, publicationDate, tags, locationScope, isPublished } = req.body;
  const imageFile = req.files?.newsImage?.[0]; // Acceder al primer archivo del campo 'newsImage'
  const pdfFile = req.files?.newsPdf?.[0];   // Acceder al primer archivo del campo 'newsPdf'
   // Obtener URLs de Cloudinary si los archivos se subieron
   const imageUrl = imageFile ? imageFile.path : undefined;
   const pdfUrl = pdfFile ? pdfFile.path : undefined;
 
   // --- VALIDACIÓN: Asegurarse que content o pdfUrl existan ---
   // (El hook pre-validate del modelo también lo hará, pero podemos verificar aquí)
   if (!content && !pdfUrl) {
       return next(new AppError('Se debe proporcionar contenido escrito o subir un archivo PDF.', 400));
   }
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


  const newArticleData = await NewsArticle.create({
    title,
    summary,
    content,
    imageUrl,
    pdfUrl: pdfUrl,
    publicationDate: publicationDate || Date.now(),
    tags,
    locationScope: formattedLocationScope, // Usar el objeto formateado
    author: req.user._id,
    isPublished: isPublished !== undefined ? (String(isPublished).toLowerCase() === 'true') : true, // Convertir string de form-data a boolean
    //isPublished: isPublished !== undefined ? isPublished : true,
  });
   // Limpiar campos undefined
   Object.keys(newArticleData).forEach(key => newArticleData[key] === undefined && delete newArticleData[key]);

  const newArticle = await NewsArticle.create(newArticleData);
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
// @access  Private/StaffOrAdmin
const updateNews = asyncHandler(async (req, res, next) => {
  const { title, summary, content, publicationDate, tags, locationScope, isPublished } = req.body;
  const imageFile = req.files?.newsImage?.[0];
  const pdfFile = req.files?.newsPdf?.[0];

  // Buscar noticia existente
  const newsArticle = await NewsArticle.findById(req.params.id);
  if (!newsArticle) {
      return next(new AppError('Noticia no encontrada para actualizar', 404));
  }

  // Construir objeto de actualización
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (summary !== undefined) updates.summary = summary;
  // Si se envía nuevo 'content', usarlo. Si se envía un PDF *nuevo*, ¿borrar content antiguo? Decisión de diseño.
  // Opción: Borrar content si se sube un PDF nuevo.
  if (pdfFile) {
      updates.pdfUrl = pdfFile.path;
      // Decide si borrar el content:
      // updates.content = undefined; // O usar $unset: updates.$unset = { content: 1 };
  } else if (content !== undefined) {
      // Solo actualizar content si NO se subió un PDF nuevo en esta petición
      updates.content = content;
      // Decide si borrar pdfUrl si se actualiza el content:
      // updates.pdfUrl = undefined; // O $unset: updates.$unset = { pdfUrl: 1 };
  }

   // Actualizar imagen si se subió una nueva
  if (imageFile) {
      updates.imageUrl = imageFile.path;
      // Opcional: Borrar imagen antigua de Cloudinary (requiere lógica adicional)
  }
  if (publicationDate !== undefined) updates.publicationDate = publicationDate;
  if (tags !== undefined) updates.tags = tags; // Asume que tags viene como array o string formateable
  if (isPublished !== undefined) updates.isPublished = String(isPublished).toLowerCase() === 'true';

  // Actualizar locationScope si se envió
  if (locationScope) {
      updates.locationScope = {};
      if (locationScope.departmentCode !== undefined) updates.locationScope.departmentCode = parseQueryNumber(locationScope.departmentCode);
      if (locationScope.provinceCode !== undefined) updates.locationScope.provinceCode = parseQueryNumber(locationScope.provinceCode);
      if (locationScope.municipalityCode !== undefined) updates.locationScope.municipalityCode = parseQueryNumber(locationScope.municipalityCode);
      if (locationScope.zone !== undefined) updates.locationScope.zone = locationScope.zone.trim() || undefined;
      Object.keys(updates.locationScope).forEach(key => updates.locationScope[key] === undefined && delete updates.locationScope[key]);
       if (Object.keys(updates.locationScope).length === 0) delete updates.locationScope; // No guardar objeto vacío
  }

   // --- VALIDACIÓN: Asegurar que content o pdfUrl existan después de la actualización ---
   const finalContent = updates.content !== undefined ? updates.content : newsArticle.content;
   const finalPdfUrl = updates.pdfUrl !== undefined ? updates.pdfUrl : newsArticle.pdfUrl;
   if (!finalContent && !finalPdfUrl) {
        return next(new AppError('La noticia debe tener contenido escrito o un archivo PDF adjunto.', 400));
   }
   // --- FIN VALIDACIÓN ---


  // Realizar la actualización
  const updatedArticle = await NewsArticle.findByIdAndUpdate(
      req.params.id,
      updates, // Solo los campos a actualizar
      // { $set: updates }, // Alternativa explícita
      { new: true, runValidators: true }
  ).populate('author', 'name username').lean();

   // ... (poblar nombres de ubicación para la respuesta como en getNewsById) ...
   let populatedLocationScope = { ...updatedArticle.locationScope };
   // ... (código Promise.all para buscar nombres) ...
   res.status(200).json({ status: 'success', data: { news: { ...updatedArticle, locationScope: populatedLocationScope } } });
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

// @desc    Obtener conteo de noticias publicadas
// @route   GET /api/news/stats/count
// @access  Public
const getNewsCount = asyncHandler(async (req, res, next) => {
  const count = await NewsArticle.countDocuments({ isPublished: true });
  res.status(200).json({ status: 'success', data: { count } });
});

module.exports = {
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  getNewsCount,
};