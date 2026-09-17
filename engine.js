// Auswahl-Logik des Produktfinders (Phase 4). Reine Funktionen ohne DOM, in Node testbar.
//
// Grundsätze (Katalog/PRODUKTAUSWAHL_PLAN.md §3–§4):
// - Ausgeschlossen wird nur mit A1–A5 und Beleg. Alles andere bleibt und wird sortiert.
// - Eine unbeantwortete Frage oder „Weiß ich nicht“ schließt nie aus.
// - Sortierstufen: 1 Rudi passt · 2 Rudi teilweise offen · 3 Hauptkatalog-Einsatzzweck passt ·
//   4 Hauptkatalog · 5 Masterkatalog (Sonderlösung, Rücksprache).
(function () {
'use strict';

const UNBEKANNT = 'unbekannt';
const SPAETER = 'spaeter';

const KONFLIKTE = {
    K1: 'Rudis Hinweis „Oder 5/11 innen“ ist noch nicht geklärt (wahrscheinlich SP5/11).',
    K2: 'Nicht im Hauptkatalog; technische Daten aus dem Masterkatalog.',
    K3: 'Rudi: „unten offen“. Laut Hauptkatalog ist der Montagerahmen unten geschlossen.',
    K4: 'Laut Hauptkatalog für Holzfenster empfohlen; andere Materialien bleiben möglich.',
    K5: 'Rudi: „von vorne“. Laut Hauptkatalog Montage in der Mauerleibung.',
    K6: 'Hauptkatalog empfiehlt für diese Situation RO4/3.IGG.',
    K7: 'Rudi: „Bürsten vorne“. Laut Katalog ist das Rollo unten geschlossen.',
    K8: 'Rudi schreibt „PT2/50 AMB“; Bestellbezeichnung ist PT2/50.',
    K9: 'Nicht auf Holztüren beschränkt; Tür lässt sich von außen nicht mehr schließen.',
    K10: 'LMM = Montage in der Mauerleibung.',
    K11: 'Nicht im Hauptkatalog; technische Daten aus dem Masterkatalog S. 458.',
    K12: 'Kellerfenster-Überstand höchstens 90 mm (sonst LI1/4 oder LI1/7).',
};

const SYSTEM_TEXT = {
    spannrahmen: 'Spannrahmen', pendel: 'Pendelanlage', dreh: 'Drehrahmen', rollo: 'Rollo', plissee: 'Plissee',
    schiebe: 'Schiebeanlage', schieberahmen: 'Schieberahmen', abdeckung: 'Lichtschachtabdeckung',
};

function erstelleFinder(daten, katalog) {
    const {fragen, bloecke} = katalog;
    const fragenById = new Map(fragen.map((f) => [f.id, f]));
    const text = (nr) => (nr === null || nr === undefined ? null : daten.texte[nr]);

    const varianten = daten.varianten.map((v) => {
        const wahr = new Set(v.wahr.map((n) => daten.labels[n]));
        const belege = {};
        for (const [nr, beleg] of Object.entries(v.belege)) belege[daten.labels[nr]] = beleg;
        return {
            ...v,
            wahr,
            falsch: new Set(v.falsch.map((n) => daten.labels[n])),
            zweck: new Set(v.zweck.map((n) => daten.labels[n])),
            belege,
            titel: text(v.titel),
            untertitel: text(v.untertitel),
            hk: v.hk ? {...v.hk, datei: text(v.hk.datei), zweck: text(v.hk.zweck), gruppe: text(v.hk.gruppe), serie: text(v.hk.serie)} : null,
            hinweise: v.hinweise.map(text),
            alternativen: v.alternativen.map(([wenn, dann]) => ({wenn: text(wenn), dann: text(dann)})),
            grenzen: v.grenzen.map(([k, op, wert]) => ({k, op, wert, ...daten.masse[k]})),
        };
    });

    // Welche Fragen sprechen über ein Label? (für Rudis Situations-Labels)
    const fragenJeLabel = new Map();
    for (const f of fragen) for (const l of f.labels || []) {
        if (!fragenJeLabel.has(l)) fragenJeLabel.set(l, []);
        fragenJeLabel.get(l).push(f);
    }
    const massFrageJeSchluessel = new Map();
    for (const f of fragen) for (const k of f.schluessel || []) massFrageJeSchluessel.set(k, f);

    const beantwortet = (a, id) => a[id] !== undefined && a[id] !== UNBEKANNT && a[id] !== SPAETER;
    const antwortVon = (a, frage) => (beantwortet(a, frage.id) ? frage.antworten?.find((x) => x.id === a[frage.id]) : undefined);
    const sichtbar = (frage, a) => !frage.zeigen || frage.zeigen(a);

    function imPool(v, a) {
        if (!a.element) return true;
        if (a.element === 'lichtschacht') return v.elemente.includes('lichtschacht');
        if (a.element === 'tuer') return v.elemente.includes('tuer');
        if (a.fenstertyp === 'dach') return v.elemente.includes('dachfenster');
        if (a.fenstertyp === 'fassade') return v.elemente.includes('fenster');
        return v.elemente.includes('fenster') || v.elemente.includes('dachfenster');
    }

    // Beziehung einer Antwort zu Labels einer Variante: 2 passt, 0 neutral, -1 teilweise, -2 widerspricht
    function beziehung(frage, antwort, labels) {
        if (!antwort || !antwort.setzt || !frage.labels) return 0;
        let pos = 0;
        let neg = 0;
        let relevant = 0;
        for (const l of frage.labels) {
            if (!labels.has(l)) continue;
            relevant++;
            if (antwort.setzt[l] === true) pos++;
            else if (antwort.setzt[l] === false) neg++;
        }
        // Besondere Situation liegt vor, die Variante ist dafür aber nicht ausgelegt (z. B. überstehendes Kellerfenster)
        if (frage.spezifisch && !relevant && Object.values(antwort.setzt).includes(true)) return -1;
        if (frage.modus === 'alle') {
            // genau passend nur, wenn die Situation keine weiteren Merkmale hat (beidseitig eng ≠ nur links eng)
            const exakt = (frage.exakt || []).filter((l) => labels.has(l)).length > 0;
            const zusaetzlich = exakt && frage.exakt.some((l) => antwort.setzt[l] === true && !labels.has(l));
            if (pos && !neg && zusaetzlich) return -1;
            if (pos && !neg) return 2;
            if (pos && neg) return -1;
            return neg ? -2 : 0;
        }
        if (pos) return 2;
        return neg ? -2 : 0;
    }

    function verletzt(op, gemessen, grenze) {
        if (op === 'gte') return gemessen < grenze;
        if (op === 'gt') return gemessen <= grenze;
        if (op === 'lte') return gemessen > grenze;
        if (op === 'lt') return gemessen >= grenze;
        return false;
    }
    const opText = {gte: 'mind.', gt: 'mehr als', lte: 'höchstens', lt: 'weniger als'};
    const quelle = (v, seite = v.seite) => `Masterkatalog S. ${seite}`;

    function ausschluesse(v, a) {
        const gruende = [];
        for (const r of v.rudi) {
            if (r.ausschluss && !r.zuordnungOffen)
                gruende.push({art: 'A1', text: 'Praxis-Ausschluss von Rudi', zitat: r.ausschluss.quote, quelle: 'Rudis Empfehlung'});
        }
        if (beantwortet(a, 'system') && a.system !== 'egal' && sichtbar(fragenById.get('system'), a) && v.system !== a.system && v.system !== 'abdeckung')
            gruende.push({art: 'A5', text: `${SYSTEM_TEXT[v.system]} statt ${SYSTEM_TEXT[a.system]}`, quelle: 'deine Antwort', frage: 'system'});
        const richtung = antwortVon(a, fragenById.get('richtung'));
        if (richtung?.richtung && v.system === 'dreh') {
            const andere = richtung.richtung === 'operation.hinged_inward' ? 'operation.hinged_outward' : 'operation.hinged_inward';
            if (v.wahr.has(andere) && !v.wahr.has(richtung.richtung))
                gruende.push({art: 'A5', text: `öffnet ${andere.endsWith('inward') ? 'nach innen' : 'nach außen'}, gewünscht ist ${richtung.text.toLowerCase()}`, quelle: 'deine Antwort', frage: 'richtung'});
        }
        for (const frage of fragen) {
            if (!sichtbar(frage, a)) continue;
            const antwort = antwortVon(a, frage);
            for (const regel of antwort?.schliesstAus || []) {
                if (!v.wahr.has(regel.label) || (regel.ohneLabel && v.wahr.has(regel.ohneLabel))) continue;
                const beleg = v.belege[regel.label];
                if (regel.art === 'A2' && !beleg) continue; // A2 nur mit wörtlichem Beleg
                gruende.push({
                    art: beleg?.art === 'A4' ? 'A4' : regel.art,
                    text: regel.grund,
                    zitat: beleg ? beleg.zitat : v.empfehlungWoertlich && v.empfehlung ? v.empfehlung : v.untertitel,
                    quelle: quelle(v, beleg ? beleg.seite : v.seite),
                    frage: frage.id,
                });
            }
        }
        for (const g of v.grenzen) {
            if (!g.messbar) continue;
            const frage = massFrageJeSchluessel.get(g.k);
            if (!frage || !sichtbar(frage, a) || typeof a[frage.id] !== 'number') continue;
            if (verletzt(g.op, a[frage.id], g.wert))
                gruende.push({
                    art: 'A3',
                    text: `${g.text}: gemessen ${a[frage.id]} mm, Katalog ${opText[g.op]} ${g.wert} mm`,
                    quelle: quelle(v),
                    frage: frage.id,
                });
        }
        return gruende;
    }

    function pruefpunkte(v, a) {
        const punkte = [];
        for (const g of v.grenzen) {
            const frage = g.messbar ? massFrageJeSchluessel.get(g.k) : null;
            if (frage && typeof a[frage.id] === 'number') continue;
            punkte.push({text: `${g.text} ${opText[g.op]} ${g.wert} mm`, art: g.messbar ? 'mass' : 'mass-info', frage: frage?.id});
        }
        for (const frage of fragen) {
            for (const antwort of frage.antworten || []) {
                for (const regel of antwort.schliesstAus || []) {
                    if (!v.wahr.has(regel.label) || (regel.ohneLabel && v.wahr.has(regel.ohneLabel))) continue;
                    if (regel.art === 'A2' && !v.belege[regel.label]) continue;
                    if (beantwortet(a, frage.id)) continue;
                    punkte.push({text: `${frage.frage} (Variante ${regel.grund})`, art: 'voraussetzung', frage: frage.id});
                }
            }
        }
        return punkte;
    }

    function rudiPasst(v, a) {
        let best = null;
        for (const r of v.rudi) {
            if (r.ausschluss) continue;
            const labels = new Set(r.labels);
            let passt = 0;
            let offen = 0;
            let widerspruch = 0;
            const gesehen = new Set();
            for (const l of r.labels) {
                for (const frage of fragenJeLabel.get(l) || []) {
                    if (gesehen.has(frage.id)) continue;
                    gesehen.add(frage.id);
                    if (!sichtbar(frage, a)) continue; // für dieses Element nicht abfragbar
                    if (!beantwortet(a, frage.id)) {
                        offen++;
                        continue;
                    }
                    const b = beziehung(frage, antwortVon(a, frage), labels);
                    if (b > 0) passt++;
                    else if (b < 0) widerspruch++;
                }
            }
            // Eine bestätigte Besonderheit (z. B. überstehendes Kellerfenster), für die die Variante nicht ausgelegt ist
            for (const frage of fragen) {
                if (frage.spezifisch && sichtbar(frage, a) && beziehung(frage, antwortVon(a, frage), v.wahr) < 0) widerspruch++;
            }
            const stufe = widerspruch ? null : !offen && passt && !r.zuordnungOffen ? 1 : 2;
            const rang = stufe && r.nachrangig ? Math.max(stufe, 2) : stufe;
            if (rang && (!best || rang < best.stufe || (rang === best.stufe && passt > best.passt))) best = {stufe: rang, passt, offen, eintrag: r};
        }
        return best;
    }

    function bewerte(v, a) {
        const gruende = ausschluesse(v, a);
        let treffer = 0;
        let konflikte = 0;
        let zweckTreffer = 0;
        let zweckWiderspruch = 0;
        const warum = [];
        const abweichungen = [];
        for (const frage of fragen) {
            if (!frage.labels || !sichtbar(frage, a)) continue;
            const antwort = antwortVon(a, frage);
            if (!antwort) continue;
            const b = beziehung(frage, antwort, v.wahr);
            if (b > 0) {
                treffer++;
                warum.push({frage: frage.id, text: antwort.text});
            } else if (b < 0) {
                konflikte += b === -2 ? 2 : 1;
                abweichungen.push(`${frage.frage} – ${antwort.text}`);
            }
            let z = beziehung(frage, antwort, v.zweck);
            // „nicht dafür ausgelegt“ nur, wenn die Variante die Besonderheit gar nicht kennt, nicht schon, wenn der Einsatzzweck sie nicht nennt
            if (z === -1 && frage.spezifisch && frage.labels.some((l) => v.wahr.has(l))) z = 0;
            if (z > 0) zweckTreffer++;
            else if (z < 0) zweckWiderspruch++;
        }
        // Einsatzzweck ohne abfragbare Merkmale (z. B. „für Öffnungen bis 5600 mm“) gilt als passend, solange nichts widerspricht
        const zweckAbfragbar = [...v.zweck].some((l) => (fragenJeLabel.get(l) || []).some((frage) => sichtbar(frage, a)));
        // Merkmale des Einsatzzwecks, deren Frage noch offen ist: je weniger, desto sicherer passt die Variante
        const zweckOffen = [...v.zweck].filter((l) => (fragenJeLabel.get(l) || []).some((frage) => sichtbar(frage, a) && !beantwortet(a, frage.id))).length;
        const rudi = rudiPasst(v, a);
        let stufe;
        if (rudi && !zweckWiderspruch) stufe = rudi.stufe; // Rudis Lösung, solange der Katalog-Einsatzzweck nicht widerspricht
        else if (v.hk && !zweckWiderspruch && (zweckTreffer || !zweckAbfragbar)) stufe = 3;
        else if (v.hk) stufe = 4;
        else stufe = 5;
        const punkte = pruefpunkte(v, a);
        const qualitaet = qualitaetsBonus(v, a);
        // Gemessene und eingehaltene Grenzwerte: die genauer passende Variante zuerst (LI1/7 „größer 110 mm“ vor LI1/4 „größer 90 mm“)
        let spezifitaet = 0;
        for (const g of v.grenzen) {
            const frage = g.messbar ? massFrageJeSchluessel.get(g.k) : null;
            if (frage && typeof a[frage.id] === 'number') spezifitaet += g.op === 'gt' || g.op === 'gte' ? g.wert : -g.wert;
        }
        return {
            variante: v,
            ausgeschlossen: gruende.length > 0,
            gruende,
            stufe,
            rudi: rudi?.eintrag || null,
            treffer,
            konflikte,
            zweckTreffer,
            warum,
            abweichungen,
            pruefpunkte: punkte,
            status: gruende.length ? 'ausgeschlossen' : punkte.some((p) => p.art !== 'mass-info') ? 'pruefen' : 'passt',
            qualitaet,
            spezifitaet,
            zweckOffen,
        };
    }

    // Rudis Qualitätshinweis „ST4 die hochwertigere Lösung“ bevorzugt die genannte Serie innerhalb einer Stufe
    const qualitaetsSerien = new Set();
    for (const v of varianten) for (const r of v.rudi) {
        const m = r.qualitaet && r.qualitaet.match(/\b([A-Z]{2}\d)\b.*hochwertiger/);
        if (m) qualitaetsSerien.add(m[1]);
    }
    const qualitaetsBonus = (v) => (qualitaetsSerien.has(v.familie) ? 1 : 0);

    function sichtbareBefestigung(v) {
        let n = 0;
        for (const l of v.wahr) if (l.startsWith('visible.') || l.startsWith('additional_profile.')) n++;
        return n;
    }

    function vergleiche(x, y) {
        return x.stufe - y.stufe
            || Number(Boolean(x.rudi?.nachrangig)) - Number(Boolean(y.rudi?.nachrangig))
            || y.zweckTreffer - x.zweckTreffer
            || x.zweckOffen - y.zweckOffen
            || Number(Boolean(x.variante.hk?.zusatz)) - Number(Boolean(y.variante.hk?.zusatz))
            || (y.treffer * 2 - y.konflikte) - (x.treffer * 2 - x.konflikte)
            || y.spezifitaet - x.spezifitaet
            || x.pruefpunkte.length - y.pruefpunkte.length
            || y.qualitaet - x.qualitaet
            || sichtbareBefestigung(x.variante) - sichtbareBefestigung(y.variante)
            || x.variante.seite - y.variante.seite;
    }

    function auswerten(a) {
        const bewertet = varianten.filter((v) => imPool(v, a)).map((v) => bewerte(v, a));
        const passend = bewertet.filter((b) => !b.ausgeschlossen).sort(vergleiche);
        const ausgeschlossen = bewertet.filter((b) => b.ausgeschlossen).sort((x, y) => vergleiche(x, y));
        return {passend, ausgeschlossen};
    }

    function antwortenFuer(frage, a, pool) {
        let antworten = (frage.antworten || []).filter((x) => !x.nur || x.nur(a));
        if (frage.id === 'system') {
            const systeme = new Set(pool.map((v) => v.system));
            antworten = antworten.filter((x) => x.system === 'egal' || systeme.has(x.system));
            if (antworten.filter((x) => x.system !== 'egal').length < 2) return [];
        }
        if (frage.id === 'einbauweise') {
            antworten = antworten.filter((x) => pool.some((v) => Object.entries(x.setzt).some(([l, w]) => w && v.wahr.has(l))));
            if (antworten.length < 2) return [];
        }
        return antworten;
    }

    // Wirkung einer Frage: Anzahl verbliebener Varianten, bei denen mindestens eine Antwort den
    // Ausschluss oder die Sortierung ändert (Übergabe §5.5).
    function wirkung(frage, a, pool) {
        if (frage.typ === 'mass') {
            return pool.filter((v) => v.grenzen.some((g) => g.messbar && frage.schluessel.includes(g.k))).length;
        }
        if (frage.typ === 'mehrfach') return antwortenFuer(frage, a, pool).length ? 1 : 0;
        const antworten = antwortenFuer(frage, a, pool);
        if (!antworten.length) return 0;
        if (frage.id === 'system' || frage.id === 'richtung') return pool.length;
        let n = 0;
        for (const v of pool) {
            const ergebnisse = new Set();
            for (const antwort of antworten) {
                const aus = (antwort.schliesstAus || []).some((r) => v.wahr.has(r.label) && !(r.ohneLabel && v.wahr.has(r.ohneLabel)) && (r.art !== 'A2' || v.belege[r.label]));
                ergebnisse.add(`${aus}:${beziehung(frage, antwort, v.wahr)}`);
            }
            ergebnisse.add('false:0'); // „Weiß ich nicht“
            if (ergebnisse.size > 1) n++;
        }
        return n;
    }

    // Fragen, die nur weit hinten sortierte Varianten betreffen, ändern die Empfehlung nicht: Wirkung zählt
    // deshalb nur bei den vorderen Varianten (Maße nur bei den ersten fünf), die Bedienart bei allen.
    const VORNE = 10;
    const VORNE_MASS = 5;

    function offeneFragen(a) {
        const {passend} = auswerten(a);
        const alle = passend.map((b) => b.variante);
        const vorne = alle.slice(0, VORNE);
        const liste = [];
        for (const frage of fragen) {
            if (a[frage.id] !== undefined || !sichtbar(frage, a)) continue;
            if (frage.pflicht) {
                liste.push({frage, wirkung: Infinity, antworten: antwortenFuer(frage, a, alle)});
                continue;
            }
            const pool = frage.id === 'system' ? alle : frage.typ === 'mass' ? alle.slice(0, VORNE_MASS) : vorne;
            const w = wirkung(frage, a, pool);
            if (w > 0) liste.push({frage, wirkung: w, antworten: antwortenFuer(frage, a, alle)});
        }
        const blockNr = new Map(bloecke.map((b, i) => [b.id, i]));
        return liste.sort((x, y) => blockNr.get(x.frage.block) - blockNr.get(y.frage.block) || y.wirkung - x.wirkung);
    }

    function naechsteFrage(a) {
        return offeneFragen(a)[0] || null;
    }

    function ergebnis(a) {
        const {passend, ausgeschlossen} = auswerten(a);
        const notizen = [];
        const wunsch = fragenById.get('wunsch');
        for (const id of Array.isArray(a.wunsch) ? a.wunsch : []) {
            const antwort = wunsch.antworten.find((x) => x.id === id);
            if (antwort) notizen.push(antwort.notiz);
        }
        return {
            empfehlung: passend[0] || null,
            weitere: passend.slice(1, 3),
            alle: passend,
            ausgeschlossen,
            notizen,
        };
    }

    return {varianten, fragen, bloecke, auswerten, bewerte, ergebnis, naechsteFrage, offeneFragen, antwortenFuer, KONFLIKTE, SYSTEM_TEXT, UNBEKANNT, SPAETER};
}

globalThis.H2Engine = {erstelleFinder, UNBEKANNT, SPAETER};
})();
