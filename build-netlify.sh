#!/bin/bash
# Script para crear un build limpio para Netlify
# Uso: bash build-netlify.sh

echo ""
echo "===================================="
echo "  CREANDO BUILD PARA NETLIFY"
echo "===================================="
echo ""

# Ir a la carpeta frontend
cd frontend

# Limpiar build anterior
if [ -d "build" ]; then
    echo "[*] Eliminando build anterior..."
    rm -rf build
    echo "[✓] Build anterior eliminado"
fi

# Instalar dependencias
echo ""
echo "[*] Instalando dependencias..."
npm install
if [ $? -ne 0 ]; then
    echo "[✗] Error al instalar dependencias"
    exit 1
fi
echo "[✓] Dependencias instaladas"

# Crear build
echo ""
echo "[*] Creando build de producción..."
npm run build
if [ $? -ne 0 ]; then
    echo "[✗] Error al crear build"
    exit 1
fi
echo "[✓] Build creado exitosamente"

# Volver a la carpeta raíz
cd ..

# Verificar que el build existe
if [ -f "frontend/build/index.html" ]; then
    echo ""
    echo "===================================="
    echo "   ✅ BUILD COMPLETADO EXITOSAMENTE"
    echo "===================================="
    echo ""
    echo "Ubicación: frontend/build"
    echo ""
    echo "Próximos pasos:"
    echo "1. Sube el código a GitHub"
    echo "2. Conecta en Netlify: https://app.netlify.com"
    echo "3. Build command: cd frontend && npm install && npm run build"
    echo "4. Publish directory: frontend/build"
    echo ""
else
    echo ""
    echo "===================================="
    echo "   ✗ ERROR EN LA CREACIÓN DEL BUILD"
    echo "===================================="
    exit 1
fi
