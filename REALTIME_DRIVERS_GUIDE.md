# 🚚 Guía de Repartidores en Tiempo Real

## Descripción General

El sistema ahora muestra **repartidores en movimiento en tiempo real** tanto en la **página de inicio** como en el **panel de administrador**. Los movimientos se visualizan inmediatamente en el mapa a través de **Socket.io**.

---

## 🎯 Características Implementadas

### 1. **Socket.io en Tiempo Real**
- ✅ Conexión persistente entre cliente y servidor
- ✅ Actualización de ubicación cada 5 segundos (configurable)
- ✅ Broadcast a todos los clientes conectados
- ✅ Reconexión automática en caso de desconexión

### 2. **Simulador de Repartidores**
- ✅ Simula movimiento realista en zonas de Santo Domingo
- ✅ Se inicia automáticamente cuando el servidor comienza
- ✅ Crea rutas aleatorias para cada repartidor
- ✅ Actualiza ubicaciones en tiempo real

### 3. **Visualización en Mapas**
- ✅ HomePage: Muestra repartidores activos con ubicación
- ✅ AdminDashboard: Mapa de repartidores en tiempo real
- ✅ Marcadores con color diferenciado
- ✅ Información de zona automática

### 4. **Hook Custom `useDriverLocations`**
- ✅ Escucha eventos de Socket.io
- ✅ Maneja reconexion automática
- ✅ Actualiza estado de repartidores en tiempo real
- ✅ Maneja suscripción/desuscripción automática

---

## 📋 Cómo Usar

### Paso 1: Registrar un Nuevo Repartidor

#### Opción A: Desde el Panel de Administrador
```
1. Ve a http://localhost:3000/admin
2. Haz clic en "➕ Nuevo Repartidor"
3. Completa el formulario:
   - Nombre: Tu Nombre
   - Cédula: 00000000000
   - Teléfono: +1-809-1234567
   - Vehículo: Motocicleta
   - Contraseña: (opcional, por defecto 123456)
4. Haz clic en "Crear"
```

#### Opción B: API REST
```bash
curl -X POST http://localhost:3001/api/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "cedula": "00123456789",
    "phone": "+1-809-1234567",
    "vehicle": "Motocicleta",
    "password": "123456"
  }'
```

### Paso 2: Activar el Repartidor

El repartidor se crea con estado `active` automáticamente.

### Paso 3: Ver en Tiempo Real

#### En la HomePage
```
1. Ve a http://localhost:3000
2. Verás el mapa en la sección "Hero"
3. Verás la tarjeta del repartidor abajo bajo "🚚 Repartidores Activos"
4. La ubicación se actualiza cada 5 segundos gracias al simulador
```

#### En el Admin Dashboard
```
1. Ve a http://localhost:3000/admin
2. Haz clic en la pestaña "Repartidores"
3. Verás el mapa con los repartidores
4. La ubicación se actualiza automáticamente en tiempo real
```

---

## 🔧 Arquitectura Técnica

### Backend (Node.js + Socket.io)

#### Servidor Principal (`backend/server.js`)
```javascript
// Inicialización del simulador
const driverSimulator = new DriverSimulator(io);
driverSimulator.start(); // Se inicia cuando el servidor arranca

// Socket.io eventos
socket.on('subscribe-drivers', () => {...})      // Cliente se suscribe
socket.on('driver-location-update', (data) => {...}) // Actualización de ubicación
```

#### DriverSimulator (`backend/src/services/driverSimulator.js`)
```javascript
class DriverSimulator {
  start()                          // Inicia el simulador (cada 5s)
  simulateDriverMovement()         // Actualiza ubicaciones
  createRandomRoute(driverId)      // Genera ruta aleatoria
  getDriverRoute(driverId)         // Obtiene ruta actual
}
```

#### Rutas API (`backend/src/routes/drivers.js`)
```
POST   /api/drivers                 // Crear repartidor
GET    /api/drivers/active          // Obtener repartidores activos
PATCH  /api/drivers/:id/location    // Actualizar ubicación (desde app móvil)
PATCH  /api/drivers/:id/status      // Cambiar estado (activo/inactivo/pausa)
```

### Frontend (React + Socket.io-client)

#### Hook Custom (`frontend/src/hooks/useDriverLocations.js`)
```javascript
const { drivers, isConnected, updateDriverLocation } = useDriverLocations();

// Características:
// - drivers[] = lista de repartidores activos
// - isConnected = estado de conexión Socket.io
// - updateDriverLocation(driverId, lat, lng) = función para actualizar
```

#### Componentes que lo Usan
```
HomePage.js
  ├─ import useDriverLocations()
  ├─ trasmite drivers a TrackingMap
  └─ muestra tarjetas de repartidores

AdminDashboard.js
  ├─ import useDriverLocations()
  ├─ trasmite drivers a TrackingMap
  └─ muestra tabla y mapa de repartidores

TrackingMap.js
  ├─ Recibe activeDrivers prop
  ├─ Renderiza marcadores por cada driver
  └─ Actualiza marcadores cuando drivers cambia
```

---

## 📊 Flujo de Datos en Tiempo Real

```
Backend:
  DriverSimulator.simulateDriverMovement()
    ↓
  Obtiene repartidores activos de BD
    ↓
  Actualiza coordenadas en BD
    ↓
  Emite evento 'driver-location-update' via Socket.io
    ↓
  Todos los clientes conectados reciben el evento

Frontend:
  useDriverLocations hook
    ├─ Escucha 'driver-location-update'
    ├─ Actualiza state 'drivers'
    └─ Componentes se renderiza con nuevas ubicaciones
    ↓
  HomePage y AdminDashboard usan los drivers actualizados
    ↓
  TrackingMap renderiza marcadores actualizados
    ↓
  Usuario ve repartidores moviéndose en el mapa
```

---

## 🎨 Visualización del Mapa

### Marcadores de Repartidores
- **Ícono**: Marcador azul estándar de Leaflet
- **Información**: Nombre del repartidor, estado, zona
- **Animación**: Se actualiza suavemente cada 5 segundos

### Información Mostrada
```
Marcador → Clic → Popover con:
  ├─ Nombre del repartidor
  ├─ Estado (Activo/Inactivo)
  └─ Ubicación exacta (lat, lng)
```

### Zonas de Santo Domingo
```
Las rutas se generan en estas zonas:
├─ Centro: (18.4861, -69.9312)
├─ Zona Este: (18.5095, -69.8774)
├─ Zona Sur: (18.4521, -69.9586)
├─ Zona Oeste: (18.5152, -69.9871)
└─ Zona Norte: (18.5267, -69.9312)
```

---

## ⚙️ Configuración

### Intervalo de Actualización
Edita en `backend/src/services/driverSimulator.js`:
```javascript
// Cambiar de 5000 ms (5 segundos) a otro valor
this.simulationInterval = setInterval(async () => {
  await this.simulateDriverMovement();
}, 5000);  // ← Cambiar esto
```

### Zonas de Movimiento
En `createRandomRoute()`:
```javascript
const baseZones = [
  { center: { lat: 18.4861, lng: -69.9312 }, name: 'Centro' },
  // Agregar más zonas aquí con sus coordenadas
];
```

### Cantidad de Puntos por Ruta
```javascript
const pointCount = Math.floor(Math.random() * 4) + 5; // 5-8 puntos
// Cambiar para más/menos puntos
```

---

## 🔌 Socket.io Events

### Desde el Cliente
```javascript
// Suscribirse a actualizaciones
socket.emit('subscribe-drivers');

// Actualizar ubicación (desde app móvil)
socket.emit('driver-location-update', {
  driverId: 'uuid-xxx',
  lat: 18.4861,
  lng: -69.9312,
  timestamp: new Date().toISOString()
});

// Desuscribirse
socket.emit('unsubscribe-drivers');
```

### Desde el Servidor
```javascript
// Evento emitido a todos los clientes
io.emit('driver-location-update', {
  driverId: 'uuid-xxx',
  lat: 18.4861,
  lng: -69.9312,
  status: 'active',
  timestamp: new Date().toISOString()
});

io.emit('driver-status-update', {
  driverId: 'uuid-xxx',
  status: 'inactive'
});
```

---

## 🧪 Testing

### Prueba 1: Verificar Conexión Socket.io
```javascript
// En la consola del navegador (F12)
console.log(document.querySelector('.drivers-grid'));
// Deberías ver las tarjetas de repartidores

// O revisa en la consola qué dice useDriverLocations
console.log('Verificar red → WebSocket para ver frames')
```

### Prueba 2: Registrar Repartidor Nuevo
```bash
curl -X POST http://localhost:3001/api/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Driver",
    "cedula": "99999999999",
    "phone": "+1-809-9999999",
    "vehicle": "Carro",
    "status": "active"
  }'
```

### Prueba 3: Ver en Mapa
1. Abre http://localhost:3000 en un navegador
2. Abre http://localhost:3000/admin en otro navegador
3. Ambos deberían mostrar los mismos repartidores moviéndose en tiempo real

### Prueba 4: Ver Logs del Servidor
```bash
# En la terminal del backend, deberías ver:
📍 Ubicación repartidor: d1f6b8e0-... - Lat: 18.4861, Lng: -69.9312
📍 Ubicación repartidor: a4c2f1e7-... - Lat: 18.5095, Lng: -69.8774
```

---

## 🚨 Troubleshooting

### Problema: "No veo repartidores en el mapa"

**Solución 1: Verifica que los repartidores están activos**
```bash
curl http://localhost:3001/api/drivers/active
# Deberías ver una lista de drivers con status: "active"
```

**Solución 2: Verifica conexión Socket.io**
```javascript
// En la consola del navegador
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('✅ Conectado'));
socket.on('disconnect', () => console.log('❌ Desconectado'));
```

**Solución 3: Verifica el simulador está corriendo**
- Revisa los logs del servidor
- Deberías ver mensajes como "🚗 Iniciando simulador"

### Problema: "Las ubicaciones no se actualizan"

**Solución:**
```javascript
// Verifica que useDriverLocations está recibiendo datos
const { drivers, isConnected } = useDriverLocations();
console.log('Drivers:', drivers);
console.log('Connected:', isConnected);
```

### Problema: "Error de conexión Socket.io"

**Solución 1: Verifica CORS**
```javascript
// En backend/server.js
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3000', // ← Aségúrate de que coincida
    methods: ['GET', 'POST']
  }
});
```

**Solución 2: Verifica que ambos servidores están corriendo**
```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm start
```

### Problema: "Repartidores desaparecen del mapa"

**Causa:** Probablemente fueron marcados como inactivos.

**Solución:**
```bash
# Desde admin, activa el repartidor
# O actualiza manualmente en BD
```

---

## 📱 Integración con App Móvil Final

Cuando tengas la app móvil del repartidor lista, reemplaza el simulador:

```javascript
// En la app móvil del repartidor, cada 5 segundos:
socket.emit('driver-location-update', {
  driverId: userDriverId,
  lat: currentPosition.latitude,
  lng: currentPosition.longitude,
  timestamp: new Date().toISOString()
});
```

El resto del sistema já está preparado para manejar ubicaciones reales.

---

## 📈 Estadísticas Capturadas

Para cada repartidor se almacena:
- `currentLat` / `currentLng` - Ubicación actual
- `lastLocationUpdate` - Última actualización
- `status` - Estado (active/inactive)
- `activePackages` - Paquetes en tránsito
- `rating` - Calificación del repartidor
- `totalDeliveries` - Total de entregas

---

## 🔐 Seguridad

- ✅ Solo repartidores "activos" se actualizan
- ✅ Validación de datos en API
- ✅ Socket.io configurado con CORS
- ✅ Los datos se almacenan en base de datos

---

## 📚 Archivos Modificados

1. **backend/server.js** - Integración de DriverSimulator
2. **backend/src/services/driverSimulator.js** - Simulador de movimiento
3. **backend/src/routes/drivers.js** - Ruta de actualización de ubicación
4. **frontend/src/hooks/useDriverLocations.js** - Hook de Socket.io
5. **frontend/src/pages/HomePage.js** - Integración de hook
6. **frontend/src/pages/AdminDashboard.js** - Integración de hook

---

## ✅ Checklist de Verificación

- [ ] Backend arranca sin errores
- [ ] Socket.io conecta correctamente
- [ ] Repartidores visibles en HomePage
- [ ] Repartidores visibles en AdminDashboard
- [ ] Las ubicaciones se actualizan cada 5 segundos
- [ ] Puedes registrar nuevo repartidor
- [ ] Nuevo repartidor aparece en el mapa
- [ ] Puedes ver repartidores desde múltiples pestañas/navegadores simultáneamente

---

**Última actualización:** 17 de marzo de 2026  
**Versión:** 3.0 (Con Repartidores en Tiempo Real)
