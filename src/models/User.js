const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
  },
  username: {
    type: String,
    required: [true, 'El nombre de usuario es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  email: {
    type: String,
    required: [true, 'El correo electrónico es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
    // Validación simple de formato email
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un correo válido'],
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false, // No incluir la contraseña por defecto en las consultas
  },
  role: {
    type: String,
    // --- MODIFICACIÓN: Añadir STAFF ---
    enum: ['USER', 'STAFF', 'ADMIN'],
    // --- FIN MODIFICACIÓN ---
    default: 'USER',
  },
  location: { // <--- MODIFICADO
    departmentCode: { // Renombrado y cambiado a Number
        type: Number,
        required: [true, 'El código de departamento es requerido'],
        index: true // Indexar si buscas usuarios por depto
    },
    provinceCode: { // Renombrado y cambiado a Number
        type: Number,
        required: false, // Hacer opcional si no siempre se captura/requiere
        index: true
    },
    municipalityCode: { // Renombrado y cambiado a Number
        type: Number,
        required: false,
        index: true
     },
    zone: { // Zona sigue siendo String
        type: String,
        trim: true,
        required: false
    },
    // coordinates: { lat: Number, lng: Number } // Mantenidas si las necesitas
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  birthDate: {
    type: Date, // Almacenar como objeto Date completo
    required: false // O true si es obligatorio
  },
  gender: { // true: Varón, false: Mujer, null/undefined: No especificado
    type: Boolean,
    required: false // Hacerlo opcional
  },
  profilePictureUrl: { // Almacenaremos la URL de la imagen
    type: String,
    required: false,
    // Podrías añadir validación de URL aquí si quieres
  },
  idCard: { // Carnet de Identidad
    type: String,
    trim: true,
    required: false, // O true si es obligatorio
    index: true, // Indexar si necesitas buscar por CI (considera unicidad si aplica)
    // unique: true, // Añade si el CI DEBE ser único
  },
  phoneNumber: {
    type: String, // Guardar como String para flexibilidad de formato (+591, etc.)
    trim: true,
    required: false,
    // Puedes añadir validación de formato de teléfono si es necesario
    // match: [/^\+?[0-9\s\-()]+$/, 'Número de teléfono inválido'],
  }
}, {
  timestamps: true, // Añade createdAt y updatedAt automáticamente
});

// Middleware Pre-save para hashear la contraseña antes de guardar
userSchema.pre('save', async function (next) {
  // Solo hashear la contraseña si ha sido modificada (o es nueva)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseña ingresada con la hasheada
userSchema.methods.matchPassword = async function (enteredPassword) {
  // 'this.password' no estará disponible si 'select: false' está activo,
  // necesitamos pedirlo explícitamente en la consulta de login.
  return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model('User', userSchema);

module.exports = User;
