// src/config/cloudinaryConfig.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path'); // Necesitarás el módulo path
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
    let resource_type = 'auto'; // Default a 'auto', Cloudinary intentará detectar
    let public_id_with_extension; // Para nombre personalizado

    // Determinar carpeta y formatos según el campo del formulario
    if (file.fieldname === 'newsPdf') { // Campo específico para PDF de noticias
      folder = 'conaljuve/news_pdfs';
      allowedFormats = ['pdf'];
      resource_type = 'raw'; // <-- ¡IMPORTANTE! Indicar que es un archivo raw
      return {
        folder: folder,
        resource_type: resource_type,
        // Estas opciones ayudan a Cloudinary a usar el nombre original y asegurar unicidad
        // y PRESERVAR LA EXTENSIÓN.
        use_filename: true, // Usa el nombre del archivo original como base
        unique_filename: true, // Añade caracteres aleatorios para hacerlo único, pero mantiene el nombre y extensión base
        format: 'pdf' //si resource_type es 'raw' y el archivo es pdf
      };
     
    } else if (file.fieldname === 'newsImage' || file.fieldname === 'profilePicture') { // Campo específico para imagen de noticia
      folder = file.fieldname === 'newsImage' ? 'conaljuve/news_images' : 'conaljuve/profile_pictures';
      resource_type = 'image';
      allowedFormats = ['jpg', 'png', 'jpeg', 'gif', 'webp'];
      // Transformación opcional para imágenes
      let transformation = file.fieldname === 'newsImage'
          ? [{ width: 1200, height: 630, crop: 'limit', quality: 'auto' }]
          : [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }];
      return { folder, resource_type, transformation, use_filename: true, unique_filename: false /*O true si quieres*/ };
       
    } else if (file.fieldname === 'profilePicture') { // Para fotos de perfil (existente)
        folder = 'conaljuve/profile_pictures';
        allowedFormats = ['jpg', 'png', 'jpeg', 'gif', 'webp'];
        resource_type = 'image'; // <-- Ser explícito para imágenes
        transformation = [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }];
        console.log(`Subiendo Foto Perfil (${file.originalname}) a carpeta: ${folder}`);
    } else {
      // Carpeta por defecto o error si el campo no es esperado
      folder = 'conaljuve/uploads_misc';
      allowedFormats = ['jpg', 'png', 'pdf']; // Permitir varios por defecto
      resource_type = 'auto'; // Dejar que Cloudinary detecte
      transformation = undefined;
      console.log(`Subiendo archivo genérico (${file.originalname}) a carpeta: ${folder} como ${resource_type}`);
    }

    return { folder, allowed_formats: allowedFormats, transformation, resource_type };
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