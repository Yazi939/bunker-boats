const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

async function addVolumeColumn() {
  try {
    // Путь к базе данных на сервере
    const dbPath = path.join(__dirname, 'data', 'database.sqlite');
    
    console.log(`Используем базу данных: ${dbPath}`);
    
    if (!fs.existsSync(dbPath)) {
      console.error(`База данных не найдена по пути: ${dbPath}`);
      return;
    }
    
    // Подключаемся к базе данных
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      logging: console.log
    });
    
    // Проверяем подключение
    await sequelize.authenticate();
    console.log('Подключение к базе данных установлено');
    
    // Проверяем существование таблицы
    const tables = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table';",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('Таблицы в базе данных:', tables.map(t => t.name));
    
    const hasFuelTransactions = tables.some(t => t.name === 'FuelTransactions');
    if (!hasFuelTransactions) {
      console.error('Таблица FuelTransactions не найдена в базе данных');
      return;
    }
    
    // Проверяем существование колонки
    console.log('Проверка наличия колонки volume...');
    const checkResult = await sequelize.query(
      "PRAGMA table_info(FuelTransactions);",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('Текущие колонки:', checkResult.map(col => col.name));
    
    const volumeColumnExists = checkResult.some(col => col.name === 'volume');
    
    if (volumeColumnExists) {
      console.log('Колонка volume уже существует в таблице FuelTransactions');
      return;
    }
    
    // Добавляем колонку
    console.log('Добавление колонки volume...');
    await sequelize.query(
      "ALTER TABLE FuelTransactions ADD COLUMN volume FLOAT;",
      { type: sequelize.QueryTypes.RAW }
    );
    
    // Копируем значения из amount в volume
    console.log('Копирование значений из amount в volume...');
    await sequelize.query(
      "UPDATE FuelTransactions SET volume = amount;",
      { type: sequelize.QueryTypes.RAW }
    );
    
    console.log('Колонка volume успешно добавлена и заполнена данными из amount');
  } catch (error) {
    console.error('Ошибка при добавлении колонки volume:', error);
  }
}

// Запускаем функцию
addVolumeColumn()
  .then(() => console.log('Операция завершена'))
  .catch(err => console.error('Ошибка:', err)); 