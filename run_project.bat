@echo off
setlocal
title AI E-Commerce Platform Launcher

echo ===================================================
echo    AI E-Commerce Platform - One-Click Launcher
echo ===================================================
echo.

REM Check for pnpm
where pnpm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] pnpm is not installed or not in PATH.
    echo Please install pnpm: npm install -g pnpm
    pause
    exit /b 1
)

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] .env file not found in root.
    echo Please ensure your environment variables are configured.
)

echo [1/3] Starting Backend Manager...
start "Negotiation Manager Backend" cmd /k "cd artifacts\api-server && pnpm run dev"

echo [2/3] Starting Shop Frontend...
start "E-Commerce Frontend" cmd /k "cd artifacts\ecommerce && pnpm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 8 /nobreak > nul

echo.
echo Opening the application in your browser...
start http://localhost:5173/products

echo.
echo ===================================================
echo    SUCCESS: Application is launching!
echo.
echo    IMPORTANT: 
echo    1. Keep the two new terminal windows open.
echo    2. Ensure Ollama is running for AI features.
echo    3. Ensure PostgreSQL is running on port 5432.
echo ===================================================
echo.
pause
