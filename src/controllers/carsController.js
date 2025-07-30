const Car = require("../models/car"); // Import the Car model

// Changed from class to an object exporting functions
const carsController = {
  // Renamed from validateLicensePlate and updated to use Car.findByPlate
  checkCarExists: async (req, res) => {
    const { plate } = req.params;

    try {
      const car = await Car.findByPlate(plate.toUpperCase());
      if (car) {
        // If car is found, it exists. Send relevant car data if needed or just existence.
        // For now, just confirming existence and sending basic car info.
        res.json({
          exists: true,
          // You can include car details if the frontend needs them upon checking
          // car: { plate: car.plate, owner: car.owner, brand: car.brand, model: car.model, phone: car.phone }
        });
      } else {
        res.json({ exists: false }); // Changed to 200 with exists: false as per common practice
      }
    } catch (error) {
      console.error("Error in checkCarExists:", error);
      res
        .status(500)
        .json({
          message: "Error al verificar la placa.",
          error: error.message,
        });
    }
  },

  // The addCar/registerCar logic is currently in server.js
  // If you want to move it here, it would look something like this:
  /*
  registerCar: async (req, res) => {
    const { plate, brand, model, owner, phone } = req.body;

    if (!plate || !brand || !model || !owner || !phone) {
      return res
        .status(400)
        .send({ message: "Todos los campos son obligatorios." });
    }

    // Phone formatting can be done here or remain in a utility function/model
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+57" + formattedPhone.replace(/\s+/g, "");
    } else if (formattedPhone.startsWith("+57")) {
      formattedPhone = "+57" + formattedPhone.substring(3).replace(/\s+/g, "");
    } else {
      formattedPhone = formattedPhone.replace(/\s+/g, "");
    }

    try {
      const newCar = await Car.create({
        plate: plate.toUpperCase(),
        brand: brand.toUpperCase(),
        model: model.toUpperCase(),
        owner: owner.toUpperCase(),
        phone: formattedPhone,
      });
      res.status(201).send({
        message: "Vehículo registrado exitosamente.",
        car: newCar, // Send the created car object
      });
    } catch (err) {
      console.error("Error al registrar el vehículo:", err);
      if (err.message.includes("ya está registrada")) { // Check for unique constraint error message from model
        return res.status(409).send({
          message: err.message,
          error: "PLATE_EXISTS",
        });
      }
      return res.status(500).send({
        message: "Error interno al registrar el vehículo. Intente nuevamente.",
        error: err.message,
      });
    }
  }
  */
};

module.exports = carsController;
