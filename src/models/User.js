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
    enum: ['USER', 'ADMIN'],
    default: 'USER',
  },
  location: {
    department: { type: String, required: [true, 'El departamento es requerido'] },
    province: String,
    municipality: String,
    zone: String,
    // Opcional: coordinates: { lat: Number, lng: Number }
  },
  isActive: {
    type: Boolean,
    default: true,
  },
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
