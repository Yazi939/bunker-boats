@echo off
setlocal

echo Создание инсталлятора...

REM Проверяем наличие NSIS
where makensis >nul 2>&1
if errorlevel 1 (
    echo Ошибка: NSIS не установлен!
    echo Пожалуйста, установите NSIS 3.0 или выше.
    echo Скачать можно здесь: https://nsis.sourceforge.io/Download
    pause
    exit /b 1
)

REM Создаем директорию для выходных файлов
if not exist "..\..\release" mkdir "..\..\release"

REM Создаем инсталлятор
echo Создание инсталлятора...
makensis installer.nsi

echo Инсталлятор успешно создан!
echo Файл находится в директории release\FuelApp_Setup.exe
pause 