const express = require("express");

// Export a function that takes db as an argument
module.exports = function (db) {
  const router = express.Router();

  // Verificar si la placa existe
  router.get("/check/:plate", (req, res) => {
    const { plate } = req.params;
    const query = `SELECT COUNT(*) AS count FROM cars WHERE plate = ?`;

    // Use the passed-in db object
    db.get(query, [plate.toUpperCase()], (err, row) => {
      if (err) {
        console.error("Error en /cars/check/:plate:", err); // Added logging
        return res
          .status(500)
          .json({ error: "Error en base de datos al verificar la placa." }); // More specific error
      }
      res.json({ exists: row.count > 0 });
    });
  });

  // Add other /cars routes inside this function if they also need the db object

  return router; // Return the configured router
};
