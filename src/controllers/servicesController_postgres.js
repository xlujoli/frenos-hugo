const { getDB } = require("../models/postgresDb");

// Crear un nuevo servicio
const createService = async (req, res) => {
  try {
    const { workOrder, plate, serviceType, description, cost } = req.body;
    const db = getDB();

    const result = await db.query(
      "INSERT INTO servicios (work_order, plate, service_type, description, cost) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [workOrder, plate, serviceType, description, cost]
    );

    res.json({
      success: true,
      message: "Servicio registrado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creando servicio:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar servicio",
      error: error.message,
    });
  }
};

// Obtener todos los servicios
const getServices = async (req, res) => {
  try {
    const db = getDB();
    const result = await db.query(
      "SELECT * FROM servicios ORDER BY created_at DESC"
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error obteniendo servicios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener servicios",
      error: error.message,
    });
  }
};

// Obtener un servicio por ID
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const result = await db.query("SELECT * FROM servicios WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Servicio no encontrado",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error obteniendo servicio:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener servicio",
      error: error.message,
    });
  }
};

// Actualizar un servicio
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { workOrder, plate, serviceType, description, cost, status } =
      req.body;
    const db = getDB();

    const result = await db.query(
      "UPDATE servicios SET work_order = $1, plate = $2, service_type = $3, description = $4, cost = $5, status = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *",
      [workOrder, plate, serviceType, description, cost, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Servicio no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Servicio actualizado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error actualizando servicio:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar servicio",
      error: error.message,
    });
  }
};

// Eliminar un servicio
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const result = await db.query(
      "DELETE FROM servicios WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Servicio no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Servicio eliminado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error eliminando servicio:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar servicio",
      error: error.message,
    });
  }
};

// Obtener estadísticas de servicios
const getServiceStats = async (req, res) => {
  try {
    const db = getDB();

    const totalResult = await db.query(
      "SELECT COUNT(*) as total FROM servicios"
    );
    const statusResult = await db.query(
      "SELECT status, COUNT(*) as count FROM servicios GROUP BY status"
    );
    const monthlyResult = await db.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count,
        SUM(cost) as total_revenue
      FROM servicios 
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `);

    res.json({
      success: true,
      stats: {
        total: parseInt(totalResult.rows[0].total),
        byStatus: statusResult.rows,
        monthly: monthlyResult.rows,
      },
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: error.message,
    });
  }
};

module.exports = {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  getServiceStats,
};
