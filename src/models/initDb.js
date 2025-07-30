const oracledb = require("oracledb");

// Configuración de la base de datos usando variables de entorno
// Intentar múltiples formatos de conexión para Oracle Academy
const dbConfig = {
  user: process.env.DB_USER || "CO_A851_SQL_T01_ADMIN",
  password: process.env.DB_PASSWORD || "Milagros_1",
  connectString: process.env.DB_CONNECTION_STRING || 
    "oracle.academy.oracle.com:1521/PDB1.gbcnnaopac01.gbcnnaopacvcn.oraclevcn.com",
};

console.log("🔗 Variables de entorno:", {
  DB_USER: process.env.DB_USER ? "✅ Configurado" : "❌ No encontrado",
  DB_PASSWORD: process.env.DB_PASSWORD ? "✅ Configurado" : "❌ No encontrado", 
  DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING ? "✅ Configurado" : "❌ No encontrado",
});

console.log("🔗 Intentando conectar con:", {
  user: dbConfig.user,
  connectString: dbConfig.connectString,
  // NO mostrar password por seguridad
});

async function initialize() {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
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

// Export a function that returns a new connection
// This will be used by models to get a connection from the pool
async function getConnection() {
  return oracledb.getConnection(dbConfig);
}

module.exports = { initialize, getConnection };

// Run initialization
// initialize(); // We will call this from server.js or app.js to control startup
