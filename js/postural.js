/* ============================================================
   MOBILITÀ & POSTURA — tab dedicata (bottom nav)
   Tre routine quotidiane (risveglio / pre / post) + gli accessori da
   concordare con Denis. Due modi di usarla:
     · consultazione — blocchi che si aprono, card esercizio con istruzioni
     · routine guidata — player a schermo intero, un esercizio per volta,
       con timer per gli hold (stessa grammatica dell'allenamento guidato)
   Non registra nulla: è un promemoria, non una scheda.
   ============================================================ */

const POSTURAL_BLOCKS = [
  { cat: "morning",       emoji: "🌅", label: "Risveglio",    sub: "A casa, appena sveglio",            min: 5, color: "#F59E0B" },
  { cat: "pre-workout",   emoji: "🔥", label: "Pre-workout",  sub: "Nel riscaldamento, prima dei pesi", min: 4, color: "#FF2D95" },
  { cat: "post-workout",  emoji: "🧊", label: "Post-workout", sub: "Defaticamento a fine seduta",       min: 8, color: "#5B8DEF" },
  { cat: "gym-accessory", emoji: "🗨️", label: "Con Denis",    sub: "Accessori da mettere in scheda",    min: 0, color: "#FF8A5B" }
];
const posturalBlock = (cat) => POSTURAL_BLOCKS.find(b => b.cat === cat);
// I tre blocchi della routine quotidiana (gli accessori di Denis stanno a parte)
const POSTURAL_TRACKED = ["morning", "pre-workout", "post-workout"];

const posturalOf = (cat) => POSTURAL.filter(e => e.categoria === cat);

// Il senso della routine: il meccanismo, non lo slogan (in fondo alla tab)
const POSTURAL_WHY = [
  { ico: "🔒", t: "Catena anteriore corta", d: "Pettorali, flessori dell'anca e femorali accorciati tirano spalle e bacino in avanti. Vanno allungati, ma lontano dai carichi: prima dei pesi solo dinamico." },
  { ico: "😴", t: "Catena posteriore addormentata", d: "Trapezio medio/inferiore, romboidi e flessori profondi del collo non si attivano da soli. Allungare il davanti senza svegliare il dietro non tiene." },
  { ico: "🔁", t: "Frequenza prima di intensità", d: "Cinque minuti tutti i giorni spostano l'ago più di mezz'ora una volta a settimana. Per questo il risveglio è corto." }
];

/* ---------- SUGGERIMENTO CONTESTUALE ---------- */
// Quale routine ha senso adesso: dopo l'allenamento il defaticamento,
// nei giorni di palestra il pre, altrimenti il risveglio.
function posturalSuggested() {
  const t = todayStr();
  if ((state.sessions || []).some(s => s.date === t)) return "post-workout";
  if ((state.schedule || {})[t]) return "pre-workout";
  return new Date().getHours() < 12 ? "morning" : "post-workout";
}
function posturalWhenLabel(cat) {
  const t = todayStr();
  if (cat === "post-workout" && (state.sessions || []).some(s => s.date === t)) return "Hai appena finito di allenarti";
  if (cat === "pre-workout" && (state.schedule || {})[t]) return "Oggi si va in palestra";
  if (cat === "morning") return "Buongiorno";
  return "Consigliata adesso";
}


/* ---------- IMMAGINI ----------
   Il disegno dell'esercizio è dichiarato in `img` (nome del file in
   assets/gifs/, .gif del dataset o .png generato): niente tentativi al buio,
   niente 404. Chi non ce l'ha non mostra nulla e resta l'icona 🧘.
   Se il file venisse rimosso, onerror toglie l'immagine e scopre l'icona. */
function posturalImgHTML(ex, cls) {
  if (!ex.img) return "";
  return `<img class="${cls}" alt="" src="assets/gifs/${ex.img}"
    onerror="posturalImgErr(this)">`;
}
function posturalImgErr(img) {
  const ph = img.parentNode && img.parentNode.querySelector(".pp-ico");
  if (ph) ph.style.display = "";
  img.parentNode && img.parentNode.removeChild(img);
}

/* ---------- VISTA ---------- */
let posturalFilter = null;      // blocco aperto ("morning"…) oppure null
let posturalOpen = {};          // card esercizio espanse (id → true)
let posturalTimer = null;       // timer nelle card di consultazione

// Apre un blocco e chiude gli altri (ri-toccando si richiude)
function setPosturalFilter(cat) {
  posturalFilter = (posturalFilter === cat) ? null : cat;
  renderPostural();
}
function togglePosturalCard(id) {
  posturalOpen[id] = !posturalOpen[id];
  renderPostural();
}

// Card di un singolo esercizio (consultazione)
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
        <span class="sec-arrow">▾</span>
      </div>
      <div class="ex-body">
        <div class="post-media">${posturalImgHTML(ex, "post-gif")}</div>
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

  // HERO: cosa ha senso fare adesso
  const sug = posturalSuggested();
  const sb = posturalBlock(sug);
  const sList = posturalOf(sug);
  const hero = `
    <div class="post-hero" style="background:linear-gradient(150deg, ${sb.color} 0%, #2A1B4A 95%);box-shadow:0 10px 40px -8px ${sb.color}55, inset 0 1px 0 rgba(255,255,255,.18)">
      <div class="post-hero-lbl">${posturalWhenLabel(sug)}</div>
      <div class="post-hero-title">${sb.emoji} ${sb.label}</div>
      <div class="post-hero-sub">${sList.length} esercizi · circa ${sb.min} minuti · ${sb.sub.toLowerCase()}</div>
      <button class="post-hero-go" onclick="startPosturalRoutine('${sug}')">▶︎ Avvia la routine</button>
    </div>`;

  // I tre blocchi: riga con "play" + apertura degli esercizi
  const rows = POSTURAL_BLOCKS.filter(b => POSTURAL_TRACKED.indexOf(b.cat) >= 0).map(b => {
    const open = posturalFilter === b.cat;
    const list = posturalOf(b.cat);
    return `
      <div class="post-row ${open ? 'open' : ''}">
        <div class="post-row-head" onclick="setPosturalFilter('${b.cat}')">
          <span class="post-row-ico" style="background:${b.color}22;border-color:${b.color}66">${b.emoji}</span>
          <div class="post-row-txt">
            <div class="post-row-title">${b.label}</div>
            <div class="post-row-sub">${list.length} esercizi · ~${b.min}′ · ${b.sub}</div>
          </div>
          <button class="post-play" onclick="event.stopPropagation();startPosturalRoutine('${b.cat}')" aria-label="Avvia ${b.label}">▶︎</button>
          <span class="sec-arrow">▾</span>
        </div>
        <div class="post-row-body">${open ? list.map(ex => posturalCardHTML(ex, false)).join("") : ""}</div>
      </div>`;
  }).join("");

  // Accessori da concordare con Denis: non è routine da fare da soli
  const denisOpen = posturalFilter === "gym-accessory";
  const denis = `
    <div class="post-row post-row-denis ${denisOpen ? 'open' : ''}">
      <div class="post-row-head" onclick="setPosturalFilter('gym-accessory')">
        <span class="post-row-ico" style="background:rgba(255,138,91,.14);border-color:rgba(255,138,91,.5)">🗨️</span>
        <div class="post-row-txt">
          <div class="post-row-title">Da parlare con Denis</div>
          <div class="post-row-sub">${posturalOf("gym-accessory").length} accessori da mettere in scheda — sotto carico, non da soli</div>
        </div>
        <span class="sec-arrow">▾</span>
      </div>
      <div class="post-row-body">${denisOpen ? posturalOf("gym-accessory").map(ex => posturalCardHTML(ex, true)).join("") : ""}</div>
    </div>`;

  // Perché questa routine: il meccanismo in tre punti
  const why = `
    <div class="section-label">📌 Perché questa routine</div>
    <div class="goal-card post-why-card">
      ${POSTURAL_WHY.map(w => `
        <div class="post-why-row">
          <span class="post-why-ico">${w.ico}</span>
          <div><div class="post-why-t">${w.t}</div><div class="post-why-d">${w.d}</div></div>
        </div>`).join("")}
    </div>`;

  host.innerHTML = hero
    + `<div class="section-label">🗂 Le routine</div>` + rows + denis
    + why;
}

/* ---------- TIMER nelle card di consultazione ---------- */
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

/* ============================================================
   PLAYER — routine a schermo intero, un esercizio per volta
   ============================================================ */
let pplay = null;   // { cat, i, left, handle, t0 }

function startPosturalRoutine(cat) {
  const list = posturalOf(cat);
  if (!list.length) return;
  pplay = { cat: cat, i: 0, left: 0, handle: null, t0: Date.now() };
  $("postural-player").classList.add("show");
  document.body.style.overflow = "hidden";
  renderPosturalPlayer();
}

function closePosturalRoutine() {
  pplayStopTimer();
  pplay = null;
  $("postural-player").classList.remove("show");
  document.body.style.overflow = "";
}

function pplayStopTimer() {
  if (pplay && pplay.handle) { clearInterval(pplay.handle); pplay.handle = null; pplay.left = 0; }
}

// Avanti/indietro di un esercizio (oltre l'ultimo → schermata finale)
function pplayStep(d) {
  if (!pplay) return;
  pplayStopTimer();
  pplay.i = Math.max(0, pplay.i + d);
  renderPosturalPlayer();
}

// Timer dell'hold dentro il player
function pplayTimer(sec) {
  if (!pplay) return;
  if (pplay.handle) { pplayStopTimer(); renderPosturalPlayer(); return; }
  pplay.left = sec;
  pplay.handle = setInterval(() => {
    pplay.left--;
    if (pplay.left <= 0) { pplayStopTimer(); toast("⏱ Tempo!"); }
    renderPosturalPlayer();
  }, 1000);
  renderPosturalPlayer();
}

function renderPosturalPlayer() {
  const host = $("postural-player");
  if (!host || !pplay) return;
  const b = posturalBlock(pplay.cat);
  const list = posturalOf(pplay.cat);

  // Schermata finale
  if (pplay.i >= list.length) {
    const mins = Math.max(1, Math.round((Date.now() - pplay.t0) / 60000));
    host.innerHTML = `
      <div class="g-top"><button class="g-close" onclick="closePosturalRoutine()">✕</button></div>
      <div class="pp-end">
        <div class="pp-end-ico">${b.emoji}</div>
        <div class="pp-end-t">${b.label} completata</div>
        <div class="pp-end-d">${list.length} esercizi in ${mins} ${mins === 1 ? "minuto" : "minuti"}.<br>Qui conta la costanza, non la durata: a domani.</div>
        <button class="g-finish" onclick="closePosturalRoutine()">Chiudi</button>
      </div>`;
    return;
  }

  const ex = list[pplay.i];
  const pct = Math.round((pplay.i / list.length) * 100);
  const running = !!pplay.handle;
  const last = pplay.i === list.length - 1;

  host.innerHTML = `
    <div class="g-top">
      <button class="g-close" onclick="closePosturalRoutine()" title="Chiudi">✕</button>
      <button class="g-back" onclick="pplayStep(-1)" ${pplay.i ? "" : 'style="visibility:hidden"'}>‹</button>
      <div class="g-prog">${pplay.i + 1}/${list.length} · ${b.label}</div>
    </div>
    <div class="g-bar"><div class="g-bar-fill" style="width:${pct}%"></div></div>
    <div class="g-body pp-body">
      <div class="pp-media">
        <div class="pp-ico" style="background:${b.color}22;border-color:${b.color}66;${ex.img ? "display:none" : ""}">🧘</div>
        ${posturalImgHTML(ex, "pp-gif")}
      </div>
      <div class="pp-name">${ex.nome}</div>
      <div class="pp-meta">${ex.serieRip} · ${ex.lato === "per-lato" ? "per lato" : "bilaterale"}${ex.attrezzatura !== "nessuna" ? " · " + ex.attrezzatura : ""}</div>
      <div class="pp-instr">${ex.istruzioni}</div>
      ${ex.hold ? `<button class="pp-timer ${running ? 'on' : ''}" onclick="pplayTimer(${ex.hold})">
          ${running ? `<span class="pp-timer-n">${pplay.left}″</span><span class="pp-timer-h">tocca per fermare</span>`
                    : `⏱ Tieni ${ex.hold}″`}</button>` : ""}
      ${ex.rationale ? `<div class="g-cues pp-why"><div class="g-cues-h">Perché</div><div class="pp-why-d">${ex.rationale}</div></div>` : ""}
      <div class="pp-tags">${ex.muscoli.map(m => `<span class="post-tag">${m}</span>`).join("")}</div>
    </div>
    <div class="pp-actions">
      <button class="g-skip" onclick="pplayStep(1)">Salta</button>
      <button class="g-done pp-next" onclick="pplayStep(1)">${last ? "Finisci ✓" : "Fatto ›"}</button>
    </div>`;
}
