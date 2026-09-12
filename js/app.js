/* =========================================================
   CAR WASH LA 33 - app.js (PANEL ADMIN)
   Requiere store.js cargado antes.
   ========================================================= */

/* ============================================================
   RENDER
   ============================================================ */
function renderKPIs() {
  const citas = CW.store.get('m_cita');
  const clientes = CW.store.get('m_cliente');
  const productos = CW.store.get('m_producto');

  document.getElementById('cwKpiCitas').textContent = citas.length;
  document.getElementById('cwKpiClientes').textContent = clientes.length;

  const ingresos = citas.reduce((sum, c) => sum + (servicio(c.id_servicio).precio || 0), 0);
  document.getElementById('cwKpiIngresos').innerHTML = fmtMoney(ingresos);

  const bajo = productos.filter(p => p.stock < 5).length;
  document.getElementById('cwKpiStock').innerHTML = `${bajo} <span style="color:#ffab91">ÍTEMS</span>`;
}

function renderSlots() {
  const citas = CW.store.get('m_cita');
  const ocupadas = citas.map(c => c.hora);
  const cont = document.getElementById('cwSlots');
  cont.innerHTML = HORAS.map(h => {
    const taken = ocupadas.includes(h);
    return `<div class="cw-slot ${taken ? 'is-taken' : ''}" data-hora="${h}">${h}</div>`;
  }).join('');
  cont.querySelectorAll('.cw-slot:not(.is-taken)').forEach(el => {
    el.addEventListener('click', () => {
      cont.querySelectorAll('.is-selected').forEach(s => s.classList.remove('is-selected'));
      el.classList.add('is-selected');
      openModalCita(el.dataset.hora);
    });
  });
}

function renderAgenda() {
  const citas = CW.store.get('m_cita');
  document.getElementById('cwAgendaBody').innerHTML = citas.map(c => {
    const cli = cliente(c.id_cliente), svc = servicio(c.id_servicio);
    return `<tr>
      <td>${c.hora}</td><td>${cli.nombre||''}</td><td>${svc.nombre||''}</td>
      <td>${cli.vehiculo||''}</td>
      <td><span class="cw-badge cw-badge--ok">${c.estado}</span></td>
    </tr>`;
  }).join('') || `<tr><td colspan="5" style="color:var(--cw-txt-dim)">SIN CITAS AÚN</td></tr>`;
}

function renderCitasFull() {
  const citas = CW.store.get('m_cita');
  document.getElementById('cwCitasBody').innerHTML = citas.map(c => {
    const cli = cliente(c.id_cliente), svc = servicio(c.id_servicio);
    return `<tr>
      <td>${c.hora}</td><td>${cli.nombre||''}</td><td>${svc.nombre||''}</td>
      <td><span class="cw-badge cw-badge--ok">${c.estado}</span></td>
      <td><div class="cw-row-acts"><span data-del-cita="${c.id_cita}">${ICO_DEL}</span></div></td>
    </tr>`;
  }).join('') || `<tr><td colspan="5" style="color:var(--cw-txt-dim)">SIN CITAS AÚN</td></tr>`;

  document.querySelectorAll('[data-del-cita]').forEach(el => {
    el.addEventListener('click', () => {
      if (!confirm('¿CANCELAR ESTA CITA?')) return;
      CW.store.remove('m_cita', 'id_cita', Number(el.dataset.delCita));
      renderAll();
    });
  });
}

const SVC_ICONS = [
  '<path d="M4 17h16M6 17l1-6h10l1 6M8 11l1.5-4h5L16 11"/><circle cx="8" cy="19" r="1.4"/><circle cx="16" cy="19" r="1.4"/>',
  '<path d="M4 17h16M6 17l1-6h10l1 6M8 11l1.5-4h5L16 11"/><path d="M3 21c1-1 2-1 3 0M18 21c1-1 2-1 3 0"/>',
  '<circle cx="12" cy="12" r="7"/><path d="M12 8v4l3 2"/>',
  '<path d="M5 12h14M12 5v14"/><circle cx="12" cy="12" r="9"/>'
];

function renderServicios() {
  const servicios = CW.store.get('m_servicio');
  document.getElementById('cwSvcList').innerHTML = servicios.map((s, i) => `
    <div class="cw-svc">
      <svg class="cw-svc__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${SVC_ICONS[i % SVC_ICONS.length]}</svg>
      <div>
        <div class="cw-svc__nm">${s.nombre}</div>
        <div class="cw-svc__ds">${s.duracion_min} MIN - ${s.descripcion || ''}</div>
      </div>
      <div class="cw-svc__pr">${fmtMoney(s.precio)}</div>
      <div class="cw-row-acts" style="margin-left:10px">
        <span data-edit-svc="${s.id_servicio}">${ICO_EDIT}</span>
        <span data-del-svc="${s.id_servicio}">${ICO_DEL}</span>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('[data-del-svc]').forEach(el => {
    el.addEventListener('click', () => {
      if (!confirm('¿ELIMINAR ESTE SERVICIO?')) return;
      CW.store.remove('m_servicio', 'id_servicio', Number(el.dataset.delSvc));
      renderAll();
    });
  });
  document.querySelectorAll('[data-edit-svc]').forEach(el => {
    el.addEventListener('click', () => openModalServicio(Number(el.dataset.editSvc)));
  });
}

const ICO_EDIT = '<svg class="cw-ic-btn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 3a2.85 2.85 0 114 4L7 21l-4 1 1-4z"/></svg>';
const ICO_DEL  = '<svg class="cw-ic-btn cw-ic-del" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>';

function renderClientes() {
  const clientes = CW.store.get('m_cliente');
  document.getElementById('cwClientesBody').innerHTML = clientes.map(c => `
    <tr>
      <td>${String(c.id_cliente).padStart(3,'0')}</td>
      <td>${c.nombre}</td><td>${c.telefono}</td><td>${c.vehiculo}</td>
      <td>${c.ult_visita}</td>
      <td><span class="cw-badge cw-badge--ok">${c.visitas}</span></td>
      <td><div class="cw-row-acts">
        <span data-edit-cliente="${c.id_cliente}">${ICO_EDIT}</span>
        <span data-del-cliente="${c.id_cliente}">${ICO_DEL}</span>
      </div></td>
    </tr>
  `).join('');
  document.querySelectorAll('[data-del-cliente]').forEach(el => {
    el.addEventListener('click', () => {
      if (!confirm('¿ELIMINAR ESTE CLIENTE?')) return;
      CW.store.remove('m_cliente', 'id_cliente', Number(el.dataset.delCliente));
      renderAll();
    });
  });
  document.querySelectorAll('[data-edit-cliente]').forEach(el => {
    el.addEventListener('click', () => openModalCliente(Number(el.dataset.editCliente)));
  });
}

function renderInventario() {
  const productos = CW.store.get('m_producto');
  document.getElementById('cwInventarioBody').innerHTML = productos.map(p => `
    <tr>
      <td>${p.cod}</td><td>${p.nombre}</td><td>${p.categoria}</td><td>${p.stock}</td>
      <td><span class="cw-badge ${p.stock < 5 ? 'cw-badge--low' : 'cw-badge--ok'}">${p.stock < 5 ? 'BAJO' : 'OK'}</span></td>
      <td><div class="cw-row-acts">
        <span data-edit-prod="${p.cod}">${ICO_EDIT}</span>
        <span data-del-prod="${p.cod}">${ICO_DEL}</span>
      </div></td>
    </tr>
  `).join('');
  document.querySelectorAll('[data-del-prod]').forEach(el => {
    el.addEventListener('click', () => {
      if (!confirm('¿ELIMINAR ESTE PRODUCTO?')) return;
      CW.store.remove('m_producto', 'cod', el.dataset.delProd);
      renderAll();
    });
  });
  document.querySelectorAll('[data-edit-prod]').forEach(el => {
    el.addEventListener('click', () => openModalProducto(el.dataset.editProd));
  });
}

function renderGaleria() {
  const fotos = CW.store.get('m_galeria');
  const cont = document.getElementById('cwGalList');
  if (!fotos.length) {
    cont.innerHTML = `<div style="color:var(--cw-txt-dim);font-size:13px;grid-column:1/-1">SIN FOTOS AÚN - SUBE LA PRIMERA</div>`;
    return;
  }
  cont.innerHTML = fotos.map((f, i) => `
    <div class="cw-gal__it">
      <img src="${f.data}" alt="FOTO ${i+1}">
    </div>
  `).join('');
}

function renderAll() {
  renderKPIs();
  renderSlots();
  renderAgenda();
  renderCitasFull();
  renderServicios();
  renderClientes();
  renderInventario();
  renderGaleria();
}

/* ============================================================
   MODAL GENÉRICO
   ============================================================ */
const modalBg = () => document.getElementById('cwModalBg');
let cwModalSubmit = null;

function openModal(titulo, campos, onSubmit) {
  document.getElementById('cwModalTitle').textContent = titulo.toUpperCase();
  document.getElementById('cwModalFields').innerHTML = campos.map(c => `
    <div class="cw-mfield">
      <label>${c.label}</label>
      <input type="${c.type||'text'}" name="${c.name}" placeholder="${c.placeholder||''}" ${c.required?'required':''} value="${c.value||''}">
    </div>
  `).join('');
  cwModalSubmit = onSubmit;
  modalBg().classList.add('is-open');

  // forzar mayúscula en los nuevos inputs del modal
  document.querySelectorAll('#cwModalFields input[type="text"]').forEach(el => {
    el.addEventListener('input', () => {
      const pos = el.selectionStart;
      el.value = el.value.toUpperCase();
      el.setSelectionRange(pos, pos);
    });
  });
}
function closeModal() { modalBg().classList.remove('is-open'); }

function openModalCliente(idEdit) {
  const editing = idEdit != null;
  const row = editing ? cliente(idEdit) : {};
  openModal(editing ? 'EDITAR CLIENTE' : 'NUEVO CLIENTE', [
    {label:'Nombre', name:'nombre', required:true, value:row.nombre||''},
    {label:'Teléfono', name:'telefono', type:'tel', required:true, value:row.telefono||''},
    {label:'Vehículo', name:'vehiculo', value:row.vehiculo||''}
  ], (data) => {
    if (editing) {
      CW.store.update('m_cliente', 'id_cliente', idEdit, {
        nombre: data.nombre.toUpperCase(), telefono: data.telefono,
        vehiculo: (data.vehiculo||'').toUpperCase()
      });
    } else {
      CW.store.insert('m_cliente', {
        id_cliente: CW.store.nextId('m_cliente','id_cliente'),
        nombre: data.nombre.toUpperCase(), telefono: data.telefono,
        vehiculo: (data.vehiculo||'').toUpperCase(), visitas: 0,
        ult_visita: new Date().toISOString().slice(0,10)
      });
    }
    renderAll();
  });
}

function openModalProducto(codEdit) {
  const editing = codEdit != null;
  const row = editing ? CW.store.get('m_producto').find(p => p.cod === codEdit) : {};
  openModal(editing ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO', [
    {label:'Código', name:'cod', required:true, value:row.cod||'', placeholder:'P-05'},
    {label:'Nombre', name:'nombre', required:true, value:row.nombre||''},
    {label:'Categoría', name:'categoria', value:row.categoria||''},
    {label:'Stock', name:'stock', type:'number', required:true, value:row.stock??''}
  ], (data) => {
    if (editing) {
      CW.store.update('m_producto', 'cod', codEdit, {
        cod: data.cod.toUpperCase(), nombre: data.nombre.toUpperCase(),
        categoria: (data.categoria||'').toUpperCase(), stock: Number(data.stock)
      });
    } else {
      CW.store.insert('m_producto', {
        cod: data.cod.toUpperCase(), nombre: data.nombre.toUpperCase(),
        categoria: (data.categoria||'').toUpperCase(), stock: Number(data.stock)
      });
    }
    renderAll();
  });
}

function openModalServicio(idEdit) {
  const editing = idEdit != null;
  const row = editing ? servicio(idEdit) : {};
  document.getElementById('cwModalTitle').textContent = editing ? 'EDITAR SERVICIO' : 'NUEVO SERVICIO';
  document.getElementById('cwModalFields').innerHTML = `
    <div class="cw-mfield"><label>Nombre</label><input type="text" name="nombre" required value="${row.nombre||''}"></div>
    <div class="cw-mfield"><label>Vehículo</label>
      <select name="vehiculo">
        ${['MOTO','CARRO','CAMIONETA'].map(v=>`<option value="${v}" ${row.vehiculo===v?'selected':''}>${v}</option>`).join('')}
      </select></div>
    <div class="cw-mfield"><label>Tipo</label>
      <select name="tipo">
        ${['SENCILLA','FULL'].map(v=>`<option value="${v}" ${row.tipo===v?'selected':''}>${v}</option>`).join('')}
      </select></div>
    <div class="cw-mfield"><label>Duración (min)</label><input type="number" name="duracion_min" required value="${row.duracion_min||''}"></div>
    <div class="cw-mfield"><label>Precio</label><input type="number" name="precio" required value="${row.precio||''}"></div>
    <div class="cw-mfield"><label>Descripción</label><textarea name="descripcion" rows="3">${row.descripcion||''}</textarea></div>
  `;
  document.querySelectorAll('#cwModalFields input[type="text"], #cwModalFields textarea').forEach(el => {
    el.addEventListener('input', () => {
      const pos = el.selectionStart;
      el.value = el.value.toUpperCase();
      el.setSelectionRange(pos, pos);
    });
  });
  cwModalSubmit = (data) => {
    const patch = {
      nombre: data.nombre.toUpperCase(), vehiculo: data.vehiculo, tipo: data.tipo,
      duracion_min: Number(data.duracion_min), precio: Number(data.precio),
      descripcion: (data.descripcion||'').toUpperCase()
    };
    if (editing) CW.store.update('m_servicio', 'id_servicio', idEdit, patch);
    else CW.store.insert('m_servicio', {id_servicio: CW.store.nextId('m_servicio','id_servicio'), ...patch});
    renderAll();
  };
  modalBg().classList.add('is-open');
}

function openModalCita(horaFija) {
  const clientes = CW.store.get('m_cliente');
  const servicios = CW.store.get('m_servicio');
  document.getElementById('cwModalTitle').textContent = 'NUEVA CITA';
  document.getElementById('cwModalFields').innerHTML = `
    <div class="cw-mfield"><label>Hora</label>
      <input type="text" name="hora" value="${horaFija || HORAS[0]}" ${horaFija ? 'readonly' : ''} required></div>
    <div class="cw-mfield"><label>Cliente</label>
      <select name="id_cliente" required>${clientes.map(c=>`<option value="${c.id_cliente}">${c.nombre}</option>`).join('')}</select></div>
    <div class="cw-mfield"><label>Servicio</label>
      <select name="id_servicio" required>${servicios.map(s=>`<option value="${s.id_servicio}">${s.nombre} - ${fmtMoney(s.precio)}</option>`).join('')}</select></div>
  `;
  cwModalSubmit = (data) => {
    const nueva = {
      id_cita: CW.store.nextId('m_cita','id_cita'),
      hora: data.hora, id_cliente: Number(data.id_cliente),
      id_servicio: Number(data.id_servicio), estado: 'CONFIRMADA'
    };
    CW.store.insert('m_cita', nueva);
    cwSendWhatsAppReminder(cliente(nueva.id_cliente), nueva, servicio(nueva.id_servicio));
    renderAll();
  };
  modalBg().classList.add('is-open');
}

/* ============================================================
   NAV (secciones)
   ============================================================ */
const TITLES = {
  dashboard: ['Panel de control', ''],
  citas: ['Citas', 'Todas las citas agendadas'],
  clientes: ['Maestra de clientes', 'Gestiona tus clientes registrados'],
  inventario: ['Maestra de inventario', 'Controla tu stock de productos'],
  galeria: ['Galería', 'Fotos del trabajo realizado']
};
function goSection(name) {
  document.querySelectorAll('[data-nav]').forEach(n => n.classList.toggle('is-active', n.dataset.nav === name));
  document.querySelectorAll('[data-section]').forEach(s => s.hidden = s.dataset.section !== name);
  document.getElementById('cwSectionTitle').textContent = TITLES[name][0];
  document.getElementById('cwSectionSub').innerHTML = name === 'dashboard'
    ? 'Hoy · <span id="cwToday"></span>' : TITLES[name][1];
  if (name === 'dashboard') setToday();
}
function setToday() {
  const el = document.getElementById('cwToday');
  if (el) el.textContent = new Date().toLocaleDateString('es-CO', {weekday:'long', day:'numeric', month:'long'}).toUpperCase();
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* guard de sesión: si no hay login, mandar a login.html */
  if (!sessionStorage.getItem('cw_auth') && !location.pathname.endsWith('login.html')) {
    window.location.href = 'login.html';
    return;
  }

  const splash = document.getElementById('cwSplash');
  if (splash) setTimeout(() => splash.classList.add('is-hidden'), 1600);

  setToday();
  renderAll();

  document.querySelectorAll('[data-nav]').forEach(n => {
    n.addEventListener('click', () => goSection(n.dataset.nav));
  });

  document.getElementById('cwLogout').addEventListener('click', () => {
    sessionStorage.removeItem('cw_auth');
    window.location.href = 'login.html';
  });

  document.getElementById('cwBtnNuevaCita').addEventListener('click', () => openModalCita());
  document.getElementById('cwBtnAddCita2').addEventListener('click', (e) => { e.preventDefault(); openModalCita(); });
  document.getElementById('cwBtnAddServicio').addEventListener('click', (e) => { e.preventDefault(); openModalServicio(); });
  document.getElementById('cwBtnAddCliente').addEventListener('click', (e) => { e.preventDefault(); openModalCliente(); });
  document.getElementById('cwBtnAddProducto').addEventListener('click', (e) => { e.preventDefault(); openModalProducto(); });

  document.getElementById('cwModalCancel').addEventListener('click', closeModal);
  modalBg().addEventListener('click', (e) => { if (e.target === modalBg()) closeModal(); });

  document.getElementById('cwModalForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    if (cwModalSubmit) cwModalSubmit(data);
    closeModal();
  });

  /* galería: subir fotos como base64 en localStorage */
  const galInput = document.getElementById('cwGalInput');
  if (galInput) {
    galInput.addEventListener('change', () => {
      const fotos = CW.store.get('m_galeria');
      [...galInput.files].forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          fotos.push({data: reader.result, nombre: file.name.toUpperCase()});
          CW.store.set('m_galeria', fotos);
          renderGaleria();
        };
        reader.readAsDataURL(file);
      });
    });
  }

  /* mayúscula global para cualquier input futuro fuera del modal */
  document.body.addEventListener('input', (e) => {
    if (e.target.matches('input[type="text"]') && !e.target.closest('#cwModalFields')) {
      const el = e.target, pos = el.selectionStart;
      el.value = el.value.toUpperCase();
      el.setSelectionRange(pos, pos);
    }
  });
});
