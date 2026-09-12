/* =========================================================
   CAR WASH LA 33 - store.js
   Capa de datos compartida entre index.html (admin) y agendar.html (cliente).
   Store local (localStorage) que simula las tablas m_*.
   Regla de negocio: TODO texto capturado se guarda en MAYÚSCULA.
   Al montar backend real: reemplazar CW.store por fetch a /api/*
   y aplicar mb_strtoupper($valor,'UTF-8') antes de cada INSERT/UPDATE.
   ========================================================= */

const CW = {};

/* ---------------- SEED (datos iniciales, solo si no hay nada guardado) ---------------- */
CW.seed = {
  m_cliente: [
    {id_cliente:1, nombre:"ANDRÉS RUIZ", telefono:"3001112233", vehiculo:"MAZDA 3", visitas:12, ult_visita:"2026-09-11"},
    {id_cliente:2, nombre:"LAURA GÓMEZ", telefono:"3015558899", vehiculo:"CRV", visitas:7, ult_visita:"2026-09-11"},
    {id_cliente:3, nombre:"JULIÁN ORTIZ", telefono:"3124440099", vehiculo:"TWIST 125", visitas:3, ult_visita:"2026-09-11"}
  ],
  m_servicio: [
    {id_servicio:1, nombre:"MOTO SENCILLA", vehiculo:"MOTO", tipo:"SENCILLA", duracion_min:15, precio:20000, descripcion:"LAVADO EXTERIOR RÁPIDO: CARROCERÍA, LLANTAS Y LIMPIEZA BÁSICA."},
    {id_servicio:2, nombre:"MOTO FULL", vehiculo:"MOTO", tipo:"FULL", duracion_min:25, precio:25000, descripcion:"LAVADO COMPLETO: CARROCERÍA, LLANTAS, CADENA, MOTOR Y BRILLADO."},
    {id_servicio:3, nombre:"CARRO SENCILLA", vehiculo:"CARRO", tipo:"SENCILLA", duracion_min:25, precio:30000, descripcion:"LAVADO EXTERIOR: CARROCERÍA, LLANTAS Y VIDRIOS."},
    {id_servicio:4, nombre:"CARRO FULL", vehiculo:"CARRO", tipo:"FULL", duracion_min:40, precio:40000, descripcion:"LAVADO COMPLETO EXTERIOR + INTERIOR: ASPIRADO, TABLERO, LLANTAS Y BRILLADO."},
    {id_servicio:5, nombre:"CAMIONETA SENCILLA", vehiculo:"CAMIONETA", tipo:"SENCILLA", duracion_min:35, precio:40000, descripcion:"LAVADO EXTERIOR: CARROCERÍA, LLANTAS Y VIDRIOS (VEHÍCULO GRANDE)."},
    {id_servicio:6, nombre:"CAMIONETA FULL", vehiculo:"CAMIONETA", tipo:"FULL", duracion_min:50, precio:50000, descripcion:"LAVADO COMPLETO EXTERIOR + INTERIOR: ASPIRADO, TABLERO, LLANTAS Y BRILLADO (VEHÍCULO GRANDE)."}
  ],
  m_producto: [
    {cod:"P-01", nombre:"SHAMPOO AUTOMOTRIZ 5L", categoria:"QUÍMICOS", stock:18},
    {cod:"P-02", nombre:"CERA LÍQUIDA", categoria:"QUÍMICOS", stock:4},
    {cod:"P-03", nombre:"MICROFIBRAS", categoria:"INSUMOS", stock:2},
    {cod:"P-04", nombre:"SILICONA LLANTAS", categoria:"QUÍMICOS", stock:21}
  ],
  m_cita: [
    {id_cita:1, hora:"9:00 AM",  id_cliente:1, id_servicio:2, estado:"EN CURSO"},
    {id_cita:2, hora:"10:30 AM", id_cliente:2, id_servicio:3, estado:"CONFIRMADA"},
    {id_cita:3, hora:"2:00 PM",  id_cliente:3, id_servicio:1, estado:"CONFIRMADA"}
  ],
  m_galeria: [],
  m_recordatorio: []
};

/* ---------------- STORE (localStorage con respaldo en memoria) ----------------
   Algunos navegadores (Safari en especial) bloquean localStorage cuando el
   archivo se abre directo con doble clic (protocolo file://). Este respaldo
   evita que la app se quede en blanco: si localStorage falla, sigue
   funcionando en memoria durante la sesión. */
CW._mem = {};
CW.store = {
  _key: (t) => 'cw33_' + t,
  get(tabla) {
    let raw = null;
    try { raw = localStorage.getItem(this._key(tabla)); } catch (err) {}
    if (raw) return JSON.parse(raw);
    if (CW._mem[tabla]) return CW._mem[tabla];
    const seed = CW.seed[tabla] || [];
    this.set(tabla, seed);
    return seed;
  },
  set(tabla, data) {
    CW._mem[tabla] = data;
    try { localStorage.setItem(this._key(tabla), JSON.stringify(data)); } catch (err) {}
  },
  nextId(tabla, campo) {
    const rows = this.get(tabla);
    return rows.length ? Math.max(...rows.map(r => r[campo] || 0)) + 1 : 1;
  },
  insert(tabla, row) {
    const rows = this.get(tabla);
    rows.push(row);
    this.set(tabla, rows);
  },
  remove(tabla, campo, valor) {
    let rows = this.get(tabla);
    rows = rows.filter(r => r[campo] !== valor);
    this.set(tabla, rows);
  },
  update(tabla, campo, valor, patch) {
    const rows = this.get(tabla);
    const row = rows.find(r => r[campo] === valor);
    if (row) Object.assign(row, patch);
    this.set(tabla, rows);
  }
};

/* ---------------- HELPERS ---------------- */
function fmtMoney(n) { return '$' + Number(n).toLocaleString('es-CO'); }
function cliente(id) { return CW.store.get('m_cliente').find(c => c.id_cliente === id) || {}; }
function servicio(id) { return CW.store.get('m_servicio').find(s => s.id_servicio === id) || {}; }
function forceUpper(el) {
  const pos = el.selectionStart;
  el.value = el.value.toUpperCase();
  el.setSelectionRange(pos, pos);
}

const HORAS = (() => {
  const out = [];
  for (let h = 8; h <= 18; h++) {
    out.push(`${h > 12 ? h-12 : h}:00 ${h < 12 ? 'AM' : 'PM'}`);
    out.push(`${h > 12 ? h-12 : h}:30 ${h < 12 ? 'AM' : 'PM'}`);
  }
  return out; // 8:00 AM ... 6:30 PM
})();

/* ---------------- WHATSAPP (envío real vía wa.me) ----------------
   Abre WhatsApp (app o web) con el mensaje ya escrito, listo para enviar.
   El indicativo de Colombia (+57) se antepone siempre.
   TODO: cuando se compre la API key real (Twilio / WhatsApp Business API),
   reemplazar esta función por un POST a /api/whatsapp.php que envíe el
   mensaje automáticamente sin depender de que el usuario dé "enviar". */
function cwSoloDigitos(tel) { return String(tel||'').replace(/\D/g, ''); }
function cwTelConIndicativo(tel) {
  const d = cwSoloDigitos(tel);
  return d.startsWith('57') ? d : '57' + d;
}
function cwSendWhatsAppReminder(cli, cita, svc) {
  const msg = `HOLA ${cli.nombre}, TE RECORDAMOS TU CITA HOY A LAS ${cita.hora} PARA ${svc.nombre} EN CAR WASH LA 33. ¡TE ESPERAMOS!`;
  const telConIndicativo = cwTelConIndicativo(cli.telefono);
  CW.store.insert('m_recordatorio', {
    id_recordatorio: CW.store.nextId('m_recordatorio','id_recordatorio'),
    id_cliente: cli.id_cliente, telefono: '+' + telConIndicativo, mensaje: msg,
    canal: 'WHATSAPP', fecha: new Date().toISOString()
  });
  const url = `https://wa.me/${telConIndicativo}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  cwToast('ABRIENDO WHATSAPP', `SE ABRIÓ WHATSAPP CON EL MENSAJE LISTO PARA +${telConIndicativo}`);
}

function cwToast(titulo, mensaje) {
  let t = document.getElementById('cwToast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'cw-toast';
    t.id = 'cwToast';
    t.innerHTML = `
      <svg class="cw-toast__ic" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1112 20z"/><path d="M8.5 7.5c.2-.5.5-.5.7-.5h.6c.2 0 .4 0 .6.4s.6 1.5.7 1.6c.1.1.1.3 0 .5-.1.2-.2.3-.4.5-.2.2-.4.4-.2.7.2.4.9 1.4 1.9 2.3 1.3 1.1 2.3 1.4 2.7 1.6.4.2.6.1.8-.1.2-.2.9-1 1.1-1.4.2-.4.4-.3.7-.2.3.1 1.9.9 2.2 1 .3.2.5.2.6.4.1.2.1 1-.3 1.9-.4.9-2 1.7-2.8 1.8-.7.1-1.6.2-5-1.2-3.4-1.4-4.7-4.6-4.8-4.8-.1-.2-1-1.4-1-2.6 0-1.2.6-1.8.9-2.1z"/></svg>
      <div><div class="cw-toast__ttl">${titulo}</div><div class="cw-toast__msg">${mensaje}</div></div>
    `;
    document.body.appendChild(t);
  } else {
    t.querySelector('.cw-toast__ttl').textContent = titulo;
    t.querySelector('.cw-toast__msg').textContent = mensaje;
  }
  requestAnimationFrame(() => t.classList.add('is-show'));
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('is-show'), 5000);
}

/* ---------------- OFFLINE (service worker) ----------------
   Garantiza que la app cargue sin internet tras la primera visita. */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
     }
