const { Shift } = require('../models/initModels');
const { User } = require('../models/initModels');
const { Vehicle } = require('../models/initModels');

// @desc    Получение всех смен
// @route   GET /api/shifts
// @access  Private
exports.getShifts = async (req, res) => {
  try {
    const shifts = await Shift.findAll({
      where: req.query,
      include: [
        { model: User, as: 'user' },
        { model: Vehicle, as: 'vehicle' }
      ]
    });
    
    res.status(200).json({
      success: true,
      count: shifts.length,
      data: shifts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Получение одной смены
// @route   GET /api/shifts/:id
// @access  Private
exports.getShift = async (req, res) => {
  try {
    const shift = await Shift.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user' },
        { model: Vehicle, as: 'vehicle' }
      ]
    });
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        error: 'Смена не найдена'
      });
    }
    
    res.status(200).json({
      success: true,
      data: shift
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Создание смены
// @route   POST /api/shifts
// @access  Private
exports.createShift = async (req, res) => {
  try {
    // Добавляем пользователя к смене
    if (req.user) {
      req.body.userId = req.user.id;
    }
    
    const shift = await Shift.create(req.body);
    
    res.status(201).json({
      success: true,
      data: shift
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Обновление смены
// @route   PUT /api/shifts/:id
// @access  Private
exports.updateShift = async (req, res) => {
  try {
    const shift = await Shift.findByPk(req.params.id);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        error: 'Смена не найдена'
      });
    }
    
    // Проверка владельца смены или админа
    if (shift.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'У вас нет прав для обновления этой смены'
      });
    }
    
    await shift.update(req.body);
    
    res.status(200).json({
      success: true,
      data: shift
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Удаление смены
// @route   DELETE /api/shifts/:id
// @access  Private
exports.deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findByPk(req.params.id);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        error: 'Смена не найдена'
      });
    }
    
    // Проверка владельца смены или админа
    if (shift.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'У вас нет прав для удаления этой смены'
      });
    }
    
    await shift.destroy();
    
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