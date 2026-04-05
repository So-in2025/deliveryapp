# Manual de Usuario y Gestión - Plataforma de Delivery Elite

Este manual proporciona una guía detallada sobre el funcionamiento, gestión y configuración de la plataforma de delivery. La plataforma está diseñada con una arquitectura de cuatro roles principales: **Cliente**, **Comercio**, **Repartidor** y **Administrador**.

---

## 1. Introducción
La plataforma permite la gestión integral de pedidos de comida y productos, desde la creación del menú por parte del comercio hasta la entrega final por el repartidor, con procesamiento de pagos seguro a través de Mercado Pago.

---

## 2. Guía para el Cliente
El cliente accede a una interfaz optimizada para móviles y escritorio.

### 2.1 Realizar un Pedido
1. **Exploración**: Navega por las categorías o usa el buscador para encontrar comercios cercanos.
2. **Selección**: Elige un comercio y añade productos al carrito. Algunos productos permiten personalización (modificadores).
3. **Carrito**: Revisa tu pedido, aplica cupones si tienes y selecciona el método de entrega.
4. **Pago**: Selecciona Mercado Pago para pago online o "Efectivo al recibir".
5. **Confirmación**: Una vez realizado, recibirás una notificación de "Pedido Recibido".

### 2.2 Seguimiento en Tiempo Real
*   En la sección **"Mis Pedidos"**, puedes ver el estado actual (Pendiente, Preparando, En Camino, Entregado).
*   Cuando el pedido está **"En Camino"**, aparecerá un mapa con la ubicación del repartidor en tiempo real.

### 2.3 Gestión de Perfil
*   **Direcciones**: Guarda múltiples direcciones para pedidos rápidos.
*   **Favoritos**: Marca tus comercios preferidos con el icono de corazón.
*   **Historial**: Consulta pedidos pasados y repite órdenes con un clic.

---

## 3. Guía para el Comercio (Merchant)
El comercio gestiona su negocio desde un panel administrativo dedicado.

### 3.1 Gestión de Pedidos
*   **Nuevos Pedidos**: Aparecen en la pestaña "Pendientes" con una alerta sonora.
*   **Flujo de Trabajo**: 
    1.  **Aceptar**: Pasa el pedido a "En Preparación".
    2.  **Listo**: Notifica que el pedido está listo para ser retirado por un repartidor.
*   **Historial**: Consulta las ventas del día y pedidos finalizados.

### 3.2 Gestión del Menú
*   **Categorías**: Crea secciones como "Entradas", "Platos Principales", etc.
*   **Productos**: Añade fotos (vía Cloudinary), descripciones, precios y modificadores (ej: "Término de la carne").
*   **Disponibilidad**: Activa o desactiva productos según el stock.

### 3.3 Configuración del Local
*   **Horarios**: Define cuándo está abierto el local para recibir pedidos.
*   **Tarifas de Envío**: Configura el costo por kilómetro (calculado automáticamente por OSRM).
*   **Pagos**: Ingresa tu `Access Token` de Mercado Pago para recibir pagos directamente (Modo Descentralizado).

---

## 4. Guía para el Repartidor (Driver)
Interfaz simplificada para la gestión de entregas en movimiento.

### 4.1 Aceptar Entregas
*   Los pedidos listos aparecen en la lista de "Pedidos Disponibles".
*   El repartidor ve la distancia al comercio y al cliente antes de aceptar.

### 4.2 Proceso de Entrega
1.  **Retiro**: Al llegar al local, marca como "Pedido Retirado".
2.  **Navegación**: Usa el botón de mapa para abrir la ruta en Google Maps o Waze.
3.  **Entrega**: Al entregar al cliente, marca como "Entregado". El sistema libera el pago si corresponde.

---

## 5. Panel de Administración Global (Admin)
Control total de la plataforma y seguridad.

### 5.1 Seguridad (PIN de Acceso)
*   El acceso a funciones críticas requiere un **PIN de Administrador**.
*   Este PIN se valida en el servidor contra un documento seguro en Firestore (`system/security`).

### 5.2 Gestión de Comercios
*   Aprobación de nuevos comercios que se registran en la plataforma.
*   Ajuste de comisiones globales por servicio.

### 5.3 Configuración Técnica
*   Gestión de variables de entorno para APIs (Mercado Pago, Cloudinary, Firebase).

---

## 6. Configuración Técnica y Mantenimiento

### 6.1 Variables de Entorno (.env)
Para que la plataforma funcione al 100%, deben configurarse:
*   `MP_ACCESS_TOKEN`: Token de Mercado Pago (Central).
*   `VITE_CLOUDINARY_CLOUD_NAME`: Nombre de tu cuenta en Cloudinary.
*   `VITE_CLOUDINARY_UPLOAD_PRESET`: Preset de subida (unsigned).
*   `VITE_FIREBASE_VAPID_KEY`: Key para notificaciones Push.

### 6.2 Base de Datos (Firestore)
*   **Reglas de Seguridad**: Deben estar desplegadas para proteger los datos de los usuarios.
*   **Estructura**: Los datos se organizan en colecciones: `users`, `stores`, `products`, `orders`, `reviews`.

### 6.3 Notificaciones
*   La plataforma usa **Firebase Cloud Messaging (FCM)** para enviar alertas en tiempo real a navegadores y dispositivos móviles.

---

## 7. Soporte y Actualizaciones
*   **Logs**: Errores críticos se registran en la consola del servidor.
*   **Escalabilidad**: La arquitectura permite añadir miles de comercios sin degradación de rendimiento gracias al uso de Firebase.

---
*Manual generado el 04 de Abril de 2026 por el Equipo de Desarrollo Elite.*
