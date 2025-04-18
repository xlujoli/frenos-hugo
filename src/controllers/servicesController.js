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
}

module.exports = ServicesController;
