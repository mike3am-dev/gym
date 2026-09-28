/* ============================================================
   STORAGE — persistenza su localStorage + export/import JSON
   ============================================================ */

const STORE_KEY = "allenamento_v2";

const defaultState = () => ({
  sessions: [],        // { id, date, workoutId, weights:{ exKey:[s1,s2,s3] }, duration, calories, notes }
  bodyweight: [],      // { date:"YYYY-MM-DD", v }
  schedule: {},        // "YYYY-MM-DD": { workoutId, done, note }
  goals: {             // obiettivo massa
    startWeight: null,
    targetWeight: null,
    targetDate: null,
    goalType: "",
    note: ""
  },
  profile: {           // anagrafica
    name: "",
    nick: "",          // nickname mostrato in alto (account)
    birthday: null,    // "YYYY-MM-DD"
    height: null       // cm
  },
  composition: [],     // { date, weight, bodyFat, skeletalMuscle, boneMass, bodyWater, bmr, metabolicAge }
  meals: {},           // "YYYY-MM-DD": [ { id, text, kcal, protein, t:"HH:MM" } ]
  ptLifts: [],         // sedute con Denis: { date, panca, squat, stacco } — kg dei 3 esercizi
  nutriGoal: { kcal: null, protein: null },  // null = usa i target adattivi del coach nutrizione
  myWorkouts: [],      // schede personali dell'utente (se vuoto → schede di default)
  deload: null,        // scarico: { start, until } attivo oppure { snoozeUntil }
  wrappedSeen: [],     // mesi ("YYYY-MM") il cui Wrapped è già stato aperto
  crew: null,          // crew di appartenenza: { id, code } (i dati vivono su Supabase)
  prep: {},            // preparazione pre-allenamento per esercizio: { sets, reps, w }
  photos: [],          // indice foto progressi: { date, angle, path } (file nel bucket privato)
  exNotes: {},         // appunti personali per esercizio: { exKey: "testo" } — persistenti
  customExercises: {}, // esercizi importati/creati dall'utente (stessa forma di EXERCISES)
  badges: [],          // id dei traguardi sbloccati
  migrations: [],      // id delle migrazioni già applicate
  version: 2
});

// Migrazioni strutturali sui dati salvati (idempotenti). Nessun dato personale:
// i dati di ogni utente vivono nel proprio account cloud, non nel codice.
function applyMigrations(s) {
  s.migrations = s.migrations || [];
  // Correzione dati: i pulldown ai cavi lavorano la schiena, non le braccia
  // (esercizi importati dal PT con il gruppo muscolare sbagliato)
  if (s.migrations.indexOf("pulldown-back") < 0) {
    Object.values(s.customExercises || {}).forEach((ex) => {
      if (ex && /pulldown/i.test(ex.name || "") && ex.bodyPart === "arms") {
        ex.bodyPart = "back";
        ex.muscle = "Dorsali";
      }
    });
    s.migrations.push("pulldown-back");
  }
  // Correzione dati: gli esercizi a corpo libero importati dal PT erano
  // finiti come "macchina" (quindi chiedevano i kg). Riconosciuti dal nome,
  // esclusi quelli che citano un attrezzo.
  if (s.migrations.indexOf("bodyweight-fix") < 0) {
    Object.values(s.customExercises || {}).forEach((ex) => {
      if (!ex || ex.type === "body") return;
      const n = ex.name || "";
      const isBW = /plank|crunch|mountain|climber|burpee|circuito|jumping|sit.?up|affond/i.test(n);
      const hasTool = /cav[oi]|manubri|bilanciere|macchina|panca piana|smith/i.test(n);
      if (isBW && !hasTool) ex.type = "body";
    });
    s.migrations.push("bodyweight-fix");
  }
  // Range di ripetizioni della scheda del PT (base e tetto per la
  // progressione), agganciati per nome. Serie e schede NON toccate.
  if (s.migrations.indexOf("denis-reps") < 0) {
    const RANGES = {
      "alzate laterali manubri":    [15, 15],
      "crunch panca inclinata":     [15, 15],
      "lat pulldown inversa":       [10, 12],
      "lento avanti manubri":       [12, 15],
      "pulldown cavi corda":        [12, 15],
      "crunch sollevamento gambe":  [12, 15],
      "plank battito spalle":       [7, 7],
      "mountain climber":           [7, 7],
      "circuito metabolico":        [7, 7],
      "affondi laterali":           [12, 12]
    };
    Object.values(s.customExercises || {}).forEach((ex) => {
      const r = ex && RANGES[String(ex.name || "").toLowerCase().trim()];
      if (r) { ex.reps = r[0]; ex.repsMax = r[1]; }
    });
    s.migrations.push("denis-reps");
  }
  // Scambio schede: Chest Press ↔ Panca inclinata manubri (stessa posizione).
  // Le chiavi degli esercizi non cambiano: storico e progressione restano.
  if (s.migrations.indexOf("swap-chest-panca") < 0) {
    const inclKey = Object.keys(s.customExercises || {})
      .find(k => /panca\s+inclinata\s+manubri/i.test((s.customExercises[k] || {}).name || ""));
    if (inclKey) {
      const wChest = (s.myWorkouts || []).find(w => (w.exercises || []).indexOf("chestpress") >= 0);
      const wIncl = (s.myWorkouts || []).find(w => (w.exercises || []).indexOf(inclKey) >= 0);
      if (wChest && wIncl && wChest !== wIncl) {
        wChest.exercises[wChest.exercises.indexOf("chestpress")] = inclKey;
        wIncl.exercises[wIncl.exercises.indexOf(inclKey)] = "chestpress";
      }
    }
    s.migrations.push("swap-chest-panca");
  }
  // Nuovo esercizio della scheda: Affondi laterali con manubri in Seduta 2,
  // subito dopo la Lat pulldown inversa. Peso di partenza 6 kg (preparazione).
  if (s.migrations.indexOf("add-affondi-lat") < 0) {
    const AFF = "cx_affondi_laterali_manubri";
    const already = (s.myWorkouts || []).some(w => (w.exercises || []).indexOf(AFF) >= 0);
    const pullKey = Object.keys(s.customExercises || {})
      .find(k => /lat\s+pulldown\s+inversa/i.test((s.customExercises[k] || {}).name || ""));
    if (pullKey && !already) {
      const w = (s.myWorkouts || []).find(x => (x.exercises || []).indexOf(pullKey) >= 0);
      if (w) {
        s.customExercises[AFF] = {
          name: "Affondi laterali con manubri",
          muscle: "Quadricipiti, Glutei",
          secondary: "Adduttori, Core",
          type: "dumbbell",
          sets: 3, reps: 12, repsMax: 12, rest: '60"',
          bodyPart: "legs",
          tip: "12 per lato: spingi il bacino indietro sulla gamba che lavora, l'altra resta tesa. Ginocchio in linea col piede, busto alto."
        };
        w.exercises.splice(w.exercises.indexOf(pullKey) + 1, 0, AFF);
        s.prep = s.prep || {};
        if (!s.prep[AFF]) s.prep[AFF] = { sets: 3, reps: 12, w: 6 };   // partenza consigliata
      }
    }
    s.migrations.push("add-affondi-lat");
  }
  // Serie: la panca inclinata manubri (ora in Seduta 1) passa a 4 serie.
  // Le ripetizioni restano quelle dell'import; il peso lo decide sempre il
  // motore di progressione dal semaforo dell'ultima volta.
  if (s.migrations.indexOf("panca-4-serie") < 0) {
    Object.values(s.customExercises || {}).forEach((ex) => {
      if (ex && /panca\s+inclinata\s+manubri/i.test(ex.name || "")) ex.sets = 4;
    });
    s.migrations.push("panca-4-serie");
  }
  // Nuovo esercizio: Affondi statici con manubri in Seduta 1, subito dopo
  // la Lat Machine. 3x12, peso di partenza 6 kg (preparazione).
  if (s.migrations.indexOf("add-affondi-statici") < 0) {
    const AFS = "cx_affondi_statici_manubri";
    const already = (s.myWorkouts || []).some(w => (w.exercises || []).indexOf(AFS) >= 0);
    const w = (s.myWorkouts || []).find(x => (x.exercises || []).indexOf("latmachine") >= 0);
    if (w && !already) {
      s.customExercises[AFS] = {
        name: "Affondi statici con manubri",
        muscle: "Quadricipiti, Glutei",
        secondary: "Femorali, Core",
        type: "dumbbell",
        sets: 3, reps: 12, repsMax: 12, rest: '60"',
        bodyPart: "legs",
        tip: "Sul posto, non camminare: scendi dritto finché la coscia è parallela, ginocchio dietro che sfiora il suolo. Busto alto, spingi col tallone davanti."
      };
      w.exercises.splice(w.exercises.indexOf("latmachine") + 1, 0, AFS);
      s.prep = s.prep || {};
      if (!s.prep[AFS]) s.prep[AFS] = { sets: 3, reps: 12, w: 6 };
    }
    s.migrations.push("add-affondi-statici");
  }
  // Mobilità & Postura: sezione di sola consultazione, niente tracciamento.
  // Ripulisce lo stato di chi aveva già la versione con il check giornaliero.
  if (s.migrations.indexOf("postural-no-tracking") < 0) {
    delete s.postural;
    s.migrations.push("postural-no-tracking");
  }
  // Da 2 schede lunghe a 3 corte (Gambe / Spinta / Tirata), stessi esercizi.
  // Parte SOLO se trova esattamente le due schede di Mike: per chiunque altro
  // (Lorenzo, la Crew, la demo) non tocca nulla.
  restructureThreeSplit(s);
  return s;
}

/* ---------- RISTRUTTURAZIONE: 2 schede → Gambe / Spinta / Tirata ----------
   - lo storico è per chiave esercizio: le nuove schede riusano le stesse
     chiavi, quindi storico, PR e progressione restano agganciati;
   - "Alzate laterali manubri" era in entrambe con due chiavi diverse:
     le sessioni della chiave meno recente passano a quella più recente
     (un solo storico, PR = massimo tra i due);
   - le due schede vecchie NON si cancellano: diventano archiviate, così
     sessioni passate, calendario e riepiloghi mostrano il nome vero;
   - i giorni futuri non ancora fatti ripartono in rotazione Gambe → Spinta → Tirata;
   - in s.restructureBackup resta tutto ciò che viene modificato (annullabile). */
const SPLIT3_ID = "restructure-3-schede";
const SPLIT3_OLD = [
  ["Leg Press", "Panca inclinata manubri", "Lat Machine", "Affondi statici con manubri", "Alzate laterali manubri",
   "Curl Bicipiti", "Crunch panca inclinata", "Tricipiti ai Cavi", "Circuito metabolico"],
  ["Leg Extension", "Chest Press", "Lat pulldown inversa", "Affondi laterali con manubri", "Alzate laterali manubri",
   "Lento avanti manubri", "Pulldown cavi corda", "Plank battito spalle", "Crunch sollevamento gambe", "Mountain climber"]
];
const SPLIT3_NEW = [
  { id: "my_split_gambe",  name: "Gambe",  emoji: "🦵", color: "#FF2D95", focus: "Gambe + core",
    ex: ["Leg Press", "Leg Extension", "Affondi statici con manubri", "Affondi laterali con manubri", "Crunch sollevamento gambe", "Mountain climber"] },
  { id: "my_split_spinta", name: "Spinta", emoji: "💪", color: "#5B8DEF", focus: "Petto, spalle, tricipiti",
    ex: ["Panca inclinata manubri", "Chest Press", "Lento avanti manubri", "Alzate laterali manubri", "Tricipiti ai Cavi", "Crunch panca inclinata"] },
  { id: "my_split_tirata", name: "Tirata", emoji: "🔙", color: "#F59E0B", focus: "Dorsali, bicipiti",
    ex: ["Lat Machine", "Lat pulldown inversa", "Pulldown cavi corda", "Curl Bicipiti", "Plank battito spalle", "Circuito metabolico"] }
];
const split3Norm = (n) => String(n || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

function restructureThreeSplit(s) {
  if (s.migrations.indexOf(SPLIT3_ID) >= 0) return false;
  const exName = (k) => ((s.customExercises || {})[k] || (typeof EXERCISES !== "undefined" ? EXERCISES[k] : null) || {}).name;
  const active = (s.myWorkouts || []).filter(w => !w.archived && !w.pt);
  if (active.length !== 2) return false;

  // le due schede devono corrispondere ESATTAMENTE (nomi degli esercizi, in qualsiasi ordine)
  const sig = (names) => names.map(split3Norm).sort().join("|");
  const olds = [];
  for (const want of SPLIT3_OLD) {
    const w = active.find(x => sig((x.exercises || []).map(exName)) === sig(want));
    if (!w || olds.indexOf(w) >= 0) return false;
    olds.push(w);
  }

  // nome → chiave (per le Alzate: due chiavi, una per scheda)
  const keyOf = {};
  olds.forEach(w => w.exercises.forEach(k => {
    const n = split3Norm(exName(k));
    (keyOf[n] = keyOf[n] || []).indexOf(k) < 0 && keyOf[n].push(k);
  }));

  // backup di tutto ciò che verrà modificato
  s.restructureBackup = {
    at: new Date().toISOString(),
    myWorkouts: JSON.parse(JSON.stringify(s.myWorkouts || [])),
    schedule: JSON.parse(JSON.stringify(s.schedule || {})),
    merged: null
  };

  // unione delle Alzate laterali: sopravvive la chiave usata più di recente
  const alz = keyOf[split3Norm("Alzate laterali manubri")] || [];
  if (alz.length === 2) {
    const exOf = (x) => x.exercises || x.weights || {};
    const lastUse = (k) => (s.sessions || []).filter(x => exOf(x)[k]).map(x => x.date).sort().pop() || "";
    const [keep, drop] = lastUse(alz[1]) > lastUse(alz[0]) ? [alz[1], alz[0]] : [alz[0], alz[1]];
    const moved = [];
    (s.sessions || []).forEach(x => {
      const e = exOf(x);
      if (e[drop] && !e[keep]) { e[keep] = e[drop]; delete e[drop]; moved.push(x.id); }
    });
    s.prep = s.prep || {};
    if (s.prep[drop] && !s.prep[keep]) s.prep[keep] = s.prep[drop];
    delete s.prep[drop];
    s.exNotes = s.exNotes || {};
    if (s.exNotes[drop]) {
      s.exNotes[keep] = s.exNotes[keep] ? s.exNotes[keep] + "\n" + s.exNotes[drop] : s.exNotes[drop];
      delete s.exNotes[drop];
    }
    s.restructureBackup.merged = { from: drop, to: keep, sessionIds: moved };
    keyOf[split3Norm("Alzate laterali manubri")] = [keep];
  }

  // le 3 nuove schede, con le chiavi di sempre
  const fresh = SPLIT3_NEW.map(n => {
    const exercises = n.ex.map(name => keyOf[split3Norm(name)][0]);
    return { id: n.id, name: n.name, emoji: n.emoji, color: n.color,
             sub: `${exercises.length} esercizi`, focus: n.focus, exercises, custom: true };
  });
  olds.forEach(w => { w.archived = true; });
  s.myWorkouts = (s.myWorkouts || []).filter(w => fresh.every(f => f.id !== w.id)).concat(fresh);

  // calendario: il passato resta com'è, il futuro non fatto ruota sulle nuove schede
  const oldIds = olds.map(w => w.id);
  const rot = fresh.map(w => w.id);
  const days = Object.keys(s.schedule || {}).filter(d => {
    const e = s.schedule[d];
    return e && !e.pt && (oldIds.indexOf(e.workoutId) >= 0 || rot.indexOf(e.workoutId) >= 0);
  }).sort();
  // (qui core.js non è ancora inizializzato: data locale calcolata a mano, mai toISOString)
  const t = new Date();
  const today = t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
  let cursor = -1;
  days.forEach(d => {
    const e = s.schedule[d];
    const frozen = e.done || d < today || (s.sessions || []).some(x => x.date === d);
    if (frozen) { const i = rot.indexOf(e.workoutId); if (i >= 0) cursor = i; return; }
    cursor = (cursor + 1) % rot.length;
    s.schedule[d] = Object.assign({}, e, { workoutId: rot[cursor] });
  });

  s.migrations.push(SPLIT3_ID);
  return true;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();            // primo avvio: app vuota
    const parsed = JSON.parse(raw);
    const merged = Object.assign(defaultState(), parsed);
    return applyMigrations(merged);
  } catch (e) {
    console.warn("Stato corrotto, reset:", e);
    return defaultState();
  }
}

function saveState(state) {
  if (typeof window !== "undefined" && window.DEMO_MODE) return;   // il profilo demo vive solo in memoria
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Salvataggio fallito:", e);
  }
}

// Export: scarica un file JSON di backup
function exportJSON(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const d = new Date();
  const stamp = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  a.href = url;
  a.download = `allenamento-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import: legge un file JSON e ritorna lo stato (Promise)
function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        resolve(Object.assign(defaultState(), parsed));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
