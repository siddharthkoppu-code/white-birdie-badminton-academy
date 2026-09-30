@echo off
title Push White Birdie Badminton Academy to GitHub
echo ========================================================
echo   WHITE BIRDIE BADMINTON ACADEMY - PUSH TO GITHUB
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Git repository status...
if not exist ".git" (
    echo Initializing Git repository...
    git init
    git branch -M main
)

echo.
echo [2/4] Configuring remote repository...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/siddharthkoppu-code/white-birdie-badminton-academy.git
git branch -M main

echo.
echo [3/4] Staging and committing files...
git add .
git commit -m "Update White Birdie Badminton Academy website and coach portal"

echo.
echo [4/4] Pushing to GitHub (main branch)...
git push -u origin main --force

echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo    SUCCESS! Your code has been pushed to GitHub.
    echo    GitHub Pages will deploy your site automatically.
    echo ========================================================
) else (
    echo ========================================================
    echo    NOTE: If asked, please sign in to your GitHub account
    echo    in the browser window or terminal prompt.
    echo ========================================================
)

echo.
pause
