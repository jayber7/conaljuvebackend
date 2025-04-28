// src/config/passportConfig.js
const passport = require('passport');
//const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy; // <-- Añadir
const User = require('../models/User'); // Ajusta la ruta
const dotenv = require('dotenv');

dotenv.config();

// passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_APP_ID,
//     clientSecret: process.env.FACEBOOK_APP_SECRET,
//     callbackURL: `${process.env.API_BASE_URL || 'http://localhost:5000/api'}/auth/facebook/callback`, // URL completa de callback
//     profileFields: ['id', 'displayName', 'emails', 'photos'] // Campos que pedimos a Facebook
//   },
//   async (accessToken, refreshToken, profile, done) => {
//     // Esta función se llama después de que Facebook autentica al usuario
//     try {
//          console.log('Facebook Profile:', profile); // Para depurar qué datos vienen

//          if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
//              // Facebook a veces no devuelve email si el usuario no lo confirmó o lo ocultó
//              return done(new Error('No se pudo obtener el correo electrónico de Facebook.'), null);
//          }

//          const email = profile.emails[0].value;
//          const facebookId = profile.id;
//          const name = profile.displayName;
//          const profilePictureUrl = profile.photos?.[0]?.value; // Obtener URL de foto si existe

//          // 1. Buscar usuario por Facebook ID
//          let user = await User.findOne({ facebookId: facebookId });

//          if (user) {
//              // Usuario ya existe, iniciar sesión
//              console.log('Usuario encontrado por Facebook ID:', user.email);
//              return done(null, user); // Pasar usuario encontrado a Passport
//          } else {
//              // 2. Si no existe por FB ID, buscar por email (para vincular si ya existe)
//              user = await User.findOne({ email: email });

//              if (user) {
//                  // Usuario existe con ese email pero sin FB ID: Vincular cuenta
//                  console.log('Vinculando Facebook ID a usuario existente:', user.email);
//                  user.facebookId = facebookId;
//                  // Actualizar foto si no tiene una o la de FB es diferente? (Opcional)
//                  if (!user.profilePictureUrl && profilePictureUrl) {
//                      user.profilePictureUrl = profilePictureUrl;
//                  }
//                  await user.save();
//                  return done(null, user);
//              } else {
//                  // 3. Si no existe ni por FB ID ni por email: Crear nuevo usuario
//                  console.log('Creando nuevo usuario desde Facebook:', email);
//                  const newUser = new User({
//                      facebookId: facebookId,
//                      email: email,
//                      name: name,
//                      profilePictureUrl: profilePictureUrl,
//                      // rol por defecto es 'USER'
//                      // isProfileComplete será false por defecto
//                      // Otros campos (location, ci, etc.) se pedirán después
//                  });
//                  await newUser.save();
//                  return done(null, newUser); // Pasar el nuevo usuario
//              }
//          }
//     } catch (error) {
//       console.error('Error en estrategia Facebook Passport:', error);
//       return done(error, null); // Pasar error a Passport
//     }
//   }
// ));
// --- AÑADIR GoogleStrategy ---
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.API_BASE_URL || 'http://localhost:5000/api'}/auth/google/callback`, // URL de Callback para Google
  scope: ['profile', 'email'] // Permisos básicos
},
async (accessToken, refreshToken, profile, done) => {
  // Se llama después de que Google autentica
  try {
      console.log('Google Profile:', profile); // Depurar datos de Google

      if (!profile.id) {
           return done(new Error('No se recibió ID de Google.'), null);
      }
      if (!profile.emails || !profile.emails[0]?.value) {
           return done(new Error('No se pudo obtener el correo electrónico de Google.'), null);
      }

      const googleId = profile.id;
      const email = profile.emails[0].value;
      const name = profile.displayName;
      // Google puede dar múltiples fotos, usualmente la primera es la buena
      const profilePictureUrl = profile.photos?.[0]?.value;

      // 1. Buscar por Google ID
      let user = await User.findOne({ googleId: googleId });
      if (user) {
          console.log('Usuario encontrado por Google ID:', user.email);
          return done(null, user);
      }

      // 2. Buscar por Email (para vincular si ya existe por otro medio)
      user = await User.findOne({ email: email });
      if (user) {
          console.log('Vinculando Google ID a usuario existente:', user.email);
          user.googleId = googleId;
          if (!user.profilePictureUrl && profilePictureUrl) { // Actualizar foto si no tiene
              user.profilePictureUrl = profilePictureUrl;
          }
          await user.save();
          return done(null, user);
      }

      // 3. Crear nuevo usuario
      console.log('Creando nuevo usuario desde Google:', email);
      const newUser = new User({
          googleId: googleId,
          email: email,
          name: name,
          profilePictureUrl: profilePictureUrl,
          // rol por defecto es 'USER'
          // isProfileComplete: false por defecto
      });
      await newUser.save();
      return done(null, newUser);

  } catch (error) {
      console.error('Error en estrategia Google Passport:', error);
      return done(error, null);
  }
}
));
// --- FIN GoogleStrategy ---
// Serializar usuario (guardar solo el ID en la sesión)
passport.serializeUser((user, done) => {
  done(null, user.id); // Guarda user._id en la sesión
});

// Deserializar usuario (obtener usuario completo desde el ID guardado en sesión)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); // Añade el objeto user a req.user
  } catch (error) {
    done(error, null);
  }
});

// No necesitamos exportar nada directamente, solo configurar passport