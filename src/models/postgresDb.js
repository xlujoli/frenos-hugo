const { Pool } = require('pg');

// Configuración de PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/frenos_hugo',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Función para inicializar las tablas
async function initDatabase() {
  try {
    console.log('🔄 Inicializando base de datos PostgreSQL...');
    
    // Crear tabla de servicios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS servicios (
        id SERIAL PRIMARY KEY,
        work_order INTEGER NOT NULL,
        plate VARCHAR(20) NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        description TEXT,
        cost DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de vehículos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehiculos (
        id SERIAL PRIMARY KEY,
        plate VARCHAR(20) UNIQUE NOT NULL,
        brand VARCHAR(50) NOT NULL,
        model VARCHAR(50) NOT NULL,
        year INTEGER,
        owner_name VARCHAR(100) NOT NULL,
        owner_phone VARCHAR(20),
        owner_email VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear índices para mejorar el rendimiento
    await pool.query('CREATE INDEX IF NOT EXISTS idx_servicios_plate ON servicios(plate)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_servicios_status ON servicios(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_vehiculos_plate ON vehiculos(plate)');

    console.log('✅ Base de datos PostgreSQL inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
}

// Función para obtener la conexión
function getDB() {
  return pool;
}

// Función para cerrar la conexión
async function closeDB() {
  await pool.end();
}

// Función de prueba de conexión
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Conexión a PostgreSQL exitosa:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a PostgreSQL:', error);
    return false;
  }
}

module.exports = {
  initDatabase,
  getDB,
  closeDB,
  testConnection
};
