/* ── CONFIG ───────────────────────────────────────────────── */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNDjec_ijjDreX1B_8SSQl5zo0vLOsrO9NAzNfL5SzqlFVhQfSR2beimE7Wb6rA0GINQ/exec";

/* ── STATE ────────────────────────────────────────────────── */
let quien         = "";
let tomaEsperada  = "";
let materna       = 0;
let formula       = 0;
let historial     = [];

/* ── INIT ─────────────────────────────────────────────────── */
function init() {
  setFechaHeader();
  setHoraReal();
  autoSelectToma(new Date());
  renderHistorial();
}

function setFechaHeader() {
  const now   = new Date();
  const dias  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio",
                 "agosto","septiembre","octubre","noviembre","diciembre"];
  document.getElementById("fecha-header").textContent =
    `${dias[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]}`;
}

function setHoraReal() {
  const now = new Date();
  const h   = String(now.getHours()).padStart(2, "0");
  const m   = String(now.getMinutes()).padStart(2, "0");
  document.getElementById("hora-real").value = `${h}:${m}`;
}

function autoSelectToma(now) {
  const tomas = ["06:00","09:00","12:00","15:00","18:00","21:00","00:00","03:00"];
  const horas = [6, 9, 12, 15, 18, 21, 0, 3];
  const h     = now.getHours();

  let closest = 0;
  let minDiff = Infinity;
  horas.forEach((th, i) => {
    let diff = Math.abs(h - th);
    if (diff > 12) diff = 24 - diff;
    if (diff < minDiff) { minDiff = diff; closest = i; }
  });

  const pills = document.querySelectorAll(".toma-pill");
  pills[closest].classList.add("selected");
  tomaEsperada = tomas[closest];
}

/* ── SELECTORS ────────────────────────────────────────────── */
function selectWho(name) {
  quien = name;
  document.getElementById("btn-bryan").className =
    "who-btn" + (name === "Bryan" ? " bryan" : "");
  document.getElementById("btn-lucia").className =
    "who-btn" + (name === "Lucía" ? " lucia" : "");
}

function selectToma(el, hora) {
  document.querySelectorAll(".toma-pill").forEach(p => p.classList.remove("selected"));
  el.classList.add("selected");
  tomaEsperada = hora;
}

function changeOz(tipo, delta) {
  if (tipo === "materna") {
    materna = Math.max(0, Math.round((materna + delta) * 10) / 10);
    document.getElementById("val-materna").textContent =
      materna % 1 === 0 ? materna : materna.toFixed(1);
  } else {
    formula = Math.max(0, Math.round((formula + delta) * 10) / 10);
    document.getElementById("val-formula").textContent =
      formula % 1 === 0 ? formula : formula.toFixed(1);
  }
}

/* ── HELPERS ──────────────────────────────────────────────── */
function getFecha() {
  const now = new Date();
  return `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;
}

function showToast(msg, isError = false) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className   = "toast show" + (isError ? " error" : "");
  setTimeout(() => { t.className = "toast"; }, 3000);
}

/* ── GUARDAR ──────────────────────────────────────────────── */
function guardarToma() {
  if (!quien)        { showToast("Selecciona quién da la toma", true); return; }
  if (!tomaEsperada) { showToast("Selecciona la hora esperada", true); return; }

  const horaReal = document.getElementById("hora-real").value || "--:--";
  const notas    = document.getElementById("notas").value.trim();
  const btn      = document.getElementById("submit-btn");

  btn.disabled    = true;
  btn.textContent = "Guardando...";

  const payload = {
    fecha:        getFecha(),
    horaEsperada: tomaEsperada,
    horaReal:     horaReal,
    quien:        quien,
    materna:      materna,
    formula:      formula,
    notas:        notas
  };

  fetch(SCRIPT_URL, {
    method:  "POST",
    mode:    "no-cors",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload)
  })
  .then(() => {
    showToast("✓ Toma guardada en Google Sheets");
    historial.unshift(payload);
    renderHistorial();
    resetForm();
  })
  .catch(() => {
    showToast("Error al guardar. Revisa tu conexión.", true);
  })
  .finally(() => {
    btn.disabled    = false;
    btn.textContent = "Guardar toma";
  });
}

/* ── RESET ────────────────────────────────────────────────── */
function resetForm() {
  quien   = "";
  materna = 0;
  formula = 0;
  document.getElementById("btn-bryan").className    = "who-btn";
  document.getElementById("btn-lucia").className    = "who-btn";
  document.getElementById("val-materna").textContent = "0";
  document.getElementById("val-formula").textContent = "0";
  document.getElementById("notas").value            = "";
  setHoraReal();
}

/* ── HISTORIAL ────────────────────────────────────────────── */
function renderHistorial() {
  const div = document.getElementById("historial");

  if (historial.length === 0) {
    div.innerHTML = `
      <p style="font-size:13px;color:#8E8E93;text-align:center;padding:12px 0;">
        Aún no hay tomas registradas hoy
      </p>`;
    return;
  }

  div.innerHTML = historial.map(t => {
    const esBryan   = t.quien === "Bryan";
    const avatarBg  = esBryan ? "#007AFF" : "#FF2D55";
    const initials  = esBryan ? "BR" : "LU";
    const ozParts   = [];
    if (t.materna > 0) ozParts.push(`${t.materna} oz materna`);
    if (t.formula > 0) ozParts.push(`${t.formula} oz fórmula`);
    const ozText = ozParts.length ? ozParts.join(" · ") : "Sin cantidad registrada";

    return `
      <div class="history-item">
        <div class="history-avatar" style="background:${avatarBg}">${initials}</div>
        <div class="history-info">
          <div class="history-hora">Esperada ${t.horaEsperada} · Real ${t.horaReal}</div>
          <div class="history-detail">${ozText}</div>
          ${t.notas
            ? `<div class="history-detail" style="font-style:italic;margin-top:2px;">${t.notas}</div>`
            : ""}
        </div>
      </div>`;
  }).join("");
}

/* ── START ────────────────────────────────────────────────── */
init();
