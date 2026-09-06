# Gym Tracker — guida al progetto

PWA personale di allenamento/nutrizione in italiano. Uso reale: Mike (+ Lorenzo e altri amici via Crew). Obiettivo massa, segue anche un PT umano (Denis) → **i consigli dell'app sono suggerimenti, mai imposizioni**.

- **Live**: https://mike3am-dev.github.io/gym/
- **Repo**: `mike3am-dev/gym` (GitHub Pages, branch `main`)

## Stack

- **Vanilla HTML/CSS/JS**, nessun framework, nessun build step. Si scrive JS e si serve così com'è.
- **Chart.js 4.4.1** via CDN (unica dipendenza front-end).
- **Supabase** (`supabase-js@2` UMD via CDN): Auth email+password, Postgres (`user_states`, `state_history`, tabelle Crew), Storage privato (`photos`) e pubblico (`calendars`). Tutto protetto da **RLS** (`auth.uid() = user_id`).
- **PWA**: `manifest.webmanifest`, `apple-touch-icon` (`assets/icon.png`), service worker network-first (`sw.js`), safe-area insets.
- **Persistenza**: `localStorage` (`STORE_KEY = "allenamento_v2"`) come cache offline + sync cloud quando loggati. Export/import JSON per backup manuale.

### Chiave Supabase
La **anon key** in `js/cloud-config.js` è pubblica per design (protetta da RLS). La **`service_role` key non va MAI usata né committata.**

## Struttura moduli (`js/`, caricati in quest'ordine)

`app.js` è stato spezzato in moduli per sezione. Ordine di caricamento in `index.html` (le dipendenze vivono a runtime, non al parse):

| File | Ruolo |
|---|---|
| `data.js` | libreria esercizi (`EXERCISES`), schede default (`WORKOUTS`), `PT_WORKOUT`, badge |
| `exercise-media.js` | `EXERCISE_STEPS` — "Come si esegue" (IT, dal dataset) |
| `cues.js` | `EXERCISE_CUES` ("Occhio a…") + `EXERCISE_TIPS_BYNAME` |
| `storage.js` | `defaultState()`, load/save, **`applyMigrations()`**, export/import JSON |
| `core.js` | stato globale, date/util, promemoria, coach nutrizione, **rest day**, badge |
| `deload.js` | analisi fatica, scarico, **`suggestion()`** (motore progressione) |
| `workout.js` | tab Allena, vista PT, preparazione, `workoutStats()`, gestione schede |
| `guided.js` | allenamento guidato (l'unico posto che REGISTRA una sessione) |
| `calendar.js` | calendario + export ICS/webcal |
| `progress.js` | grafici (volume settimanale, progressione, 1RM), radar, super esercizi PT |
| `profile.js` | profilo, composizione corporea, avatar, trofei |
| `meals.js` | pasti, storico settimane |
| `init.js` | backup, toast/undo, avvio |
| `wrapped.js` | Wrapped mensile (pagella) |
| `setup.js` | onboarding + builder schede (preset/manuale/import PT) |
| `demo.js` | profilo "Alex" di esempio (modalità vetrina non loggati) |
| `cloud-config.js` / `cloud.js` | Supabase: auth, sync, anti-wipe, flush keepalive |
| `crew.js` | sfida a gruppo (aggregati, punzecchio) |
| `photos.js` | foto progressi (bucket privato + timeline) |

## Sezioni (bottom nav)

**Allena · Calendario · Progressi · Pasti · Profilo**

- **Allena** = solo PREPARAZIONE. I valori toccati nelle card finiscono in `state.prep` e diventano gli obiettivi del guidato. **Non registrano nulla.** L'unico modo di creare una sessione è il "Salva" del guidato (o salva/scarta all'uscita anticipata). La tab PT ha una vista dedicata (super esercizio in rotazione panca→stacco→squat).
- **Progressi** = Crew in cima, stat cards, volume settimanale (istogrammi+trend per scheda), progressione esercizio (volume kg×rip + 1RM stimato), radar muscolare, super esercizi PT, storico.
- **Pasti** = barre kcal/proteine (mostrano quanto MANCA), storico settimane col semaforo.
- **Profilo** = card stile "Apple Fitness", composizione, andamento, coach nutrizione, traguardi, Crew, backup.

## Convenzioni e regole non ovvie

- **Date SEMPRE locali**: usa `localDate(d)` / `todayStr()`. **Mai `toISOString()`** per le date (è UTC, a cavallo mezzanotte italiana sposta al giorno sbagliato). Bug reale già corretto, coperto da test di regressione.
- **Settimana lunedì→domenica**: `weekStart(dateStr)`.
- **Chiavi esercizio stabili**: lo storico si aggancia alla chiave (`chestpress`, `curl`…). Scambiare/rinominare schede NON deve cambiare le chiavi → storico e progressione restano.
- **Esercizi custom (import PT)** hanno chiavi variabili per utente ma **nome stabile** → GIF, cues, tip, steps hanno un **fallback per nome-slug** (`nameSlug()`): file `assets/gifs/<nome_slug>.gif`.
- **Progressione (semaforo)** in `suggestion()`: 🟢 pulite → +1 rip fino al **max di Denis** (`repsMax`), raggiunto il max → +peso e reset al **min** (`reps`); 🟡 dure → fermo; 🔴 non completate → riprova uguale. Incremento: `meta.inc` se presente (es. Leg Press +10), altrimenti +2 manubri / +2,5 macchine-cavi-bilanciere. Corpo libero (`type:"body"`) → niente kg, progressione a ripetizioni. Scarico attivo → −20% arrotondato in giù.
- **Radar muscolare effort-aware**: conta le ripetizioni relative al target (cap 2,5×), non solo le serie → il core (corpo libero) riflette le ripetizioni reali.
- **Volume PT** (Crew): registriamo solo il carico, quindi ogni alzata vale `kg × 15`.
- **Modifiche ai dati dell'utente** (schede, esercizi, range): NON si toccano in `data.js` per gli esercizi custom — vivono nella riga Supabase dell'utente. Si usa una **migrazione idempotente** in `applyMigrations()` (agganciata per nome, con id in `state.migrations`). Migrazioni attuali: `pulldown-back`, `bodyweight-fix`, `denis-reps`, `swap-chest-panca`, `add-affondi-lat`, `panca-4-serie`, `add-affondi-statici`.
- **Vincoli di prodotto**: nessuna integrazione con API AI a pagamento. L'app "vergine" su GitHub non contiene dati personali (vivono solo su Supabase per-utente).

## Test

`tests/test_core.js` — headless via **JavaScriptCore** (`osascript -l JavaScript tests/test_core.js`). ~160 test su funzioni pure + smoke test che renderizzano ogni vista con i dati demo (bloccano il deploy su qualsiasi eccezione). I sorgenti girano dentro `new Function(...)` con stub DOM/timer passati come argomenti (evita la collisione di `$` col bridge ObjC di JXA). File letti in UTF-8 via `NSString`.

## Deploy

`./deploy.sh "messaggio"`:
1. bump versione cache (`?v=YYYYMMDDHHMM` sugli asset in `index.html`)
2. check sintassi JS + esegue i test (**blocca il deploy se falliscono**)
3. commit + push
4. monitora la build GitHub Pages con auto-rerun se la coda si inceppa

**Non serve un dev server**: per una verifica visiva locale basta `python3 -m http.server` + il Browser pane (`preview_start {url}`), navigando le viste con la demo di Alex (accesso da "Dai solo un'occhiata").

## Setup Supabase (una tantum, SQL Editor → Run)

Gli script in `supabase/` vanno eseguiti nel pannello Supabase quando si introduce la feature: `crew.sql` (tabelle + RLS Crew), `photos.sql` (bucket privato foto), `calendar.sql` (bucket pubblico calendari webcal). Idempotenti dove possibile.

## Icona

`assets/icon.png` 512×512, **no alpha**, **full-bleed** (nessun margine trasparente/bianco: iOS appiattisce l'alpha e mostrerebbe un filetto). Flusso tipico: Mike fornisce il PNG, si ridimensiona con `sips`, si verifica a vista con Read prima del commit.
