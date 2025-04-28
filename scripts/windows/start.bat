@echo off

echo Starting Bunker Boats (PRODUCTION MODE)...
cd /d "%~dp0"

REM Проверяем наличие node_modules
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Собираем фронтенд
echo Building frontend...
call npm run build

REM Запускаем Electron в production-режиме
cd /d "%~dp0\..\.."
echo Starting Electron in production mode...
start /B cmd /c "set NODE_ENV=production && electron ."

echo Application started!
pause