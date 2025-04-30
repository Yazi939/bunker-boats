const { FuelTransaction, User, Vehicle } = require('../models/initModels');
const { Op } = require('sequelize');

// @desc    Получение всех транзакций
// @route   GET /api/fuel
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    console.log('GET /api/fuel - Starting to process request');
    console.log('Request query:', JSON.stringify(req.query));
    console.log('Request headers:', JSON.stringify(req.headers));
    console.log('User info:', req.user);
    
    // Фиксируем потенциальные проблемы
    console.log('🔧 DEBUG: Path:', req.path);
    console.log('🔧 DEBUG: RequestID:', req.id || 'None');
    
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
      // Выполняем запрос
      const { count, rows } = await FuelTransaction.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order,
        // Отключаем raw для безопасности
        raw: false
      });
      
      console.log(`Query returned ${rows.length} of ${count} total records`);
      
      // Преобразование данных для клиента - убедимся, что все транзакции имеют объем
      const processedRows = rows.map(transaction => {
        const plainTransaction = transaction.get({ plain: true });
        
        // Генерируем key, если его нет
        if (!plainTransaction.key) {
          plainTransaction.key = `transaction-${plainTransaction.id}`;
        }
        
        // Если объем не указан, но есть amount, используем его как объем
        if (plainTransaction.volume === undefined && plainTransaction.amount !== undefined) {
          plainTransaction.volume = plainTransaction.amount;
        } else if (plainTransaction.volume === undefined) {
          plainTransaction.volume = 0;
        }
        
        // Если нет timestamp, но есть date, преобразуем
        if (plainTransaction.timestamp === undefined && plainTransaction.date) {
          plainTransaction.timestamp = new Date(plainTransaction.date).getTime();
        }
        
        // Проверяем наличие необходимых полей
        if (plainTransaction.fuelType === undefined) {
          plainTransaction.fuelType = 'gasoline_95';
        }
        
        if (plainTransaction.price === undefined) {
          plainTransaction.price = 0;
        }
        
        if (plainTransaction.totalCost === undefined) {
          plainTransaction.totalCost = plainTransaction.volume * plainTransaction.price;
        }
        
        return plainTransaction;
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
      
      console.log('GET /api/fuel - Successfully completed');
      
      // Проверяем ожидаемую структуру ответа
      const responseData = {
        success: true,
        count: processedRows.length,
        pagination,
        data: processedRows
      };
      
      console.log('Response data structure:', Object.keys(responseData));
      console.log('Sample record:', processedRows.length > 0 ? 
        JSON.stringify(processedRows[0], null, 2).substring(0, 200) + '...' : 'No records');
      
      res.status(200).json(responseData);
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
    console.log('POST /api/fuel - START REQUEST');
    console.log('Body (partial):', JSON.stringify({
      type: req.body.type,
      volume: req.body.volume,
      amount: req.body.amount,
      price: req.body.price,
      fuelType: req.body.fuelType,
      key: req.body.key,
      totalCost: req.body.totalCost,
      hasUserId: !!req.user
    }));
    
    // Клонируем req.body для безопасного изменения
    const processedData = { ...req.body };
    
    // Проверка необходимых полей
    if (!processedData.type) {
      console.error('Missing required field: type');
      return res.status(400).json({
        success: false,
        error: 'Не указан тип транзакции'
      });
    }
    
    // Проверка и установка количества/объема
    if (processedData.volume !== undefined) {
      // Если указан volume, используем его
      if (processedData.amount === undefined) {
        processedData.amount = processedData.volume;
      }
    } else if (processedData.amount !== undefined) {
      // Если указан только amount, создаем volume
      processedData.volume = processedData.amount;
    } else {
      console.error('Missing required field: volume/amount');
      return res.status(400).json({
        success: false,
        error: 'Не указан объем топлива'
      });
    }
    
    // Проверка цены
    if (processedData.price === undefined) {
      console.error('Missing required field: price');
      return res.status(400).json({
        success: false,
        error: 'Не указана цена топлива'
      });
    }
    
    // Расчет totalCost
    if (processedData.totalCost === undefined) {
      processedData.totalCost = Number(processedData.volume) * Number(processedData.price);
    }
    
    // Проверка fuelType и установка значения по умолчанию
    if (processedData.fuelType === undefined) {
      processedData.fuelType = 'gasoline_95';
    }
    
    // Преобразование даты
    if (processedData.timestamp && !processedData.date) {
      try {
        processedData.date = new Date(processedData.timestamp);
      } catch (dateError) {
        console.error('Error converting timestamp to date:', dateError);
        // Если неудачно, используем текущую дату
        processedData.date = new Date();
      }
    } else if (!processedData.date) {
      processedData.date = new Date();
    }
    
    // Добавляем пользователя к транзакции
    if (req.user) {
      processedData.userId = req.user.id;
    }
    
    console.log('Sanitized data for create:', {
      type: processedData.type,
      fuelType: processedData.fuelType,
      volume: processedData.volume,
      price: processedData.price,
      totalCost: processedData.totalCost
    });
    
    const transaction = await FuelTransaction.create(processedData);
    console.log(`Transaction created with ID: ${transaction.id}`);
    
    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error in createTransaction:', error);
    
    // Специфичная обработка ошибок валидации Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации данных',
        details: error.errors.map(e => e.message)
      });
    }
    
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