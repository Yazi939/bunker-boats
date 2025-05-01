const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { connectDB } = require('./config/db');
const seedUsers = require('./data/seedUsers');
const { sequelize } = require('./models/initModels');
const { exec } = require('child_process');

// Проверка существования директории для данных
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Загрузка переменных окружения
dotenv.config();

// Проверка наличия JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.warn('ВНИМАНИЕ: JWT_SECRET не установлен в переменных окружения. Используется значение по умолчанию.');
}

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
      // Отключаем альтерацию полностью, чтобы избежать проблем с внешними ключами
      await sequelize.sync({ alter: false });
      console.log('Модели синхронизированы с базой данных без изменения структуры');
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

    // Импорт маршрутов
    const userRoutes = require('./routes/userRoutes');
    const fuelRoutes = require('./routes/fuelRoutes');
    const healthRoutes = require('./routes/healthRoutes');
    // Удаляем импорт маршрутов связанных с транспортными средствами
    // const vehicleRoutes = require('./routes/vehicleRoutes');
    const shiftRoutes = require('./routes/shiftRoutes');
    const debugRoutes = require('./routes/debug_routes');

    // Использование маршрутов
    app.use('/api/users', userRoutes);
    app.use('/api/fuel', fuelRoutes);
    app.use('/api/health', healthRoutes);
    // Удаляем использование маршрутов для транспортных средств
    // app.use('/api/vehicles', vehicleRoutes);
    app.use('/api/shifts', shiftRoutes);
    app.use('/api/debug', debugRoutes);

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

    // Check if we should use the database
    const useDb = process.env.USE_DB !== 'false';

    // Environment variables
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || '0.0.0.0';

    // Function to validate and fix database
    const validateDatabase = async () => {
      try {
        console.log('Checking database integrity...');
        
        // Get all models from sequelize
        const models = Object.values(sequelize.models);
        
        // Try to sync models (this will create tables if they don't exist)
        await sequelize.sync();
        
        // Run database fix script for additional checks
        const fixScriptPath = path.join(__dirname, 'fix_database.sh');
        
        if (fs.existsSync(fixScriptPath)) {
          console.log('Running database fix script...');
          
          exec(`bash ${fixScriptPath}`, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error running fix script: ${error.message}`);
              return;
            }
            
            if (stderr) {
              console.error(`Fix script stderr: ${stderr}`);
            }
            
            console.log(`Fix script output: ${stdout}`);
          });
        } else {
          console.log('Database fix script not found. Skipping additional checks.');
        }
        
        return true;
      } catch (error) {
        console.error('Database validation failed:', error);
        return false;
      }
    };

    // Start server
    const startServer = async () => {
      try {
        if (useDb) {
          // Connect to the database
          await sequelize.authenticate();
          console.log('Database connection established successfully.');
          
          // Validate and fix database
          const isDbValid = await validateDatabase();
          
          if (!isDbValid) {
            console.warn('Database validation failed, but server will start anyway.');
          }
        } else {
          console.log('Database usage is disabled.');
        }
        
        // Start listening
        app.listen(PORT, HOST, () => {
          console.log(`Сервер запущен на ${HOST}:${PORT} и доступен извне`);
        });
      } catch (error) {
        console.error('Unable to start server:', error);
        process.exit(1);
      }
    };

    startServer();
  } catch (error) {
    console.error('Ошибка при инициализации приложения:', error);
    process.exit(1);
  }
};

initApp(); 