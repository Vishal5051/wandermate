@echo off
echo Starting WanderMates MVP...
echo.
echo Starting backend on http://localhost:5000
start cmd /k "cd backend && npm start"
timeout /t 5 /nobreak >nul
echo Starting frontend on http://localhost:3000
start cmd /k "cd frontend && npm start"
echo.
echo ========================================
echo    WanderMates is starting!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5000
echo.
echo Demo Login:
echo   Email: sarah@example.com
echo   Password: password123
echo.
