const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database/frenos.db");

const router = express.Router();

// Verificar si la placa existe
router.get("/check/:plate", (req, res) => {
  const { plate } = req.params;
  const query = `SELECT COUNT(*) AS count FROM cars WHERE plate = ?`;

  db.get(query, [plate], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Error al verificar la placa." });
    }
    res.json({ exists: row.count > 0 });
  });
});

module.exports = router;
