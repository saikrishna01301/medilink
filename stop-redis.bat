@echo off
echo ========================================
echo Stopping Redis for MediLink
echo ========================================
echo.

REM Check if container exists
docker ps -a --filter "name=redis-medilink" --format "{{.Names}}" | findstr /C:"redis-medilink" >nul
if %errorlevel% neq 0 (
    echo Redis container not found. Nothing to stop.
    pause
    exit /b 0
)

echo Stopping Redis container...
docker stop redis-medilink

echo.
echo Do you want to remove the container? (Y/N)
set /p choice=

if /i "%choice%"=="Y" (
    echo Removing container...
    docker rm redis-medilink
    echo Container removed.
) else (
    echo Container stopped but not removed.
    echo To start again, run: start-redis.bat
)

echo.
echo Redis stopped successfully.
pause

