#!/bin/bash

# BuyNest launcher for macOS and Linux
echo "======================================================================="
echo "                Welcome to BuyNest E-Commerce Platform"
echo "                \"Your Home for Everything\" - Dev Launcher"
echo "======================================================================="
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed on this system!"
    echo "Please install Node.js (v18 or higher) and try again."
    exit 1
fi

# Check for backend env file
if [ ! -f "buynest-backend/.env" ]; then
    echo "[INFO] Creating backend .env file from template..."
    cp buynest-backend/.env.example buynest-backend/.env
    echo "[WARNING] A backend .env file has been created at buynest-backend/.env"
    echo "Please open it and configure your keys (e.g. Razorpay, SMTP, Supabase secrets)."
    echo ""
fi

# Check for frontend env file
if [ ! -f "buynest-frontend/.env" ]; then
    echo "[INFO] Creating frontend .env file..."
    cat <<EOT > buynest-frontend/.env
# Supabase Configuration
VITE_SUPABASE_URL=https://huavhlrmjelegvipjgdv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YXZobHJtamVsZWd2aXBqZ2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDE4NzIsImV4cCI6MjA5NjYxNzg3Mn0.8aB5HWb0aqcIuiv3Sqca0LLrH-UAYSSliCVKaEh1zcI

# Backend API Base URL
VITE_API_BASE_URL=http://localhost:5000/api

# App Info
VITE_APP_NAME=BuyNest
VITE_APP_ENV=development
EOT
    echo "[SUCCESS] A frontend .env file has been created at buynest-frontend/.env"
    echo ""
fi

# Install dependencies if not present
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing runner dependencies..."
    npm install --legacy-peer-deps
fi

if [ ! -d "buynest-backend/node_modules" ]; then
    echo "[INFO] Installing backend dependencies..."
    (cd buynest-backend && npm install --legacy-peer-deps)
fi

if [ ! -d "buynest-frontend/node_modules" ]; then
    echo "[INFO] Installing frontend dependencies..."
    (cd buynest-frontend && npm install --legacy-peer-deps)
fi

echo "[SUCCESS] Dependencies verified. Starting BuyNest..."
echo ""
echo "- Frontend running at: http://localhost:5173"
echo "- Backend running at:  http://localhost:5000"
echo ""

# Run backend and frontend concurrently
npm run dev
