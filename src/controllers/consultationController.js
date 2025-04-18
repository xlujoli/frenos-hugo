class ConsultationController {
    constructor(serviceModel) {
        this.serviceModel = serviceModel;
    }

    async getServicesByLicensePlate(req, res) {
        const { licensePlate } = req.params;

        try {
            const services = await this.serviceModel.find({ licensePlate });
            if (services.length === 0) {
                return res.status(404).json({ message: 'No services found for this license plate.' });
            }
            return res.status(200).json(services);
        } catch (error) {
            return res.status(500).json({ message: 'Error retrieving services.', error });
        }
    }
}

export default ConsultationController;