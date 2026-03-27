@echo off
REM Script para crear un build limpio para Netlify
REM Uso: build-netlify.bat

echo.
echo ====================================
echo   CREANDO BUILD PARA NETLIFY
echo ====================================
echo.

REM Ir a la carpeta frontend
cd frontend

REM Limpiar build anterior
if exist build (
    echo [*] Eliminando build anterior...
    rmdir /s /q build
    echo [✓] Build anterior eliminado
)

REM Instalar dependencias
echo.
echo [*] Instalando dependencias...
call npm install
if errorlevel 1 (
    echo [✗] Error al instalar dependencias
    exit /b 1
)
echo [✓] Dependencias instaladas

REM Crear build
echo.
echo [*] Creando build de producción...
call npm run build
if errorlevel 1 (
    echo [✗] Error al crear build
    exit /b 1
)
echo [✓] Build creado exitosamente

REM Volver a la carpeta raíz
cd ..

REM Verificar que el build existe
if exist "frontend\build\index.html" (
    echo.
    echo ====================================
    echo   ✅ BUILD COMPLETADO EXITOSAMENTE
    echo ====================================
    echo.
    echo Ubicación: frontend/build
    echo.
    echo Próximos pasos:
    echo 1. Sube el código a GitHub
    echo 2. Conecta en Netlify: https://app.netlify.com
    echo 3. Build command: cd frontend ^&^& npm install ^&^& npm run build
    echo 4. Publish directory: frontend/build
    echo.
) else (
    echo.
    echo ====================================
    echo   ✗ ERROR EN LA CREACIÓN DEL BUILD
    echo ====================================
    exit /b 1
)
