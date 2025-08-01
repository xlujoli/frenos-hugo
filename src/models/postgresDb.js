const { Pool } = require('pg');

class PostgresDatabase {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  async query(text, params) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async initTables() {
    try {
      // Create vehicles table
      await this.query(`
        CREATE TABLE IF NOT EXISTS vehiculos (
          id SERIAL PRIMARY KEY,
          placa VARCHAR(20) UNIQUE NOT NULL,
          marca VARCHAR(100) NOT NULL,
          modelo VARCHAR(100) NOT NULL,
          propietario VARCHAR(200) NOT NULL,
          telefono VARCHAR(20),
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create services table
      await this.query(`
        CREATE TABLE IF NOT EXISTS servicios (
          id SERIAL PRIMARY KEY,
          orden_trabajo INTEGER UNIQUE NOT NULL,
          placa VARCHAR(20) NOT NULL,
          descripcion TEXT NOT NULL,
          costo DECIMAL(10,2) NOT NULL,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (placa) REFERENCES vehiculos(placa)
        )
      `);

      console.log('✅ Tablas inicializadas correctamente');
    } catch (error) {
      console.error('❌ Error inicializando tablas:', error);
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = PostgresDatabase;
