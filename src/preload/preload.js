const { contextBridge, ipcRenderer } = require('electron');

// Функция для логирования в консоль преложения
function logToConsole(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

logToConsole('Preload script запущен');

// Устанавливаем индикатор загрузки приложения
window.addEventListener('DOMContentLoaded', () => {
  logToConsole('DOM загружен, инициализация приложения...');
  
  // Сообщаем главному процессу, что рендерер загружен
  setTimeout(() => {
    logToConsole('Приложение инициализировано');
    document.body.classList.add('app-loaded');
  }, 1000);
});

// Безопасно экспортируем API для использования в рендерере
contextBridge.exposeInMainWorld('electronAPI', {
  // Асинхронный расчет с использованием invoke вместо send/on
  calculateFuel: (data) => ipcRenderer.invoke('calculate-fuel', data),
  
  // API для работы с транзакциями
  transactions: {
    getAll: async () => {
      try {
        logToConsole('Requesting all transactions...');
        const result = await ipcRenderer.invoke('transactions-get-all');
        logToConsole(`Received ${result.length} transactions`);
        return result;
      } catch (error) {
        logToConsole(`Error getting transactions: ${error.message}`);
        throw error;
      }
    },
    add: async (transaction) => {
      try {
        logToConsole(`Adding transaction: ${JSON.stringify(transaction)}`);
        const result = await ipcRenderer.invoke('transactions-add', transaction);
        logToConsole(`Transaction added successfully. New count: ${result.length}`);
        // Verify the transaction was added
        const verify = await ipcRenderer.invoke('transactions-get-all');
        logToConsole(`Verification - current transactions: ${verify.length}`);
        return result;
      } catch (error) {
        logToConsole(`Error adding transaction: ${error.message}`);
        throw error;
      }
    },
    update: async (transaction) => {
      try {
        logToConsole(`Updating transaction: ${JSON.stringify(transaction)}`);
        const result = await ipcRenderer.invoke('transactions-update', transaction);
        logToConsole('Transaction updated successfully');
        return result;
      } catch (error) {
        logToConsole(`Error updating transaction: ${error.message}`);
        throw error;
      }
    },
    delete: async (id) => {
      try {
        logToConsole(`Deleting transaction: ${id}`);
        const result = await ipcRenderer.invoke('transactions-delete', id);
        logToConsole('Transaction deleted successfully');
        return result;
      } catch (error) {
        logToConsole(`Error deleting transaction: ${error.message}`);
        throw error;
      }
    }
  },

  // API для работы с транспортными средствами
  vehicles: {
    getAll: () => ipcRenderer.invoke('vehicles-get-all'),
    add: (vehicle) => ipcRenderer.invoke('vehicles-add', vehicle),
    update: (vehicle) => ipcRenderer.invoke('vehicles-update', vehicle),
    delete: (id) => ipcRenderer.invoke('vehicles-delete', id)
  },
  
  // Версия приложения
  getAppVersion: () => process.env.npm_package_version || '1.0.0',
  
  // Состояние приложения
  isElectron: true,
  
  // Методы для контроля состояния загрузки
  appReady: () => {
    logToConsole('Приложение сообщает о готовности');
    return true;
  },

  // Пользователи
  initializeUsers: () => ipcRenderer.invoke('users:initialize'),
  getCurrentUser: () => ipcRenderer.invoke('users:getCurrentUser'),
  login: (credentials) => ipcRenderer.invoke('users:login', credentials),
  logout: () => ipcRenderer.invoke('users:logout'),

  // Данные
  getData: (key) => ipcRenderer.invoke('data:get', key),
  setData: (key, value) => ipcRenderer.invoke('data:set', { key, value }),

  // Синхронизация
  syncGetData: (dataType) => ipcRenderer.invoke('sync:getData', dataType),
  syncSetData: (dataType, data) => ipcRenderer.invoke('sync:setData', { dataType, data }),
});

// Отключаем обновление страницы для предотвращения циклов загрузки
window.addEventListener('keydown', (e) => {
  // Предотвращаем F5 и Ctrl+R
  if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
    e.preventDefault();
    logToConsole('Попытка обновления страницы предотвращена');
  }
}, true);

// Логируем успешную загрузку preload
logToConsole('Preload script загружен успешно');