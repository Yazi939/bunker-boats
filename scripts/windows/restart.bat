@echo off
chcp 1251
cls
echo *************************************
echo * Перезапуск приложения Fuel Manager *
echo *************************************

cd %~dp0

echo [1/4] Остановка всех процессов...

:: Останавливаем Electron
taskkill /f /im electron.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo - Electron остановлен
) else (
    echo - Electron не найден или уже остановлен
)

:: Останавливаем Node.js (Vite и API)
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo - Node.js процессы остановлены (API и Vite)
) else (
    echo - Node.js процессы не найдены или уже остановлен
)

:: Принудительное освобождение портов
echo [2/4] Освобождение портов...

FOR /F "tokens=5" %%a IN ('netstat -ano ^| findstr ":5000"') DO (
    taskkill /F /PID %%a >nul 2>&1
    echo - Освобожден порт 5000 (процесс %%a)
)

FOR /F "tokens=5" %%a IN ('netstat -ano ^| findstr ":5173"') DO (
    taskkill /F /PID %%a >nul 2>&1
    echo - Освобожден порт 5173 (процесс %%a)
)

timeout /t 2 /nobreak >nul

echo [3/4] Проверка конфигурации...
if not exist server\.env (
  echo NODE_ENV=development> server\.env
  echo PORT=5000>> server\.env
  echo JWT_SECRET=fuel1234567890secret>> server\.env
  echo Файл .env создан.
)

if not exist server\data (
  mkdir server\data
  echo Папка для данных создана.
)

echo [4/4] Запуск приложения заново...

:: Запуск сервера API
cd server
start cmd /c "npm run dev"
cd ..
echo - Сервер API запущен на порту 5000
timeout /t 3 /nobreak >nul

:: Запуск Vite сервера
start cmd /c "npm run start"
echo - Vite сервер запущен на порту 5173
timeout /t 5 /nobreak >nul

:: Запуск Electron
start cmd /c "npm run electron:dev"
echo - Electron приложение запущено

echo.
echo Приложение перезапущено успешно!
echo.
pause 