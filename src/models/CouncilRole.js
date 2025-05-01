// src/models/CouncilRole.js
const mongoose = require('mongoose');

const councilRoleSchema = new mongoose.Schema({
  code: { // ID numérico o código corto único
    type: Number, // O String si prefieres códigos como 'PRES', 'VICE'
    required: true,
    unique: true,
    index: true,
  },
  name: { // Nombre descriptivo completo
    type: String,
    required: true,
    trim: true,
    unique: true, // El nombre también debería ser único
  },
  // Opcional: descripción, orden de aparición, etc.
  order: { type: Number, default: 0 } // Para ordenar en el frontend
}, { timestamps: false }); // Timestamps quizás no son necesarios aquí

const CouncilRole = mongoose.model('CouncilRole', councilRoleSchema);
module.exports = CouncilRole;