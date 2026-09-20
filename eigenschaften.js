// Eigenschaften einer Lösung in Monteur-Sprache (Umbauplan Schritt 2).
//
// Grundsatz: Es wird nur gesagt, was in den Daten belegt ist. Ein fehlendes Label heißt
// „darüber sagt der Katalog nichts“ – nicht „gibt es nicht“ (Auswahlplan §3.2 N1).
// Jede Zeile nennt in der Quelle das Label, aus dem sie stammt, damit sie prüfbar bleibt.
(function () {
'use strict';

// Ein Eintrag je Label. Reihenfolge innerhalb einer Gruppe = Reihenfolge in der Anzeige.
const GRUPPEN = [
    {
        titel: 'Produktart',
        labels: [
            ['system.spannrahmen', 'Spannrahmen – fest eingesetzt, zum Aushängen'],
            ['system.pendeltuer', 'Pendeltür – pendelt in beide Richtungen und fällt selbst zu'],
            ['system.drehtuer', 'Drehrahmen für Türen – öffnet wie eine Tür'],
            ['system.pendelfenster', 'Pendelfenster – pendelt und fällt selbst zu'],
            ['system.drehfenster', 'Drehrahmen für Fenster – öffnet wie ein Flügel'],
            ['system.schiebeanlage', 'Schiebeanlage – wird seitlich geschoben'],
            ['system.plissee', 'Plissee – faltet seitlich zusammen'],
            ['system.rollo', 'Rollo – wird aufgerollt'],
            ['system.lichtschachtabdeckung', 'Lichtschachtabdeckung'],
            ['geometrie.zweifluegelig', 'zweiflügelig'],
            ['geometrie.seitenteile_fest', 'mit festen Seitenteilen'],
            ['geometrie.sprossenfrei', 'ohne Sprosse'],
        ],
    },
    {
        titel: 'Wo sie sitzt',
        labels: [
            ['lage.auf_blendrahmen', 'außen auf dem Blendrahmen'],
            ['lage.im_blendrahmen', 'in der Rahmenöffnung'],
            ['lage.mauerleibung', 'in der Mauerleibung'],
            ['lage.innenfutter', 'im Innenfutter des Dachfensters'],
            ['lage.auf_innenfutter', 'auf den Abdeckleisten des Innenfutters'],
            ['lage.lichtschachtfalz', 'auf dem Lichtschachtfalz'],
            ['lage.terrassenausschnitt', 'im Terrassenausschnitt'],
            ['lage.amb_laut_darstellung', 'laut Katalog Außen-Montage-Blendrahmen (AMB)'],
            ['lage.lmb_laut_darstellung', 'laut Katalog Lichte-Montage-Blendrahmen (LMB)'],
            ['lage.lmm_laut_darstellung', 'laut Katalog Lichte-Montage-Mauerleibung (LMM)'],
        ],
    },
    {
        titel: 'Wie sie hält',
        labels: [
            ['befestigung.winkellaschen_gefedert', 'gefederte Winkellaschen – eingehängt, ohne Schraube'],
            ['befestigung.winkellaschen_starr', 'starre Winkellaschen – von innen durch die Öffnung gedrückt, ohne Schraube'],
            ['befestigung.federstifte', 'Federstifte – vier Löcher im Blendrahmen'],
            ['befestigung.seitenarretierung', 'Seitenarretierung möglich'],
            ['montagerahmen.vorhanden', 'mit Montagerahmen'],
            ['montagerahmen.ohne', 'ohne Montagerahmen'],
            ['rahmen.unten_geschlossen', 'Rahmen unten geschlossen'],
            ['rahmen.unten_offen', 'Rahmen unten offen'],
            ['rahmen.unteres_winkelprofil', 'unteres Winkelprofil – für Türen mit Trittschutz'],
            ['rahmen.unteres_schwellenprofil', 'unteres Schwellenprofil – barriere- und schwellenfrei'],
        ],
    },
    {
        titel: 'Wofür sie gedacht ist',
        labels: [
            ['fluegel.buendig', 'für flächenbündige Elemente'],
            ['fluegel.halb_zurueckversetzt', 'für halbflächenversetzte Elemente'],
            ['fluegel.zurueckversetzt', 'für flächenversetzte Elemente'],
            ['geometrie.stulp', 'für Stulpelemente ohne Mittelpfosten'],
            ['geometrie.schwellenfrei', 'barriere- und schwellenfrei'],
            ['geometrie.boden_eben', 'für ebenen Boden oder Fensterbank'],
            ['geometrie.boden_uneben', 'für unebenen Boden'],
            ['geometrie.abdichtung_zum_blendrahmen', 'dichtet nach hinten zum Blendrahmen ab'],
            ['geometrie.mauerleibung_vorhanden', 'setzt eine Mauerleibung voraus'],
            ['geometrie.blendrahmen_umlaufend', 'für umlaufenden Blendrahmen'],
            ['geometrie.ueberschlag_schraeg', 'für schrägen Blendrahmenüberschlag'],
            ['geometrie.ueberschlag_sehr_schraeg', 'für sehr schrägen oder stark abgerundeten Überschlag'],
            ['geometrie.breite_oeffnung', 'für besonders breite Öffnungen'],
            ['material.holz', 'für Holzelemente'],
            ['material.kunststoff', 'für Kunststoffelemente'],
            ['bauteil.trittschutz', 'für Türen mit Trittschutz'],
            ['bauteil.regenschiene_anliegend', 'für am Blendrahmen anliegende Regenschiene'],
            ['bauteil.regenschiene_ueberstehend', 'für am Blendrahmen überstehende Regenschiene'],
            ['bauteil.regenschiene', 'für Elemente mit Regenschiene'],
            ['bauteil.wetterschenkel', 'für Elemente mit überstehendem Wetterschenkel'],
            ['lichtschacht.auflage_3', 'für Lichtschächte mit 3-seitiger Auflage'],
            ['lichtschacht.auflage_4', 'für Lichtschächte mit 4-seitiger Auflage'],
            ['lichtschacht.kellerfenster_ueberstehend', 'für überstehendes Kellerfenster'],
            ['dachfenster.innenfutter_unten_gerade_oben_gerade', 'Innenfutter unten und oben gerade'],
            ['dachfenster.innenfutter_oben_waagerecht', 'Innenfutter oben waagerecht'],
            ['dachfenster.innenfutter_unten_senkrecht', 'Innenfutter unten senkrecht'],
            ['dachfenster.mit_innenfutter_montage', 'Montage im Innenfutter möglich'],
            ['dachfenster.ohne_innenfutter_montage', 'Montage auf den Abdeckleisten'],
        ],
    },
    {
        titel: 'Rollladen',
        labels: [
            ['platz.fuehrung_eng', 'für eng anliegende Rollladenführungsschienen'],
            ['platz.fuehrung_sehr_eng', 'für sehr eng anliegende Führungsschienen'],
            ['platz.fuehrung_eng_links', 'Führungsschiene links (von innen gesehen)'],
            ['platz.fuehrung_eng_rechts', 'Führungsschiene rechts (von innen gesehen)'],
            ['platz.panzer_eng', 'für eng anliegenden Rollladenpanzer'],
            ['platz.rollladen_geteilt', 'für geteilten Rollladen'],
            ['platz.rollladen_haengt', 'für herunterhängenden Rollladenpanzer'],
        ],
    },
    {
        titel: 'Bedienung',
        labels: [
            ['bedienung.oeffnungsrichtung_waehlbar', 'Öffnungsrichtung links oder rechts wählbar'],
            ['bedienung.oeffnet_nach_aussen', 'öffnet nach außen'],
            ['bedienung.oeffnet_nach_innen', 'öffnet nach innen – die Tür lässt sich dann von außen nicht mehr schließen'],
            ['zubehoer.tuerschliesser', 'Türschließer möglich (Aufpreis)'],
            ['serie.selbstschliessend_standard', 'fällt im Standard von selbst zu'],
            ['serie.selbstschliessend_optional', 'Türschließer auf Wunsch'],
            ['serie.selbstschliessend_optional_mit_montagerahmen', 'Türschließer nur mit Montagerahmen'],
        ],
    },
    {
        titel: 'Möglich in dieser Serie',
        labels: [
            ['serie.tierklappe_katze_und_hund', 'Katzen- und Hundeklappe möglich'],
            ['serie.tierklappe_katze', 'nur Katzenklappe möglich – keine Hundeklappe'],
            ['serie.tierklappe_keine', 'keine Tierklappe'],
            ['serie.sprossenfrei_moeglich', 'sprossenfreie Ausführung möglich'],
            ['serie.zusatzrahmen_moeglich', 'Zusatzrahmen zur Aufdoppelung möglich'],
            ['serie.biegbar', 'gebogen oder außenwinklig lieferbar'],
            ['serie.nicht_biegbar', 'nicht biegbar'],
        ],
    },
    {
        titel: 'Was der Katalog ausschließt',
        labels: [
            ['verbot.fluegel_buendig', 'nicht für flächenbündige Elemente'],
            ['verbot.ueberschlag_gerade', 'nicht bei geradem Blendrahmenüberschlag'],
            ['verbot.ueberschlag_extrem', 'nicht bei extrem schrägem Blendrahmenüberschlag'],
            ['verbot.stulpfenster', 'nicht bei Stulpelementen'],
            ['verbot.wetterschenkel', 'nur ohne Wetterschenkel am Flügel'],
            ['verbot.ueber_1200mm', 'nicht über 1200 mm Breite oder Höhe'],
            ['verbot.tuerschliesser', 'kein Türschließer möglich'],
            ['verbot.seitenarretierung', 'keine Seitenarretierung möglich'],
            ['verbot.nicht_befahrbar', 'nicht befahrbar'],
            ['verbot.kein_insektenschutz', 'kein Insekten- und Laubschutz – nur in Kombination'],
        ],
    },
    {
        titel: 'Beim Aufmaß prüfen',
        labels: [
            ['pruefung.durchpendeln', 'muss durchpendeln können'],
            ['pruefung.windbelastung', 'bei Windbelastung stärkere Schließfeder'],
            ['pruefung.beschwerungsstab', 'Beschwerungsstab in der Rollladenendleiste'],
            ['pruefung.rollladenstopper', 'Rollladenstopper bei Montage vor dem Rollladen'],
            ['pruefung.wetterschenkel', 'auf den Wetterschenkel achten'],
            ['pruefung.fluegelabdeckung', 'auf die Flügelabdeckung achten'],
            ['pruefung.stulpversatz', 'Versatz an der Stulpleiste'],
            ['pruefung.griffbedienung', 'Erreichbarkeit des Griffs prüfen'],
            ['pruefung.knopf_stoesst_an', 'Griffknopf kann am Flügel anstoßen'],
            ['pruefung.einbauluft', 'Einbauluft prüfen'],
            ['pruefung.schwellenhoehe', 'Schwellenhöhe beim Durchpendeln'],
            ['pruefung.trittschutz', 'Trittschutz prüfen'],
            ['pruefung.fussmatte', 'Fußmatte oder ansteigender Boden'],
            ['pruefung.entwaesserung', 'Entwässerung der Laufschiene'],
            ['pruefung.gitterrost', 'Zustand und Stabstärke des Gitterrostes'],
            ['pruefung.begangen', 'wird die Abdeckung betreten oder befahren?'],
            ['pruefung.nicht_befahrbar', 'Abdeckung ist nicht befahrbar'],
            ['pruefung.heizraum', 'Vorschriften bei Heizräumen beachten'],
            ['pruefung.schwitzwasser', 'Schwitzwasser an der Polycarbonatplatte möglich'],
            ['pruefung.kunststoffabschluss', 'überstehender Kunststoffabschluss der Regenschiene'],
        ],
    },
];

// Montageseite getrennt: Die 226 Spannrahmen-Seiten der Wissensbasis erben `mounting.on_exterior_side`
// pauschal (Übergabe §5.3). Für diese Serie ist das Label deshalb kein Beleg; dort zählt Rudis Gruppe
// („Spannrahmen innen“ / „Spannrahmen von außen“). Ohne Beleg wird nichts behauptet.
// Von welcher Seite montiert und bedient wird. Der Hauptkatalog sagt es nur dort
// ausdrücklich, wo er die Blickseite der Öffnungsrichtung nennt oder wo eine Variante
// nach innen öffnet. Fehlt beides, bleibt es beim Aufmaß offen – geraten wird nicht.
function montageseite(v) {
    const rudi = (v.rudi || []).map((r) => `${r.gruppe || ''} ${r.untergruppe || ''}`).join(' ').toLowerCase();
    if (v.wahr.has('element.dachfenster')) return {text: 'von innen', quelle: 'Katalog'};
    if (v.wahr.has('bedienung.oeffnet_nach_innen')) return {text: 'von innen', quelle: 'Katalog'};
    if (v.wahr.has('lage.im_blendrahmen') && v.wahr.has('befestigung.winkellaschen_starr')) {
        // Der Katalog: „wird durch die Fensteröffnung von innen nach außen gedrückt“
        return {text: 'von innen', quelle: 'Katalog'};
    }
    if (/innen/.test(rudi)) return {text: 'von innen', quelle: 'Rudi'};
    if (/außen|aussen/.test(rudi)) return {text: 'von außen', quelle: 'Rudi'};
    if (v.wahr.has('bedienung.oeffnet_nach_aussen')) return {text: 'von außen', quelle: 'Katalog'};
    return {text: 'beim Aufmaß festlegen', quelle: null};
}

// Einbaulage aus dem Bezugsmaß des Bestellmaßes (erzeugt, Beleg steht in `lageBeleg`)
const LAGE_TEXT = {
    auf_blendrahmen: 'liegt außen auf dem Blendrahmen auf',
    im_blendrahmen: 'wird in den Blendrahmen eingesetzt (Rahmenöffnung)',
    mauerleibung: 'sitzt in der Mauerleibung',
    fuehrungsschienen: 'sitzt zwischen den Rollladenführungsschienen',
    innenfutter: 'sitzt im Innenfutter des Dachfensters',
    aussenkante: 'sitzt auf der Außenkante des Blendrahmens',
    lichtschacht: 'liegt auf dem Lichtschacht',
};

const ZEICHEN = {gte: '≥', gt: '>', lte: '≤', lt: '<'};
const zahl = (wert) => String(wert).replace('.', ',');
// Manche Grenzwerttexte enthalten „mindestens“ oder „höchstens“ schon selbst
const grenzText = (g) => (/mindestens|höchstens|maximal|mind\.|max\./i.test(g.text)
    ? `${g.text} ${zahl(g.wert)} mm`
    : `${g.text} ${ZEICHEN[g.op] || g.op} ${zahl(g.wert)} mm`);

// Liefert die Stichpunkte einer Variante: [{titel, text, labels}]
function eigenschaften(v) {
    const zeilen = [];
    const seite = montageseite(v);
    for (const gruppe of GRUPPEN) {
        const treffer = gruppe.labels.filter(([label]) => v.wahr.has(label));
        const istMontage = gruppe.titel === 'Montageart';
        if (!treffer.length && !(istMontage && v.lage)) continue;
        const texte = treffer.map(([, text]) => text);
        // Die Einbaulage steht zuerst: Sie ist über das Bestellmaß des Hauptkatalogs belegt.
        if (istMontage && v.lage && LAGE_TEXT[v.lage]) texte.unshift(LAGE_TEXT[v.lage]);
        zeilen.push({titel: gruppe.titel, text: texte.join(', '), labels: treffer.map(([label]) => label)});
        // Die Montageseite steht direkt hinter der Bedienart
        if (gruppe.titel === 'Bedienart') zeilen.push({titel: 'Montageseite', text: seite.text, quelle: seite.quelle, labels: []});
    }
    if (!zeilen.some((z) => z.titel === 'Montageseite')) {
        zeilen.unshift({titel: 'Montageseite', text: seite.text, quelle: seite.quelle, labels: []});
    }
    if (v.geerbt) {
        const h = herkunft(v);
        zeilen.push({titel: 'Datenblatt', labels: [],
            text: h.von ? `kein eigenes im Hauptkatalog – Maße von ${h.von} (${h.einordnung})`
                        : 'kein eigenes im Hauptkatalog – Maße bitte nachfragen'});
        if (h.unterschied) zeilen.push({titel: 'Besonderheit', text: h.unterschied, labels: []});
    }
    if (v.empfehlung) zeilen.push({titel: 'Einsatzzweck', text: String(v.empfehlung), labels: []});

    // Nur nachmessbare Grenzwerte; die übrigen stehen in der Prüfliste beim Aufmaß
    const masse = v.grenzen.filter((g) => g.messbar).map(grenzText);
    if (masse.length) zeilen.push({titel: 'Grenzmaße', text: masse.join(' · '), labels: []});
    return zeilen;
}

// Die Hinweistabelle „Worauf Sie unbedingt achten sollten“ der Katalogseite.
// Jede Zeile trägt ihren Markerbuchstaben aus der Zeichnung und, wo der Katalog eine
// nennt, die Ausweichlösung. Bei Varianten ohne eigenes Datenblatt stammen die Zeilen
// von der Schwestervariante – das steht dann ausdrücklich dabei.
function katalogHinweise(v) {
    const tx = (n) => (typeof n === 'number' ? globalThis.H2Daten.texte[n] : '');
    return (v.hkBedingungen || []).map(([text, alternativ, marker, verweis]) => ({
        marker: marker || '',
        text: tx(text),
        alternativ: tx(alternativ),
        verweis: verweis || '',
    })).filter((z) => z.text);
}

// Woher die Maße dieser Variante kommen, wenn sie kein eigenes Datenblatt hat.
function herkunft(v) {
    if (!v.geerbt) return null;
    const tx = (n) => (typeof n === 'number' ? globalThis.H2Daten.texte[n] : '');
    const g = v.geerbt;
    const sicher = {
        baugleich: 'baugleich – die Maße gelten unverändert',
        gleiche_serie: 'gleiche Serie und Bauart – die Maße sind übertragbar',
        unsicher: 'andere Bauart oder Befestigung – die Maße sind ein Anhalt, kein Beleg',
        keine: 'der Katalog nennt keine Schwestervariante – Maße bitte nachfragen',
    }[g.sicherheit] || g.sicherheit;
    return {
        von: g.von, funktionWie: g.funktionWie, sicherheit: g.sicherheit, einordnung: sicher,
        unterschied: tx(g.unterschied), beleg: tx(g.beleg),
    };
}

globalThis.H2Eigenschaften = {eigenschaften, montageseite, katalogHinweise, herkunft, GRUPPEN};
})();
