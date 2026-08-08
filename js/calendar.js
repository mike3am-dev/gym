/* ============================================================
   VISTA CALENDARIO
   ============================================================ */
function renderCalendar() {
  const year = calRef.getFullYear(), month = calRef.getMonth();
  const monthName = calRef.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  $("cal-month").textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // lun=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dows = ["L", "M", "M", "G", "V", "S", "D"];

  let html = dows.map(d => `<div class="cal-dow">${d}</div>`).join("");
  for (let i = 0; i < startDay; i++) html += `<div class="cal-cell empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const sched = state.schedule[ds];
    const isToday = ds === todayStr();
    const w = sched ? getWorkout(sched.workoutId) : null;
    // fatto anche SENZA programmazione: sessioni salvate e sedute PT contano
    const sess = state.sessions.find(x => x.date === ds);
    const ptDone = (state.ptLifts || []).some(l => l.date === ds);
    let dot = "";
    if (w) {
      dot = `<span class="cal-dot ${sched.done ? 'done' : ''}" style="background:${sched.pt ? '#A855F7' : w.color}" title="${w.name}${sched.done ? ' · fatto' : ''}">${sched.pt ? '🧑‍🏫' : w.emoji}</span>`;
    } else if (sess) {
      const sw = getWorkout(sess.workoutId);
      dot = `<span class="cal-dot done" style="background:${sw ? sw.color : '#9CA3AF'}" title="${sw ? sw.name : 'Allenamento'} · fatto">${sw ? sw.emoji : '🏋️'}</span>`;
    } else if (ptDone) {
      dot = `<span class="cal-dot done" style="background:#A855F7" title="Seduta PT · fatta">🧑‍🏫</span>`;
    }
    html += `
      <div class="cal-cell ${isToday ? 'today' : ''} ${(sched || sess || ptDone) ? 'has' : ''}" onclick="openDay('${ds}')">
        <span class="cal-num">${d}</span>
        <span class="cal-slot">${dot}</span>
      </div>`;
  }
  $("cal-grid").innerHTML = html;

  // prossimi allenamenti programmati
  const limit = new Date(); limit.setDate(limit.getDate() + 21);
  const limitStr = localDate(limit);
  const upcoming = Object.entries(state.schedule)
    .filter(([d]) => d >= todayStr() && d <= limitStr)
    .sort((a, b) => a[0].localeCompare(b[0]));
  const baseIdx = ptNextIndex();
  let ptCounter = 0;
  $("cal-upcoming").innerHTML = upcoming.length
    ? upcoming.map(([d, s]) => {
        const w = getWorkout(s.workoutId);
        const isPT = !!(s.pt || (w && w.pt));
        let nameHtml;
        if (isPT) {
          const moveIdx = (baseIdx + ptCounter) % PT_SEQUENCE.length; ptCounter++;
          nameHtml = `🧑‍🏫 PT — <b class="pt-next">${PT_SHORT[PT_SEQUENCE[moveIdx]]}</b>`;
        } else {
          // guardia: la scheda potrebbe essere stata eliminata dopo la programmazione
          nameHtml = w ? `${w.emoji} ${w.name}` : "🏋️ Allenamento";
        }
        return `<div class="up-row">
          <span class="up-dot" style="background:${isPT ? '#A855F7' : (w ? w.color : '#9CA3AF')}"></span>
          <span class="up-date">${fmtShort(d)}</span>
          <span class="up-name">${nameHtml}${(!isPT && s.note) ? ` <span class="up-note">· ${s.note}</span>` : ''}</span>
          <span class="up-status">${s.done ? '✓ fatto' : 'programmato'}</span>
        </div>`;
      }).join("")
    : `<div class="empty-mini">Nessun allenamento programmato. Tocca un giorno per aggiungerlo.</div>`;
}

function calNav(delta) { calRef.setMonth(calRef.getMonth() + delta); renderCalendar(); }

/* ---------- EXPORT ICS: gli allenamenti nel calendario di iPhone ----------
   Genera un file .ics con tutto il piano futuro (eventi giornata intera).
   È una fotografia: se sposti gli allenamenti, ri-esporti. */
function icsContent() {
  const t = todayStr();
  const entries = Object.entries(state.schedule || {})
    .filter(([d, s]) => d >= t && !s.done)
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (!entries.length) return null;
  const baseIdx = ptNextIndex();
  let ptc = 0;
  // DTSTAMP: obbligatorio da RFC 5545 — senza, iOS/Mail scartano il file
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const events = entries.map(([d, s]) => {
    const w = getWorkout(s.workoutId);
    const isPT = !!(s.pt || (w && w.pt));
    const title = isPT
      ? "🧑‍🏫 PT — " + PT_SHORT[PT_SEQUENCE[(baseIdx + ptc++) % PT_SEQUENCE.length]]
      : (w ? `${w.emoji} ${w.name}` : "Allenamento");
    const dt = d.replace(/-/g, "");
    const nd = new Date(d + "T00:00:00"); nd.setDate(nd.getDate() + 1);
    return [
      "BEGIN:VEVENT",
      "UID:gym-" + d + "@allenamento.app",
      "DTSTAMP:" + stamp,
      "DTSTART;VALUE=DATE:" + dt,
      "DTEND;VALUE=DATE:" + localDate(nd).replace(/-/g, ""),
      "SUMMARY:" + title.replace(/[,;]/g, " "),
      "END:VEVENT"
    ].join("\r\n");
  }).join("\r\n");
  return "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Allenamento//IT\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:Allenamento\r\n" + events + "\r\nEND:VCALENDAR";
}

/* Pubblica l'ICS su Supabase Storage (bucket pubblico "calendars"):
   così il bottone può aprire un vero webcal:// e iOS si ABBONA al
   calendario — niente file, e gli aggiornamenti arrivano da soli. */
async function publishICS() {
  const c = window.__cloud || {};
  const user = c.user && c.user();
  if (!c.sb || !user || window.DEMO_MODE) return false;
  const ics = icsContent();
  if (!ics) return false;
  const { error } = await c.sb.storage.from("calendars")
    .upload(user.id + ".ics", new Blob([ics], { type: "text/calendar" }),
            { upsert: true, contentType: "text/calendar", cacheControl: "60" });
  if (error) { window.__icsErr = error.message || String(error); return false; }
  window.__icsErr = null;
  return true;
}
window.icsOnSync = function () { publishICS().then(() => {}, () => {}); };

async function exportICS() {
  const ics = icsContent();
  if (!ics) { toast("Nessun allenamento in programma da esportare"); return; }
  // 1) via maestra: abbonamento webcal:// (serve il login)
  const c = window.__cloud || {};
  const user = c.user && c.user();
  if (user && !window.DEMO_MODE) {
    toast("📅 Preparo il calendario…");
    const ok = await publishICS();
    if (!ok && window.__icsErr) toast("⚠️ Pubblicazione calendario fallita: " + window.__icsErr);
    if (ok) {
      const host = String(SUPABASE_URL).replace(/^https?:\/\//, "");
      window.location.href = `webcal://${host}/storage/v1/object/public/calendars/${user.id}.ics`;
      return;
    }
  }
  // 2) fallback (sloggati o storage non pronto): foglio di condivisione
  try {
    const file = new File([ics], "allenamenti.ics", { type: "text/calendar" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Allenamenti" });
      return;
    }
  } catch (e) { if (e && e.name === "AbortError") return; /* altrimenti fallback */ }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = "allenamenti.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast("📅 File creato: aprilo per aggiungere gli eventi al calendario");
}

function openDay(ds) {
  const d = new Date(ds + "T00:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  $("modal-title").textContent = d.charAt(0).toUpperCase() + d.slice(1);

  // Se quel giorno è stato fatto un allenamento → mostra i dettagli, non il selettore
  const session = state.sessions.find(s => s.date === ds);
  if (session) {
    $("modal-body").innerHTML = sessionDetailHTML(session);
  } else {
    const sched = state.schedule[ds];
    const isPT = !!(sched && (sched.pt || (getWorkout(sched.workoutId) || {}).pt));
    const curW = sched && !isPT ? getWorkout(sched.workoutId) : null;
    const rot = rotationWorkouts();
    $("modal-body").innerHTML = `
      <p class="modal-q">Che allenamento è?</p>
      <div class="modal-opts ${sched ? 'has-sel' : ''}">
        <button class="modal-opt ${curW ? 'sel' : ''}"
                style="border-color:${curW ? curW.color : 'var(--border)'};color:${curW ? curW.color : 'var(--text)'}" onclick="assignDayKind('${ds}','scheda')">
          <span class="modal-opt-emoji">${curW ? curW.emoji : '🏋️'}</span>
          <span>Scheda${curW ? `<br><small class="modal-opt-sub">${curW.name}</small>` : ''}</span>
        </button>
        <button class="modal-opt ${isPT ? 'sel' : ''}"
                style="border-color:${PT_WORKOUT.color};color:${isPT ? PT_WORKOUT.color : 'var(--text)'}" onclick="assignDayKind('${ds}','pt')">
          <span class="modal-opt-emoji">${PT_WORKOUT.emoji}</span>
          <span>Personal Trainer</span>
        </button>
      </div>
      ${rot.length > 1 ? `<p class="modal-hint">Le schede si alternano da sole: ${rot.map(w => w.name).join(" → ")} → …</p>` : ''}
      ${sched ? `<button class="modal-clear" onclick="clearDay('${ds}')">🗑 Rimuovi programmazione</button>` : ''}`;
  }
  $("modal").classList.add("show");
}

function sessionDetailHTML(s) {
  const w = getWorkout(s.workoutId);
  const sched = state.schedule[s.date];
  const meta = [
    s.duration ? `⏱ ${s.duration} min` : null,
    s.calories ? `🔥 ${s.calories} kcal` : null,
    `🏋️ ${Math.round(sessionVolume(s))} kg di volume`
  ].filter(Boolean);

  const rows = Object.keys(s.exercises || {})
    .map(k => {
      const sets = s.exercises[k].sets;
      const q = s.exercises[k].quality;
      const qIcon = q === 'clean' ? '✅' : q === 'hard' ? '⚠️' : q === 'fail' ? '❌' : '';
      const pr = bestPR(k);
      const max = Math.max(...sets.map(x => x.w));
      const isPr = max >= pr && pr > 0;
      return `<div class="sd-row">
        <span class="sd-name">${EXERCISES[k] ? EXERCISES[k].name : k}${isPr ? ' 🏆' : ''} ${qIcon}</span>
        <span class="sd-sets">${sets.map(x => `${x.w}×${x.r}`).join(' · ')}</span>
      </div>`;
    }).join("");

  return `
    <div class="sd-head" style="background:${w ? w.color : '#999'}">
      <div class="sd-title">${w ? w.emoji + ' ' + w.name : 'Sessione'} ✓</div>
      ${sched && sched.note ? `<div class="sd-note">${sched.note}</div>` : ''}
    </div>
    <div class="sd-meta">${meta.join(' &nbsp;·&nbsp; ')}</div>
    <div class="sd-list">${rows || '<div class="empty-mini">Nessun peso registrato.</div>'}</div>
    ${s.notes ? `<div class="sd-notes">📝 ${s.notes}</div>` : ''}
    <button class="btn-save" style="margin-top:14px" onclick="closeModal();openRecap(${s.id})">📸 Riepilogo da salvare</button>
    <button class="modal-clear" onclick="deleteSession(${s.id})">🗑 Elimina questa sessione</button>`;
}

function deleteSession(id) {
  const sess = state.sessions.find(x => x.id === id);
  if (!sess) return;
  const schedEntry = state.schedule[sess.date];
  state.sessions = state.sessions.filter(x => x.id !== id);
  if (schedEntry && schedEntry.done && !state.sessions.some(x => x.date === sess.date)) {
    state.schedule[sess.date] = Object.assign({}, schedEntry, { done: false });
  }
  saveState(state); closeModal(); renderCalendar();
  toastUndo("🗑 Sessione del " + fmtShort(sess.date) + " eliminata.", () => {
    state.sessions.push(sess);
    state.sessions.sort((a, b) => a.date.localeCompare(b.date));
    if (schedEntry) state.schedule[sess.date] = schedEntry;
    saveState(state); renderCalendar();
  });
}

/* ---------- ROTAZIONE AUTOMATICA DELLE SCHEDE ----------
   Nel calendario si sceglie solo il TIPO di giornata (scheda vs PT):
   quale scheda tocchi lo decide l'app, alternando in ordine tutte le
   schede non-PT. Ogni inserimento/rimozione ricalcola i giorni successivi,
   così l'alternanza regge anche aggiungendo un giorno a metà settimana. */

// Le schede che entrano nella rotazione (tutte le non-PT dell'utente).
function rotationWorkouts() {
  return ALL_WORKOUTS().filter(w => !w.pt);
}

function isPTEntry(s) {
  return !!(s && (s.pt || (getWorkout(s.workoutId) || {}).pt));
}

// Un giorno è "congelato" se è già stato allenato: non lo tocchiamo,
// resta fedele a quello che Mike ha davvero fatto e fa da àncora per il resto.
function isFrozenDay(ds, s) {
  return !!(s && s.done) || state.sessions.some(x => x.date === ds);
}

// Riassegna le schede ai giorni non congelati, in ordine cronologico.
function resequenceSchedule() {
  const rot = rotationWorkouts();
  if (!rot.length) return;
  const idxOf = id => rot.findIndex(w => w.id === id);

  const days = Object.keys(state.schedule || {})
    .filter(ds => !isPTEntry(state.schedule[ds]))
    .sort();

  let cursor = -1;  // indice dell'ultima scheda fissata; -1 → si riparte dalla prima
  days.forEach(ds => {
    const s = state.schedule[ds];
    if (isFrozenDay(ds, s)) {
      const i = idxOf(s.workoutId);
      if (i >= 0) cursor = i;
      return;
    }
    cursor = (cursor + 1) % rot.length;
    if (s.workoutId !== rot[cursor].id) {
      state.schedule[ds] = Object.assign({}, s, { workoutId: rot[cursor].id });
    }
  });
}

// Chiamata dal modale del giorno: kind = "scheda" | "pt".
function assignDayKind(ds, kind) {
  const prev = state.schedule[ds];
  if (kind === "pt") {
    state.schedule[ds] = { workoutId: PT_WORKOUT.id, pt: true, done: prev ? !!prev.done : false };
    if (prev && prev.note) state.schedule[ds].note = prev.note;
  } else {
    const rot = rotationWorkouts();
    if (!rot.length) return;
    // segnaposto: ci pensa resequenceSchedule() a scegliere quella giusta
    state.schedule[ds] = { workoutId: rot[0].id, done: prev ? !!prev.done : false };
    if (prev && prev.note) state.schedule[ds].note = prev.note;
  }
  resequenceSchedule();
  saveState(state);
  closeModal();
  renderCalendar();
  const w = getWorkout(state.schedule[ds].workoutId);
  if (w) toast(`${w.emoji} ${fmtShort(ds)} → ${w.name}`);
}

function assignDay(ds, workoutId) {
  const prev = state.schedule[ds];
  const w = getWorkout(workoutId);
  state.schedule[ds] = { workoutId, done: prev ? prev.done : false };
  if (w && w.pt) state.schedule[ds].pt = true;
  if (prev && prev.note) state.schedule[ds].note = prev.note;
  saveState(state);
  closeModal();
  renderCalendar();
}

function clearDay(ds) {
  delete state.schedule[ds];
  resequenceSchedule();   // togliendo un giorno l'alternanza dei successivi slitta
  saveState(state);
  closeModal();
  renderCalendar();
}

function closeModal() { $("modal").classList.remove("show"); }
