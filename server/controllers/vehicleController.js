const Vehicle = require('../models/Vehicle');

// @desc    Получение всех ТС
// @route   GET /api/vehicles
// @access  Private
exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    
    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Получение одного ТС
// @route   GET /api/vehicles/:id
// @access  Private
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ id: req.params.id });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Транспортное средство не найдено'
      });
    }
    
    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Создание ТС
// @route   POST /api/vehicles
// @access  Private/Admin
exports.createVehicle = async (req, res) => {
  try {
    // Проверяем, существует ли ТС с таким ID
    const vehicleExists = await Vehicle.findOne({ id: req.body.id });
    if (vehicleExists) {
      return res.status(400).json({
        success: false,
        error: 'Транспортное средство с таким ID уже существует'
      });
    }
    
    const vehicle = await Vehicle.create(req.body);
    
    res.status(201).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Обновление ТС
// @route   PUT /api/vehicles/:id
// @access  Private/Admin
exports.updateVehicle = async (req, res) => {
  try {
    let vehicle = await Vehicle.findOne({ id: req.params.id });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Транспортное средство не найдено'
      });
    }
    
    vehicle = await Vehicle.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Удаление ТС
// @route   DELETE /api/vehicles/:id
// @access  Private/Admin
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ id: req.params.id });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Транспортное средство не найдено'
      });
    }
    
    await vehicle.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 