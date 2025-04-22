console.log("--- Executing frenos-hugo/server.js ---");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
// Use port provided by environment (Render) or default to 3000
const PORT = process.env.PORT || 3000;

const dbPath = path.resolve(__dirname, "database", "frenos.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err);
  } else {
    console.log("Conexión exitosa a la base de datos en", dbPath);
  }
});

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Añadir este middleware
app.use((req, res, next) => {
  console.log(`--> Incoming Request: ${req.method} ${req.originalUrl}`);
  next(); // Pasa la solicitud al siguiente middleware/ruta
});

// Rutas
// Pass the db connection to the routes function
const carsRoutes = require("./src/routes/carsRoutes")(db);
const servicesRoutes = require("./src/routes/servicesRoutes"); // Assuming this might need db too, adjust if necessary
const consultationRoutes = require("./src/routes/consultationRoutes"); // Assuming this might need db too, adjust if necessary

app.use("/cars", carsRoutes);
app.use("/services", servicesRoutes);
app.use("/consultation", consultationRoutes);

app.post("/cars/register", (req, res) => {
  const { plate, brand, model, owner, phone } = req.body;

  if (!plate || !brand || !model || !owner || !phone) {
    return res
      .status(400)
      .send({ message: "Todos los campos son obligatorios." });
  }

  // Prepend +57 if not already present
  let formattedPhone = phone.trim(); // Remove leading/trailing whitespace
  if (!formattedPhone.startsWith("+")) {
    // If it doesn't start with +, assume it needs the country code
    formattedPhone = "+57" + formattedPhone.replace(/\s+/g, ""); // Remove internal spaces too
  } else if (formattedPhone.startsWith("+57")) {
    // If it already starts with +57, just remove internal spaces
    formattedPhone = "+57" + formattedPhone.substring(3).replace(/\s+/g, "");
  } else {
    // If it starts with a different +, just remove internal spaces
    formattedPhone = formattedPhone.replace(/\s+/g, "");
  }

  const query = `INSERT INTO cars (plate, brand, model, owner, phone) VALUES (?, ?, ?, ?, ?)`;
  const params = [
    plate.toUpperCase(),
    brand.toUpperCase(),
    model.toUpperCase(),
    owner.toUpperCase(),
    formattedPhone, // Use the formatted phone number
  ];

  db.run(query, params, function (err) {
    if (err) {
      console.error("Error al registrar el vehículo:", err);
      // Check for UNIQUE constraint violation (plate already exists)
      if (err.message.includes("UNIQUE constraint failed: cars.plate")) {
        return res.status(409).send({
          // 409 Conflict
          message: `La placa ${params[0]} ya está registrada.`,
          error: "PLATE_EXISTS",
        });
      }
      return res.status(500).send({
        message: "Error interno al registrar el vehículo. Intente nuevamente.",
        error: err.message,
      });
    }

    // Return the registered plate in the success response
    res.status(201).send({
      message: "Vehículo registrado exitosamente.",
      id: this.lastID,
      plate: params[0],
    }); // Added plate to response
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  // Log the actual port being used
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
