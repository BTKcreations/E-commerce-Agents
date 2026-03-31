@echo off
setlocal enabledelayedexpansion
title AI E-Commerce Setup Wizard

echo ===================================================
echo    🛍️  ShopSmart AI: Project Setup Wizard
echo ===================================================
echo.

REM 1. Check for Node.js
echo [1/6] Checking for Node.js...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is NOT installed.
    echo Please download and install it from https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo.

REM 2. Check for pnpm
echo [2/6] Checking for pnpm...
where pnpm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] pnpm is NOT installed.
    echo.
    echo Installing pnpm globally...
    npm install -g pnpm
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install pnpm automatically. 
        echo Please run: npm install -g pnpm
        pause
        exit /b 1
    )
)
echo [SUCCESS] pnpm is ready.
echo.

REM 3. Install Dependencies
echo [3/6] Installing project dependencies...
call pnpm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] pnpm install failed.
    pause
    exit /b 1
)
echo [SUCCESS] Dependencies installed.
echo.

REM 4. Check for .env file
echo [4/6] Configuring Environment Variables...
if not exist ".env" (
    echo No .env file found. Creating a default one...
    echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce > .env
    echo JWT_SECRET=smart_shop_secret_2026 >> .env
    echo AI_INTEGRATIONS_OPENAI_API_KEY=your_key_here >> .env
    echo AI_INTEGRATIONS_OPENAI_MODEL=gpt-4o >> .env
    echo.
    echo [IMPORTANT] .env file created with defaults. 
    echo Please update the DATABASE_URL with your PostgreSQL credentials.
) else (
    echo [SUCCESS] .env file already exists.
)
echo.

REM 5. Prompt for Database Setup
echo [5/6] Database Initialization
echo.
echo IMPORTANT: Ensure PostgreSQL is running on port 5432.
echo.
set /p run_db="Do you want to initialize the database now? (Push Schema & Seed Data) [y/n]: "
if /i "%run_db%"=="y" (
    echo.
    echo [A] Pushing database schema...
    call pnpm db:push
    echo.
    echo [B] Seeding initial products...
    call pnpm db:seed
    echo.
    echo [SUCCESS] Database is ready!
) else (
    echo Skipping database initialization. Remember to run 'pnpm db:push' later.
)
echo.

REM 6. Completion
echo [6/6] Setup Complete!
echo.
echo ===================================================
echo    SUCCESS: Your project is ready to go!
echo.
echo    TO START THE PROJECT:
echo    1. Double-click 'run_project.bat'
echo    2. The store will open at http://localhost:5173
echo ===================================================
echo.
pause
