const express = require("express");
const router = express.Router();
const { getSQLiteConnection } = require("../models/localDb");

// Crear un nuevo vehículo
router.post("/", async (req, res) => {
  let db;
  try {
    db = await getSQLiteConnection();
    
    const { plate, brand, model, owner, phone } = req.body;
    
    // Validar datos requeridos
    if (!plate || !brand || !model || !owner || !phone) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos"
      });
    }

    // Insertar vehículo
    db.run(
      `INSERT INTO cars (plate, brand, model, owner, phone, created_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [plate.toUpperCase(), brand, model, owner, phone],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({
              success: false,
              message: "Ya existe un vehículo con esa placa"
            });
          }
          
          console.error("Error insertando vehículo:", err);
          return res.status(500).json({
            success: false,
            message: "Error guardando el vehículo",
            error: err.message
          });
        }

        res.json({
          success: true,
          message: "Vehículo registrado exitosamente",
          carId: this.lastID
        });
      }
    );
  } catch (error) {
    console.error("Error en POST /cars:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  } finally {
    if (db) {
      db.close();
    }
  }
});

// Obtener vehículo por placa
router.get("/:plate", async (req, res) => {
  let db;
  try {
    db = await getSQLiteConnection();
    const { plate } = req.params;

    db.get(
      `SELECT * FROM cars WHERE UPPER(plate) = UPPER(?)`,
      [plate],
      (err, row) => {
        if (err) {
          console.error("Error consultando vehículo:", err);
          return res.status(500).json({
            success: false,
            message: "Error consultando vehículo"
          });
        }

        if (!row) {
          return res.status(404).json({
            success: false,
            message: "Vehículo no encontrado"
          });
        }

        res.json({
          success: true,
          car: row
        });
      }
    );
  } catch (error) {
    console.error("Error en GET /cars:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  } finally {
    if (db) {
      db.close();
    }
  }
});

module.exports = router;
