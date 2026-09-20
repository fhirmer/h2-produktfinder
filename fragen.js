// Fragenkatalog des Produktfinders (Phase 2). Beschreibung: Katalog/FRAGENKATALOG.md
//
// Jede Frage beschreibt eine Eigenschaft der Einbausituation. Eine Antwort setzt Labels der
// Wissensbasis auf wahr oder falsch. Daraus folgt nur Sortierung – außer die Antwort trägt eine
// Ausschlussregel (A2–A5) mit Beleg. „Weiß ich nicht“ setzt nichts und schließt nie aus.
//
// modus 'eins': Die Labels einer Variante sind Alternativen („flächenbündig und flächenversetzt“).
// modus 'alle': Die Labels einer Variante gelten zusammen („links und rechts eng“); exakt: diese Labels müssen genau übereinstimmen.
// spezifisch: Eine Ja-Antwort sortiert Varianten nach hinten, die für diese Besonderheit nicht ausgelegt sind.
//
// Sprache und Blickseite (Umbauplan Schritt 1):
// - blick: 'aussen' | 'innen' – von welcher Seite man auf das Element schaut. Die Oberfläche
//   schreibt daraus eine Zeile über die Antwortkarten. Ohne Blickseite ist jede Frage nach
//   Versatz, Abstand oder Auflage zweideutig.
// - frageJe / hilfeJe / hinweisJe: Wortlaut je nach gewähltem Element. `frage` und `hilfe`
//   bleiben element-neutrale Zeichenketten, damit engine.js (Prüfpunkte) und der erzeugte
//   Fragenkatalog unverändert damit arbeiten können.
(function () {
'use strict';

const alsFenster = (a) => a.element === 'fenster' && a.fenstertyp !== 'dach';
const alsTuer = (a) => a.element === 'tuer';
const fensterOderTuer = (a) => a.element === 'fenster' || a.element === 'tuer';
const fassade = (a) => a.element === 'tuer' || alsFenster(a);
const mitRollladen = (a) => fassade(a) && a.rollladen === 'ja';
const system = (a, ...s) => !a.system || a.system === 'egal' || a.system === 'unbekannt' || s.includes(a.system);
// Erst die grobe Platzfrage, dann die Seiten im Einzelnen (Wunsch H2, 20.09.2026).
// Solange „Ist rundherum genug Platz?“ offen ist, kommen die Detailfragen nicht – bei
// „teilweise eng“ und bei „weiß ich nicht“ schon, denn dann führen sie zur Antwort.
const engNachfragen = (a) => a.platz === 'eng' || a.platz === 'unbekannt';

// Das gewählte Element in der Form, wie es in einem Satz steht („… auf die geschlossene Tür schauen“)
const elementWort = (a) => (a.element === 'tuer' ? 'die geschlossene Tür'
    : a.element === 'lichtschacht' ? 'den Lichtschacht'
    : a.fenstertyp === 'dach' ? 'das geschlossene Dachfenster'
    : 'das geschlossene Fenster');
// Wortlaut je Element; fehlt ein Eintrag, gilt der Fenstertext
const jeElement = (texte) => (a) => (a.element === 'tuer' ? texte.tuer
    : a.element === 'lichtschacht' ? (texte.lichtschacht ?? texte.fenster)
    : a.fenstertyp === 'dach' ? (texte.dach ?? texte.fenster)
    : texte.fenster);

// Abschnitte des Verlaufs: Der nächste Abschnitt entsteht aus den Antworten des vorherigen.
// `block` bleibt für die Dokumentation erhalten; für die Anzeige zählt `abschnitt`.
const abschnitte = [
    {nr: 1, titel: 'Was soll geschützt werden?', hinweis: 'Element und Bedienung'},
    {nr: 2, titel: 'Wie sieht es vor Ort aus?', hinweis: 'nur Fragen, die die Empfehlung ändern'},
    {nr: 3, titel: 'Wie soll montiert werden?', hinweis: 'Montageort und unterer Abschluss'},
    {nr: 4, titel: 'Feinheiten', hinweis: 'freiwillig – geht auch ohne'},
];

const bloecke = [
    {id: 'A', titel: 'Element'},
    {id: 'G', titel: 'Bedienung'},
    {id: 'B', titel: 'Rahmen'},
    {id: 'C', titel: 'Rollladen und Platz'},
    {id: 'D', titel: 'Unten und Anschluss'},
    {id: 'E', titel: 'Dachfenster'},
    {id: 'F', titel: 'Lichtschacht'},
    {id: 'H', titel: 'Einbauweise'},
    {id: 'J', titel: 'Maße'},
    {id: 'K', titel: 'Wünsche'},
];

const fragen = [
    // A – Element
    {
        id: 'element', abschnitt: 1, block: 'A', pflicht: true, weissNicht: false,
        frage: 'Was bekommt Insektenschutz?',
        antworten: [
            {id: 'fenster', text: 'Fenster', hinweis: 'in der Fassade oder im Dach', skizze: 'fenster'},
            {id: 'tuer', text: 'Tür', hinweis: 'Balkon, Terrasse, Hauseingang', skizze: 'tuer'},
            {id: 'lichtschacht', text: 'Lichtschacht', hinweis: 'Kellerfenster, Gitterrost', skizze: 'lichtschacht'},
        ],
    },
    {
        id: 'fenstertyp', abschnitt: 1, block: 'A', pflicht: true, weissNicht: false,
        zeigen: (a) => a.element === 'fenster',
        frage: 'Welches Fenster?',
        antworten: [
            {id: 'fassade', text: 'Fenster in der Wand', hinweis: 'senkrecht in der Fassade', skizze: 'fenster'},
            {id: 'dach', text: 'Dachfenster', hinweis: 'schräg im Dach', skizze: 'dachfenster'},
        ],
    },
    {
        id: 'tuerart', abschnitt: 1, block: 'A',
        zeigen: alsTuer,
        frage: 'Wie ist die Tür aufgebaut?',
        hilfe: 'Stulptür: zwei Flügel, und beim Öffnen bleibt kein fester Mittelpfosten stehen.',
        labels: ['geometrie.stulp', 'system.schiebeanlage'],
        antworten: [
            {id: 'einfluegel', text: 'Ein Flügel', skizze: 'tuer', setzt: {'geometrie.stulp': false, 'system.schiebeanlage': false}},
            {id: 'stulp', text: 'Zwei Flügel ohne Mittelpfosten', hinweis: 'Stulptür', skizze: 'stulp', setzt: {'geometrie.stulp': true, 'system.schiebeanlage': false}},
            {id: 'schiebe', text: 'Schiebetür', hinweis: 'auch Hebe-Schiebe-Tür', skizze: 'schiebetuer', setzt: {'system.schiebeanlage': true}},
        ],
    },

    // B – Rahmen
    {
        id: 'material', abschnitt: 2, block: 'B',
        zeigen: fensterOderTuer,
        frage: 'Aus welchem Material ist der Rahmen?',
        hilfe: 'Das Material sortiert nur. Holz-Alu und Kunststoff-Alu behandelt der Katalog wie Kunststoff.',
        labels: ['material.holz', 'material.kunststoff'],
        antworten: [
            {id: 'kunststoff', text: 'Kunststoff', setzt: {'material.kunststoff': true, 'material.holz': false}},
            {id: 'holz', text: 'Holz', setzt: {'material.holz': true, 'material.kunststoff': false}},
            {id: 'alu', text: 'Aluminium', setzt: {'material.holz': false}},
            {id: 'holzalu', text: 'Holz-Alu', hinweis: 'wie Kunststoff', setzt: {'material.kunststoff': true, 'material.holz': false}},
            {id: 'kunststoffalu', text: 'Kunststoff-Alu', hinweis: 'wie Kunststoff', setzt: {'material.kunststoff': true, 'material.holz': false}},
        ],
    },
    {
        id: 'stulpfenster', abschnitt: 2, block: 'B',
        zeigen: alsFenster,
        frage: 'Hat das Fenster zwei Flügel ohne festen Mittelpfosten?',
        hilfe: 'Stulpfenster: Öffnet man beide Flügel, bleibt in der Mitte kein Pfosten stehen.',
        skizze: 'stulp',
        labels: ['geometrie.stulp'],
        antworten: [
            {id: 'ja', text: 'Ja, Stulpfenster', setzt: {'geometrie.stulp': true}},
            {id: 'nein', text: 'Nein', setzt: {'geometrie.stulp': false}},
        ],
    },
    {
        id: 'fluegellage', abschnitt: 2, block: 'B', blick: 'aussen',
        zeigen: (a) => fassade(a) && a.tuerart !== 'schiebe',
        frage: 'Wie liegt der Flügel zum Rahmen?',
        hilfe: 'Von außen seitlich auf das geschlossene Element schauen: Liegt die Außenfläche des Flügels in einer Ebene mit dem festen Rahmen oder dahinter? Der Flügel kann nicht vorstehen – der Blendrahmen überdeckt ihn.',
        hilfeJe: jeElement({
            fenster: 'Von außen seitlich auf das geschlossene Fenster schauen: Liegt die Außenfläche des Flügels in einer Ebene mit dem Blendrahmen oder dahinter? Der Flügel kann nicht vorstehen – der Blendrahmenüberschlag überdeckt ihn.',
            tuer: 'Von außen seitlich auf die geschlossene Tür schauen: Liegt die Außenfläche des Türflügels in einer Ebene mit dem Blendrahmen oder dahinter? Der Flügel kann nicht vorstehen – der Blendrahmenüberschlag überdeckt ihn.',
        }),
        skizze: 'fluegellage',
        labels: ['fluegel.buendig', 'fluegel.zurueckversetzt', 'fluegel.halb_zurueckversetzt'],
        antworten: [
            {id: 'buendig', text: 'Bündig', hinweis: 'Flügel und Rahmen in einer Ebene', skizze: 'buendig',
                setzt: {'fluegel.buendig': true, 'fluegel.zurueckversetzt': false, 'fluegel.halb_zurueckversetzt': false},
                schliesstAus: [{art: 'A2', label: 'verbot.fluegel_buendig', grund: 'nicht für flächenbündige Flügel'}]},
            {id: 'versetzt', text: 'Flügel liegt zurück', hinweis: 'flächenversetzt: der Blendrahmen steht vor', skizze: 'versetzt',
                setzt: {'fluegel.zurueckversetzt': true, 'fluegel.buendig': false, 'fluegel.halb_zurueckversetzt': false}},
            {id: 'halb', text: 'Flügel liegt halb zurück', hinweis: 'halbflächenversetzt: nur wenig Versatz', skizze: 'halbversetzt',
                setzt: {'fluegel.halb_zurueckversetzt': true, 'fluegel.buendig': false, 'fluegel.zurueckversetzt': false}},
        ],
    },
    {
        id: 'ueberschlag', abschnitt: 2, block: 'B', blick: 'aussen',
        zeigen: (a) => fassade(a) && a.tuerart !== 'schiebe',
        frage: 'Wie sieht die Außenkante des Blendrahmens aus?',
        hilfe: 'Gemeint ist der Überschlag: die äußere Kante des festen Rahmens, auf der der Insektenschutz aufliegt. Von außen seitlich darauf schauen.',
        skizze: 'ueberschlag',
        labels: ['geometrie.ueberschlag_schraeg', 'geometrie.ueberschlag_sehr_schraeg'],
        antworten: [
            {id: 'gerade', text: 'Gerade', skizze: 'ueberschlag-gerade',
                setzt: {'geometrie.ueberschlag_schraeg': false, 'geometrie.ueberschlag_sehr_schraeg': false},
                schliesstAus: [{art: 'A2', label: 'verbot.ueberschlag_gerade', grund: 'nicht bei geradem Blendrahmenüberschlag'}]},
            {id: 'schraeg', text: 'Schräg', skizze: 'ueberschlag-schraeg',
                setzt: {'geometrie.ueberschlag_schraeg': true, 'geometrie.ueberschlag_sehr_schraeg': false}},
            {id: 'sehrschraeg', text: 'Sehr schräg oder stark abgerundet', skizze: 'ueberschlag-sehrschraeg',
                setzt: {'geometrie.ueberschlag_sehr_schraeg': true},
                schliesstAus: [{art: 'A2', label: 'verbot.ueberschlag_extrem', grund: 'nicht bei extrem schrägem Blendrahmenüberschlag'}]},
        ],
    },
    {
        id: 'sonderform', abschnitt: 2, block: 'B',
        zeigen: alsFenster,
        frage: 'Ist das Fenster rechteckig?',
        labels: ['serie.biegbar'],
        antworten: [
            {id: 'rechteckig', text: 'Ja, rechteckig', skizze: 'rechteckig'},
            {id: 'sonderform', text: 'Nein: Bogen oder schiefwinklig', skizze: 'bogen', setzt: {'serie.biegbar': true}},
        ],
    },

    // C – Rollladen und Platz
    {
        id: 'rollladen', abschnitt: 2, block: 'C',
        zeigen: fassade,
        frage: 'Ist ein Rollladen vorhanden?',
        skizze: 'rollladen',
        labels: ['platz.panzer_eng', 'platz.fuehrung_eng_links', 'platz.fuehrung_eng_rechts', 'platz.fuehrung_eng', 'platz.rollladen_haengt'],
        antworten: [
            {id: 'ja', text: 'Ja', setzt: {}},
            {id: 'nein', text: 'Nein', setzt: {'platz.panzer_eng': false, 'platz.fuehrung_eng_links': false, 'platz.fuehrung_eng_rechts': false, 'platz.fuehrung_eng': false, 'platz.rollladen_haengt': false}},
        ],
    },
    {
        // Erst die eine große Frage, dann erst die Seiten einzeln (Rückmeldung H2 vom 18.09.2026).
        // „Genug Platz“ setzt die Eng-Labels auf falsch: Das sortiert Eng-Varianten nach hinten,
        // schließt aber nichts aus.
        // Wird immer gestellt (Wunsch H2, 20.09.2026): erst grob, dann erst die Seiten im Einzelnen.
        id: 'platz', abschnitt: 2, block: 'C', blick: 'aussen', grob: true, immerZeigen: true,
        zeigen: fassade,
        frage: 'Ist rundherum genug Platz für den Insektenschutz?',
        hilfe: 'Gemeint ist die freie Fläche auf dem Blendrahmen: seitlich, oben und – wenn vorhanden – zum Rollladen hin. Faustregel: Passt überall mindestens ein Finger breit (etwa 15 mm) auf den Rahmen?',
        skizze: 'platz',
        labels: ['platz.panzer_eng', 'platz.fuehrung_eng_links', 'platz.fuehrung_eng_rechts', 'platz.fuehrung_eng'],
        antworten: [
            {id: 'genug', text: 'Überall genug Platz', hinweis: 'ringsum mindestens fingerbreit frei',
                setzt: {'platz.panzer_eng': false, 'platz.fuehrung_eng_links': false, 'platz.fuehrung_eng_rechts': false, 'platz.fuehrung_eng': false}},
            {id: 'eng', text: 'Teilweise eng', hinweis: 'dann frage ich die Seiten einzeln ab'},
        ],
    },
    {
        id: 'panzer', abschnitt: 2, block: 'C', blick: 'aussen',
        zeigen: (a) => mitRollladen(a) && engNachfragen(a),
        frage: 'Liegt der heruntergelassene Rollladen eng am Flügel?',
        hilfe: 'Rollladen ganz herunterlassen und von außen seitlich schauen, wie viel Platz zwischen Panzer und Flügel bleibt.',
        skizze: 'panzer',
        labels: ['platz.panzer_eng'],
        antworten: [
            {id: 'eng', text: 'Eng, kaum Platz', setzt: {'platz.panzer_eng': true}},
            {id: 'abstand', text: 'Genug Abstand', setzt: {'platz.panzer_eng': false}},
        ],
    },
    {
        // Blickseite innen, nicht außen: Der Katalog unterscheidet SP2/11 und SP2/12
        // ausdrücklich „von innen betrachtet“ (gedruckte Seite 17, Zusatzkasten unter dem
        // Horizontalschnitt). Von außen gefragt wären links und rechts vertauscht.
        id: 'fuehrung', abschnitt: 2, block: 'C', blick: 'innen',
        zeigen: (a) => mitRollladen(a) && engNachfragen(a),
        modus: 'alle',
        exakt: ['platz.fuehrung_eng_links', 'platz.fuehrung_eng_rechts'],
        frage: 'Sitzen die Führungsschienen eng am Blendrahmen?',
        hilfe: 'Von innen schauen: Bleibt zwischen Führungsschiene und Flügel nur wenig Rahmenfläche frei? Links und rechts gelten von innen gesehen – so benennt es auch der Katalog.',
        hilfeJe: jeElement({
            fenster: 'Von innen durch das Fenster schauen: Bleibt zwischen Führungsschiene und Fensterflügel nur wenig Rahmenfläche frei? Links und rechts gelten von innen gesehen – so benennt es auch der Katalog.',
            tuer: 'Von innen durch die Tür schauen: Bleibt zwischen Führungsschiene und Türflügel nur wenig Rahmenfläche frei? Links und rechts gelten von innen gesehen – so benennt es auch der Katalog.',
        }),
        skizze: 'fuehrung',
        labels: ['platz.fuehrung_eng_links', 'platz.fuehrung_eng_rechts', 'platz.fuehrung_eng'],
        antworten: [
            {id: 'beide', text: 'Ja, auf beiden Seiten', setzt: {'platz.fuehrung_eng_links': true, 'platz.fuehrung_eng_rechts': true, 'platz.fuehrung_eng': true}},
            {id: 'links', text: 'Nur links eng', hinweis: 'von innen gesehen', setzt: {'platz.fuehrung_eng_links': true, 'platz.fuehrung_eng_rechts': false}},
            {id: 'rechts', text: 'Nur rechts eng', hinweis: 'von innen gesehen', setzt: {'platz.fuehrung_eng_rechts': true, 'platz.fuehrung_eng_links': false}},
            {id: 'nein', text: 'Nein, genug Platz', setzt: {'platz.fuehrung_eng_links': false, 'platz.fuehrung_eng_rechts': false, 'platz.fuehrung_eng': false}},
        ],
    },
    {
        id: 'haengend', abschnitt: 2, spezifisch: true, block: 'C', blick: 'aussen',
        zeigen: mitRollladen,
        frage: 'Hängt der Rollladen in die Öffnung, auch wenn er ganz hochgezogen ist?',
        hilfe: 'Rollladen ganz hochziehen und von außen schauen, ob die unterste Lamelle noch vor der Öffnung steht.',
        skizze: 'haengend',
        labels: ['platz.rollladen_haengt'],
        antworten: [
            {id: 'ja', text: 'Ja, er hängt herunter', setzt: {'platz.rollladen_haengt': true}},
            {id: 'nein', text: 'Nein', setzt: {'platz.rollladen_haengt': false}},
        ],
    },
    {
        id: 'geteilt', abschnitt: 2, spezifisch: true, block: 'C',
        zeigen: (a) => mitRollladen(a) && a.element === 'tuer',
        frage: 'Ist der Rollladen geteilt (zwei Rollläden nebeneinander)?',
        labels: ['platz.rollladen_geteilt'],
        antworten: [
            {id: 'ja', text: 'Ja, geteilt', skizze: 'geteilt', setzt: {'platz.rollladen_geteilt': true}},
            {id: 'nein', text: 'Nein', setzt: {'platz.rollladen_geteilt': false}},
        ],
    },

    // D – Unten und Anschluss
    {
        id: 'regenschiene', abschnitt: 2, block: 'D', blick: 'aussen',
        zeigen: alsFenster,
        frage: 'Ist unten am Blendrahmen eine Regenschiene?',
        hilfe: 'Von außen auf die Unterkante schauen. Regenschiene: Alu-Profil unten am festen Rahmen, meist bei Holzfenstern. Die Fensterbank ist keine Regenschiene.',
        skizze: 'regenschiene',
        labels: ['bauteil.regenschiene'],
        antworten: [
            {id: 'ja', text: 'Ja', setzt: {'bauteil.regenschiene': true}},
            {id: 'nein', text: 'Nein', setzt: {'bauteil.regenschiene': false},
                schliesstAus: [{art: 'A4', label: 'bauteil.regenschiene_anliegend', grund: 'dichtet an der Regenschiene ab, es gibt aber keine'}]},
        ],
    },
    {
        id: 'regenschiene_lage', abschnitt: 2, block: 'D', blick: 'aussen',
        zeigen: (a) => alsFenster(a) && a.regenschiene === 'ja',
        frage: 'Liegt die Regenschiene am Blendrahmen an oder steht sie über?',
        hilfe: 'Von außen seitlich schauen: Schließt die Schiene bündig mit der Außenfläche des Blendrahmens ab oder steht sie davor?',
        skizze: 'regenschiene',
        labels: ['bauteil.regenschiene_anliegend', 'bauteil.regenschiene_ueberstehend'],
        antworten: [
            {id: 'anliegend', text: 'Liegt am Blendrahmen an', setzt: {'bauteil.regenschiene_anliegend': true, 'bauteil.regenschiene_ueberstehend': false}},
            {id: 'ueberstehend', text: 'Steht über den Blendrahmen vor', setzt: {'bauteil.regenschiene_ueberstehend': true, 'bauteil.regenschiene_anliegend': false}},
        ],
    },
    {
        id: 'wetterschenkel', abschnitt: 2, block: 'D', blick: 'aussen',
        zeigen: alsFenster,
        frage: 'Ist unten am Flügel ein Wetterschenkel?',
        hilfe: 'Von außen auf die Unterkante des beweglichen Flügels schauen. Wetterschenkel: Leiste unten am Flügel, die Wasser ableitet. Nicht mit der Regenschiene am festen Rahmen verwechseln.',
        skizze: 'wetterschenkel',
        labels: ['pruefung.wetterschenkel'],
        antworten: [
            {id: 'ja', text: 'Ja', setzt: {'pruefung.wetterschenkel': true}},
            {id: 'nein', text: 'Nein', setzt: {'pruefung.wetterschenkel': false}},
        ],
    },
    {
        id: 'schwelle', abschnitt: 2, spezifisch: true, block: 'D',
        zeigen: alsTuer,
        frage: 'Ist die Tür unten schwellenfrei?',
        hilfe: 'Schwellenfrei bzw. barrierefrei: Der Boden geht ohne Stufe oder Kante durch die Tür.',
        skizze: 'schwelle',
        labels: ['geometrie.schwellenfrei', 'geometrie.blendrahmen_umlaufend'],
        antworten: [
            {id: 'ja', text: 'Ja, schwellenfrei', setzt: {'geometrie.schwellenfrei': true, 'geometrie.blendrahmen_umlaufend': false}},
            {id: 'nein', text: 'Nein, mit Schwelle', hinweis: 'Blendrahmen läuft auch unten durch', setzt: {'geometrie.blendrahmen_umlaufend': true, 'geometrie.schwellenfrei': false}},
        ],
    },
    {
        id: 'trittschutz', abschnitt: 2, block: 'D',
        zeigen: (a) => alsTuer(a) && a.tuerart !== 'schiebe',
        frage: 'Hat die Tür unten ein Trittschutzprofil?',
        hilfe: 'Trittschutz: Profil unten auf dem Rahmen, typisch bei Kunststofftüren.',
        skizze: 'trittschutz',
        labels: ['bauteil.trittschutz'],
        antworten: [
            {id: 'ja', text: 'Ja', setzt: {'bauteil.trittschutz': true}},
            {id: 'nein', text: 'Nein', setzt: {'bauteil.trittschutz': false}},
        ],
    },
    {
        id: 'boden', abschnitt: 2, block: 'D',
        zeigen: (a) => alsTuer(a) || (alsFenster(a) && ['rollo', 'plissee'].includes(a.system)),
        frage: 'Ist die Fläche unten eben?',
        frageJe: jeElement({
            fenster: 'Ist die Fensterbank unten eben?',
            tuer: 'Ist der Boden im Türdurchgang eben?',
        }),
        hilfe: 'Gemeint ist die Fläche, auf der der Insektenschutz unten aufsitzt.',
        hilfeJe: jeElement({
            fenster: 'Gemeint ist die Fensterbank, auf der das Rollo bzw. Plissee unten aufsitzt.',
            tuer: 'Gemeint ist der Boden im Durchgang, auf dem die Anlage unten aufsitzt: Fliesen, Estrich, Holzdiele, Naturstein.',
        }),
        labels: ['geometrie.boden_eben', 'geometrie.boden_uneben', 'geometrie.abdichtung_zum_blendrahmen'],
        antworten: [
            {id: 'eben', text: 'Eben', skizze: 'boden-eben', setzt: {'geometrie.boden_eben': true, 'geometrie.boden_uneben': false,
                'geometrie.abdichtung_zum_blendrahmen': false}},
            {id: 'uneben', text: 'Uneben oder ansteigend', skizze: 'boden-uneben', setzt: {'geometrie.boden_uneben': true,
                'geometrie.boden_eben': false, 'geometrie.abdichtung_zum_blendrahmen': false}},
            // RO4/9 und RO5/9 dichten nicht nach unten, sondern nach hinten zum Blendrahmen ab –
            // die Lösung für Fensterbänke, auf denen unten nichts aufsitzen soll.
            {id: 'blendrahmen', text: 'Unten soll nichts aufsitzen', hinweis: 'Abdichtung nach hinten zum Blendrahmen', skizze: 'boden-blendrahmen',
                nur: (a) => a.system === 'rollo',
                setzt: {'geometrie.abdichtung_zum_blendrahmen': true, 'geometrie.boden_eben': false,
                    'geometrie.boden_uneben': false}},
        ],
    },
    {
        id: 'mauerleibung', abschnitt: 2, block: 'D',
        zeigen: fassade,
        frage: 'Gibt es neben dem Rahmen eine gerade Mauerleibung, an der montiert werden kann?',
        hilfe: 'Mauerleibung: die seitliche Wandfläche neben dem Blendrahmen.',
        skizze: 'mauerleibung',
        labels: ['geometrie.mauerleibung_vorhanden'],
        antworten: [
            {id: 'ja', text: 'Ja', setzt: {'geometrie.mauerleibung_vorhanden': true}},
            {id: 'nein', text: 'Nein', setzt: {'geometrie.mauerleibung_vorhanden': false},
                schliesstAus: [{art: 'A4', label: 'lage.mauerleibung', grund: 'wird in der Mauerleibung montiert, es gibt aber keine'}]},
        ],
    },

    {
        id: 'schiebefluegel', abschnitt: 2, block: 'D',
        zeigen: (a) => alsTuer(a) && (a.tuerart === 'schiebe' || a.system === 'schiebe'),
        frage: 'Wie viele Schiebeflügel soll die Anlage haben?',
        skizze: 'schiebe',
        labels: ['geometrie.zweifluegelig', 'geometrie.seitenteile_fest'],
        antworten: [
            {id: 'einer', text: 'Einen Flügel', setzt: {'geometrie.zweifluegelig': false}},
            {id: 'zwei_seitenteile', text: 'Zwei gegenläufige Flügel', hinweis: 'links und rechts feste Seitenteile', setzt: {'geometrie.zweifluegelig': true, 'geometrie.seitenteile_fest': true}},
            {id: 'zwei', text: 'Zwei Flügel ohne feste Seitenteile', setzt: {'geometrie.zweifluegelig': true, 'geometrie.seitenteile_fest': false},
                schliesstAus: [{art: 'A4', label: 'geometrie.seitenteile_fest', grund: 'braucht links und rechts ein festes Seitenteil'}]},
        ],
    },

    // E – Dachfenster
    {
        id: 'innenfutter_unten', abschnitt: 2, block: 'E',
        zeigen: (a) => a.fenstertyp === 'dach',
        frage: 'Wie verläuft das Innenfutter unten?',
        hilfe: 'Innenfutter: die Verkleidung der Dachfenster-Leibung im Raum.',
        skizze: 'innenfutter',
        labels: ['dachfenster.innenfutter_unten_gerade_oben_gerade', 'dachfenster.innenfutter_unten_senkrecht'],
        antworten: [
            {id: 'gerade', text: 'Im rechten Winkel zum Fenster', skizze: 'innenfutter-gerade', setzt: {'dachfenster.innenfutter_unten_gerade_oben_gerade': true, 'dachfenster.innenfutter_unten_senkrecht': false}},
            {id: 'senkrecht', text: 'Senkrecht nach unten', skizze: 'innenfutter-senkrecht', setzt: {'dachfenster.innenfutter_unten_senkrecht': true, 'dachfenster.innenfutter_unten_gerade_oben_gerade': false}},
        ],
    },
    {
        id: 'innenfutter_oben', abschnitt: 2, block: 'E',
        zeigen: (a) => a.fenstertyp === 'dach',
        frage: 'Wie verläuft das Innenfutter oben?',
        skizze: 'innenfutter',
        labels: ['dachfenster.innenfutter_unten_gerade_oben_gerade', 'dachfenster.innenfutter_oben_waagerecht'],
        antworten: [
            {id: 'gerade', text: 'Im rechten Winkel zum Fenster', skizze: 'innenfutter-oben-gerade', setzt: {'dachfenster.innenfutter_unten_gerade_oben_gerade': true, 'dachfenster.innenfutter_oben_waagerecht': false}},
            {id: 'waagerecht', text: 'Waagerecht', skizze: 'innenfutter-waagerecht', setzt: {'dachfenster.innenfutter_oben_waagerecht': true, 'dachfenster.innenfutter_unten_gerade_oben_gerade': false}},
        ],
    },
    {
        id: 'innenfutter_montage', abschnitt: 2, block: 'E',
        zeigen: (a) => a.fenstertyp === 'dach',
        frage: 'Kann direkt im Innenfutter montiert werden?',
        labels: ['lage.innenfutter', 'dachfenster.ohne_innenfutter_montage'],
        antworten: [
            {id: 'ja', text: 'Ja', skizze: 'innenfutter-montage', setzt: {'lage.innenfutter': true}},
            {id: 'nein', text: 'Nein, nur auf den Abdeckleisten', setzt: {'dachfenster.ohne_innenfutter_montage': true, 'lage.innenfutter': false},
                schliesstAus: [{art: 'A4', label: 'lage.innenfutter', grund: 'wird im Innenfutter montiert, das geht hier nicht'}]},
        ],
    },

    // F – Lichtschacht
    {
        id: 'auflage', abschnitt: 2, block: 'F', pflicht: true,
        zeigen: (a) => a.element === 'lichtschacht',
        frage: 'Auf wie vielen Seiten liegt die Abdeckung auf?',
        hilfe: 'Bei 3 Seiten schließt die Abdeckung hinten an die Hauswand an.',
        skizze: 'auflage',
        labels: ['lichtschacht.auflage_4', 'lichtschacht.auflage_3'],
        antworten: [
            {id: 'vier', text: '4 Seiten', skizze: 'auflage-4', setzt: {'lichtschacht.auflage_4': true, 'lichtschacht.auflage_3': false}},
            {id: 'drei', text: '3 Seiten, hinten Hauswand', skizze: 'auflage-3', setzt: {'lichtschacht.auflage_3': true, 'lichtschacht.auflage_4': false},
                schliesstAus: [{art: 'A4', label: 'lichtschacht.auflage_4', ohneLabel: 'lichtschacht.auflage_3', grund: 'braucht Auflage auf allen 4 Seiten'}]},
        ],
    },
    {
        id: 'kellerfenster', abschnitt: 2, spezifisch: true, block: 'F',
        zeigen: (a) => a.element === 'lichtschacht' && a.auflage !== 'vier',
        frage: 'Steht das Kellerfenster über die Hauswand in den Schacht?',
        skizze: 'kellerfenster',
        labels: ['lichtschacht.kellerfenster_ueberstehend'],
        antworten: [
            {id: 'ja', text: 'Ja', skizze: 'kellerfenster', setzt: {'lichtschacht.kellerfenster_ueberstehend': true}},
            {id: 'nein', text: 'Nein', setzt: {'lichtschacht.kellerfenster_ueberstehend': false}},
        ],
    },
    {
        id: 'gitterrost', abschnitt: 2, block: 'F',
        zeigen: (a) => a.element === 'lichtschacht',
        frage: 'Ist der Gitterrost tragfähig, formstabil und nicht verrostet?',
        skizze: 'gitterrost',
        antworten: [
            {id: 'ja', text: 'Ja'},
            {id: 'nein', text: 'Nein',
                schliesstAus: [{art: 'A4', label: 'pruefung.gitterrost', grund: 'braucht einen tragfähigen Gitterrost'}]},
        ],
    },

    // G – Bedienung
    {
        id: 'system', abschnitt: 1, block: 'G',
        zeigen: (a) => a.element === 'fenster' || a.element === 'tuer',
        frage: 'Wie soll der Insektenschutz funktionieren?',
        antworten: [
            {id: 'spannrahmen', text: 'Fest einsetzen', hinweis: 'Spannrahmen', skizze: 'spannrahmen', system: 'spannrahmen', nur: (a) => alsFenster(a)},
            {id: 'rollo', text: 'Aufrollen', hinweis: 'Rollo', skizze: 'rollo', system: 'rollo'},
            {id: 'pendel', text: 'In beide Richtungen pendeln', hinweis: 'Pendelfenster', hinweisJe: jeElement({fenster: 'Pendelfenster', tuer: 'Pendeltür'}), skizze: 'pendel', system: 'pendel', nur: fassade},
            {id: 'dreh', text: 'Aufdrehen', hinweis: 'Drehrahmen', skizze: 'dreh', system: 'dreh', nur: fassade},
            {id: 'plissee', text: 'Seitlich falten', hinweis: 'Plissee', skizze: 'plissee', system: 'plissee', nur: fassade},
            {id: 'schiebe', text: 'Seitlich schieben', hinweis: 'Schiebeanlage', skizze: 'schiebe', system: 'schiebe', nur: alsTuer},
            {id: 'schieberahmen', text: 'Hochschieben', hinweis: 'Schieberahmen', skizze: 'schieberahmen', system: 'schieberahmen', nur: (a) => a.fenstertyp === 'dach'},
            {id: 'egal', text: 'Noch offen', hinweis: 'alle Bedienarten zeigen', system: 'egal'},
        ],
    },
    {
        id: 'richtung', abschnitt: 1, block: 'G',
        zeigen: (a) => fassade(a) && a.system === 'dreh',
        frage: 'Wohin soll sich der Insektenschutz öffnen?',
        hilfe: 'Die Öffnungsrichtung legt zugleich die Montageseite fest: Nach innen öffnend sitzt der Rahmen innen im Raum, nach außen öffnend sitzt er außen.',
        hilfeJe: jeElement({
            fenster: 'Die Öffnungsrichtung legt zugleich die Montageseite fest: Nach innen öffnend sitzt der Rahmen innen im Raum, nach außen öffnend außen vor dem Fenster. Der Hauptkatalog empfiehlt bei Fenstern nach innen, damit man sich zum Bedienen nicht hinauslehnen muss.',
            tuer: 'Die Öffnungsrichtung legt zugleich die Montageseite fest: Nach innen öffnend sitzt der Rahmen innen im Raum, nach außen öffnend außen vor der Tür. Nach außen braucht davor freien Platz; nach innen ist die Lösung, wenn oben der Rollladen hereinhängt.',
        }),
        labels: ['bedienung.oeffnet_nach_aussen', 'bedienung.oeffnet_nach_innen'],
        antworten: [
            {id: 'aussen', text: 'Nach außen', hinweis: 'ins Freie; der Rahmen sitzt dann außen', skizze: 'richtung-aussen',
                richtung: 'bedienung.oeffnet_nach_aussen',
                setzt: {'bedienung.oeffnet_nach_aussen': true, 'bedienung.oeffnet_nach_innen': false}},
            {id: 'innen', text: 'Nach innen', hinweis: 'in den Raum; der Rahmen sitzt dann innen', skizze: 'richtung-innen',
                richtung: 'bedienung.oeffnet_nach_innen',
                setzt: {'bedienung.oeffnet_nach_innen': true, 'bedienung.oeffnet_nach_aussen': false}},
            {id: 'egal', text: 'Egal'},
        ],
    },
    {
        id: 'tuerschliesser', abschnitt: 1, block: 'G',
        zeigen: (a) => alsTuer(a) && system(a, 'dreh'),
        frage: 'Soll die Tür einen Türschließer bekommen?',
        skizze: 'tuerschliesser',
        antworten: [
            {id: 'ja', text: 'Ja', skizze: 'tuerschliesser', setzt: {'zubehoer.tuerschliesser': true},
                schliesstAus: [{art: 'A2', label: 'verbot.tuerschliesser',
                    grund: 'Der Katalog schreibt auf der Seite dieser Variante: Türschließer nicht möglich'}]},
            {id: 'nein', text: 'Nein'},
        ],
        labels: ['zubehoer.tuerschliesser', 'verbot.tuerschliesser'],
    },

    // H – Einbauweise
    {
        id: 'einbauweise', abschnitt: 3, block: 'H', blick: 'aussen',
        // Immer zeigen: Wo montiert wird, ist ein Wunsch des Kunden und keine Folge der
        // anderen Antworten. Ohne diese Frage fiel „Im Blendrahmen“ früher ganz weg,
        // obwohl 26 Varianten dort sitzen.
        immerZeigen: true,
        zeigen: fassade,
        frage: 'Wo soll montiert werden?',
        hilfe: 'Von außen betrachtet: außen vor den Blendrahmen gesetzt, in die Öffnung des Blendrahmens gesetzt oder seitlich in die Mauerleibung. Möglichkeiten ohne hinterlegte Lösung bleiben sichtbar und nennen den Grund.',
        skizze: 'einbauweise',
        // Die Lage kommt aus dem Bestellmaß-Bezug des Hauptkatalogs, nicht mehr aus Montagerahmen-Labels.
        // Die Kürzel AMB/LMB/LMM gelten nur für Systeme mit Montagerahmen; im Spannrahmen-Katalog
        // kommen sie kein einziges Mal vor und werden dort deshalb nicht genannt.
        // Die Montagerahmen-Labels sortieren weiter (sie sind je Variante belegt); die pauschal
        // geerbten Labels `mounting.on_frame_front` und `mounting.in_frame_opening` entfallen hier,
        // weil sie bei Spannrahmen für alle Seiten gleich gesetzt sind und nichts unterscheiden.
        // Die Einbaulage ist für 157 von 158 Varianten aus dem Bestellmaß belegt – anders als
        // die Kürzel AMB/LMB/LMM, die es nur bei Systemen mit Montagerahmen gibt.
        labels: ['lage.auf_blendrahmen', 'lage.im_blendrahmen', 'lage.mauerleibung',
            'lage.amb_laut_darstellung', 'lage.lmb_laut_darstellung', 'lage.lmm_laut_darstellung'],
        antworten: [
            {id: 'amb', text: 'Außen auf den Blendrahmen', lage: 'auf_blendrahmen', skizze: 'amb',
                hinweis: 'liegt auf dem Blendrahmen auf',
                hinweisJe: (a) => (a.system === 'spannrahmen' ? 'liegt auf dem Blendrahmenüberschlag auf' : 'vorgesetzter Montagerahmen, Katalogkürzel AMB'),
                setzt: {'lage.auf_blendrahmen': true, 'lage.amb_laut_darstellung': true, 'lage.im_blendrahmen': false, 'lage.mauerleibung': false, 'lage.lmb_laut_darstellung': false, 'lage.lmm_laut_darstellung': false}},
            {id: 'lmb', text: 'Im Blendrahmen', lage: 'im_blendrahmen', skizze: 'lmb',
                hinweis: 'sitzt in der Rahmenöffnung',
                hinweisJe: (a) => (a.system === 'spannrahmen' ? 'wird in die Rahmenöffnung eingesetzt' : 'Montagerahmen in der Rahmenöffnung, Katalogkürzel LMB'),
                setzt: {'lage.im_blendrahmen': true, 'lage.lmb_laut_darstellung': true, 'lage.auf_blendrahmen': false, 'lage.mauerleibung': false, 'lage.amb_laut_darstellung': false, 'lage.lmm_laut_darstellung': false}},
            {id: 'lmm', text: 'In der Mauerleibung', lage: 'mauerleibung', skizze: 'lmm',
                hinweis: 'sitzt seitlich in der Wandöffnung',
                hinweisJe: (a) => (a.system === 'spannrahmen' ? 'wird in die Mauerleibung gesetzt' : 'Montagerahmen in der Mauerleibung, Katalogkürzel LMM'),
                setzt: {'lage.mauerleibung': true, 'lage.lmm_laut_darstellung': true, 'lage.auf_blendrahmen': false, 'lage.im_blendrahmen': false, 'lage.amb_laut_darstellung': false, 'lage.lmb_laut_darstellung': false}},
        ],
    },
    {
        id: 'abschluss', abschnitt: 3, block: 'H',
        zeigen: (a) => fassade(a) && system(a, 'pendel', 'dreh', 'plissee', 'rollo'),
        frage: 'Soll der Rahmen unten geschlossen oder offen sein?',
        hilfe: 'Unten offen: keine Kante, die Bürste dichtet nach unten ab. Unten geschlossen: umlaufender Rahmen, gut bei unebenem Untergrund.',
        hilfeJe: jeElement({
            fenster: 'Unten offen: kein Profil, die Bürste dichtet zur Fensterbank ab. Unten geschlossen: umlaufender Rahmen, gut bei unebener Fensterbank.',
            tuer: 'Unten offen: keine Stolperkante, die Bürste dichtet zum Boden ab. Unten geschlossen: umlaufender Rahmen, gut bei unebenem Boden.',
        }),
        labels: ['rahmen.unten_geschlossen', 'rahmen.unten_offen'],
        antworten: [
            {id: 'geschlossen', text: 'Unten geschlossen', skizze: 'abschluss-geschlossen', setzt: {'rahmen.unten_geschlossen': true, 'rahmen.unten_offen': false}},
            {id: 'offen', text: 'Unten offen', skizze: 'abschluss-offen', setzt: {'rahmen.unten_offen': true, 'rahmen.unten_geschlossen': false}},
            {id: 'egal', text: 'Egal'},
        ],
    },
    {
        id: 'zweifluegelig', abschnitt: 3, block: 'H',
        zeigen: (a) => alsTuer(a) && a.tuerart === 'stulp' && system(a, 'pendel', 'dreh', 'plissee'),
        frage: 'Soll der Insektenschutz selbst zwei Flügel haben?',
        hilfe: 'Zweiflügelig: je Türflügel ein Insektenschutzflügel. Einflügelig: ein Flügel über die ganze Breite oder nur für den Gehflügel.',
        labels: ['geometrie.zweifluegelig'],
        antworten: [
            {id: 'einer', text: 'Ein Flügel', skizze: 'einfluegelig', setzt: {'geometrie.zweifluegelig': false}},
            {id: 'zwei', text: 'Zwei Flügel', skizze: 'zweifluegelig', setzt: {'geometrie.zweifluegelig': true}},
            {id: 'egal', text: 'Egal'},
        ],
    },
    {
        id: 'sprosse', abschnitt: 3, block: 'H',
        zeigen: (a) => alsFenster(a) && system(a, 'spannrahmen'),
        frage: 'Darf der Spannrahmen eine Quersprosse haben?',
        hilfe: 'Sprossenfreie Varianten sehen ruhiger aus; bei großen Elementen kann eine Sprosse nötig sein (Sprossengrenzen im Katalog).',
        labels: ['geometrie.sprossenfrei'],
        antworten: [
            {id: 'ohne', text: 'Ohne Sprosse', skizze: 'ohne-sprosse', setzt: {'geometrie.sprossenfrei': true}},
            {id: 'mit', text: 'Sprosse ist in Ordnung', skizze: 'mit-sprosse', setzt: {'geometrie.sprossenfrei': false}},
            {id: 'egal', text: 'Egal'},
        ],
    },
    {
        id: 'montagerahmen', abschnitt: 3, block: 'H',
        zeigen: (a) => fassade(a) && system(a, 'dreh'),
        frage: 'Mit oder ohne Montagerahmen?',
        hilfe: 'Ohne Rahmen wird der Drehrahmen direkt am Blendrahmen befestigt.',
        labels: ['montagerahmen.vorhanden', 'montagerahmen.ohne'],
        antworten: [
            {id: 'ohne', text: 'Ohne Montagerahmen', skizze: 'ohne-montagerahmen', setzt: {'montagerahmen.ohne': true, 'montagerahmen.vorhanden': false}},
            {id: 'mit', text: 'Mit Montagerahmen', skizze: 'mit-montagerahmen', setzt: {'montagerahmen.vorhanden': true, 'montagerahmen.ohne': false}},
            {id: 'egal', text: 'Egal'},
        ],
    },

    // J – Maße (A3 nur bei gemessenem Wert)
    {
        id: 'mass_seitlich', abschnitt: 4, block: 'J', typ: 'mass', einheit: 'mm',
        klassen: [
            {skizze: 'spalt-eng', id: 'eng', text: 'Sehr wenig', hinweis: 'schmaler als ein Finger, unter ca. 15 mm', bis: 15},
            {skizze: 'spalt-mittel', id: 'normal', text: 'Fingerbreit', hinweis: 'ungefähr 15 bis 25 mm', ab: 15, bis: 25},
            {skizze: 'spalt-weit', id: 'viel', text: 'Viel Platz', hinweis: 'breiter als ein Daumen, über ca. 25 mm', ab: 25},
        ], blick: 'aussen',
        zeigen: (a) => fassade(a) && engNachfragen(a),
        frage: 'Wie breit ist die freie Auflagefläche seitlich am Blendrahmen?',
        hilfe: 'Von außen messen: von der Außenkante des Blendrahmens bis zum Flügel bzw. bis zur Rollladenführung. Die schmalere der beiden Seiten zählt.',
        skizze: 'mass-seitlich',
        schluessel: ['side_support_min', 'mounting_frame_side_support_min'],
    },
    {
        id: 'mass_fuehrung', abschnitt: 4, block: 'J', typ: 'mass', einheit: 'mm',
        klassen: [
            {skizze: 'spalt-eng', id: 'eng', text: 'Schiene klebt am Rahmen', hinweis: 'unter ca. 15 mm', bis: 15},
            {skizze: 'spalt-mittel', id: 'normal', text: 'Etwas Luft', hinweis: 'ungefähr 15 bis 25 mm', ab: 15, bis: 25},
            {skizze: 'spalt-weit', id: 'viel', text: 'Deutlich Abstand', hinweis: 'über ca. 25 mm', ab: 25},
        ], blick: 'aussen',
        zeigen: (a) => mitRollladen(a) && engNachfragen(a),
        frage: 'Wie weit ist die Führungsschiene vom Blendrahmen entfernt?',
        hilfe: 'Von außen seitlich messen: von der Rollladen-Führungsschiene bis zur Außenkante des Blendrahmens.',
        skizze: 'mass-fuehrung',
        schluessel: ['shutter.guide_to_frame_min'],
    },
    {
        id: 'mass_oben', abschnitt: 4, block: 'J', typ: 'mass', einheit: 'mm',
        klassen: [
            {skizze: 'spalt-eng', id: 'eng', text: 'Fast nichts frei', hinweis: 'unter ca. 18 mm', bis: 18},
            {skizze: 'spalt-mittel', id: 'normal', text: 'Ein Finger passt', hinweis: 'ungefähr 18 bis 30 mm', ab: 18, bis: 30},
            {skizze: 'spalt-weit', id: 'viel', text: 'Reichlich Platz', hinweis: 'über ca. 30 mm', ab: 30},
        ], blick: 'aussen',
        zeigen: (a) => alsFenster(a) && engNachfragen(a),
        frage: 'Wie viel Blendrahmenfläche ist oben über dem Flügel frei?',
        hilfe: 'Von außen messen: von der Oberkante des Flügels bis zur Oberkante des Blendrahmens. Der Katalog nennt das die obere Blendrahmenüberstandsfläche.',
        skizze: 'mass-oben',
        schluessel: ['upper_frame_projection_min'],
    },
    {
        id: 'mass_tiefe', abschnitt: 4, block: 'J', typ: 'mass', einheit: 'mm',
        klassen: [
            {skizze: 'spalt-eng', id: 'eng', text: 'Kaum Luft nach außen', hinweis: 'unter ca. 25 mm', bis: 25},
            {skizze: 'spalt-mittel', id: 'normal', text: 'Eine Handbreit knapp', hinweis: 'ungefähr 25 bis 65 mm', ab: 25, bis: 65},
            {skizze: 'spalt-weit', id: 'viel', text: 'Viel Platz nach außen', hinweis: 'über ca. 65 mm', ab: 65},
        ], blick: 'aussen',
        zeigen: (a) => fassade(a) && engNachfragen(a),
        frage: 'Wie viel Platz ist vor dem Blendrahmen bis zum Rollladen?',
        hilfe: 'Einbautiefe, von außen gemessen: von der Außenfläche des Blendrahmens nach außen bis zum ersten Hindernis davor, meist Rollladenpanzer oder Führungsschiene.',
        skizze: 'mass-tiefe',
        schluessel: ['installation_depth_min'],
    },
    {
        id: 'mass_versatz', abschnitt: 4, block: 'J', typ: 'mass', einheit: 'mm',
        klassen: [
            {skizze: 'spalt-eng', id: 'kaum', text: 'Kaum zurückversetzt', hinweis: 'unter ca. 8 mm', bis: 8},
            {skizze: 'spalt-mittel', id: 'deutlich', text: 'Deutlich zurückversetzt', hinweis: 'ungefähr 8 bis 20 mm', ab: 8, bis: 20},
            {skizze: 'spalt-weit', id: 'stark', text: 'Weit zurückversetzt', hinweis: 'über ca. 20 mm', ab: 20},
        ], blick: 'aussen',
        zeigen: (a) => fassade(a) && a.fluegellage !== 'buendig',
        frage: 'Wie tief liegt der Flügel hinter dem Blendrahmen?',
        hilfe: 'Von außen seitlich schauen und den Flächenversatz messen: von der Außenfläche des Blendrahmens bis zur zurückliegenden Außenfläche des Flügels.',
        hilfeJe: jeElement({
            fenster: 'Von außen seitlich schauen und den Flächenversatz messen: von der Außenfläche des Blendrahmens bis zur zurückliegenden Außenfläche des Fensterflügels.',
            tuer: 'Von außen seitlich schauen und den Flächenversatz messen: von der Außenfläche des Blendrahmens bis zur zurückliegenden Außenfläche des Türflügels.',
        }),
        skizze: 'versetzt',
        schluessel: ['sash_offset_min'],
    },
    {
        id: 'mass_regenschiene', abschnitt: 4, block: 'J', typ: 'mass', einheit: 'mm',
        klassen: [
            {skizze: 'spalt-eng', id: 'buendig', text: 'Schließt bündig ab', hinweis: 'kein nennenswerter Überstand', bis: 3},
            {skizze: 'spalt-mittel', id: 'wenig', text: 'Steht wenig vor', hinweis: 'ungefähr 3 bis 12 mm', ab: 3, bis: 12},
            {skizze: 'spalt-weit', id: 'viel', text: 'Steht deutlich vor', hinweis: 'über ca. 12 mm', ab: 12},
        ], blick: 'aussen',
        zeigen: (a) => alsFenster(a) && a.regenschiene === 'ja',
        frage: 'Wie weit steht die Regenschiene über den Blendrahmen vor?',
        hilfe: 'Von außen seitlich messen: von der Außenfläche des Blendrahmens bis zur Vorderkante der Regenschiene.',
        skizze: 'regenschiene',
        schluessel: ['rain_rail_projection_max'],
    },
    {
        id: 'mass_wetterschenkel', abschnitt: 4, block: 'J', typ: 'mass', einheit: 'mm',
        klassen: [
            {skizze: 'spalt-eng', id: 'buendig', text: 'Schließt bündig ab', hinweis: 'kein nennenswerter Überstand', bis: 3},
            {skizze: 'spalt-mittel', id: 'wenig', text: 'Steht wenig vor', hinweis: 'ungefähr 3 bis 12 mm', ab: 3, bis: 12},
            {skizze: 'spalt-weit', id: 'viel', text: 'Steht deutlich vor', hinweis: 'über ca. 12 mm', ab: 12},
        ], blick: 'aussen',
        zeigen: (a) => alsFenster(a) && a.wetterschenkel === 'ja',
        frage: 'Wie weit steht der Wetterschenkel vor?',
        hilfe: 'Von außen seitlich messen: von der Außenfläche des Flügels bis zur Vorderkante des Wetterschenkels.',
        skizze: 'wetterschenkel',
        schluessel: ['weather_bar_projection_max'],
    },
    {
        id: 'mass_kellerfenster', abschnitt: 4, block: 'J', typ: 'mass', einheit: 'mm',
        klassen: [
            {skizze: 'spalt-eng', id: 'klein', text: 'Wenig', hinweis: 'bis etwa 90 mm, gut eine Handbreit', bis: 90},
            {skizze: 'spalt-mittel', id: 'mittel', text: 'Mittel', hinweis: 'ungefähr 90 bis 110 mm', ab: 90, bis: 110},
            {skizze: 'spalt-weit', id: 'gross', text: 'Weit', hinweis: 'über ca. 110 mm', ab: 110},
        ],
        zeigen: (a) => a.element === 'lichtschacht' && a.kellerfenster === 'ja',
        frage: 'Wie weit steht das Kellerfenster über?',
        hilfe: 'Von oben in den Schacht schauen und waagerecht messen: von der Hauswand bis zur vordersten Kante des Kellerfensters.',
        skizze: 'kellerfenster',
        schluessel: ['light_well_window_overhang_max', 'light_well_window_overhang_min'],
    },

    // K – Wünsche (nur Hinweise zum Gewebe, nie Ausschluss)
    {
        id: 'wunsch', abschnitt: 4, block: 'K', typ: 'mehrfach', immerZeigen: true, ohneAuswahl: 'Keine besonderen Wünsche',
        zeigen: (a) => Boolean(a.element),
        frage: 'Gibt es besondere Wünsche?',
        antworten: [
            {id: 'pollen', text: 'Pollenschutz', notiz: 'Polltec PIA (bis 99 % Pollenschutz) oder TFP (bis 90 %) nur für Rahmensysteme; Gewebebreite und Freigabe der Variante prüfen.'},
            {id: 'tiere', text: 'Haustiere', notiz: 'Stabilotec PAE (kleine Haustiere) oder PA für Rahmensysteme; bei Türen ggf. Tierklappe (Katze 158 × 170 mm, Hund 298 × 350 mm).'},
            {id: 'klein', text: 'Sehr kleine Insekten', notiz: 'Transpatec TFM (65 % offene Fläche) für Rollo- und Rahmensysteme; Freigabe der Variante prüfen.'},
            {id: 'begehbar', text: 'Wird darüber gelaufen', notiz: 'Für häufig begangene Lichtschächte Aluminiumstreckmetall (SMDG, SMMG, SME1) prüfen. Die Abdeckung ersetzt keinen tragfähigen Gitterrost.', nur: (a) => a.element === 'lichtschacht'},
        ],
    },
];

const H2Fragen = {bloecke, abschnitte, fragen, elementWort};
globalThis.H2Fragen = H2Fragen;
})();
