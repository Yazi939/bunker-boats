const { FuelTransaction, User, Vehicle } = require('../models/initModels');
const { Op } = require('sequelize');

// @desc    Получение всех транзакций
// @route   GET /api/fuel
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    // Создаем базовый объект запроса
    let whereClause = {};
    
    // Применяем фильтрацию, если указаны параметры
    if (req.query.fuelType) {
      whereClause.fuelType = req.query.fuelType;
    }
    
    if (req.query.type) {
      whereClause.type = req.query.type;
    }
    
    if (req.query.startDate && req.query.endDate) {
      whereClause.date = {
        [Op.between]: [req.query.startDate, req.query.endDate]
      };
    }
    
    // Пагинация
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const offset = (page - 1) * limit;
    
    // Опции сортировки
    let order = [['date', 'DESC']]; // по умолчанию по дате в обратном порядке
    if (req.query.sort) {
      const sortParams = req.query.sort.split(',');
      order = sortParams.map(param => {
        if (param.startsWith('-')) {
          return [param.substring(1), 'DESC'];
        }
        return [param, 'ASC'];
      });
    }
    
    // Выполнение запроса с учетом пагинации и сортировки
    const { count, rows } = await FuelTransaction.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'role'] },
        { model: Vehicle, as: 'vehicle', attributes: ['id', 'name', 'registrationNumber'] }
      ]
    });
    
    // Объект пагинации
    const pagination = {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit)
    };
    
    if (page < pagination.pages) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (page > 1) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: rows.length,
      pagination,
      data: rows
    });
  } catch (error) {
    console.error('Error in getTransactions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Получение одной транзакции
// @route   GET /api/fuel/:id
// @access  Private
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await FuelTransaction.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'role'] },
        { model: Vehicle, as: 'vehicle', attributes: ['id', 'name', 'registrationNumber'] }
      ]
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Транзакция не найдена'
      });
    }
    
    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Создание транзакции
// @route   POST /api/fuel
// @access  Private
exports.createTransaction = async (req, res) => {
  try {
    // Добавляем пользователя к транзакции
    if (req.user) {
      req.body.userId = req.user.id;
    }
    
    const transaction = await FuelTransaction.create(req.body);
    
    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error in createTransaction:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Обновление транзакции
// @route   PUT /api/fuel/:id
// @access  Private
exports.updateTransaction = async (req, res) => {
  try {
    let transaction = await FuelTransaction.findByPk(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Транзакция не найдена'
      });
    }
    
    // Проверка на заморозку транзакции
    if (transaction.frozen && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Нельзя изменять замороженную транзакцию'
      });
    }
    
    // Проверка владельца транзакции или админа
    if (transaction.userId && transaction.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'У вас нет прав для обновления этой транзакции'
      });
    }
    
    // Отмечаем транзакцию как отредактированную
    req.body.edited = true;
    
    await transaction.update(req.body);
    
    const updatedTransaction = await FuelTransaction.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'role'] },
        { model: Vehicle, as: 'vehicle', attributes: ['id', 'name', 'registrationNumber'] }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: updatedTransaction
    });
  } catch (error) {
    console.error('Error in updateTransaction:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Удаление транзакции
// @route   DELETE /api/fuel/:id
// @access  Private
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await FuelTransaction.findByPk(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Транзакция не найдена'
      });
    }
    
    // Проверка на заморозку транзакции
    if (transaction.frozen && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Нельзя удалять замороженную транзакцию'
      });
    }
    
    // Проверка владельца транзакции или админа
    if (transaction.userId && transaction.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'У вас нет прав для удаления этой транзакции'
      });
    }
    
    await transaction.destroy();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error in deleteTransaction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 