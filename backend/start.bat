@echo off
REM Quick Start Script for ProdAIctive Backend (Windows)

echo ======================================
echo ProdAIctive Backend - Quick Start
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install from https://nodejs.org/
    exit /b 1
)

echo ✓ Node.js is installed
for /f "tokens=*" %%i in ('node -v') do echo Node version: %%i
echo.

REM Navigate to backend directory
cd backend || (
    echo ❌ Backend directory not found
    exit /b 1
)

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found. Creating a template...
    (
        echo MONGODB_URI=mongodb://localhost:27017/prodaictive
        echo PORT=5000
        echo JWT_SECRET=your_secret_key_here_change_in_production
        echo NODE_ENV=development
    ) > .env
    echo ✓ .env file created. Please update it with your configuration.
    echo.
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
    echo ✓ Dependencies installed
    echo.
)

REM Start the server
echo 🚀 Starting ProdAIctive Backend...
echo Server will be available at http://localhost:5000
echo API endpoints available at http://localhost:5000/api
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev

pause
