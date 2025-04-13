// src/config/swaggerConfig.js
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path'); // Importa el módulo 'path' de Node.js
// Determina la ruta absoluta al directorio de rutas
// __dirname se refiere al directorio actual del archivo (src/config)
// path.resolve construye una ruta absoluta desde ahí
const routesPath = path.resolve(__dirname, '../routes/*.js');
// Imprime la ruta para verificarla (puedes quitar esto después)
console.log('Ruta de APIs para Swagger:', routesPath);
const swaggerOptions = {
  definition: {
    openapi: '3.0.0', // Especificación OpenAPI
    info: {
      title: 'API Portal CONALJUVE',
      version: '1.0.0',
      description: 'Documentación de la API RESTful para el portal de noticias y comunidad de CONALJUVE.',
      contact: {
        name: 'Equipo de Desarrollo CONALJUVE',
        // url: 'http://tu-sitio-web.com', // Opcional
        // email: 'contacto@tu-dominio.com', // Opcional
      },
    },
    servers: [ // Define los servidores donde la API está disponible
      {
        url: process.env.API_BASE_URL || 'http://localhost:5000/api', // Usa variable de entorno o default
        description: process.env.NODE_ENV === 'production' ? 'Servidor de Producción' : 'Servidor de Desarrollo Local',
      },
      // Puedes añadir más servidores (ej. staging)
    ],
    components: { // Componentes reutilizables (ej. esquemas de seguridad, schemas)
        securitySchemes: {
            bearerAuth: { // Nombre del esquema de seguridad
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT', // Indica que es un token JWT
                description: 'Ingrese el token JWT con el prefijo Bearer (ej: Bearer abcde12345)'
            }
        },
        schemas: { // Schemas reutilizables para request/response bodies
            User: { // Schema para el modelo User (simplificado para docs)
               type: 'object',
               properties: {
                 _id: { type: 'string', description: 'ID único del usuario (MongoDB ObjectId)', example: '60d0fe4f5311236168a109ca' },
                 name: { type: 'string', example: 'Juan Pérez' },
                 username: { type: 'string', example: 'juanperez' },
                 email: { type: 'string', format: 'email', example: 'juan.perez@email.com'},
                 role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
                 location: {
                    type: 'object',
                    properties: {
                        department: { type: 'string', example: 'La Paz' },
                        province: { type: 'string', example: 'Murillo' },
                        municipality: { type: 'string', example: 'La Paz' },
                        zone: { type: 'string', example: 'Sopocachi' }
                    }
                 },
                 createdAt: { type: 'string', format: 'date-time' },
                 updatedAt: { type: 'string', format: 'date-time' }
               }
            },
            NewsArticle: { // Schema para el modelo NewsArticle
                type: 'object',
                properties: {
                    _id: { type: 'string', description: 'ID único de la noticia', example: '60d0fe4f5311236168a109cb' },
                    title: { type: 'string', example: 'Nueva Directiva CONALJUVE' },
                    summary: { type: 'string', example: 'Se posesionó la nueva directiva...' },
                    content: { type: 'string', example: 'Texto completo de la noticia...' },
                    imageUrl: { type: 'string', format: 'url', example: 'https://ejemplo.com/imagen.jpg' },
                    publicationDate: { type: 'string', format: 'date-time' },
                    author: { type: 'string', description: 'ID del autor (User ObjectId)', example: '60d0fe4f5311236168a109ca' },
                    tags: { type: 'array', items: { type: 'string' }, example: ['Elecciones', 'La Paz'] },
                    locationScope: { /* similar a User.location */ },
                    isPublished: { type: 'boolean', example: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
             Comment: { // Schema para el modelo Comment
                type: 'object',
                properties: {
                    _id: { type: 'string', description: 'ID único del comentario', example: '60d0fe4f5311236168a109cc' },
                    text: { type: 'string', example: '¡Gran noticia!' },
                    author: { $ref: '#/components/schemas/User' }, // Referencia al schema User (mostrando datos poblados)
                    article: { type: 'string', description: 'ID de la noticia (NewsArticle ObjectId)', example: '60d0fe4f5311236168a109cb' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            ErrorResponse: { // Schema genérico para respuestas de error
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'Credenciales inválidas' },
                    status: { type: 'string', example: 'fail' },
                    // stack: { type: 'string', description: '(Solo en desarrollo)' }
                }
            }
            // Añadir más Schemas según sea necesario (para bodies de requests específicos)
        }
    },
    security: [ // Aplicar seguridad globalmente (puede sobreescribirse por endpoint)
        {
            bearerAuth: [] // Requiere el esquema 'bearerAuth' definido arriba
        }
    ],
    
  },
  apis: [routesPath], // Rutas donde buscar los comentarios JSDoc
};

// Verifica si se generó una especificación válida
let swaggerSpec;
try {
    swaggerSpec = swaggerJsdoc(swaggerOptions);
    // Opcional: Imprimir un fragmento para verificar que se generó algo
    console.log('Swagger Spec generada (fragmento):', JSON.stringify(swaggerSpec).substring(0, 500));
} catch (error) {
    console.error("Error al generar Swagger Spec:", error);
    // Podrías querer salir del proceso si la documentación es crítica
    // process.exit(1);
    swaggerSpec = { // Devuelve un objeto vacío o de error para que la app no falle al importar
        openapi: '3.0.0',
        info: { title: 'Error en Swagger', version: '0.0.0'},
        paths: {}
    };
}

module.exports = swaggerSpec;