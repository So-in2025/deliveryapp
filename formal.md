
📄 DOCUMENTO FORMAL DE ALCANCE Y DESARROLLO

Plataforma de Delivery Cercano

Cliente: Arturo
Proveedor Tecnológico: Jonathan Garro 
Fecha: 17 Febrero 2026
Versión: 1.0 – Documento Base de Inicio


---

1️⃣ VISIÓN GENERAL DEL PROYECTO

El proyecto consiste en el diseño, desarrollo e implementación de una plataforma digital de delivery multicomercio orientada a una zona turística / pueblo pequeño, con aproximadamente 30 comercios activos.

El sistema estará compuesto por:

Aplicación móvil Android

Aplicación móvil iOS

Backend central unificado

Panel administrador general

Paneles individuales para comercios

Sistema de repartidores

Web App Progresiva (PWA) estratégica complementaria


Objetivo del MVP

Salir a operación real lo antes posible

Validar el modelo operativo

Permitir crecimiento modular posterior

Garantizar estabilidad en zonas con conectividad limitada



---

2️⃣ ARQUITECTURA TECNOLÓGICA

El sistema será desarrollado bajo arquitectura profesional basada en React y tecnologías estándar de la industria.

Características técnicas clave

Arquitectura desacoplada frontend / backend

Persistencia local (offline-first)

Base de datos local en dispositivo

Sin dependencia de constructores no-code

Código modular escalable

Backend preparado para evolución futura

Preparación para empaquetado nativo Android e iOS


Principio estructural

Soberanía tecnológica operativa: el cliente no dependerá de plataformas SaaS obligatorias para utilizar su sistema en producción.


---

3️⃣ ALCANCE FUNCIONAL DEL MVP

3.1 Aplicaciones móviles (Producto Oficial)

Se entregarán:

App Android lista para Google Play

App iOS lista para App Store


Incluye:

Diseño moderno 2026

Interfaz clara e intuitiva

UX optimizada para usuarios no técnicos

Rendimiento optimizado

Testing en dispositivos reales



---

3.2 ROLES DEL SISTEMA

👤 Cliente / Visitante

Registro y login

Navegación por comercios

Visualización de productos

Carrito de compra

Checkout

Selección método de pago

Historial de pedidos

Seguimiento de estado

Notificaciones básicas



---

🏪 Comercio

Panel propio

Gestión de productos

Gestión de precios

Activar / desactivar disponibilidad

Recepción de pedidos

Cambio de estados

Visualización de historial

Reporte simple de ventas



---

🛵 Repartidor

Visualización de pedidos disponibles

Toma manual de pedido

Gestión de estados:

En camino al comercio

Pedido recogido

En camino al cliente

Entregado


Visualización básica de ruta



---

🧠 Administrador General

Alta / baja de comercios

Supervisión de pedidos

Acceso a métricas generales

Control de usuarios

Reportes globales



---

4️⃣ FLUJO DE PEDIDO

1. Cliente realiza pedido


2. Comercio recibe notificación


3. Comercio acepta y prepara


4. Pedido pasa a estado listo


5. Repartidor toma pedido manualmente


6. Entrega al cliente


7. Pedido finalizado



Despacho manual: no habrá asignación automática inteligente en el MVP.


---

5️⃣ FUNCIONAMIENTO OFFLINE

Sistema preparado para:

Guardar pedidos localmente

Sincronizar al recuperar señal

Tolerancia a conectividad intermitente

Persistencia ante cierre accidental de app


Limitación: validaciones críticas en producción deberán estar respaldadas por backend.


---

6️⃣ MAPAS Y GEOLOCALIZACIÓN

Incluye:

Integración mapa base

Visualización ubicación comercio

Ubicación cliente

Funcionamiento offline básico en zona delimitada


No incluye: optimización automática avanzada de rutas.


---

7️⃣ SISTEMA DE PAGOS

Incluye:

Integración con una pasarela de pago única

Registro de transacciones

Asociación pedido-pago

Confirmación básica


No incluye:

Multipasarela avanzada

Split automático entre comercios



---

8️⃣ WEB APP PROGRESIVA (PWA) – COMPLEMENTO ESTRATÉGICO

Se desarrollará en paralelo una Web App Progresiva que:

Permitirá acceso desde navegador

Funcionará en PC

Permitirá instalación directa desde navegador

Permitirá captación rápida por QR o enlace


La PWA utilizará el mismo backend que las apps móviles.

Importante: la PWA no reemplaza las apps. Es un complemento estratégico de accesibilidad y expansión.


---

9️⃣ CRONOGRAMA ESTIMADO (8 SEMANAS)

Semana 1–2
Arquitectura base + estructura sistema
🔹 HITO 1 → 40%

Semana 3–4
Flujos cliente + comercio
Demo navegable funcional
🔹 HITO 2 → 30%

Semana 5–6
Repartidor + administrador
Sistema completo integrado

Semana 7
Testing integral + optimización

Semana 8
Build Android
Build iOS
Preparación publicación
Activación PWA
🔹 HITO 3 → 30%


---

🔟 INVERSIÓN

Desarrollo MVP Multiplataforma Completo
USD 1.500

Esquema de pago

40% – USD 600 – Inicio formal

30% – USD 450 – Demo funcional

30% – USD 450 – Entrega final operativa


El MVP se abona completo bajo esquema por hitos.
No se financia el desarrollo a largo plazo.


---

1️⃣1️⃣ MANTENIMIENTO POSTERIOR (Opcional)

USD 80 / mes
Duración sugerida: 12 meses

Incluye:

Mantenimiento correctivo

Ajustes menores

Soporte técnico

Mejoras incrementales

Acompañamiento estratégico


Nuevas funcionalidades fuera del alcance se cotizan aparte.


---

1️⃣2️⃣ EXCLUSIONES DEL MVP

No incluye:

IA de optimización de rutas

Automatización logística avanzada

Multi-ciudad

Integraciones externas no especificadas

Funciones enterprise

Marketing automatizado

---


 1️⃣3️⃣ PROPIEDAD INTELECTUAL, ENTREGA Y DERECHOS DE USO

13.1 Entrega del Producto

Una vez abonado el 100% del valor acordado, el cliente recibirá:

Código fuente completo del frontend (Android e iOS).

Código fuente completo de la Web App Progresiva (PWA).

Backend operativo correspondiente al proyecto.

Base de datos asociada a su operación.

Accesos administrativos totales.

Configuración necesaria para su despliegue.

Manual básico de publicación y operación.


El producto entregado permitirá su continuidad operativa y evolución futura, ya sea por el proveedor o por terceros desarrolladores que el cliente designe.


---

13.2 Derechos del Cliente

El cliente adquiere:

Derecho de uso comercial indefinido.

Derecho de explotación económica sin limitaciones.

Propiedad total sobre:

Marca

Identidad visual

Contenido

Base de datos generada por su operación.



El cliente podrá modificar, ampliar o migrar el sistema bajo su responsabilidad.


---

13.3 Libertad Tecnológica del Proveedor

El proveedor podrá reutilizar conceptos, metodologías, patrones de arquitectura, estructuras técnicas y conocimientos desarrollados durante el proyecto en futuros trabajos.

Esta disposición no implica limitación alguna sobre la operación, explotación o evolución del producto entregado al cliente.

No existe exclusividad estructural salvo acuerdo expreso adicional.


---

13.4 Exclusividad Opcional

En caso de que el cliente desee exclusividad tecnológica total que impida al proveedor reutilizar la arquitectura base o conceptos estructurales en otros proyectos, deberá celebrarse un acuerdo independiente con valoración económica distinta.


---

14️⃣ CONDICIONES DE INICIO
El proyecto inicia formalmente una vez recibido el 40% inicial del valor acordado, correspondiente al primer hito de desarrollo.
A partir de ese momento se activarán los trabajos según el cronograma definido y se dará acceso al cliente a las primeras revisiones del sistema.
Cualquier modificación en los plazos o alcance deberá documentarse por escrito y firmarse de mutuo acuerdo.
