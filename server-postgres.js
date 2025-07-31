console.log("🚀 Iniciando Frenos Hugo v3.0 - PostgreSQL");

require('dotenv').config();
const express = require("express");
const path = require("path");
const { initDatabase, testConnection, closeDB } = require('./src/models/postgresDb');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(express.json());
app.use(express.static("public"));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Importar rutas de PostgreSQL
const servicesRoutes = require('./src/routes/servicesRoutes_postgres');
const carsRoutes = require('./src/routes/carsRoutes_postgres');

// Ruta de salud
app.get("/health", async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "3.0.0",
    database: dbStatus ? "PostgreSQL ✅" : "PostgreSQL ❌"
  });
});

// Ruta de información
app.get("/info", (req, res) => {
  res.json({
    app: "Frenos Hugo",
    version: "3.0.0 - PostgreSQL",
    database: "PostgreSQL",
    features: [
      "✅ Registros ilimitados",
      "✅ Base de datos persistente",
      "✅ Búsqueda avanzada",
      "✅ Estadísticas completas"
    ],
    status: "✅ Funcionando"
  });
});

// Rutas principales
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/cars.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cars.html"));
});

app.get("/consultation.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "consultation.html"));
});

// API Routes con PostgreSQL
app.use('/api/services', servicesRoutes);
app.use('/api/cars', carsRoutes);

// Endpoint de estadísticas generales
app.get("/api/stats", async (req, res) => {
  try {
    const { getDB } = require('./src/models/postgresDb');
    const db = getDB();
    
    const serviciosResult = await db.query('SELECT COUNT(*) as count FROM servicios');
    const vehiculosResult = await db.query('SELECT COUNT(*) as count FROM vehiculos');
    const ultimoServicioResult = await db.query('SELECT * FROM servicios ORDER BY created_at DESC LIMIT 1');
    const ultimoVehiculoResult = await db.query('SELECT * FROM vehiculos ORDER BY created_at DESC LIMIT 1');
    
    res.json({
      success: true,
      stats: {
        totalServicios: parseInt(serviciosResult.rows[0].count),
        totalVehiculos: parseInt(vehiculosResult.rows[0].count),
        ultimoServicio: ultimoServicioResult.rows[0] || null,
        ultimoVehiculo: ultimoVehiculoResult.rows[0] || null,
        database: "PostgreSQL",
        persistent: true
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.url,
    message: "Verifica la documentación de la API",
    availableEndpoints: [
      "GET /",
      "GET /health",
      "GET /info",
      "GET /api/stats",
      "GET /api/services",
      "POST /api/services",
      "DELETE /api/services/:id",
      "GET /api/cars",
      "POST /api/cars",
      "DELETE /api/cars/:id"
    ]
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    message: "Por favor intenta más tarde"
  });
});

// Función de inicialización
async function startServer() {
  try {
    // Inicializar base de datos
    await initDatabase();
    
    // Verificar conexión
    const connected = await testConnection();
    if (!connected) {
      console.warn('⚠️ No se pudo conectar a PostgreSQL, usando modo degradado');
    }

    // Iniciar servidor
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🗄️ Base de datos: PostgreSQL ${connected ? '✅' : '❌'}`);
    });

    server.on('error', (error) => {
      console.error('❌ Error del servidor:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Puerto ${PORT} está en uso`);
      }
    });

    // Manejo de señales para cierre limpio
    process.on('SIGTERM', async () => {
      console.log('🔄 Cerrando servidor...');
      server.close(async () => {
        await closeDB();
        console.log('✅ Servidor cerrado');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('🔄 Cerrando servidor...');
      server.close(async () => {
        await closeDB();
        console.log('✅ Servidor cerrado');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
}

// Iniciar la aplicación
if (require.main === module) {
  startServer();
}

module.exports = app;
