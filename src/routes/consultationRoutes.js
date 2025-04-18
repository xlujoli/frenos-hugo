const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../../database/frenos.db");
const db = new sqlite3.Database(dbPath);

// Ruta específica primero
router.get("/consult-service", (req, res) => {
  const { plate } = req.query;
  console.log(`Received plate query parameter: ${plate}`); // Log received plate

  if (!plate) {
    console.log("Plate query parameter is missing.");
    return res.status(400).send({ message: "La placa es obligatoria." });
  }

  const upperCasePlate = plate.toUpperCase();
  console.log(`Querying database for plate: ${upperCasePlate}`); // Log plate used in query
  const query = `SELECT * FROM services WHERE plate = ?`;

  db.all(query, [upperCasePlate], (err, rows) => {
    if (err) {
      console.error(
        `Error querying services for plate ${plate.toUpperCase()}:`,
        err
      );
      // Send a more specific server error message
      return res.status(500).send({
        message: `Error interno del servidor al consultar servicios: ${err.message}`,
      });
    }

    if (rows.length === 0) {
      return res.status(404).send({
        message: `No se encontraron servicios para la placa ${plate.toUpperCase()}.`,
      });
    }

    res.status(200).send(rows);
  });
});

// Ruta general después
router.get("/:plate", (req, res) => {
  const { plate } = req.params;
  const query = `SELECT * FROM services WHERE plate = ?`;

  db.all(query, [plate.toUpperCase()], (err, rows) => {
    // Also convert to uppercase here for consistency
    if (err) {
      console.error(
        `Error querying services for plate ${plate.toUpperCase()} (param):`,
        err
      );
      return res
        .status(500)
        .json({ message: `Error interno del servidor: ${err.message}` });
    }
    if (rows.length === 0) {
      return res
        .status(404)
        .json({
          message: `No se encontraron servicios para la placa ${plate.toUpperCase()}.`,
        });
    }
    res.json(rows);
  });
});

module.exports = router;
