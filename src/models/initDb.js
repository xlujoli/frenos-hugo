const oracledb = require("oracledb");

// Configuración avanzada para Oracle Academy
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

// Configuración de la base de datos usando variables de entorno
const dbConfig = {
  user: process.env.DB_USER || "CO_A851_SQL_T01_ADMIN",
  password: process.env.DB_PASSWORD || "Milagros_1",
  connectString:
    process.env.DB_CONNECTION_STRING ||
    "oracle.academy.oracle.com:1521/PDB1.gbcnnaopac01.gbcnnaopacvcn.oraclevcn.com",
  // Configuraciones adicionales para Oracle Academy
  poolMin: 1,
  poolMax: 4,
  poolIncrement: 1,
  poolTimeout: 60,
  connectTimeout: 60,
  enableArrowFunction: true,
  // Configuraciones adicionales para mejorar conectividad
  externalAuth: false,
  homogeneous: true,
  privilege: oracledb.SYSDBA // Solo si es necesario
};

// Remover privilege si no es necesario (para usuarios normales)
if (!process.env.DB_SYSDBA || process.env.DB_SYSDBA.toLowerCase() !== 'true') {
  delete dbConfig.privilege;
}

console.log("🔗 Variables de entorno:", {
  DB_USER: process.env.DB_USER ? "✅ Configurado" : "❌ No encontrado",
  DB_PASSWORD: process.env.DB_PASSWORD ? "✅ Configurado" : "❌ No encontrado",
  DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING
    ? "✅ Configurado"
    : "❌ No encontrado",
});

console.log("🔗 Intentando conectar con:", {
  user: dbConfig.user,
  connectString: dbConfig.connectString,
  // NO mostrar password por seguridad
});

// Pool de conexiones para mejor manejo
let pool;

async function createPool() {
  try {
    pool = await oracledb.createPool(dbConfig);
    console.log("✅ Pool de conexiones Oracle creado exitosamente");
    return pool;
  } catch (err) {
    console.error("❌ Error creando pool de conexiones:", err);
    throw err;
  }
}

// Función de conexión con reintentos
async function connectWithRetry(maxRetries = 3, delay = 5000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Intento de conexión ${attempt}/${maxRetries}...`);
      
      if (!pool) {
        await createPool();
      }
      
      const connection = await pool.getConnection();
      console.log(`✅ Conexión exitosa en intento ${attempt}`);
      return connection;
    } catch (err) {
      console.error(`❌ Intento ${attempt} falló:`, err.message);
      
      if (attempt === maxRetries) {
        console.error("❌ Todos los intentos de conexión fallaron");
        throw err;
      }
      
      console.log(`⏳ Esperando ${delay/1000}s antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function initialize() {
  let connection;
  try {
    // Crear pool primero
    await createPool();
    
    // Obtener conexión del pool
    connection = await pool.getConnection();
    console.log("Successfully connected to Oracle Database!");

    // Create sequences for auto-incrementing IDs
    const createCarIdSequence = `
            BEGIN
                EXECUTE IMMEDIATE 'CREATE SEQUENCE car_id_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE';
            EXCEPTION
                WHEN OTHERS THEN
                    IF SQLCODE = -955 THEN
                        NULL; -- Sequence already exists
                    ELSE
                        RAISE;
                    END IF;
            END;`;

    const createServiceIdSequence = `
            BEGIN
                EXECUTE IMMEDIATE 'CREATE SEQUENCE service_id_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE';
            EXCEPTION
                WHEN OTHERS THEN
                    IF SQLCODE = -955 THEN
                        NULL; -- Sequence already exists
                    ELSE
                        RAISE;
                    END IF;
            END;`;

    await connection.execute(createCarIdSequence);
    console.log("Car ID sequence created or already exists.");
    await connection.execute(createServiceIdSequence);
    console.log("Service ID sequence created or already exists.");

    // Tabla de vehículos
    const createCarsTable = `
            CREATE TABLE cars (
                id NUMBER PRIMARY KEY,
                plate VARCHAR2(10) UNIQUE NOT NULL,
                brand VARCHAR2(50) NOT NULL,
                model VARCHAR2(50) NOT NULL,
                owner VARCHAR2(100) NOT NULL,
                phone VARCHAR2(20) NOT NULL
            )`;

    // Tabla de servicios
    const createServicesTable = `
            CREATE TABLE services (
                id NUMBER PRIMARY KEY,
                workOrder NUMBER,
                plate VARCHAR2(10) NOT NULL,
                work VARCHAR2(4000) NOT NULL,
                cost NUMBER NOT NULL,
                service_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_plate FOREIGN KEY (plate) REFERENCES cars (plate)
            )`;

    try {
      await connection.execute(createCarsTable);
      console.log('Table "cars" created successfully.');
    } catch (e) {
      if (e.errorNum === 955) {
        // ORA-00955: name is already used by an existing object
        console.log('Table "cars" already exists.');
      } else {
        throw e;
      }
    }

    try {
      await connection.execute(createServicesTable);
      console.log('Table "services" created successfully.');
    } catch (e) {
      if (e.errorNum === 955) {
        // ORA-00955: name is already used by an existing object
        console.log('Table "services" already exists.');
      } else {
        throw e;
      }
    }

    // Attempt to add the workOrder column to services table if it doesn't exist
    // Oracle does not have a simple "IF NOT EXISTS" for ALTER TABLE ADD COLUMN in a single statement
    // We'll try to add it and catch the error if it already exists.
    try {
      await connection.execute(`ALTER TABLE services ADD workOrder NUMBER`);
      console.log('Column "workOrder" added to services table.');
    } catch (e) {
      if (e.errorNum === 1430) {
        // ORA-01430: column being added already exists in table
        console.log('Column "workOrder" already exists in services table.');
      } else {
        // Re-throw other errors
        // console.error('Error adding workOrder column:', e); // For debugging
      }
    }

    console.log(
      "Tables checked/created/updated successfully in the Oracle database."
    );
  } catch (err) {
    console.error("Error during database initialization:", err);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("Database connection closed.");
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Export a function that returns a new connection from the pool
async function getConnection() {
  try {
    return await connectWithRetry(3, 3000); // 3 intentos, 3 segundos entre cada uno
  } catch (err) {
    console.error("❌ Error obteniendo conexión con reintentos:", err);
    // Último recurso: conexión directa
    console.log("🔄 Último intento con conexión directa...");
    return await oracledb.getConnection(dbConfig);
  }
}

// Función para cerrar el pool al terminar la aplicación
async function closePool() {
  if (pool) {
    try {
      await pool.close();
      console.log("✅ Pool de conexiones cerrado");
    } catch (err) {
      console.error("❌ Error cerrando pool:", err);
    }
  }
}

module.exports = { initialize, getConnection, closePool };

// Run initialization
// initialize(); // We will call this from server.js or app.js to control startup
