# Frontend - Rastreador de Paquetes

Interfaz web para rastreo de paquetes y panel de administración

## 🚀 Inicio Rápido

### 1. Instalación
```bash
npm install
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env
# Editar .env con tus valores
```

### 3. Ejecutar en Desarrollo
```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura

```
src/
├── pages/
│   ├── TrackingPage.js      # Rastreo de paquetes
│   └── AdminDashboard.js    # Panel de administración
├── components/              # Componentes reutilizables
├── services/
│   └── api.js              # Cliente HTTP/WebSocket
├── styles/                  # Estilos CSS
├── App.js                   # Componente principal
└── index.js                 # Punto de entrada
```

## 🎯 Páginas

### Home (`/`)
Pantalla de inicio con opciones de rastreo y administración

### Rastrear Paquete (`/track`)
- Ingresa código de paquete
- Visualiza ubicación en tiempo real
- Ve historial de entregas
- Mapa interactivo con OpenStreetMap (sin necesidad de clave)

### Panel Admin (`/admin`)
- Gestión de paquetes
- Gestión de repartidores
- Estadísticas y reportes
- Asignación de entregas

## 🛠️ Configuración

### Variables de Entorno

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=Rastreador de Paquetes
```

### Mapas (OpenStreetMap)

Este proyecto usa **OpenStreetMap** a través de **Leaflet**, por lo que no necesitas una clave de API ni cuenta de pago. Los mapas se cargan directamente desde los servidores de OpenStreetMap.

## 📦 Dependencias Principales

- **react**: UI library
- **axios**: HTTP cliente
- **socket.io-client**: WebSockets
- **react-router-dom**: Navegación
- **react-leaflet / leaflet**: Mapas (OpenStreetMap)
- **tailwindcss**: Estilos CSS

## 🚀 Build para Producción

```bash
npm run build
```

Genera carpeta `build/` lista para Vercel o similar

## 📱 Responsive Design

- Mobile first
- Breakpoints: 768px, 1024px, 1280px
- Touch-friendly UI

## 🔑 Autenticación

- JWT tokens almacenados en localStorage
- Auto-refresh de tokens
- Logout automático en expiración

## 🧪 Testing

```bash
npm test
```

## 📝 Notas

- App usa Context API para estado global
- WebSocket mantiene conexión abierta para actualizaciones en tiempo real
- Google Maps integrado para visualización de rutas
- Notificaciones en tiempo real con Socket.io

## 🚀 Despliegue (Vercel)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 💡 Tips

- Usa React DevTools para debugging
- Socket.io tab en DevTools para networking
- Chrome DevTools con throttling para simular conexiones lentas

## 📞 Soporte

Para soporte técnico, contacta al equipo de desarrollo.
