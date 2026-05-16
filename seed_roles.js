// backend/seed_roles.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const CouncilRole = require('./src/models/CouncilRole');

dotenv.config();

const rolesToSeed = [
  { code: 1, name: 'Presidente', order: 1 },
  { code: 2, name: 'Vicepresidente', order: 2 },
  { code: 3, name: 'Strio. General', order: 3 },
  { code: 4, name: 'Stria. De Relaciones', order: 4 },
  { code: 5, name: 'Strio. De Organización', order: 5 },
  { code: 6, name: 'Strio. De Conflictos', order: 6 },
  { code: 7, name: 'Strio. De Actas', order: 7 },
  { code: 8, name: 'Stria. De Hacienda', order: 8 },
  { code: 9, name: 'Stria. Desarrollo Económico Productivo', order: 9 },
  { code: 10, name: 'Strio. De Deportes', order: 10 },
  { code: 11, name: 'Strio. De Juventudes', order: 11 },
  { code: 12, name: 'Strio. De Educación y Cultura', order: 12 },
  { code: 13, name: 'Strio. De Vivienda', order: 13 },
  { code: 14, name: 'Stria. De Genero y Generación', order: 14 },
  { code: 15, name: 'Stria. De Defenza Cívico Vecinal', order: 15 },
  { code: 16, name: 'Strio. De Seguridad Ciudadana', order: 16 },
  { code: 17, name: 'Strio. De Salud', order: 17 },
  { code: 18, name: 'Strio. De Estadística', order: 18 },
  { code: 19, name: 'Strio. De Medio Ambiente y Recursos Naturales', order: 19 },
  { code: 20, name: 'Vocal', order: 20 }
];

const importRoles = async () => {
  try {
    await CouncilRole.deleteMany(); // Borrar existentes
    await CouncilRole.insertMany(rolesToSeed);
    console.log('✅ Cargos de Junta Vecinal poblados exitosamente!');
  } catch (error) {
    console.error('Error poblando cargos:', error);
    process.exit(1);
  }
};

const runSeed = async () => {
  await connectDB();
  await importRoles();
  await mongoose.connection.close();
  process.exit(0);
};

runSeed();