@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (echo Install Node.js 24 LTS first. & pause & exit /b 1)
if not exist node_modules call npm ci
if not exist .env copy .env.example .env >nul
echo Open http://localhost:3000
call npm start
pause
