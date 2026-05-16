const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Member = require('../models/Member');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

// Middleware admin inline (evita problemas de import)
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return next(new AppError('Acceso denegado. Se requiere rol de Administrador.', 403));
  }
};

// Datos de prueba inline (evita importar seed_members.js que puede causar problemas)
const departments = [
  { code: 1, name: 'Chuquisaca', ext: 1, municipalities: [{ prov: 101, muni: 10101, name: 'Sucre', zones: ['Zona Central', 'San Pedro', 'Santa Rosa'] }] },
  { code: 2, name: 'La Paz', ext: 2, municipalities: [{ prov: 201, muni: 20101, name: 'La Paz', zones: ['Zona Sur', 'Miraflores', 'Sopocachi', 'San Jorge', 'Obrajes', 'Calacoto'] }, { prov: 201, muni: 20105, name: 'El Alto', zones: ['Distrito 1', 'Distrito 2', 'Villa Adela', 'Ciudad Satélite', 'Senkata'] }] },
  { code: 3, name: 'Cochabamba', ext: 3, municipalities: [{ prov: 301, muni: 30101, name: 'Cochabamba', zones: ['Zona Central', 'Queru Queru', 'Cala Cala', 'Zona Sur', 'San Antonio'] }, { prov: 309, muni: 30901, name: 'Quillacollo', zones: ['Centro', 'Barrio Norte', 'San Juan'] }] },
  { code: 4, name: 'Oruro', ext: 4, municipalities: [{ prov: 401, muni: 40101, name: 'Oruro', zones: ['Zona Central', 'Barrio Minero', 'Vinto', 'La Joya', 'Pata Pata'] }] },
  { code: 5, name: 'Potosí', ext: 5, municipalities: [{ prov: 501, muni: 50101, name: 'Potosí', zones: ['Zona Central', 'Barrio Minero', 'San Martín', 'Villa Imperial', 'Candelaria'] }, { prov: 501, muni: 50102, name: 'Uyuni', zones: ['Centro', 'Barrio Ferroviario'] }] },
  { code: 6, name: 'Tarija', ext: 6, municipalities: [{ prov: 601, muni: 60101, name: 'Tarija', zones: ['Zona Central', 'Barrio Norte', 'San Martín', 'La Pampa', 'Santa Ana'] }, { prov: 601, muni: 60102, name: 'Yacuiba', zones: ['Centro', 'Barrio Norte', 'San Juan'] }] },
  { code: 7, name: 'Santa Cruz', ext: 7, municipalities: [{ prov: 701, muni: 70101, name: 'Santa Cruz de la Sierra', zones: ['Plan 3000', 'Villa 1ro de Mayo', 'Equipetrol', 'Norte Integrado', 'Av. Banzer', 'Radial 26'] }, { prov: 701, muni: 70102, name: 'Warnes', zones: ['Centro', 'Barrio Norte'] }, { prov: 702, muni: 70201, name: 'Montero', zones: ['Plaza Central', 'Barrio Sur'] }] },
  { code: 8, name: 'Beni', ext: 8, municipalities: [{ prov: 801, muni: 80101, name: 'Trinidad', zones: ['Plaza Principal', 'Barrio Norte', 'San Pedro'] }, { prov: 801, muni: 80102, name: 'Riberalta', zones: ['Centro', 'Barrio Nuevo'] }] },
  { code: 9, name: 'Pando', ext: 9, municipalities: [{ prov: 901, muni: 90101, name: 'Cobija', zones: ['Plaza Principal', 'Barrio Norte', 'San Pedro', 'Centro'] }] },
];

const firstNamesMale = ['Juan Carlos', 'José Luis', 'Pedro Juan', 'Luis Fernando', 'Roberto Carlos', 'Miguel Ángel', 'Fernando', 'Hugo Alberto', 'Marco Antonio', 'Carlos Alberto', 'Jorge Luis', 'Raúl', 'Óscar', 'Walter', 'Germán', 'Freddy', 'Edgar', 'Ronald', 'César', 'Mario', 'Arturo', 'Gustavo', 'Pablo', 'Andrés', 'Daniel', 'Ricardo', 'Francisco', 'Antonio', 'Manuel', 'Sergio', 'Víctor', 'Adrián', 'Diego', 'Martín', 'Alejandro', 'Sebastián', 'Nicolás', 'Tomás', 'Felipe', 'Ignacio', 'Santiago', 'Mateo', 'Benjamín', 'Gabriel', 'Samuel', 'Isaac', 'David', 'Jonathan', 'Kevin', 'Bryan', 'Jhonny', 'Edwin', 'Eddy', 'Wilson', 'Brayan', 'Jhon', 'Alex', 'Mamani', 'Condori', 'Quispe', 'Huanca', 'Choque', 'Nina'];
const firstNamesFemale = ['María Elena', 'Ana Lucía', 'Carmen Rosa', 'Rosa Elena', 'Lucía', 'Elena Patricia', 'Silvia', 'Patricia Nina', 'Claudia Patricia', 'Gabriela', 'Gladys', 'Miriam', 'Sonia', 'Verónica', 'Lilian', 'Nancy', 'Roxana', 'Karina', 'Elizabeth', 'Marisol', 'Cristina', 'Mónica', 'Adriana', 'Daniela', 'Valentina', 'Camila', 'Isabella', 'Sofía', 'Mariana', 'Fernanda', 'Andrea', 'Paula', 'Carolina', 'Alejandra', 'Natalia', 'Victoria', 'Juliana', 'Antonella', 'Luciana', 'Juana', 'Rosa', 'Teresa', 'Francisca', 'Petrona', 'Gregoria', 'Eusebia', 'Justina', 'Filomena', 'Catalina', 'Antonia', 'Bernarda', 'Domitila', 'Maximina', 'Feliciana'];
const lastNames = ['Mamani', 'Condori', 'Quispe', 'Huanca', 'Choque', 'Nina', 'Sánchez', 'Flores', 'Torrez', 'Vargas', 'Rojas', 'Gutiérrez', 'Sandoval', 'Mercado', 'Arancibia', 'Cruz', 'Luna', 'Suárez', 'Paz', 'Ríos', 'Lima', 'Aguilar', 'Espinoza', 'Castillo', 'Ramírez', 'Medina', 'Paredes', 'Villca', 'Ticona', 'Copa', 'Rodríguez', 'Martínez', 'López', 'García', 'Pérez', 'González', 'Hernández', 'Torres', 'Díaz', 'Romero', 'Álvarez', 'Moreno', 'Muñoz', 'Alonso', 'Ruiz', 'Ortiz', 'Ramos', 'Jiménez', 'Herrera', 'Vega', 'Castro', 'Santana', 'Mendoza', 'Reyes', 'Morales', 'Ortega', 'Delgado', 'Guerrero', 'Cabrera', 'Campos', 'León', 'Molina', 'Soto'];
const streets = ['Av. 6 de Agosto', 'Av. Busch', 'Av. San Martín', 'Av. 16 de Julio', 'Av. Ismael Montes', 'Av. Mariscal Santa Cruz', 'Calle Sucre', 'Calle Bolívar', 'Calle Ingavi', 'Calle Comercio', 'Calle Mercado', 'Calle Junín', 'Calle Potosí', 'Calle Oruro', 'Calle Cochabamba', 'Calle Tarija', 'Calle Chuquisaca', 'Calle Beni', 'Calle Pando', 'Calle Santa Cruz', 'Calle La Paz', 'Av. Cristo Redentor', 'Av. Banzer', 'Av. Roca y Coronado', 'Av. Santos Dumont', 'Av. Pirai', 'Av. Monseñor Rivero', 'Av. Irala', 'Calle 21 de Septiembre', 'Calle 24 de Septiembre', 'Calle Loayza', 'Calle Yanacocha', 'Av. Circunvalación', 'Av. Blanco Galindo', 'Av. Panamericana'];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomPhone = () => `+591 ${randomItem(['7', '6'])}${Math.floor(Math.random() * 9000000) + 1000000}`;
const randomBirthDate = () => new Date(Math.floor(Math.random() * 46) + 1950, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

const generateMember = (deptCode, status) => {
  const dept = departments.find(d => d.code === deptCode);
  const muni = randomItem(dept.municipalities);
  const zone = randomItem(muni.zones);
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const firstName = gender === 'male' ? randomItem(firstNamesMale) : randomItem(firstNamesFemale);
  const lastName1 = randomItem(lastNames);
  const lastName2 = randomItem(lastNames);
  const street = randomItem(streets);
  const streetNum = Math.floor(Math.random() * 2000) + 1;

  return {
    fullName: `${firstName} ${lastName1} ${lastName2}`,
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
    neighborhoodCouncilName: `Junta Vecinal ${zone} - ${muni.name}`,
    memberRoleInCouncilCode: Math.floor(Math.random() * 20) + 1,
    status,
  };
};

const generateAllMembers = () => {
  const distribution = [
    { dept: 2, count: 30, status: 'VERIFIED' }, { dept: 2, count: 10, status: 'PENDING' }, { dept: 2, count: 5, status: 'REJECTED' },
    { dept: 7, count: 25, status: 'VERIFIED' }, { dept: 7, count: 10, status: 'PENDING' }, { dept: 7, count: 5, status: 'REJECTED' },
    { dept: 3, count: 22, status: 'VERIFIED' }, { dept: 3, count: 8, status: 'PENDING' }, { dept: 3, count: 5, status: 'REJECTED' },
    { dept: 4, count: 15, status: 'VERIFIED' }, { dept: 4, count: 6, status: 'PENDING' }, { dept: 4, count: 4, status: 'REJECTED' },
    { dept: 5, count: 15, status: 'VERIFIED' }, { dept: 5, count: 6, status: 'PENDING' }, { dept: 5, count: 4, status: 'REJECTED' },
    { dept: 6, count: 12, status: 'VERIFIED' }, { dept: 6, count: 5, status: 'PENDING' }, { dept: 6, count: 3, status: 'REJECTED' },
    { dept: 1, count: 9, status: 'VERIFIED' }, { dept: 1, count: 4, status: 'PENDING' }, { dept: 1, count: 2, status: 'REJECTED' },
    { dept: 8, count: 9, status: 'VERIFIED' }, { dept: 8, count: 4, status: 'PENDING' }, { dept: 8, count: 2, status: 'REJECTED' },
    { dept: 9, count: 6, status: 'VERIFIED' }, { dept: 9, count: 3, status: 'PENDING' }, { dept: 9, count: 1, status: 'REJECTED' },
  ];

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

// @desc    Seed members de prueba (solo admin)
// @route   POST /api/admin/seed-members
// @access  Private/Admin
router.post('/seed-members', protect, admin, asyncHandler(async (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.query.force) {
    return next(new AppError('Esta operación no está permitida en producción. Use ?force=true para forzar.', 403));
  }

  const members = generateAllMembers();
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const errorDetails = [];

  for (const memberData of members) {
    try {
      await Member.create(memberData);
      inserted++;
    } catch (err) {
      if (err.code === 11000) {
        skipped++;
      } else {
        errors++;
        errorDetails.push({ name: memberData.fullName, error: err.message });
      }
    }
  }

  const byDepartment = {};
  for (const member of members) {
    const dept = member.location.departmentCode;
    if (!byDepartment[dept]) byDepartment[dept] = { total: 0, verified: 0, pending: 0, rejected: 0 };
    byDepartment[dept].total++;
    if (member.status === 'VERIFIED') byDepartment[dept].verified++;
    if (member.status === 'PENDING') byDepartment[dept].pending++;
    if (member.status === 'REJECTED') byDepartment[dept].rejected++;
  }

  res.status(200).json({
    status: 'success',
    message: 'Seeding completado',
    data: {
      total: members.length,
      inserted,
      skipped,
      errors,
      errorDetails: errorDetails.slice(0, 10),
      byDepartment,
      summary: {
        verified: members.filter(m => m.status === 'VERIFIED').length,
        pending: members.filter(m => m.status === 'PENDING').length,
        rejected: members.filter(m => m.status === 'REJECTED').length,
      }
    }
  });
}));

// @desc    Limpiar todos los miembros de prueba
// @route   DELETE /api/admin/seed-members
// @access  Private/Admin
router.delete('/seed-members', protect, admin, asyncHandler(async (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.query.force) {
    return next(new AppError('Esta operación no está permitida en producción. Use ?force=true para forzar.', 403));
  }

  const count = await Member.countDocuments();
  await Member.deleteMany();

  res.status(200).json({
    status: 'success',
    message: `${count} miembros eliminados`,
    data: { deleted: count }
  });
}));

module.exports = router;
