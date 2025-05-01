@echo off
echo Starting Fuel Management Application...

REM Create data directory if it doesn't exist
if not exist "server\data" (
  echo Creating data directory...
  mkdir "server\data"
)

REM Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo PM2 found, starting with PM2...
  pm2 start ecosystem.config.js
) else (
  echo PM2 not found, starting server directly...
  start /B node server/server.js
)

REM Check if we're in development
if exist "src\" (
  echo Starting development server...
  npm run dev
) else (
  echo Server is running at http://localhost:3000
)

echo.
echo Fuel Management Application is running!
echo Access the application at http://localhost:3000
echo.
echo Press any key to exit this window (the application will continue running)
pause > nul 