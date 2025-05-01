# Устанавливаем кодировку UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Переходим в директорию скрипта
Set-Location -Path $PSScriptRoot

Write-Host "Starting Fuel Management Application..." -ForegroundColor Cyan

# Create data directory if it doesn't exist
if (-Not (Test-Path -Path "./server/data")) {
    Write-Host "Creating data directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "./server/data" -Force | Out-Null
}

# Check if the database exists
if (-Not (Test-Path -Path "./server/data/database.sqlite")) {
    Write-Host "Database file not found. A new one will be created on first run." -ForegroundColor Yellow
}

# Check if we need to validate the database
if (Test-Path -Path "./server/data/database.sqlite") {
    Write-Host "Validating database structure..." -ForegroundColor Yellow
    
    # Run database check
    try {
        # Execute the sqlite3 check to see if the volume column exists
        $columnCheck = & sqlite3 ".\server\data\database.sqlite" ".schema" | Select-String -Pattern "volume" -Quiet
        
        if (-Not $columnCheck) {
            Write-Host "The database is missing required columns. Running fix script..." -ForegroundColor Red
            
            # On Windows, we use node to run the script instead of bash
            node server/add_missing_columns.js
            
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Failed to fix the database. You may encounter errors." -ForegroundColor Red
            } else {
                Write-Host "Database fixed successfully!" -ForegroundColor Green
            }
        } else {
            Write-Host "Database structure is valid." -ForegroundColor Green
        }
    } catch {
        Write-Host "Warning: Could not validate database. Make sure sqlite3 is installed." -ForegroundColor Yellow
    }
}

# Check if PM2 is installed
$pm2Installed = $null
try {
    $pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
} catch {
    # PM2 not found
}

if ($pm2Installed) {
    # Start with PM2
    Write-Host "Starting server with PM2..." -ForegroundColor Cyan
    pm2 start ecosystem.config.js
    
    # Start the client (for development)
    if (Test-Path -Path "./src") {
        Write-Host "Starting client development server..." -ForegroundColor Cyan
        npm run dev
    } else {
        Write-Host "Client is already built. Server is running at http://localhost:3000" -ForegroundColor Green
    }
} else {
    # Start without PM2
    Write-Host "PM2 not found. Starting server directly..." -ForegroundColor Yellow
    Write-Host "Starting server..." -ForegroundColor Cyan
    Start-Process -NoNewWindow -FilePath "node" -ArgumentList "server/server.js" 
    
    # Start the client (for development)
    if (Test-Path -Path "./src") {
        Write-Host "Starting client development server..." -ForegroundColor Cyan
        npm run dev
    } else {
        Write-Host "Client is already built. Server is running at http://localhost:3000" -ForegroundColor Green
    }
}

Write-Host "Fuel Management Application is running!" -ForegroundColor Green
Write-Host "Access the application at http://localhost:3000" -ForegroundColor Cyan

pause 