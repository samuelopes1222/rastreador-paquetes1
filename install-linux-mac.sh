#!/bin/bash

# Instalador para macOS/Linux

echo ""
echo "================================================="
echo " Rastreador de Paquetes - Instalación Rápida"
echo "================================================="
echo ""

# Verificar Node.js
echo "[1/4] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js no está instalado"
    echo "Descarga desde: https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js encontrado"

# Crear .env si no existen
echo ""
echo "[2/4] Configurando variables de entorno..."

if [ ! -f "backend/.env" ]; then
    cp "backend/.env.example" "backend/.env"
    echo "✓ Creado backend/.env (editar según necesidades)"
fi

if [ ! -f "frontend/.env" ]; then
    cp "frontend/.env.example" "frontend/.env"
    echo "✓ Creado frontend/.env"
fi

# Instalar Backend
echo ""
echo "[3/4] Instalando Backend..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR en instalación de backend"
    exit 1
fi
echo "✓ Backend instalado"
cd ..

# Instalar Frontend
echo ""
echo "[4/4] Instalando Frontend..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR en instalación de frontend"
    exit 1
fi
echo "✓ Frontend instalado"
cd ..

echo ""
echo "================================================="
echo " Instalación Completada!"
echo "================================================="
echo ""
echo "PRÓXIMOS PASOS:"
echo ""
echo "1. Editar archivos .env:"
echo "   - backend/.env"
echo "   - frontend/.env"
echo ""
echo "2. Iniciar Base de Datos (PostgreSQL):"
echo "   createdb tracking_db"
echo ""
echo "3. Ejecutar en DOS TERMINALES:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend && npm start"
echo ""
echo "4. Abrir navegador:"
echo "   http://localhost:3000"
echo ""
echo "O con Docker:"
echo "   docker-compose up"
echo ""
echo "Para más detalles: ver QUICKSTART.md"
echo "================================================="
echo ""
