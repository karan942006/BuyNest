@echo off
title BuyNest - Direct Runnable launcher
color 0B
echo =======================================================================
echo                 Welcome to BuyNest E-Commerce Platform
echo                 "Your Home for Everything" - Dev Launcher
echo =======================================================================
echo.

:: Check Node.js installation
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed on this system!
    echo Please install Node.js (v18 or higher) from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

:: Check for backend env file
if not exist "buynest-backend\.env" (
    echo [INFO] Creating backend .env file from template...
    copy "buynest-backend\.env.example" "buynest-backend\.env" >nul
    echo [WARNING] A backend .env file has been created at buynest-backend/.env
    echo Please open it and configure your keys (e.g. Razorpay, SMTP, Supabase secrets).
    echo.
)

:: Check for frontend env file
if not exist "buynest-frontend\.env" (
    echo [INFO] Creating frontend .env file...
    :: Create a default .env pointing to local backend and sandbox Supabase
    echo # Supabase Configuration > "buynest-frontend\.env"
    echo VITE_SUPABASE_URL=https://huavhlrmjelegvipjgdv.supabase.co >> "buynest-frontend\.env"
    echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YXZobHJtamVsZWd2aXBqZ2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDE4NzIsImV4cCI6MjA5NjYxNzg3Mn0.8aB5HWb0aqcIuiv3Sqca0LLrH-UAYSSliCVKaEh1zcI >> "buynest-frontend\.env"
    echo. >> "buynest-frontend\.env"
    echo # Backend API Base URL >> "buynest-frontend\.env"
    echo VITE_API_BASE_URL=http://localhost:5000/api >> "buynest-frontend\.env"
    echo. >> "buynest-frontend\.env"
    echo # App Info >> "buynest-frontend\.env"
    echo VITE_APP_NAME=BuyNest >> "buynest-frontend\.env"
    echo VITE_APP_ENV=development >> "buynest-frontend\.env"
    echo [SUCCESS] A frontend .env file has been created at buynest-frontend/.env
    echo.
)

:: Check node_modules in root
if not exist "node_modules" (
    echo [INFO] Root node_modules not found. Installing runner dependencies...
    powershell -ExecutionPolicy Bypass -Command "npm install --legacy-peer-deps"
)

:: Check node_modules in backend
if not exist "buynest-backend\node_modules" (
    echo [INFO] Backend node_modules not found. Installing dependencies...
    cd buynest-backend && powershell -ExecutionPolicy Bypass -Command "npm install --legacy-peer-deps" && cd ..
)

:: Check node_modules in frontend
if not exist "buynest-frontend\node_modules" (
    echo [INFO] Frontend node_modules not found. Installing dependencies...
    cd buynest-frontend && powershell -ExecutionPolicy Bypass -Command "npm install --legacy-peer-deps" && cd ..
)

echo [SUCCESS] Dependencies verified. Starting BuyNest...
echo.
echo - Frontend running at: http://localhost:5173
echo - Backend running at:  http://localhost:5000
echo.
echo Press Ctrl+C to stop the servers.
echo =======================================================================
echo.

:: Run backend and frontend concurrently in the same window
powershell -ExecutionPolicy Bypass -Command "npm run dev"

exit 0
