# PowerShell script for fixing dependencies

Write-Host "=== Fixing project dependencies ===" -ForegroundColor Green

# 1. Installing an older version of react-router-dom compatible with Node.js v18
Write-Host "Downgrading react-router-dom to a version compatible with Node.js v18..." -ForegroundColor Yellow
npm uninstall react-router-dom
npm install react-router-dom@6.20.1 --save

# 2. Reinstalling sqlite3 and better-sqlite3 with specific versions known to have prebuilt binaries for Node.js v18
Write-Host "Reinstalling SQLite dependencies with compatible versions..." -ForegroundColor Yellow
npm uninstall sqlite3
npm uninstall better-sqlite3
npm install sqlite3@5.1.6 --save
npm install better-sqlite3@8.6.0 --save

# 3. Installing dependencies in the server directory
Write-Host "Installing dependencies in the server directory..." -ForegroundColor Yellow
Set-Location -Path server
npm install
Set-Location -Path ..

Write-Host "=== Dependency fixes completed ===" -ForegroundColor Green 