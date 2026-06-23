@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ========================================
echo    Blog Deploy - Build ^& Upload
echo ========================================
echo.

:: Step 1: Build
echo [1/2] pnpm generate ...
call pnpm generate
if %errorlevel% neq 0 (
    echo.
    echo [FAIL] Build failed!
    pause
    exit /b %errorlevel%
)
echo       Build done.
echo.

:: Step 2: Upload via rclone
echo [2/2] rclone sync to Aliyun VPS ...

rclone sync .output/public Aliyun:/opt/1panel/www/sites/blog.olinl.com/index ^
    --progress ^
    --transfers 16 ^
    --checkers 32 ^
    --delete-excluded ^
    --ignore-times ^
    --size-only

if %errorlevel% neq 0 (
    echo.
    echo [FAIL] Upload failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo    Done! https://blog.olinl.com
echo ========================================
echo.

pause
