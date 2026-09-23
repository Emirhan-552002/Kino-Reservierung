const REIHEN = ["A", "B", "C", "D", "E", "F"];
const PLAETZE_PRO_REIHE = 10;
const MAX_PLAETZE = 8;

let filme = [];
let film = null;         // gewählter Film
let vorstellung = null;  // gewählte Vorstellung
let auswahl = [];        // gewählte Sitzplätze, z.B. ["C4", "C5"]

// Daten laden
async function filmeLaden() {
  const antwort = await fetch("filme.json");
  if (!antwort.ok) throw new Error("filme.json konnte nicht geladen werden");
  return await antwort.json();
}

// Nur einen Schritt anzeigen, die anderen ausblenden
function zeigeSchritt(id) {
  document.querySelectorAll(".schritt").forEach(s => s.hidden = s.id !== id);
  window.scrollTo(0, 0);
}

function euro(betrag) {
  return betrag.toFixed(2).replace(".", ",") + " €";
}

// SCHRITT 1: Filme anzeigen
function filmeAnzeigen() {
  const liste = document.getElementById("filmliste");
  liste.innerHTML = "";

  filme.forEach(f => {
    const karte = document.createElement("article");
    karte.className = "film";
    karte.innerHTML = `
      <h3>${f.titel}</h3>
      <p class="info">${f.genre}, ${f.dauer} Min., ab ${f.fsk}</p>
      <p class="info">${euro(f.preis)} pro Platz</p>
      <div class="zeiten"></div>
    `;
    const zeiten = karte.querySelector(".zeiten");
    f.vorstellungen.forEach(v => {
      const frei = REIHEN.length * PLAETZE_PRO_REIHE - v.belegt.length;
      const b = document.createElement("button");
      b.className = "zeit";
      b.innerHTML = `<strong>${v.zeit}</strong><span>${v.saal}, ${frei} frei</span>`;
      b.addEventListener("click", () => vorstellungWaehlen(f, v));
      zeiten.appendChild(b);
    });
    liste.appendChild(karte);
  });
}

function vorstellungWaehlen(f, v) {
  film = f;
  vorstellung = v;
  auswahl = [];
  document.getElementById("saal-titel").textContent = `${film.titel}, ${vorstellung.zeit} Uhr, ${vorstellung.saal}`;
  saalAnzeigen();
  zeigeSchritt("schritt-plaetze");
}

// SCHRITT 2: Sitzplan anzeigen
function saalAnzeigen() {
  const saal = document.getElementById("saal");
  saal.innerHTML = "";

  REIHEN.forEach(reihe => {
    const zeile = document.createElement("div");
    zeile.className = "reihe";
    zeile.innerHTML = `<span class="reihe-name">${reihe}</span>`;

    for (let nr = 1; nr <= PLAETZE_PRO_REIHE; nr++) {
      const platz = reihe + nr;
      const sitz = document.createElement("button");
      sitz.className = "sitz";
      sitz.textContent = nr;
      sitz.title = "Platz " + platz;

      if (vorstellung.belegt.includes(platz)) {
        sitz.classList.add("belegt");
        sitz.disabled = true;
      } else if (auswahl.includes(platz)) {
        sitz.classList.add("gewaehlt");
      }
      sitz.addEventListener("click", () => sitzUmschalten(platz));
      zeile.appendChild(sitz);

      if (nr === PLAETZE_PRO_REIHE / 2) {
        const gang = document.createElement("span");
        gang.className = "gang";
        zeile.appendChild(gang);
      }
    }
    saal.appendChild(zeile);
  });

  const text = document.getElementById("auswahl-text");
  const weiter = document.getElementById("weiter-plaetze");
  if (auswahl.length === 0) {
    text.textContent = "Noch keine Plätze gewählt.";
    weiter.disabled = true;
  } else {
    text.textContent = `${auswahl.join(", ")}: ${auswahl.length} Platz/Plätze, ${euro(auswahl.length * film.preis)}`;
    weiter.disabled = false;
  }
}

function sitzUmschalten(platz) {
  if (auswahl.includes(platz)) {
    auswahl = auswahl.filter(p => p !== platz);
  } else {
    if (auswahl.length >= MAX_PLAETZE) {
      alert(`Du kannst maximal ${MAX_PLAETZE} Plätze auf einmal buchen.`);
      return;
    }
    auswahl.push(platz);
  }
  saalAnzeigen();
}

// SCHRITT 3: Daten eingeben
function zuDaten() {
  document.getElementById("zusammenfassung").innerHTML = `
    <p><strong>${film.titel}</strong></p>
    <p>${vorstellung.zeit} Uhr, ${vorstellung.saal}</p>
    <p>Plätze: ${auswahl.join(", ")}</p>
    <p>Gesamt: <strong>${euro(auswahl.length * film.preis)}</strong></p>
  `;
  zeigeSchritt("schritt-daten");
}

// SCHRITT 4: Buchung abschließen
function buchen(event) {
  event.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const nummer = "KB-" + Date.now().toString().slice(-6);
  const gesamt = euro(auswahl.length * film.preis);

  // Plätze als belegt markieren
  vorstellung.belegt.push(...auswahl);

  document.getElementById("bestaetigung-text").innerHTML = `
    <p>Danke, ${name}! Deine Buchung ist bestätigt.</p>
    <p>Buchungsnummer: <strong>${nummer}</strong></p>
    <p>${film.titel}, ${vorstellung.zeit} Uhr, ${vorstellung.saal}</p>
    <p>Plätze: ${auswahl.join(", ")}</p>
    <p>Gesamt: ${gesamt}</p>
  `;

  const betreff = `Buchungsbestätigung ${nummer}: ${film.titel}`;
  const text =
`Hallo ${name},

deine Kinobuchung ist bestätigt.

Buchungsnummer: ${nummer}
Film: ${film.titel}
Vorstellung: ${vorstellung.zeit} Uhr, ${vorstellung.saal}
Plätze: ${auswahl.join(", ")}
Gesamt: ${gesamt}

Bitte sei 15 Minuten vor Beginn an der Kassa.
Viel Spaß im Kino!`;

  document.getElementById("mail-link").href =
    `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`;

  document.getElementById("buchungsformular").reset();
  zeigeSchritt("schritt-bestaetigung");
}

function neueBuchung() {
  film = null;
  vorstellung = null;
  auswahl = [];
  filmeAnzeigen(); // aktualisiert die Zahl der freien Plätze
  zeigeSchritt("schritt-film");
}

// Buttons verbinden
document.getElementById("zurueck-film").addEventListener("click", () => zeigeSchritt("schritt-film"));
document.getElementById("weiter-plaetze").addEventListener("click", zuDaten);
document.getElementById("zurueck-plaetze").addEventListener("click", () => zeigeSchritt("schritt-plaetze"));
document.getElementById("buchungsformular").addEventListener("submit", buchen);
document.getElementById("neue-buchung").addEventListener("click", neueBuchung);

// Start
filmeLaden()
  .then(daten => {
    filme = daten;
    filmeAnzeigen();
  })
  .catch(fehler => {
    document.getElementById("filmliste").textContent =
      "Fehler: " + fehler.message + ". Öffne die Seite mit Live Server.";
    console.error(fehler);
  });
