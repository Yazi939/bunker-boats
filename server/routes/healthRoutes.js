const express = require('express');
const router = express.Router();

// GET /api/health - проверка состояния сервера
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router; 