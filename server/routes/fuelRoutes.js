const express = require('express');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  createTransactionDirect,
  updateTransaction,
  deleteTransaction
} = require('../controllers/fuelController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Добавляем временный маршрут без аутентификации для отладки
router.get('/debug', getTransactions);

// Добавляем маршрут для тестирования POST запросов
router.post('/debug', createTransaction);

// Добавляем маршрут для прямого создания транзакций
router.post('/direct', createTransactionDirect);

router
  .route('/')
  .get(protect, getTransactions)
  .post(protect, createTransaction);

router
  .route('/:id')
  .get(protect, getTransaction)
  .put(protect, updateTransaction)
  .delete(protect, deleteTransaction);

module.exports = router; 