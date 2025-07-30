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
    version: "2.0.0"
  });
});

// Ruta de información
app.get("/info", (req, res) => {
  res.json({
    app: "Frenos Hugo",
    version: "2.0.0 - Híbrido",
    database: "SQLite (Público)",
    admin: "Disponible en Oracle APEX",
    status: "✅ Funcionando"
  });
});

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.url,
    message: "La funcionalidad estará disponible pronto"
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

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});

server.on('error', (error) => {
  console.error('❌ Error del servidor:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Puerto ${PORT} está en uso`);
  }
});

// Manejo de señales para cierre limpio
process.on('SIGTERM', () => {
  console.log('🔄 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

module.exports = app;
