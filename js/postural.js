/* ============================================================
   MOBILITÀ & POSTURA — routine correttiva quotidiana
   Sezione di sola consultazione dentro la tab Allena: quattro blocchi
   (risveglio, pre, post + accessori da concordare con Denis) che si
   aprono al tocco. Nessun tracciamento: è un promemoria, non una scheda.
   ============================================================ */

const POSTURAL_BLOCKS = [
  { cat: "morning",       emoji: "🌅", label: "Risveglio",    sub: "A casa, 5 minuti appena sveglio" },
  { cat: "pre-workout",   emoji: "🔥", label: "Pre-workout",  sub: "Parte del riscaldamento, in palestra" },
  { cat: "post-workout",  emoji: "🧊", label: "Post-workout", sub: "Defaticamento, stretching più profondo" },
  { cat: "gym-accessory", emoji: "🗨️", label: "Con Denis",    sub: "Accessori da inserire in scheda — da concordare" }
];
const posturalBlock = (cat) => POSTURAL_BLOCKS.find(b => b.cat === cat);
// I tre blocchi della routine quotidiana (gli accessori di Denis stanno a parte)
const POSTURAL_TRACKED = ["morning", "pre-workout", "post-workout"];

const posturalOf = (cat) => POSTURAL.filter(e => e.categoria === cat);

/* ---------- BLOCCO COMPLETO (in fondo ad Allena) ----------
   Fisarmonica: di default si vedono solo le righe dei blocchi.
   Gli esercizi compaiono solo toccando la riga (uno alla volta). */
let posturalFilter = null;      // blocco aperto ("morning"… ) oppure null
let posturalOpen = {};          // card esercizio espanse (id → true)
let posturalSectionOpen = true; // intera sezione aperta/chiusa
let posturalTimer = null;       // { id, left, handle }

// Apre un blocco e chiude gli altri (ri-toccando si richiude tutto)
function setPosturalFilter(cat) {
  posturalFilter = (posturalFilter === cat) ? null : cat;
  renderPostural();
}
// Contrae/espande tutta la sezione (stesso comportamento di Esercizi)
function togglePosturalSection() {
  posturalSectionOpen = !posturalSectionOpen;
  applyPosturalSection();
}
function applyPosturalSection() {
  const box = $("postural-block"), lbl = $("post-section-lbl");
  if (!box || !lbl) return;
  box.style.display = posturalSectionOpen ? "" : "none";
  lbl.classList.toggle("closed", !posturalSectionOpen);
}

function togglePosturalCard(id) {
  posturalOpen[id] = !posturalOpen[id];
  renderPostural();
}

// Card di un singolo esercizio (a sua volta espandibile)
function posturalCardHTML(ex, isDenis) {
  const open = !!posturalOpen[ex.id];
  const running = posturalTimer && posturalTimer.id === ex.id;
  return `
    <div class="ex-card post-card ${open ? 'open' : ''}">
      <div class="ex-header" onclick="togglePosturalCard('${ex.id}')">
        <div class="ex-num" style="background:${isDenis ? '#FF8A5B' : '#7C3AED'}">${isDenis ? "🗨️" : "🧘"}</div>
        <div class="ex-title-group">
          <div class="ex-name">${ex.nome}${ex.opzionale ? ' <span class="post-opt">opzionale</span>' : ''}</div>
          <div class="ex-muscle">${ex.serieRip} · ${ex.lato === "per-lato" ? "per lato" : "bilaterale"}${ex.attrezzatura !== "nessuna" ? " · " + ex.attrezzatura : ""}</div>
        </div>
        <span class="ex-chevron">▾</span>
      </div>
      <div class="ex-body">
        <div class="post-instr">${ex.istruzioni}</div>
        <div class="post-tags">${ex.muscoli.map(m => `<span class="post-tag">${m}</span>`).join("")}</div>
        ${ex.rationale ? `<div class="post-why"><span class="post-why-i">i</span>${ex.rationale}</div>` : ""}
        ${ex.hold ? `<button class="post-timer ${running ? 'on' : ''}" onclick="posturalTimerToggle('${ex.id}',${ex.hold})">
            ${running ? `⏸ ${posturalTimer.left}″` : `⏱ Avvia ${ex.hold}″`}</button>` : ""}
      </div>
    </div>`;
}

function renderPostural() {
  const host = $("postural-block");
  if (!host) return;

  // I tre blocchi della routine quotidiana
  const rows = POSTURAL_BLOCKS.filter(b => POSTURAL_TRACKED.indexOf(b.cat) >= 0).map(b => {
    const open = posturalFilter === b.cat;
    const list = posturalOf(b.cat);
    return `
      <div class="post-row ${open ? 'open' : ''}">
        <div class="post-row-head" onclick="setPosturalFilter('${b.cat}')">
          <span class="post-row-ico">${b.emoji}</span>
          <div class="post-row-txt">
            <div class="post-row-title">${b.label}</div>
            <div class="post-row-sub">${list.length} esercizi · ${b.sub}</div>
          </div>
          <span class="sec-arrow">▾</span>
        </div>
        <div class="post-row-body">${open ? list.map(ex => posturalCardHTML(ex, false)).join("") : ""}</div>
      </div>`;
  }).join("");

  // Accessori da concordare con Denis: riga a parte, non è routine da fare da soli
  const denisOpen = posturalFilter === "gym-accessory";
  const denis = `
    <div class="post-row post-row-denis ${denisOpen ? 'open' : ''}">
      <div class="post-row-head" onclick="setPosturalFilter('gym-accessory')">
        <span class="post-row-ico">🗨️</span>
        <div class="post-row-txt">
          <div class="post-row-title">Da parlare con Denis</div>
          <div class="post-row-sub">${posturalOf("gym-accessory").length} accessori da mettere in scheda — non è routine da fare da solo</div>
        </div>
        <span class="sec-arrow">▾</span>
      </div>
      <div class="post-row-body">${denisOpen ? posturalOf("gym-accessory").map(ex => posturalCardHTML(ex, true)).join("") : ""}</div>
    </div>`;

  host.innerHTML = rows + denis;
  applyPosturalSection();
}

/* ---------- TIMER per gli hold (stesso schema del guidato) ---------- */
function posturalTimerToggle(id, sec) {
  if (posturalTimer) {
    clearInterval(posturalTimer.handle);
    const was = posturalTimer.id;
    posturalTimer = null;
    if (was === id) { renderPostural(); return; }
  }
  posturalTimer = { id: id, left: sec, handle: null };
  posturalTimer.handle = setInterval(() => {
    posturalTimer.left--;
    if (posturalTimer.left <= 0) {
      clearInterval(posturalTimer.handle);
      posturalTimer = null;
      toast("⏱ Tempo!");
    }
    renderPostural();
  }, 1000);
  renderPostural();
}
