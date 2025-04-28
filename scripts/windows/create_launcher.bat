@echo off
setlocal

echo Создание лаунчера приложения...

REM Проверяем наличие .NET SDK
dotnet --version >nul 2>&1
if errorlevel 1 (
    echo Ошибка: .NET SDK не установлен!
    echo Пожалуйста, установите .NET SDK 6.0 или выше.
    pause
    exit /b 1
)

REM Создаем директорию для выходных файлов
if not exist "..\..\release" mkdir "..\..\release"

REM Компилируем проект
echo Компиляция проекта...
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=true -p:PublishReadyToRun=true

REM Копируем exe файл в release директорию
copy /Y "bin\Release\net6.0-windows\win-x64\publish\FuelAppLauncher.exe" "..\..\release\FuelApp.exe"

echo Лаунчер успешно создан!
echo Файл находится в директории release\FuelApp.exe
pause 