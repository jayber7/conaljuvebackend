const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config(); // Asegúrate que las variables de .env estén cargadas

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Opciones de Mongoose 6+ ya no son necesarias en su mayoría
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // useCreateIndex: true, // No soportada
      // useFindAndModify: false, // No soportada
    });

    console.log(`🔌 MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error de conexión MongoDB: ${error.message}`);
    process.exit(1); // Salir del proceso con fallo
  }
};

module.exports = connectDB;
