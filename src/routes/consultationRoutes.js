const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../../database/frenos.db");
const db = new sqlite3.Database(dbPath);

// Ruta específica primero
router.get("/consult-service", (req, res) => {
  const { plate, workOrder } = req.query;
  // Select columns explicitly and join with cars table
  let query = `
    SELECT 
      s.id, s.workOrder, s.plate, s.work, s.cost, s.date, 
      c.brand, c.model, c.owner, c.phone 
    FROM services s 
    LEFT JOIN cars c ON s.plate = c.plate 
    WHERE`;
  let params = [];
  let searchCriteria = "";

  if (plate) {
    const upperCasePlate = plate.toUpperCase();
    query += " s.plate = ?"; // Specify table alias 's'
    params.push(upperCasePlate);
    searchCriteria = `placa ${upperCasePlate}`;
    console.log(`Querying database for plate: ${upperCasePlate}`);
  } else if (workOrder) {
    query += " s.workOrder = ?"; // Specify table alias 's'
    params.push(workOrder);
    searchCriteria = `orden de trabajo ${workOrder}`;
    console.log(`Querying database for workOrder: ${workOrder}`);
  } else {
    console.log("Search parameter (plate or workOrder) is missing.");
    return res
      .status(400)
      .send({
        message: "Se requiere placa u orden de trabajo para la consulta.",
      });
  }

  // Add ordering
  query += " ORDER BY s.date DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(`Error querying services for ${searchCriteria}:`, err);
      return res.status(500).send({
        message: `Error interno del servidor al consultar servicios: ${err.message}`,
      });
    }

    // No need for 404 here, just send the (potentially empty) array
    res.status(200).send(rows);
  });
});

// Remove or comment out the general /:plate route if it's redundant now
/*
router.get("/:plate", (req, res) => {
  // ... old code ...
});
*/

module.exports = router;
