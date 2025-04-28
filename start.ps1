# Устанавливаем кодировку UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Переходим в директорию скрипта
Set-Location -Path $PSScriptRoot

Write-Host "Starting Bunker Boats..."

# Проверяем, установлены ли зависимости
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies"
        pause
        exit 1
    }
}

# Запускаем Vite в фоновом режиме
Write-Host "Starting Vite server..."
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run dev"

# Ждем 5 секунд, чтобы Vite успел запуститься
Write-Host "Waiting for Vite server to start..."
Start-Sleep -Seconds 5

# Запускаем Electron
Write-Host "Starting Electron..."
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run electron:dev"

Write-Host "Application started!"
Write-Host "If you see a white screen, please wait a few seconds for the application to load."
Write-Host "Check electron_log.txt for more information if needed."

pause 