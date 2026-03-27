# Instrucciones de Instalación y Desarrollo

## 🎯 Antes de Comenzar

Este proyecto requiere Node.js 16+ y PostgreSQL 12+.

Verifica que tengas instalados:
```bash
node --version  # Debe ser 16+
npm --version
psql --version # PostgreSQL
```

## 📖 Guía Completa

Ver [QUICKSTART.md](./QUICKSTART.md) para instrucciones paso a paso.

## 🏃 Inicio Rápido

### Con Docker (Recomendado)
```bash
docker-compose up
```

### Manual
```bash
# Terminal 1 - Backend
cd backend
npm install && npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install && npm start
```

## 📦 Dependencias Principales

### Backend
- Express 4.18
- Socket.io 4.6
- PostgreSQL + Sequelize ORM
- JWT + bcrypt
- Twilio

### Frontend
- React 18
- React Router 6
- Axios
- Socket.io Client
- Leaflet (OpenStreetMap)

## 🔗 URLs de Desarrollo

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/health

## 📝 Variables de Entorno Necesarias

Crea `.env` en `backend/` y `frontend/.env` con tus valores.
Ver `.env.example` en cada carpeta.

**Mínimo para funcionar en desarrollo:**
```env
# Backend
DATABASE_URL=postgresql://postgres:password@localhost:5432/tracking_db

# Frontend  
REACT_APP_API_URL=http://localhost:5000/api
```

## 💾 Base de Datos

PostgreSQL debe estar corriendo. Para inicializar:

```bash
# Crear BD
createdb tracking_db

# Ejecutar migraciones (cuando estén listas)
cd backend
npm run migrate
```

## 🐛 Debugging

- **Backend logs**: Ver en terminal `npm run dev`
- **Frontend**: F12 → Console
- **Network**: F12 → Network
- **Database**: `psql tracking_db`

## 📚 Documentación

- [README.md](./README.md) - Visión general
- [QUICKSTART.md](./QUICKSTART.md) - Guía rápida
- [DEBUG.md](./DEBUG.md) - Troubleshooting
- [backend/README.md](./backend/README.md) - Docs backend
- [frontend/README.md](./frontend/README.md) - Docs frontend

## ✅ Checklist de Instalación

- [ ] Node.js instalado
- [ ] PostgreSQL corriendo
- [ ] `.env` creado en backend y frontend
- [ ] `npm install` ejecutado en ambas carpetas
- [ ] `npm run dev` funciona (backend)
- [ ] `npm start` funciona (frontend)
- [ ] http://localhost:3000 abre en navegador

## 🆘 Si hay errores

1. Revisa [DEBUG.md](./DEBUG.md)
2. Verifica puertos (5000, 3000, 5432)
3. Elimina `node_modules` y ejecuta `npm install` nuevamente
4. Revisa logs en terminal

---

¡Listo para desarrollar! 🚀
