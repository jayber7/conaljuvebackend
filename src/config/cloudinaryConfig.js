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
// --- MODIFICACIÓN STORAGE ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder;
    let allowedFormats;
    let transformation;

    // Determinar carpeta y formatos según el campo del formulario
    if (file.fieldname === 'newsPdf') { // Campo específico para PDF de noticias
      folder = 'conaljuve/news_pdfs';
      allowedFormats = ['pdf'];
      transformation = undefined; // No aplicar transformación de imagen a PDFs
      console.log(`Subiendo PDF (${file.originalname}) a carpeta: ${folder}`);
    } else if (file.fieldname === 'newsImage') { // Campo específico para imagen de noticia
      folder = 'conaljuve/news_images';
      allowedFormats = ['jpg', 'png', 'jpeg', 'gif', 'webp'];
      // Transformación opcional para imágenes
      transformation = [{ width: 1200, height: 630, crop: 'limit', quality: 'auto' }];
       console.log(`Subiendo Imagen (${file.originalname}) a carpeta: ${folder}`);
    } else if (file.fieldname === 'profilePicture') { // Para fotos de perfil (existente)
        folder = 'conaljuve/profile_pictures';
        allowedFormats = ['jpg', 'png', 'jpeg', 'gif', 'webp'];
        transformation = [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }];
        console.log(`Subiendo Foto Perfil (${file.originalname}) a carpeta: ${folder}`);
    } else {
      // Carpeta por defecto o error si el campo no es esperado
      folder = 'conaljuve/uploads_misc';
      allowedFormats = ['jpg', 'png', 'pdf']; // Permitir varios por defecto
      transformation = undefined;
       console.log(`Subiendo archivo genérico (${file.originalname}) a carpeta: ${folder}`);
    }

    return { folder, allowed_formats: allowedFormats, transformation };
  },
});
// --- FIN MODIFICACIÓN STORAGE ---

// Crear el middleware de Multer usando el storage de Cloudinary
// --- MODIFICACIÓN UPLOAD (Sigue igual, pero se usará con .fields()) ---
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 10 }, // Aumentar límite para PDFs (ej: 10MB)
  fileFilter: (req, file, cb) => {
      // Permitir tipos MIME de imagen Y PDF
      if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
          cb(null, true);
      } else {
          cb(new Error('Formato no soportado. Solo imágenes o PDF.'), false);
      }
  }
});
// --- FIN MODIFICACIÓN UPLOAD ---

module.exports = { upload, cloudinary }; // Exportar upload y la instancia configurada de cloudinary