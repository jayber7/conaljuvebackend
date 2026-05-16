// src/models/NewsArticle.js
const mongoose = require('mongoose');

const newsArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
  },
  summary: {
    type: String,
    required: [true, 'El resumen es requerido'],
  },
  content: {
    type: String,
    // required: [true, 'El contenido es requerido'],
  },
  imageUrl: {
    type: String,
    // Puedes añadir validación de URL si quieres
  },
  publicationDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  author: { // Quién creó la noticia (Admin)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tags: {
    type: [String],
    index: true,
  },
  locationScope: { // <--- MODIFICADO
    // Almacenar los CÓDIGOS numéricos
    departmentCode: { // Renombrado para claridad
        type: Number,
        index: true, // Indexar para filtrar por departamento
        required: false // Hacer opcional, una noticia puede ser nacional
    },
    provinceCode: { // Renombrado para claridad
        type: Number,
        index: true, // Indexar para filtrar por provincia
        required: false
    },
    municipalityCode: { // Renombrado para claridad
        type: Number,
        index: true, // Indexar para filtrar por municipio
        required: false
     },
    zone: { // La zona sigue siendo un String, ya que no tiene código/modelo propio
        type: String,
        trim: true,
        required: false
    }
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true,
  },
  pdfUrl: {
    type: String, // URL del PDF almacenado en Cloudinary u otro servicio
    required: false,
  },
}, {
  timestamps: true,
});

// Actualizar índice compuesto si lo usas
newsArticleSchema.index({ publicationDate: -1, 'locationScope.departmentCode': 1 });
// Puedes añadir más índices compuestos si filtras frecuentemente por provincia o municipio
// newsArticleSchema.index({ 'locationScope.provinceCode': 1, publicationDate: -1 });
// newsArticleSchema.index({ 'locationScope.municipalityCode': 1, publicationDate: -1 });
newsArticleSchema.pre('validate', function(next) {
  if (!this.content && !this.pdfUrl) {
    next(new Error('Se requiere proporcionar contenido escrito o subir un archivo PDF.'));
  } else {
    next();
  }
});

const NewsArticle = mongoose.model('NewsArticle', newsArticleSchema);

module.exports = NewsArticle;