@echo off
TITLE GigShield AI - Full Stack Launcher
color 0A

echo.
echo ===================================================
echo   GigShield AI - Starting All Services
echo ===================================================
echo.

REM ---- 1. Start AI Service (Python FastAPI) ----
echo [1/3] Starting AI Service on http://localhost:8000 ...
start "GigShield-AI" cmd /k "cd /d \"%~dp0gigshield-ai\" && echo Activating venv... && call venv\Scripts\activate.bat && echo Starting FastAPI... && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Waiting for AI service to warm up...
timeout /t 5 /nobreak > nul

REM ---- 2. Start Backend (Spring Boot) ----
echo [2/3] Starting Backend on http://localhost:8081 ...
start "GigShield-Backend" cmd /k "cd /d \"%~dp0gigshield-backend\" && echo Building backend... && mvn spring-boot:run -q"

echo Waiting for backend to start up (this may take 20-30 seconds)...
timeout /t 25 /nobreak > nul

REM ---- 3. Start Frontend (Vite React) ----
echo [3/3] Starting Frontend on http://localhost:5173 ...
start "GigShield-Frontend" cmd /k "cd /d \"%~dp0gigshield-frontend\" && echo Starting frontend dev server... && npm run dev"

echo.
echo ===================================================
echo   All services launched in separate windows!
echo.
echo   AI Service  : http://localhost:8000/health
echo   Backend     : http://localhost:8081/actuator/health
echo   Frontend    : http://localhost:5173
echo   Swagger UI  : http://localhost:8081/swagger-ui.html
echo ===================================================
echo.
echo Press any key to close this launcher window.
pause > nul
