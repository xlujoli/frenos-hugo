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

// Registrar un servicio
router.post("/register", (req, res) => {
  const { plate, work, cost } = req.body;
  const upperCasePlate = plate.toUpperCase();

  // --- Check plate and get phone number ---
  const checkPlateQuery = `SELECT plate, phone FROM cars WHERE plate = ?`;

  db.get(checkPlateQuery, [upperCasePlate], (err, carRow) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!carRow) {
      return res.status(404).json({ message: "Placa no encontrada." });
    }

    // --- Insert Service ---
    const insertServiceQuery = `INSERT INTO services (plate, work, cost) VALUES (?, ?, ?)`;
    const serviceParams = [upperCasePlate, work.toUpperCase(), cost];

    db.run(insertServiceQuery, serviceParams, function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
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

        const messageBody = `Hola! Se ha registrado un nuevo servicio para tu vehículo con placa ${upperCasePlate} el ${messageDate}:\n\nTrabajo: ${serviceParams[1]}\nTotal: ${serviceParams[2]}\n\nGracias por confiar en Frenos Hugo.`; // Changed Costo to Total

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
