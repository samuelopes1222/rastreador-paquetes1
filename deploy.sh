#!/bin/bash
# Script para hacer build y desplegar en Netlify automáticamente

echo ""
echo "========================================"
echo "Rastreador de Paquetes - Deploy Script"
echo "========================================"
echo ""

# Cambiar a carpeta frontend
cd "$(dirname "$0")/frontend"

echo "[1/3] Limpiando build anterior..."
rm -rf build
echo "OK"

echo "[2/3] Compilando proyecto React..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Build fallido"
    exit 1
fi
echo "OK"

echo "[3/3] Desplegando en Netlify..."
cd ..
npx netlify deploy --prod --dir=frontend/build
if [ $? -ne 0 ]; then
    echo "ERROR: Deploy fallido"
    exit 1
fi

echo ""
echo "✓ Despliegue completado exitosamente!"
echo ""
