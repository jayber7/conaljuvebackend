// src/models/Municipality.js
const mongoose = require('mongoose');

const municipalitySchema = new mongoose.Schema({
  code: { // Usaremos CodMuni
    type: Number,
    required: true,
    unique: true, // CodMuni es único a nivel nacional
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  provinceCode: { // Referencia a Province.code
    type: Number,
    required: true,
    index: true,
  },
  departmentCode: { // Referencia a Department.code
    type: Number,
    required: true,
    index: true,
  },
}, { timestamps: true });

const Municipality = mongoose.model('Municipality', municipalitySchema);
module.exports = Municipality;