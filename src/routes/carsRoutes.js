const express = require("express");
const carController = require("../controllers/carsController");

const router = express.Router();

// Verificar si la placa existe - Updated to use carController
router.get("/check/:plate", carController.checkCarExists);

// Registrar un nuevo vehículo - This route is now in server.js, consider moving logic to controller if preferred
// router.post("/register", carController.registerCar); // Example if you move it from server.js

// Add other /cars routes here, calling controller functions
// Example: router.get("/:plate", carController.getCarDetails);

module.exports = router; // Export the router directly
