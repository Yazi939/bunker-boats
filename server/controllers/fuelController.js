const { FuelTransaction, User, Vehicle } = require('../models/initModels');
const { Op } = require('sequelize');
const { sequelize } = require('../models/initModels');

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
    // Используем только существующие в базе данных колонки
    const { count, rows } = await FuelTransaction.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order,
      attributes: [
        'id', 'date', 'type', 'amount', 'price', 'totalCost', 
        'fuelType', 'source', 'destination', 'notes', 
        'createdAt', 'updatedAt', 'userId', 'vehicleId'
      ],
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'role'] },
        { model: Vehicle, as: 'vehicle', attributes: ['id', 'name', 'registrationNumber'] }
      ]
    });
    
    // Модифицируем ответ для совместимости с клиентом
    const transactions = rows.map(transaction => {
      // Преобразуем объект Sequelize в чистый объект
      const plainTransaction = transaction.get({ plain: true });
      
      // Добавляем недостающие поля программно
      
      // Гарантируем наличие ключа
      if (!plainTransaction.key) {
        plainTransaction.key = `tx-${plainTransaction.id}-${Date.now()}`;
      }
      
      // Добавляем поле volume из amount
      if (plainTransaction.volume === undefined && plainTransaction.amount !== undefined) {
        plainTransaction.volume = plainTransaction.amount;
      } else if (plainTransaction.amount === undefined && plainTransaction.volume !== undefined) {
        plainTransaction.amount = plainTransaction.volume;
      } else if (plainTransaction.volume === undefined && plainTransaction.amount === undefined) {
        plainTransaction.volume = 0;
        plainTransaction.amount = 0;
      }
      
      // Добавляем недостающие поля со значениями по умолчанию
      if (plainTransaction.frozen === undefined) plainTransaction.frozen = false;
      if (plainTransaction.edited === undefined) plainTransaction.edited = false;
      
      // Преобразуем timestamp если нужно
      if (!plainTransaction.timestamp && plainTransaction.date) {
        plainTransaction.timestamp = new Date(plainTransaction.date).getTime();
      }
      
      return plainTransaction;
    });
    
    // Возвращаем массив данных вместо объекта success/data
    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Error in getTransactions:', error);
    // В случае ошибки возвращаем пустой массив для совместимости с клиентом
    res.status(500).json([]);
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
    
    // Устанавливаем значение amount, если оно не указано
    if (req.body.amount === undefined || req.body.amount === null) {
      // Используем volume как значение по умолчанию, или 0 если volume тоже не указан
      req.body.amount = req.body.volume || 0;
    }

    // Обеспечиваем, что volume также установлен
    if (req.body.volume === undefined || req.body.volume === null) {
      req.body.volume = req.body.amount || 0;
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
    
    // Устанавливаем значение amount, если оно не указано
    if (req.body.amount === undefined || req.body.amount === null) {
      // Используем volume из запроса или из существующей транзакции
      req.body.amount = req.body.volume || transaction.volume || 0;
    }

    // Обеспечиваем, что volume также установлен
    if (req.body.volume === undefined || req.body.volume === null) {
      req.body.volume = req.body.amount || transaction.amount || 0;
    }
    
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

// @desc    Создание транзакции через прямой SQL
// @route   POST /api/fuel/direct
// @access  Public
exports.createTransactionDirect = async (req, res) => {
  try {
    console.log('💉 POST /api/fuel/direct - START REQUEST');
    console.log('💉 Request body:', JSON.stringify(req.body, null, 2));
    
    // Получаем данные из запроса
    const { type, volume, price, totalCost, fuelType, supplier, timestamp, date, key } = req.body;
    
    // Устанавливаем значения по умолчанию
    const safeType = type || 'purchase';
    const safeVolume = volume || 0;
    const safePrice = price || 0;
    const safeTotalCost = totalCost || (safeVolume * safePrice);
    const safeFuelType = fuelType || 'gasoline_95';
    const safeSupplier = supplier || null;
    const safeDate = date ? new Date(date) : (timestamp ? new Date(timestamp) : new Date());
    const safeKey = key || `direct-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Выполняем прямой SQL-запрос, обходя ORM
    const query = `
      INSERT INTO "FuelTransactions" 
      ("type", "volume", "amount", "price", "totalCost", "fuelType", "supplier", "date", "key", "createdAt", "updatedAt")
      VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      RETURNING *
    `;
    
    const values = [
      safeType,
      safeVolume,
      safeVolume, // amount = volume
      safePrice, 
      safeTotalCost,
      safeFuelType,
      safeSupplier,
      safeDate,
      safeKey
    ];
    
    console.log('💉 Executing SQL with values:', values);
    
    const result = await sequelize.query(query, {
      replacements: values,
      type: sequelize.QueryTypes.INSERT,
      raw: true
    });
    
    console.log('💉 Transaction created with direct SQL');
    
    res.status(201).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('💉 Error in direct transaction creation:', error);
    
    res.status(500).json({
      success: false,
      error: 'Ошибка при создании транзакции через прямой SQL',
      details: error.message
    });
  }
}; 