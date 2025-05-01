const { FuelTransaction, User } = require('../models/initModels');
const { Op } = require('sequelize');
const { sequelize } = require('../models/initModels');

// Helper function to sanitize transactions
const sanitizeTransaction = (transaction) => {
  // Convert to plain object if it's a Sequelize model instance
  const plainTransaction = transaction.get ? transaction.get({ plain: true }) : { ...transaction };
  
  // Ensure key exists
  if (!plainTransaction.key) {
    plainTransaction.key = `tx-${plainTransaction.id || Date.now()}-${Date.now()}`;
  }
  
  // Synchronize volume and amount fields
  if (plainTransaction.volume === undefined && plainTransaction.amount !== undefined) {
    plainTransaction.volume = Number(plainTransaction.amount) || 0;
  } else if (plainTransaction.amount === undefined && plainTransaction.volume !== undefined) {
    plainTransaction.amount = Number(plainTransaction.volume) || 0;
  } else if (plainTransaction.volume === undefined && plainTransaction.amount === undefined) {
    plainTransaction.volume = 0;
    plainTransaction.amount = 0;
  }
  
  // Ensure timestamp exists
  if (!plainTransaction.timestamp && plainTransaction.date) {
    plainTransaction.timestamp = new Date(plainTransaction.date).getTime();
  } else if (!plainTransaction.timestamp) {
    plainTransaction.timestamp = Date.now();
  }
  
  // Ensure other required fields exist
  plainTransaction.frozen = !!plainTransaction.frozen;
  plainTransaction.edited = !!plainTransaction.edited;
  
  return plainTransaction;
};

// @desc    Get all transactions
// @route   GET /api/fuel
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    // Create base query object
    let whereClause = {};
    
    // Apply filters if specified
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
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const offset = (page - 1) * limit;
    
    // Sorting options
    let order = [['date', 'DESC']]; // default by date, newest first
    if (req.query.sort) {
      const sortParams = req.query.sort.split(',');
      order = sortParams.map(param => {
        if (param.startsWith('-')) {
          return [param.substring(1), 'DESC'];
        }
        return [param, 'ASC'];
      });
    }
    
    // Выбираем только те поля, которые точно есть в базе данных
    const { count, rows } = await FuelTransaction.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order,
      attributes: [
        'id', 'date', 'type', 'amount', 'volume', 'price', 
        'totalCost', 'fuelType', 'source', 'destination', 'notes', 
        'timestamp', 'createdAt', 'updatedAt', 'userId'
      ],
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'role'] }
      ]
    });
    
    // Sanitize transactions
    const transactions = rows.map(transaction => sanitizeTransaction(transaction));
    
    // Return data
    return res.status(200).json({
      success: true,
      count,
      data: transactions,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        totalCount: count
      }
    });
  } catch (error) {
    console.error('Error in getTransactions:', error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve transactions",
      details: error.message
    });
  }
};

// @desc    Get one transaction
// @route   GET /api/fuel/:id
// @access  Private
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await FuelTransaction.findByPk(req.params.id, {
      attributes: [
        'id', 'date', 'type', 'amount', 'volume', 'price', 
        'totalCost', 'fuelType', 'source', 'destination', 'notes', 
        'timestamp', 'createdAt', 'updatedAt', 'userId'
      ],
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'role'] }
      ]
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    // Sanitize transaction
    const sanitizedTransaction = sanitizeTransaction(transaction);
    
    res.status(200).json({
      success: true,
      data: sanitizedTransaction
    });
  } catch (error) {
    console.error('Error in getTransaction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create transaction
// @route   POST /api/fuel
// @access  Private
exports.createTransaction = async (req, res) => {
  try {
    // Add user to transaction if authenticated
    if (req.user) {
      req.body.userId = req.user.id;
    }
    
    // Ensure amount and volume are synchronized
    if (req.body.amount === undefined && req.body.volume !== undefined) {
      req.body.amount = Number(req.body.volume) || 0;
    } else if (req.body.volume === undefined && req.body.amount !== undefined) {
      req.body.volume = Number(req.body.amount) || 0;
    } else if (req.body.volume === undefined && req.body.amount === undefined) {
      req.body.volume = 0;
      req.body.amount = 0;
    }
    
    // Ensure date and timestamp
    if (!req.body.date) {
      req.body.date = new Date();
    }
    
    if (!req.body.timestamp) {
      req.body.timestamp = new Date(req.body.date).getTime();
    }
    
    // Create transaction in DB
    const transaction = await FuelTransaction.create(req.body);
    
    // Sanitize result
    const sanitizedTransaction = sanitizeTransaction(transaction);
    
    res.status(201).json({
      success: true,
      data: sanitizedTransaction
    });
  } catch (error) {
    console.error('Error in createTransaction:', error);
    res.status(400).json({
      success: false,
      error: "Failed to create transaction",
      details: error.message
    });
  }
};

// @desc    Create transaction directly (no auth required)
// @route   POST /api/fuel/direct
// @access  Public
exports.createTransactionDirect = async (req, res) => {
  try {
    // Log direct transaction attempt for monitoring
    console.log('Direct transaction creation attempt:', {
      ip: req.ip,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    // Ensure amount and volume are synchronized
    if (req.body.amount === undefined && req.body.volume !== undefined) {
      req.body.amount = Number(req.body.volume) || 0;
    } else if (req.body.volume === undefined && req.body.amount !== undefined) {
      req.body.volume = Number(req.body.amount) || 0;
    } else if (req.body.volume === undefined && req.body.amount === undefined) {
      req.body.volume = 0;
      req.body.amount = 0;
    }
    
    // Ensure date and timestamp
    if (!req.body.date) {
      req.body.date = new Date();
    }
    
    if (!req.body.timestamp) {
      req.body.timestamp = new Date(req.body.date).getTime();
    }
    
    // Default user ID if not provided (for automatic imports)
    if (!req.body.userId) {
      const adminUser = await User.findOne({ where: { role: 'admin' } });
      req.body.userId = adminUser ? adminUser.id : null;
    }
    
    // Create transaction in DB
    const transaction = await FuelTransaction.create(req.body);
    
    // Sanitize result
    const sanitizedTransaction = sanitizeTransaction(transaction);
    
    res.status(201).json({
      success: true,
      data: sanitizedTransaction
    });
  } catch (error) {
    console.error('Error in createTransactionDirect:', error);
    res.status(400).json({
      success: false,
      error: "Failed to create direct transaction",
      details: error.message
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/fuel/:id
// @access  Private
exports.updateTransaction = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    let existingTransaction = await FuelTransaction.findByPk(req.params.id);
    
    if (!existingTransaction) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    // Check ownership or admin role
    if (existingTransaction.userId && 
        existingTransaction.userId !== req.user?.id && 
        req.user?.role !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this transaction'
      });
    }
    
    // Synchronize amount and volume
    if (req.body.amount === undefined && req.body.volume !== undefined) {
      req.body.amount = Number(req.body.volume) || 0;
    } else if (req.body.volume === undefined && req.body.amount !== undefined) {
      req.body.volume = Number(req.body.amount) || 0;
    }
    
    // Update timestamp if date changed
    if (req.body.date && req.body.date !== existingTransaction.date) {
      req.body.timestamp = new Date(req.body.date).getTime();
    }
    
    // Update transaction in DB
    await existingTransaction.update(req.body, { transaction });
    
    // Fetch updated transaction with associations
    const updatedTransaction = await FuelTransaction.findByPk(req.params.id, {
      attributes: [
        'id', 'date', 'type', 'amount', 'volume', 'price', 
        'totalCost', 'fuelType', 'source', 'destination', 'notes', 
        'timestamp', 'createdAt', 'updatedAt', 'userId'
      ],
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'role'] }
      ],
      transaction
    });
    
    // Commit transaction
    await transaction.commit();
    
    // Sanitize result
    const sanitizedTransaction = sanitizeTransaction(updatedTransaction);
    
    res.status(200).json({
      success: true,
      data: sanitizedTransaction
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    
    console.error('Error in updateTransaction:', error);
    res.status(400).json({
      success: false,
      error: "Failed to update transaction",
      details: error.message
    });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/fuel/:id
// @access  Private
exports.deleteTransaction = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const existingTransaction = await FuelTransaction.findByPk(req.params.id);
    
    if (!existingTransaction) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    // Check ownership or admin role
    if (existingTransaction.userId && 
        existingTransaction.userId !== req.user?.id && 
        req.user?.role !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this transaction'
      });
    }
    
    // Delete transaction
    await existingTransaction.destroy({ transaction });
    
    // Commit transaction
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    
    console.error('Error in deleteTransaction:', error);
    res.status(500).json({
      success: false,
      error: "Failed to delete transaction",
      details: error.message
    });
  }
};

// @desc    Get fuel statistics
// @route   GET /api/fuel/stats
// @access  Private
exports.getFuelStats = async (req, res) => {
  try {
    // Get date range from query params or use current month
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate) 
      : new Date(endDate.getFullYear(), endDate.getMonth() - 1, endDate.getDate());
    
    // Build where clause
    const whereClause = {
      date: {
        [Op.between]: [startDate, endDate]
      }
    };
    
    // Filter by fuel type if specified
    if (req.query.fuelType) {
      whereClause.fuelType = req.query.fuelType;
    }
    
    // Get transactions
    const transactions = await FuelTransaction.findAll({
      where: whereClause,
      attributes: ['type', 'volume', 'amount', 'totalCost', 'fuelType']
    });
    
    // Calculate statistics
    const stats = transactions.reduce((acc, transaction) => {
      const volume = Number(transaction.volume || transaction.amount || 0);
      const cost = Number(transaction.totalCost || 0);
      
      switch (transaction.type) {
        case 'purchase':
          acc.totalPurchased += volume;
          acc.purchaseCost += cost;
          break;
        case 'sale':
          acc.totalSold += volume;
          acc.salesIncome += cost;
          break;
        case 'salary':
          acc.salaryExpenses += cost;
          break;
        case 'repair':
          acc.repairExpenses += cost;
          break;
        case 'expense':
          acc.otherExpenses += cost;
          break;
      }
      
      return acc;
    }, {
      totalPurchased: 0,
      totalSold: 0,
      purchaseCost: 0,
      salesIncome: 0,
      salaryExpenses: 0,
      repairExpenses: 0,
      otherExpenses: 0
    });
    
    // Calculate derived statistics
    stats.totalBalance = stats.totalPurchased - stats.totalSold;
    stats.totalExpenses = stats.salaryExpenses + stats.repairExpenses + stats.otherExpenses;
    stats.profit = stats.salesIncome - stats.purchaseCost - stats.totalExpenses;
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getFuelStats:', error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve fuel statistics",
      details: error.message
    });
  }
}; 