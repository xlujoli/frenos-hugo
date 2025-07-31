require("dotenv").config();
const PostgresDatabase = require("./src/models/postgresDb");

async function testConnection() {
  console.log("🧪 Probando conexión a PostgreSQL...");

  const db = new PostgresDatabase();

  try {
    await db.init();
    console.log("✅ Conexión exitosa!");

    // Probar consulta simple
    const result = await db.pool.query("SELECT NOW() as current_time");
    console.log("🕒 Hora del servidor:", result.rows[0].current_time);

    // Probar crear un registro de prueba
    console.log("📝 Probando inserción...");
    const insertResult = await db.pool.query(
      `
      INSERT INTO servicios (orden_trabajo, placa, tipo_servicio, descripcion, costo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [
        999,
        "TEST123",
        "Prueba de conexión",
        "Registro de prueba desde Node.js",
        0,
      ]
    );

    console.log("✅ Registro creado:", insertResult.rows[0]);

    // Eliminar el registro de prueba
    await db.pool.query("DELETE FROM servicios WHERE orden_trabajo = $1", [
      999,
    ]);
    console.log("🗑️ Registro de prueba eliminado");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testConnection();
