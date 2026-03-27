@echo off
REM Instalador Rápido para Windows - Rastreador de Paquetes

echo.
echo =================================================
echo  Rastreador de Paquetes - Instalación Rápida
echo =================================================
echo.

REM Verificar Node.js
echo [1/4] Verificando Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js no está instalado
    echo Descarga desde: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js encontrado

REM Parsear archivos .env
echo.
echo [2/4] Configurando variables de entorno...

if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env"
    echo ✓ Creado backend\.env (editar según necesidades)
)

if not exist "frontend\.env" (
    copy "frontend\.env.example" "frontend\.env"
    echo ✓ Creado frontend\.env
)

REM Instalar Backend
echo.
echo [3/4] Instalando Backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR en instalación de backend
    exit /b 1
)
echo ✓ Backend instalado
cd ..

REM Instalar Frontend
echo.
echo [4/4] Instalando Frontend...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR en instalación de frontend
    exit /b 1
)
echo ✓ Frontend instalado
cd ..

echo.
echo =================================================
echo  Instalación Completada!
echo =================================================
echo.
echo PRÓXIMOS PASOS:
echo.
echo 1. Editar archivos .env:
echo    - backend\.env
echo    - frontend\.env
echo.
echo 2. Iniciar Base de Datos (PostgreSQL):
echo    createdb tracking_db
echo.
echo 3. Ejecutar en DOS TERMINALES:
echo    Terminal 1: cd backend && npm run dev
echo    Terminal 2: cd frontend && npm start
echo.
echo 4. Abrir navegador:
echo    http://localhost:3000
echo.
echo O con Docker:
echo    docker-compose up
echo.
echo Para más detalles: ver QUICKSTART.md
echo =================================================
echo.
pause
