// Oberfläche des Produktfinders (Phase 5): eine Frage pro Bildschirm, Ergebnis mit Begründung.
// Logik: engine.js · Fragen: fragen.js · Daten: daten/finder-daten.js · Skizzen: skizzen.js
(function () {
'use strict';

const {erstelleFinder, UNBEKANNT, SPAETER} = globalThis.H2Engine;
const rohdaten = globalThis.H2Daten;
const finder = erstelleFinder(rohdaten, globalThis.H2Fragen);
// Texte liegen einmal im Datensatz und werden über ihre Nummer angesprochen.
const text = (nr) => (typeof nr === 'number' ? rohdaten.texte[nr] ?? '' : '');
globalThis.H2Finder = {finder};
if (typeof document === 'undefined') return;

const SPEICHER = 'h2-produktfinder-3';
const VERSION = '3.6';
const ART = {
    A1: 'Praxis-Ausschluss (Rudi)',
    A2: 'laut Katalog nicht geeignet',
    A3: 'Grenzwert verletzt',
    A4: 'Voraussetzung fehlt',
    A5: 'anderer Bedien- oder Montagewunsch',
};
const STUFE = {
    1: 'Rudis Lösung für diese Situation',
    2: 'Rudis Lösung, noch nicht alle Angaben bekannt',
    3: 'Einsatzzweck laut Hauptkatalog passt',
    4: 'laut Hauptkatalog technisch möglich',
    5: 'Zusatzvariante – Maße von der Schwestervariante',
};

const state = {antworten: {}, verlauf: []};
const el = (id) => document.getElementById(id);
const esc = (wert) => String(wert ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const skizze = (id, klasse = 'skizze') => {
    const svg = id && globalThis.H2Skizzen && globalThis.H2Skizzen[id];
    return svg ? `<span class="${klasse}" aria-hidden="true">${svg}</span>` : '';
};
const ruhig = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
// Sprache je Element: `frageJe`, `hilfeJe` und `hinweisJe` aus fragen.js gehen vor dem
// element-neutralen Text. Fehlt die Sonderform, bleibt es beim neutralen Wortlaut.
const jeText = (objekt, feld, antworten) => {
    const je = objekt[`${feld}Je`];
    return (typeof je === 'function' ? je(antworten) : null) || objekt[feld];
};
const BLICK = {aussen: 'von außen', innen: 'von innen'};
// Blickseite: ohne sie ist „steht vor“ oder „links eng“ zweideutig (Umbauplan B2/B3)
const blickZeile = (frage, antworten) => (frage.blick
    ? `<p class="unterzeile">Blickrichtung: ${esc(BLICK[frage.blick])} auf ${esc(globalThis.H2Fragen.elementWort(antworten))}.</p>`
    : '');
const fragenById = new Map(finder.fragen.map((f) => [f.id, f]));

// ---------- Zustand speichern und teilen ----------
function speichern() {
    const daten = JSON.stringify({a: state.antworten, v: state.verlauf});
    try {
        localStorage.setItem(SPEICHER, daten);
    } catch {
        // privater Modus: ohne Speicherung weiter
    }
    if (typeof history !== 'undefined' && history.replaceState) {
        const hash = state.verlauf.length ? `#s=${encodeURIComponent(daten)}` : ' ';
        history.replaceState(null, '', hash === ' ' ? location.pathname + location.search : hash);
    }
}

function laden() {
    let roh = null;
    const treffer = typeof location !== 'undefined' && location.hash.match(/^#s=(.+)$/);
    if (treffer) roh = decodeURIComponent(treffer[1]);
    else {
        try {
            roh = localStorage.getItem(SPEICHER);
        } catch {
            roh = null;
        }
    }
    if (!roh) return;
    try {
        const daten = JSON.parse(roh);
        const antworten = {};
        const verlauf = [];
        for (const id of Array.isArray(daten.v) ? daten.v : []) {
            if (fragenById.has(id) && id in daten.a) {
                antworten[id] = daten.a[id];
                verlauf.push(id);
            }
        }
        Object.assign(state, {antworten, verlauf});
    } catch {
        // beschädigter Stand: neu beginnen
    }
}

// ---------- Aktionen ----------
function beantworte(id, wert) {
    state.antworten[id] = wert;
    state.verlauf = [...state.verlauf.filter((x) => x !== id), id];
    // Wer die Tür gegen ein Fenster tauscht, soll keine Türantworten mitschleppen:
    // Antworten auf Fragen, die jetzt nicht mehr zur Situation passen, fallen weg.
    for (const frage of finder.fragen) {
        if (frage.id === id || state.antworten[frage.id] === undefined) continue;
        if (frage.zeigen && !frage.zeigen(state.antworten)) {
            delete state.antworten[frage.id];
            state.verlauf = state.verlauf.filter((x) => x !== frage.id);
        }
    }
    speichern();
    zeichne(true);
}

// Ein Abschnitt lässt sich überspringen: „Weiß ich nicht“ schließt nie aus, sondern
// erzeugt Prüfpunkte fürs Aufmaß. Damit bleibt der Verlauf schnell.
function ueberspringe(nr) {
    for (const abschnitt of finder.abschnitte(state.antworten)) {
        if (String(abschnitt.nr) !== String(nr)) continue;
        for (const eintrag of abschnitt.eintraege) {
            if (eintrag.beantwortet || eintrag.frage.pflicht) continue;
            setzeOffen(eintrag.frage);
        }
    }
    speichern();
    zeichne(true);
}

// Der Wert, mit dem eine übersprungene Frage beantwortet wird. Keiner davon schließt je aus:
// „Weiß ich nicht“ und „später messen“ erzeugen Prüfpunkte fürs Aufmaß.
const offenerWert = (frage) => (frage.typ === 'mehrfach' ? [] : frage.typ === 'mass' ? SPAETER : UNBEKANNT);

function setzeOffen(frage) {
    state.antworten[frage.id] = offenerWert(frage);
    state.verlauf = [...state.verlauf.filter((x) => x !== frage.id), frage.id];
}

// Alle Maßfragen auf einmal offen lassen. Der Verlauf geht danach mit den übrigen Fragen weiter.
function ueberspringeMasse() {
    // Eine beantwortete Frage kann die nächste sichtbar machen, deshalb mehrere Durchgänge.
    for (let runde = 0; runde < 12; runde++) {
        const masse = finder.offeneFragen(state.antworten).filter((x) => x.frage.typ === 'mass' && !x.frage.pflicht);
        if (!masse.length) break;
        for (const eintrag of masse) setzeOffen(eintrag.frage);
    }
    speichern();
    zeichne(true);
}

// Die genaue Auswahl ganz umgehen: alles Freiwillige bleibt offen, das Ergebnis erscheint sofort.
// Pflichtfragen (Element, Fenstertyp, Auflage) bleiben stehen – ohne sie gibt es keinen Pool.
function ueberspringeAlles() {
    for (let runde = 0; runde < 12; runde++) {
        const offen = finder.offeneFragen(state.antworten).filter((x) => !x.frage.pflicht);
        if (!offen.length) break;
        for (const eintrag of offen) setzeOffen(eintrag.frage);
    }
    speichern();
    zeichne();
    zeigeStelle('ergebnis');
}

function neu() {
    Object.assign(state, {antworten: {}, verlauf: []});
    speichern();
    zeichne(true);
}

// Zu einer Frage oder zum Ergebnis scrollen, ohne den Verlauf zu verlassen
function zeigeStelle(id) {
    const ziel = typeof document !== 'undefined' && document.getElementById ? document.getElementById(id) : null;
    if (!ziel) return;
    if (ziel.scrollIntoView) ziel.scrollIntoView({behavior: ruhig() ? 'auto' : 'smooth', block: 'start'});
    const titel = ziel.querySelector ? ziel.querySelector('h2, h3') : null;
    if (titel && titel.focus) titel.focus({preventScroll: true});
}

// ---------- Verlauf ----------
function anzahlMit(id, wert) {
    return finder.ergebnis({...state.antworten, [id]: wert}).alle.length;
}

// Eine Frage als Block im Verlauf. Beantwortete Blöcke bleiben stehen und sind änderbar.
function frageHtml(eintrag, erste) {
    const {frage} = eintrag;
    const antw = state.antworten;
    const alt = antw[frage.id];
    const frageText = jeText(frage, 'frage', antw);
    const hilfeText = jeText(frage, 'hilfe', antw);
    const blick = blickZeile(frage, antw);
    const sortierhinweis = eintrag.nurSortierung
        ? '<p class="unterzeile">Ändert nur die Reihenfolge – es fällt keine Lösung weg.</p>'
        : '';
    const kopf = '';
    const hilfe = hilfeText || frage.skizze
        ? `<details class="hilfe"><summary>Wie erkenne ich das?</summary><div class="hilfe-inhalt">${skizze(frage.skizze, 'skizze gross')}${hilfeText ? `<p>${esc(hilfeText)}</p>` : ''}</div></details>`
        : '';
    // Die erste offene Frage trägt die Sprungmarke, damit der Fokus dorthin wandert
    const legende = `<legend><h3 ${erste ? 'id="frage-titel" ' : ''}tabindex="-1">${esc(frageText)}</h3></legend>`;

    if (frage.typ === 'mass') {
        // Schätzen reicht: Die Klassen sortieren und warnen, ausschließen kann nur ein gemessener Wert.
        const klassen = (frage.klassen || []).map((k) => `<label class="karte ${alt === k.id ? 'aktiv' : ''}">
              <input type="radio" name="antwort" value="${k.id}" ${alt === k.id ? 'checked' : ''}>
              ${skizze(k.skizze)}
              <span class="karte-text"><strong>${esc(k.text)}</strong><small>${esc(k.hinweis)}</small></span>
            </label>`).join('');
        const genau = `<details class="hilfe genau" ${typeof alt === 'number' ? 'open' : ''}><summary>Genau messen (freiwillig)</summary>
            <div class="hilfe-inhalt"><label class="mass-feld"><span class="sr">${esc(frageText)}</span>
              <input name="wert" type="number" inputmode="decimal" min="0" max="10000" step="0.5" value="${typeof alt === 'number' ? alt : ''}" aria-describedby="mass-einheit-${frage.id}">
              <span id="mass-einheit-${frage.id}">${esc(frage.einheit)}</span>
            </label>
            <p class="unterzeile">Ein eingetragenes Maß kann eine Lösung ausschließen, eine Schätzung nie.</p></div></details>`;
        return `${kopf}<form class="frage ${eintrag.beantwortet ? 'beantwortet' : ''}" id="frage-${frage.id}" data-frage="${frage.id}" data-typ="mass" novalidate>
          <fieldset>${legende}${blick}${sortierhinweis}${hilfe}
            <div class="karten">${klassen}<label class="karte karte-unbekannt ${alt === SPAETER ? 'aktiv' : ''}">
              <input type="radio" name="antwort" value="${SPAETER}" ${alt === SPAETER ? 'checked' : ''}>
              <span class="skizze frage-zeichen" aria-hidden="true">?</span>
              <span class="karte-text"><strong>Später beim Aufmaß</strong><small>kommt auf die Prüfliste</small></span>
            </label></div>
            ${genau}
          </fieldset></form>`;
    }

    if (frage.typ === 'mehrfach') {
        const gewaehlt = new Set(Array.isArray(alt) ? alt : []);
        const karten = eintrag.antworten.map((a) => `<label class="karte ${gewaehlt.has(a.id) ? 'aktiv' : ''}">
              <input type="checkbox" name="wunsch" value="${a.id}" ${gewaehlt.has(a.id) ? 'checked' : ''}>
              <span class="karte-text"><strong>${esc(a.text)}</strong></span></label>`).join('');
        return `${kopf}<form class="frage ${eintrag.beantwortet ? 'beantwortet' : ''}" id="frage-${frage.id}" data-frage="${frage.id}" data-typ="mehrfach">
          <fieldset>${legende}${blick}<p class="unterzeile">Mehrfachauswahl möglich. Das ändert nur die Hinweise zum Gewebe.</p>${hilfe}
            <div class="karten">${karten}</div>
          </fieldset></form>`;
    }

    const karten = eintrag.antworten.map((a) => {
        const n = anzahlMit(frage.id, a.id);
        const hinweis = jeText(a, 'hinweis', antw);
        const gesperrt = a.moeglich === false || (frage.id === 'system' && a.system !== 'egal' && n === 0);
        const grund = a.grund || 'keine Lösung für deine Angaben';
        return `<label class="karte ${alt === a.id ? 'aktiv' : ''} ${gesperrt ? 'gesperrt' : ''}">
            <input type="radio" name="antwort" value="${a.id}" ${alt === a.id ? 'checked' : ''} ${gesperrt ? 'disabled' : ''}>
            ${skizze(a.skizze)}
            <span class="karte-text"><strong>${esc(a.text)}</strong>${hinweis ? `<small>${esc(hinweis)}</small>` : ''}
              ${gesperrt ? `<small class="grund">${esc(grund)}</small>` : ''}</span>
            <span class="zahl" aria-label="${n} passende Lösungen">${n}</span>
          </label>`;
    }).join('');
    const unbekannt = frage.weissNicht === false ? '' : `<label class="karte karte-unbekannt ${alt === UNBEKANNT ? 'aktiv' : ''}">
          <input type="radio" name="antwort" value="${UNBEKANNT}" ${alt === UNBEKANNT ? 'checked' : ''}>
          <span class="skizze frage-zeichen" aria-hidden="true">?</span>
          <span class="karte-text"><strong>Weiß ich nicht</strong><small>kommt auf die Prüfliste fürs Aufmaß</small></span>
        </label>`;
    return `${kopf}<form class="frage ${eintrag.beantwortet ? 'beantwortet' : ''}" id="frage-${frage.id}" data-frage="${frage.id}" data-typ="eins">
      <fieldset>${legende}${blick}${sortierhinweis}${hilfe}
        <div class="karten">${karten}${unbekannt}</div>
      </fieldset></form>`;
}

// Zwei Abkürzungen, die überall im Verlauf erreichbar sind:
// „Ohne genaue Maße“ überspringt nur die Maßfragen, „Direkt zum Ergebnis“ alles Freiwillige.
function schnellwahlHtml() {
    if (!state.antworten.element) return '';
    const offen = finder.offeneFragen(state.antworten);
    // Ohne Element, Fenstertyp oder Auflage gibt es keinen Pool – diese Fragen lassen sich nicht überspringen.
    if (offen.some((x) => x.frage.pflicht)) return '';
    const masse = offen.filter((x) => x.frage.typ === 'mass').length;
    const rest = offen.length;
    if (!rest) return '';
    // Übersprungene Maße verschwinden aus dem Verlauf, bis ihr Abschnitt an der Reihe ist.
    // Ohne diese Rückmeldung sähe der Knopf wirkungslos aus.
    const bereitsOffen = state.verlauf.filter((id) => state.antworten[id] === SPAETER).length;
    return `<div class="schnellwahl">
        <p class="schnell-text">Keine Lust auf alle Fragen? Offen gelassene Angaben schließen nie eine Lösung aus – sie kommen auf die Prüfliste fürs Aufmaß.</p>
        ${bereitsOffen ? `<p class="schnell-erledigt">${bereitsOffen} ${bereitsOffen === 1 ? 'Maß bleibt' : 'Maße bleiben'} offen und ${bereitsOffen === 1 ? 'steht' : 'stehen'} im Ergebnis auf der Prüfliste.</p>` : ''}
        <div class="schnell-knoepfe">
          ${masse ? `<button type="button" class="neben schnell-knopf" data-aktion="masse-ueberspringen">Ohne genaue Maße weiter<small>${masse} ${masse === 1 ? 'Maßfrage' : 'Maßfragen'} überspringen</small></button>` : ''}
          <button type="button" class="haupt schnell-knopf" data-aktion="schnell">Direkt zum Ergebnis<small>alle ${rest} offenen Fragen später klären</small></button>
        </div>
      </div>`;
}

function verlaufHtml() {
    const abschnitte = finder.abschnitte(state.antworten);
    const sichtbare = abschnitte.filter((x) => x.bereit);
    const gezeigt = sichtbare.reduce((n, x) => n + x.eintraege.length, 0);
    const beantwortet = sichtbare.reduce((n, x) => n + x.eintraege.filter((e) => e.beantwortet).length, 0);
    const offenGesamt = abschnitte.reduce((n, x) => n + x.offen, 0);
    const prozent = gezeigt ? Math.round((beantwortet / (beantwortet + Math.max(offenGesamt, 0) || 1)) * 100) : 0;
    let erste = true;
    const stuecke = sichtbare.map((abschnitt) => {
        const fragen = abschnitt.eintraege.map((eintrag) => {
            const html = frageHtml(eintrag, erste && !eintrag.beantwortet);
            if (erste && !eintrag.beantwortet) erste = false;
            return html;
        }).join('');
        const offeneEintraege = abschnitt.eintraege.filter((e) => !e.beantwortet && !e.frage.pflicht);
        const rest = offeneEintraege.length;
        const nurMasse = rest > 0 && offeneEintraege.every((e) => e.frage.typ === 'mass');
        return `<section class="abschnitt" id="abschnitt-${abschnitt.nr}">
            <div class="abschnitt-kopf">
              <p class="abschnitt-nr">Abschnitt ${abschnitt.nr} von ${abschnitte.length}</p>
              <h2 tabindex="-1">${esc(abschnitt.titel)}</h2>
              ${abschnitt.hinweis ? `<p class="unterzeile">${esc(abschnitt.hinweis)}</p>` : ''}
            </div>
            ${fragen}
            ${rest >= 1 ? `<button type="button" class="neben ueberspringen" data-aktion="${nurMasse ? 'masse-ueberspringen' : 'ueberspringen'}" data-abschnitt="${abschnitt.nr}">${
                nurMasse ? 'Ohne genaue Maße weiter' : 'Rest überspringen'} – kommt auf die Prüfliste</button>` : ''}
          </section>`;
    }).join('');
    const naechster = abschnitte.find((x) => !x.bereit);
    const ausblick = naechster
        ? `<p class="ausblick">Danach kommt: ${esc(naechster.titel)}</p>`
        : '';
    return `<div class="balken" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${prozent}" aria-label="Fortschritt"><span style="width:${prozent}%"></span></div>
      ${schnellwahlHtml()}${stuecke}${ausblick}`;
}

function antwortText(id) {
    const frage = fragenById.get(id);
    const wert = state.antworten[id];
    if (wert === UNBEKANNT) return 'weiß ich nicht';
    if (wert === SPAETER) return 'später messen';
    if (typeof wert === 'number') return `${String(wert).replace('.', ',')} ${frage.einheit} gemessen`;
    const klasse = (frage.klassen || []).find((k) => k.id === wert);
    if (klasse) return `${klasse.text} (geschätzt)`;
    if (Array.isArray(wert)) return wert.length ? wert.map((w) => frage.antworten.find((a) => a.id === w)?.text).join(', ') : 'keine';
    return frage.antworten?.find((a) => a.id === wert)?.text ?? String(wert);
}

// ---------- Ergebnis ----------
// Abgleich: Haken, Kreuz, Fragezeichen – das Zeichen steht nie allein, daneben immer ein Wort
const URTEIL = {
    ja: {zeichen: '✓', wort: 'passt'},
    nein: {zeichen: '✗', wort: 'passt nicht'},
    offen: {zeichen: '?', wort: 'offen'},
    neutral: {zeichen: '?', wort: 'keine Angabe'},
};

function abgleichZeile(z) {
    const u = URTEIL[z.urteil] || URTEIL.neutral;
    const frage = fragenById.get(z.frage);
    return `<li class="urteil-${z.urteil}"><span class="zeichen" aria-hidden="true">${u.zeichen}</span>
        <span class="abgleich-text"><b>${esc(frage.frage.replace(/\?$/, ''))}:</b> ${esc(antwortText(z.frage))}
        <small><span class="sr">${esc(u.wort)}. </span>${esc(z.text)}</small></span></li>`;
}

function abgleichHtml(b) {
    const zeilen = (b.abgleich || []).filter((z) => fragenById.has(z.frage));
    if (!zeilen.length) return '';
    // Angaben, zu denen der Katalog nichts sagt, sind kein Mangel: zusammengefasst statt Zeile für Zeile
    const wichtig = zeilen.filter((z) => z.urteil !== 'neutral');
    const neutral = zeilen.filter((z) => z.urteil === 'neutral');
    const rest = neutral.length
        ? `<details class="abgleich-rest"><summary>${neutral.length} Angaben, zu denen der Katalog bei dieser Lösung nichts sagt</summary>
             <ul class="abgleich">${neutral.map(abgleichZeile).join('')}</ul></details>`
        : '';
    return `<h3>Deine Angaben im Abgleich</h3>${wichtig.length ? `<ul class="abgleich">${wichtig.map(abgleichZeile).join('')}</ul>` : ''}${rest}`;
}

function eigenschaftenHtml(v) {
    const liste = globalThis.H2Eigenschaften ? globalThis.H2Eigenschaften.eigenschaften(v) : [];
    if (!liste.length) return '';
    return `<h3>Eigenschaften dieser Lösung</h3><ul class="eigenschaften">${liste.map((e) =>
        `<li><b>${esc(e.titel)}:</b> ${esc(e.text)}${e.quelle ? ` <small>(laut ${esc(e.quelle)})</small>` : ''}</li>`).join('')}</ul>`;
}
function warumZuerstHtml(r) {
    const w = r.warumZuerst;
    if (!w) return '';
    return `<div class="warum-zuerst"><h3>Warum diese zuerst?</h3>
        <p>${esc(w.stufe)}.</p>
        ${w.gegen ? `<p>Gegenüber <strong>${esc(w.gegen)}</strong>: ${esc(w.grund)}</p>` : `<p>${esc(w.grund)}</p>`}</div>`;
}

// Der Weg zur Empfehlung in vier Sätzen – damit nachvollziehbar ist, was der Finder tut
function herkunftHtml(v) {
    const h = globalThis.H2Eigenschaften?.herkunft?.(v);
    if (!h) return '';
    const warnung = h.sicherheit === 'unsicher' || h.sicherheit === 'keine';
    return `<div class="herkunft${warnung ? ' achtung' : ''}">
      <b>Diese Variante hat im Hauptkatalog kein eigenes Datenblatt.</b>
      ${esc(h.unterschied)}
      ${h.von ? `<br>Die Maße unten stammen von <b>${esc(h.von)}</b> – ${esc(h.einordnung)}.`
              : `<br>${esc(h.einordnung)}`}
      <br><small>${esc(h.beleg)}</small>
    </div>`;
}

function katalogHinweiseHtml(v) {
    const zeilen = globalThis.H2Eigenschaften?.katalogHinweise?.(v) || [];
    if (!zeilen.length) return '';
    const geerbt = zeilen.some((z) => z.verweis);
    return `<details><summary>Worauf beim Aufmaß zu achten ist (${zeilen.length})</summary>
      <table class="hinweise"><thead><tr><th>Marker</th><th>Bedingung laut Katalog</th><th>Wenn nicht erfüllt</th></tr></thead><tbody>
      ${zeilen.map((z) => `<tr><td>${esc(z.marker || '–')}</td><td>${esc(z.text)}${
          z.verweis ? ` <small>(über den Verweis auf ${esc(z.verweis)})</small>` : ''}</td><td>${esc(z.alternativ || '—')}</td></tr>`).join('')}
      </tbody></table>
      <p class="klein">Der Marker ist der rote Buchstabe in der Katalogzeichnung – er zeigt, wo gemessen wird.${
          geerbt ? ' Zeilen mit Verweis stehen auf der Seite der Grundvariante.' : ''}</p>
    </details>`;
}

function wegHtml(r) {
    const aus = r.ausgeschlossen.length;
    return `<details class="liste weg"><summary>Wie ich auf diese Lösung komme</summary>
      <ol class="weg-liste">
        <li><b>Auswahl nach Element und Bedienart.</b> Übrig bleiben die Varianten, die laut Katalog für dein Element gebaut sind.</li>
        <li><b>Ausschließen nur mit Beleg.</b> Eine Lösung fällt raus, wenn Rudi sie ausschließt (A1), der Katalog sie wörtlich ausschließt (A2), ein <em>gemessenes</em> Maß außerhalb der Katalog-Grenze liegt (A3), eine Voraussetzung nachweislich fehlt (A4) oder du eine andere Bedienart bzw. einen anderen Montageort gewählt hast (A5). Hier waren das ${aus} Varianten – alle mit Grund und Quelle nachlesbar.</li>
        <li><b>Sortieren statt aussieben.</b> Alles andere bleibt und wird geordnet: zuerst Rudis Lösung für deine Situation, dann der Einsatzzweck aus dem Hauptkatalog, dann was technisch möglich ist.</li>
        <li><b>Offene Angaben schließen nichts aus.</b> „Weiß ich nicht“ und Schätzungen machen die Reihenfolge unsicherer, nie eine Lösung unmöglich – sie werden zu Prüfpunkten fürs Aufmaß.</li>
      </ol>
      <p class="unterzeile">Es bleiben ${r.alle.length} mögliche Lösungen. Die Reihenfolge entscheidet sich der Reihe nach über: Stufe → Einsatzzweck → offene Merkmale → passende Angaben → Grenzwerte → Prüfpunkte → Rudis Qualitätshinweis → sichtbare Befestigung.</p>
    </details>`;
}

function loesungHtml(b, rang, warumZuerst = '') {
    const v = b.variante;
    const pruef = [...new Map(b.pruefpunkte.map((p) => [p.text, p])).values()];
    const rudi = b.rudi;
    const konflikte = (rudi?.konflikte || []).map((k) => `<li><b>${esc(k)}:</b> ${esc(finder.KONFLIKTE[k] || '')}</li>`).join('');
    const quellen = [
        rudi ? 'Rudis Empfehlung' : null,
        v.hk?.seite ? `Hauptkatalog S. ${v.hk.seite}${
            text(v.hk.datei) ? ` (${text(v.hk.datei).replace(/\.pdf$/, '')})` : ''}` : null,
    ].filter(Boolean).join(' · ');
    const titel = [v.titel, v.untertitel].filter(Boolean).join(' – ');
    const zweck = v.empfehlungWoertlich && v.empfehlung ? v.empfehlung : v.hk?.zweck;
    return `<article class="loesung ${rang === 0 ? 'empfohlen' : ''}">
      <p class="rang">${rang === 0 ? 'H2-Empfehlung' : 'Weitere Lösung'} · ${esc(STUFE[b.stufe])}</p>
      <h2 class="code">${esc(v.code)}</h2>
      <p class="titel">${esc(titel)}</p>
      ${zweck ? `<p class="zweck">für ${esc(zweck.replace(/^für /, ''))}</p>` : ''}
      <p class="status status-${b.status}">${b.status === 'passt' ? '✓ Passt zu deinen Angaben' : '✓ Passt – beim Aufmaß prüfen'}</p>
      ${rudi ? `<p class="warum-rudi">Rudis Lösung für: ${esc([rudi.gruppe, rudi.untergruppe, rudi.situation].filter(Boolean).join(' › '))}</p>` : ''}
      ${warumZuerst}
      ${abgleichHtml(b)}
      ${herkunftHtml(v)}
      ${eigenschaftenHtml(v)}
      ${katalogHinweiseHtml(v)}
      ${v.darstellung ? `<p class="einbau">Einbauweise: ${esc(v.darstellung)}</p>` : ''}
      ${pruef.length ? `<h3>Beim Aufmaß prüfen</h3><ul class="pruefliste">${pruef.map((p) => `<li>${esc(p.text)}</li>`).join('')}</ul>` : ''}
      ${rudi?.hinweise?.length || rudi?.qualitaet ? `<h3>Rudis Hinweis</h3><ul class="warum">${(rudi.hinweise || []).map((h) => `<li>${esc(h)}</li>`).join('')}${rudi.qualitaet ? `<li>${esc(rudi.qualitaet)}</li>` : ''}</ul>` : ''}
      ${konflikte ? `<h3>Zu beachten</h3><ul class="warum">${konflikte}</ul>` : ''}
      ${v.hinweise.length ? `<details><summary>Hinweise aus dem Katalog (${v.hinweise.length})</summary><ul>${v.hinweise.map((h) => `<li>${esc(h)}</li>`).join('')}</ul></details>` : ''}
      ${v.alternativen.length ? `<details><summary>Alternativen laut Katalog (${v.alternativen.length})</summary><ul>${v.alternativen.map((a) => `<li>${esc(a.wenn)} → <b>${esc(a.dann)}</b></li>`).join('')}</ul></details>` : ''}
      <p class="quelle">${esc(quellen)}${v.preisliste ? ` · Preisliste ${esc(v.preisliste)}` : ''}</p>
    </article>`;
}

function ausschlussHtml(b) {
    const v = b.variante;
    return `<li><strong>${esc(v.code)}</strong> ${esc(v.titel || '')}<ul>${b.gruende.map((g) => `<li><span class="art">${esc(g.art)} · ${esc(ART[g.art])}</span> ${esc(g.text)}${g.zitat ? ` – „${esc(g.zitat)}“` : ''} <small>(${esc(g.quelle)})</small></li>`).join('')}</ul></li>`;
}

function ergebnisHtml() {
    const r = finder.ergebnis(state.antworten);
    const offen = finder.naechsteFrage(state.antworten);
    let html = `<div class="ergebnis-kopf">
        <h2 ${offen ? '' : 'id="frage-titel" '}tabindex="-1" class="ergebnis-titel">${r.empfehlung ? (offen ? 'Vorläufige Empfehlung' : 'Deine Produktempfehlung') : 'Keine passende Lösung'}</h2>
        <button type="button" class="neben" data-aktion="teilen">Zusammenfassung teilen</button>
      </div>`;
    if (offen) html += `<p class="hinweis-box">Das Ergebnis wächst mit: ${finder.offeneFragen(state.antworten).length} Fragen sind noch offen. Jede weitere Antwort macht die Empfehlung sicherer.</p>`;
    const unbekannt = state.verlauf.filter((id) => state.antworten[id] === UNBEKANNT).length;
    if (!offen && unbekannt >= 3) html += `<p class="hinweis-box">${unbekannt} Angaben sind unbekannt. Alle gezeigten Lösungen sind möglich, die Reihenfolge ist aber unsicher – beim Aufmaß die Prüfliste abarbeiten.</p>`;
    if (!r.empfehlung) {
        const ursachen = new Map();
        for (const b of r.ausgeschlossen) for (const g of b.gruende) if (g.frage) ursachen.set(g.frage, (ursachen.get(g.frage) || 0) + 1);
        html += `<p>Alle Varianten sind nach deinen Angaben ausgeschlossen. Diese Antworten haben dazu geführt:</p>
          <div class="chips">${[...ursachen.entries()].map(([id, n]) => `<button type="button" class="chip" data-aktion="bearbeiten" data-frage="${id}">${esc(fragenById.get(id).frage)} – ${esc(antwortText(id))} (${n})</button>`).join('')}
          ${state.antworten.system ? '<button type="button" class="chip" data-aktion="bearbeiten" data-frage="system">Bedienart ändern</button>' : ''}</div>`;
    } else {
        html += loesungHtml(r.empfehlung, 0, warumZuerstHtml(r));
        html += r.weitere.map((b, i) => loesungHtml(b, i + 1)).join('');
        if (r.alle.length > 3) html += `<details class="liste"><summary>Alle ${r.alle.length} passenden Lösungen</summary><ol>${r.alle.map((b) => `<li><strong>${esc(b.variante.code)}</strong> ${esc(b.variante.titel || '')}${b.variante.empfehlung ? ` – ${esc(b.variante.empfehlung)}` : ''} <small>(${esc(STUFE[b.stufe])})</small></li>`).join('')}</ol></details>`;
    }
    if (r.notizen.length) html += `<section class="notizen"><h2>Gewebe und Zubehör</h2>${r.notizen.map((n) => `<p>${esc(n)}</p>`).join('')}</section>`;
    // Technisch ausgeschlossen (A1–A4) getrennt von „andere Bedienart“ (A5): A5 heißt nicht „ungeeignet“
    const technisch = r.ausgeschlossen.filter((b) => b.gruende.some((g) => g.art !== 'A5'));
    const bedienart = r.ausgeschlossen.length - technisch.length;
    if (technisch.length) html += `<details class="liste ausgeschlossen"><summary>Ausgeschlossen, weil … (${technisch.length})</summary><ul>${technisch.map(ausschlussHtml).join('')}</ul></details>`;
    if (bedienart) {
        // A5 heißt „so nicht gewünscht“, nicht „technisch ungeeignet“ – das gilt für Bedienart,
        // Öffnungsrichtung und seit dem Katalogabgleich auch für den Montageort.
        const ziel = state.antworten.einbauweise ? 'einbauweise' : state.antworten.richtung && state.antworten.system === 'dreh' ? 'richtung' : 'system';
        const wort = {einbauweise: 'Montageort', richtung: 'Öffnungsrichtung', system: 'Bedienart'}[ziel];
        html += `<p class="ausgeblendet">${bedienart} Varianten mit anderer Bedienart oder anderem Montageort ausgeblendet (nicht ungeeignet). <button type="button" class="link" data-aktion="bearbeiten" data-frage="${ziel}">${esc(wort)} ändern</button></p>`;
    }
    if (r.empfehlung) html += wegHtml(r);
    html += '<p class="schluss">Die Vorauswahl ersetzt kein Aufmaß. Bestellmaße, Einbauluft und Zusatzausstattung an der gewählten Variante prüfen.</p>';
    return html;
}

function vorschauHtml() {
    const r = finder.ergebnis(state.antworten);
    if (!state.antworten.element) return '<p class="vorschau-leer">Nach der ersten Antwort erscheinen hier die passenden Lösungen.</p>';
    return `<h2>${r.alle.length} passende Lösungen</h2><ol class="vorschau-liste">${r.alle.slice(0, 5).map((b) => `<li><strong>${esc(b.variante.code)}</strong><span>${esc(b.variante.empfehlung || b.variante.titel || '')}</span></li>`).join('')}</ol>
      ${r.ausgeschlossen.length ? `<p class="vorschau-aus">${r.ausgeschlossen.filter((b) => b.gruende.some((g) => g.art !== 'A5')).length} ausgeschlossen · ${r.ausgeschlossen.filter((b) => b.gruende.every((g) => g.art === 'A5')).length} andere Bedienart</p>` : ''}
      <button type="button" class="neben" data-aktion="ergebnis">Ergebnis ansehen</button>`;
}

function leisteHtml() {
    const n = finder.ergebnis(state.antworten).alle.length;
    const offeneListe = finder.offeneFragen(state.antworten);
    const offen = offeneListe.length;
    // Der Sprung ans Ende ist nur sinnvoll, wenn keine Pflichtfrage mehr aussteht
    const abkuerzen = offen > 0 && !offeneListe.some((x) => x.frage.pflicht);
    return `<span class="leiste-zahl" aria-live="polite"><b>${n}</b> passende Lösungen${offen ? ` · ${offen} Fragen offen` : ''}</span>
      ${abkuerzen ? '<button type="button" class="neben leiste-schnell" data-aktion="schnell">Rest überspringen</button>' : ''}
      <button type="button" class="haupt" data-aktion="ergebnis" ${state.antworten.element ? '' : 'disabled'}>Zum Ergebnis</button>`;
}

function zeichne(fokus = false) {
    const verlauf = el('verlauf');
    verlauf.innerHTML = `${verlaufHtml()}<section class="ergebnis" id="ergebnis">${ergebnisHtml()}</section>`;
    el('vorschau').innerHTML = vorschauHtml();
    el('leiste').innerHTML = leisteHtml();
    el('leiste').hidden = !state.antworten.element;
    const neuKnopf = document.querySelector('[data-aktion="neu"]');
    if (neuKnopf) neuKnopf.hidden = !state.verlauf.length;
    // Der Fokus wandert zur nächsten offenen Frage, nicht an den Seitenanfang
    if (fokus) {
        const titel = verlauf.querySelector('#frage-titel');
        if (titel && titel.focus) titel.focus({preventScroll: true});
        if (titel && titel.scrollIntoView) titel.scrollIntoView({behavior: ruhig() ? 'auto' : 'smooth', block: 'center'});
    }
}

// ---------- Teilen ----------
function zusammenfassung() {
    const r = finder.ergebnis(state.antworten);
    const zeilen = ['H2 Produktfinder'];
    if (r.empfehlung) {
        const v = r.empfehlung.variante;
        zeilen.push(`Empfehlung: ${v.code} – ${[v.titel, v.untertitel].filter(Boolean).join(' – ')}`);
        if (v.empfehlung) zeilen.push(`für ${v.empfehlung.replace(/^für /, '')}`);
        const pruef = [...new Set(r.empfehlung.pruefpunkte.map((p) => p.text))];
        if (pruef.length) zeilen.push('', 'Beim Aufmaß prüfen:', ...pruef.map((p) => `- ${p}`));
        if (r.weitere.length) zeilen.push('', `Weitere Lösungen: ${r.weitere.map((b) => b.variante.code).join(', ')}`);
    } else {
        zeilen.push('Keine passende Lösung.');
    }
    zeilen.push('', 'Angaben:', ...state.verlauf.map((id) => `- ${fragenById.get(id).frage} ${antwortText(id)}`));
    if (typeof location !== 'undefined') zeilen.push('', location.href);
    return zeilen.join('\n');
}

async function teilen(knopf) {
    const text = zusammenfassung();
    try {
        if (navigator.share) {
            await navigator.share({title: 'H2 Produktfinder', text});
            return;
        }
        await navigator.clipboard.writeText(text);
        if (knopf) knopf.textContent = 'In die Zwischenablage kopiert';
    } catch {
        if (knopf) knopf.textContent = 'Teilen nicht möglich';
    }
}

// ---------- Ereignisse ----------
document.addEventListener('click', (event) => {
    const ziel = event.target.closest('[data-aktion]');
    if (ziel && !ziel.disabled) {
        const aktion = ziel.dataset.aktion;
        if (aktion === 'neu') neu();
        else if (aktion === 'ergebnis') zeigeStelle('ergebnis');
        else if (aktion === 'bearbeiten') zeigeStelle(`frage-${ziel.dataset.frage}`);
        else if (aktion === 'ueberspringen') ueberspringe(ziel.dataset.abschnitt);
        else if (aktion === 'masse-ueberspringen') ueberspringeMasse();
        else if (aktion === 'schnell') ueberspringeAlles();
        else if (aktion === 'antwort') beantworte(ziel.dataset.frage, ziel.dataset.wert);
        else if (aktion === 'teilen') teilen(ziel);
    }
});

// Auswählen beantwortet die Frage – mit Maus, Finger und Tastatur gleichermaßen.
// Deshalb gibt es keinen „Weiter“-Knopf mehr.
document.addEventListener('change', (event) => {
    const input = event.target;
    const form = input.closest && input.closest('form[data-frage]');
    if (!form || input.disabled) return;
    const id = form.dataset.frage;
    if (input.type === 'radio') return beantworte(id, input.value);
    if (input.type === 'checkbox') return beantworte(id, [...form.querySelectorAll('input:checked')].map((i) => i.value));
    if (input.name === 'wert') {
        const wert = Number(String(input.value).replace(',', '.'));
        return beantworte(id, input.value !== '' && Number.isFinite(wert) && wert >= 0 ? wert : SPAETER);
    }
});

document.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-frage]');
    if (!form) return;
    event.preventDefault();
    const id = form.dataset.frage;
    if (form.dataset.typ === 'mass') {
        const feld = form.querySelector('input[name="wert"]');
        const wert = Number(String(feld ? feld.value : '').replace(',', '.'));
        if (feld && feld.value !== '' && Number.isFinite(wert) && wert >= 0) return beantworte(id, wert);
        const gewaehlt = form.querySelector('input:checked');
        return beantworte(id, gewaehlt ? gewaehlt.value : SPAETER);
    }
    if (form.dataset.typ === 'mehrfach') return beantworte(id, [...form.querySelectorAll('input:checked')].map((i) => i.value));
    const gewaehlt = form.querySelector('input:checked');
    if (gewaehlt) beantworte(id, gewaehlt.value);
});

laden();
zeichne();
// Geteilten Link in einem offenen Tab einfügen: Stand aus dem Link übernehmen
if (typeof addEventListener === 'function') addEventListener('hashchange', () => {
    if (!location.hash.startsWith('#s=')) return;
    laden();
    zeichne(true);
});
el('version').textContent = `${finder.varianten.length} Varianten · Version ${VERSION}`;
if (typeof navigator !== 'undefined' && navigator.serviceWorker && typeof location !== 'undefined' && location.protocol.startsWith('http'))
    navigator.serviceWorker.register('sw.js').catch(() => {});
})();
