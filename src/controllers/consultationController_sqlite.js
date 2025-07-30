const { getSQLiteConnection } = require("../models/localDb");

const consultService = async (req, res) => {
  let db;
  try {
    const { plate, workOrder } = req.query;

    if (!plate && !workOrder) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar una placa o número de orden de trabajo",
      });
    }

    db = await getSQLiteConnection();

    let query, params;

    if (workOrder) {
      query = `
        SELECT s.*, c.brand, c.model, c.owner, c.phone 
        FROM services s 
        JOIN cars c ON s.plate = c.plate 
        WHERE s.workOrder = ?
        ORDER BY s.service_date DESC
      `;
      params = [workOrder];
    } else {
      query = `
        SELECT s.*, c.brand, c.model, c.owner, c.phone 
        FROM services s 
        JOIN cars c ON s.plate = c.plate 
        WHERE UPPER(s.plate) = UPPER(?)
        ORDER BY s.service_date DESC
      `;
      params = [plate];
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error("Error consultando servicios:", err);
        return res.status(500).json({
          success: false,
          message: "Error consultando servicios",
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: workOrder
            ? "No se encontró servicio con esa orden de trabajo"
            : "No se encontraron servicios para esa placa",
        });
      }

      res.json({
        success: true,
        services: rows,
        total: rows.length,
        searchType: workOrder ? "workOrder" : "plate",
        searchValue: workOrder || plate,
      });
    });
  } catch (error) {
    console.error("Error en consultService:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  } finally {
    if (db) {
      db.close();
    }
  }
};

module.exports = {
  consultService,
};
