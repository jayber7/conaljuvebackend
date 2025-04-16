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
}, { timestamps: true });

const Department = mongoose.model('Department', departmentSchema);
module.exports = Department;