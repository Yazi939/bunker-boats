const express = require('express');
const {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(protect, getVehicles)
  .post(protect, authorize('admin'), createVehicle);

router
  .route('/:id')
  .get(protect, getVehicle)
  .put(protect, authorize('admin'), updateVehicle)
  .delete(protect, authorize('admin'), deleteVehicle);

module.exports = router; 