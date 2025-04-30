const path = require('path');
const Database = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'server/data/database.sqlite');

console.log(`Fixing SQLite database at: ${dbPath}`);

// Открываем базу данных
const db = new Database.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
    process.exit(1);
  }
  console.log('Connected to database');
  
  // Выполняем последовательно все операции
  executeFixScript();
});

function executeFixScript() {
  // В SQLite нельзя просто изменить тип столбца - нужно пересоздать таблицу
  // Этот скрипт делает всё в одной транзакции для безопасности
  const script = `
  -- Начинаем транзакцию
  BEGIN TRANSACTION;
  
  -- 1. Создаем временную таблицу с такой же структурой, но без ограничений
  CREATE TABLE FuelTransactions_temp AS SELECT * FROM FuelTransactions;
  
  -- 2. Удаляем оригинальную таблицу
  DROP TABLE FuelTransactions;
  
  -- 3. Создаем новую таблицу с измененной структурой
  CREATE TABLE "FuelTransactions" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT, 
    "date" DATETIME NOT NULL, 
    "type" TEXT NOT NULL, 
    "amount" FLOAT DEFAULT 0, 
    "price" FLOAT DEFAULT 0, 
    "totalCost" FLOAT DEFAULT 0, 
    "fuelType" TEXT DEFAULT 'gasoline_95', 
    "source" VARCHAR(255), 
    "destination" VARCHAR(255), 
    "notes" TEXT,
    "volume" FLOAT DEFAULT 0,
    "frozen" BOOLEAN DEFAULT 0,
    "edited" BOOLEAN DEFAULT 0,
    "timestamp" BIGINT,
    "supplier" VARCHAR(255),
    "customer" VARCHAR(255),
    "vessel" VARCHAR(255),
    "paymentMethod" VARCHAR(255),
    "key" VARCHAR(255),
    "createdAt" DATETIME NOT NULL, 
    "updatedAt" DATETIME NOT NULL, 
    "userId" INTEGER REFERENCES "Users"("id"), 
    "vehicleId" INTEGER REFERENCES "Vehicles"("id")
  );
  
  -- 4. Копируем все данные из временной таблицы, заполняя новые колонки значениями по умолчанию
  INSERT INTO FuelTransactions 
  SELECT 
    id, date, type, amount, price, totalCost, fuelType, source, destination, 
    notes, amount, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, createdAt, updatedAt, userId, vehicleId 
  FROM FuelTransactions_temp;
  
  -- 5. Удаляем временную таблицу
  DROP TABLE FuelTransactions_temp;
  
  -- 6. Обновляем записи - устанавливаем volume = amount для всех записей, где volume NULL
  UPDATE FuelTransactions SET volume = amount WHERE volume IS NULL;
  
  -- 7. Подтверждаем транзакцию
  COMMIT;
  
  -- Конец скрипта
  `;
  
  // Выполняем весь скрипт
  db.exec(script, function(err) {
    if (err) {
      console.error("Error executing script:", err);
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      return;
    }
    
    console.log("Database structure successfully fixed!");
    console.log("Column 'amount' now allows NULL values and has DEFAULT 0");
    console.log("All necessary columns added");
    
    // Проверка, что всё сработало правильно
    db.all("PRAGMA table_info(FuelTransactions)", [], function(err, rows) {
      if (err) {
        console.error("Error checking table info after fix:", err);
        return;
      }
      
      console.log("New table structure:");
      console.log(rows);
      
      // Закрываем соединение
      db.close();
    });
  });
} 