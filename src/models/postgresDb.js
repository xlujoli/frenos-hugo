const { Pool } = require("pg");

class PostgresDatabase {
  constructor() {
    this.isConnected = false;
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });

    // Configurar eventos del pool
    this.pool.on('connect', () => {
      console.log('✅ Nueva conexión establecida con PostgreSQL');
      this.isConnected = true;
    });

    this.pool.on('error', (err) => {
      console.error('❌ Error en el pool de PostgreSQL:', err);
      this.isConnected = false;
    });
  }

  async testConnection() {
    try {
      const result = await this.query('SELECT NOW() as current_time');
      console.log('🔗 Conexión a PostgreSQL exitosa:', result.rows[0].current_time);
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('❌ Error de conexión a PostgreSQL:', error);
      this.isConnected = false;
      return false;
    }
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
      // Probar conexión primero
      await this.testConnection();

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

      console.log("✅ Tablas inicializadas correctamente");
      this.isConnected = true;
    } catch (error) {
      console.error("❌ Error inicializando tablas:", error);
      this.isConnected = false;
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }

  // Métodos para servicios
  async getServices(filters = {}) {
    try {
      let query = 'SELECT * FROM servicios WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (filters.placa) {
        paramCount++;
        query += ` AND placa = $${paramCount}`;
        params.push(filters.placa);
      }

      if (filters.orden_trabajo) {
        paramCount++;
        query += ` AND orden_trabajo = $${paramCount}`;
        params.push(filters.orden_trabajo);
      }

      if (filters.fecha_desde) {
        paramCount++;
        query += ` AND fecha_creacion >= $${paramCount}`;
        params.push(filters.fecha_desde);
      }

      query += ' ORDER BY fecha_creacion DESC';

      if (filters.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }

      const startTime = Date.now();
      const result = await this.query(query, params);
      const duration = Date.now() - startTime;

      console.log(`📊 Query ejecutada en ${duration}ms: {`);
      console.log(`  query: '${query.substring(0, 50)}...',`);
      console.log(`  rows: ${result.rows.length}`);
      console.log(`}`);

      return result.rows;
    } catch (error) {
      console.error('❌ Error obteniendo servicios:', error);
      throw error;
    }
  }

  async createService(serviceData) {
    try {
      const { orden_trabajo, placa, descripcion, costo } = serviceData;
      const query = `
        INSERT INTO servicios (orden_trabajo, placa, descripcion, costo)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const result = await this.query(query, [orden_trabajo, placa, descripcion, costo]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error creando servicio:', error);
      throw error;
    }
  }

  // Métodos para vehículos
  async getVehicles(filters = {}) {
    try {
      let query = 'SELECT * FROM vehiculos WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (filters.placa) {
        paramCount++;
        query += ` AND placa = $${paramCount}`;
        params.push(filters.placa);
      }

      query += ' ORDER BY fecha_creacion DESC';

      const result = await this.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Error obteniendo vehículos:', error);
      throw error;
    }
  }

  async createVehicle(vehicleData) {
    try {
      const { placa, marca, modelo, propietario, telefono } = vehicleData;
      const query = `
        INSERT INTO vehiculos (placa, marca, modelo, propietario, telefono)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const result = await this.query(query, [placa, marca, modelo, propietario, telefono]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error creando vehículo:', error);
      throw error;
    }
  }

  async getVehicleByPlate(placa) {
    try {
      const query = 'SELECT * FROM vehiculos WHERE placa = $1';
      const result = await this.query(query, [placa]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error obteniendo vehículo por placa:', error);
      throw error;
    }
  }

  async deleteService(id) {
    try {
      const query = 'DELETE FROM servicios WHERE id = $1 RETURNING *';
      const result = await this.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error eliminando servicio:', error);
      throw error;
    }
  }

  async updateService(id, serviceData) {
    try {
      const { orden_trabajo, placa, descripcion, costo } = serviceData;
      const query = `
        UPDATE servicios 
        SET orden_trabajo = $2, placa = $3, descripcion = $4, costo = $5
        WHERE id = $1
        RETURNING *
      `;
      const result = await this.query(query, [id, orden_trabajo, placa, descripcion, costo]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error actualizando servicio:', error);
      throw error;
    }
  }

  async deleteVehicle(id) {
    try {
      const query = 'DELETE FROM vehiculos WHERE id = $1 RETURNING *';
      const result = await this.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error eliminando vehículo:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const vehiculosQuery = 'SELECT COUNT(*) as total FROM vehiculos';
      const serviciosQuery = 'SELECT COUNT(*) as total FROM servicios';
      const ingresosTotalQuery = 'SELECT SUM(costo) as total FROM servicios';
      
      const [vehiculos, servicios, ingresos] = await Promise.all([
        this.query(vehiculosQuery),
        this.query(serviciosQuery),
        this.query(ingresosTotalQuery)
      ]);

      return {
        vehiculos: parseInt(vehiculos.rows[0].total) || 0,
        servicios: parseInt(servicios.rows[0].total) || 0,
        ingresos_total: parseFloat(ingresos.rows[0].total) || 0
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}

module.exports = PostgresDatabase;
