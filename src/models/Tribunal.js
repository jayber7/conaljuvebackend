// src/models/Tribunal.js
const mongoose = require('mongoose');

const tribunalMemberSchema = new mongoose.Schema({
    role: { type: String, required: true, trim: true }, // Ej: Presidente, Vicepresidente, Vocal
    fullName: { type: String, required: true, trim: true },
    // Opcional: Otros datos del miembro del tribunal si son necesarios
    // contactInfo: { type: String },
}, { _id: false }); // No necesita _id propio si es subdocumento

const tribunalSchema = new mongoose.Schema({
    level: { // Nivel del tribunal
        type: String,
        required: true,
        enum: ['DEPARTAMENTAL', 'MUNICIPAL', 'VECINAL'], // Niveles posibles
        index: true,
    },
    // Identificador geográfico (depende del nivel)
    locationCode: { // Código numérico (Dept, Muni) o un ID/Nombre único para Junta Vecinal
        type: mongoose.Schema.Types.Mixed, // Puede ser Number o String
        required: true,
        index: true,
    },
    locationName: { // Nombre del Dept/Muni/Junta para fácil referencia
        type: String,
        required: true,
    },
    // Directorio (Array de subdocumentos)
    directory: [tribunalMemberSchema],
    // Documentos (URLs a PDFs en Cloudinary u otro storage)
    statuteUrl: { // Reglamento / Estatuto del Tribunal
        type: String,
        required: false,
    },
    regulationsUrl: { // Régimen Disciplinario / Otra normativa
        type: String,
        required: false,
    },
    // Otros campos: Fecha de conformación, período de gestión, etc.
    termStartDate: { type: Date },
    termEndDate: { type: Date },
    isActive: { type: Boolean, default: true },

}, { timestamps: true });

// Índice compuesto para búsqueda rápida
tribunalSchema.index({ level: 1, locationCode: 1 }, { unique: true }); // Asegura un solo tribunal por nivel/ubicación

const Tribunal = mongoose.model('Tribunal', tribunalSchema);
module.exports = Tribunal;