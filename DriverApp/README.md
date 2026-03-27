# Driver App - App Móvil para Conductores

Aplicación móvil React Native para conductores/repartidores del sistema de rastreo de paquetes.

## 🚀 Características

- ✅ **Login seguro** para conductores
- ✅ **Estado online/offline** con un toque
- ✅ **Mapa en tiempo real** con ubicación GPS
- ✅ **Pedidos disponibles** y aceptación instantánea
- ✅ **Rastreo GPS** continuo mientras está online
- ✅ **WebSocket** para actualizaciones en vivo
- ✅ **Notificaciones push** (próximamente)

## 🛠️ Requisitos Previos

- Node.js 16+
- React Native CLI
- Android Studio (para Android) o Xcode (para iOS)
- Dispositivo físico o emulador

## 📦 Instalación

### 1. Instalar dependencias
```bash
cd DriverApp
npm install
```

### 2. Instalar dependencias nativas (Android)
```bash
# Para Android
npm run android

# Para iOS (solo en macOS)
npm run ios
```

## 🔧 Configuración

### Permisos de ubicación (Android)

Asegúrate de que tu app tenga permisos de ubicación. En `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### Configuración del backend

Actualiza la URL del backend en `src/services/DriverService.js`:

```javascript
this.apiUrl = 'http://TU_IP_LOCAL:5000/api'; // Cambia localhost por tu IP
```

## 🚀 Ejecución

### Desarrollo
```bash
# Android
npm run android

# iOS
npm run ios
```

### Producción
```bash
# Build para Android
npm run build:android

# Build para iOS
npm run build:ios
```

## 📱 Uso de la App

### 1. Login
- Ingresa tus credenciales de conductor
- La app recordará tu sesión

### 2. Estado Online
- Toca el botón "En línea" para recibir pedidos
- Tu ubicación se actualiza automáticamente cada 5 segundos

### 3. Pedidos Disponibles
- Verás pedidos disponibles en el mapa (marcadores rojos)
- Toca un pedido para aceptarlo

### 4. Pedido Activo
- Una vez aceptado, verás los detalles del pedido
- Navega al punto de recogida y entrega
- Marca como completado cuando termines

## 🏗️ Arquitectura

```
DriverApp/
├── src/
│   ├── context/           # Estado global (DriverContext)
│   ├── services/          # API y WebSocket (DriverService)
│   ├── screens/           # Pantallas (Login, Home)
│   ├── components/        # Componentes reutilizables
│   └── utils/             # Utilidades
├── android/               # Configuración Android
├── ios/                   # Configuración iOS
└── App.tsx               # Punto de entrada
```

## 🔑 API Endpoints

La app se conecta a estos endpoints del backend:

- `POST /api/drivers/login` - Login
- `GET /api/packages/available` - Pedidos disponibles
- `POST /api/packages/:id/accept` - Aceptar pedido
- `PUT /api/packages/:id/status` - Actualizar estado
- WebSocket events: `update-location`, `new-order`, etc.

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Ejecutar en dispositivo específico
npx react-native run-android --deviceId=DEVICE_ID
```

## 📦 Build y Distribución

### Android APK
```bash
cd android
./gradlew assembleRelease
```

### iOS (requiere macOS)
```bash
cd ios
xcodebuild -workspace DriverApp.xcworkspace -scheme DriverApp -configuration Release
```

## 🔐 Seguridad

- JWT tokens almacenados de forma segura
- Encriptación de datos sensibles
- Validación de permisos de ubicación
- Comunicación HTTPS en producción

## 🐛 Troubleshooting

### Error de ubicación
- Verifica permisos en configuración del dispositivo
- Reinicia la app después de conceder permisos

### Error de conexión
- Verifica que el backend esté corriendo
- Confirma la URL/IP del backend
- Revisa conexión a internet

### Mapa no carga
- Verifica que react-native-maps esté correctamente instalado
- Confirma que tienes una clave de Google Maps (opcional)

## 📞 Soporte

Para soporte técnico, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0
**Plataforma**: React Native
**Estado**: MVP Funcional

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
