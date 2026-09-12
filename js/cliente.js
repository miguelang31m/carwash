/* =========================================================
   CAR WASH LA 33 - cliente.js (LINK PÚBLICO, SIN LOGIN)
   Reconoce el dispositivo vía localStorage('cw_cliente_id').
   1ª visita: pide NOMBRE + TELÉFONO (obligatorios) → crea/asocia m_cliente.
   Visitas siguientes: reconoce el mismo perfil automáticamente.
   Requiere store.js cargado antes.
   ========================================================= */

let cwSel = { veh: null, svc: null, hora: null, reagendarId: null };

function cwStep(id) {
  ['cwStepRegistro','cwStepVehiculo','cwStepServicio','cwStepHora','cwStepOk','cwStepMisCitas']
    .forEach(s => document.getElementById(s).hidden = (s !== id));
}

function cwGetMiCliente() {
  let id = null;
  try { id = localStorage.getItem('cw_cliente_id'); } catch (err) {}
  if (!id) id = CW._mem.cw_cliente_id;
  if (!id) return null;
  return cliente(Number(id)) || null;
}

function cwIniciarFlujo() {
  const cli = cwGetMiCliente();
  if (!cli || !cli.id_cliente) { cwStep('cwStepRegistro'); return; }
  document.getElementById('cwGreet').textContent = `HOLA DE NUEVO, ${cli.nombre.split(' ')[0]} 👋`;
  cwStep('cwStepVehiculo');
}

function cwRenderServicios(veh) {
  const servicios = CW.store.get('m_servicio').filter(s => s.vehiculo === veh);
  document.getElementById('cwSvcOpts').innerHTML = servicios.map(s => `
    <div class="cw-svcopt__it" data-svc="${s.id_servicio}">
      <div>
        <div class="cw-svcopt__nm">${s.nombre}</div>
        <div class="cw-svcopt__ds">${s.duracion_min} MIN - ${s.descripcion}</div>
      </div>
      <div class="cw-svcopt__pr">${fmtMoney(s.precio)}</div>
    </div>
  `).join('');
  document.querySelectorAll('#cwSvcOpts [data-svc]').forEach(el => {
    el.addEventListener('click', () => {
      cwSel.svc = Number(el.dataset.svc);
      cwRenderHoras();
      cwStep('cwStepHora');
    });
  });
}

function cwRenderHoras() {
  const citas = CW.store.get('m_cita');
  const ocupadas = citas.filter(c => c.id_cita !== cwSel.reagendarId).map(c => c.hora);
  document.getElementById('cwClientSlots').innerHTML = HORAS.map(h => {
    const taken = ocupadas.includes(h);
    return `<div class="cw-slot ${taken?'is-taken':''}" data-hora="${h}">${h}</div>`;
  }).join('');
  document.querySelectorAll('#cwClientSlots .cw-slot:not(.is-taken)').forEach(el => {
    el.addEventListener('click', () => {
      cwSel.hora = el.dataset.hora;
      cwConfirmarCita();
    });
  });
}

function cwConfirmarCita() {
  const cli = cwGetMiCliente();
  const svc = servicio(cwSel.svc);

  if (cwSel.reagendarId) {
    CW.store.update('m_cita', 'id_cita', cwSel.reagendarId, {
      hora: cwSel.hora, id_servicio: cwSel.svc, estado: 'CONFIRMADA'
    });
    cwSendWhatsAppReminder(cli, {hora: cwSel.hora}, svc);
    document.getElementById('cwResumen').innerHTML =
      `CITA REAGENDADA: ${svc.nombre} - ${cwSel.hora}<br><br>
       <span style="color:#25d366;font-weight:700">&#10003; TE ESPERAMOS EN CAR WASH LA 33</span>`;
    cwSel.reagendarId = null;
    cwStep('cwStepOk');
    return;
  }

  const nueva = {
    id_cita: CW.store.nextId('m_cita','id_cita'),
    hora: cwSel.hora, id_cliente: cli.id_cliente,
    id_servicio: cwSel.svc, estado: 'CONFIRMADA'
  };
  CW.store.insert('m_cita', nueva);
  CW.store.update('m_cliente', 'id_cliente', cli.id_cliente, {
    visitas: (cli.visitas||0) + 1,
    ult_visita: new Date().toISOString().slice(0,10)
  });
  cwSendWhatsAppReminder(cli, nueva, svc);

  document.getElementById('cwResumen').innerHTML =
    `${svc.nombre} - ${cwSel.hora}<br>TE ESPERAMOS EN CAR WASH LA 33<br><br>
     <span style="color:#25d366;font-weight:700">&#10003; SE ABRIÓ WHATSAPP CON TU RECORDATORIO</span>`;
  cwStep('cwStepOk');
}

/* ---------------- MIS CITAS: historial, reagendar, eliminar ---------------- */
function cwRenderMisCitas() {
  const cli = cwGetMiCliente();
  if (!cli) return;
  const citas = CW.store.get('m_cita').filter(c => c.id_cliente === cli.id_cliente);
  const cont = document.getElementById('cwMisCitasList');
  if (!citas.length) {
    cont.innerHTML = `<p style="color:var(--cw-txt-dim);font-size:13px">AÚN NO TIENES CITAS AGENDADAS.</p>`;
    return;
  }
  cont.innerHTML = citas.map(c => {
    const svc = servicio(c.id_servicio);
    return `
      <div class="cw-mc-item">
        <div class="cw-mc-top">
          <span class="cw-mc-hora">${c.hora}</span>
          <span class="cw-badge cw-badge--ok">${c.estado}</span>
        </div>
        <div class="cw-mc-svc">${svc.nombre}</div>
        <div class="cw-mc-ds">${svc.duracion_min} MIN - ${fmtMoney(svc.precio)}</div>
        <div class="cw-mc-acts">
          <span data-reagendar="${c.id_cita}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 3v6h-6"/></svg>
            REAGENDAR
          </span>
          <span class="cw-mc-del" data-cancelar="${c.id_cita}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            ELIMINAR
          </span>
        </div>
      </div>`;
  }).join('');

  document.querySelectorAll('[data-cancelar]').forEach(el => {
    el.addEventListener('click', () => {
      if (!confirm('¿SEGURO QUE QUIERES ELIMINAR ESTA CITA?')) return;
      CW.store.remove('m_cita', 'id_cita', Number(el.dataset.cancelar));
      cwRenderMisCitas();
    });
  });
  document.querySelectorAll('[data-reagendar]').forEach(el => {
    el.addEventListener('click', () => {
      const cita = CW.store.get('m_cita').find(c => c.id_cita === Number(el.dataset.reagendar));
      if (!cita) return;
      cwSel.reagendarId = cita.id_cita;
      cwSel.svc = cita.id_servicio;
      cwSel.veh = servicio(cita.id_servicio).vehiculo;
      cwRenderHoras();
      cwStep('cwStepHora');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('cwSplash');
  if (splash) setTimeout(() => splash.classList.add('is-hidden'), 1600);

  if (!navigator.onLine) {
    console.log('MODO OFFLINE ACTIVO - APP SHELL SERVIDO DESDE CACHÉ');
  }

  cwIniciarFlujo();

  /* forzar mayúscula en el nombre (teléfono se deja tal cual, son números) */
  const nombreInput = document.getElementById('cwRegNombre');
  nombreInput.addEventListener('input', () => forceUpper(nombreInput));

  document.getElementById('cwStepRegistro').addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = nombreInput.value.trim().toUpperCase();
    const telefono = document.getElementById('cwRegTelefono').value.trim();
    if (!nombre || !telefono) return;

    /* evitar duplicados: si el teléfono ya existe, reutiliza ese perfil */
    let cli = CW.store.get('m_cliente').find(c => c.telefono === telefono);
    if (!cli) {
      cli = {
        id_cliente: CW.store.nextId('m_cliente','id_cliente'),
        nombre, telefono, vehiculo: '', visitas: 0,
        ult_visita: new Date().toISOString().slice(0,10)
      };
      CW.store.insert('m_cliente', cli);
    }
    try { localStorage.setItem('cw_cliente_id', cli.id_cliente); } catch (err) {}
    CW._mem.cw_cliente_id = cli.id_cliente;
    cwIniciarFlujo();
  });

  document.querySelectorAll('#cwVopts [data-veh]').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('#cwVopts .is-selected').forEach(s=>s.classList.remove('is-selected'));
      el.classList.add('is-selected');
      cwSel.veh = el.dataset.veh;
      cwRenderServicios(cwSel.veh);
      cwStep('cwStepServicio');
    });
  });

  document.getElementById('cwBackVeh').addEventListener('click', () => cwStep('cwStepVehiculo'));
  document.getElementById('cwBackSvc').addEventListener('click', () => cwStep('cwStepServicio'));
  document.getElementById('cwNuevaCitaBtn').addEventListener('click', () => {
    cwSel = { veh: null, svc: null, hora: null, reagendarId: null };
    cwIniciarFlujo();
  });

  document.getElementById('cwTabNueva').addEventListener('click', () => cwStep('cwStepVehiculo'));
  document.getElementById('cwTabNueva2').addEventListener('click', () => cwStep('cwStepVehiculo'));
  document.getElementById('cwTabMisCitas').addEventListener('click', () => { cwRenderMisCitas(); cwStep('cwStepMisCitas'); });
  document.getElementById('cwTabMisCitas2').addEventListener('click', () => { cwRenderMisCitas(); cwStep('cwStepMisCitas'); });
});
