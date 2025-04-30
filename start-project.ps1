# Скрипт для запуска проекта FUEL Manager
Write-Host "=== FUEL Manager - Launching Application ===" -ForegroundColor Green

# Функция запуска сервера
function Start-Server {
    Write-Host "`nStarting server..." -ForegroundColor Yellow
    
    # Переходим в директорию сервера
    Set-Location ".\server"
    
    # Запускаем сервер в новом окне PowerShell
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"
    
    # Возвращаемся в исходную директорию
    Set-Location ".."
    
    Write-Host "Server started in a new window" -ForegroundColor Green
}

# Функция запуска клиентского приложения
function Start-Client {
    Write-Host "`nStarting client application..." -ForegroundColor Yellow
    
    # Запускаем клиент в новом окне PowerShell
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    
    Write-Host "Client started in a new window" -ForegroundColor Green
}

# Функция запуска Electron-приложения
function Start-Electron {
    Write-Host "`nStarting Electron application..." -ForegroundColor Yellow
    
    # Запускаем Electron в новом окне PowerShell
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run electron:dev"
    
    Write-Host "Electron application started in a new window" -ForegroundColor Green
}

# Показываем меню
function Show-Menu {
    Clear-Host
    Write-Host "=== FUEL Manager - Control Panel ===" -ForegroundColor Cyan
    Write-Host "1. Start Server only" -ForegroundColor White
    Write-Host "2. Start Client (Vite) only" -ForegroundColor White
    Write-Host "3. Start Electron application only" -ForegroundColor White
    Write-Host "4. Start everything (Server + Client + Electron)" -ForegroundColor Green
    Write-Host "5. Restart Server" -ForegroundColor Yellow
    Write-Host "6. Exit" -ForegroundColor Red
    Write-Host "`nMake your selection: " -ForegroundColor Cyan -NoNewline
}

# Основной цикл
$selection = 0
do {
    Show-Menu
    $selection = Read-Host
    
    switch ($selection) {
        "1" {
            Start-Server
            pause
        }
        "2" {
            Start-Client
            pause
        }
        "3" {
            Start-Electron
            pause
        }
        "4" {
            Start-Server
            Start-Client
            Start-Electron
            pause
        }
        "5" {
            Write-Host "`nRestarting Server..." -ForegroundColor Yellow
            # Останавливаем процессы Node.js (это может остановить все Node.js процессы!)
            Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
            # Запускаем сервер заново
            Start-Server
            pause
        }
        "6" {
            Write-Host "`nExiting..." -ForegroundColor Red
        }
        default {
            Write-Host "`nInvalid selection, try again" -ForegroundColor Red
            pause
        }
    }
} while ($selection -ne "6") 