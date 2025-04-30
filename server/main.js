const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { sequelize } = require('./models/initModels');
const vehicleController = require('./controllers/vehicleController');
const fuelController = require('./controllers/fuelController');
const userController = require('./controllers/authController');

// Инициализация хранилища для транспортных средств
const vehiclesStore = [];

// Инициализация хранилища для транзакций
const transactionsStore = [];

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // В режиме разработки загружаем React приложение с localhost
  // В продакшене загружаем из файла index.html
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5176');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Синхронизация с базой данных
  sequelize.sync()
    .then(() => {
      console.log('База данных успешно синхронизирована');
    })
    .catch(err => {
      console.error('Ошибка синхронизации с базой данных:', err);
    });
}

// IPC обработчики для транспортных средств
ipcMain.handle('vehicles-get-all', async () => {
  try {
    const vehicles = await vehicleController.getAllVehicles();
    return vehicles.map(vehicle => ({
      key: vehicle.id.toString(),
      id: vehicle.registrationNumber,
      type: vehicle.type,
      model: vehicle.name,
      fuelType: 'Дизель', // Получать из БД если есть
      consumption: vehicle.fuelConsumption,
      lastRefuel: new Date().toISOString().split('T')[0] // Заглушка
    }));
  } catch (error) {
    console.error('Error getting vehicles:', error);
    return vehiclesStore;
  }
});

ipcMain.handle('vehicles-add', async (event, vehicle) => {
  try {
    const newVehicle = await vehicleController.createVehicle({
      name: vehicle.model,
      type: vehicle.type || 'boat',
      registrationNumber: vehicle.id,
      fuelCapacity: 100, // Заглушка
      fuelConsumption: vehicle.consumption
    });
    
    return await ipcMain.handle('vehicles-get-all');
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
});

ipcMain.handle('vehicles-update', async (event, vehicle) => {
  try {
    // Ищем ID транспортного средства по регистрационному номеру
    const vehicles = await vehicleController.getAllVehicles();
    const existingVehicle = vehicles.find(v => v.registrationNumber === vehicle.id);
    
    if (!existingVehicle) {
      throw new Error('Vehicle not found');
    }
    
    await vehicleController.updateVehicle(existingVehicle.id, {
      name: vehicle.model,
      type: vehicle.type || 'boat',
      registrationNumber: vehicle.id,
      fuelConsumption: vehicle.consumption
    });
    
    return await ipcMain.handle('vehicles-get-all');
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
});

ipcMain.handle('vehicles-delete', async (event, id) => {
  try {
    // Ищем ID транспортного средства по регистрационному номеру
    const vehicles = await vehicleController.getAllVehicles();
    const existingVehicle = vehicles.find(v => v.registrationNumber === id);
    
    if (!existingVehicle) {
      throw new Error('Vehicle not found');
    }
    
    await vehicleController.deleteVehicle(existingVehicle.id);
    
    return await ipcMain.handle('vehicles-get-all');
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
});

// IPC обработчики для транзакций
ipcMain.handle('transactions-get-all', async () => {
  try {
    const transactions = await fuelController.getAllTransactions();
    return transactions.map(t => ({
      key: t.id.toString(),
      type: t.type,
      volume: t.volume,
      price: t.price,
      totalCost: t.totalCost,
      date: new Date(t.date).toLocaleDateString('ru-RU'),
      timestamp: new Date(t.date).getTime(),
      fuelType: t.fuelType,
      supplier: t.supplier,
      customer: t.customer,
      vessel: t.vessel,
      userId: t.userId,
      frozen: !!t.frozen
    }));
  } catch (error) {
    console.error('Error getting transactions:', error);
    return transactionsStore;
  }
});

ipcMain.handle('transactions-add', async (event, transaction) => {
  try {
    await fuelController.createTransaction(transaction);
    return await ipcMain.handle('transactions-get-all');
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
});

ipcMain.handle('transactions-update', async (event, transaction) => {
  try {
    await fuelController.updateTransaction(transaction.key, transaction);
    return await ipcMain.handle('transactions-get-all');
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
});

ipcMain.handle('transactions-delete', async (event, id) => {
  try {
    await fuelController.deleteTransaction(id);
    return await ipcMain.handle('transactions-get-all');
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
});

// Запуск приложения
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Экспортировать для использования вне Electron
module.exports = {
  ipcMain,
  vehicleController,
  fuelController,
  userController
}; 