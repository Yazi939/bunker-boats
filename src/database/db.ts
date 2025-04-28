import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

// Определяем путь к базе данных
const dbPath = app.isPackaged
  ? path.join(process.resourcesPath, 'database.sqlite')
  : path.join(app.getPath('userData'), 'database.sqlite');

// Создаем директорию для базы данных, если она не существует
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Инициализируем базу данных
const db = new Database(dbPath);

// Создаем необходимые таблицы
db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    model TEXT NOT NULL,
    fuelType TEXT NOT NULL,
    consumption REAL NOT NULL,
    lastRefuel TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS fuel_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    volume REAL NOT NULL,
    price REAL NOT NULL,
    totalCost REAL NOT NULL,
    date TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    fuelType TEXT NOT NULL,
    supplier TEXT,
    customer TEXT,
    vessel TEXT,
    frozen BOOLEAN DEFAULT 0,
    frozenDate INTEGER,
    paymentMethod TEXT,
    userId TEXT,
    userRole TEXT,
    notes TEXT,
    edited BOOLEAN DEFAULT 0,
    editTimestamp INTEGER
  );
`);

// Подготавливаем запросы для работы с транспортными средствами
export const vehicleQueries = {
  insertVehicle: db.prepare(`
    INSERT INTO vehicles (id, type, model, fuelType, consumption, lastRefuel)
    VALUES (@id, @type, @model, @fuelType, @consumption, @lastRefuel)
  `),
  
  updateVehicle: db.prepare(`
    UPDATE vehicles
    SET type = @type, model = @model, fuelType = @fuelType,
        consumption = @consumption, lastRefuel = @lastRefuel
    WHERE id = @id
  `),
  
  deleteVehicle: db.prepare('DELETE FROM vehicles WHERE id = ?'),
  
  getAllVehicles: db.prepare('SELECT * FROM vehicles'),
  
  getVehicleById: db.prepare('SELECT * FROM vehicles WHERE id = ?')
};

// Подготавливаем запросы для работы с транзакциями топлива
export const transactionQueries = {
  insertTransaction: db.prepare(`
    INSERT INTO fuel_transactions (
      type, volume, price, totalCost, date, timestamp,
      fuelType, supplier, customer, vessel, paymentMethod,
      userId, userRole, notes
    ) VALUES (
      @type, @volume, @price, @totalCost, @date, @timestamp,
      @fuelType, @supplier, @customer, @vessel, @paymentMethod,
      @userId, @userRole, @notes
    )
  `),
  
  getAllTransactions: db.prepare('SELECT * FROM fuel_transactions'),
  
  getTransactionsByDateRange: db.prepare(`
    SELECT * FROM fuel_transactions
    WHERE timestamp BETWEEN ? AND ?
    ORDER BY timestamp DESC
  `),
  
  getTransactionsByFuelType: db.prepare(`
    SELECT * FROM fuel_transactions
    WHERE fuelType = ?
    ORDER BY timestamp DESC
  `),
  
  freezeTransaction: db.prepare(`
    UPDATE fuel_transactions
    SET frozen = 1, frozenDate = @frozenDate
    WHERE id = @id
  `)
};

// Функции для работы с транспортными средствами
export const vehicleOperations = {
  addVehicle(vehicle: any) {
    try {
      return vehicleQueries.insertVehicle.run(vehicle);
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  },

  updateVehicle(vehicle: any) {
    try {
      return vehicleQueries.updateVehicle.run(vehicle);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  },

  deleteVehicle(id: string) {
    try {
      return vehicleQueries.deleteVehicle.run(id);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  },

  getAllVehicles() {
    try {
      return vehicleQueries.getAllVehicles.all();
    } catch (error) {
      console.error('Error getting vehicles:', error);
      throw error;
    }
  }
};

// Функции для работы с транзакциями
export const transactionOperations = {
  addTransaction(transaction: any) {
    try {
      return transactionQueries.insertTransaction.run(transaction);
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  },

  getAllTransactions() {
    try {
      return transactionQueries.getAllTransactions.all();
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  },

  getTransactionsByDateRange(startDate: number, endDate: number) {
    try {
      return transactionQueries.getTransactionsByDateRange.all(startDate, endDate);
    } catch (error) {
      console.error('Error getting transactions by date range:', error);
      throw error;
    }
  },

  getTransactionsByFuelType(fuelType: string) {
    try {
      return transactionQueries.getTransactionsByFuelType.all(fuelType);
    } catch (error) {
      console.error('Error getting transactions by fuel type:', error);
      throw error;
    }
  }
};

export default {
  vehicleOperations,
  transactionOperations
}; 