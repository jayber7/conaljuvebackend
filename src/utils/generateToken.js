// src/utils/generateToken.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config(); // Asegura que las variables de entorno estén disponibles

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d', // Usa valor de .env o default
  });
};

module.exports = generateToken;