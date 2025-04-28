const express = require('express');
const {
  getShifts,
  getShift,
  createShift,
  updateShift,
  deleteShift
} = require('../controllers/shiftController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(protect, getShifts)
  .post(protect, createShift);

router
  .route('/:id')
  .get(protect, getShift)
  .put(protect, updateShift)
  .delete(protect, deleteShift);

module.exports = router; 