@echo off
REM Script para hacer build y desplegar en Netlify automáticamente

echo.
echo ========================================
echo Rastreador de Paquetes - Deploy Script
echo ========================================
echo.

REM Cambiar a carpeta frontend
cd /d "%~dp0frontend"

echo [1/3] Limpiando build anterior...
if exist build rmdir /s /q build
echo OK

echo [2/3] Compilando proyecto React...
call npm run build
if errorlevel 1 (
    echo ERROR: Build fallido
    pause
    exit /b 1
)
echo OK

echo [3/3] Desplegando en Netlify...
cd /d "%~dp0"
call npx netlify deploy --prod --dir=frontend/build
if errorlevel 1 (
    echo ERROR: Deploy fallido
    pause
    exit /b 1
)

echo.
echo ✓ Despliegue completado exitosamente!
echo.
pause
