console.log("🚀 Iniciando Frenos Hugo v3.0 - PostgreSQL");

// Cargar variables de entorno
require("dotenv").config();

const express = require("express");
const path = require("path");
const PostgresDatabase = require("./src/models/postgresDb");

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar base de datos
const db = new PostgresDatabase();

// Middleware básico
app.use(express.json());
app.use(express.static("public"));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware para verificar conexión a DB
app.use(async (req, res, next) => {
  if (!db.isConnected && req.path.startsWith("/api/")) {
    console.log("⚠️ Base de datos desconectada, intentando reconectar...");
    try {
      await db.testConnection();
      if (db.isConnected) {
        console.log("✅ Reconexión exitosa");
        next();
      } else {
        throw new Error("No se pudo establecer conexión");
      }
    } catch (error) {
      console.error("❌ Error de reconexión:", error);
      return res.status(503).json({
        error: "Servicio no disponible",
        message: "Base de datos no conectada",
      });
    }
  } else {
    next();
  }
});

// Rutas de salud
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "3.0.0",
    database: db.isConnected ? "PostgreSQL ✅" : "Desconectada ❌",
  });
});

app.get("/info", (req, res) => {
  res.json({
    app: "Frenos Hugo",
    version: "3.0.0 - PostgreSQL",
    database: "PostgreSQL",
    features: ["Almacenamiento ilimitado", "ACID compliance", "Escalabilidad"],
    status: "✅ Funcionando",
  });
});

// Rutas principales
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API Endpoints para servicios
app.post("/api/services", async (req, res) => {
  try {
    const servicio = await db.createService(req.body);

    res.json({
      success: true,
      message: "Servicio registrado exitosamente",
      data: servicio,
    });
  } catch (error) {
    console.error("Error creando servicio:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar servicio",
      error: error.message,
    });
  }
});

app.get("/api/services", async (req, res) => {
  try {
    const filters = {
      placa: req.query.placa,
      orden_trabajo: req.query.orden_trabajo
        ? parseInt(req.query.orden_trabajo)
        : undefined,
      estado: req.query.estado,
      fecha_desde: req.query.fecha_desde,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
    };

    const servicios = await db.getServices(filters);

    res.json({
      success: true,
      data: servicios,
      count: servicios.length,
    });
  } catch (error) {
    console.error("Error obteniendo servicios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener servicios",
      error: error.message,
    });
  }
});

// API Endpoints para vehículos
app.post("/api/cars", async (req, res) => {
  try {
    const vehiculo = await db.createVehicle(req.body);

    res.json({
      success: true,
      message: "Vehículo registrado exitosamente",
      data: vehiculo,
    });
  } catch (error) {
    console.error("Error creando vehículo:", error);

    // Manejar error de placa duplicada
    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        message: "Ya existe un vehículo con esta placa",
        error: "Placa duplicada",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al registrar vehículo",
      error: error.message,
    });
  }
});

app.get("/api/cars", async (req, res) => {
  try {
    const filters = {
      placa: req.query.placa,
      propietario: req.query.propietario,
    };

    const vehiculos = await db.getVehicles(filters);

    res.json({
      success: true,
      data: vehiculos,
      count: vehiculos.length,
    });
  } catch (error) {
    console.error("Error obteniendo vehículos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener vehículos",
      error: error.message,
    });
  }
});

// Endpoint para verificar si una placa existe
app.get("/api/cars/verify/:plate", async (req, res) => {
  try {
    console.log(`🔍 Verificando placa: ${req.params.plate}`);
    
    // Validar que la placa no esté vacía
    if (!req.params.plate || !req.params.plate.trim()) {
      return res.status(400).json({
        success: false,
        exists: false,
        message: "Placa no válida",
        error: "La placa no puede estar vacía"
      });
    }

    const plate = req.params.plate.toUpperCase().trim();
    console.log(`🔍 Placa normalizada: ${plate}`);
    
    // Verificar conexión a la base de datos
    if (!db.isConnected) {
      console.log("⚠️ Base de datos desconectada, intentando reconectar...");
      await db.testConnection();
      if (!db.isConnected) {
        throw new Error("Base de datos no disponible");
      }
    }
    
    const vehiculos = await db.getVehicles({ placa: plate });
    console.log(`📊 Vehículos encontrados: ${vehiculos ? vehiculos.length : 0}`);

    if (vehiculos && vehiculos.length > 0) {
      console.log(`✅ Vehículo encontrado: ${JSON.stringify(vehiculos[0])}`);
      res.json({
        success: true,
        exists: true,
        message: "Vehículo encontrado",
        data: vehiculos[0],
      });
    } else {
      console.log(`❌ Vehículo no encontrado para placa: ${plate}`);
      res.json({
        success: true,
        exists: false,
        message: "Vehículo no encontrado",
      });
    }
  } catch (error) {
    console.error("❌ Error verificando placa:", error);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error al verificar placa",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.url,
    message: "Verifica la URL y el método HTTP",
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    message: "Por favor intenta más tarde",
  });
});

// Función para inicializar la aplicación
async function startServer() {
  try {
    console.log("🔄 Verificando conexión a la base de datos...");
    
    // Probar conexión primero
    const connectionOk = await db.testConnection();
    
    if (connectionOk) {
      console.log("🔄 Inicializando tablas...");
      await db.initTables();
      console.log("✅ Base de datos lista");
    } else {
      console.warn("⚠️ No se pudo conectar a la base de datos, servidor en modo degradado");
    }

    // Iniciar servidor
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      if (db.isConnected) {
        console.log(`🗄️ Base de datos: PostgreSQL conectada`);
      } else {
        console.log(`🗄️ Base de datos: Desconectada (modo degradado)`);
      }
    });

    server.on("error", (error) => {
      console.error("❌ Error del servidor:", error);
      if (error.code === "EADDRINUSE") {
        console.error(`Puerto ${PORT} está en uso`);
      }
    });

    // Manejo de señales para cierre limpio
    process.on("SIGTERM", async () => {
      console.log("🔄 Cerrando servidor...");
      await db.close();
      server.close(() => {
        console.log("✅ Servidor cerrado");
        process.exit(0);
      });
    });

    process.on("SIGINT", async () => {
      console.log("🔄 Cerrando servidor...");
      await db.close();
      server.close(() => {
        console.log("✅ Servidor cerrado");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Error iniciando servidor:", error);
    console.log("🔄 Intentando iniciar servidor sin base de datos...");
    
    // Intentar iniciar el servidor aunque falle la conexión a la DB
    try {
      const server = app.listen(PORT, "0.0.0.0", () => {
        console.log(`⚠️ Servidor ejecutándose en puerto ${PORT} (sin base de datos)`);
        console.log(`🌐 URL: http://localhost:${PORT}`);
      });
    } catch (serverError) {
      console.error("❌ No se puede iniciar el servidor:", serverError);
      process.exit(1);
    }
  }
}

// Solo iniciar si no estamos en modo test
if (require.main === module) {
  startServer();
}

module.exports = app;
