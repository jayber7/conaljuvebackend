// backend/seed_csv.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Department = require('./src/models/Department');
const Province = require('./src/models/Province');
const Municipality = require('./src/models/Municipality');

dotenv.config();

const csvFilePath = path.join(__dirname, 'deptoprovmuni.csv'); // Ruta al archivo CSV

// Función Principal de Seeding desde CSV
const importDataFromCsv = async () => {
  // Usamos Maps para almacenar temporalmente y asegurar la unicidad por código
  const departmentsMap = new Map();
  const provincesMap = new Map();
  const municipalities = []; // Array para almacenar todos los municipios

  console.log(`Leyendo archivo CSV desde: ${csvFilePath}`);

  // Manejar el stream asíncrono del CSV parser con una Promise
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({
          // Eliminar espacios en blanco de las cabeceras
          mapHeaders: ({ header }) => header.trim(),
          // Eliminar espacios en blanco y caracteres extraños (como nbsp) de los valores
          mapValues: ({ value }) => value.replace(/\s+/g, ' ').trim()
        }))
      .on('data', (row) => {
        // --- Procesamiento de cada fila ---

        // Validar que las columnas clave tengan datos
        if (row.codDepto && row.Departamento && row.CodProv && row.Provincia && row.CodMuni && row.Municipalidad) {
          try {
            const codDepto = parseInt(row.codDepto, 10);
            const codProv = parseInt(row.CodProv, 10);
            const codMuni = parseInt(row.CodMuni, 10);

            // Verificar si los códigos son números válidos
            if (isNaN(codDepto) || isNaN(codProv) || isNaN(codMuni)) {
                console.warn(`Fila CSV omitida por código inválido: ${JSON.stringify(row)}`);
                return; // Saltar esta fila
            }

            const deptName = row.Departamento;
            const provName = row.Provincia;
            const muniName = row.Municipalidad;

            // 1. Añadir/Actualizar Departamento (asegura unicidad por código)
            if (!departmentsMap.has(codDepto)) {
              departmentsMap.set(codDepto, {
                code: codDepto,
                name: deptName
              });
            }

            // 2. Añadir/Actualizar Provincia (asegura unicidad por código)
            if (!provincesMap.has(codProv)) {
              provincesMap.set(codProv, {
                code: codProv,
                name: provName,
                departmentCode: codDepto // Enlace al departamento
              });
            } else {
              // Opcional: Verificar consistencia si la provincia ya existe
              const existingProv = provincesMap.get(codProv);
              if (existingProv.name !== provName || existingProv.departmentCode !== codDepto) {
                console.warn(`Inconsistencia de datos para Provincia ${codProv}: Fila ${JSON.stringify(row)} vs Existente ${JSON.stringify(existingProv)}`);
              }
            }

            // 3. Añadir Municipio a la lista
            municipalities.push({
              code: codMuni,
              name: muniName,
              provinceCode: codProv, // Enlace a la provincia
              departmentCode: codDepto // Enlace al departamento
            });

          } catch (parseError) {
            console.warn(`Error parseando fila CSV, omitida: ${JSON.stringify(row)}`, parseError);
          }
        } else if (Object.values(row).some(val => val && val.trim() !== '')) {
            // Registrar filas que no están completamente vacías pero les faltan datos clave
            // console.warn(`Fila CSV omitida por datos clave faltantes: ${JSON.stringify(row)}`);
        }
        // Las filas completamente vacías o con solo comas se ignoran silenciosamente
      })
      .on('end', () => {
        console.log('Lectura de CSV completada.');
        console.log(`Departamentos únicos encontrados: ${departmentsMap.size}`);
        console.log(`Provincias únicas encontradas: ${provincesMap.size}`);
        console.log(`Municipios encontrados: ${municipalities.length}`);
        resolve(); // Termina la Promise
      })
      .on('error', (error) => {
         console.error('Error leyendo el archivo CSV:', error);
         reject(error); // Rechaza la Promise
      });
  });


  // --- Inserción en la Base de Datos ---
  try {
    // Convertir Maps a Arrays
    const departmentsToInsert = Array.from(departmentsMap.values());
    const provincesToInsert = Array.from(provincesMap.values());

    // Validar que tengamos datos antes de intentar insertar
    if (departmentsToInsert.length === 0 || provincesToInsert.length === 0 || municipalities.length === 0) {
        console.error("Error: No se encontraron datos válidos para insertar. Verifica el archivo CSV.");
        process.exit(1);
    }

    console.log(`Insertando ${departmentsToInsert.length} Departamentos...`);
    await Department.insertMany(departmentsToInsert);
    console.log('Departamentos poblados exitosamente!');

    console.log(`Insertando ${provincesToInsert.length} Provincias...`);
    await Province.insertMany(provincesToInsert);
    console.log('Provincias pobladas exitosamente!');

    console.log(`Insertando ${municipalities.length} Municipios...`);
    // CodMuni debería ser único, no se necesita filtro adicional si el CSV es correcto
    await Municipality.insertMany(municipalities);
    console.log('Municipios poblados exitosamente!');

    console.log('*** Proceso de Seeding desde CSV completado ***');

  } catch (error) {
    console.error('Error durante la inserción en la base de datos:', error);
    if (error.code === 11000) { // Error de clave duplicada
        console.error("ERROR: Clave duplicada encontrada. Asegúrate de ejecutar con --delete si quieres reemplazar los datos existentes, o revisa tus datos por códigos duplicados.");
    }
    process.exit(1);
  }
};

// Función para Borrar Datos (sin cambios)
const deleteData = async () => {
  try {
    console.log('Eliminando datos existentes de ubicaciones (Departamentos, Provincias, Municipios)...');
    await Municipality.deleteMany();
    await Province.deleteMany();
    await Department.deleteMany();
    console.log('Datos de ubicación eliminados.');
  } catch (error) {
    console.error('Error eliminando datos:', error);
    process.exit(1);
  }
};

// Lógica de ejecución (sin cambios)
const runSeedCsv = async () => {
  await connectDB();

  if (process.argv[2] === '--delete') {
    await deleteData();
  } else {
    console.log("Iniciando seeding desde deptoprovmuni.csv (Reemplazará datos existentes)...");
    await deleteData(); // Siempre borrar antes para evitar duplicados con esta data completa
    await importDataFromCsv();
  }

  await mongoose.connection.close();
  console.log('Conexión a MongoDB cerrada.');
  process.exit(0);
};

runSeedCsv(); // Ejecutar