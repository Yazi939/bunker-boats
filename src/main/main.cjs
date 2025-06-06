const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const Store = require('electron-store');
const { setupAutoUpdater } = require('./updater');

// Инициализация хранилища
const store = new Store();

// Замени строку с localhost на реальный IP сервера
// Например, если сервер работает на 89.169.170.164:5000, то:
// const API_URL = 'http://localhost:5000';
const API_URL = 'http://89.169.170.164:5000';

function createWindow() {
  // Временно отключаем CSP для тестирования
  // session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  //   callback({
  //     responseHeaders: {
  //       ...details.responseHeaders,
  //       'Content-Security-Policy': [
  //         isDev
  //           ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:* http://89.169.170.164:*; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:* ws://localhost:* http://89.169.170.164:*"
  //           : "default-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://89.169.170.164:*"
  //       ]
  //     }
  //   });
  // });

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'preload.cjs'),
      sandbox: true
    }
  });

  // Настраиваем автообновление
  setupAutoUpdater(mainWindow);

  // В режиме разработки загружаем URL с Vite сервера
  if (isDev) {
    mainWindow.loadURL('http://localhost:5176');
    mainWindow.webContents.openDevTools();
  } else {
    // В продакшене загружаем собранные файлы
    mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
  }

  // Обработка ошибок загрузки
  mainWindow.webContents.on('did-fail-load', () => {
    console.log('Failed to load URL');
    if (isDev) {
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:5176');
      }, 5000);
    }
  });
}

// Настройка IPC handlers
function setupIPC() {
  // Пользователи
  ipcMain.handle('users:initialize', async () => {
    const users = store.get('users', []);
    if (users.length === 0) {
      store.set('users', [{
        id: 1,
        username: 'admin',
        password: 'admin',
        role: 'admin'
      }]);
    }
    return true;
  });

  ipcMain.handle('users:getCurrentUser', () => {
    return store.get('currentUser', null);
  });

  ipcMain.handle('users:login', (_, { username, password }) => {
    const users = store.get('users', []);
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      store.set('currentUser', user);
      return user;
    }
    return null;
  });

  ipcMain.handle('users:logout', () => {
    store.delete('currentUser');
    return true;
  });

  // Транзакции
  ipcMain.handle('transactions-get-all', async () => {
    return store.get('transactions', []);
  });

  ipcMain.handle('transactions-add', async (_, transaction) => {
    const transactions = store.get('transactions', []);
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    transactions.push(newTransaction);
    store.set('transactions', transactions);
    return newTransaction;
  });

  ipcMain.handle('transactions-update', async (_, transaction) => {
    const transactions = store.get('transactions', []);
    const index = transactions.findIndex(t => t.id === transaction.id);
    if (index !== -1) {
      transactions[index] = {
        ...transactions[index],
        ...transaction,
        updatedAt: new Date().toISOString()
      };
      store.set('transactions', transactions);
      return transactions[index];
    }
    return null;
  });

  ipcMain.handle('transactions-delete', async (_, id) => {
    const transactions = store.get('transactions', []);
    const filteredTransactions = transactions.filter(t => t.id !== id);
    store.set('transactions', filteredTransactions);
    return true;
  });

  // Транспортные средства
  ipcMain.handle('vehicles-get-all', async () => {
    return store.get('vehicles', []);
  });

  ipcMain.handle('vehicles-add', async (_, vehicle) => {
    const vehicles = store.get('vehicles', []);
    const newVehicle = {
      ...vehicle,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    vehicles.push(newVehicle);
    store.set('vehicles', vehicles);
    return newVehicle;
  });

  ipcMain.handle('vehicles-update', async (_, vehicle) => {
    const vehicles = store.get('vehicles', []);
    const index = vehicles.findIndex(v => v.id === vehicle.id);
    if (index !== -1) {
      vehicles[index] = {
        ...vehicles[index],
        ...vehicle,
        updatedAt: new Date().toISOString()
      };
      store.set('vehicles', vehicles);
      return vehicles[index];
    }
    return null;
  });

  ipcMain.handle('vehicles-delete', async (_, id) => {
    const vehicles = store.get('vehicles', []);
    const filteredVehicles = vehicles.filter(v => v.id !== id);
    store.set('vehicles', filteredVehicles);
    return true;
  });

  // Данные
  ipcMain.handle('data:get', (_, key) => {
    return store.get(key);
  });

  ipcMain.handle('data:set', (_, { key, value }) => {
    store.set(key, value);
    return true;
  });

  // Синхронизация
  ipcMain.handle('sync:getData', async (_, dataType) => {
    return store.get(dataType);
  });

  ipcMain.handle('sync:setData', async (_, { dataType, data }) => {
    store.set(dataType, data);
    return true;
  });
}

app.whenReady().then(() => {
  setupIPC();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); 