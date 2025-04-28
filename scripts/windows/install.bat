@echo off
chcp 1251
cls
echo *************************************
echo *   Установка Fuel Manager   *
echo *************************************

cd %~dp0

echo [1/3] Установка основных зависимостей...
call npm install
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось установить основные зависимости!
    pause
    exit /b 1
)

echo [2/3] Установка зависимостей сервера...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось установить серверные зависимости!
    cd ..
    pause
    exit /b 1
)
cd ..

echo [3/3] Создание .env файла...
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

echo.
echo Установка завершена успешно!
echo Для запуска приложения используйте start.bat
echo. 