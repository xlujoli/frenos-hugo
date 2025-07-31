const express = require("express");
const router = express.Router();
const {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  getServiceStats,
} = require("../controllers/servicesController_postgres");

// Rutas para servicios
router.post("/", createService);
router.get("/", getServices);
router.get("/stats", getServiceStats);
router.get("/:id", getServiceById);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

module.exports = router;
