// src/models/Member.js
const mongoose = require('mongoose');
// Podrías usar un paquete para generar códigos únicos más robustos
// const { customAlphabet } = require('nanoid');

const { customAlphabet } = require('nanoid'); // Para códigos únicos
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 10); // Ejemplo: Código de 10 caracteres
const memberSchema = new mongoose.Schema({
  registrationCode: {type: String,required: true,unique: true,index: true,default: () => `CON-${nanoid()}` },
  fullName: { type: String, required: true, trim: true },
  idCard: { type: String, required: true, trim: true, unique: true }, // Hacer CI/Extensión requeridos aquí
  idCardExtension: { type: Number, required: true, index: true, /* enum: [...] */ },
  birthDate: { type: Date, required: false },
  gender: { type: Boolean, required: false },
  phoneNumber: { type: String, required: false, trim: true },
  // Ubicación Detallada (Requerida)
  location: {
    departmentCode: { type: Number, required: true },
    provinceCode: { type: Number, required: true },
    municipalityCode: { type: Number, required: true },
    zone: { type: String, required: true, trim: true }, // Hacer Zona requerida aquí
  },
  neighborhoodCouncilName: { type: String, required: true, trim: true }, // Nombre Junta Vecinal
  memberRoleInCouncil: { type: String, required: true, trim: true }, // Cargo en la Junta
  registrationDate: { type: Date, default: Date.now },
  // Estado de este registro (independiente del login del usuario)
  status: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'], // Pendiente, Verificado, Rechazado
    default: 'PENDING',
    index: true,
  },
   photoUrl: { type: String }, // Foto subida durante este registro específico
  // Vinculación opcional al usuario del portal (si se vincula después)
  linkedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
      unique: true, // Un usuario solo puede estar vinculado a UN registro de miembro
      sparse: true, // Permitir nulls
  }
}, { timestamps: true });

// Índice compuesto para CI+Ext si debe ser único entre miembros registrados
memberSchema.index({ idCard: 1, idCardExtension: 1 }, { unique: true, sparse: true });
memberSchema.index({ linkedUserId: 1 });

const Member = mongoose.model('Member', memberSchema);
module.exports = Member;