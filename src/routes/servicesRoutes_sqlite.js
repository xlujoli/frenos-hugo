const express = require("express");
const router = express.Router();
const { getSQLiteConnection } = require("../models/localDb");

// Crear un nuevo servicio
router.post("/", async (req, res) => {
  let db;
  try {
    db = await getSQLiteConnection();

    const { workOrder, plate, work, cost } = req.body;

    // Validar datos requeridos
    if (!workOrder || !plate || !work || !cost) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos",
      });
    }

    // Insertar servicio
    db.run(
      `INSERT INTO services (workOrder, plate, work, cost, service_date) 
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [workOrder, plate.toUpperCase(), work, parseFloat(cost)],
      function (err) {
        if (err) {
          console.error("Error insertando servicio:", err);
          return res.status(500).json({
            success: false,
            message: "Error guardando el servicio",
            error: err.message,
          });
        }

        res.json({
          success: true,
          message: "Servicio registrado exitosamente",
          serviceId: this.lastID,
        });
      }
    );
  } catch (error) {
    console.error("Error en POST /services:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  } finally {
    if (db) {
      db.close();
    }
  }
});

// Obtener servicios por placa
router.get("/plate/:plate", async (req, res) => {
  let db;
  try {
    db = await getSQLiteConnection();
    const { plate } = req.params;

    db.all(
      `SELECT * FROM services WHERE UPPER(plate) = UPPER(?) 
       ORDER BY service_date DESC`,
      [plate],
      (err, rows) => {
        if (err) {
          console.error("Error consultando servicios:", err);
          return res.status(500).json({
            success: false,
            message: "Error consultando servicios",
          });
        }

        res.json({
          success: true,
          services: rows,
          total: rows.length,
        });
      }
    );
  } catch (error) {
    console.error("Error en GET /services/plate:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  } finally {
    if (db) {
      db.close();
    }
  }
});

module.exports = router;
