const { Pool } = require("pg");

class PostgresDatabase {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async init() {
    try {
      // Configuración de conexión
      const config = {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
        max: 20, // máximo de conexiones en el pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      };

      this.pool = new Pool(config);

      // Verificar conexión
      const client = await this.pool.connect();
      console.log("✅ Conectado a PostgreSQL");
      client.release();

      this.isConnected = true;

      // Crear tablas si no existen
      await this.createTables();

      return true;
    } catch (error) {
      console.error("❌ Error conectando a PostgreSQL:", error);
      this.isConnected = false;
      throw error;
    }
  }

  async createTables() {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS servicios (
          id SERIAL PRIMARY KEY,
          orden_trabajo INTEGER NOT NULL,
          placa VARCHAR(20) NOT NULL,
          descripcion TEXT,
          costo DECIMAL(10,2),
          estado VARCHAR(50) DEFAULT 'pendiente',
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_servicios_placa ON servicios (placa);
        CREATE INDEX IF NOT EXISTS idx_servicios_fecha ON servicios (fecha_creacion);
        CREATE INDEX IF NOT EXISTS idx_servicios_estado ON servicios (estado);
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS vehiculos (
          id SERIAL PRIMARY KEY,
          placa VARCHAR(20) UNIQUE NOT NULL,
          marca VARCHAR(50) NOT NULL,
          modelo VARCHAR(50) NOT NULL,
          año INTEGER,
          color VARCHAR(30),
          propietario VARCHAR(100),
          telefono VARCHAR(20),
          email VARCHAR(100),
          fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          estado VARCHAR(20) DEFAULT 'activo'
        );
      `);

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_vehiculos_placa ON vehiculos (placa);
        CREATE INDEX IF NOT EXISTS idx_vehiculos_propietario ON vehiculos (propietario);
        CREATE INDEX IF NOT EXISTS idx_vehiculos_fecha ON vehiculos (fecha_registro);
      `);

      // Migración: Eliminar tabla historial_servicios si existe (ya no se usa)
      try {
        await this.pool.query(`
          DROP TABLE IF EXISTS historial_servicios CASCADE;
        `);
        console.log("✅ Migración: Tabla historial_servicios eliminada");
      } catch (error) {
        console.log(
          "⚠️ Tabla historial_servicios ya había sido eliminada o no existía"
        );
      }

      // Migración: Eliminar columna tipo_servicio si existe
      try {
        await this.pool.query(`
          ALTER TABLE servicios DROP COLUMN IF EXISTS tipo_servicio;
        `);
        console.log("✅ Migración: Columna tipo_servicio eliminada");
      } catch (error) {
        console.log(
          "⚠️ Columna tipo_servicio ya había sido eliminada o no existía"
        );
      }

      console.log("✅ Tablas creadas/verificadas en PostgreSQL");
    } catch (error) {
      console.error("❌ Error creando tablas:", error);
      throw error;
    }
  }

  async query(text, params = []) {
    if (!this.isConnected) {
      throw new Error("Base de datos no conectada");
    }

    try {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      console.log(`📊 Query ejecutada en ${duration}ms:`, {
        query: text.substring(0, 100) + "...",
        rows: result.rowCount,
      });

      return result;
    } catch (error) {
      console.error("❌ Error en query:", error);
      throw error;
    }
  }

  async getClient() {
    return await this.pool.connect();
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log("🔒 Conexión a PostgreSQL cerrada");
    }
  }

  // Métodos específicos para servicios
  async createService(serviceData) {
    const { orden_trabajo, placa, descripcion, costo } = serviceData;

    const result = await this.query(
      `
      INSERT INTO servicios (orden_trabajo, placa, descripcion, costo)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [orden_trabajo, placa, descripcion, costo]
    );

    return result.rows[0];
  }

  async getServices(filters = {}) {
    let query = "SELECT * FROM servicios WHERE 1=1";
    const params = [];
    let paramCount = 0;

    if (filters.placa) {
      paramCount++;
      query += ` AND placa ILIKE $${paramCount}`;
      params.push(`%${filters.placa}%`);
    }

    if (filters.orden_trabajo) {
      paramCount++;
      query += ` AND orden_trabajo = $${paramCount}`;
      params.push(filters.orden_trabajo);
    }

    if (filters.estado) {
      paramCount++;
      query += ` AND estado = $${paramCount}`;
      params.push(filters.estado);
    }

    if (filters.fecha_desde) {
      paramCount++;
      query += ` AND fecha_creacion >= $${paramCount}`;
      params.push(filters.fecha_desde);
    }

    query += " ORDER BY fecha_creacion DESC";

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await this.query(query, params);
    return result.rows;
  }

  async deleteService(id) {
    const result = await this.query(
      "DELETE FROM servicios WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  }

  async updateService(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error("No hay campos para actualizar");
    }

    paramCount++;
    values.push(id);

    const query = `
      UPDATE servicios 
      SET ${fields.join(", ")}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.rows[0];
  }

  // Métodos específicos para vehículos
  async createVehicle(vehicleData) {
    const { placa, marca, modelo, año, color, propietario, telefono, email } =
      vehicleData;

    const result = await this.query(
      `
      INSERT INTO vehiculos (placa, marca, modelo, año, color, propietario, telefono, email)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [placa, marca, modelo, año, color, propietario, telefono, email]
    );

    return result.rows[0];
  }

  async getVehicles(filters = {}) {
    let query = "SELECT * FROM vehiculos WHERE estado = 'activo'";
    const params = [];
    let paramCount = 0;

    if (filters.placa) {
      paramCount++;
      query += ` AND placa ILIKE $${paramCount}`;
      params.push(`%${filters.placa}%`);
    }

    if (filters.propietario) {
      paramCount++;
      query += ` AND propietario ILIKE $${paramCount}`;
      params.push(`%${filters.propietario}%`);
    }

    query += " ORDER BY fecha_registro DESC";

    const result = await this.query(query, params);
    return result.rows;
  }

  async deleteVehicle(id) {
    const result = await this.query(
      "UPDATE vehiculos SET estado = 'eliminado' WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  }

  // Estadísticas
  async getStats() {
    const totalServicios = await this.query(
      "SELECT COUNT(*) as count FROM servicios"
    );
    const totalVehiculos = await this.query(
      "SELECT COUNT(*) as count FROM vehiculos WHERE estado = 'activo'"
    );
    const serviciosHoy = await this.query(
      "SELECT COUNT(*) as count FROM servicios WHERE DATE(fecha_creacion) = CURRENT_DATE"
    );

    return {
      totalServicios: parseInt(totalServicios.rows[0].count),
      totalVehiculos: parseInt(totalVehiculos.rows[0].count),
      serviciosHoy: parseInt(serviciosHoy.rows[0].count),
    };
  }
}

module.exports = PostgresDatabase;
