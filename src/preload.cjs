const { contextBridge, ipcRenderer } = require('electron');

// Предоставляем безопасный API для рендерера
contextBridge.exposeInMainWorld('electronAPI', {
  // API для транзакций
  getTransactions: () => ipcRenderer.invoke('transactions-get-all'),
  addTransaction: (transaction) => ipcRenderer.invoke('transactions-add', transaction),
  updateTransaction: (transaction) => ipcRenderer.invoke('transactions-update', transaction),
  deleteTransaction: (id) => ipcRenderer.invoke('transactions-delete', id),

  // API для обновлений
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  installUpdate: () => ipcRenderer.send('install-update'),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_, status, info) => callback(status, info)),
  onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (_, progress) => callback(progress)),

  // API для пользователей
  login: (credentials) => ipcRenderer.invoke('users:login', credentials),
  logout: () => ipcRenderer.invoke('users:logout'),
  getCurrentUser: () => ipcRenderer.invoke('users:getCurrentUser'),

  // API для транспортных средств
  getVehicles: () => ipcRenderer.invoke('vehicles-get-all'),
  addVehicle: (vehicle) => ipcRenderer.invoke('vehicles-add', vehicle),
  updateVehicle: (vehicle) => ipcRenderer.invoke('vehicles-update', vehicle),
  deleteVehicle: (id) => ipcRenderer.invoke('vehicles-delete', id),

  // API для данных
  getData: (key) => ipcRenderer.invoke('data:get', key),
  setData: (key, value) => ipcRenderer.invoke('data:set', { key, value }),

  // API для синхронизации
  getSyncData: (dataType) => ipcRenderer.invoke('sync:getData', dataType),
  setSyncData: (dataType, data) => ipcRenderer.invoke('sync:setData', { dataType, data })
}); 