# Guía de Preparación para Tiendas (Capacitor)

Esta guía te ayudará a preparar **Te lo Llevo** para ser publicada en la **Google Play Store** y **Apple App Store**.

## 1. Generación de Iconos y Splash Screens

Hemos configurado `@capacitor/assets` para automatizar este proceso.

1.  Crea una carpeta llamada `assets` en la raíz del proyecto.
2.  Coloca los siguientes archivos (en alta resolución, preferiblemente 1024x1024 para el icono):
    *   `assets/icon-only.png` (Icono sin fondo)
    *   `assets/icon-foreground.png` (Para Android Adaptive Icons)
    *   `assets/icon-background.png` (Fondo del icono)
    *   `assets/splash.png` (Imagen de carga, 2732x2732 recomendado)
    *   `assets/splash-dark.png` (Opcional, para modo oscuro)
3.  Ejecuta el comando:
    ```bash
    npm run cap:assets
    ```
    Esto generará automáticamente todos los tamaños necesarios para Android e iOS.

## 2. Certificados y Firmado

### Android (Play Store)
1.  **Generar Keystore:**
    ```bash
    keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-alias
    ```
2.  Configura el archivo `android/app/build.gradle` con las credenciales de tu keystore.
3.  Genera el App Bundle (.aab):
    ```bash
    cd android && ./gradlew bundleRelease
    ```

### iOS (App Store)
1.  Abre el proyecto en Xcode:
    ```bash
    npm run cap:ios
    ```
2.  En la pestaña **Signing & Capabilities**, selecciona tu equipo de desarrollo (Apple Developer Program).
3.  Xcode generará automáticamente los perfiles de aprovisionamiento necesarios.
4.  Realiza un **Archive** desde el menú **Product** para subir a App Store Connect.

## 3. Notificaciones Push
La app ya está configurada con `@capacitor/push-notifications`. Para que funcionen en producción:
*   **Android:** Sube tu archivo `google-services.json` a `android/app/`.
*   **iOS:** Sube tu archivo `GoogleService-Info.plist` a `ios/App/App/` y habilita la capacidad "Push Notifications" en Xcode.

## 4. Comandos Útiles
*   `npm run cap:sync`: Sincroniza los cambios de la web con las apps nativas.
*   `npm run cap:android`: Abre el proyecto en Android Studio.
*   `npm run cap:ios`: Abre el proyecto en Xcode.
