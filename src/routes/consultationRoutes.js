const express = require("express");
const router = express.Router();

const consultationController = require("../controllers/consultationController");

// Route to consult services by plate or workOrder
router.get("/consult-service", consultationController.consultService);

module.exports = router;
