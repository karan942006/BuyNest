@echo off
title BuyNest - GitHub Deployment Assistant
color 0B
echo =======================================================================
echo                 BuyNest GitHub Deployment Assistant
echo =======================================================================
echo.

:: Check Git installation
git --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Git is not installed on this system!
    echo Please install Git from https://git-scm.com/ and try again.
    echo.
    pause
    exit /b 1
)

:: Step 1: Initialize Git Repository
if not exist ".git" (
    echo [INFO] Initializing a new Git repository...
    git init
    echo [SUCCESS] Git repository initialized.
    echo.
) else (
    echo [INFO] Git repository already initialized.
    echo.
)

:: Step 2: Add all files
echo [INFO] Staging all files for commit...
git add .
echo [SUCCESS] All files staged.
echo.

:: Step 3: Create initial commit
echo [INFO] Creating initial commit...
:: Check if there are changes to commit
git status | findstr "nothing to commit" >nul
if %errorlevel% equ 0 (
    echo [INFO] No new changes to commit.
) else (
    git commit -m "initial commit: BuyNest Full-Stack Enterprise Platform"
    echo [SUCCESS] Initial commit created.
)
echo.

:: Step 4: Set branch to main
git branch -M main
echo [INFO] Branch set to 'main'.
echo.

:: Step 5: Ask for GitHub URL
echo =======================================================================
echo                       GitHub Configuration
echo =======================================================================
echo.
echo Create a new repository on GitHub (https://github.com/new).
echo Do NOT initialize it with README, .gitignore, or License.
echo.
set /p REPO_URL="Enter your GitHub Repository URL (e.g. https://github.com/username/buynest.git): "

if not defined REPO_URL (
    color 0E
    echo [WARNING] No repository URL provided. Skipping push.
    echo You can push manually using:
    echo   git remote add origin YOUR_REPOSITORY_URL
    echo   git push -u origin main
    echo.
    pause
    exit /b 0
)

:: Step 6: Set origin remote and push
echo.
echo [INFO] Configuring remote origin and pushing to GitHub...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
echo [INFO] Pushing to origin main (this might prompt for authentication)...
git push -u origin main

if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Failed to push code to GitHub.
    echo Please verify the URL, check your internet connection, and ensure you have write permissions.
    echo.
) else (
    color 0A
    echo [SUCCESS] BuyNest has been successfully pushed to GitHub!
    echo.
    echo =======================================================================
    echo                          Deployment Complete!
    echo =======================================================================
    echo.
    echo 1. Your code is now live on GitHub: %REPO_URL%
    echo 2. Go to Vercel (https://vercel.com) and import your frontend (buynest-frontend)
    echo 3. Go to Render (https://render.com) and import your backend (buynest-backend)
    echo.
)

pause
exit /b 0
