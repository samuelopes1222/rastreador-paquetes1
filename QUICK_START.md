# ⚡ Quick Start - Sistema de Rutas de Paquetes

## 🚀 Iniciar en 5 Minutos

### 1. Asegúrate que el Backend esté corriendo:
```bash
cd backend
npm install  (si no lo hiciste)
npm start
```
✅ Backend debe estar en: `http://localhost:3001`

### 2. En otra terminal, inicia el Frontend:
```bash
cd frontend
npm install  (si no lo hiciste)
npm start
```
✅ Frontend debe abrir en: `http://localhost:3000`

---

## 📝 Crear Tu Primer Paquete

### Opción A: Por Dirección (Búsqueda)

1. Abre: **http://localhost:3000/create**
2. Llena el formulario:
   - **Remitente**: Juan Pérez
   - **Destinatario**: María García
   - **Tel. Destinatario**: +1-809-555-0456

3. **Origen**:
   - Escribe: `Calle Principal 123, Santo Domingo`
   - Presiona: 🔍 **Buscar**
   - ✓ Debe aparecer un marcador verde en el mapa

4. **Destino**:
   - Escribe: `Villa Mella 456, Santo Domingo`
   - Presiona: 🔍 **Buscar**
   - ✓ Debe aparecer un marcador rojo en el mapa

5. Presiona: ✓ **Crear Paquete**

### Opción B: Por Click en Mapa

1. Abre: **http://localhost:3000/create**
2. Llena el formulario básico (remitente, destinatario)

3. **Origen**:
   - Presiona: 🔍 **Click en Mapa** (botón se vuelve verde)
   - Haz click en cualquier punto del mapa
   - ✓ Debe aparecer 🟢 marcador verde

4. **Destino**:
   - Presiona: 🔍 **Click en Mapa** (botón se vuelve verde)
   - Haz click en otro punto del mapa
   - ✓ Debe aparecer 🔴 marcador rojo

5. Presiona: ✓ **Crear Paquete**

---

## 🗺️ Ver Rutas en el Mapa

1. Abre: **http://localhost:3000** (Página de Inicio)
2. Ve el mapa con:
   - 🟢 Puntos verdes = Origen de paquetes
   - 🔴 Puntos rojos = Destino de paquetes
   - 🔵 Puntos azules = Repartidores activos
   - **Línea azul punteada** = Rutas entre origen y destino
3. Lee la leyenda en la esquina del mapa

---

## 📱 Llamar a un Repartidor

1. En **http://localhost:3000** (Página de Inicio)
2. Mira la sección "🚚 Repartidores Activos en tu Zona"
3. Cada tarjeta tiene un botón: **📞 Llamar: [número]**
4. Presiona el botón
   - **En móvil**: Abre automáticamente la app telefónica
   - **En desktop**: Intenta abrir cliente VoIP (Skype, etc.)

---

## 🎯 Lo Que Deberías Ver

### En /create

```
✓ Formulario a la izquierda
✓ Mapa interactivo a la derecha
✓ Al ingresar origen y destino, aparecen marcadores
✓ Línea azul conecta los dos puntos
✓ Botón "Crear Paquete" activado
```

### En /

```
✓ Mapa grande arriba con ruta(s)
✓ Leyenda en la esquina del mapa
✓ Tarjetas de repartidores abajo con botones de llamada
✓ Información auto-actualizada cada 30 segundos
```

---

## ⚙️ Variables de Entorno (si necesitas)

Crea archivo `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:3001
```

---

## 📖 Documentación Completa

Para entender mejor, lee estos archivos:

1. **PACKAGE_ROUTING_SYSTEM.md** - Arquitectura completa
2. **ROUTING_IMPLEMENTATION_SUMMARY.md** - Resumen de cambios
3. **VISUAL_WALKTHROUGH.md** - Cómo se ve visualmente

---

## 🐛 Troubleshooting Rápido

### "No encuentra la dirección"
- Intenta con nombre de barrio: "Villa Mella"
- O usa "Click en Mapa" directamente

### "El mapa no carga"
- Revisa conexión a internet
- Abre console (F12) - ¿hay errores?
- Intenta recargar la página

### "El botón Crear Paquete está gris"
- Completa TODOS los campos requeridos (*)
- Asegúrate de tener origen Y destino
- Ambas ubicaciones deben tener coordenadas

### "El backend no responde"
- ¿Está ejecutándose? `npm start` en carpeta backend
- ¿En el puerto 3001? Revisa en:
  - Frontend: `http://localhost:3001/api/drivers/active`
  - Debe devolver JSON con datos

---

## 📊 Estructura Básica

```
Mi Aplicación:
├─ Backend (Node.js)
│  ├─ http://localhost:3001
│  └─ API endpoints: /api/drivers, /api/packages
│
└─ Frontend (React)
   ├─ http://localhost:3000
   ├─ Páginas: /, /create, /track, /admin
   └─ Componentes: TrackingMap, CreatePackageForm
```

---

## ✨ Características Clave

| Feature | Descripción | Ubicación |
|---------|-------------|-----------|
| **Crear Paquetes** | Formulario con mapa | `/create` |
| **Ver Rutas** | Mapa con todas las rutas | `/` |
| **Llamar Repartidor** | Botones en tarjetas | `/` |
| **Rastrear Paquete** | Seguimiento en tiempo real | `/track` |
| **Panel Admin** | Gestión completa | `/admin` |

---

## 🔄 Ciclo de Vida de un Paquete

1. **Crear**: Usuario va a `/create` y define origen + destino
2. **Mostrar**: Aparece en mapa de `/` con ruta clara
3. **Asignar**: Admin asigna repartidor
4. **Rastrear**: Cliente ve paquete en `/track`
5. **Entregar**: Repartidor completa ruta
6. **Completar**: Sistema marca como entregado

---

## 💡 Ejemplo Práctico

### Crear paquete "Pizza a Domicilio"

```
1. Ir a http://localhost:3000/create

2. Formulario:
   - Remitente: "Pizzería Don Pepe"
   - Teléfono: "+1-809-555-1234"
   - Destinatario: "Carlos López"
   - Teléfono: "+1-809-555-5678"
   - Peso: 2.5 kg
   - Descripción: "Pizza Hawaiana"

3. Origen: 
   - Dirección: "Pizzería Don Pepe, Santo Domingo"
   - Buscar → Aparece 🟢 verde en mapa

4. Destino:
   - Dirección: "Calle 1 de Abril 123, Santo Domingo"
   - Buscar → Aparece 🔴 rojo en mapa

5. Crear Paquete ✓

6. Resultado:
   - Paquete PKG-123456 creado
   - Ruta visible en http://localhost:3000
   - Repartidor ve dónde recoger y dónde entregar
```

---

## 🎓 Próximos Pasos después de Probar

Después de que confirmes que funciona:

1. ✅ Crea varios paquetes de ejemplo
2. ✅ Prueba búsqueda y click en mapa
3. ✅ Verifica rutas en el mapa
4. ✅ Intenta llamar a un repartidor
5. ✅ Explora el panel admin

Luego puedes:
- Personalizar colores/diseño
- Agregar más campos al formulario
- Integrar con tu base de datos real
- Desplegar a producción

---

## 📞 Soporte

Si algo no funciona:
1. Lee los logs en la console (F12)
2. Revisa que backend y frontend estén corriendo
3. Verifica las URLs son correctas
4. Busca el error específico en los documentos

---

**¡Ya está todo listo para empezar!** 🚀

Presiona F5 en el navegador y ¡comienza a crear paquetes! 📦
