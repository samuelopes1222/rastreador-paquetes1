# 📱 Configuración de Plantillas Twilio WhatsApp

## ✅ Plantillas Creadas

### Plantilla 1: Nueva Solicitud (Para Admin)
**Template SID:** `HX3d6efa1e41109aed114be8ac9126fe01`
**Template Name:** `nueva_solicitud_registro`

```
- {{1}} = Nombre del mensajero
- {{2}} = Apellido del mensajero  
- {{3}} = Teléfono
- {{4}} = Cédula
- {{5}} = Dirección
- {{6}} = ID Solicitud

Nueva solicitud de registro ⚡

👤 {{1}} {{2}}
📱 Teléfono: {{3}}
🆔 Cédula: {{4}}

📍 Dirección: {{5}}

⏳ ID Solicitud: {{6}}

Revisa en el panel: [enlace admin]
```

---

### Plantilla 2: Bienvenida Mensajero (Para Mensajero)
**Template SID:** `HX0ece8c66995c79bf80455c63da05921f`
**Template Name:** `bienvenida_mensajero`

```
- {{1}} = Nombre del mensajero
- {{2}} = Cédula

🎉 ¡Bienvenido al Equipo! 🎉

Hola {{1}},

¡Excelente noticia! Tu solicitud fue APROBADA ✅

Ahora eres parte de nuestro equipo de repartidores.

📱 Tus Datos:
Cédula: {{2}}

💰 Gana dinero entregando paquetes
🗺️ Rastreo en tiempo real
🚚 Tus entregas en tiempo real

¿Dudas? Escríbenos aquí.

¡Éxito! 💪
```

---

## 📝 Configuración en .env

Agrega estos valores a tu archivo `.env`:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=<tu_account_sid>
TWILIO_AUTH_TOKEN=<tu_token>
TWILIO_PHONE_NUMBER=<tu_phone_number>          # Para SMS
TWILIO_WHATSAPP_NUMBER=<tu_whatsapp_number>  # Para WhatsApp
ADMIN_WHATSAPP=<tu_numero_admin>               # TU número (admin)

# WhatsApp Templates (Template SIDs)
TWILIO_TEMPLATE_NUEVA_SOLICITUD=<tu_template_id>
TWILIO_TEMPLATE_BIENVENIDA=HX0ece8c66995c79bf80455c63da05921f

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tracking_db
DB_USER=postgres
DB_PASSWORD=tu_contraseña

# JWT
JWT_SECRET=tu_clave_secreta_super_segura

# Client URL
CLIENT_URL=http://localhost:3000
```

---

## 🔄 Cómo Funciona

### 1. Cuando se registra un mensajero (Frontend)
```
Mensajero completa formulario
        ↓
envía POST /api/drivers/applications
        ↓
Backend recibe datos + screenshot
        ↓
Crea DriverApplication en BD
        ↓
Envía plantilla 1 al ADMIN con datos del mensajero
```

**Resultado:** Admin recibe WhatsApp con categoría que dice:
```
- Juan
- Pérez
- +1-829-123-4567
- 001-1234567-8
- #123, Avenida Principal, Santo Domingo
- uuid-del-registro
```

---

### 2. Cuando admin aprueba la solicitud
```
Admin + click en "Aprobar"
        ↓
Ingresa contraseña (opcional)
        ↓
Backend crea nuevo Driver
        ↓
Actualiza solicitud: status = "approved"
        ↓
Envía plantilla 2 al MENSAJERO
```

**Resultado:** Mensajero recibe WhatsApp diciendo:
```
🎉 ¡Bienvenido al Equipo! 🎉

Hola Juan,

¡Excelente noticia! Tu solicitud fue APROBADA ✅

Ahora eres parte de nuestro equipo de repartidores.

📱 Tus Datos:
Cédula: 001-1234567-8

💰 Gana dinero entregando paquetes
🗺️ Rastreo en tiempo real
🚚 Tus entregas en tiempo real

¿Dudas? Escríbenos aquí.

¡Éxito! 💪
```

---

### 3. Cuando admin rechaza
```
Admin + click en "Rechazar"
        ↓
Ingresa motivo personalizado
        ↓
Backend actualiza solicitud: status = "rejected"
        ↓
Envía mensaje personalizado al MENSAJERO
```

**Resultado:** Mensajero recibe:
```
❌ Tu solicitud de registro fue rechazada

Motivo: {motivo ingresado por el admin}

Si tienes dudas, contáctanos.
```

---

## 🔧 Funciones Actualizadas en Backend

### `notificationService.js`

**Nueva función: sendNuevaSolicitudTemplate()**
```javascript
await sendNuevaSolicitudTemplate(
  nombreMensajero,      // {{1}}
  apellidoMensajero,    // {{2}}
  telefonoMensajero,    // {{3}}
  cedulaMensajero,      // {{4}}
  direccion,            // {{5}}
  idSolicitud           // {{6}}
);
```

**Nueva función: sendBienvenidaTemplate()**
```javascript
await sendBienvenidaTemplate(
  phoneNumber,          // Teléfono del mensajero
  nombreMensajero,      // {{1}}
  cedulaMensajero       // {{2}}
);
```

---

## 📊 Cambios en Archivos

### ✅ Actualizado
- `.env.example` - Agregados Template SIDs y ADMIN_WHATSAPP
- `notificationService.js` - Nuevas funciones con plantillas
- `applicationController.js` - Usa nuevas funciones

### 📋 Próximos Pasos

1. **Copia tus credenciales Twilio al `.env`:**
   ```bash
   cp .env.example .env
   # Edita manualmente con tus valores
   ```

2. **Sincroniza BD:**
   ```bash
   cd backend
   npm run dev
   # En otra terminal, ejecutar: node -e "const DriverApplication = require('./src/models/DriverApplication'); DriverApplication.sync()"
   ```

3. **Prueba el flujo:**
   - Accede a `http://localhost:3000/driver-register`
   - Llena formulario + captura
   - Revisa tu WhatsApp como admin
   - Aprueba o rechaza desde `/admin/applications`

---

## 🎉 Resultado Final

✅ **Para Admin:** Notificaciones automáticas de nuevas solicitudes
✅ **Para Mensajero:** Bienvenida profesional al ser aprobado
✅ **Flexible:** Puedes personalizar plantillas en Dashboard de Twilio
✅ **Sin costo:** Funciona en trial mientras el usuario responda

---

## 📞 Soporte

Si necesitas cambiar las plantillas:
1. Ve a Twilio Console → Content Editor
2. Busca la plantilla por nombre
3. Edítala
4. Luego de cambios, actualiza el código si usas variables diferentes
