// src/models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    projectName: {
        type: String,
        required: [true, 'El nombre del proyecto es requerido'],
        trim: true,
        index: true, // Indexar para búsquedas
    },
    objective: {
        type: String,
        required: [true, 'El objetivo del proyecto es requerido'],
        trim: true,
    },
    location: { // Similar a Member, ubicación detallada
        departmentCode: { type: Number, required: true, index: true },
        provinceCode: { type: Number, required: true, index: true },
        municipalityCode: { type: Number, required: true, index: true },
        zone: { type: String, required: true, trim: true },
        barrio: { type: String, required: true, trim: true },
        // Opcional: Calle específica si aplica al proyecto
        
    },
    fundingSource: { // Fuente de Financiamiento
        type: String,
        required: [true, 'La fuente de financiamiento es requerida'],
        trim: true,
    },
    beneficiaries: { // Descripción de Beneficiarios
        type: String,
        required: [true, 'La descripción de los beneficiarios es requerida'],
    },
    startDate: {
        type: Date,
        required: [true, 'La fecha de inicio es requerida'],
    },
    endDate: {
        type: Date,
        required: [true, 'La fecha de finalización es requerida'],
        // Validación para asegurar que endDate sea después de startDate
        validate: [
            function(value) {
                // 'this' se refiere al documento
                return !this.startDate || !value || value >= this.startDate;
            },
            'La fecha de finalización debe ser igual o posterior a la fecha de inicio'
        ]
    },
    // Quién registró el proyecto (Admin o Staff)
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Opcional: Estado del proyecto (ej. Planificado, En Ejecución, Completado, Cancelado)
    status: {
        type: String,
        enum: ['PLANIFICADO', 'EN_EJECUCION', 'COMPLETADO', 'CANCELADO', 'SUSPENDIDO'],
        default: 'PLANIFICADO',
        index: true,
    },
    // Opcional: Añadir más campos como presupuesto total, descripción detallada, archivos adjuntos (URLs)

}, { timestamps: true });

// Indexar campos clave para filtros
projectSchema.index({ 'location.departmentCode': 1, status: 1 });
projectSchema.index({ status: 1 });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;