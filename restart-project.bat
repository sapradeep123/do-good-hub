@echo off
echo Starting backend...
start "backend" cmd /k "cd backend & npm run dev"
timeout /t 2 >nul
echo Starting frontend...
start "frontend" cmd /k "npm run dev"
echo Both servers started. You can close this window.
pause

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
