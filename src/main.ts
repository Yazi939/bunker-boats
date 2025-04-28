import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import './main/ipc'; // Импортируем IPC-обработчики

const isDev = false;
const baseDir = isDev ? __dirname : path.join(process.resourcesPath, 'app');

// Функция для логирования
function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  fs.appendFileSync(path.join(app.getPath('userData'), 'electron_log.txt'), logMessage, { encoding: 'utf8' });
}

// Проверка порта
async function checkPort(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}`);
    return response.status === 200;
  } catch {
    return false;
  }
}

// Поиск порта Vite
async function findVitePort(): Promise<number | null> {
  log('Поиск сервера Vite...');
  for (let port = 5173; port <= 5183; port++) {
    log(`Проверка порта ${port}...`);
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      log(`Найден сервер на порту ${port}`);
      return port;
    }
  }
  return null;
}

// Проверка сервера Vite
async function checkViteServer(): Promise<number> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    attempts++;
    log(`Попытка ${attempts} найти сервер...`);
    
    const port = await findVitePort();
    if (port) {
      return port;
    }
    
    // Ждем 1 секунду перед следующей попыткой
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Не удалось найти сервер Vite');
}

let mainWindow: BrowserWindow | null;

async function createWindow() {
  log('Создание главного окна...');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(baseDir, 'preload.js')
    }
  });

  log('Главное окно создано');
  
  if (isDev) {
    // В режиме разработки загружаем через Vite
    log('Ожидание сервера Vite...');
    try {
      const port = await checkViteServer();
      const url = `http://localhost:${port}/index.html`;
      log(`Загрузка приложения с ${url}`);
      await mainWindow.loadURL(url);
    } catch (error) {
      log(`Ошибка при загрузке URL: ${error}`);
      throw error;
    }
  } else {
    // В production загружаем локальный файл
    const indexPath = path.join(baseDir, 'index.html');
    log(`Загрузка приложения из ${indexPath}`);
    await mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Логируем запуск приложения
log('Запуск приложения...');

// Обработка ошибок
process.on('uncaughtException', (error) => {
  log(`Необработанное исключение: ${error}`);
});

process.on('unhandledRejection', (error) => {
  log(`Необработанное отклонение промиса: ${error}`);
});

// Запуск приложения
app.whenReady().then(() => {
  log('Приложение готово');
  createWindow();

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 