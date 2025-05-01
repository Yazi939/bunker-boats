const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');

// Simple route to test database connection
router.get('/test', async (req, res) => {
  try {
    // Test basic database connection
    await sequelize.authenticate();
    res.json({ message: 'Database connection is working properly!' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get FuelTransactions with minimal fields
router.get('/transactions', async (req, res) => {
  try {
    // Direct query to avoid Sequelize ORM issues
    const [transactions, metadata] = await sequelize.query(
      `SELECT id, date, type, amount, volume, price, totalCost, fuelType 
       FROM FuelTransactions 
       ORDER BY date DESC 
       LIMIT 10`
    );
    
    res.json({ 
      success: true,
      message: 'Retrieved transactions with direct query',
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Transaction query error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get schema information for troubleshooting
router.get('/schema', async (req, res) => {
  try {
    const [columns, metadata] = await sequelize.query(
      `PRAGMA table_info(FuelTransactions)`
    );
    
    res.json({
      success: true,
      message: 'Database schema information',
      columns: columns
    });
  } catch (error) {
    console.error('Schema query error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 