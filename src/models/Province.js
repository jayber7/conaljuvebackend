// src/models/Province.js
const mongoose = require('mongoose');

const provinceSchema = new mongoose.Schema({
  code: { // Usaremos CodProv
    type: Number,
    required: true,
    unique: true, // El CodProv es único a nivel nacional
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  departmentCode: { // Referencia a Department.code
    type: Number,
    required: true,
    index: true,
  },
}, { timestamps: true });

const Province = mongoose.model('Province', provinceSchema);
module.exports = Province;