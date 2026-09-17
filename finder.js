// Oberfläche des Produktfinders (Phase 5): eine Frage pro Bildschirm, Ergebnis mit Begründung.
// Logik: engine.js · Fragen: fragen.js · Daten: daten/finder-daten.js · Skizzen: skizzen.js
(function () {
'use strict';

const {erstelleFinder, UNBEKANNT, SPAETER} = globalThis.H2Engine;
const finder = erstelleFinder(globalThis.H2Daten, globalThis.H2Fragen);
globalThis.H2Finder = {finder};
if (typeof document === 'undefined') return;

const SPEICHER = 'h2-produktfinder-3';
const VERSION = '3.0';
const ART = {
    A1: 'Praxis-Ausschluss (Rudi)',
    A2: 'laut Katalog nicht geeignet',
    A3: 'Grenzwert verletzt',
    A4: 'Voraussetzung fehlt',
    A5: 'anderer Bedienwunsch',
};
const STUFE = {
    1: 'Rudis Lösung für diese Situation',
    2: 'Rudis Lösung, noch nicht alle Angaben bekannt',
    3: 'Einsatzzweck laut Hauptkatalog passt',
    4: 'laut Hauptkatalog technisch möglich',
    5: 'Sonderlösung aus dem Masterkatalog – Rücksprache',
};

const state = {antworten: {}, verlauf: [], ansicht: 'frage', bearbeite: null};
const el = (id) => document.getElementById(id);
const esc = (wert) => String(wert ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const skizze = (id, klasse = 'skizze') => {
    const svg = id && globalThis.H2Skizzen && globalThis.H2Skizzen[id];
    return svg ? `<span class="${klasse}" aria-hidden="true">${svg}</span>` : '';
};
const ruhig = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const fragenById = new Map(finder.fragen.map((f) => [f.id, f]));
const blockTitel = new Map(finder.bloecke.map((b) => [b.id, b.titel]));

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
        Object.assign(state, {antworten, verlauf, ansicht: finder.naechsteFrage(antworten) ? 'frage' : 'ergebnis'});
    } catch {
        // beschädigter Stand: neu beginnen
    }
}

// ---------- Aktionen ----------
function beantworte(id, wert) {
    state.antworten[id] = wert;
    state.verlauf = [...state.verlauf.filter((x) => x !== id), id];
    state.bearbeite = null;
    state.ansicht = finder.naechsteFrage(state.antworten) ? 'frage' : 'ergebnis';
    speichern();
    zeichne(true);
}

function zurueck() {
    if (state.ansicht === 'ergebnis' && finder.naechsteFrage(state.antworten)) {
        state.ansicht = 'frage';
    } else {
        const letzte = state.verlauf.pop();
        if (letzte) delete state.antworten[letzte];
        state.ansicht = 'frage';
    }
    state.bearbeite = null;
    speichern();
    zeichne(true);
}

function neu() {
    Object.assign(state, {antworten: {}, verlauf: [], ansicht: 'frage', bearbeite: null});
    speichern();
    zeichne(true);
}

// ---------- Frage ----------
function aktuelleFrage() {
    if (state.bearbeite) {
        const frage = fragenById.get(state.bearbeite);
        const pool = finder.auswerten({...state.antworten, [frage.id]: undefined}).passend.map((b) => b.variante);
        return {frage, antworten: finder.antwortenFuer(frage, state.antworten, pool)};
    }
    return finder.naechsteFrage(state.antworten);
}

function anzahlMit(id, wert) {
    return finder.ergebnis({...state.antworten, [id]: wert}).alle.length;
}

function fortschritt() {
    const beantwortet = state.verlauf.length;
    const offen = finder.offeneFragen(state.antworten).length;
    const gesamt = Math.max(beantwortet + offen, beantwortet + 1);
    return {nr: Math.min(beantwortet + 1, gesamt), gesamt, prozent: Math.round((beantwortet / gesamt) * 100)};
}

function frageHtml(eintrag) {
    const {frage} = eintrag;
    const alt = state.antworten[frage.id];
    const f = fortschritt();
    let kopf = `<div class="fortschritt">
        <button type="button" class="zurueck" data-aktion="zurueck" ${state.verlauf.length ? '' : 'disabled'}>‹ Zurück</button>
        <span>Frage ${f.nr} von ca. ${f.gesamt}</span>
      </div>
      <div class="balken" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${f.prozent}"><span style="width:${f.prozent}%"></span></div>
      <p class="block-titel">${esc(blockTitel.get(frage.block))}</p>`;
    const hilfe = frage.hilfe || frage.skizze
        ? `<details class="hilfe"><summary>Wie erkenne ich das?</summary><div class="hilfe-inhalt">${skizze(frage.skizze, 'skizze gross')}${frage.hilfe ? `<p>${esc(frage.hilfe)}</p>` : ''}</div></details>`
        : '';
    const legende = `<legend><h1 id="frage-titel" tabindex="-1">${esc(frage.frage)}</h1></legend>`;

    if (frage.typ === 'mass') {
        return `${kopf}<form class="frage" data-frage="${frage.id}" data-typ="mass" novalidate>
          <fieldset>${legende}${hilfe}
            <label class="mass-feld"><span class="sr">${esc(frage.frage)}</span>
              <input name="wert" type="number" inputmode="decimal" min="0" max="10000" step="0.5" value="${typeof alt === 'number' ? alt : ''}" aria-describedby="mass-einheit">
              <span id="mass-einheit">${esc(frage.einheit)}</span>
            </label>
            <div class="knoepfe">
              <button type="submit" class="haupt">Weiter</button>
              <button type="button" class="neben" data-aktion="antwort" data-frage="${frage.id}" data-wert="${SPAETER}">Später beim Aufmaß</button>
            </div>
          </fieldset></form>`;
    }

    if (frage.typ === 'mehrfach') {
        const gewaehlt = new Set(Array.isArray(alt) ? alt : []);
        const karten = eintrag.antworten.map((a) => `<label class="karte ${gewaehlt.has(a.id) ? 'aktiv' : ''}">
              <input type="checkbox" name="wunsch" value="${a.id}" ${gewaehlt.has(a.id) ? 'checked' : ''}>
              <span class="karte-text"><strong>${esc(a.text)}</strong></span></label>`).join('');
        return `${kopf}<form class="frage" data-frage="${frage.id}" data-typ="mehrfach">
          <fieldset>${legende}<p class="unterzeile">Mehrfachauswahl möglich. Das ändert nur die Hinweise zum Gewebe.</p>${hilfe}
            <div class="karten">${karten}</div>
            <div class="knoepfe"><button type="submit" class="haupt">Weiter</button></div>
          </fieldset></form>`;
    }

    const karten = eintrag.antworten.map((a) => {
        const n = anzahlMit(frage.id, a.id);
        const gesperrt = frage.id === 'system' && a.system !== 'egal' && n === 0;
        return `<label class="karte ${alt === a.id ? 'aktiv' : ''} ${gesperrt ? 'gesperrt' : ''}">
            <input type="radio" name="antwort" value="${a.id}" ${alt === a.id ? 'checked' : ''} ${gesperrt ? 'disabled' : ''}>
            ${skizze(a.skizze)}
            <span class="karte-text"><strong>${esc(a.text)}</strong>${a.hinweis ? `<small>${esc(a.hinweis)}</small>` : ''}
              ${gesperrt ? '<small class="grund">keine Lösung für deine Angaben</small>' : ''}</span>
            <span class="zahl" aria-label="${n} passende Lösungen">${n}</span>
          </label>`;
    }).join('');
    const unbekannt = frage.weissNicht === false ? '' : `<label class="karte karte-unbekannt ${alt === UNBEKANNT ? 'aktiv' : ''}">
          <input type="radio" name="antwort" value="${UNBEKANNT}" ${alt === UNBEKANNT ? 'checked' : ''}>
          <span class="skizze frage-zeichen" aria-hidden="true">?</span>
          <span class="karte-text"><strong>Weiß ich nicht</strong><small>kommt auf die Prüfliste fürs Aufmaß</small></span>
        </label>`;
    return `${kopf}<form class="frage" data-frage="${frage.id}" data-typ="eins">
      <fieldset>${legende}${hilfe}
        <div class="karten">${karten}${unbekannt}</div>
        <div class="knoepfe tastatur"><button type="submit" class="haupt">Weiter</button></div>
      </fieldset></form>`;
}

// „Ja“ oder „Nein“ allein sagt nichts: dann die Frage voranstellen
function mitFrage(id, text) {
    return /^(ja|nein)\b/i.test(text) ? `${fragenById.get(id).frage.replace(/\?$/, '')}: ${text}` : text;
}

function antwortText(id) {
    const frage = fragenById.get(id);
    const wert = state.antworten[id];
    if (wert === UNBEKANNT) return 'weiß ich nicht';
    if (wert === SPAETER) return 'später messen';
    if (typeof wert === 'number') return `${wert} ${frage.einheit}`;
    if (Array.isArray(wert)) return wert.length ? wert.map((w) => frage.antworten.find((a) => a.id === w)?.text).join(', ') : 'keine';
    return frage.antworten?.find((a) => a.id === wert)?.text ?? String(wert);
}

function angabenHtml() {
    if (!state.verlauf.length) return '';
    return `<section class="angaben" aria-label="Deine Angaben"><h2>Deine Angaben</h2><div class="chips">${state.verlauf.map((id) => `<button type="button" class="chip" data-aktion="bearbeiten" data-frage="${id}" title="${esc(fragenById.get(id).frage)}">${esc(mitFrage(id, antwortText(id)))}</button>`).join('')}</div></section>`;
}

// ---------- Ergebnis ----------
function loesungHtml(b, rang) {
    const v = b.variante;
    const pruef = [...new Map(b.pruefpunkte.map((p) => [p.text, p])).values()];
    const warum = [...new Set(b.warum.map((w) => mitFrage(w.frage, w.text)))];
    const rudi = b.rudi;
    const konflikte = (rudi?.konflikte || []).map((k) => `<li><b>${esc(k)}:</b> ${esc(finder.KONFLIKTE[k] || '')}</li>`).join('');
    const quellen = [
        rudi ? 'Rudis Empfehlung' : null,
        v.hk ? `Hauptkatalog S. ${v.hk.seite} (${v.hk.datei.replace(/\.pdf$/, '')})` : null,
        `Masterkatalog S. ${v.seite}`,
    ].filter(Boolean).join(' · ');
    const titel = [v.titel, v.untertitel].filter(Boolean).join(' – ');
    const zweck = v.empfehlungWoertlich && v.empfehlung ? v.empfehlung : v.hk?.zweck;
    return `<article class="loesung ${rang === 0 ? 'empfohlen' : ''}">
      <p class="rang">${rang === 0 ? 'H2-Empfehlung' : 'Weitere Lösung'} · ${esc(STUFE[b.stufe])}</p>
      <h2 class="code">${esc(v.code)}</h2>
      <p class="titel">${esc(titel)}</p>
      ${zweck ? `<p class="zweck">für ${esc(zweck.replace(/^für /, ''))}</p>` : ''}
      <p class="status status-${b.status}">${b.status === 'passt' ? '✓ Passt zu deinen Angaben' : '✓ Passt – beim Aufmaß prüfen'}</p>
      ${warum.length || rudi ? `<h3>Warum</h3><ul class="warum">${rudi ? `<li>Rudi: ${esc([rudi.gruppe, rudi.untergruppe, rudi.situation].filter(Boolean).join(' › '))}</li>` : ''}${warum.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
      ${b.abweichungen.length ? `<p class="abweichung">Weicht ab: ${b.abweichungen.map(esc).join('; ')}</p>` : ''}
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
        <button type="button" class="zurueck" data-aktion="zurueck">‹ ${offen ? 'Weiter fragen' : 'Zurück'}</button>
        <button type="button" class="neben" data-aktion="teilen">Zusammenfassung teilen</button>
      </div>
      <h1 id="frage-titel" tabindex="-1" class="ergebnis-titel">${r.empfehlung ? 'Deine Produktempfehlung' : 'Keine passende Lösung'}</h1>`;
    if (offen) html += `<p class="hinweis-box">Vorläufiges Ergebnis: ${finder.offeneFragen(state.antworten).length} Fragen sind noch offen. Mehr Angaben machen die Empfehlung sicherer.</p>`;
    const unbekannt = state.verlauf.filter((id) => state.antworten[id] === UNBEKANNT).length;
    if (!offen && unbekannt >= 3) html += `<p class="hinweis-box">${unbekannt} Angaben sind unbekannt. Alle gezeigten Lösungen sind möglich, die Reihenfolge ist aber unsicher – beim Aufmaß die Prüfliste abarbeiten.</p>`;
    if (!r.empfehlung) {
        const ursachen = new Map();
        for (const b of r.ausgeschlossen) for (const g of b.gruende) if (g.frage) ursachen.set(g.frage, (ursachen.get(g.frage) || 0) + 1);
        html += `<p>Alle Varianten sind nach deinen Angaben ausgeschlossen. Diese Antworten haben dazu geführt:</p>
          <div class="chips">${[...ursachen.entries()].map(([id, n]) => `<button type="button" class="chip" data-aktion="bearbeiten" data-frage="${id}">${esc(fragenById.get(id).frage)} – ${esc(antwortText(id))} (${n})</button>`).join('')}
          ${state.antworten.system ? '<button type="button" class="chip" data-aktion="bearbeiten" data-frage="system">Bedienart ändern</button>' : ''}</div>`;
    } else {
        html += loesungHtml(r.empfehlung, 0);
        html += r.weitere.map((b, i) => loesungHtml(b, i + 1)).join('');
        if (r.alle.length > 3) html += `<details class="liste"><summary>Alle ${r.alle.length} passenden Lösungen</summary><ol>${r.alle.map((b) => `<li><strong>${esc(b.variante.code)}</strong> ${esc(b.variante.titel || '')}${b.variante.empfehlung ? ` – ${esc(b.variante.empfehlung)}` : ''} <small>(${esc(STUFE[b.stufe])})</small></li>`).join('')}</ol></details>`;
    }
    if (r.notizen.length) html += `<section class="notizen"><h2>Gewebe und Zubehör</h2>${r.notizen.map((n) => `<p>${esc(n)}</p>`).join('')}</section>`;
    // Technisch ausgeschlossen (A1–A4) getrennt von „andere Bedienart“ (A5): A5 heißt nicht „ungeeignet“
    const technisch = r.ausgeschlossen.filter((b) => b.gruende.some((g) => g.art !== 'A5'));
    const bedienart = r.ausgeschlossen.length - technisch.length;
    if (technisch.length) html += `<details class="liste ausgeschlossen"><summary>Ausgeschlossen, weil … (${technisch.length})</summary><ul>${technisch.map(ausschlussHtml).join('')}</ul></details>`;
    if (bedienart) html += `<p class="ausgeblendet">${bedienart} Varianten mit anderer Bedienart ausgeblendet (nicht ungeeignet). <button type="button" class="link" data-aktion="bearbeiten" data-frage="${state.antworten.richtung && state.antworten.system === 'dreh' ? 'richtung' : 'system'}">Bedienart ändern</button></p>`;
    html += angabenHtml();
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
    if (state.ansicht === 'ergebnis') return `<button type="button" class="neben" data-aktion="zurueck">Angaben ändern</button><button type="button" class="haupt" data-aktion="neu">Neu starten</button>`;
    return `<span class="leiste-zahl" aria-live="polite"><b>${n}</b> passende Lösungen</span><button type="button" class="haupt" data-aktion="ergebnis" ${state.antworten.element ? '' : 'disabled'}>Ansehen</button>`;
}

function zeichne(fokus = false) {
    const schritt = el('schritt');
    const eintrag = state.ansicht === 'frage' ? aktuelleFrage() : null;
    if (state.ansicht === 'frage' && !eintrag) state.ansicht = 'ergebnis';
    schritt.innerHTML = state.ansicht === 'frage' ? frageHtml(eintrag) + angabenHtml() : ergebnisHtml();
    el('vorschau').innerHTML = vorschauHtml();
    el('leiste').innerHTML = leisteHtml();
    el('leiste').hidden = !state.antworten.element;
    const neuKnopf = document.querySelector('[data-aktion="neu"]');
    if (neuKnopf) neuKnopf.hidden = !state.verlauf.length;
    if (fokus) {
        const titel = schritt.querySelector('#frage-titel');
        if (titel) titel.focus({preventScroll: true});
        if (typeof scrollTo === 'function') scrollTo({top: 0, behavior: ruhig() ? 'auto' : 'smooth'});
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
let weiterTimer = null;
document.addEventListener('click', (event) => {
    const ziel = event.target.closest('[data-aktion]');
    if (ziel && !ziel.disabled) {
        const aktion = ziel.dataset.aktion;
        if (aktion === 'zurueck') zurueck();
        else if (aktion === 'neu') neu();
        else if (aktion === 'ergebnis') {
            state.ansicht = 'ergebnis';
            zeichne(true);
        } else if (aktion === 'bearbeiten') {
            state.bearbeite = ziel.dataset.frage;
            state.ansicht = 'frage';
            zeichne(true);
        } else if (aktion === 'antwort') beantworte(ziel.dataset.frage, ziel.dataset.wert);
        else if (aktion === 'teilen') teilen(ziel);
        return;
    }
    // Antippen oder Klicken einer Antwortkarte geht direkt weiter; Tastatur nutzt „Weiter“
    const karte = event.target.closest('label.karte');
    if (!karte || event.detail === 0) return;
    const form = karte.closest('form[data-typ="eins"]');
    const input = karte.querySelector('input');
    if (!form || !input || input.disabled) return;
    const id = form.dataset.frage;
    clearTimeout(weiterTimer); // Label-Klick löst im Browser zusätzlich einen Klick auf das Eingabefeld aus
    weiterTimer = setTimeout(() => beantworte(id, input.value), ruhig() ? 0 : 180);
});

document.addEventListener('change', (event) => {
    const input = event.target;
    const karte = input.closest && input.closest('label.karte');
    if (!karte) return;
    const form = karte.closest('form');
    if (input.type === 'radio') for (const k of form.querySelectorAll('label.karte')) k.classList.toggle('aktiv', k.contains(input));
    else karte.classList.toggle('aktiv', input.checked);
});

document.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-frage]');
    if (!form) return;
    event.preventDefault();
    const id = form.dataset.frage;
    if (form.dataset.typ === 'mass') {
        const wert = Number(String(form.querySelector('input[name="wert"]').value).replace(',', '.'));
        if (form.querySelector('input[name="wert"]').value === '' || !Number.isFinite(wert) || wert < 0) return beantworte(id, SPAETER);
        return beantworte(id, wert);
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
