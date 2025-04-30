const { FuelTransaction, User, Vehicle, sequelize } = require('../models/initModels');
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
    console.log('🔥 POST /api/fuel - START REQUEST');
    console.log('🔥 Request body (full):', JSON.stringify(req.body, null, 2));
    
    // Клонируем req.body для безопасного изменения
    const processedData = { ...req.body };
    
    // УПРОЩЕННАЯ ВАЛИДАЦИЯ - принимаем любую структуру данных
    // Используем только базовые проверки
    
    // Если type не указан, используем значение по умолчанию
    if (!processedData.type) {
      processedData.type = 'purchase';
      console.log('🔥 Using default type: purchase');
    }
    
    // ВАЖНО: Сначала проверяем и устанавливаем amount
    // Поскольку это поле не может быть null в базе данных
    if (processedData.amount === undefined || processedData.amount === null) {
      if (processedData.volume !== undefined && processedData.volume !== null) {
        processedData.amount = processedData.volume;
        console.log('🔥 Setting amount = volume:', processedData.amount);
      } else {
        processedData.amount = 0;
        processedData.volume = 0;
        console.log('🔥 Using default amount/volume: 0');
      }
    }
    
    // Если volume не указан, но amount указан, устанавливаем volume = amount
    if ((processedData.volume === undefined || processedData.volume === null) && 
        processedData.amount !== undefined && processedData.amount !== null) {
      processedData.volume = processedData.amount;
      console.log('🔥 Setting volume = amount:', processedData.volume);
    }
    
    // Если price не указана, используем 0
    if (processedData.price === undefined || processedData.price === null) {
      processedData.price = 0;
      console.log('🔥 Using default price: 0');
    }
    
    // Если totalCost не указан, вычисляем его
    if (processedData.totalCost === undefined || processedData.totalCost === null) {
      processedData.totalCost = Number(processedData.volume) * Number(processedData.price);
      console.log('🔥 Calculated totalCost:', processedData.totalCost);
    }
    
    // Если fuelType не указан, используем значение по умолчанию
    if (processedData.fuelType === undefined || processedData.fuelType === null) {
      processedData.fuelType = 'gasoline_95';
      console.log('🔥 Using default fuelType: gasoline_95');
    }
    
    // Обработка даты и timestamp
    if (processedData.timestamp) {
      try {
        processedData.date = new Date(processedData.timestamp);
      } catch (e) {
        processedData.date = new Date(); // Используем текущую дату в случае ошибки
      }
    } else if (!processedData.date) {
      processedData.date = new Date();
    }
    
    // Добавляем пользователя к транзакции
    if (req.user) {
      processedData.userId = req.user.id;
    }
    
    // ВАЖНО: Финальная проверка критических полей
    console.log('🔥 Checking critical field amount:', processedData.amount);
    if (processedData.amount === undefined || processedData.amount === null) {
      console.error('🔥 CRITICAL ERROR: amount is still null/undefined after processing');
      // Последняя попытка установить amount
      processedData.amount = 0;
    }
    
    console.log('🔥 Sanitized data for create:', {
      type: processedData.type,
      fuelType: processedData.fuelType,
      volume: processedData.volume,
      amount: processedData.amount,  // Добавляем лог amount
      price: processedData.price,
      totalCost: processedData.totalCost,
      date: processedData.date
    });
    
    try {
      const transaction = await FuelTransaction.create(processedData);
      console.log(`🔥 Transaction created with ID: ${transaction.id}`);
      
      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (dbError) {
      console.error('🔥 Database error in createTransaction:', dbError);
      
      // Проверяем, связана ли ошибка с полем amount
      if (dbError.message && dbError.message.includes('amount cannot be null')) {
        console.log('🔥 Detected amount null error, creating minimal transaction');
        
        // Создаем минимальный объект данных с явным указанием amount
        const minimalData = {
          type: processedData.type || 'purchase',
          volume: processedData.volume || 0,
          amount: processedData.volume || 0,  // Явно задаем amount = volume
          price: processedData.price || 0,
          totalCost: processedData.totalCost || 0,
          fuelType: processedData.fuelType || 'gasoline_95',
          date: new Date(),
          timestamp: Date.now(),
          userId: req.user ? req.user.id : null,
          key: processedData.key || null
        };
        
        try {
          const minimalTransaction = await FuelTransaction.create(minimalData);
          console.log(`🔥 Created transaction with minimal data, ID: ${minimalTransaction.id}`);
          
          res.status(201).json({
            success: true,
            data: minimalTransaction
          });
          return;
        } catch (minimalError) {
          console.error('🔥 Failed to create with minimal data:', minimalError);
          // Продолжаем к стандартной обработке ошибок
        }
      }
      
      res.status(400).json({
        success: false,
        error: 'Не удалось создать транзакцию',
        details: dbError.message
      });
    }
  } catch (error) {
    console.error('🔥 Unhandled error in createTransaction:', error);
    
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при создании транзакции',
      details: error.message
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
    const safeKey = key || `direct-${Date.now()}`;
    
    // Выполняем прямой SQL-запрос, обходя ORM
    const query = `
      INSERT INTO "FuelTransactions" 
      ("type", "volume", "amount", "price", "totalCost", "fuelType", "supplier", "date", "key", "createdAt", "updatedAt")
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
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
      bind: values,
      type: sequelize.QueryTypes.INSERT,
      returning: true,
      raw: true
    });
    
    console.log('💉 Transaction created with direct SQL');
    
    res.status(201).json({
      success: true,
      data: result[0][0]
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