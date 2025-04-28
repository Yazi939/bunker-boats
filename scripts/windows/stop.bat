@echo off
chcp 65001 >nul
cls
echo *************************************
echo *  Остановка приложения Fuel Manager  *
echo *************************************

echo Остановка всех процессов...

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
    echo - Node.js процессы не найдены или уже остановлены
)

:: Ждем немного для уверенности
timeout /t 2 /nobreak >nul 2>&1

:: Еще раз пытаемся остановить Node.js
taskkill /f /im node.exe >nul 2>&1

:: Ждем немного
timeout /t 1 /nobreak >nul 2>&1

echo.
echo Приложение остановлено!
echo Для запуска приложения используйте start.bat или start_separate.bat
echo.
pause 