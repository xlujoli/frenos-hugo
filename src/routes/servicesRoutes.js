const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") }); // Load .env variables

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM;
const twilioClient = require("twilio")(accountSid, authToken);

const dbPath = path.resolve(__dirname, "../../database/frenos.db");
const db = new sqlite3.Database(dbPath);

const ServicesController = require("../controllers/servicesController");
const servicesController = new ServicesController();

router.post("/add-service", servicesController.addService);
router.get(
  "/validate-plate/:licensePlate",
  servicesController.validateLicensePlate
);

// Check if workOrder exists
router.get("/check-workorder/:workOrder", (req, res) => {
  const { workOrder } = req.params;

  if (!workOrder || isNaN(parseInt(workOrder))) {
    return res.status(400).json({ message: "Número de orden inválido." });
  }

  const query = `SELECT COUNT(*) AS count FROM services WHERE workOrder = ?`;

  db.get(query, [workOrder], (err, row) => {
    if (err) {
      console.error("Error checking workOrder existence:", err);
      return res
        .status(500)
        .json({ message: `Error interno al verificar orden: ${err.message}` });
    }

    res.status(200).json({ exists: row && row.count > 0 });
  });
});

// Registrar un servicio
router.post("/register", (req, res) => {
  // Destructure workOrder from the request body
  const { workOrder, plate, work, cost } = req.body;
  const upperCasePlate = plate.toUpperCase();

  // --- Check if workOrder already exists ---
  const checkWorkOrderQuery = `SELECT COUNT(*) AS count FROM services WHERE workOrder = ?`;
  db.get(checkWorkOrderQuery, [workOrder], (err, row) => {
    if (err) {
      console.error("Error checking workOrder:", err);
      return res
        .status(500)
        .json({
          message: `Error interno al verificar orden de trabajo: ${err.message}`,
        });
    }

    if (row && row.count > 0) {
      // Work order already exists
      return res
        .status(409)
        .json({
          message: `El número de orden '${workOrder}' ya está registrado.`,
        }); // 409 Conflict
    }

    // --- WorkOrder is unique, proceed to check plate and get phone number ---
    const checkPlateQuery = `SELECT plate, phone FROM cars WHERE plate = ?`;

    db.get(checkPlateQuery, [upperCasePlate], (err, carRow) => {
      if (err) {
        // Send error message in 'message' property
        return res
          .status(400)
          .json({ message: `Error al verificar placa: ${err.message}` });
      }
      if (!carRow) {
        return res.status(404).json({ message: "Placa no encontrada." });
      }

      // --- Insert Service ---
      // Add workOrder to the query and params
      const insertServiceQuery = `INSERT INTO services (workOrder, plate, work, cost) VALUES (?, ?, ?, ?)`;
      const serviceParams = [
        workOrder,
        upperCasePlate,
        work.toUpperCase(),
        cost,
      ];

      db.run(insertServiceQuery, serviceParams, function (err) {
        if (err) {
          // Send error message in 'message' property
          return res
            .status(400)
            .json({ message: `Error al registrar servicio: ${err.message}` });
        }

        const serviceId = this.lastID;
        const ownerPhone = carRow.phone;

        // --- Send WhatsApp Message using Twilio ---
        if (ownerPhone && accountSid && authToken && twilioWhatsAppFrom) {
          // Ensure phone number is in E.164 format (e.g., +1234567890)
          // You might need to add logic here to format the ownerPhone correctly
          // Assuming ownerPhone is already stored correctly or needs prefixing (e.g., with country code)
          const recipientWhatsApp = `whatsapp:${ownerPhone}`; // Prepend 'whatsapp:'

          const messageDate = new Date().toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          // Include workOrder in the message body
          const messageBody = `Hola! Se ha registrado un nuevo servicio para tu vehículo con placa ${upperCasePlate} el ${messageDate}:\n\nOrden: ${serviceParams[0]}\nTrabajo: ${serviceParams[2]}\nTotal: ${serviceParams[3]}\n\nGracias por confiar en Frenos Hugo.`;

          twilioClient.messages
            .create({
              from: twilioWhatsAppFrom,
              to: recipientWhatsApp,
              body: messageBody,
              // If using templates:
              // contentSid: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Your approved template SID
              // contentVariables: JSON.stringify({ // Variables for the template
              //   '1': upperCasePlate,
              //   '2': messageDate,
              //   '3': serviceParams[1],
              //   '4': serviceParams[2]
              // })
            })
            .then((message) =>
              console.log(
                `WhatsApp message sent successfully to ${recipientWhatsApp}. SID: ${message.sid}`
              )
            )
            .catch((error) =>
              console.error(
                `Error sending WhatsApp message to ${recipientWhatsApp}:`,
                error
              )
            );
          // Note: We don't wait for the message to send before responding to the client
          // to avoid delaying the HTTP response. Sending happens in the background.
        } else {
          if (!ownerPhone) {
            console.log(
              `[WhatsApp] No phone number found for plate ${upperCasePlate}. Cannot send notification.`
            );
          } else {
            console.log(
              "[WhatsApp] Twilio credentials not configured in .env file. Cannot send notification."
            );
          }
        }
        // --- End WhatsApp Send ---

        // Send success response to client
        res
          .status(201)
          .json({ message: "Servicio registrado con éxito", id: serviceId });
      });
    });
  });
});

// Agregar ruta para consultar servicios por placa
router.get("/consult-service", (req, res) => {
  const { plate } = req.query;

  if (!plate) {
    return res.status(400).send({ message: "La placa es obligatoria." });
  }

  const query = `SELECT * FROM services WHERE plate = ?`;

  db.all(query, [plate.toUpperCase()], (err, rows) => {
    if (err) {
      console.error("Error al consultar servicios:", err);
      return res.status(500).send({ message: "Error al consultar servicios." });
    }

    if (rows.length === 0) {
      return res
        .status(404)
        .send({ message: "No se encontraron servicios para esta placa." });
    }

    res.status(200).send(rows);
  });
});

module.exports = router;
