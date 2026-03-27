# Backend - Rastreador de Paquetes

API REST + WebSockets para rastreo en tiempo real de paquetes

## 🚀 Inicio Rápido

### 1. Instalación de Dependencias
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
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

## 📚 APIs Endpoint

### Paquetes

#### GET `/api/packages`
Obtener todos los paquetes

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "code": "PKG-001",
    "sender": "Juan Pérez",
    "recipient": "María García",
    "address": "Calle Principal 123",
    "status": "in-transit",
    "driver": { "id": "uuid", "name": "Carlos López" },
    "location": { "lat": 18.4861, "lng": -69.9312 }
  }
]
```

#### GET `/api/packages/:code`
Obtener detalles de un paquete específico

**Parámetros:**
- `code`: Código del paquete (PKG-001)

**Respuesta:**
```json
{
  "id": "uuid",
  "code": "PKG-001",
  "recipient": "María García",
  "status": "out-for-delivery",
  "address": "Calle Principal 123",
  "location": {
    "lat": 18.4861,
    "lng": -69.9312,
    "timestamp": "2026-03-13T12:30:00Z"
  },
  "history": [
    {
      "timestamp": "2026-03-13T10:00:00Z",
      "status": "pending",
      "description": "Paquete registrado"
    },
    {
      "timestamp": "2026-03-13T11:00:00Z",
      "status": "in-transit",
      "description": "En centro de distribución"
    }
  ]
}
```

#### POST `/api/packages`
Crear nuevo paquete

**Body:**
```json
{
  "code": "PKG-001",
  "sender": "Juan Pérez",
  "recipient": "María García",
  "address": "Calle Principal 123, Santo Domingo",
  "phone": "+1-809-555-0001"
}
```

### Repartidores

#### GET `/api/drivers`
Obtener todos los repartidores

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "name": "Carlos López",
    "phone": "+1-809-555-0101",
    "vehicle": "Motorcycle",
    "status": "active",
    "activePackages": 3,
    "location": { "lat": 18.4861, "lng": -69.9312 },
    "rating": 4.8
  }
]
```

#### GET `/api/drivers/:id`
Obtener detalles de un repartidor

## 🔌 WebSocket Events

### Cliente → Servidor

#### `subscribe-package`
Suscribirse a actualizaciones de ubicación de un paquete
```javascript
socket.emit('subscribe-package', 'PKG-001');
```

#### `update-location`
Enviar ubicación actual del repartidor
```javascript
socket.emit('update-location', {
  packageId: 'PKG-001',
  driverId: 'DRIVER-001',
  lat: 18.4861,
  lng: -69.9312,
  accuracy: 15
});
```

#### `delivery-complete`
Notificar entrega completada
```javascript
socket.emit('delivery-complete', {
  packageId: 'PKG-001',
  rating: 5,
  feedback: 'Excelente servicio'
});
```

### Servidor → Cliente

#### `location-update`
Recibir actualización de ubicación
```javascript
socket.on('location-update', (data) => {
  console.log(`Paquete ${data.packageId} en ${data.lat}, ${data.lng}`);
});
```

#### `delivery-completed`
Notificación de entrega completada
```javascript
socket.on('delivery-completed', (data) => {
  console.log(`Paquete entregado: ${data.packageId}`);
});
```

## 🔧 Variables de Entorno

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tracking_db
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=tu_clave_secreta

# Mapas (OpenStreetMap) - no requiere clave
# (Opcional) Si deseas usar un servicio de geocodificación externo, puedes agregarlo aquí.

# Twilio
TWILIO_ACCOUNT_SID=tu_sid
TWILIO_AUTH_TOKEN=tu_token
TWILIO_PHONE_NUMBER=+1234567890
```

## 💾 Base de Datos

### Tablas Principales

- **drivers** - Información de repartidores
- **packages** - Paquetes a entregar
- **tracking_history** - Historial de ubicaciones

### Crear Base de Datos (PostgreSQL)
```bash
psql -U postgres -c "CREATE DATABASE tracking_db;"
npm run migrate
npm run seed
```

## 🧪 Testing

```bash
npm test
```

## 🐳 Docker

```bash
docker build -t tracking-backend .
docker run -p 5000:5000 tracking-backend
```

## 📝 Notas

- Usar Socket.io para rastreo en tiempo real
- API RESTful para operaciones CRUD
- Autenticación JWT para endpoints protegidos
- CORS habilitado para localhost:3000

## 📞 Soporte

Para soporte técnico, contacta al equipo de desarrollo.
