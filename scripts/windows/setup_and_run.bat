@echo off
echo Установка и запуск приложения Bunker Boats

echo Проверка наличия Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ОШИБКА: Node.js не найден!
    echo Пожалуйста, установите Node.js с сайта https://nodejs.org/
    pause
    exit /b 1
)

echo Проверка версии Node.js...
for /f "tokens=*" %%i in ('node -v') do set nodeVersion=%%i
echo Установлена версия Node.js: %nodeVersion%

echo Установка зависимостей...
call npm install

if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось установить зависимости!
    pause
    exit /b 1
)

echo Зависимости успешно установлены!
echo.
echo Запуск приложения...
echo.
call npm start

pause 