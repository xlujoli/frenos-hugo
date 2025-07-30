const express = require("express");
const router = express.Router();
const { getConnection } = require("../models/initDb");

// ⚠️ IMPORTANTE: Este endpoint debe ser usado solo para administración
// Considera agregar autenticación/autorización en producción

// Eliminar servicio por ID
router.delete("/services/:id", async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      "DELETE FROM services WHERE id = :id",
      [id],
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: "Servicio no encontrado",
      });
    }

    res.json({
      success: true,
      message: `Servicio con ID ${id} eliminado exitosamente`,
      rowsAffected: result.rowsAffected,
    });
  } catch (error) {
    console.error("Error eliminando servicio:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error cerrando conexión:", err);
      }
    }
  }
});

// Eliminar servicio por número de orden de trabajo
router.delete("/services/workorder/:workOrder", async (req, res) => {
  const { workOrder } = req.params;
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      "DELETE FROM services WHERE workOrder = :workOrder",
      [workOrder],
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: "Servicio con esa orden de trabajo no encontrado",
      });
    }

    res.json({
      success: true,
      message: `Servicio con orden ${workOrder} eliminado exitosamente`,
      rowsAffected: result.rowsAffected,
    });
  } catch (error) {
    console.error("Error eliminando servicio por orden:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error cerrando conexión:", err);
      }
    }
  }
});

// Eliminar vehículo por placa (y todos sus servicios asociados)
router.delete("/cars/:plate", async (req, res) => {
  const { plate } = req.params;
  let connection;

  try {
    connection = await getConnection();

    // Primero eliminar servicios asociados
    const servicesResult = await connection.execute(
      "DELETE FROM services WHERE plate = :plate",
      [plate.toUpperCase()],
      { autoCommit: false } // No hacer commit aún
    );

    // Luego eliminar el vehículo
    const carResult = await connection.execute(
      "DELETE FROM cars WHERE plate = :plate",
      [plate.toUpperCase()],
      { autoCommit: false } // No hacer commit aún
    );

    if (carResult.rowsAffected === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    // Hacer commit de ambas operaciones
    await connection.commit();

    res.json({
      success: true,
      message: `Vehículo ${plate} eliminado exitosamente`,
      servicesDeleted: servicesResult.rowsAffected,
      carsDeleted: carResult.rowsAffected,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error("Error en rollback:", rollbackErr);
      }
    }
    console.error("Error eliminando vehículo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error cerrando conexión:", err);
      }
    }
  }
});

// Listar todos los servicios (para ver qué eliminar)
router.get("/services", async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT id, workOrder, plate, 
       SUBSTR(work, 1, 100) as work_preview, 
       cost, service_date 
       FROM services 
       ORDER BY service_date DESC`
    );

    // Convertir el resultado de Oracle a un formato más legible
    const services = result.rows.map((row) => ({
      id: row[0],
      workOrder: row[1],
      plate: row[2],
      work_preview: row[3],
      cost: row[4],
      service_date: row[5],
    }));

    res.json({
      success: true,
      services: services,
      total: services.length,
    });
  } catch (error) {
    console.error("Error obteniendo servicios:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error cerrando conexión:", err);
      }
    }
  }
});

// Listar todos los vehículos
router.get("/cars", async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      "SELECT id, plate, brand, model, owner, phone FROM cars ORDER BY plate"
    );

    const cars = result.rows.map((row) => ({
      id: row[0],
      plate: row[1],
      brand: row[2],
      model: row[3],
      owner: row[4],
      phone: row[5],
    }));

    res.json({
      success: true,
      cars: cars,
      total: cars.length,
    });
  } catch (error) {
    console.error("Error obteniendo vehículos:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error cerrando conexión:", err);
      }
    }
  }
});

module.exports = router;
