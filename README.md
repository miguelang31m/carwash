# Car Wash La 33

## Estructura (tipo_iabc)
```
carwash33/
  index.html          → panel principal
  css/style.css        → estilos (fuera del index)
  js/app.js            → lógica (slots, filtros)
  data/*.json           → datos mock locales (fase actual)
  config/db.php          → PDO stub, se activa al montar hosting
  api/                  → endpoints PHP (futuro)
```

## Convenciones
- Prefijo CSS: `cw-` (Car Wash)
- Tablas/entidades abreviadas con prefijo `m_` (maestras): `m_cliente`, `m_servicio`, `m_producto`, `m_cita`
- IDs: `id_cliente`, `id_servicio`, `id_cita` (patrón `id_<entidad>`)
- Fase local: JSON en `/data` simulan las tablas. Al montar Azure MySQL, `config/db.php` reemplaza las lecturas JSON sin tocar el HTML/CSS.

## Paleta
| Token | Hex | Uso |
|---|---|---|
| `--cw-bg` | #070b12 | fondo base |
| `--cw-blue` | #4fc3f7 | acento / interacción |
| `--cw-white` | #eef6ff | texto principal |
| `--cw-black` | #05070a | nav / contraste |

## Reglas de negocio
- **Mayúsculas obligatorias:** todo dato capturado se guarda en MAYÚSCULA (frontend fuerza en tiempo real; en PHP aplicar `mb_strtoupper`).
- **Horario:** 8:00 AM a 7:00 PM. Duración por servicio (más barato = menos tiempo):
  - MOTO SENCILLA 15 min ($20K) / MOTO FULL 25 min ($25K)
  - CARRO SENCILLA 25 min ($30K) / CARRO FULL 40 min ($40K)
  - CAMIONETA SENCILLA 35 min ($40K) / CAMIONETA FULL 50 min ($50K)
- **Dos puertas de entrada:**
  - `login.html` → **exclusivo ADMIN** (dueño del lavadero), acceso al panel completo (`index.html`).
  - `agendar.html` → **link público para clientes**, SIN login. Reconoce el dispositivo por `localStorage('cw_cliente_id')`: primera visita pide NOMBRE + TELÉFONO (obligatorios) y crea el perfil en `m_cliente`; visitas siguientes lo reconoce automáticamente y va directo a agendar.
- **Recordatorio WhatsApp (real vía wa.me):** al confirmar/reagendar una cita se abre WhatsApp (app o web) con el mensaje ya escrito al número del cliente, indicativo **+57 (Colombia) fijo**. El cliente solo da "enviar". Se guarda también en `m_recordatorio`. Al comprar la API key real (Twilio/WhatsApp Business), reemplazar `cwSendWhatsAppReminder()` por un POST a `/api/whatsapp.php` para envío 100% automático sin depender del clic del usuario.
- **Historial del cliente:** en `agendar.html`, pestaña "MIS CITAS" - lista sus citas, con **reagendar** (elige nueva hora/servicio) y **eliminar** (cancela).
- **Modo offline SIEMPRE:** `sw.js` (Service Worker) cachea el App Shell; tras la primera carga, la app funciona sin internet. Fuentes sin dependencia de CDN (system fonts) para que funcione incluso sin conexión desde el primer arranque.

## Archivos nuevos (v3)
```
agendar.html      → página pública para clientes (sin login)
js/store.js        → capa de datos compartida (localStorage + WhatsApp + toast + SW)
js/cliente.js       → lógica del flujo público de agendamiento
manifest.json        → PWA
sw.js                → Service Worker (offline)
```

## Cómo probar
- **Admin:** abre `login.html` (usuario cualquiera, cualquier contraseña) → `index.html`.
- **Cliente:** abre `agendar.html` directamente (este es el link que se comparte). Primera vez pide nombre y teléfono; luego siempre reconoce el dispositivo.

## Pendiente (v4 - backend real)
- Reemplazar `CW.store` (localStorage) por `fetch` a `/api/*.php`
- `config/db.php` con Azure MySQL real
- Autenticación admin con bcrypt en `api/login.php`
- Integración real de WhatsApp Business API (con API key)
