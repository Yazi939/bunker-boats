const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { connectDB } = require('./config/db');
const seedUsers = require('./data/seedUsers');

// Проверка существования директории для данных
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Загрузка переменных окружения
dotenv.config();

// Подключение к базе данных
connectDB().then(() => {
  // Создание начальных пользователей
  seedUsers();
});

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Маршруты API
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/shifts', require('./routes/shiftRoutes'));
app.use('/api/fuel', require('./routes/fuelRoutes'));
app.use('/api/health', require('./routes/healthRoutes'));

// Базовый маршрут
app.get('/', (req, res) => {
  res.json({ message: 'API FUEL Manager успешно работает' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Ошибка сервера',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
}); 