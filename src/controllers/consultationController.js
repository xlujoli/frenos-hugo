const Service = require('../models/service');

const consultationController = {
  consultService: async (req, res) => {
    const { plate, workOrder } = req.query;
    let searchCriteria = "";
    let results = [];

    try {
      if (plate) {
        const upperCasePlate = plate.toUpperCase();
        searchCriteria = `placa ${upperCasePlate}`;
        console.log(`Consulting services for plate: ${upperCasePlate}`);
        results = await Service.findByPlate(upperCasePlate);

      } else if (workOrder) {
        if (isNaN(parseInt(workOrder))) {
          return res.status(400).json({ message: "El número de orden debe ser numérico." });
        }
        searchCriteria = `orden de trabajo ${workOrder}`;
        console.log(`Consulting service for workOrder: ${workOrder}`);
        const service = await Service.findByWorkOrder(parseInt(workOrder));
        if (service) {
          results.push(service);
        }
      } else {
        console.log("Search parameter (plate or workOrder) is missing.");
        return res.status(400).json({
          message: "Se requiere placa u orden de trabajo para la consulta.",
        });
      }

      if (results.length === 0) {
      }
      
      res.status(200).json(results);

    } catch (error) {
      console.error(`Error querying services for ${searchCriteria}:`, error);
      res.status(500).json({
        message: `Error interno del servidor al consultar servicios: ${error.message}`,
      });
    }
  },
};

module.exports = consultationController;