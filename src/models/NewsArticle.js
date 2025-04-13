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
    required: [true, 'El contenido es requerido'],
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
  locationScope: { // Ubicación a la que aplica/se refiere la noticia
    department: { type: String, index: true },
    province: { type: String, index: true },
    municipality: { type: String, index: true },
    zone: String, // Indexar si es necesario buscar por zona
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Índice compuesto si se busca frecuentemente por fecha y departamento
newsArticleSchema.index({ publicationDate: -1, 'locationScope.department': 1 });

const NewsArticle = mongoose.model('NewsArticle', newsArticleSchema);

module.exports = NewsArticle;
