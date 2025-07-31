console.log("🚀 Iniciando Frenos Hugo v2.0");

const express = require("express");
const path = require("path");

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

// Ruta de salud
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
  });
});

// Ruta de información
app.get("/info", (req, res) => {
  res.json({
    app: "Frenos Hugo",
    version: "2.0.0 - Híbrido",
    database: "SQLite (Público)",
    admin: "Disponible en Oracle APEX",
    status: "✅ Funcionando",
  });
});

// Datos en memoria (temporal)
let servicios = [];
let vehiculos = [];
let nextServiceId = 1;
let nextVehicleId = 1;

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
app.post("/api/services", (req, res) => {
  try {
    const servicio = {
      id: nextServiceId++,
      ...req.body,
      fecha: new Date().toISOString()
    };
    servicios.push(servicio);
    
    res.json({
      success: true,
      message: "Servicio registrado exitosamente",
      id: servicio.id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al registrar servicio"
    });
  }
});

app.get("/api/services", (req, res) => {
  res.json({
    success: true,
    data: servicios,
    count: servicios.length
  });
});

app.delete("/api/services/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = servicios.findIndex(s => s.id === id);
  
  if (index > -1) {
    servicios.splice(index, 1);
    res.json({
      success: true,
      message: "Servicio eliminado exitosamente"
    });
  } else {
    res.status(404).json({
      success: false,
      message: "Servicio no encontrado"
    });
  }
});

// API Endpoints para vehículos
app.post("/api/cars", (req, res) => {
  try {
    const vehiculo = {
      id: nextVehicleId++,
      ...req.body,
      fecha: new Date().toISOString()
    };
    vehiculos.push(vehiculo);
    
    res.json({
      success: true,
      message: "Vehículo registrado exitosamente",
      id: vehiculo.id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al registrar vehículo"
    });
  }
});

app.get("/api/cars", (req, res) => {
  res.json({
    success: true,
    data: vehiculos,
    count: vehiculos.length
  });
});

app.delete("/api/cars/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = vehiculos.findIndex(v => v.id === id);
  
  if (index > -1) {
    vehiculos.splice(index, 1);
    res.json({
      success: true,
      message: "Vehículo eliminado exitosamente"
    });
  } else {
    res.status(404).json({
      success: false,
      message: "Vehículo no encontrado"
    });
  }
});

// Endpoint de estadísticas
app.get("/api/stats", (req, res) => {
  res.json({
    success: true,
    stats: {
      totalServicios: servicios.length,
      totalVehiculos: vehiculos.length,
      ultimoServicio: servicios.length > 0 ? servicios[servicios.length - 1] : null,
      ultimoVehiculo: vehiculos.length > 0 ? vehiculos[vehiculos.length - 1] : null
    }
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.url,
    message: "La funcionalidad estará disponible pronto",
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

// Iniciar servidor
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});

server.on("error", (error) => {
  console.error("❌ Error del servidor:", error);
  if (error.code === "EADDRINUSE") {
    console.error(`Puerto ${PORT} está en uso`);
  }
});

// Manejo de señales para cierre limpio
process.on("SIGTERM", () => {
  console.log("🔄 Cerrando servidor...");
  server.close(() => {
    console.log("✅ Servidor cerrado");
    process.exit(0);
  });
});

module.exports = app;
