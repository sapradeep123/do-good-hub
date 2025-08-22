@echo off
echo ========================================
echo    Do Good Hub - Project Restart
echo ========================================
echo.

echo [1/4] Stopping existing processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.exe 2>nul
echo ✓ All Node processes stopped
echo.

echo [2/4] Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm run dev"
echo ✓ Backend server starting on port 3001
echo.

echo [3/4] Waiting for backend to initialize...
timeout /t 10 /nobreak >nul
echo ✓ Backend initialization complete
echo.

echo [4/4] Starting Frontend Development Server...
cd ..
start "Frontend Server" cmd /k "npm run dev"
echo ✓ Frontend server starting on port 5173
echo.

echo ========================================
echo    🚀 Project Started Successfully!
echo ========================================
echo.
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend:  http://localhost:3001
echo 📊 Health Check: http://localhost:3001/health
echo.
echo 💡 Tips:
echo    - Wait for both servers to fully start
echo    - Check browser console for any errors
echo    - Use the cleanup button to clear sample data
echo.
pause
