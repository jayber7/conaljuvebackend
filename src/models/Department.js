// src/models/Department.js
const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  code: { // Usaremos codDepto como el código numérico
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // --- NUEVO CAMPO ---
  abbreviation: { // Abreviatura (ej. LP, CB)
    type: String,
    required: true, // Hacerlo requerido si siempre debe existir
    unique: true,   // La abreviatura también debería ser única
    uppercase: true,
    trim: true,
    index: true,
    maxlength: 4, // Limitar longitud si es necesario (ej. 2 o 3 caracteres)
  },
}, { timestamps: true });

const Department = mongoose.model('Department', departmentSchema);
module.exports = Department;