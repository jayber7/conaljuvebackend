const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Member = require('./src/models/Member');

dotenv.config();

// ============================================================
// DATOS DE PRUEBA - 230 MIEMBROS CON DIVERSIDAD BOLIVIANA
// ============================================================

// Nombres realistas con diversidad étnica (Aymara, Quechua, Guaraní, Español)
const firstNamesMale = [
  // Aymara
  'Mamani', 'Condori', 'Quispe', 'Huanca', 'Choque', 'Nina', 'Mamani', 'Condori',
  'Quispe', 'Huanca', 'Choque', 'Nina', 'Mamani', 'Condori', 'Quispe', 'Huanca',
  // Quechua
  'Sánchez', 'Flores', 'Torrez', 'Vargas', 'Rojas', 'Gutiérrez', 'Sandoval', 'Mercado',
  'Arancibia', 'Cruz', 'Luna', 'Suárez', 'Paz', 'Ríos', 'Lima', 'Sánchez',
  // Guaraní
  'Aguilar', 'Espinoza', 'Castillo', 'Ramírez', 'Medina', 'Paredes', 'Villca', 'Ticona',
  'Copa', 'Mamani', 'Condori', 'Quispe', 'Huanca', 'Choque', 'Nina', 'Mamani',
  // Español
  'Juan Carlos', 'José Luis', 'Pedro Juan', 'Luis Fernando', 'Roberto Carlos',
  'Miguel Ángel', 'Fernando', 'Hugo Alberto', 'Marco Antonio', 'Carlos Alberto',
  'Jorge Luis', 'Raúl', 'Óscar', 'Walter', 'Germán', 'Freddy', 'Edgar', 'Ronald',
  'César', 'Mario', 'Arturo', 'Gustavo', 'Pablo', 'Andrés', 'Daniel', 'Ricardo',
  'Francisco', 'Antonio', 'Manuel', 'Sergio', 'Víctor', 'Adrián', 'Diego', 'Martín',
  'Alejandro', 'Sebastián', 'Nicolás', 'Tomás', 'Felipe', 'Ignacio', 'Santiago',
  'Mateo', 'Benjamín', 'Gabriel', 'Samuel', 'Isaac', 'David', 'Jonathan', 'Kevin',
  'Bryan', 'Jhonny', 'Edwin', 'Eddy', 'Wilson', 'Brayan', 'Jhon', 'Alex',
];

const firstNamesFemale = [
  // Aymara
  'María Elena', 'Ana Lucía', 'Carmen Rosa', 'Rosa Elena', 'Lucía', 'Elena Patricia',
  'Silvia', 'Patricia Nina', 'Claudia Patricia', 'Gabriela', 'Gladys', 'Miriam',
  // Quechua
  'Patricia', 'Claudia', 'Gabriela', 'Silvia', 'Gladys', 'Miriam', 'Sonia', 'Verónica',
  'Lilian', 'Nancy', 'Roxana', 'Karina', 'Elizabeth', 'Marisol', 'Cristina', 'Mónica',
  // Guaraní
  'Juana', 'Rosa', 'Teresa', 'Francisca', 'Petrona', 'Gregoria', 'Eusebia', 'Justina',
  'Filomena', 'Catalina', 'Antonia', 'Bernarda', 'Domitila', 'Maximina', 'Feliciana',
  // Español
  'María', 'Ana', 'Carmen', 'Rosa', 'Lucía', 'Elena', 'Patricia', 'Claudia',
  'Gabriela', 'Silvia', 'Gladys', 'Miriam', 'Sonia', 'Verónica', 'Lilian', 'Nancy',
  'Roxana', 'Karina', 'Elizabeth', 'Marisol', 'Cristina', 'Mónica', 'Adriana', 'Daniela',
  'Valentina', 'Camila', 'Isabella', 'Sofía', 'Mariana', 'Fernanda', 'Andrea', 'Paula',
  'Carolina', 'Alejandra', 'Natalia', 'Victoria', 'Juliana', 'Antonella', 'Luciana',
];

const lastNames = [
  // Aymara
  'Mamani', 'Condori', 'Quispe', 'Huanca', 'Choque', 'Nina', 'Mamani', 'Condori',
  'Quispe', 'Huanca', 'Choque', 'Nina', 'Mamani', 'Condori', 'Quispe', 'Huanca',
  'Choque', 'Nina', 'Mamani', 'Condori', 'Quispe', 'Huanca', 'Choque', 'Nina',
  'Mamani', 'Condori', 'Quispe', 'Huanca', 'Choque', 'Nina', 'Mamani', 'Condori',
  'Quispe', 'Huanca', 'Choque', 'Nina', 'Mamani', 'Condori', 'Quispe', 'Huanca',
  // Quechua
  'Sánchez', 'Flores', 'Torrez', 'Vargas', 'Rojas', 'Gutiérrez', 'Sandoval', 'Mercado',
  'Arancibia', 'Cruz', 'Luna', 'Suárez', 'Paz', 'Ríos', 'Lima', 'Sánchez',
  'Flores', 'Torrez', 'Vargas', 'Rojas', 'Gutiérrez', 'Sandoval', 'Mercado', 'Arancibia',
  'Cruz', 'Luna', 'Suárez', 'Paz', 'Ríos', 'Lima', 'Sánchez', 'Flores', 'Torrez',
  'Vargas', 'Rojas', 'Gutiérrez', 'Sandoval', 'Mercado', 'Arancibia', 'Cruz', 'Luna',
  // Guaraní
  'Aguilar', 'Espinoza', 'Castillo', 'Ramírez', 'Medina', 'Paredes', 'Villca', 'Ticona',
  'Copa', 'Mamani', 'Condori', 'Quispe', 'Huanca', 'Choque', 'Nina', 'Mamani',
  'Condori', 'Quispe', 'Huanca', 'Choque', 'Nina', 'Mamani', 'Condori', 'Quispe',
  'Huanca', 'Choque', 'Nina', 'Mamani', 'Condori', 'Quispe', 'Huanca', 'Choque',
  // Español
  'Rodríguez', 'Martínez', 'López', 'García', 'Pérez', 'González', 'Hernández', 'Torres',
  'Díaz', 'Romero', 'Álvarez', 'Moreno', 'Muñoz', 'Alonso', 'Gutiérrez', 'Ruiz',
  'Ortiz', 'Ramos', 'Vargas', 'Castillo', 'Jiménez', 'Herrera', 'Medina', 'Aguilar',
  'Vega', 'Castro', 'Santana', 'Mendoza', 'Reyes', 'Morales', 'Ortega', 'Delgado',
  'Ríos', 'Guerrero', 'Cabrera', 'Campos', 'Vega', 'León', 'Molina', 'Soto',
];

// Ubicaciones realistas por departamento
const locations = {
  1: { // Chuquisaca
    name: 'Chuquisaca',
    ext: 1,
    municipalities: [
      { prov: 101, muni: 10101, name: 'Sucre', zones: ['Zona Central', 'Barrio Blanco', 'San Pedro', 'Santa Rosa', 'La Merced'] },
      { prov: 106, muni: 10601, name: 'Tarabuco', zones: ['Centro', 'Barrio Nuevo', 'San Juan'] },
      { prov: 107, muni: 10701, name: 'Camargo', zones: ['Plaza Central', 'Barrio Sur', 'San Martín'] },
      { prov: 105, muni: 10501, name: 'Monteagudo', zones: ['Centro', 'Barrio Norte', 'San José'] },
      { prov: 104, muni: 10401, name: 'Padilla', zones: ['Centro', 'Barrio Este', 'Santa Cruz'] },
    ]
  },
  2: { // La Paz
    name: 'La Paz',
    ext: 2,
    municipalities: [
      { prov: 201, muni: 20101, name: 'La Paz', zones: ['Zona Sur', 'Miraflores', 'Sopocachi', 'San Jorge', 'Obrajes', 'Calacoto', 'Achumani', 'Irpavi', 'Villa Fátima', 'Munaypata', 'Pampahasi', 'Periférica', 'Max Paredes', 'Zona 16 de Julio'] },
      { prov: 201, muni: 20105, name: 'El Alto', zones: ['Distrito 1', 'Distrito 2', 'Distrito 3', 'Distrito 4', 'Distrito 5', 'Distrito 6', 'Distrito 7', 'Distrito 8', 'Distrito 14', 'Villa Adela', 'Ciudad Satélite', 'Senkata', 'Villa Dolores'] },
      { prov: 202, muni: 20201, name: 'Achacachi', zones: ['Centro', 'Barrio Norte', 'San Pedro'] },
      { prov: 206, muni: 20601, name: 'Sorata', zones: ['Plaza Principal', 'Barrio Sur', 'San Juan'] },
      { prov: 209, muni: 20901, name: 'Luribay', zones: ['Centro', 'Barrio Este'] },
      { prov: 213, muni: 21301, name: 'Sica Sica', zones: ['Centro', 'Barrio Nuevo'] },
    ]
  },
  3: { // Cochabamba
    name: 'Cochabamba',
    ext: 3,
    municipalities: [
      { prov: 301, muni: 30101, name: 'Cochabamba', zones: ['Zona Central', 'Queru Queru', ' Cala Cala', 'Alto Queru Queru', 'Zona Sur', 'Villa Fátima', 'San Antonio', 'Ticti Norte', 'Ticti Sur', 'Irpavi', 'Pacífico', 'Lloko Lloko', 'Zona Norte', 'Villa Armonía', 'Zona Este'] },
      { prov: 309, muni: 30901, name: 'Quillacollo', zones: ['Centro', 'Barrio Norte', 'San Juan', 'Villa Bolívar'] },
      { prov: 309, muni: 30902, name: 'Sipe Sipe', zones: ['Centro', 'Barrio Sur'] },
      { prov: 307, muni: 30701, name: 'Capinota', zones: ['Plaza Central', 'Barrio Nuevo'] },
      { prov: 303, muni: 30301, name: 'Ayopaya', zones: ['Centro', 'San Pedro'] },
    ]
  },
  4: { // Oruro
    name: 'Oruro',
    ext: 4,
    municipalities: [
      { prov: 401, muni: 40101, name: 'Oruro', zones: ['Zona Central', 'Barrio Minero', 'Vinto', 'Calacoto', 'La Joya', 'Pata Pata', 'San José', 'Villa Esperanza', 'Barrio Norte', 'Zona Sur'] },
      { prov: 402, muni: 40201, name: 'Huanuni', zones: ['Centro', 'Barrio Minero', 'San Juan'] },
      { prov: 403, muni: 40301, name: 'Challapata', zones: ['Plaza Central', 'Barrio Sur'] },
      { prov: 406, muni: 40601, name: 'Caracollo', zones: ['Centro', 'Barrio Nuevo'] },
    ]
  },
  5: { // Potosí
    name: 'Potosí',
    ext: 5,
    municipalities: [
      { prov: 501, muni: 50101, name: 'Potosí', zones: ['Zona Central', 'Barrio Minero', 'San Martín', 'Villa Imperial', 'Candelaria', 'San Benito', 'Zona Norte', 'Zona Sur', 'Barrio Nuevo', 'San Juan'] },
      { prov: 501, muni: 50102, name: 'Uyuni', zones: ['Centro', 'Barrio Ferroviario', 'San Pedro'] },
      { prov: 502, muni: 50201, name: 'Tupiza', zones: ['Plaza Central', 'Barrio Sur', 'San Juan'] },
      { prov: 504, muni: 50401, name: 'Llallagua', zones: ['Centro', 'Barrio Minero', 'Siglo XX'] },
      { prov: 505, muni: 50501, name: 'Betanzos', zones: ['Centro', 'Barrio Norte'] },
    ]
  },
  6: { // Tarija
    name: 'Tarija',
    ext: 6,
    municipalities: [
      { prov: 601, muni: 60101, name: 'Tarija', zones: ['Zona Central', 'Barrio Norte', 'San Martín', 'La Pampa', 'Santa Ana', 'Churquiaca', 'Guadalquivir', 'Barrio Sur', 'Villa Padre Xifré', 'Barrio Nuevo'] },
      { prov: 601, muni: 60102, name: 'Yacuiba', zones: ['Centro', 'Barrio Norte', 'San Juan', 'Villa Montes'] },
      { prov: 602, muni: 60201, name: 'Bermejo', zones: ['Plaza Central', 'Barrio Sur'] },
      { prov: 603, muni: 60301, name: 'Villamontes', zones: ['Centro', 'Barrio Este', 'San Pedro'] },
    ]
  },
  7: { // Santa Cruz
    name: 'Santa Cruz',
    ext: 7,
    municipalities: [
      { prov: 701, muni: 70101, name: 'Santa Cruz de la Sierra', zones: ['Plan 3000', 'Villa 1ro de Mayo', 'Barrio Equipetrol', 'Norte Integrado', 'Av. Banzer', 'Radial 26', 'Av. Roca y Coronado', 'Av. Pirai', 'Av. Cristo Redentor', 'Av. Santos Dumont', 'Av. Busch', 'Av. San Martín', 'Av. Irala', 'Av. Monseñor Rivero', 'Av. Banzer 2do Anillo', 'Av. Banzer 3er Anillo', 'Av. Banzer 4to Anillo', 'Av. Banzer 5to Anillo', 'Av. Banzer 6to Anillo', 'Av. Banzer 7mo Anillo', 'Av. Banzer 8vo Anillo', 'Av. Banzer 9no Anillo', 'Av. Banzer 10mo Anillo', 'Av. Banzer 11vo Anillo', 'Av. Banzer 12vo Anillo'] },
      { prov: 701, muni: 70102, name: 'Warnes', zones: ['Centro', 'Barrio Norte', 'San Juan'] },
      { prov: 702, muni: 70201, name: 'Montero', zones: ['Plaza Central', 'Barrio Sur', 'San Pedro'] },
      { prov: 703, muni: 70301, name: 'Cotoca', zones: ['Centro', 'Barrio Este'] },
      { prov: 707, muni: 70701, name: 'Camiri', zones: ['Centro', 'Barrio Norte', 'San Juan'] },
    ]
  },
  8: { // Beni
    name: 'Beni',
    ext: 8,
    municipalities: [
      { prov: 801, muni: 80101, name: 'Trinidad', zones: ['Plaza Principal', 'Barrio Norte', 'San Pedro', 'Barrio Sur', 'Centro'] },
      { prov: 801, muni: 80102, name: 'Riberalta', zones: ['Centro', 'Barrio Nuevo', 'San Juan'] },
      { prov: 801, muni: 80103, name: 'Guayaramerín', zones: ['Plaza Central', 'Barrio Sur'] },
      { prov: 802, muni: 80201, name: 'San Borja', zones: ['Centro', 'Barrio Norte'] },
    ]
  },
  9: { // Pando
    name: 'Pando',
    ext: 9,
    municipalities: [
      { prov: 901, muni: 90101, name: 'Cobija', zones: ['Plaza Principal', 'Barrio Norte', 'San Pedro', 'Centro', 'Barrio Sur'] },
      { prov: 901, muni: 90102, name: 'Porvenir', zones: ['Centro', 'Barrio Nuevo'] },
      { prov: 902, muni: 90201, name: 'Filadelfia', zones: ['Plaza Central', 'Barrio Sur'] },
      { prov: 903, muni: 90301, name: 'Santa Rosa del Abuná', zones: ['Centro', 'Barrio Norte'] },
    ]
  },
};

// Calles bolivianas realistas
const streets = [
  'Av. 6 de Agosto', 'Av. Busch', 'Av. San Martín', 'Av. 16 de Julio',
  'Av. Ismael Montes', 'Av. Mariscal Santa Cruz', 'Av. Villazón',
  'Calle Sucre', 'Calle Bolívar', 'Calle Ingavi', 'Calle Comercio',
  'Calle Mercado', 'Calle Junín', 'Calle Potosí', 'Calle Oruro',
  'Calle Cochabamba', 'Calle Tarija', 'Calle Chuquisaca', 'Calle Beni',
  'Calle Pando', 'Calle Santa Cruz', 'Calle La Paz', 'Calle Cochabamba',
  'Av. Cristo Redentor', 'Av. Banzer', 'Av. Roca y Coronado',
  'Av. Santos Dumont', 'Av. Pirai', 'Av. Monseñor Rivero',
  'Av. Irala', 'Av. San Martín', 'Av. Busch', 'Av. Villazón',
  'Calle 21 de Septiembre', 'Calle 24 de Septiembre', 'Calle 6 de Agosto',
  'Calle 16 de Julio', 'Calle Loayza', 'Calle Yanacocha',
  'Calle Comercio', 'Calle Mercado', 'Calle Junín', 'Calle Potosí',
  'Av. Circunvalación', 'Av. Blanco Galindo', 'Av. Panamericana',
  'Calle Bolívar', 'Calle Sucre', 'Calle Ingavi', 'Calle Comercio',
];

const streetNumbers = () => Math.floor(Math.random() * 2000) + 1;

// Generar fecha de nacimiento realista (1950-1995)
const randomBirthDate = () => {
  const year = Math.floor(Math.random() * 46) + 1950;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month - 1, day);
};

// Generar teléfono boliviano realista
const randomPhone = () => {
  const prefixes = ['7', '6'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(Math.random() * 9000000) + 1000000;
  return `+591 ${prefix}${num}`;
};

// Nombres de juntas vecinales realistas
const councilNames = [
  'Junta Vecinal {barrio} - {zona}',
  'Junta de Vecinos {barrio}',
  'Organización Territorial de Base {barrio}',
  'Junta Vecinal {zona} - {municipio}',
  'Comité de Vecinos {barrio}',
  'Junta de Vecinos {zona} {municipio}',
];

// Generar nombre completo
const generateFullName = (gender) => {
  const names = gender === 'male' ? firstNamesMale : firstNamesFemale;
  const firstName = names[Math.floor(Math.random() * names.length)];
  const lastName1 = lastNames[Math.floor(Math.random() * lastNames.length)];
  const lastName2 = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName1} ${lastName2}`;
};

// Generar miembro
const generateMember = (deptCode, status) => {
  const dept = locations[deptCode];
  const muni = dept.municipalities[Math.floor(Math.random() * dept.municipalities.length)];
  const zone = muni.zones[Math.floor(Math.random() * muni.zones.length)];
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const fullName = generateFullName(gender);
  const street = streets[Math.floor(Math.random() * streets.length)];
  const streetNum = streetNumbers();

  return {
    fullName,
    idCard: String(Math.floor(Math.random() * 9000000) + 1000000),
    idCardExtension: dept.ext,
    birthDate: randomBirthDate(),
    sex: gender === 'male',
    phoneNumber: randomPhone(),
    location: {
      departmentCode: deptCode,
      provinceCode: muni.prov,
      municipalityCode: muni.muni,
      zone,
      neighborhood: zone,
      street: `${street} #${streetNum}`,
    },
    neighborhoodCouncilName: councilNames[Math.floor(Math.random() * councilNames.length)]
      .replace('{barrio}', zone)
      .replace('{zona}', zone)
      .replace('{municipio}', muni.name),
    memberRoleInCouncilCode: Math.floor(Math.random() * 20) + 1,
    status,
  };
};

// Distribución de miembros por departamento y estado
const distribution = [
  // La Paz (más poblado) - 45 miembros
  { dept: 2, count: 30, status: 'VERIFIED' },
  { dept: 2, count: 10, status: 'PENDING' },
  { dept: 2, count: 5, status: 'REJECTED' },
  // Santa Cruz - 40 miembros
  { dept: 7, count: 25, status: 'VERIFIED' },
  { dept: 7, count: 10, status: 'PENDING' },
  { dept: 7, count: 5, status: 'REJECTED' },
  // Cochabamba - 35 miembros
  { dept: 3, count: 22, status: 'VERIFIED' },
  { dept: 3, count: 8, status: 'PENDING' },
  { dept: 3, count: 5, status: 'REJECTED' },
  // Oruro - 25 miembros
  { dept: 4, count: 15, status: 'VERIFIED' },
  { dept: 4, count: 6, status: 'PENDING' },
  { dept: 4, count: 4, status: 'REJECTED' },
  // Potosí - 25 miembros
  { dept: 5, count: 15, status: 'VERIFIED' },
  { dept: 5, count: 6, status: 'PENDING' },
  { dept: 5, count: 4, status: 'REJECTED' },
  // Tarija - 20 miembros
  { dept: 6, count: 12, status: 'VERIFIED' },
  { dept: 6, count: 5, status: 'PENDING' },
  { dept: 6, count: 3, status: 'REJECTED' },
  // Chuquisaca - 15 miembros
  { dept: 1, count: 9, status: 'VERIFIED' },
  { dept: 1, count: 4, status: 'PENDING' },
  { dept: 1, count: 2, status: 'REJECTED' },
  // Beni - 15 miembros
  { dept: 8, count: 9, status: 'VERIFIED' },
  { dept: 8, count: 4, status: 'PENDING' },
  { dept: 8, count: 2, status: 'REJECTED' },
  // Pando - 10 miembros
  { dept: 9, count: 6, status: 'VERIFIED' },
  { dept: 9, count: 3, status: 'PENDING' },
  { dept: 9, count: 1, status: 'REJECTED' },
];

// Generar todos los miembros
const generateAllMembers = () => {
  const members = [];
  const usedCI = new Set();

  for (const { dept, count, status } of distribution) {
    for (let i = 0; i < count; i++) {
      let member;
      let attempts = 0;
      do {
        member = generateMember(dept, status);
        attempts++;
      } while (usedCI.has(member.idCard) && attempts < 100);

      usedCI.add(member.idCard);
      members.push(member);
    }
  }

  return members;
};

// ============================================================
// FUNCIÓN PRINCIPAL DE SEEDING
// ============================================================

const seedMembers = async () => {
  try {
    await connectDB();

    const members = generateAllMembers();
    console.log(`\n📊 Generando ${members.length} miembros de prueba...`);
    console.log(`   VERIFIED: ${members.filter(m => m.status === 'VERIFIED').length}`);
    console.log(`   PENDING: ${members.filter(m => m.status === 'PENDING').length}`);
    console.log(`   REJECTED: ${members.filter(m => m.status === 'REJECTED').length}`);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const memberData of members) {
      try {
        await Member.create(memberData);
        inserted++;
        if (inserted % 50 === 0) {
          console.log(`   ✅ ${inserted}/${members.length} insertados...`);
        }
      } catch (err) {
        if (err.code === 11000) {
          skipped++;
        } else {
          errors++;
          console.error(`   ❌ Error con ${memberData.fullName}: ${err.message}`);
        }
      }
    }

    console.log(`\n✅ Seeding completado:`);
    console.log(`   Insertados: ${inserted}`);
    console.log(`   Saltados (duplicados): ${skipped}`);
    console.log(`   Errores: ${errors}`);

    // Mostrar resumen por departamento
    console.log('\n📍 Distribución por departamento:');
    for (const deptCode of Object.keys(locations)) {
      const count = members.filter(m => m.location.departmentCode === parseInt(deptCode)).length;
      console.log(`   ${locations[deptCode].name}: ${count} miembros`);
    }

  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión a MongoDB cerrada.');
    process.exit(0);
  }
};

// ============================================================
// FUNCIÓN PARA LIMPIAR MIEMBROS
// ============================================================

const deleteMembers = async () => {
  try {
    await connectDB();
    const count = await Member.countDocuments();
    await Member.deleteMany();
    console.log(`🗑️  ${count} miembros eliminados.`);
  } catch (error) {
    console.error('❌ Error eliminando miembros:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// ============================================================
// EJECUCIÓN
// ============================================================

if (process.argv[2] === '--delete') {
  deleteMembers();
} else {
  seedMembers();
}

// Exportar para uso en endpoint API
module.exports = { generateAllMembers, seedMembers, deleteMembers };
