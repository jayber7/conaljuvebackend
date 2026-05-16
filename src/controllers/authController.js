// src/controllers/authController.js
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError.js');
const { OAuth2Client } = require('google-auth-library');



// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res, next) => {
  const { name, username, email, password  } = req.body;

  // La información del archivo subido (si existe) está en req.file
  // multer-storage-cloudinary añade la propiedad 'path' con la URL segura de Cloudinary
  const profilePictureUrl = req.file ? req.file.path : undefined; // <-- OBTENER URL DE req.file
  // 1. Validar datos (hecho con express-validator en las rutas)

  // 2. Verificar si el usuario ya existe
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    return next(new AppError('El correo electrónico o nombre de usuario ya está registrado', 400));
  }

  // 3. Crear usuario (la contraseña se hashea en el pre-save hook del modelo)
  // 3. Crear objeto para el nuevo usuario
  const newUserInput = {
    name,
    username,
    email,
    password, // Se hashea en pre-save
    profilePictureUrl: profilePictureUrl, // Usar URL si viene
    
  };
  // Limpiar campos undefined para no guardarlos si son opcionales
  Object.keys(newUserInput).forEach(key => newUserInput[key] === undefined && delete newUserInput[key]);
  if (newUserInput.location) {
      Object.keys(newUserInput.location).forEach(key => newUserInput.location[key] === undefined && delete newUserInput.location[key]);
  }
  // 4. Crear usuario en la DB
  const user = await User.create(newUserInput);

  // 4. Generar token y enviar respuesta
  if (user) {
    const token = generateToken(user._id);
    // Devolver los datos del usuario creado (excluyendo password por defecto)
    const userResponse = user.toObject(); // Convertir a objeto plano
    delete userResponse.password; // Doble check por si 'select: false' fallara
    res.status(201).json({ ...userResponse, token }); // Enviar datos + token
    
  } else {
    return next(new AppError('Datos de usuario inválidos', 400)); // Error genérico si falla la creación
  }
});

// @desc    Autenticar usuario y obtener token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res, next) => {
  const { usernameOrEmail, password } = req.body;

  // 1. Validar entrada (hecho con express-validator)

  // 2. Buscar usuario por email o username Y seleccionar la contraseña
  const user = await User.findOne({
    $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
  }).select('+password'); // IMPORTANTE: Seleccionar contraseña explícitamente

  // 3. Verificar si el usuario existe y la contraseña coincide
  if (user && (await user.matchPassword(password))) {
    const token = generateToken(user._id);
    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      profilePictureUrl:user.profilePictureUrl, 
      token: token,
    });
  } else {
    return next(new AppError('Credenciales inválidas', 401)); // Usar 401 Unauthorized
  }
});

// @desc    Obtener perfil del usuario logueado
// @route   GET /api/auth/me
// @access  Private (requiere 'protect' middleware)
const getMe = asyncHandler(async (req, res, next) => {
  // req.user es añadido por el middleware 'protect'
  const user = req.user;
  if (user) {
     res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,      
      profilePictureUrl:user.profilePictureUrl, 
      createdAt: user.createdAt
    });
  } else {
      return next(new AppError('Usuario no encontrado', 404));
  }

});

// @desc    Verificar código de autorización de Google y autenticar/registrar usuario
// @route   POST /api/auth/google/verify-code
// @access  Public
const verifyGoogleCode = asyncHandler(async (req, res, next) => {
  const { code } = req.body;
  console.log("😆")
  console.log(code)
  if (!code) {
      return next(new AppError('No se proporcionó código de autorización de Google', 400));
  }

  try {
      // 1. Intercambiar código por tokens con Google
      // Necesitas la redirect_uri que usó el frontend (generalmente se infiere o puede ser 'postmessage')
      // Revisa la documentación de @react-oauth/google sobre el redirect_uri para el code flow
      // Si usas librerías frontend, a menudo el intercambio lo hace la librería
      // y te da directamente el id_token o access_token.
      // --- ASUMIENDO QUE @react-oauth/google TE DA id_token o access_token ---
      // ---> Necesitamos AJUSTAR el frontend para enviar el token, no el code <---

      // --- REVISIÓN: @react-oauth/google con useGoogleLogin y flow: 'auth-code'
      // DEVUELVE UN *Authorization Code*. El backend DEBE intercambiarlo.
      

      const redirectUri = 'postmessage'; // O la URI registrada si no usas 'postmessage'

      const oauth2Client1 = new OAuth2Client(
        
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri,
       
      );
    
      
        // --- DEBUG LOGS ---
    console.log("😡DEBUG: GOOGLE_CLIENT_ID =", process.env.GOOGLE_CLIENT_ID);
    console.log("DEBUG: GOOGLE_CLIENT_SECRET =", process.env.GOOGLE_CLIENT_SECRET ? '***SECRET_DEFINIDO***' : '!!!SECRET_NO_DEFINIDO!!!'); // No imprimas el secreto real
    console.log(`Intentando getToken con code: ${code} y redirect_uri: ${redirectUri}`);
    // --- FIN DEBUG LOGS ---

       const { tokens } = await oauth2Client1.getToken({
           code
       });
       console.log("Tokens de Google obtenidos:", tokens);
       oauth2Client1.setCredentials(tokens);
       if (!tokens.id_token) {
           return next(new AppError('No se pudo obtener el ID Token de Google', 401));
       }


      // 2. Verificar el ID Token para obtener datos del usuario
       console.log("Verificando ID Token de Google...");
       const ticket = await oauth2Client1.verifyIdToken({
           idToken: tokens.id_token,
           audience: process.env.GOOGLE_CLIENT_ID,
       });
       const payload = ticket.getPayload();
       console.log("Payload del ID Token:", payload);

       if (!payload || !payload.sub || !payload.email || !payload.email_verified) {
            return next(new AppError('Token de ID de Google inválido o email no verificado', 401));
       }

       const googleId = payload.sub;
       const email = payload.email;
       const name = payload.name;
       const profilePictureUrl = payload.picture;

      // 3. Buscar o Crear Usuario en tu DB (lógica similar a Passport Strategy)
      let user = await User.findOne({ googleId: googleId });
      if (!user) {
           // Intentar buscar por email para vincular
           user = await User.findOne({ email: email });
           if (user) {
               console.log('Vinculando Google ID a usuario existente:', user.email);
               user.googleId = googleId;
               if (!user.profilePictureUrl && profilePictureUrl) user.profilePictureUrl = profilePictureUrl;
               await user.save();
           } else {
               // Crear nuevo usuario
               console.log('Creando nuevo usuario desde Google (verify-code):', email);
               user = await User.create({
                   googleId, email, name, profilePictureUrl,
                   // isProfileComplete será false por defecto
               });
           }
      } else {
           console.log('Usuario encontrado por Google ID (verify-code):', user.email);
      }

      // 4. Generar TU propio token JWT
      const token = generateToken(user._id);

      // 5. Devolver respuesta al frontend
       res.status(200).json({
           message: 'Autenticación con Google exitosa',
           user: { // Devolver datos necesarios
               _id: user._id, name: user.name, email: user.email,
               role: user.role, profilePictureUrl: user.profilePictureUrl,
               isProfileComplete: user.isProfileComplete,
           },
           token: token
       });

  } catch (error) {
      console.error('Error verificando código/token de Google:', error);
      return next(new AppError('Falló la autenticación con Google', 401));
  }
});
module.exports = {
  //registerUser,
  //loginUser,
  //completeUserProfile,
  verifyGoogleCode, // Exportar nuevo controlador
  getMe,
};