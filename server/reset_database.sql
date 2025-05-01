-- Пересоздаем таблицу FuelTransactions с правильной структурой
CREATE TABLE IF NOT EXISTS FuelTransactions_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATETIME,
  type VARCHAR(255),
  amount FLOAT,
  volume FLOAT,
  price FLOAT,
  totalCost FLOAT,
  fuelType VARCHAR(255),
  source VARCHAR(255),
  destination VARCHAR(255),
  notes TEXT,
  frozen BOOLEAN DEFAULT 0,
  edited BOOLEAN DEFAULT 0,
  timestamp BIGINT,
  supplier VARCHAR(255),
  customer VARCHAR(255),
  vessel VARCHAR(255),
  paymentMethod VARCHAR(255),
  key VARCHAR(255),
  createdAt DATETIME,
  updatedAt DATETIME,
  userId INTEGER,
  vehicleId INTEGER,
  FOREIGN KEY (userId) REFERENCES Users(id),
  FOREIGN KEY (vehicleId) REFERENCES Vehicles(id)
);

-- Получаем список существующих колонок
.headers on
.mode column
PRAGMA table_info(FuelTransactions);

-- Добавляем только основные колонки, без frozen и edited которых может не быть
BEGIN TRANSACTION;
  INSERT OR IGNORE INTO FuelTransactions_new (
    id, date, type, amount, volume, price, totalCost, fuelType, source, destination, 
    notes, timestamp, supplier, customer, vessel, paymentMethod, key, createdAt, 
    updatedAt, userId, vehicleId
  )
  SELECT 
    id, date, type, amount, amount, price, totalCost, fuelType, source, destination, 
    notes, timestamp, supplier, customer, vessel, paymentMethod, key, createdAt, 
    updatedAt, userId, vehicleId
  FROM FuelTransactions;

  -- Удаляем старую таблицу
  DROP TABLE IF EXISTS FuelTransactions;

  -- Переименовываем новую таблицу
  ALTER TABLE FuelTransactions_new RENAME TO FuelTransactions;
COMMIT; 