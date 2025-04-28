const Shift = require('../models/Shift');

// @desc    Получение всех смен
// @route   GET /api/shifts
// @access  Private
exports.getShifts = async (req, res) => {
  try {
    let query;
    
    // Копируем req.query
    const reqQuery = { ...req.query };
    
    // Поля для исключения
    const removeFields = ['select', 'sort', 'page', 'limit'];
    
    // Удаляем поля из запроса
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Создаем строку запроса
    let queryStr = JSON.stringify(reqQuery);
    
    // Создаем операторы ($gt, $gte, и т.д.)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Поиск смен
    query = Shift.find(JSON.parse(queryStr));
    
    // Выбор полей
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }
    
    // Сортировка
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-timestamp');
    }
    
    // Пагинация
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Shift.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(startIndex).limit(limit);
    
    // Выполнение запроса
    const shifts = await query;
    
    // Объект пагинации
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: shifts.length,
      pagination,
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
    const shift = await Shift.findById(req.params.id);
    
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
      req.body.user = req.user.id;
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
    let shift = await Shift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        error: 'Смена не найдена'
      });
    }
    
    // Проверка владельца смены или админа
    if (shift.user && shift.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'У вас нет прав для обновления этой смены'
      });
    }
    
    shift = await Shift.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
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
    const shift = await Shift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        error: 'Смена не найдена'
      });
    }
    
    // Проверка владельца смены или админа
    if (shift.user && shift.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'У вас нет прав для удаления этой смены'
      });
    }
    
    await shift.deleteOne();
    
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