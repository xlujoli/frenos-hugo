const Service = require("../models/service");
const Car = require("../models/car");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM;
let twilioClient;
if (accountSid && authToken) {
  twilioClient = require("twilio")(accountSid, authToken);
} else {
  console.warn(
    "[Twilio] Account SID or Auth Token not configured. WhatsApp notifications will be disabled."
  );
}

class ServicesController {
  constructor(serviceModel) {
    this.serviceModel = serviceModel;
  }

  async addService(req, res) {
    const { plate, work, cost } = req.body;

    try {
      const newService = new this.serviceModel({
        plate: plate.toUpperCase(),
        work: work.toUpperCase(),
        cost,
      });
      await newService.save();
      return res.status(201).json(newService);
    } catch (error) {
      return res.status(500).json({ message: "Error adding service.", error });
    }
  }

  async validateLicensePlate(req, res) {
    const { licensePlate } = req.body;

    try {
      const existingService = await this.serviceModel.findOne({ licensePlate });
      if (existingService) {
        return res.status(200).json({ message: "License plate exists" });
      } else {
        return res.status(404).json({ message: "License plate not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error validating license plate", error });
    }
  }

  getNextWorkOrder = async (req, res) => {
    try {
      const nextWorkOrder = await Service.getNextWorkOrder();
      res.status(200).json({ nextWorkOrder });
    } catch (error) {
      console.error("Error getting next work order:", error);
      res.status(500).json({
        message: "Error al obtener el siguiente número de orden.",
        error: error.message,
      });
    }
  };

  checkWorkOrderExists = async (req, res) => {
    const { workOrder } = req.params;
    if (!workOrder || isNaN(parseInt(workOrder))) {
      return res.status(400).json({ message: "Número de orden inválido." });
    }
    try {
      const service = await Service.findByWorkOrder(parseInt(workOrder));
      res.status(200).json({ exists: !!service });
    } catch (error) {
      console.error("Error checking workOrder existence:", error);
      res.status(500).json({
        message: "Error interno al verificar orden de trabajo.",
        error: error.message,
      });
    }
  };

  registerService = async (req, res) => {
    const { workOrder, plate, work, cost } = req.body;

    // Validate input
    if (!workOrder || !plate || !work || cost === undefined) {
      return res.status(400).json({
        message:
          "Todos los campos son obligatorios (workOrder, plate, work, cost).",
      });
    }
    if (isNaN(parseInt(workOrder))) {
      return res
        .status(400)
        .json({ message: "El número de orden debe ser un número." });
    }
    if (isNaN(parseFloat(cost))) {
      return res.status(400).json({ message: "El costo debe ser un número." });
    }

    const upperCasePlate = plate.toUpperCase();

    try {
      // Check if workOrder already exists
      const existingServiceByWorkOrder = await Service.findByWorkOrder(
        parseInt(workOrder)
      );
      if (existingServiceByWorkOrder) {
        return res.status(409).json({
          message: `El número de orden '${workOrder}' ya está registrado.`,
        });
      }

      // Check if car exists and get phone number
      const car = await Car.findByPlate(upperCasePlate);
      if (!car) {
        return res
          .status(404)
          .json({ message: `Placa '${upperCasePlate}' no encontrada.` });
      }
      const ownerPhone = car.phone; // Assuming car model has a 'phone' property

      // Create the service
      const newService = await Service.create({
        workOrder: parseInt(workOrder),
        plate: upperCasePlate,
        work: work, // Assuming work description is already a string
        cost: parseFloat(cost),
      });

      // Send WhatsApp Message using Twilio
      if (twilioClient && ownerPhone && twilioWhatsAppFrom) {
        const recipientWhatsApp = `whatsapp:${ownerPhone}`;
        const messageDate = newService.service_date
          ? new Date(newService.service_date).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : new Date().toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

        const messageBody = `Hola! Se ha registrado un nuevo servicio para tu vehículo con placa ${upperCasePlate} el ${messageDate}:\n\nOrden: ${newService.workOrder}\nTrabajo: ${newService.work}\nTotal: ${newService.cost}\n\nGracias por confiar en Frenos Hugo.`;

        twilioClient.messages
          .create({
            from: twilioWhatsAppFrom,
            to: recipientWhatsApp,
            body: messageBody,
          })
          .then((message) =>
            console.log(
              `WhatsApp message sent successfully to ${recipientWhatsApp}. SID: ${message.sid}`
            )
          )
          .catch((error) =>
            console.error(
              `Error sending WhatsApp message to ${recipientWhatsApp}:`,
              error.message
            )
          );
      } else {
        if (!twilioClient) {
          console.log(
            "[Twilio] Twilio client not initialized. Cannot send WhatsApp notification."
          );
        } else if (!ownerPhone) {
          console.log(
            `[Twilio] No phone number found for plate ${upperCasePlate}. Cannot send notification.`
          );
        } else {
          console.log(
            "[Twilio] Twilio 'from' number not configured. Cannot send notification."
          );
        }
      }

      res.status(201).json({
        message: "Servicio registrado con éxito",
        service: newService,
      });
    } catch (error) {
      console.error("Error al registrar el servicio:", error);
      if (error.message.includes("parent key not found")) {
        // ORA-02291
        return res.status(404).json({
          message: `Error de integridad: La placa '${upperCasePlate}' podría no existir o haber otro problema de referencia.`,
        });
      }
      res.status(500).json({
        message: "Error interno al registrar el servicio.",
        error: error.message,
      });
    }
  };

  getServicesByPlate = async (req, res) => {
    const { plate } = req.query; // Changed from req.params to req.query to match route

    if (!plate) {
      return res.status(400).json({ message: "La placa es obligatoria." });
    }
    try {
      const services = await Service.findByPlate(plate.toUpperCase());
      if (services.length === 0) {
        return res
          .status(404)
          .json({ message: "No se encontraron servicios para esta placa." });
      }
      res.status(200).json(services);
    } catch (error) {
      console.error("Error al consultar servicios por placa:", error);
      res.status(500).json({
        message: "Error al consultar servicios.",
        error: error.message,
      });
    }
  };
}

// Create instance and export methods directly
const serviceController = new ServicesController(Service);

module.exports = {
  addService: serviceController.addService,
  getNextWorkOrder: serviceController.getNextWorkOrder,
  checkWorkOrderExists: serviceController.checkWorkOrderExists,
  registerService: serviceController.registerService,
  getServicesByPlate: serviceController.getServicesByPlate,
};
