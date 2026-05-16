const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {type: String, required: [true, 'El nombre es requerido'],},
  email: {type: String,required: [true, 'El correo electrónico es requerido'],unique: true,trim: true,lowercase: true,index: true,match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un correo válido'],},
  role: {type: String,enum: ['USER', 'STAFF', 'ADMIN'],default: 'USER',},
  facebookId: {type: String,unique: true, sparse: true, index: true,},
  googleId: {type: String,unique: true,sparse: true, index: true,},
  isProfileComplete: { type: Boolean, default: false }, // Para perfil básico post-social login  
  memberRegistrationCode: {type: String,unique: true,sparse: true,index: true,required: false,},
  profilePictureUrl: { // Almacenaremos la URL de la imagen
    type: String,
    required: false,
    // Podrías añadir validación de URL aquí si quieres
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true, // Añade createdAt y updatedAt automáticamente
});



const User = mongoose.model('User', userSchema);

module.exports = User;
