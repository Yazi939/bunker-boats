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

// Подключение к базе данных и инициализация моделей
const initApp = async () => {
  try {
    // Подключаемся к базе данных
    const db = await connectDB();
    console.log('База данных успешно подключена');
    
    // Импортируем модели только после подключения к БД
    const { User, Vehicle, Shift, FuelTransaction, sequelize } = require('./models/initModels');
    
    // Проверяем существование и удаляем таблицу backup перед синхронизацией
    try {
      await sequelize.query('DROP TABLE IF EXISTS `Users_backup`');
      console.log('Удалена временная таблица Users_backup для предотвращения конфликтов');
    } catch (dropError) {
      console.warn('Не удалось удалить таблицу Users_backup:', dropError.message);
    }
    
    // Проверка на существование sequelize перед вызовом sync
    if (sequelize && typeof sequelize.sync === 'function') {
      // Исключаем таблицу Users из альтерации, чтобы избежать ошибок с внешними ключами
      await sequelize.sync({ alter: { exclude: ['Users'] } });
      console.log('Модели синхронизированы с базой данных');
    } else {
      console.log('Предупреждение: sequelize не определен или не содержит метод sync');
    }

    // Создание начальных пользователей
    await seedUsers();

    const app = express();

    // Middleware
    app.use(express.json());
    app.use(cors({
      origin: ['http://89.169.170.164:5176', 'http://localhost:5176', '*'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // Для предполетных запросов
    app.options('*', cors());
    
    // Логирование запросов
    app.use(morgan('dev'));
    
    // Middleware для отладки запросов
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });

    // Middleware для обработки ошибок JSON парсинга
    app.use((err, req, res, next) => {
      if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ 
          success: false, 
          error: 'Неверный формат JSON' 
        });
      }
      next(err);
    });

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

    // Обработчик ошибок 404
    app.use((req, res, next) => {
      res.status(404).json({
        success: false,
        error: `Маршрут ${req.originalUrl} не найден на сервере`
      });
    });

    // Общий обработчик ошибок
    app.use((err, req, res, next) => {
      console.error('Server error:', err.stack);
      
      // Обработка ошибок Sequelize
      if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации данных',
          details: err.errors.map(e => e.message)
        });
      }
      
      // Обработка других ошибок
      res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Ошибка сервера',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    });

    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || '0.0.0.0';

    app.listen(PORT, HOST, () => {
      console.log(`Сервер запущен на ${HOST}:${PORT} и доступен извне`);
    });
  } catch (error) {
    console.error('Ошибка при инициализации приложения:', error);
    process.exit(1);
  }
};

initApp(); 