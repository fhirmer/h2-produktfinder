// Auswahl-Logik des Produktfinders (Phase 4). Reine Funktionen ohne DOM, in Node testbar.
//
// Grundsätze (Katalog/PRODUKTAUSWAHL_PLAN.md §3–§4):
// - Ausgeschlossen wird nur mit A1–A5 und Beleg. Alles andere bleibt und wird sortiert.
// - Eine unbeantwortete Frage oder „Weiß ich nicht“ schließt nie aus.
// - Sortierstufen: 1 Rudi passt · 2 Rudi teilweise offen · 3 Hauptkatalog-Einsatzzweck passt ·
//   4 Hauptkatalog mit eigenem Datenblatt · 5 Zusatzvariante ohne eigenes Datenblatt.
//
// Seit dem 20.09.2026 stammen alle Daten aus dem NEHER-Hauptkatalog 04/2025.
(function () {
'use strict';

const UNBEKANNT = 'unbekannt';
const SPAETER = 'spaeter';

const KONFLIKTE = {
    K1: 'Rudis Hinweis „Oder 5/11 innen“ ist noch nicht geklärt (wahrscheinlich SP5/11).',
    K2: 'Kein eigenes Datenblatt im Hauptkatalog; die Maße stammen von der Schwestervariante.',
    K3: 'Rudi: „unten offen“. Laut Hauptkatalog ist der Montagerahmen unten geschlossen.',
    K4: 'Laut Hauptkatalog für Holzfenster empfohlen; andere Materialien bleiben möglich.',
    K5: 'Rudi: „von vorne“. Laut Hauptkatalog Montage in der Mauerleibung.',
    K6: 'Hauptkatalog empfiehlt für diese Situation RO4/3.IGG.',
    K7: 'Rudi: „Bürsten vorne“. Laut Katalog ist das Rollo unten geschlossen.',
    K8: 'Rudi schreibt „PT2/50 AMB“; Bestellbezeichnung ist PT2/50.',
    K9: 'Nicht auf Holztüren beschränkt; Tür lässt sich von außen nicht mehr schließen.',
    K10: 'LMM = Montage in der Mauerleibung.',
    K11: 'Kein eigenes Datenblatt im Hauptkatalog; die Maße stammen von der Schwestervariante.',
    K12: 'Kellerfenster-Überstand höchstens 90 mm (sonst LI1/4 oder LI1/7).',
};

// Einbaulage laut Bestellmaß-Bezug des Hauptkatalogs (erzeugt in scripts/erzeuge-finder-daten.py)
const LAGE_TEXT = {
    auf_blendrahmen: 'liegt außen auf dem Blendrahmen auf',
    im_blendrahmen: 'sitzt im Blendrahmen, in der Rahmenöffnung',
    mauerleibung: 'sitzt in der Mauerleibung',
    fuehrungsschienen: 'sitzt zwischen den Rollladenführungsschienen',
    innenfutter: 'sitzt im Innenfutter des Dachfensters',
    auf_innenfutter: 'liegt auf den Abdeckleisten des Innenfutters',
    aussenkante: 'sitzt auf der Außenkante des Blendrahmens',
    lichtschacht: 'liegt auf dem Lichtschacht',
    lichtschachtfalz: 'liegt auf dem Lichtschachtfalz',
    terrassenausschnitt: 'liegt im Ausschnitt der Terrasse',
};

const SYSTEM_TEXT = {
    spannrahmen: 'Spannrahmen', pendel: 'Pendelanlage', dreh: 'Drehrahmen', rollo: 'Rollo', plissee: 'Plissee',
    schiebe: 'Schiebeanlage', schieberahmen: 'Schieberahmen', abdeckung: 'Lichtschachtabdeckung',
};

function erstelleFinder(daten, katalog) {
    const {fragen, bloecke, abschnitte: abschnittsliste} = katalog;
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
    const quelle = (v, seite = v.hk?.seite ?? v.seite) =>
        (seite ? `Hauptkatalog S. ${seite}` : 'Hauptkatalog, Sammelseite Zusatzvarianten');

    // Eine Schätzung („sehr wenig“) sortiert und warnt, schließt aber nie aus (Plan §3.1 A3).
    const klasseVon = (frage, a) => (frage.klassen || []).find((k) => k.id === a[frage.id]) || null;

    function schaetzUrteil(klasse, grenzen) {
        // Eine Schätzung bestätigt nur, wenn die **ganze** Spanne die Grenze einhält:
        // „mindestens 15 mm“ ist erst durch eine Klasse ab 15 mm sicher erfüllt, „höchstens 3 mm“
        // erst durch eine Klasse bis 3 mm. Offene Spannen („über 25 mm“) erfüllen eine höhere
        // Grenze (z. B. 38 mm) gerade nicht – sonst entstünde ein falsches Häkchen.
        const erfuellt = (g) => ((g.op === 'gte' || g.op === 'gt') ? klasse.ab !== undefined && klasse.ab >= g.wert
            : (g.op === 'lte' || g.op === 'lt') ? klasse.bis !== undefined && klasse.bis <= g.wert
            : true);
        const knapp = grenzen.filter((g) => !erfuellt(g));
        const liste = (gs) => gs.map((g) => `${g.text} ${opText[g.op]} ${g.wert} mm`).join(' · ');
        return {
            knapp: knapp.length > 0,
            text: knapp.length
                ? `geschätzt „${klasse.text}“ – der Katalog verlangt ${liste(knapp)}: bitte nachmessen`
                : `geschätzt „${klasse.text}“ passt zu ${liste(grenzen)}`,
        };
    }

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
            const andere = richtung.richtung === 'bedienung.oeffnet_nach_innen'
                ? 'bedienung.oeffnet_nach_aussen' : 'bedienung.oeffnet_nach_innen';
            if (v.wahr.has(andere) && !v.wahr.has(richtung.richtung))
                gruende.push({art: 'A5', text: `öffnet ${andere.endsWith('innen') ? 'nach innen' : 'nach außen'}, gewünscht ist ${richtung.text.toLowerCase()}`, quelle: 'deine Antwort', frage: 'richtung'});
        }
        const einbau = antwortVon(a, fragenById.get('einbauweise'));
        if (einbau?.lage && v.lage && v.lage !== einbau.lage && sichtbar(fragenById.get('einbauweise'), a))
            gruende.push({
                art: 'A5',
                text: `${LAGE_TEXT[v.lage] || v.lage}, gewünscht ist „${einbau.text}“`,
                quelle: `Bestellmaß laut Hauptkatalog (${(v.lageBeleg || []).join(' ')})`,
                frage: 'einbauweise',
            });
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
            const klasse = frage ? klasseVon(frage, a) : null;
            const zusatz = klasse ? (schaetzUrteil(klasse, [g]).knapp ? ' – geschätzt knapp, unbedingt nachmessen' : ' – Schätzung passt, beim Aufmaß bestätigen') : '';
            punkte.push({text: `${g.text} ${opText[g.op]} ${g.wert} mm${zusatz}`, art: g.messbar ? 'mass' : 'mass-info', frage: frage?.id});
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
                        // Eine grobe Vorfrage („insgesamt genug Platz?“) ersetzt die Detailfragen,
                        // sie macht Rudis Zuordnung aber nicht unsicher, solange sie offen ist.
                        if (!frage.grob) offen++;
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

    // Abgleich der gemachten Angaben mit einer Lösung: ja · nein · offen · neutral.
    // „neutral“ heißt ausdrücklich „dazu sagt der Katalog nichts“ und nie „passt nicht“ (§3.2 N1).
    function abgleichen(v, a, gruende) {
        const grundJeFrage = new Map();
        for (const g of gruende) if (g.frage) grundJeFrage.set(g.frage, g);
        const zeilen = [];
        for (const frage of fragen) {
            if (a[frage.id] === undefined || !sichtbar(frage, a)) continue;
            const grund = grundJeFrage.get(frage.id);
            if (grund) {
                zeilen.push({frage: frage.id, urteil: 'nein', text: grund.text});
                continue;
            }
            if (a[frage.id] === UNBEKANNT) {
                zeilen.push({frage: frage.id, urteil: 'offen', text: 'noch nicht bekannt'});
                continue;
            }
            if (a[frage.id] === SPAETER) {
                zeilen.push({frage: frage.id, urteil: 'offen', text: 'wird beim Aufmaß gemessen'});
                continue;
            }
            if (frage.id === 'element' || frage.id === 'fenstertyp') {
                zeilen.push({frage: frage.id, urteil: 'ja', text: 'die Lösung ist für dieses Element vorgesehen'});
                continue;
            }
            if (frage.id === 'system') {
                zeilen.push({frage: frage.id, urteil: a.system === 'egal' ? 'neutral' : 'ja', text: a.system === 'egal' ? 'Bedienart noch offen' : 'Bedienart wie gewünscht'});
                continue;
            }
            if (frage.id === 'einbauweise') {
                const antwort = antwortVon(a, frage);
                zeilen.push(v.lage && antwort?.lage === v.lage
                    ? {frage: frage.id, urteil: 'ja', text: `${LAGE_TEXT[v.lage]} (Bestellmaß laut Hauptkatalog)`}
                    : {frage: frage.id, urteil: 'neutral', text: 'zum Montageort sagt der Katalog hier nichts'});
                continue;
            }
            if (frage.id === 'richtung') {
                const richtung = antwortVon(a, frage);
                const passt = richtung?.richtung && v.wahr.has(richtung.richtung);
                zeilen.push({frage: frage.id, urteil: passt ? 'ja' : 'neutral', text: passt ? 'öffnet in die gewünschte Richtung' : 'zur Öffnungsrichtung sagt der Katalog hier nichts'});
                continue;
            }
            if (frage.typ === 'mass') {
                const grenzen = v.grenzen.filter((g) => g.messbar && frage.schluessel.includes(g.k));
                if (!grenzen.length) {
                    zeilen.push({frage: frage.id, urteil: 'neutral', text: 'für diese Lösung ohne Grenzwert'});
                    continue;
                }
                const klasse = klasseVon(frage, a);
                if (klasse) {
                    const urteil = schaetzUrteil(klasse, grenzen);
                    zeilen.push({frage: frage.id, urteil: urteil.knapp ? 'offen' : 'ja', text: urteil.text});
                    continue;
                }
                zeilen.push({frage: frage.id, urteil: 'ja', text: `Katalog: ${grenzen.map((g) => `${g.text} ${opText[g.op]} ${g.wert} mm`).join(' · ')}`});
                continue;
            }
            if (frage.typ === 'mehrfach') {
                zeilen.push({frage: frage.id, urteil: 'neutral', text: 'wirkt nur auf Gewebe und Zubehör'});
                continue;
            }
            const b = beziehung(frage, antwortVon(a, frage), v.wahr);
            zeilen.push({
                frage: frage.id,
                urteil: b > 0 ? 'ja' : b < 0 ? 'nein' : 'neutral',
                text: b > 0 ? 'passt zu dieser Lösung' : b < 0 ? 'weicht von dieser Lösung ab' : 'dazu sagt der Katalog nichts',
            });
        }
        return zeilen;
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
        else if (v.hkEigen) stufe = 4;
        else stufe = 5;   // Zusatzvariante: Maße von der Schwestervariante übernommen
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
            abgleich: abgleichen(v, a, gruende),
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

    // Warum steht diese Lösung vorn? Die Antwort ist genau der erste Schritt der Sortierung,
    // bei dem sich die beiden vordersten Lösungen unterscheiden (gleiche Reihenfolge wie vergleiche()).
    const STUFE_GRUND = {
        1: 'Rudi empfiehlt genau diese Lösung für deine Situation',
        2: 'Rudi empfiehlt sie für diese Situation; einzelne Angaben fehlen noch',
        3: 'der Einsatzzweck im Hauptkatalog passt zu deinen Angaben',
        4: 'sie ist laut Hauptkatalog technisch möglich',
        5: 'sie steht im Hauptkatalog nur auf einer Sammelseite – die Maße stammen von der Schwestervariante',
    };

    function warumZuerst(x, y) {
        if (!x) return null;
        const rudiWeg = x.rudi ? [x.rudi.gruppe, x.rudi.untergruppe, x.rudi.situation].filter(Boolean).join(' › ') : null;
        const stufe = x.stufe <= 2 && rudiWeg
            ? `${STUFE_GRUND[x.stufe]} (Rudi führt sie unter „${rudiWeg}“)`
            : (STUFE_GRUND[x.stufe] || '');
        if (!y) return {stufe, gegen: null, grund: 'Es bleibt nur diese eine Lösung übrig.'};
        const nutzen = (b) => b.treffer * 2 - b.konflikte;
        const sichtbar_ = (b) => sichtbareBefestigung(b.variante);
        const schritte = [
            [x.stufe !== y.stufe, `sie steht eine Stufe höher als ${y.variante.code}`],
            [Boolean(x.rudi?.nachrangig) !== Boolean(y.rudi?.nachrangig), 'Rudi führt sie vor der anderen'],
            [x.zweckTreffer !== y.zweckTreffer, `der Einsatzzweck im Hauptkatalog trifft ${x.zweckTreffer} deiner Angaben, bei ${y.variante.code} sind es ${y.zweckTreffer}`],
            [x.zweckOffen !== y.zweckOffen, `zu ihr sind weniger Merkmale offen (${x.zweckOffen} gegen ${y.zweckOffen})`],
            [Boolean(x.variante.hk?.zusatz) !== Boolean(y.variante.hk?.zusatz), `${y.variante.code} ist im Hauptkatalog nur eine Zusatzvariante`],
            [nutzen(x) !== nutzen(y), `sie passt zu mehr deiner Angaben (${x.treffer} Treffer, ${x.konflikte} Abweichungen gegen ${y.treffer} und ${y.konflikte})`],
            [x.spezifitaet !== y.spezifitaet, 'ihr Grenzwert passt genauer zu deinem gemessenen Maß'],
            [x.pruefpunkte.length !== y.pruefpunkte.length, `sie lässt weniger beim Aufmaß offen (${x.pruefpunkte.length} gegen ${y.pruefpunkte.length} Prüfpunkte)`],
            [x.qualitaet !== y.qualitaet, 'Rudi nennt sie die hochwertigere Lösung'],
            [sichtbar_(x) !== sichtbar_(y), 'bei ihr ist weniger Befestigung sichtbar'],
        ];
        const treffer = schritte.find(([anders]) => anders);
        return {
            stufe,
            gegen: y.variante.code,
            grund: treffer ? treffer[1] : 'beide sind gleichwertig; sie steht im Katalog weiter vorn',
        };
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
            // Eine Einbauweise verschwindet nicht mehr stillschweigend: Sie wird gesperrt und begründet.
            const belegt = (x) => pool.some((v) => v.lage === x.lage);
            antworten = antworten.map((x) => (belegt(x)
                ? {...x, moeglich: true}
                : {...x, moeglich: false, grund: 'im ausgewählten Sortiment (Hauptkatalog und Rudis Liste) ist dafür keine Lösung hinterlegt – Rücksprache'}));
            if (!antworten.some((x) => x.moeglich)) return [];
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
        if (frage.id === 'system' || frage.id === 'richtung' || frage.id === 'einbauweise') return pool.length;
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
    const VORNE = 3;
    const VORNE_MASS = 3;
    // So viele Lösungen sieht der Monteur im Ergebnis zuerst
    const VORNE_EMPFEHLUNG = 3;

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

    // Fragen ohne Ausschlusswirkung ändern nur die Reihenfolge. Das wird in der Oberfläche gesagt,
    // damit niemand rätselt, warum die Trefferzahl gleich bleibt (Umbauplan B6).
    function nurSortierung(frage, a, vorhandenerPool) {
        // Pflichtfragen bestimmen den Pool (Element, Dachfenster, Auflage) und sortieren nie nur
        if (frage.pflicht || frage.id === 'system' || frage.id === 'richtung' || frage.id === 'einbauweise') return false;
        const pool = vorhandenerPool || auswerten(a).passend.map((b) => b.variante);
        if (frage.typ === 'mass') return !pool.some((v) => v.grenzen.some((g) => g.messbar && (frage.schluessel || []).includes(g.k)));
        for (const antwort of frage.antworten || []) {
            for (const regel of antwort.schliesstAus || []) {
                const trifft = pool.some((v) => v.wahr.has(regel.label)
                    && !(regel.ohneLabel && v.wahr.has(regel.ohneLabel))
                    && (regel.art !== 'A2' || v.belege[regel.label]));
                if (trifft) return false;
            }
        }
        return true;
    }

    function naechsteFrage(a) {
        return offeneFragen(a)[0] || null;
    }

    // Zählt nur, was der Monteur merkt: Ändert eine Antwort die vorderen Lösungen, oder schließt
    // sie eine noch passende Variante aus? Sonst wird die Frage nicht gestellt (Umbauplan §3.2).
    const vorneCodes = (liste) => liste.slice(0, VORNE_EMPFEHLUNG).map((b) => b.variante.code).join('|');

    // Ein Ausschluss unter den vorderen Lösungen ändert die Liste zwangsläufig mit; deshalb genügt
    // der Vergleich der vorderen Codes. Fragen zu weit hinten sortierten Varianten entfallen.
    function aendertEmpfehlung(frage, a, jetzt, antworten) {
        for (const antwort of antworten) {
            if (antwort.moeglich === false) continue;
            if (vorneCodes(auswerten({...a, [frage.id]: antwort.id}).passend) !== jetzt) return true;
        }
        return false;
    }

    // Verlauf in Abschnitten. Innerhalb eines Abschnitts bleibt die Reihenfolge der Fragen stehen;
    // neu hinzukommende Fragen erscheinen unten, nicht als Rücksprung (Umbauplan B5).
    function abschnitte(a) {
        const {passend} = auswerten(a);
        const alle = passend.map((b) => b.variante);
        const jetzt = vorneCodes(passend);
        const vorne = alle.slice(0, VORNE);
        const liste = [];
        let offenBisher = 0;
        for (const abschnitt of abschnittsliste || []) {
            const eintraege = [];
            for (const frage of fragen) {
                if (frage.abschnitt !== abschnitt.nr || !sichtbar(frage, a)) continue;
                const istBeantwortet = a[frage.id] !== undefined;
                // Für eine beantwortete Frage zählen die Möglichkeiten von vor der Antwort,
                // sonst stünde die eigene Auswahl allein da und ließe sich nicht mehr ändern.
                const ohne = istBeantwortet ? {...a, [frage.id]: undefined} : a;
                const poolOhne = istBeantwortet ? auswerten(ohne).passend.map((b) => b.variante) : alle;
                const antworten = antwortenFuer(frage, ohne, poolOhne);
                if (!istBeantwortet && !frage.pflicht) {
                    // Die billige Vorprüfung fragt nur: Reagiert überhaupt eine Variante darauf?
                    // Sie darf nicht auf die vordersten Lösungen schauen – sonst fiele genau die
                    // Frage weg, die eine andere Variante nach vorn holt (z. B. „welche Seite ist eng?“).
                    const pool = frage.typ === 'mass' ? alle.slice(0, VORNE_MASS) : alle;
                    if (wirkung(frage, a, pool) <= 0) continue;
                    // Maße sind freiwillig und schließen erst mit gemessenem Wert aus: Prüfung entfällt hier
                    if (frage.typ !== 'mass' && !frage.immerZeigen && frage.id !== 'system' && !aendertEmpfehlung(frage, a, jetzt, antworten)) continue;
                }
                if (!istBeantwortet && frage.typ !== 'mass' && !antworten.length) continue;
                eintraege.push({frage, antworten, beantwortet: istBeantwortet, nurSortierung: nurSortierung(frage, a, alle)});
            }
            if (!eintraege.length) continue;
            const offen = eintraege.filter((e) => !e.beantwortet).length;
            liste.push({...abschnitt, eintraege, offen, bereit: offenBisher === 0});
            offenBisher += offen;
        }
        return liste;
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
            warumZuerst: warumZuerst(passend[0], passend[1]),
            weitere: passend.slice(1, 3),
            alle: passend,
            ausgeschlossen,
            notizen,
        };
    }

    return {varianten, fragen, bloecke, abschnitte, auswerten, bewerte, ergebnis, warumZuerst, naechsteFrage, offeneFragen, antwortenFuer, nurSortierung, KONFLIKTE, SYSTEM_TEXT, UNBEKANNT, SPAETER};
}

globalThis.H2Engine = {erstelleFinder, UNBEKANNT, SPAETER};
})();
