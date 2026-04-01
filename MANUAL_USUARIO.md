# 📖 Manual de Usuario: Plataforma Mazamitla

Bienvenido al manual de uso de la plataforma de delivery de Mazamitla. Este documento explica cómo operar el sistema desde los diferentes roles disponibles.

---

## 1️⃣ Rol: Administrador (Admin)

El administrador tiene control total sobre la plataforma.

### 🏪 Dar de Alta un Comercio
1. Ingresa a la vista de **Admin**.
2. Ve a la sección **Comercios**.
3. Haz clic en **"Nuevo Comercio"**.
4. Completa los datos:
   - Nombre del restaurante.
   - Categoría (ej. Mexicana, Hamburguesas).
   - Tiempo estimado de entrega (min y max).
   - Costo de envío.
   - URL de la imagen de portada.
5. Guarda los cambios. El comercio aparecerá inmediatamente en la app de los clientes.

### 🍔 Gestionar Menú de un Comercio
1. Dentro del panel de Admin, selecciona un comercio.
2. Ve a la pestaña **Menú**.
3. Añade productos con su nombre, descripción, precio e imagen.
4. Puedes agregar **Modificadores** (ej. "Término de la carne", "Extras") definiendo si son obligatorios (min: 1) o opcionales (min: 0).

---

## 2️⃣ Rol: Comercio (Dueño de Local)

El comercio gestiona los pedidos entrantes y su propio menú.

### 📦 Gestión de Pedidos
1. Ingresa a la vista de **Comercio**.
2. En el **Dashboard**, verás los pedidos entrantes en la columna "Nuevos".
3. **Flujo del Pedido:**
   - **Aceptar:** Mueve el pedido a "Preparando".
   - **Listo:** Mueve el pedido a "Listo para Recoger". En este momento, el pedido se vuelve visible para los Repartidores.

### 🏷️ Cupones de Descuento
1. Ve a la sección **Cupones**.
2. Crea un nuevo código (ej. `VERANO20`).
3. Define el porcentaje de descuento o monto fijo.
4. Activa o desactiva el cupón según sea necesario.

---

## 3️⃣ Rol: Repartidor (Driver)

El repartidor se encarga de llevar los pedidos del local al cliente.

### 🛵 Tomar un Pedido
1. Ingresa a la vista de **Repartidor**.
2. En la pestaña **Disponibles**, verás los pedidos que los comercios han marcado como "Listos".
3. Haz clic en **"Aceptar Viaje"**.

### 📍 Flujo de Entrega
1. Una vez aceptado, el estado cambia a "En Camino".
2. Sigue la ruta hacia el cliente.
3. Al entregar el pedido, haz clic en **"Marcar como Entregado"**.
4. Tus ganancias se actualizarán automáticamente en la pestaña **Ganancias**.

---

## 4️⃣ Rol: Cliente (Usuario Final)

### 🛒 Hacer un Pedido
1. Explora los restaurantes en el **Home**.
2. Selecciona productos y personalízalos (modificadores).
3. Ve al **Carrito** y revisa tu orden.
4. Procede al **Checkout**, ingresa tu dirección y método de pago.
5. Confirma el pedido.

### 📡 Seguimiento en Vivo
1. Tras confirmar, verás la pantalla de **Tracking**.
2. El estado se actualizará en tiempo real:
   - *Pendiente* -> *Preparando* -> *Listo* -> *En Camino* -> *Entregado*.

---

## 🛠️ Modo Desarrollador (Dev)
Para pruebas, puedes usar el **Dev Dashboard** para:
- Cambiar rápidamente entre roles.
- Limpiar la base de datos (Reset).
- Simular pérdida de conexión (Offline mode).
