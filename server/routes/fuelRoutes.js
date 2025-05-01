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
// Debug endpoint возвращает данные в формате массива для совместимости с клиентом
router.get('/debug', async (req, res) => {
  try {
    // Переиспользуем существующий контроллер, но игнорируем аутентификацию
    // Это позволит клиенту получить доступ к данным в аварийном режиме
    req.user = { id: 1, role: 'admin' }; // Устанавливаем фиктивного пользователя
    await getTransactions(req, res);
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json([]);  // Возвращаем пустой массив при ошибке
  }
});

// Добавляем маршрут для тестирования POST запросов
router.post('/debug', createTransaction);

// Проверяем наличие функции перед использованием
if (typeof createTransactionDirect === 'function') {
  // Добавляем прямой маршрут для создания транзакций
  router.post('/direct', createTransactionDirect);
} else {
  console.error('createTransactionDirect is not defined or not a function');
  // Создаем заглушку на случай, если функция недоступна
  router.post('/direct', (req, res) => {
    res.status(501).json({
      success: false,
      error: 'Function not implemented'
    });
  });
}

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