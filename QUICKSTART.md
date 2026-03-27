# Guía de Inicio Rápido - Rastreador de Paquetes

Bienvenido al sistema de rastreo de paquetes en tiempo real. Esta guía te ayudará a configurar y ejecutar el proyecto localmente.

## 📋 Requisitos Previos

- **Node.js** 16+ ([descargar](https://nodejs.org/))
- **PostgreSQL** 12+ ([descargar](https://www.postgresql.org/download/))
- **Git** ([descargar](https://git-scm.com/))
- **Claves API** (Google Maps, Twilio - opcionales para desarrollo)

## 🚀 Instalación Rápida (5 minutos)

### Opción 1: Con Docker (Recomendado)

```bash
# 1. Clonar repositorio
git clone <tu-repo>
cd rastreador-paquetes

# 2. Crear archivo .env en raíz
cp .env.example .env

# 3. Iniciar con Docker Compose
docker-compose up
```

**Acceso:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Database: localhost:5432

### Opción 2: Manual (Sin Docker)

#### 1. Backend
```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# Editar .env con tus valores
nano .env

# Crear base de datos
createdb tracking_db

# Iniciar servidor
npm run dev
```

#### 2. Frontend (en otra terminal)
```bash
cd frontend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# Editar .env
nano .env

# Iniciar desarrollo
npm start
```

## ⚙️ Configuración Básica

### Variables de Entorno

**Backend (.env)**
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/tracking_db
JWT_SECRET=clave-super-secreta
CLIENT_URL=http://localhost:3000
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_KEY=tu_clave_opcional
```

## 🎯 Primeros Pasos

### 1. Acceder a la Aplicación

```
🏠 Home: http://localhost:3000
📦 Rastrear: http://localhost:3000/track
🎛️ Admin: http://localhost:3000/admin
```

### 2. Crear Primer Paquete

1. Ir al Panel Admin: http://localhost:3000/admin
2. Click "Nuevo Paquete"
3. Llenar formulario:
   - Código: `PKG-001`
   - Remitente: `Tu Nombre`
   - Destinatario: `Cliente Test`
   - Dirección: `Calle Principal 123`
4. Click "Crear Paquete"

### 3. Rastrear Paquete

1. Ir a Rastrear Paquete: http://localhost:3000/track
2. Ingresar código: `PKG-001`
3. Click "Rastrear"
4. Ver ubicación (datos de demo)

## 📊 Estructura del Proyecto

```
rastreador-paquetes/
├── backend/               # API Node.js + Socket.io
│   ├── src/
│   │   ├── routes/        # Rutas API
│   │   ├── services/      # Lógica de negocios
│   │   └── models/        # Modelos BD
│   ├── server.js          # Entrada principal
│   └── package.json
├── frontend/              # React SPA
│   ├── src/
│   │   ├── pages/         # Rastreo y Admin
│   │   ├── components/    # Componentes
│   │   └── services/      # API client
│   └── package.json
├── docker-compose.yml     # Stack Docker
└── README.md
```

## 🔧 Comandos Útiles

### Backend
```bash
cd backend

npm run dev         # Desarrollo con auto-reload
npm start          # Producción
npm test           # Ejecutar tests
```

### Frontend
```bash
cd frontend

npm start          # Desarrollo
npm run build      # Build producción
npm test           # Tests
```

### Docker
```bash
docker-compose up              # Iniciar
docker-compose up --build      # Rebuild
docker-compose down            # Detener
docker-compose logs -f         # Ver logs
```

## 🐛 Troubleshooting

### Puerto 5000/3000 en uso
```bash
# Cambiar en .env o matar proceso
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Error de conexión a DB
```bash
# Verificar PostgreSQL está corriendo
psql -U postgres -c "SELECT 1"

# Crear BD si no existe
createdb tracking_db

# Verificar variables en .env
```

### Frontend no conecta con backend
- Verificar backend está en puerto 5000
- Verificar CORS en backend
- Comprobar `REACT_APP_API_URL` en .env frontend

## 📚 Documentación Completa

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Guía de Debugging](./DEBUG.md)

## 🤝 Características Principales

✅ Rastreo en tiempo real (WebSockets)
✅ Panel de administración
✅ Mapa interactivo con Google Maps
✅ Notificaciones SMS/Email (Twilio)
✅ Historial de entregas
✅ Sistema de calificación
✅ Responsive design

## 💡 Tips

- Usar localhost:3000 en desarrollo
- WebSocket requiere servidor backend ejecutándose
- API docs disponibles en `/api/health`
- Socket.io DevTools para debugging de WebSockets

## 🚀 Próximos Pasos

1. ✅ Instalación completada
2. 📝 Personalizar apariencia
3. 🔑 Integrar Google Maps API
4. 📞 Integrar Twilio SMS
5. 🚀 Desplegar a Vercel (frontend) + Railway (backend)

## 📞 Soporte

¿Problemas? Revisa:
1. [DEBUG.md](./DEBUG.md) - Troubleshooting
2. Logs del servidor: `npm run dev`
3. Browser console (F12)
4. Network tab en DevTools

¡Listo para empezar! 🎉

---

**Versión**: 1.0.0
**Última actualización**: 13 de Marzo de 2026
**Ambiente**: República Dominicana 🇩🇴
