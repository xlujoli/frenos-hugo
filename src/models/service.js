const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    licensePlate: {
        type: String,
        required: true,
        unique: true
    },
    completedWork: {
        type: String,
        required: true
    },
    cost: {
        type: Number,
        required: true
    }
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;