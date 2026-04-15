@echo off
echo ========================================
echo WanderMates MVP - Windows Setup Script
echo ========================================
echo.

echo Checking prerequisites...

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

:: Check for npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)
echo [OK] npm found
echo.

echo Database Setup
echo Please make sure PostgreSQL is installed and running
echo.

set /p DB_PASSWORD="Enter PostgreSQL password (default: postgres): "
if "%DB_PASSWORD%"=="" set DB_PASSWORD=postgres

echo.
echo Creating database...
psql -U postgres -c "CREATE DATABASE wandermates;" 2>nul
if %errorlevel% equ 0 (
    echo [OK] Database 'wandermates' created
) else (
    echo [WARNING] Database might already exist, continuing...
)
echo.

echo Configuring backend...
cd backend

:: Create .env file
(
echo DB_HOST=localhost
echo DB_PORT=5433
echo DB_NAME=wandermates
echo DB_USER=postgres
echo DB_PASSWORD=%DB_PASSWORD%
echo.
echo PORT=5000
echo NODE_ENV=development
echo.
echo JWT_SECRET=wandermates-secret-key-windows
echo.
echo WS_PORT=5001
echo UPLOAD_PATH=./uploads
echo MAX_FILE_SIZE=5242880
) > .env

echo [OK] Backend configured
echo.

echo Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
echo.

echo Initializing database...
call npm run init-db
if %errorlevel% neq 0 (
    echo [ERROR] Failed to initialize database
    pause
    exit /b 1
)
echo [OK] Database initialized
echo.

echo Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
echo.

cd ..

:: Create start script
(
echo @echo off
echo echo Starting WanderMates MVP...
echo echo.
echo echo Starting backend on http://localhost:5000
echo start cmd /k "cd backend && npm start"
echo timeout /t 5 /nobreak ^>nul
echo echo Starting frontend on http://localhost:3000
echo start cmd /k "cd frontend && npm start"
echo echo.
echo echo ========================================
echo echo    WanderMates is starting!
echo echo ========================================
echo echo.
echo echo Frontend: http://localhost:3000
echo echo Backend: http://localhost:5000
echo echo.
echo echo Demo Login:
echo echo   Email: sarah@example.com
echo echo   Password: password123
echo echo.
) > start.bat

echo [OK] Created start.bat script
echo.

echo ========================================
echo          Setup Complete!
echo ========================================
echo.
echo To start the application, run:
echo   start.bat
echo.
echo Or manually in separate terminals:
echo   Terminal 1: cd backend ^&^& npm start
echo   Terminal 2: cd frontend ^&^& npm start
echo.
echo See README.md for full documentation
echo.
pause
