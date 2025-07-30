const express = require("express");
const router = express.Router();
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") }); // Load .env variables

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM;
const twilioClient = require("twilio")(accountSid, authToken);

// Import the Oracle-compatible controller
const servicesController = require("../controllers/servicesController");

// Check if workOrder exists - Updated to use servicesController
router.get(
  "/check-workorder/:workOrder",
  servicesController.checkWorkOrderExists
);

// Registrar un servicio - Updated to use servicesController
router.post("/register", servicesController.registerService);

// Consultar servicios por placa - Updated to use servicesController
router.get("/consult-service", servicesController.getServicesByPlate);

// New route to get the next available work order number
router.get("/next-workorder", servicesController.getNextWorkOrder);

module.exports = router;
