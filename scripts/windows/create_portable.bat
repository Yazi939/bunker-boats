@echo off
echo Создание исполняемого файла приложения Bunker Boats

echo Проверка наличия Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ОШИБКА: Node.js не найден!
    echo Пожалуйста, установите Node.js с сайта https://nodejs.org/
    pause
    exit /b 1
)

echo Установка зависимостей...
call npm install

if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось установить зависимости!
    pause
    exit /b 1
)

echo Сборка приложения...
call npm run make-exe

if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось создать исполняемый файл!
    pause
    exit /b 1
)

echo.
echo Готово! Исполняемый файл создан в папке dist\win-unpacked
echo Вы можете скопировать содержимое этой папки для переноса на другой компьютер.
echo Или вы можете использовать файл установщика BunkerBoats-Setup.exe из папки dist.
echo.

pause 