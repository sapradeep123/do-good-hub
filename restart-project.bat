@echo off
echo ========================================
echo    Do Good Hub Project Restart Script
echo ========================================
echo.

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm run dev"

echo.
echo Starting Frontend Server...
cd ..
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo    Servers are starting...
echo    Backend: http://localhost:3002
echo    Frontend: Check terminal for port
echo    Admin: http://localhost:8084/admin
echo ========================================
echo.
pause
