@echo off
echo ===== Оптимизированная сборка приложения Bunker Boats =====

echo 1. Очистка кэша и временных файлов...
if exist "dist" rmdir /s /q "dist"
if exist "release" rmdir /s /q "release"
if exist ".vite" rmdir /s /q ".vite"

echo 2. Проверка и установка зависимостей...
call npm ci --production=false
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось установить зависимости!
    pause
    exit /b 1
)

echo 3. Сборка React-приложения с оптимизацией...
call npm run build
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось собрать приложение!
    pause
    exit /b 1
)

echo 4. Копирование необходимых файлов в dist...
copy main.js dist\main.js /Y
copy preload.js dist\preload.js /Y

echo 5. Создание минимального package.json в dist...
echo {
echo   "name": "fuel",
echo   "version": "1.0.0",
echo   "main": "main.js",
echo   "private": true,
echo   "dependencies": {}
echo } > dist\package.json

echo 6. Создание оптимизированного установщика...
call npm run package
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось создать установщик!
    pause
    exit /b 1
)

echo ===== Сборка успешно завершена! =====
echo Установщик находится в папке dist\BunkerBoats-Setup.exe
echo Размер установщика значительно уменьшен благодаря оптимизации.
echo.

pause 