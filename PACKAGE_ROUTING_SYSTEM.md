# Sistema de Rutas y Ubicaciones de Paquetes

## 🆕 Funcionalidad Implementada

Se ha agregado un sistema completo de rutas para paquetes, permitiendo definir ubicaciones de origen (punto de partida) y destino (punto final) con visualización en tiempo real en el mapa.

## 📁 Archivos Creados/Modificados

### Backend:
1. **`backend/src/models/Package.js`** (MODIFICADO)
   - Agregados campos: `originAddress`, `originLat`, `originLng`
   - Agregados campos: `destinationAddress`, `destinationLat`, `destinationLng`
   - Mantenida compatibilidad con campos anteriores

### Frontend:
1. **`frontend/src/components/CreatePackageForm.js`** (NUEVO)
   - Componente completo para crear paquetes con ubicaciones
   - Formulario interactivo con mapa integrado
   - Búsqueda de direcciones con Nominatim (OpenStreetMap)
   - Selección de ubicaciones con click en mapa

2. **`frontend/src/components/TrackingMap.js`** (MODIFICADO)
   - Mejorado para mostrar rutas entre origen y destino
   - Marcadores personalizados (verde=origen, rojo=destino)
   - Polylines que conectan origen con destino
   - Soporte para mostrar múltiples paquetes simultáneamente

3. **`frontend/src/pages/CreatePackagePage.js`** (NUEVO)
   - Página contenedora para el formulario de crear paquetes

4. **`frontend/src/styles/CreatePackage.css`** (NUEVO)
   - Estilos responsivos para el formulario
   - Diseño grid con formulario + mapa
   - Animaciones y efectos visuales

5. **`frontend/src/App.js`** (MODIFICADO)
   - Agregada ruta `/create` para crear paquetes
   - Agregado enlace en navbar: "Crear Paquete"

## 🎯 Características Principales del Formulario

### 1. **Información del Paquete**
   - Código automático (PKG-XXXXXX)
   - Peso (en kg)
   - Descripción del contenido

### 2. **Información del Remitente**
   - Nombre completo
   - Teléfono de contacto

### 3. **Información del Destinatario**
   - Nombre completo
   - Teléfono de contacto (requerido)

### 4. **Ubicación de Origen (Punto de Partida)**
   - Dirección en texto libre
   - Búsqueda automática de coordenadas (Geocoding)
   - Selección en mapa (click directo)
   - Vista previa de coordenadas (lat/lng)
   - Marcador verde en el mapa

### 5. **Ubicación de Destino (Punto Final)**
   - Dirección en texto libre
   - Búsqueda automática de coordenadas (Geocoding)
   - Selección en mapa (click directo)
   - Vista previa de coordenadas (lat/lng)
   - Marcador rojo en el mapa

## 🗺️ Visualización en el Mapa

### Elementos Mostrados:

```
┌─────────────────────────────┐
│  Mapa Interactivo    │
│  ──────────────────  │
│                      │
│  🟢 I = Origen       │
│  ────────────────    │ Ruta
│  │                   │ (línea azul)
│  │                   │
│  │                   │
│  └──→ 🔴 F = Destino │
│                      │
│                      │
└─────────────────────────────┘

I = Inicío (verde)
F = Fin (rojo)
───── = Ruta (línea azul punteada)
```

### Funcionalidad:

- **Marcadores Personalizados**:
  - Verde (I): Punto de inicio/origen
  - Rojo (F): Punto final/destino
  - Azul: Repartidores activos

- **Rutas**:
  - Línea azul punteada conecta origen y destino
  - Visible en tiempo real
  - Se dibuja automáticamente

## 🔍 Búsqueda de Direcciones

### Métodos de Selección:

1. **Por Texto (Geocoding)**:
   - Escribe la dirección
   - Presiona "🔍 Buscar"
   - Se busca con Nominatim (OpenStreetMap)
   - Coordenadas se cargan automáticamente

2. **Por Click en Mapa**:
   - Presiona "Click en mapa"
   - Botón se activa (cambia a verde)
   - Click en cualquier punto del mapa
   - Coordenadas se guardan automáticamente

## 📊 Estructura de Datos (Backend)

```javascript
{
  // Información existente
  code: "PKG-123456",
  sender: "Juan Pérez",
  recipient: "María García",
  
  // NUEVOS CAMPOS - Ubicación de Origen
  originAddress: "Calle Principal 123, Santo Domingo",
  originLat: 18.4861,
  originLng: -69.9312,
  
  // NUEVOS CAMPOS - Ubicación de Destino
  destinationAddress: "Villa Mella 456, Santo Domingo",
  destinationLat: 18.5000,
  destinationLng: -69.9500,
  
  // Ubicación actual (actualizada por el repartidor)
  lat: 18.4861,
  lng: -69.9312,
  address: "Calle Principal 123, Santo Domingo"
}
```

## 🚚 Flujo del Repartidor

```
1. Login del Repartidor
   ↓
2. Ve paquetes asignados con ORIGEN y DESTINO claros
   ↓
3. Navega a ORIGEN para recoger paquete
   ↓
4. Sistema marca como "En Tránsito"
   ↓
5. Navega a DESTINO
   ↓
6. Entrega y confirma
   ↓
7. Sistema marca como "Entregado"
```

## 🎨 Diseño Responsivo

| Dispositivo | Layout | Características |
|------------|--------|-----------------|
| **Desktop** | 2 columnas (Forma + Mapa) | Lado a lado |
| **Tablet** | 1 columna apilado | Forma arriba, mapa abajo |
| **Móvil** | 1 columna apilado | Responsive completo |

## ⚙️ API Endpoints Requeridos

### Crear Paquete:
```
POST /api/packages
Content-Type: application/json

Body: {
  code: "PKG-123456",
  sender: "Juan Pérez",
  senderPhone: "+1-809-555-0123",
  recipient: "María García",
  recipientPhone: "+1-809-555-0456",
  weight: "2.5",
  description: "Ropa",
  originAddress: "Calle Principal 123",
  originLat: 18.4861,
  originLng: -69.9312,
  destinationAddress: "Villa Mella 456",
  destinationLat: 18.5000,
  destinationLng: -69.9500
}

Response: {
  success: true,
  data: { /* paquete creado */ }
}
```

### Obtener Paquetes (para mostrar rutas):
```
GET /api/packages
GET /api/packages/active
GET /api/packages/:id
```

## 🔧 Cómo Usar

### 1. **Crear un Paquete:**
```
1. Navega a: http://localhost:3000/create
2. Llena el formulario con información del remitente/destinatario
3. Ingresa dirección de ORIGEN
   - Opción A: Escribe dirección + presiona "Buscar"
   - Opción B: Presiona "Click en mapa" y haz click
4. Ingresa dirección de DESTINO
   - Opción A: Escribe dirección + presiona "Buscar"
   - Opción B: Presiona "Click en mapa" y haz click
5. Verifica la ruta en el mapa (línea azul)
6. Presiona "✓ Crear Paquete"
```

### 2. **Ver Rutas en Mapa Principal:**
```
1. En la página de inicio (/)
2. El mapa mostrará:
   - 🟢 Puntos verdes = Origen de paquetes
   - 🔴 Puntos rojos = Destino de paquetes
   - ───── = Rutas entre ellos
   - 🚚 Repartidores activos
```

## 📡 Integración con Frontend

### Para mostrar rutas en el mapa:
```javascript
<TrackingMap 
  packages={packagesArray}  // Array con originLat, originLng, destinationLat, destinationLng
  activeDrivers={driversArray}
/>
```

### Estructura del paquete esperada:
```javascript
{
  id: "uuid",
  originLat: 18.4861,
  originLng: -69.9312,
  originAddress: "Calle Principal 123",
  destinationLat: 18.5000,
  destinationLng: -69.9500,
  destinationAddress: "Villa Mella 456"
}
```

## 🔗 Navegación Actualizada

```
http://localhost:3000/
├── / (Inicio - muestra mapa con rutas)
├── /create (Crear paquete nuevo) ⭐ NUEVO
├── /track (Rastrear paquete existente)
└── /admin (Panel de administración)
```

## ✅ Validaciones del Formulario

- ✓ Código de paquete automático y único
- ✓ Remitente requerido
- ✓ Destinatario requerido
- ✓ Teléfono del destinatario requerido
- ✓ Ubicación de origen requerida (con coordenadas)
- ✓ Ubicación de destino requerida (con coordenadas)
- ✓ Búsqueda geocoding con Nominatim
- ✓ Validación de coordenadas válidas

## 🎯 Mejoras Futuras Sugeridas

1. **Cálculo Automático de Distancia**
   - Mostrar km entre origen y destino
   - Tiempo estimado basado en velocidad promedio

2. **Ruta Optimizada**
   - Usar OSRM (Open Route Service Matrix) para ruta óptima
   - Mostrar ruta real, no solo línea recta

3. **Múltiples Destinos**
   - Permitir agregar paradas intermedias
   - Secuencia optimizada de entregas

4. **Integración GPS en Vivo**
   - Mostrar progreso del repartidor vs ruta
   - Desviaciones automáticas

5. **Gestión de Zonas**
   - Zonas de cobertura por repartidor
   - Asignación automática inteligente

6. **Historial de Rutas**
   - Rutas completadas por repartidor
   - Análisis de eficiencia

## 🐛 Troubleshooting

### "No se encontró la dirección"
- Verifica que escribiste correctamente
- Intenta con referencia de la ciudad
- Usa "Click en mapa" como alternativa

### El mapa no carga
- Revisa conexión a internet
- Nominatim (OpenStreetMap) requiere conexión
- Intenta recargar la página

### Las coordenadas no se guardan
- Verifica que tienes permiso de acceso al mapa
- Intenta con navegador diferente
- Limpia cache del navegador

### Error al crear paquete
- Verifica que el backend está corriendo
- Comprueba el endpoint `/api/packages`
- Revisa la consola (F12) para más detalles

---

**¡Sistema de rutas completamente funcional!** ✅📦
