const { autoUpdater } = require('electron-updater');
const { ipcMain } = require('electron');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// Настройка URL для проверки обновлений
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'Yazi939',
  repo: 'bunker-boats',
  private: false,
  releaseType: 'release'
});

function setupAutoUpdater(mainWindow) {
  // Отправляем статус обновления в рендерер
  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('update-status', 'checking');
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-status', 'available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    mainWindow.webContents.send('update-status', 'not-available', info);
  });

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-status', 'error', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow.webContents.send('update-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update-status', 'downloaded', info);
  });

  // Обработчики IPC для обновления
  ipcMain.on('check-for-updates', () => {
    autoUpdater.checkForUpdates();
  });

  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
  });

  // Проверяем обновления при запуске
  autoUpdater.checkForUpdates();
}

module.exports = { setupAutoUpdater }; 