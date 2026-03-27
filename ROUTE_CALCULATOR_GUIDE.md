# 🗺️ Calculador de Rutas en la Página de Inicio

## ✨ Nueva Funcionalidad

Se ha agregado un **calculador de rutas en la página de inicio** donde puedes:

1. **Ingresar una dirección de partida**
2. **Ingresar una dirección final**
3. **Ver la ruta trazada en el mapa en tiempo real**
4. **Obtener distancia y tiempo estimado automáticamente**

---

## 📍 ¿Dónde Está?

En la página de inicio (`http://localhost:3000/`), justo después del mapa principal, verás:

```
┌──────────────────────────────────────────┐
│  🗺️ Calcula tu Ruta                      │
│  Ingresa una dirección de partida y      │
│  una final para ver la distancia y       │
│  tiempo estimado                         │
│                                          │
│  [Dirección de Partida]     [Búsqueda]  │
│  [Dirección Final]          [Búsqueda]  │
│                                          │
│  [🔍 Calcular Ruta]  [✕ Limpiar]        │
│                                          │
│  Distancia: 12.50 km                    │
│  Tiempo: 15m                            │
│  Velocidad: 50 km/h                     │
└──────────────────────────────────────────┘
```

---

## 🎯 Cómo Usar

### Paso 1: Abre la página de inicio
```
http://localhost:3000/
```

### Paso 2: Ingresa la dirección de partida
```
Ejemplo: "Calle Principal 123, Santo Domingo"
o
"Centro de Santo Domingo"
```

### Paso 3: Ingresa la dirección final
```
Ejemplo: "Villa Mella 456, Santo Domingo"
o
"Los Alcarrizos"
```

### Paso 4: Presiona "🔍 Calcular Ruta"
El sistema:
- ✅ Busca ambas direcciones (geocodificación)
- ✅ Calcula la ruta óptima (OSRM)
- ✅ Muestra la distancia en km
- ✅ Muestra el tiempo estimado
- ✅ Traza la ruta en el mapa

---

## 📊 Información Mostrada

Cuando calculas una ruta, verás:

### En el Formulario:
```
✓ Distancia: 12.50 km
✓ Tiempo estimado: 15 minutos (o 1h 30m)
✓ Velocidad promedio: 50 km/h
```

### En el Mapa:
```
✓ Marcador VERDE = Punto de partida
✓ Marcador ROJO = Punto final
✓ Línea VERDE = Ruta óptima entre ambos
✓ También muestra repartidores y otros paquetes
```

---

## 🔧 Componentes Técnicos

### Archivos Creados:

1. **`frontend/src/components/RouteCalculator.js`**
   - Componente que maneja la lógica de búsqueda de rutas
   - Usa Nominatim para geocodificación
   - Usa OSRM para calcular rutas

2. **`frontend/src/styles/RouteCalculator.css`**
   - Estilos responsive
   - Diseño limpio y moderno

### Servicios Utilizados (Gratuitos):

- **Nominatim (OpenStreetMap)**: Geocodificación de direcciones
- **OSRM (Project OSRM)**: Cálculo de rutas y distancias

---

## 💡 Casos de Uso

### Caso 1: Cliente Quiere Conocer el Viaje
```
1. Va a http://localhost:3000/
2. Ingresa su casa como origen
3. Ingresa la tienda como destino
4. Ve cuántos km y cuánto tiempo le toma
5. Usa esta info para planificar su día
```

### Caso 2: Repartidor Planificando Ruta
```
1. Recibe paquetes a entregar
2. Entra en la página de inicio
3. Calcula ruta origen → destino
4. Ve distancia y tiempo
5. Optimiza su ruta de entrega
```

### Caso 3: Admin Verificando Distancias
```
1. Quiere ver si la asignación es eficiente
2. Calcula rutas entre puntos
3. Verifica tiempos estimados
4. Toma decisiones de asignación
```

---

## 🎨 Visualización en el Mapa

### Elementos que Ves:

```
MAPA ACTUALIZADO:

├─ 🟢 Marcador VERDE = Tu dirección de partida
├─ 🔴 Marcador ROJO = Tu dirección final (existe otro rojo para paquetes)
├─ Línea VERDE GRUESA = Tu ruta calculada
│
├─ 🟢 Marcadores verdes = Origen de paquetes del sistema
├─ 🔴 Marcadores rojos = Destino de paquetes del sistema  
├─ Líneas azul punteada = Rutas de paquetes del sistema
│
└─ 🔵 Círculos azules = Repartidores activos
```

### Leyenda:
```
La leyenda ahora muestra:
├─ Origen (Partida) - verde
├─ Destino (Entrega) - rojo
├─ Repartidor - azul
└─ Ruta Actual (cuando calculas) - verde gruesa
```

---

## 📱 Responsive en Todos los Dispositivos

| Dispositivo | Vista |
|------------|------|
| **Desktop (>800px)** | 2 columnas lado a lado |
| **Tablet (600-800px)** | Formulario uno debajo del otro |
| **Móvil (<600px)** | Stack vertical, completamente responsivo |

---

## ⏱️ Información de Tiempo

El sistema convierte en formato legible:

```
Minutos < 60:
  → "15 minutos" o "45 minutos"
  
Minutos >= 60:
  → "1 hora 30 minutos" o "2 horas 15 minutos"
```

---

## 📈 Velocidad Promedio

Se calcula automáticamente:
```
Velocidad (km/h) = Distancia (km) / Tiempo (horas)

Ejemplo:
- Distancia: 12.5 km
- Tiempo: 15 minutos (0.25 horas)
- Velocidad: 12.5 / 0.25 = 50 km/h
```

---

## 🐛 Troubleshooting

### "No encuentra la dirección"
**Solución**: 
- Intenta escribir el nombre del barrio: "Villa Mella"
- O la calle principal: "Calle Duarte"
- El sistema busca con Nominatim (OpenStreetMap)

### "Error al calcular la ruta"
**Posibles causas**:
- Las direcciones no están suficientemente cerca
- Una dirección no existe en el sistema
- Problema de conexión a internet

**Solución**: 
- Verifica las direcciones
- Prueba con direcciones en Santo Domingo
- Recarga la página

### El mapa no actualiza
**Solución**:
- Presiona F5 para refrescar
- Limpia cache del navegador (Ctrl+Shift+Del)

---

## 🚀 Cómo Funciona Técnicamente

### Paso 1: Búsqueda de Direcciones (Nominatim)
```
Usuario escribe: "Calle Principal 123"
        ↓
API Nominatim busca la dirección
        ↓
Retorna: {lat: 18.4861, lng: -69.9312}
```

### Paso 2: Calcular Ruta (OSRM)
```
Coordenadas Origen: 18.4861, -69.9312
Coordenadas Destino: 18.5000, -69.9500
        ↓
API OSRM calcula ruta óptima
        ↓
Retorna:
  - Distancia: 12.50 km
  - Tiempo: 15 minutos (900 segundos)
  - Coordenadas de cada punto de la ruta
```

### Paso 3: Mostrar en Mapa
```
Crea marcadores en orden y destino
        ↓
Dibuja línea verde entre ellos
        ↓
Actualiza información (distancia, tiempo)
        ↓
Usuario ve todo en el mapa
```

---

## ✅ Checklist de Verificación

- [x] Componente RouteCalculator creado
- [x] Estilos responsive
- [x] Integración con HomePage
- [x] Mapa actualizado para mostrar rutas
- [x] Leyenda mejorada
- [x] Geocodificación con Nominatim
- [x] Cálculo de rutas con OSRM
- [x] Conversión de tiempos legible
- [x] Cálculo de velocidad promedio

---

## 🔄 Flujo Completo de Usuario

```
1. Usuario abre http://localhost:3000/
   ↓
2. Ve el mapa con repartidores y paquetes
   ↓
3. Desciende y ve el calculador de rutas
   ↓
4. Ingresa dirección de partida
   ↓
5. Ingresa dirección final
   ↓
6. Presiona "Calcular Ruta"
   ↓
7. Sistema:
   ├─ Geocodifica ambas direcciones
   ├─ Calcula ruta con OSRM
   ├─ Dibuja en el mapa
   └─ Muestra distancia y tiempo
   ↓
8. Usuario ve:
   ├─ Marcadores en origen y destino
   ├─ Línea verde mostrando ruta
   ├─ Distancia en km
   ├─ Tiempo estimado
   └─ Velocidad promedio
   ↓
9. Usuario puede:
   ├─ Limpiar y calcular otra ruta
   ├─ Ver repartidores disponibles
   └─ Hacer clic para llamar repartidor
```

---

## 💾 Datos Guardados

**Nota:** El calculador de rutas NO guarda datos. Es temporal para:
- Planificación
- Consulta de distancias
- Verificación de rutas

Si deseas crear un paquete permanente, usa `/create`

---

## 🎓 Diferencia con "Crear Paquete"

| Función | Calculador | Crear Paquete |
|---------|-----------|---------------|
| **Ubicación** | Página inicio | Página `/create` |
| **Propósito** | Consulta temporal | Creación permanente |
| **Datos** | No se guardan | Se guardan |
| **Ruta** | Solo sí/no | Definida |
| **Base de datos** | Ninguno | Guarda en BD |

---

**¡El calculador de rutas está listo!** 🚀

Abre `http://localhost:3000/` y desciende para ver el formulario de cálculo de rutas. ¡Prueba ingresando dos direcciones! 📍🗺️
