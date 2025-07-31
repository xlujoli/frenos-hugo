const { getDB } = require("../models/postgresDb");

// Crear un nuevo vehículo
const createCar = async (req, res) => {
  try {
    const {
      plate,
      brand,
      model,
      year,
      ownerName,
      ownerPhone,
      ownerEmail,
      notes,
    } = req.body;
    const db = getDB();

    const result = await db.query(
      "INSERT INTO vehiculos (plate, brand, model, year, owner_name, owner_phone, owner_email, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [plate, brand, model, year, ownerName, ownerPhone, ownerEmail, notes]
    );

    res.json({
      success: true,
      message: "Vehículo registrado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creando vehículo:", error);

    // Manejo específico para placa duplicada
    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        message: "Ya existe un vehículo con esa placa",
        error: "Placa duplicada",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al registrar vehículo",
      error: error.message,
    });
  }
};

// Obtener todos los vehículos
const getCars = async (req, res) => {
  try {
    const db = getDB();
    const result = await db.query(
      "SELECT * FROM vehiculos ORDER BY created_at DESC"
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error obteniendo vehículos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener vehículos",
      error: error.message,
    });
  }
};

// Obtener un vehículo por ID
const getCarById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const result = await db.query("SELECT * FROM vehiculos WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error obteniendo vehículo:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener vehículo",
      error: error.message,
    });
  }
};

// Buscar vehículo por placa
const getCarByPlate = async (req, res) => {
  try {
    const { plate } = req.params;
    const db = getDB();

    const result = await db.query("SELECT * FROM vehiculos WHERE plate = $1", [
      plate,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    // También obtener servicios relacionados
    const servicesResult = await db.query(
      "SELECT * FROM servicios WHERE plate = $1 ORDER BY created_at DESC",
      [plate]
    );

    res.json({
      success: true,
      data: {
        vehiculo: result.rows[0],
        servicios: servicesResult.rows,
      },
    });
  } catch (error) {
    console.error("Error obteniendo vehículo por placa:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener vehículo",
      error: error.message,
    });
  }
};

// Actualizar un vehículo
const updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      plate,
      brand,
      model,
      year,
      ownerName,
      ownerPhone,
      ownerEmail,
      notes,
    } = req.body;
    const db = getDB();

    const result = await db.query(
      "UPDATE vehiculos SET plate = $1, brand = $2, model = $3, year = $4, owner_name = $5, owner_phone = $6, owner_email = $7, notes = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9 RETURNING *",
      [plate, brand, model, year, ownerName, ownerPhone, ownerEmail, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Vehículo actualizado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error actualizando vehículo:", error);

    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        message: "Ya existe un vehículo con esa placa",
        error: "Placa duplicada",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar vehículo",
      error: error.message,
    });
  }
};

// Eliminar un vehículo
const deleteCar = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const result = await db.query(
      "DELETE FROM vehiculos WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Vehículo eliminado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error eliminando vehículo:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar vehículo",
      error: error.message,
    });
  }
};

module.exports = {
  createCar,
  getCars,
  getCarById,
  getCarByPlate,
  updateCar,
  deleteCar,
};
