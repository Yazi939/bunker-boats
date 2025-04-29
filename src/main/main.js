const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const fetch = require('node-fetch');

// Force colored console output
process.env.FORCE_COLOR = '1';

// Initialize store with schema and defaults
const store = new Store({
  name: 'bunker-boats-data',
  fileExtension: 'json',
  clearInvalidConfig: false, // Don't clear invalid data
  encryptionKey: 'your-encryption-key',
  schema: {
    vehicles: {
      type: 'array',
      default: []
    },
    transactions: {
      type: 'array',
      default: []
    },
    history: {
      type: 'array',
      default: []
    },
    settings: {
      type: 'object',
      properties: {
        darkMode: { type: 'boolean', default: false },
        language: { type: 'string', default: 'ru' }
      },
      default: { darkMode: false, language: 'ru' }
    }
  }
});

// Clear all data and reinitialize
store.clear();
log('Store cleared');

// Initialize with single vehicle
store.set('vehicles', [
  {
    key: '1',
    id: 'ТС-001',
    type: 'Катер',
    model: 'Yamaha AR240',
    fuelType: 'АИ-95',
    consumption: 45.2,
    lastRefuel: '2024-04-08'
  }
]);

// Initialize empty transactions
store.set('transactions', []);

// Log store path and current data
log(`Store initialized at: ${store.path}`);
log(`Current store data: ${JSON.stringify(store.store)}`);

// Create backup of store data
const backupPath = path.join(app.getPath('userData'), 'store-backup.json');
fs.writeFileSync(backupPath, JSON.stringify(store.store, null, 2), 'utf8');
log(`Backup created at: ${backupPath}`);

// Only initialize with test data if both vehicles and transactions are empty
const shouldInitialize = store.get('vehicles', []).length === 0;

if (shouldInitialize) {
  log('Initializing store with default data...');
  store.set('vehicles', [
    {
      key: '1',
      id: 'ТС-001',
      type: 'Катер',
      model: 'Yamaha AR240',
      fuelType: 'АИ-95',
      consumption: 45.2,
      lastRefuel: '2024-04-08'
    }
  ]);
  
  // Не инициализируем тестовые транзакции
  store.set('transactions', []);
}

// Log store initialization
log('Electron Store initialized');
log(`Store path: ${store.path}`);
log(`Initial vehicles count: ${store.get('vehicles', []).length}`);
log(`Initial transactions count: ${store.get('transactions', []).length}`);

// Enhanced logging function
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  
  console.log(logMessage);
  fs.appendFileSync(
    path.join(app.getPath('userData'), 'electron_log.txt'),
    logMessage + '\n',
    { encoding: 'utf8', flag: 'a' }
  );
}

// Check if a port is available and running Vite
async function checkPort(port) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`http://localhost:${port}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    return response.status === 200;
  } catch (error) {
    if (error.name === 'AbortError') {
      log(`Port ${port} check timed out`, 'warn');
    } else {
      log(`Error checking port ${port}: ${error.message}`, 'error');
    }
    return false;
  }
}

// Find available Vite server port
async function findVitePort() {
  for (let port = 5173; port <= 5183; port++) {
    log(`Checking port ${port}...`);
    if (await checkPort(port)) {
      log(`Found Vite server on port ${port}`);
      return port;
    }
  }
  throw new Error('Could not find Vite server on any port');
}

// Check Vite server with retries
async function checkViteServer() {
  let retries = 10;
  while (retries > 0) {
    try {
      const port = await findVitePort();
      // Double check server stability
      await new Promise(resolve => setTimeout(resolve, 500));
      if (await checkPort(port)) {
        return port;
      }
    } catch (error) {
      log(`Retry attempt ${10 - retries + 1} failed: ${error.message}`, 'warn');
    }
    retries--;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Failed to connect to Vite server after multiple attempts');
}

// Create the main window
async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
      webSecurity: true
    }
  });

  try {
    const port = await checkViteServer();
    const url = `http://localhost:${port}`;
    
    // Set Content Security Policy
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* data: blob:;",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*;",
            "style-src 'self' 'unsafe-inline' http://localhost:*;",
            "img-src 'self' data: http://localhost:* https:;",
            "font-src 'self' data: http://localhost:*;",
            "connect-src 'self' http://localhost:* ws://localhost:* http://89.169.170.164:5000;"
          ].join(' ')
        }
      });
    });

    mainWindow.loadURL(url, {
      extraHeaders: 'Content-Type: text/html; charset=utf-8\n'
    });

    mainWindow.webContents.on('did-fail-load', (event, code, desc) => {
      log(`Failed to load: ${desc} (${code})`, 'error');
      mainWindow.loadFile('src/error.html');
    });

    // Enable DevTools in development
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }

    // Log window creation success
    log('Main window created successfully');
    
    return mainWindow;
  } catch (error) {
    log(`Error creating window: ${error.message}`, 'error');
    mainWindow.loadFile('src/error.html');
  }
}

// Vehicles IPC handlers
ipcMain.handle('vehicles-get-all', () => {
  try {
    const vehicles = store.get('vehicles', []);
    log('Retrieved all vehicles');
    return vehicles;
  } catch (error) {
    log(`Error getting vehicles: ${error.message}`, 'error');
    throw error;
  }
});

ipcMain.handle('vehicles-add', (event, vehicle) => {
  try {
    const vehicles = store.get('vehicles', []);
    vehicles.push({
      ...vehicle,
      key: String(vehicles.length + 1)
    });
    store.set('vehicles', vehicles);
    log(`Added new vehicle: ${vehicle.id}`);
    return vehicles;
  } catch (error) {
    log(`Error adding vehicle: ${error.message}`, 'error');
    throw error;
  }
});

ipcMain.handle('vehicles-update', (event, vehicle) => {
  try {
    const vehicles = store.get('vehicles', []);
    const index = vehicles.findIndex(v => v.key === vehicle.key);
    if (index !== -1) {
      vehicles[index] = vehicle;
      store.set('vehicles', vehicles);
      log(`Updated vehicle: ${vehicle.id}`);
    }
    return vehicles;
  } catch (error) {
    log(`Error updating vehicle: ${error.message}`, 'error');
    throw error;
  }
});

ipcMain.handle('vehicles-delete', (event, id) => {
  try {
    const vehicles = store.get('vehicles', []);
    const filteredVehicles = vehicles.filter(v => v.id !== id);
    store.set('vehicles', filteredVehicles);
    log(`Deleted vehicle: ${id}`);
    return filteredVehicles;
  } catch (error) {
    log(`Error deleting vehicle: ${error.message}`, 'error');
    throw error;
  }
});

// Transactions IPC handlers
ipcMain.handle('transactions-get-all', () => {
  try {
    const transactions = store.get('transactions', []);
    log(`Retrieved ${transactions.length} transactions`);
    return transactions;
  } catch (error) {
    log(`Error getting transactions: ${error.message}`, 'error');
    throw error;
  }
});

ipcMain.handle('transactions-add', (event, transaction) => {
  try {
    // Get current data
    let transactions = store.get('transactions', []);
    log(`Current transactions: ${transactions.length}`);

    // Create new transaction
    const newTransaction = {
      ...transaction,
      key: String(Date.now()), // Use timestamp as key
      timestamp: Date.now()
    };

    // Add to array
    transactions.push(newTransaction);
    
    // Save synchronously
    store.set('transactions', transactions);
    
    // Create immediate backup
    const backupPath = path.join(app.getPath('userData'), 'transactions-backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(transactions, null, 2), 'utf8');
    
    // Verify save
    transactions = store.get('transactions', []);
    log(`Saved ${transactions.length} transactions`);
    log(`Last transaction: ${JSON.stringify(transactions[transactions.length - 1])}`);
    
    return transactions;
  } catch (error) {
    log(`Error adding transaction: ${error.message}`, 'error');
    throw error;
  }
});

ipcMain.handle('transactions-update', (event, transaction) => {
  try {
    const transactions = store.get('transactions', []);
    const index = transactions.findIndex(t => t.key === transaction.key);
    if (index !== -1) {
      transactions[index] = {
        ...transaction,
        edited: true,
        editTimestamp: Date.now()
      };
      store.set('transactions', transactions);
      log(`Updated transaction: ${transaction.key}`);
    }
    return transactions;
  } catch (error) {
    log(`Error updating transaction: ${error.message}`, 'error');
    throw error;
  }
});

ipcMain.handle('transactions-delete', (event, key) => {
  try {
    log(`Attempting to delete transaction with key: ${key}`);
    const transactions = store.get('transactions', []);
    const updatedTransactions = transactions.filter(t => t.key !== key);
    store.set('transactions', updatedTransactions);
    log(`Transaction deleted. Remaining count: ${updatedTransactions.length}`);
    return updatedTransactions;
  } catch (error) {
    log(`Error deleting transaction: ${error.message}`, 'error');
    throw error;
  }
});

// IPC handlers for fuel calculations
ipcMain.handle('calculate-fuel', (event, data) => {
  try {
    const { distance, consumption } = data;
    const result = (distance * consumption) / 100;
    
    // Save to history
    const history = store.get('history', []);
    history.push({
      date: new Date().toISOString(),
      distance,
      consumption,
      result
    });
    store.set('history', history);
    
    return { success: true, result };
  } catch (error) {
    log(`Error calculating fuel: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
});

// Settings handlers
ipcMain.handle('get-settings', () => {
  try {
    return { success: true, settings: store.get('settings') };
  } catch (error) {
    log(`Error getting settings: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-settings', (event, settings) => {
  try {
    store.set('settings', settings);
    return { success: true };
  } catch (error) {
    log(`Error updating settings: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Error handling
process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'error');
  if (error.stack) {
    log(error.stack, 'error');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}\nReason: ${reason}`, 'error');
});

// Add event listener for window close
app.on('before-quit', () => {
  log('Application closing - saving final backup');
  const finalBackup = path.join(app.getPath('userData'), 'final-backup.json');
  fs.writeFileSync(finalBackup, JSON.stringify(store.store, null, 2), 'utf8');
});