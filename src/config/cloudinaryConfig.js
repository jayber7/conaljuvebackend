// src/config/cloudinaryConfig.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

// Configurar Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Usar HTTPS
});

// Configurar el almacenamiento de Multer para Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Función para determinar parámetros de subida dinámicamente

    // 1. Carpeta en Cloudinary (ej. basada en el tipo de subida o usuario)
    let folder = 'conaljuve/profile_pictures'; // Carpeta base para fotos de perfil

    // 2. Nombre de archivo (opcional, Cloudinary genera uno único por defecto)
    // Puedes generar un nombre único basado en el userId (si estuviera disponible aquí) o timestamp
    // let filename = `user-${req.user?._id}-${Date.now()}`;

    // 3. Formatos permitidos (Cloudinary puede transformar, pero es bueno validar)
    let allowedFormats = ['jpg', 'png', 'jpeg', 'gif', 'webp'];

    // 4. Transformaciones opcionales al subir (ej. redimensionar)
    let transformation = [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }]; // Redimensionar a 500px max, calidad auto

    return {
      folder: folder,
    //   public_id: filename, // Descomentar si quieres nombres personalizados
      allowed_formats: allowedFormats,
      transformation: transformation,
      // Puedes añadir más parámetros de la API de subida de Cloudinary aquí
      // https://cloudinary.com/documentation/image_upload_api_reference#upload_optional_parameters
    };
  },
});

// Crear el middleware de Multer usando el storage de Cloudinary
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // Límite de tamaño de archivo (ej: 5MB)
    },
    fileFilter: (req, file, cb) => {
        // Validar tipo de archivo (MIME type)
        if (file.mimetype.startsWith('image/')) {
            cb(null, true); // Aceptar archivo
        } else {
            cb(new Error('Formato de archivo no soportado. Solo se permiten imágenes.'), false); // Rechazar archivo
        }
    }
});

module.exports = { upload, cloudinary }; // Exportar upload y la instancia configurada de cloudinary