/* ============================================================
   MOBILITÀ & POSTURA — dati statici della routine correttiva
   Pattern diagnosticato: Upper Crossed Syndrome (cifosi toracica,
   spalle anteposte) + femorali corti (leg raise ~50°, target 90°).
   Protocolli di riferimento: approccio Janda. Solo contenuti: la sezione
   è un promemoria consultabile, non registra nulla.
   ============================================================ */

// img: nome del file in assets/gifs/ (gif del dataset o png generato).
// Assente = nessun disegno disponibile: la vista mostra l'icona 🧘.
// categoria: morning | pre-workout | post-workout | gym-accessory
// lato: bilaterale | per-lato
// attrezzatura: nessuna | bastone | foam-roller | elastico | cavi
const POSTURAL = [
  /* ---------- MATTINA (casa, 5 minuti) ---------- */
  {
    id: "cat-camel-am",
    nome: "Cat-Camel",
    img: "cat_camel.png",
    categoria: "morning",
    attrezzatura: "nessuna",
    serieRip: "8-10 rip",
    lato: "bilaterale",
    istruzioni: "A quattro zampe, alterna inarcamento e incurvamento della schiena seguendo il respiro. Muovi vertebra per vertebra, senza fermarti agli estremi.",
    muscoli: ["erettori spinali", "multifido", "addome profondo"],
    rationale: "Mobilità dinamica della colonna per svegliare la schiena prima di una giornata tra seduto e in piedi."
  },
  {
    id: "wall-angels",
    nome: "Wall Angels",
    img: "wall_angels.png",
    categoria: "morning",
    attrezzatura: "nessuna",
    serieRip: "2x10",
    lato: "bilaterale",
    istruzioni: "In piedi contro il muro: schiena, glutei e testa a contatto per tutto il movimento. Fai scorrere le braccia su e giù senza staccare polsi e gomiti dal muro.",
    muscoli: ["serrato anteriore", "trapezio inferiore", "romboidi"],
    rationale: "Non è solo mobilità: attiva serrato anteriore e trapezio inferiore, i muscoli più deboli in questo pattern posturale."
  },
  {
    id: "chin-tuck-am",
    nome: "Chin Tuck (flessione craniocervicale)",
    img: "chin_tuck.png",
    categoria: "morning",
    attrezzatura: "nessuna",
    serieRip: "10 rip · hold 5 sec",
    lato: "bilaterale",
    hold: 5,
    istruzioni: "Fai il \"doppio mento\" arretrando la testa, senza inclinarla né guardare in basso. Tieni 5 secondi e rilascia.",
    muscoli: ["flessori profondi del collo", "lungo del collo"],
    rationale: "I flessori profondi del collo sono il gruppo più trascurato nella correzione posturale."
  },
  {
    id: "foam-toracico",
    nome: "Foam roller toracico dinamico",
    img: "foam_roller_toracico.png",
    categoria: "morning",
    attrezzatura: "foam-roller",
    serieRip: "8-10 rip",
    lato: "bilaterale",
    istruzioni: "Roller sotto la schiena all'altezza delle scapole. Le braccia scivolano avanti e indietro sul pavimento con movimento continuo.",
    muscoli: ["tratto toracico", "gran dorsale"],
    rationale: "Movimento continuo, NON stretch statico tenuto: appena svegli i tessuti sono rigidi."
  },
  {
    id: "deep-lunge-reach",
    nome: "Deep lunge con reach/rotazione",
    img: "deep_lunge_con_reach_rotazione.gif",
    categoria: "morning",
    attrezzatura: "nessuna",
    serieRip: "5 rip per lato",
    lato: "per-lato",
    opzionale: true,
    istruzioni: "Affondo profondo, mano interna a terra. Ruota il busto e porta il braccio verso l'alto seguendolo con lo sguardo.",
    muscoli: ["flessori dell'anca", "tratto toracico"],
    rationale: "Opzionale se avanza tempo: apre anca e toracica insieme."
  },

  /* ---------- PRE-ALLENAMENTO (warm-up) ---------- */
  {
    id: "pass-through",
    nome: "Overhead Pass Through con bastone",
    img: "overhead-pass-through.png",
    categoria: "pre-workout",
    attrezzatura: "bastone",
    serieRip: "10 rip",
    lato: "bilaterale",
    istruzioni: "Presa larga sul bastone, braccia tese. Porta il bastone sopra la testa e dietro la schiena, controllato. Stringi la presa se tira troppo.",
    muscoli: ["deltoide", "pettorale", "cuffia dei rotatori"],
    rationale: "Mobilità dinamica di spalla prima dei carichi: prepara il range che userai in panca e lento avanti."
  },
  {
    id: "behind-back-stick",
    nome: "Behind-the-Back Shoulder Stretch con bastone",
    img: "behind_the_back_shoulder_stretch_con_bastone.png",
    categoria: "pre-workout",
    attrezzatura: "bastone",
    serieRip: "10 rip dinamiche",
    lato: "bilaterale",
    istruzioni: "Bastone dietro la schiena a braccia tese, sollevalo lontano dal corpo e torna. Movimento dinamico, non tenuto.",
    muscoli: ["pettorale", "deltoide anteriore"],
    rationale: "Prima dei pesi lo stretch tenuto abbassa la prestazione: qui serve dinamico."
  },
  {
    id: "cat-camel-pre",
    nome: "Cat-Camel",
    img: "cat_camel.png",
    categoria: "pre-workout",
    attrezzatura: "nessuna",
    serieRip: "8 rip",
    lato: "bilaterale",
    istruzioni: "A quattro zampe, alterna inarcamento e incurvamento seguendo il respiro.",
    muscoli: ["erettori spinali", "multifido"],
    rationale: "Sblocca la colonna prima di squat e stacco."
  },
  {
    id: "greatest-stretch",
    nome: "World's Greatest Stretch",
    img: "world_s_greatest_stretch.gif",
    categoria: "pre-workout",
    attrezzatura: "nessuna",
    serieRip: "5 rip per lato",
    lato: "per-lato",
    istruzioni: "Affondo, gomito verso l'interno del piede, poi ruota il busto e apri il braccio verso l'alto. Chiudi estendendo la gamba avanti per i femorali.",
    muscoli: ["flessori dell'anca", "tratto toracico", "femorali"],
    rationale: "Copre anca, toracica e femorali in un solo movimento: il miglior rapporto tempo/effetto nel warm-up."
  },
  {
    id: "chin-tuck-pre",
    nome: "Chin Tuck",
    img: "chin_tuck.png",
    categoria: "pre-workout",
    attrezzatura: "nessuna",
    serieRip: "10 rip",
    lato: "bilaterale",
    istruzioni: "\"Doppio mento\" senza inclinare la testa. Richiamo rapido prima dei pesi.",
    muscoli: ["flessori profondi del collo"],
    rationale: "Riporta la testa sopra le spalle prima di caricare: la posizione con cui inizi è quella che tieni sotto carico."
  },

  /* ---------- POST-ALLENAMENTO (defaticamento) ---------- */
  {
    id: "dog-cobra",
    nome: "Downward Dog to Cobra",
    img: "downward_dog_to_cobra.gif",
    categoria: "post-workout",
    attrezzatura: "nessuna",
    serieRip: "8-10 rip lente",
    lato: "bilaterale",
    istruzioni: "Passa da cane a testa in giù a cobra scendendo con le anche, poi torna indietro. Lento, seguendo il respiro.",
    muscoli: ["femorali", "polpacci", "flessori dell'anca", "pettorale"],
    rationale: "Catena posteriore e anteriore in un ciclo unico, a muscoli caldi."
  },
  {
    id: "overhead-stretch-post",
    nome: "Overhead Shoulder Stretch dietro la schiena",
    img: "overhead_shoulder_stretch_dietro_la_schiena.gif",
    categoria: "post-workout",
    attrezzatura: "nessuna",
    serieRip: "20-30 sec per lato",
    lato: "per-lato",
    hold: 30,
    istruzioni: "Un braccio sopra la testa e gomito piegato dietro la nuca, l'altra mano spinge il gomito. Respira, non forzare oltre il fastidio.",
    muscoli: ["tricipite", "gran dorsale"],
    rationale: "Il gran dorsale corto tira la spalla in intrarotazione: qui lo stretch tenuto ha senso, sei a fine seduta."
  },
  {
    id: "doorway-pec",
    nome: "Doorway Pec Stretch",
    img: "doorway_pec_stretch.png",
    categoria: "post-workout",
    attrezzatura: "nessuna",
    serieRip: "20 sec x 5 rip",
    lato: "bilaterale",
    hold: 20,
    istruzioni: "Braccio a 90° contro lo stipite della porta. Ruota il busto in avanti finché senti lo stiramento sul pettorale, tieni 20 secondi.",
    muscoli: ["gran pettorale", "piccolo pettorale"],
    rationale: "Protocollo identico a quello usato nei trial clinici sulla sindrome posturale: il pettorale corto è metà del problema."
  },
  {
    id: "prone-cobra",
    nome: "Prone Cobra",
    img: "prone_cobra.png",
    categoria: "post-workout",
    attrezzatura: "nessuna",
    serieRip: "8-10 rip · hold 5-10 sec",
    lato: "bilaterale",
    hold: 10,
    istruzioni: "Prono a terra, solleva busto e braccia contro gravità con i pollici in fuori. Scapole strette, collo lungo.",
    muscoli: ["estensori dorsali", "trapezio medio e inferiore", "romboidi"],
    rationale: "Rinforza gli estensori dorsali, non li allunga soltanto: allungare senza rinforzare non tiene la correzione."
  },
  {
    id: "femorali-denis",
    nome: "Stretching femorali dedicato",
    img: "stretching_femorali_dedicato.gif",
    categoria: "post-workout",
    attrezzatura: "nessuna",
    serieRip: "come concordato con Denis",
    lato: "per-lato",
    hold: 30,
    istruzioni: "Il protocollo già concordato con Denis. Gamba tesa, bacino neutro, allunghi senza incurvare la lombare.",
    muscoli: ["femorali"],
    rationale: "Target 90° in leg raise, oggi ~50°: è il numero da muovere, misuralo ogni tanto."
  },
  {
    id: "mobility-swimmer",
    nome: "Mobility Swimmer",
    img: "mobility_swimmer.png",
    categoria: "post-workout",
    attrezzatura: "nessuna",
    serieRip: "8-10 rip",
    lato: "bilaterale",
    opzionale: true,
    istruzioni: "Prono, braccia che disegnano un arco ampio dall'alto ai fianchi e ritorno, staccate da terra.",
    muscoli: ["trapezio inferiore", "romboidi", "cuffia dei rotatori"],
    rationale: "Opzionale/avanzato: controllo scapolare su tutto il range."
  },

  /* ---------- DA DISCUTERE CON DENIS (accessori in scheda) ---------- */
  {
    id: "face-pull",
    nome: "Face Pull ai cavi",
    img: "face_pull.png",
    categoria: "gym-accessory",
    attrezzatura: "cavi",
    serieRip: "3x12-15",
    lato: "bilaterale",
    istruzioni: "Cavo alto con corda, tira verso il viso tenendo i gomiti alti e aprendo le mani a fine tirata. Niente slancio del busto.",
    muscoli: ["trapezio medio", "trapezio inferiore", "romboidi", "rotatori esterni"],
    rationale: "L'esercizio più efficiente per portare trapezio medio/inferiore e rotatori sotto carico progressivo."
  },
  {
    id: "prone-y-raise",
    nome: "Prone Y-Raise (Blackburn)",
    img: "prone_y_raise.png",
    categoria: "gym-accessory",
    attrezzatura: "nessuna",
    serieRip: "2x15",
    lato: "bilaterale",
    istruzioni: "Prono su panca inclinata, braccia a \"Y\" con i pollici in alto. Solleva senza scrollare le spalle. Corpo libero o carico molto leggero.",
    muscoli: ["trapezio inferiore"],
    rationale: "Stimola specificamente il trapezio inferiore, che i tiraggi pesanti tendono a saltare."
  },
  {
    id: "extra-rot-elastico",
    nome: "Extra-rotazione di spalla con elastico",
    img: "extra_rotazione_di_spalla_con_elastico.gif",
    categoria: "gym-accessory",
    attrezzatura: "elastico",
    serieRip: "15-20 rip per lato",
    lato: "per-lato",
    istruzioni: "Gomito al fianco a 90°, ruota l'avambraccio verso l'esterno contro l'elastico. Il gomito resta attaccato al corpo.",
    muscoli: ["sovraspinato", "sottospinato", "piccolo rotondo"],
    rationale: "Per l'asimmetria alla spalla destra già notata da Denis."
  }
];
