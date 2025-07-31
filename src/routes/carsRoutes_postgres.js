const express = require('express');
const router = express.Router();
const {
  createCar,
  getCars,
  getCarById,
  getCarByPlate,
  updateCar,
  deleteCar
} = require('../controllers/carsController_postgres');

// Rutas para vehículos
router.post('/', createCar);
router.get('/', getCars);
router.get('/:id', getCarById);
router.get('/plate/:plate', getCarByPlate);
router.put('/:id', updateCar);
router.delete('/:id', deleteCar);

module.exports = router;
