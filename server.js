console.log("--- Executing frenos-hugo/server.js ---");

// Cargar variables de entorno
require("dotenv").config();

const express = require("express");
const path = require("path");
const { initialize, getConnection } = require("./src/models/initDb"); // Import Oracle DB functions

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Añadir este middleware
app.use((req, res, next) => {
  console.log(`--> Incoming Request: ${req.method} ${req.originalUrl}`);
  next(); // Pasa la solicitud al siguiente middleware/ruta
});

// Rutas
// Adjust how routes are loaded, they will use getConnection internally from models
const carsRoutes = require("./src/routes/carsRoutes"); // Export router directly
const servicesRoutes = require("./src/routes/servicesRoutes");
const consultationRoutes = require("./src/routes/consultationRoutes");
const adminRoutes = require("./src/routes/adminRoutes");

app.use("/cars", carsRoutes);
app.use("/services", servicesRoutes);
app.use("/consultation", consultationRoutes);
app.use("/admin", adminRoutes);

// Modify /cars/register to use Oracle DB
app.post("/cars/register", async (req, res) => {
  const { plate, brand, model, owner, phone } = req.body;

  if (!plate || !brand || !model || !owner || !phone) {
    return res
      .status(400)
      .send({ message: "Todos los campos son obligatorios." });
  }

  let formattedPhone = phone.trim();
  if (!formattedPhone.startsWith("+")) {
    formattedPhone = "+57" + formattedPhone.replace(/\s+/g, "");
  } else if (formattedPhone.startsWith("+57")) {
    formattedPhone = "+57" + formattedPhone.substring(3).replace(/\s+/g, "");
  } else {
    formattedPhone = formattedPhone.replace(/\s+/g, "");
  }

  const query = `INSERT INTO cars (id, plate, brand, model, owner, phone) VALUES (car_id_seq.NEXTVAL, :plate, :brand, :model, :owner, :phone)`;
  const params = {
    plate: plate.toUpperCase(),
    brand: brand.toUpperCase(),
    model: model.toUpperCase(),
    owner: owner.toUpperCase(),
    phone: formattedPhone,
  };

  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(query, params, {
      autoCommit: true,
    });

    // For Oracle, result.lastRowid or result.rowsAffected might be useful depending on the statement
    // For INSERT with sequence, getting the ID back might require another query or RETURNING clause if not using auto-generated keys directly
    // For simplicity, we assume success if no error.

    res.status(201).send({
      message: "Vehículo registrado exitosamente.",
      // id: this.lastID, // SQLite specific
      plate: params.plate,
    });
  } catch (err) {
    console.error("Error al registrar el vehículo:", err);
    if (err.errorNum === 1) {
      // ORA-00001: unique constraint violated
      return res.status(409).send({
        message: `La placa ${params.plate} ya está registrada.`,
        error: "PLATE_EXISTS",
      });
    }
    return res.status(500).send({
      message: "Error interno al registrar el vehículo. Intente nuevamente.",
      error: err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("Error closing connection:", closeErr);
      }
    }
  }
});

// Iniciar servidor after DB initialization
async function startServer() {
  try {
    await initialize(); // Initialize Oracle DB schema
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to initialize database or start server:", err);
    process.exit(1); // Exit if DB initialization fails
  }
}

startServer();
