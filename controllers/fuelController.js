const { FuelTransaction, User, Vehicle } = require('../models/initModels');
const { Op } = require('sequelize');

// @desc    Получение всех транзакций
// @route   GET /api/fuel
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    console.log('GET /api/fuel - Starting to process request with query:', req.query);
    // Создаем базовый объект запроса
    let whereClause = {};
    
    // Применяем фильтрацию, если указаны параметры
    if (req.query.fuelType) {
      whereClause.fuelType = req.query.fuelType;
    }
    
    if (req.query.type) {
      whereClause.type = req.query.type;
    }
    
    // Безопасная обработка диапазона дат
    if (req.query.startDate && req.query.endDate) {
      try {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);
        
        // Проверяем валидность дат
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          whereClause.date = {
            [Op.between]: [startDate, endDate]
          };
        } else {
          console.warn('Invalid date format in query:', req.query.startDate, req.query.endDate);
        }
      } catch (dateError) {
        console.error('Error parsing dates:', dateError);
        // Продолжаем выполнение запроса без фильтрации по дате
      }
    }
    
    console.log('Where clause:', JSON.stringify(whereClause, null, 2));
    
    // Пагинация
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const offset = (page - 1) * limit;
    
    // Опции сортировки
    let order = [['date', 'DESC']]; // по умолчанию по дате в обратном порядке
    if (req.query.sort) {
      try {
        const sortParams = req.query.sort.split(',');
        const validOrderOptions = [];
        
        sortParams.forEach(param => {
          // Проверка на валидные поля для сортировки
          let field = param.startsWith('-') ? param.substring(1) : param;
          // Проверяем, что поле существует в модели
          if (FuelTransaction.rawAttributes[field]) {
            if (param.startsWith('-')) {
              validOrderOptions.push([field, 'DESC']);
            } else {
              validOrderOptions.push([field, 'ASC']);
            }
          }
        });
        
        // Используем validOrderOptions только если есть валидные поля
        if (validOrderOptions.length > 0) {
          order = validOrderOptions;
        }
      } catch (sortError) {
        console.error('Error processing sort parameters:', sortError);
        // Продолжаем с сортировкой по умолчанию
      }
    }
    
    console.log('Executing query with pagination:', { page, limit, offset });
    
    // Выполнение запроса с минимальным набором опций
    try {
      const { count, rows } = await FuelTransaction.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order,
        // Отключаем raw для безопасности
        raw: false
      });
      
      console.log(`Query returned ${rows.length} of ${count} total records`);
      
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
      
      console.log('GET /api/fuel - Successfully completed');
      
      res.status(200).json({
        success: true,
        count: rows.length,
        pagination,
        data: rows
      });
    } catch (queryError) {
      console.error('Error in basic query:', queryError);
      // В случае ошибки в запросе, отправляем упрощенный ответ
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении транзакций топлива',
        details: process.env.NODE_ENV === 'development' ? queryError.message : undefined
      });
    }
  } catch (error) {
    console.error('Unhandled error in getTransactions:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Получение одной транзакции
// @route   GET /api/fuel/:id
// @access  Private
exports.getTransaction = async (req, res) => {
  try {
    console.log(`GET /api/fuel/${req.params.id} - Start`);
    // Проверка валидности ID
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        error: 'ID транзакции не указан'
      });
    }
    
    // Упрощаем запрос, убирая включение связанных моделей для диагностики
    const transaction = await FuelTransaction.findByPk(req.params.id);
    
    if (!transaction) {
      console.log(`Transaction with ID ${req.params.id} not found`);
      return res.status(404).json({
        success: false,
        error: 'Транзакция не найдена'
      });
    }
    
    console.log(`GET /api/fuel/${req.params.id} - Success`);
    
    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error(`Error in getTransaction (ID: ${req.params.id}):`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Создание транзакции
// @route   POST /api/fuel
// @access  Private
exports.createTransaction = async (req, res) => {
  try {
    console.log('POST /api/fuel - Start with payload:', {
      type: req.body.type,
      amount: req.body.amount,
      hasUserId: !!req.user
    });
    
    // Добавляем пользователя к транзакции
    if (req.user) {
      req.body.userId = req.user.id;
    }
    
    const transaction = await FuelTransaction.create(req.body);
    console.log(`Transaction created with ID: ${transaction.id}`);
    
    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error in createTransaction:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Обновление транзакции
// @route   PUT /api/fuel/:id
// @access  Private
exports.updateTransaction = async (req, res) => {
  try {
    console.log(`PUT /api/fuel/${req.params.id} - Start`);
    
    let transaction = await FuelTransaction.findByPk(req.params.id);
    
    if (!transaction) {
      console.log(`Transaction with ID ${req.params.id} not found`);
      return res.status(404).json({
        success: false,
        error: 'Транзакция не найдена'
      });
    }
    
    // Проверка на заморозку транзакции
    if (transaction.frozen && req.user.role !== 'admin') {
      console.log(`Attempt to update frozen transaction ${req.params.id} by non-admin user`);
      return res.status(403).json({
        success: false,
        error: 'Нельзя изменять замороженную транзакцию'
      });
    }
    
    // Проверка владельца транзакции или админа
    if (transaction.userId && transaction.userId !== req.user.id && req.user.role !== 'admin') {
      console.log(`Unauthorized attempt to update transaction ${req.params.id} by user ${req.user.id}`);
      return res.status(403).json({
        success: false,
        error: 'У вас нет прав для обновления этой транзакции'
      });
    }
    
    // Отмечаем транзакцию как отредактированную
    req.body.edited = true;
    
    try {
      await transaction.update(req.body);
      console.log(`Transaction ${req.params.id} updated successfully`);
      
      // Получаем обновленную транзакцию
      const updatedTransaction = await FuelTransaction.findByPk(req.params.id);
      
      res.status(200).json({
        success: true,
        data: updatedTransaction
      });
    } catch (updateError) {
      console.error(`Error updating transaction ${req.params.id}:`, updateError);
      res.status(400).json({
        success: false,
        error: updateError.message,
        stack: process.env.NODE_ENV === 'development' ? updateError.stack : undefined
      });
    }
  } catch (error) {
    console.error('Error in updateTransaction:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Удаление транзакции
// @route   DELETE /api/fuel/:id
// @access  Private
exports.deleteTransaction = async (req, res) => {
  try {
    console.log(`DELETE /api/fuel/${req.params.id} - Start`);
    
    const transaction = await FuelTransaction.findByPk(req.params.id);
    
    if (!transaction) {
      console.log(`Transaction with ID ${req.params.id} not found`);
      return res.status(404).json({
        success: false,
        error: 'Транзакция не найдена'
      });
    }
    
    // Проверка на заморозку транзакции
    if (transaction.frozen && req.user.role !== 'admin') {
      console.log(`Attempt to delete frozen transaction ${req.params.id} by non-admin user`);
      return res.status(403).json({
        success: false,
        error: 'Нельзя удалять замороженную транзакцию'
      });
    }
    
    // Проверка владельца транзакции или админа
    if (transaction.userId && transaction.userId !== req.user.id && req.user.role !== 'admin') {
      console.log(`Unauthorized attempt to delete transaction ${req.params.id} by user ${req.user.id}`);
      return res.status(403).json({
        success: false,
        error: 'У вас нет прав для удаления этой транзакции'
      });
    }
    
    await transaction.destroy();
    console.log(`Transaction ${req.params.id} deleted successfully`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(`Error in deleteTransaction (ID: ${req.params.id}):`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 