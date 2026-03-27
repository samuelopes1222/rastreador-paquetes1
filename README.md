# 📦 Rastreador de Paquetes en Tiempo Real

Sistema de rastreo de paquetes en tiempo real para micro-empresas de repartidores. Permite a los clientes rastrear sus paquetes en vivo y a los administradores gestionar entregas de manera eficiente.

## 🌟 Características

- ✅ **Rastreo en Tiempo Real**: Ubicación live de repartidores y paquetes
- ✅ **Panel de Administración**: Gestión completa de paquetes, repartidores y entregas
- ✅ **Notificaciones SMS/Email**: Alertas automáticas a clientes
✅ **Integración OpenStreetMap (Leaflet)**: Visualización de ubicaciones y rutas sin costo
- ✅ **Historial de Entregas**: Registro completo de entregas
- ✅ **Sistema de Calificación**: Clientes califican entregas
- ✅ **Asignación Automática**: Sistema inteligente de asignación de paquetes

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** + **Express** - API REST
- **Socket.io** - Comunicación en tiempo real
- **PostgreSQL** - Base de datos
- **Sequelize/Knex** - ORM
- **JWT** - Autenticación
- **Twilio** - Notificaciones SMS
- **OpenStreetMap (Leaflet)** - Mapas y geolocalización sin costo

### Frontend
- **React** - Interfaz de usuario
- **Axios** - Cliente HTTP
- **Socket.io Client** - Conexión en tiempo real
- **Leaflet (OpenStreetMap)** - Mapas interactivos
- **Tailwind CSS** - Estilos
- **React Router** - Navegación

## 📋 Requisitos Previos

- Node.js 16+ 
- npm o yarn
- PostgreSQL 12+
- Claves de API:
- OpenStreetMap (sin necesidad de clave)
  - Twilio (SMS)

## 🚀 Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone <tu-repo>
cd rastreador-paquetes
```

### 2. Configurar Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm start
```

### 3. Configurar Frontend
```bash
cd ../frontend
npm install
cp .env.example .env
# Editar .env con la URL de tu backend
npm start
```

## 📚 Documentación

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Guía de Depuración](./DEBUG.md)

## 🔑 Variables de Entorno

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/tracking_db
JWT_SECRET=tu-clave-secreta
GOOGLE_MAPS_API_KEY=tu-clave-google
TWILIO_ACCOUNT_SID=tu-sid
TWILIO_AUTH_TOKEN=tu-token
TWILIO_PHONE=+1xxxxxxxxxx
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
```

## 📱 Uso

### Panel de Admin
Acceso en: `http://localhost:3000/admin`
- Crear/editar repartidores y paquetes
- Ver rastreo en tiempo real
- Generar reportes

### Vista de Cliente
Acceso en: `http://localhost:3000/track`
- Ingresar código de paquete
- Ver ubicación en mapa
- Recibir notificaciones

## 🔐 Seguridad

- Autenticación con JWT
- Validación de datos con Joi/Yup
- Variables de entorno para credenciales
- Rate limiting en API
- CORS configurado

## 📊 Escalabilidad

Para escalar a más repartidores:
- Usar Redis para caché
- Implementar message queue (RabbitMQ/Kafka)
- Load balancer (Nginx/HAProxy)
- CDN para frontend

## 🤝 Contribuir

Por favor, haz un fork del proyecto y envía un pull request con tus cambios.

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.

## 💬 Soporte

Para soporte, contacta a tu equipo de desarrollo.

---

**Versión**: 1.0.0  
**Idioma**: Español  
**País**: República Dominicana 🇩🇴
