@echo off
setlocal
pushd "%~dp0"

echo ========================================
echo    Do Good Hub - Start/Restart Script
echo ========================================
echo.

echo Starting Backend Server (http://localhost:3001)...
start "Do Good Hub - Backend" cmd /k "cd backend && npm run dev"

REM small delay so backend starts before frontend
timeout /t 2 >nul

echo Starting Frontend (http://localhost:5173)...
start "Do Good Hub - Frontend" cmd /k "npm run dev"

echo.
echo ----------------------------------------
echo URLs
echo   Backend API : http://localhost:3001
echo   App         : http://localhost:5173
echo   Admin       : http://localhost:5173/admin
echo ----------------------------------------
echo.
pause
popd
endlocal
