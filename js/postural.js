/* ============================================================
   MOBILITÀ & POSTURA — routine correttiva quotidiana
   Vive dentro la tab Allena: una card compatta in cima (il blocco
   che tocca ADESSO, con un solo check) e il blocco completo in fondo.
   Non registra sessioni: il tracking è un check per blocco al giorno.
   ============================================================ */

const POSTURAL_BLOCKS = [
  { cat: "morning",       emoji: "🌅", label: "Mattina",     sub: "A casa, 5 minuti appena sveglio" },
  { cat: "pre-workout",   emoji: "🔥", label: "Pre-workout",  sub: "Parte del riscaldamento, in palestra" },
  { cat: "post-workout",  emoji: "🧊", label: "Post-workout", sub: "Defaticamento, stretching più profondo" },
  { cat: "gym-accessory", emoji: "🗨️", label: "Con Denis",    sub: "Accessori da inserire in scheda — da concordare" }
];
const posturalBlock = (cat) => POSTURAL_BLOCKS.find(b => b.cat === cat);
// Gli accessori NON entrano nel check giornaliero: sono materiale da portare
// in palestra, non una routine da fare da soli.
const POSTURAL_TRACKED = ["morning", "pre-workout", "post-workout"];

const posturalOf = (cat) => POSTURAL.filter(e => e.categoria === cat);

/* ---------- STATO ---------- */
function posturalState() {
  if (!state.postural) state.postural = { done: {}, dismissed: [] };
  if (!state.postural.done) state.postural.done = {};
  if (!state.postural.dismissed) state.postural.dismissed = [];
  return state.postural;
}
function posturalDone(cat, date) {
  const d = (posturalState().done[date || todayStr()]) || [];
  return d.indexOf(cat) >= 0;
}
function posturalToggle(cat) {
  const ps = posturalState();
  const t = todayStr();
  const list = ps.done[t] || (ps.done[t] = []);
  const i = list.indexOf(cat);
  if (i >= 0) list.splice(i, 1); else list.push(cat);
  if (!list.length) delete ps.done[t];
  saveState(state);
  const b = posturalBlock(cat);
  toast(i >= 0 ? `${b.emoji} ${b.label} annullato` : `✅ ${b.label} fatto!`);
  renderPosturalHint();
  renderPostural();
  if (typeof renderBadges === "function") renderBadges();
}

// Streak: giorni consecutivi col blocco spuntato. Oggi non ancora fatto non
// spezza la serie (la giornata è in corso), ieri sì.
function posturalStreak(cat) {
  const d = new Date();
  if (!posturalDone(cat, localDate(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (posturalDone(cat, localDate(d)) && n < 400) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// Blocco da proporre in cima alla tab Allena:
// mattina finché non è fatta (fino alle 12), poi il pre se oggi si allena,
// il post se la sessione di oggi è già registrata.
function posturalSuggested() {
  const t = todayStr();
  const sc = (state.schedule || {})[t];
  const trained = (state.sessions || []).some(s => s.date === t);
  const h = new Date().getHours();
  if (trained && !posturalDone("post-workout")) return "post-workout";
  if (!posturalDone("morning") && h < 12) return "morning";
  if (sc && !trained && !posturalDone("pre-workout")) return "pre-workout";
  if (!posturalDone("morning")) return "morning";
  if (!posturalDone("post-workout") && trained) return "post-workout";
  return POSTURAL_TRACKED.find(c => !posturalDone(c)) || "morning";
}

/* ---------- CARD COMPATTA (in cima ad Allena) ---------- */
function renderPosturalHint() {
  const host = $("postural-hint");
  if (!host) return;
  const cat = posturalSuggested();
  const b = posturalBlock(cat);
  const done = posturalDone(cat);
  const n = posturalOf(cat).length;
  const streak = posturalStreak(cat);
  host.innerHTML = `
    <div class="post-hint ${done ? 'done' : ''}">
      <div class="post-hint-txt" onclick="goPostural('${cat}')">
        <div class="post-hint-lbl">🧘 Mobilità &amp; Postura${streak > 1 ? ` · 🔥 ${streak}` : ""}</div>
        <div class="post-hint-title">${b.emoji} ${b.label}</div>
        <div class="post-hint-sub">${n} esercizi · ${b.sub}</div>
      </div>
      <button class="post-check ${done ? 'on' : ''}" onclick="posturalToggle('${cat}')"
              aria-label="${done ? 'Annulla' : 'Segna come fatto'}">${done ? "✓" : "Fatto"}</button>
    </div>`;
}

// Dal tocco sulla card in cima: scorre al blocco completo e lo filtra
function goPostural(cat) {
  posturalFilter = cat;
  renderPostural();
  const el = $("postural-block");
  if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- BLOCCO COMPLETO (in fondo ad Allena) ----------
   Fisarmonica: di default si vedono solo le righe dei blocchi.
   Gli esercizi compaiono solo toccando la riga (uno alla volta). */
let posturalFilter = null;      // blocco aperto ("morning"… ) oppure null
let posturalOpen = {};          // card esercizio espanse (id → true)
let posturalRemOpen = false;    // promemoria giornalieri aperti
let posturalTimer = null;       // { id, left, handle }

// Apre un blocco e chiude gli altri (ri-toccando si richiude tutto)
function setPosturalFilter(cat) {
  posturalFilter = (posturalFilter === cat) ? null : cat;
  renderPostural();
}
function togglePosturalReminders() { posturalRemOpen = !posturalRemOpen; renderPostural(); }

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

  // Le 3 righe della routine quotidiana: check + streak sulla riga stessa
  const rows = POSTURAL_BLOCKS.filter(b => POSTURAL_TRACKED.indexOf(b.cat) >= 0).map(b => {
    const open = posturalFilter === b.cat;
    const done = posturalDone(b.cat);
    const streak = posturalStreak(b.cat);
    const list = posturalOf(b.cat);
    return `
      <div class="post-row ${open ? 'open' : ''} ${done ? 'done' : ''}">
        <div class="post-row-head" onclick="setPosturalFilter('${b.cat}')">
          <span class="post-row-ico">${b.emoji}</span>
          <div class="post-row-txt">
            <div class="post-row-title">${b.label}${streak > 0 ? ` <span class="post-streak">🔥 ${streak}</span>` : ""}</div>
            <div class="post-row-sub">${list.length} esercizi · ${b.sub}</div>
          </div>
          <button class="post-check ${done ? 'on' : ''}" onclick="event.stopPropagation();posturalToggle('${b.cat}')"
                  aria-label="${done ? 'Annulla' : 'Segna come fatto'}">${done ? "✓" : "Fatto"}</button>
          <span class="ex-chevron">▾</span>
        </div>
        <div class="post-row-body">${open ? list.map(ex => posturalCardHTML(ex, false)).join("") : ""}</div>
      </div>`;
  }).join("");

  // Accessori da concordare con Denis: riga a parte, fuori dal check giornaliero
  const denisOpen = posturalFilter === "gym-accessory";
  const denis = `
    <div class="post-row post-row-denis ${denisOpen ? 'open' : ''}">
      <div class="post-row-head" onclick="setPosturalFilter('gym-accessory')">
        <span class="post-row-ico">🗨️</span>
        <div class="post-row-txt">
          <div class="post-row-title">Da parlare con Denis</div>
          <div class="post-row-sub">${posturalOf("gym-accessory").length} accessori da mettere in scheda — non è routine da fare da solo</div>
        </div>
        <span class="ex-chevron">▾</span>
      </div>
      <div class="post-row-body">${denisOpen ? posturalOf("gym-accessory").map(ex => posturalCardHTML(ex, true)).join("") : ""}</div>
    </div>`;

  // Promemoria giornalieri: post-it compatti, visibili solo al tocco
  const notes = POSTURAL_REMINDERS.map(r => `
    <div class="post-it">
      <div class="post-it-title">${r.icona} ${r.titolo}</div>
      <div class="post-it-txt">${r.testo}</div>
    </div>`).join("");
  const rem = `
    <div class="post-row post-row-rem ${posturalRemOpen ? 'open' : ''}">
      <div class="post-row-head" onclick="togglePosturalReminders()">
        <span class="post-row-ico">💡</span>
        <div class="post-row-txt">
          <div class="post-row-title">Promemoria giornalieri</div>
          <div class="post-row-sub">${POSTURAL_REMINDERS.length} abitudini posturali fuori dalla palestra</div>
        </div>
        <span class="ex-chevron">▾</span>
      </div>
      <div class="post-row-body"><div class="post-it-grid">${posturalRemOpen ? notes : ""}</div></div>
    </div>`;

  host.innerHTML = rows + denis + rem;
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
