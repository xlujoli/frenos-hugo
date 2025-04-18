export default class CarsController {
  constructor(carModel) {
    this.carModel = carModel;
  }

  async addCar(req, res) {
    const { licensePlate, brand, model, owner, phoneNumber } = req.body;

    try {
      const existingCar = await this.carModel.findOne({
        licensePlate: licensePlate.toUpperCase(),
      });
      if (existingCar) {
        return res
          .status(400)
          .json({ message: "Car with this license plate already exists." });
      }

      const newCar = new this.carModel({
        licensePlate: licensePlate.toUpperCase(),
        brand: brand.toUpperCase(),
        model: model.toUpperCase(),
        owner: owner.toUpperCase(),
        phoneNumber: phoneNumber.toUpperCase(),
      });
      await newCar.save();
      return res.status(201).json(newCar);
    } catch (error) {
      return res.status(500).json({ message: "Error adding car.", error });
    }
  }

  async validateLicensePlate(req, res) {
    const { licensePlate } = req.params;

    try {
      const existingCar = await this.carModel.findOne({ licensePlate });
      if (existingCar) {
        return res.status(200).json({ exists: true });
      } else {
        return res.status(404).json({ exists: false });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error validating license plate.", error });
    }
  }
}
