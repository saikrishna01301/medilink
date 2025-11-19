@echo off
echo ========================================
echo Starting Redis 8.2 for MediLink
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if container already exists
docker ps -a --filter "name=redis-medilink" --format "{{.Names}}" | findstr /C:"redis-medilink" >nul
if %errorlevel% equ 0 (
    echo Redis container already exists. Starting it...
    docker start redis-medilink
) else (
    echo Creating and starting new Redis container...
    docker run -d --name redis-medilink -p 6379:6379 redis:8.2
)

REM Wait a moment for Redis to start
timeout /t 2 /nobreak >nul

REM Test connection
echo.
echo Testing Redis connection...
docker exec redis-medilink redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ✓ Redis is running successfully on port 6379
    echo.
    echo You can test it with:
    echo   docker exec -it redis-medilink redis-cli ping
    echo.
) else (
    echo.
    echo ⚠ Warning: Could not connect to Redis. It may still be starting...
    echo Wait a few seconds and try: docker exec -it redis-medilink redis-cli ping
    echo.
)

pause

