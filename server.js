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
    return res.status(503).json({
      error: "Servicio no disponible",
      message: "Base de datos no conectada",
    });
  }
  next();
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
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/cars.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cars.html"));
});

app.get("/consultation.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "consultation.html"));
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
      orden_trabajo: req.query.orden_trabajo ? parseInt(req.query.orden_trabajo) : undefined,
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

app.delete("/api/services/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const servicioEliminado = await db.deleteService(id);

    if (servicioEliminado) {
      res.json({
        success: true,
        message: "Servicio eliminado exitosamente",
        data: servicioEliminado,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Servicio no encontrado",
      });
    }
  } catch (error) {
    console.error("Error eliminando servicio:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar servicio",
      error: error.message,
    });
  }
});

app.put("/api/services/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const servicioActualizado = await db.updateService(id, req.body);

    if (servicioActualizado) {
      res.json({
        success: true,
        message: "Servicio actualizado exitosamente",
        data: servicioActualizado,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Servicio no encontrado",
      });
    }
  } catch (error) {
    console.error("Error actualizando servicio:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar servicio",
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

app.delete("/api/cars/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const vehiculoEliminado = await db.deleteVehicle(id);

    if (vehiculoEliminado) {
      res.json({
        success: true,
        message: "Vehículo eliminado exitosamente",
        data: vehiculoEliminado,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }
  } catch (error) {
    console.error("Error eliminando vehículo:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar vehículo",
      error: error.message,
    });
  }
});

// Endpoint para verificar si una placa existe
app.get("/api/cars/verify/:plate", async (req, res) => {
  try {
    const plate = req.params.plate.toUpperCase();
    const vehiculos = await db.getVehicles({ placa: plate });

    if (vehiculos && vehiculos.length > 0) {
      res.json({
        success: true,
        exists: true,
        message: "Vehículo encontrado",
        data: vehiculos[0],
      });
    } else {
      res.json({
        success: true,
        exists: false,
        message: "Vehículo no encontrado",
      });
    }
  } catch (error) {
    console.error("Error verificando placa:", error);
    res.status(500).json({
      success: false,
      message: "Error al verificar placa",
      error: error.message,
    });
  }
});

// Endpoint de estadísticas
app.get("/api/stats", async (req, res) => {
  try {
    const stats = await db.getStats();

    res.json({
      success: true,
      stats: stats,
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: error.message,
    });
  }
});

// Endpoint para buscar servicios por placa
app.get("/api/services/search/:placa", async (req, res) => {
  try {
    const servicios = await db.getServices({ placa: req.params.placa });

    res.json({
      success: true,
      data: servicios,
      count: servicios.length,
    });
  } catch (error) {
    console.error("Error buscando servicios:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar servicios",
      error: error.message,
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
    // Inicializar base de datos
    await db.init();

    // Iniciar servidor
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🗄️ Base de datos: PostgreSQL conectada`);
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
    process.exit(1);
  }
}

// Solo iniciar si no estamos en modo test
if (require.main === module) {
  startServer();
}

module.exports = app;
