// Skizzen für Fragen und Antworten: große, einfache Strichzeichnungen.
//
// Bildsprache – überall gleich, damit man sie einmal lernt und dann wiedererkennt:
//   Wand              schraffierte Fläche
//   Blendrahmen       mittel gefüllt, der feste Rahmen
//   Flügel            hell gefüllt, der bewegliche Teil
//   Insektenschutz    gelb (der Akzentfarbe des Finders) – das ist immer das Produkt
//   Rollladen         grau gefüllter Kasten, Schienen als dicke Striche
//   Maß               dünne Linie mit Endstrichen und Beschriftung
//
// Bildfeld 160 × 120. Alles außer dem Insektenschutz zeichnet über `currentColor`,
// damit die Zeichnungen im hellen und im dunklen Modus lesbar bleiben.
//
// Schnitte: **oben = außen**, unten = innen. Beide Seiten sind beschriftet.
// Der Flügel liegt bündig mit dem Blendrahmen oder dahinter – er steht nie davor
// (Hauptkatalog, Zeichnung „Flächenversatz am Fensterflügel“).
(function () {
'use strict';

const svg = (inhalt, titel) => `<svg viewBox="0 0 160 120" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${titel}">${inhalt}</svg>`;

// Gelb = Insektenschutz. Als CSS-Variable, damit die Zeichnung der Seitenfarbe folgt.
const GELB = 'var(--akzent, #f5b800)';
const z = (n) => Math.round(n * 10) / 10;

// ---------- Bausteine ----------
// Schraffur für Wandflächen: 45°-Linien, an den Rechteckkanten abgeschnitten
const schraffur = (x, y, b, h, schritt = 10) => {
    let d = '';
    for (let o = -h; o < b; o += schritt) {
        let x1 = x + o, y1 = y, x2 = x + o + h, y2 = y + h;
        if (x1 < x) { y1 += x - x1; x1 = x; }
        if (x2 > x + b) { y2 -= x2 - (x + b); x2 = x + b; }
        if (x2 - x1 < 1) continue;
        d += `M${z(x1)} ${z(y1)}L${z(x2)} ${z(y2)}`;
    }
    return d ? `<path d="${d}" stroke-width="1" opacity=".5"/>` : '';
};
const wand = (x, y, b, h) => `<rect x="${x}" y="${y}" width="${b}" height="${h}" fill="currentColor" fill-opacity=".06" stroke-width="1.6"/>${schraffur(x, y, b, h)}`;
const rahmen = (x, y, b, h) => `<rect x="${x}" y="${y}" width="${b}" height="${h}" rx="2" fill="currentColor" fill-opacity=".32" stroke-width="2.2"/>`;
const fluegel = (x, y, b, h) => `<rect x="${x}" y="${y}" width="${b}" height="${h}" rx="2" fill="currentColor" fill-opacity=".07" stroke-width="2.2"/>`;
const kasten = (x, y, b, h) => `<rect x="${x}" y="${y}" width="${b}" height="${h}" rx="2.5" fill="currentColor" fill-opacity=".22" stroke-width="2"/>`;
// Insektenschutzfläche in der Ansicht: gelbe Fläche mit angedeutetem Gewebe
const netz = (x, y, b, h) => {
    let g = '';
    for (let i = x + 9; i < x + b - 2; i += 9) g += `M${z(i)} ${y}v${h}`;
    for (let i = y + 9; i < y + h - 2; i += 9) g += `M${x} ${z(i)}h${b}`;
    return `<rect x="${x}" y="${y}" width="${b}" height="${h}" fill="${GELB}" fill-opacity=".18" stroke="${GELB}" stroke-width="2.2"/>`
        + `<path d="${g}" stroke="${GELB}" stroke-width=".8" opacity=".7"/>`;
};
// Insektenschutz im Schnitt: eine kräftige gelbe Kante
const netzkante = (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${GELB}" stroke-width="5"/>`;
const gelberRahmen = (x, y, b, h) => {
    let g = '';
    for (let i = x + 10; i < x + b - 3; i += 10) g += `M${z(i)} ${y}v${h}`;
    for (let i = y + 10; i < y + h - 3; i += 10) g += `M${x} ${z(i)}h${b}`;
    return `<rect x="${x}" y="${y}" width="${b}" height="${h}" rx="1.5" fill="${GELB}" fill-opacity=".14" stroke="${GELB}" stroke-width="4"/>`
        + `<path d="${g}" stroke="${GELB}" stroke-width=".8" opacity=".6"/>`;
};
const text = (x, y, t, groesse = 12) => `<text x="${x}" y="${y}" font-size="${groesse}" fill="currentColor" stroke="none" font-family="Arial,Helvetica,sans-serif">${t}</text>`;
const boden = (y = 112) => `<path d="M4 ${y}h152" stroke-width="3"/>`;
const pfeil = (x1, y1, x2, y2, breite = 2.4) => {
    const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
    const ex = dx / l, ey = dy / l, s = 7;
    const p1x = z(x2 - ex * s - ey * s * 0.45), p1y = z(y2 - ey * s + ex * s * 0.45);
    const p2x = z(x2 - ex * s + ey * s * 0.45), p2y = z(y2 - ey * s - ex * s * 0.45);
    return `<path d="M${x1} ${y1}L${z(x2)} ${z(y2)}" stroke-width="${breite}"/><path d="M${p1x} ${p1y}L${z(x2)} ${z(y2)}L${p2x} ${p2y}" stroke-width="${breite}"/>`;
};
// Maßlinie mit Endstrichen; die Beschriftung bleibt immer im Bildfeld
const mass = (x1, y1, x2, y2, beschriftung = null) => {
    const senkrecht = x1 === x2;
    const enden = senkrecht
        ? `<path d="M${x1 - 4} ${y1}h8M${x2 - 4} ${y2}h8" stroke-width="1.4"/>`
        : `<path d="M${x1} ${y1 - 4}v8M${x2} ${y2 - 4}v8" stroke-width="1.4"/>`;
    let schrift = '';
    if (beschriftung) {
        const breite = beschriftung.length * 6.1;
        let tx = senkrecht ? (x1 > 80 ? x1 - breite - 6 : x1 + 6) : (x1 + x2) / 2 - breite / 2;
        const ty = senkrecht ? (y1 + y2) / 2 + 4 : Math.max(Math.min(y1, y2) - 6, 11);
        tx = Math.min(Math.max(tx, 3), 157 - breite);
        schrift = text(z(tx), z(ty), beschriftung, 11);
    }
    return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke-width="1.4"/>${enden}${schrift}`;
};
// Seitenangabe im Schnitt: außen oben, innen unten
const seiten = (x = 5) => text(x, 13, 'außen', 11) + text(x, 114, 'innen', 12);
// Bildunterschrift im unteren Band. Die Zeichnung selbst endet bei y = 100.
const unterschrift = (t) => text(5, 114, t, 11);
const frageZeichen = (x, y) => text(x, y, '?', 17);

// Dachfenster im senkrechten Schnitt: das Dach fällt nach rechts ab, der Raum liegt links unten.
// Das Innenfutter ist die Laibung, die vom Fenster in den Raum führt – oben und unten getrennt gefragt.
const DACH_OBEN = '<path d="M14 14L62 44" stroke-width="6"/>';
const DACH_UNTEN = '<path d="M102 69L148 98" stroke-width="6"/>';
const DACH_FENSTER = `<path d="M60.4 47.4L99.4 71.6L103 65.8L64 41.6z" fill="currentColor" fill-opacity=".10" stroke-width="2"/>`;
const dachbild = (futterOben, futterUnten, beschriftung, titel) => svg(
    DACH_OBEN + DACH_UNTEN + DACH_FENSTER + futterOben + futterUnten + beschriftung, titel);
// Futterschenkel: „gerade“ läuft im Dachwinkel weiter, „senkrecht“ und „waagerecht“ knicken ab
const F_OBEN_GERADE = (stark = true) => `<path d="M62 44L44 74" stroke-width="${stark ? 5 : 2}"${stark ? '' : ' opacity=".45"'}/>`;
const F_OBEN_WAAGERECHT = (stark = true) => `<path d="M62 44H28" stroke-width="${stark ? 5 : 2}"${stark ? '' : ' opacity=".45"'}/>`;
const F_UNTEN_GERADE = (stark = true) => `<path d="M102 69L84 99" stroke-width="${stark ? 5 : 2}"${stark ? '' : ' opacity=".45"'}/>`;
const F_UNTEN_SENKRECHT = (stark = true) => `<path d="M102 69V100" stroke-width="${stark ? 5 : 2}"${stark ? '' : ' opacity=".45"'}/>`;

const H2Skizzen = {
    // ---------- Elemente (Ansicht von außen) ----------
    fenster: svg(`${rahmen(20, 10, 120, 90)}${fluegel(30, 20, 100, 70)}`
        + '<path d="M80 20v70M30 55h100" stroke-width="1.6"/>'
        + '<path d="M26 50h6v16h-6z" fill="currentColor" fill-opacity=".5" stroke-width="1.6"/>'
        + unterschrift('Fenster'), 'Fenster in der Wand'),
    tuer: svg(`${rahmen(44, 6, 74, 94)}${fluegel(53, 14, 56, 78)}`
        + '<path d="M99 52h8" stroke-width="4"/>'
        + '<path d="M62 22h38v22H62z" stroke-width="1.4" opacity=".6"/>'
        + boden(100) + unterschrift('Tür'), 'Tür'),
    lichtschacht: svg(`${wand(6, 4, 148, 20)}${fluegel(46, 7, 40, 14)}`
        + `${rahmen(14, 32, 132, 64)}`
        + '<path d="M14 48h132M14 64h132M14 80h132M50 32v64M82 32v64M114 32v64" stroke-width="1.6"/>'
        + unterschrift('Lichtschacht mit Rost'), 'Lichtschacht mit Gitterrost vor dem Kellerfenster'),
    dachfenster: svg('<path d="M8 96L92 8l58 44" stroke-width="3"/>'
        + '<path d="M50 62l38-40 26 20-38 40z" fill="currentColor" fill-opacity=".10" stroke-width="2.4"/>'
        + '<path d="M60 72l38-40" stroke-width="1.4"/>'
        + unterschrift('Fenster im Dach'), 'Dachfenster im schrägen Dach'),
    stulp: svg(`${rahmen(16, 10, 128, 86)}${fluegel(24, 18, 54, 70)}${fluegel(82, 18, 54, 70)}`
        + '<path d="M80 18v70" stroke-width="4"/>'
        + unterschrift('kein Mittelpfosten'), 'Stulp: zwei Flügel ohne festen Mittelpfosten'),
    schiebetuer: svg(`${rahmen(10, 6, 140, 92)}${fluegel(18, 14, 64, 76)}${fluegel(78, 20, 64, 64)}`
        + pfeil(64, 52, 30, 52)
        + unterschrift('Flügel schiebt seitlich'), 'Schiebetür'),
    bogen: svg('<path d="M20 100V52a60 44 0 0 1 120 0v48z" fill="currentColor" fill-opacity=".32" stroke-width="2.4"/>'
        + '<path d="M32 100V54a48 34 0 0 1 96 0v46z" fill="currentColor" fill-opacity=".07" stroke-width="2"/>'
        + unterschrift('Bogen oder schief'), 'Fenster mit Bogen statt rechtem Winkel'),
    rechteckig: svg(`${rahmen(20, 10, 120, 90)}${fluegel(30, 20, 100, 70)}`
        + '<path d="M30 36h16M30 20v16" stroke-width="2.8"/>'
        + text(50, 34, '90°', 12)
        + unterschrift('rechteckig'), 'Rechteckiges Fenster'),

    // ---------- Flügellage (Schnitt, oben = außen) ----------
    fluegellage: svg(`${rahmen(10, 40, 30, 38)}${fluegel(40, 40, 30, 38)}<path d="M6 40h68" stroke-width="1.2" stroke-dasharray="4 4"/>`
        + `${rahmen(90, 32, 30, 38)}${fluegel(120, 52, 32, 26)}<path d="M86 32h70" stroke-width="1.2" stroke-dasharray="4 4"/>`
        + text(12, 96, 'bündig', 11) + text(94, 96, 'versetzt', 11) + text(5, 12, 'außen', 12),
    'Flügellage im Schnitt: bündig und zurückversetzt'),
    buendig: svg(`${rahmen(16, 38, 60, 44)}${fluegel(76, 38, 68, 44)}`
        + '<path d="M10 38h140" stroke-width="1.4" stroke-dasharray="4 4"/>'
        + text(22, 66, 'Rahmen', 11) + text(92, 66, 'Flügel', 12) + seiten(), 'flächenbündig: Flügel und Blendrahmen liegen in einer Ebene'),
    versetzt: svg(`${rahmen(16, 28, 60, 54)}${fluegel(76, 56, 68, 26)}`
        + '<path d="M10 28h140" stroke-width="1.4" stroke-dasharray="4 4"/>'
        + mass(150, 28, 150, 56, 'Versatz')
        + text(22, 60, 'Rahmen', 11) + text(90, 74, 'Flügel', 12) + seiten(), 'flächenversetzt: der Flügel liegt deutlich hinter dem Blendrahmen'),
    halbversetzt: svg(`${rahmen(16, 28, 60, 54)}${fluegel(76, 42, 68, 40)}`
        + '<path d="M10 28h140" stroke-width="1.4" stroke-dasharray="4 4"/>'
        + mass(150, 28, 150, 42, 'halb')
        + text(22, 60, 'Rahmen', 11) + text(90, 68, 'Flügel', 12) + seiten(), 'halbflächenversetzt: der Flügel liegt etwas hinter dem Blendrahmen'),

    // ---------- Überschlag (Profilkante des Blendrahmens) ----------
    ueberschlag: svg('<path d="M14 96V30h26v66z" fill="currentColor" fill-opacity=".32" stroke-width="2.2"/>'
        + '<path d="M64 96V30h14l16 16v50z" fill="currentColor" fill-opacity=".32" stroke-width="2.2"/>'
        + '<path d="M114 96V30h6q26 0 26 28v38z" fill="currentColor" fill-opacity=".32" stroke-width="2.2"/>'
        + text(14, 113, 'gerade', 11) + text(62, 113, 'schräg', 11) + text(112, 113, 'rund', 12), 'Überschlag: gerade, schräg, sehr schräg'),
    'ueberschlag-gerade': svg('<path d="M44 100V24h72v76z" fill="currentColor" fill-opacity=".32" stroke-width="3"/>'
        + text(5, 12, 'außen', 12) + unterschrift('scharfe Kante'), 'gerader Blendrahmenüberschlag'),
    'ueberschlag-schraeg': svg('<path d="M44 100V24h40l32 30v46z" fill="currentColor" fill-opacity=".32" stroke-width="3"/>'
        + text(5, 12, 'außen', 12) + unterschrift('Kante angeschrägt'), 'schräger Blendrahmenüberschlag'),
    'ueberschlag-sehrschraeg': svg('<path d="M44 100V24h12q60 0 60 52v24z" fill="currentColor" fill-opacity=".32" stroke-width="3"/>'
        + text(5, 12, 'außen', 12) + unterschrift('stark abgerundet'), 'sehr schräger oder abgerundeter Blendrahmenüberschlag'),

    // ---------- Rollladen und Platz ----------
    rollladen: svg(`${kasten(16, 6, 128, 18)}`
        + '<path d="M24 24v76M136 24v76" stroke-width="5"/>'
        + '<path d="M34 36h92M34 48h92M34 60h92M34 72h92M34 84h92" stroke-width="1.6"/>'
        + text(38, 19, 'Kasten', 12) + unterschrift('Kasten und Schienen'), 'Rollladen mit Kasten und Führungsschienen'),
    platz: svg(`${rahmen(14, 8, 132, 88)}${fluegel(46, 32, 68, 44)}`
        + mass(18, 54, 42, 54) + mass(118, 54, 142, 54) + mass(80, 12, 80, 28)
        + frageZeichen(25, 50) + frageZeichen(125, 50) + frageZeichen(76, 26)
        + unterschrift('ringsum genug Platz?'), 'Freie Fläche ringsum auf dem Blendrahmen'),
    panzer: svg(`${rahmen(20, 52, 44, 48)}${fluegel(64, 64, 76, 36)}`
        + '<path d="M56 32h96" stroke-width="7" stroke-dasharray="9 4"/>'
        + mass(148, 36, 148, 64) + text(58, 24, 'Rollladenpanzer', 12) + seiten(), 'Rollladenpanzer eng vor dem Flügel'),
    fuehrung: svg(`${rahmen(30, 8, 100, 88)}${fluegel(42, 20, 76, 64)}`
        + '<path d="M18 8v88M142 8v88" stroke-width="7"/>'
        + pfeil(4, 52, 16, 52, 2) + pfeil(156, 52, 144, 52, 2)
        + unterschrift('von innen gesehen'), 'Führungsschienen eng am Blendrahmen'),
    haengend: svg(`${kasten(16, 6, 128, 16)}`
        + '<path d="M24 22v78M136 22v78" stroke-width="5"/>'
        + '<path d="M34 30h92M34 40h92" stroke-width="2.4"/>'
        + `${netz(34, 54, 92, 42)}` + pfeil(80, 42, 80, 56)
        + unterschrift('Panzer hängt herunter'), 'Rollladen hängt in die Öffnung'),
    geteilt: svg(`${kasten(16, 6, 128, 16)}`
        + '<path d="M24 22v78M78 22v78M84 22v78M136 22v78" stroke-width="5"/>'
        + '<path d="M32 34h42M88 34h42M32 46h42M88 46h42M32 58h42M88 58h42M32 70h42M88 70h42" stroke-width="1.6"/>'
        + unterschrift('zwei Panzer nebeneinander'), 'Geteilter Rollladen mit Mittelschiene'),

    // ---------- Unterer Anschluss ----------
    regenschiene: svg(`${fluegel(54, 8, 48, 48)}${rahmen(18, 58, 124, 24)}`
        + '<path d="M46 60h58v12h16" stroke-width="5"/>'
        + text(20, 30, 'Flügel', 12)
        + unterschrift('Regenschiene unten'), 'Regenschiene unten am Blendrahmen'),
    wetterschenkel: svg(`${fluegel(54, 8, 48, 52)}`
        + '<path d="M96 44h26l-9 18H96z" fill="currentColor" fill-opacity=".45" stroke-width="2.2"/>'
        + `${rahmen(18, 68, 124, 24)}`
        + text(18, 30, 'Flügel', 12)
        + unterschrift('Schrägprofil am Flügel'), 'Wetterschenkel unten am Flügel'),
    schwelle: svg(boden(90) + `${rahmen(54, 74, 52, 16)}${fluegel(64, 10, 32, 64)}`
        + mass(114, 74, 114, 90) + text(18, 30, 'Tür', 12)
        + unterschrift('Schwelle steht hoch'), 'Türschwelle unter der Tür'),
    trittschutz: svg(boden(96) + `${rahmen(44, 74, 72, 22)}`
        + '<path d="M50 74h60V60H50z" fill="currentColor" fill-opacity=".55" stroke-width="2.2"/>'
        + `${fluegel(64, 8, 32, 52)}` + text(18, 30, 'Tür', 12)
        + unterschrift('Trittschutzprofil unten'), 'Trittschutzprofil unten an der Tür'),
    'boden-eben': svg(boden(90) + `${rahmen(40, 72, 80, 18)}${netz(52, 12, 56, 58)}`
        + unterschrift('Boden läuft gerade'), 'Ebene Bodenauflage: der Boden verläuft waagerecht'),
    'boden-uneben': svg('<path d="M4 96h38l30-18h44l40-10" stroke-width="3"/>'
        + `${rahmen(40, 60, 80, 18)}${netz(52, 8, 56, 50)}`
        + unterschrift('Boden steigt an'), 'Unebene oder ansteigende Bodenauflage'),
    'boden-blendrahmen': svg(`${wand(4, 8, 22, 92)}${rahmen(26, 8, 20, 92)}`
        + `${netz(54, 12, 86, 84)}` + pfeil(82, 56, 50, 56)
        + unterschrift('dichtet zum Rahmen ab'), 'Unten sitzt nichts auf: die Abdichtung geht nach hinten zum Blendrahmen'),
    mauerleibung: svg(`${wand(4, 20, 40, 76)}${wand(116, 20, 40, 76)}${rahmen(44, 50, 72, 20)}`
        + '<path d="M44 20v30M116 20v30" stroke-width="4"/>'
        + mass(44, 36, 24, 36) + mass(116, 36, 136, 36)
        + text(5, 12, 'außen', 12) + unterschrift('Wand steht vor dem Rahmen'), 'Mauerleibung: Wandfläche neben dem Blendrahmen'),

    // ---------- Dachfenster: Innenfutter ----------
    innenfutter: dachbild(F_OBEN_GERADE(), F_UNTEN_SENKRECHT(),
        text(112, 30, 'Dach', 12) + unterschrift('Innenfutter zum Raum'), 'Innenfutter am Dachfenster'),
    'innenfutter-gerade': dachbild(F_OBEN_GERADE(false), F_UNTEN_GERADE(),
        text(96, 40, 'gerade', 12) + unterschrift('unten im Dachwinkel'), 'Innenfutter unten gerade weitergeführt'),
    'innenfutter-senkrecht': dachbild(F_OBEN_GERADE(false), F_UNTEN_SENKRECHT(),
        text(94, 52, 'senkrecht', 12) + unterschrift('unten senkrecht abgeknickt'), 'Innenfutter unten senkrecht abgeknickt'),
    'innenfutter-oben-gerade': dachbild(F_OBEN_GERADE(), F_UNTEN_SENKRECHT(false),
        text(20, 88, 'gerade', 12) + unterschrift('oben im Dachwinkel'), 'Innenfutter oben gerade weitergeführt'),
    'innenfutter-waagerecht': dachbild(F_OBEN_WAAGERECHT(), F_UNTEN_SENKRECHT(false),
        text(8, 66, 'waagerecht', 12) + unterschrift('oben waagerecht'), 'Innenfutter oben waagerecht'),
    'innenfutter-montage': dachbild(F_OBEN_GERADE(), F_UNTEN_SENKRECHT(),
        `<path d="M51 62L102 88" stroke="${GELB}" stroke-width="6"/>` + frageZeichen(122, 44)
        + unterschrift('passt der Schutz hinein?'), 'Insektenschutz im Innenfutter montiert'),

    // ---------- Lichtschacht ----------
    auflage: svg(`${wand(6, 4, 148, 16)}${rahmen(16, 26, 128, 70)}${netz(32, 40, 96, 42)}`
        + unterschrift('Auflage ringsum'), 'Auflage der Lichtschachtabdeckung'),
    'auflage-4': svg(`${rahmen(14, 8, 132, 88)}${netz(34, 28, 92, 48)}`
        + '<path d="M22 16h116M22 88h116M22 16v72M138 16v72" stroke-width="3"/>'
        + unterschrift('4 Seiten Auflage'), 'Auflage auf 4 Seiten'),
    'auflage-3': svg(`${wand(6, 4, 148, 16)}`
        + '<path d="M18 20v76h124V20" stroke-width="6"/>'
        + `${netz(34, 32, 92, 50)}`
        + unterschrift('3 Seiten, hinten Hauswand'), 'Auflage auf 3 Seiten, hinten die Hauswand'),
    kellerfenster: svg(`${wand(4, 18, 30, 82)}`
        + '<path d="M34 22h116M34 100h116M150 22v78" stroke-width="3"/>'
        + `${fluegel(34, 34, 30, 36)}`
        + mass(34, 84, 64, 84, 'Überstand')
        + text(80, 56, 'Schacht', 12)
        + unterschrift('ragt in den Schacht'), 'Kellerfenster steht in den Lichtschacht'),
    gitterrost: svg(`${rahmen(14, 16, 132, 74)}`
        + '<path d="M14 34h132M14 52h132M14 70h132M46 16v74M78 16v74M110 16v74" stroke-width="2.6"/>'
        + pfeil(80, 4, 80, 20) + unterschrift('wird begangen'), 'Begehbarer Gitterrost über dem Lichtschacht'),

    // ---------- Bedienarten ----------
    spannrahmen: svg(`${rahmen(20, 6, 120, 90)}${netz(32, 18, 96, 66)}`
        + unterschrift('fest eingesetzt'), 'Spannrahmen, fest eingesetzt'),
    rollo: svg(`${kasten(20, 6, 120, 18)}`
        + '<path d="M28 24v76M132 24v76" stroke-width="5"/>'
        + `${netz(34, 24, 92, 42)}`
        + '<path d="M34 66h92" stroke-width="5"/>'
        + pfeil(80, 92, 80, 70) + unterschrift('rollt auf und ab'), 'Rollo zum Aufrollen'),
    pendel: svg(boden(96) + `${rahmen(48, 8, 64, 88)}${netz(56, 16, 48, 72)}`
        + pfeil(80, 52, 26, 52) + pfeil(80, 52, 134, 52)
        + unterschrift('öffnet in beide Richtungen'), 'Pendelflügel öffnet in beide Richtungen'),
    dreh: svg(boden(96) + `${rahmen(26, 8, 60, 88)}${netz(34, 16, 44, 72)}`
        + '<path d="M86 28q44 12 44 56" stroke-width="1.6" stroke-dasharray="5 4"/>'
        + pfeil(126, 68, 130, 90) + unterschrift('öffnet in eine Richtung'), 'Drehrahmen öffnet in eine Richtung'),
    plissee: svg(`${rahmen(14, 8, 132, 88)}${fluegel(22, 16, 116, 72)}`
        + `<path d="M28 18l9 68 9-68 9 68 9-68 9 68" stroke="${GELB}" stroke-width="2.4"/>`
        + '<path d="M74 16v72" stroke-width="5"/>'
        + pfeil(88, 52, 132, 52) + unterschrift('faltet zur Seite'), 'Plissee zum seitlichen Falten'),
    schiebe: svg('<path d="M6 10h148M6 96h148" stroke-width="3"/>'
        + `${fluegel(14, 16, 68, 74)}${netz(78, 20, 68, 66)}`
        + pfeil(112, 54, 150, 54) + unterschrift('läuft in Schienen'), 'Schiebeanlage'),
    schieberahmen: svg('<path d="M8 96L112 10" stroke-width="3"/>'
        + `<path d="M40 92l58-48 12 14-58 48z" fill="${GELB}" fill-opacity=".16" stroke="${GELB}" stroke-width="2.6"/>`
        + pfeil(82, 74, 112, 48) + unterschrift('schiebt am Dachfenster'), 'Schieberahmen am Dachfenster'),

    // ---------- Öffnungsrichtung ----------
    'richtung-aussen': svg(`${wand(4, 20, 30, 80)}${wand(126, 20, 30, 80)}${rahmen(34, 56, 92, 16)}`
        + netzkante(34, 46, 126, 46) + pfeil(80, 44, 80, 24)
        + seiten(), 'Insektenschutz öffnet nach außen'),
    'richtung-innen': svg(`${wand(4, 20, 30, 80)}${wand(126, 20, 30, 80)}${rahmen(34, 44, 92, 16)}`
        + netzkante(34, 68, 126, 68) + pfeil(80, 70, 80, 94)
        + seiten(), 'Insektenschutz öffnet nach innen'),

    // ---------- Rahmen und Ausführung ----------
    'abschluss-geschlossen': svg(`${gelberRahmen(28, 8, 104, 84)}`
        + boden(100) + unterschrift('Rahmen läuft unten durch'), 'Rahmen unten geschlossen'),
    'abschluss-offen': svg(`<path d="M28 92V8h104v84" fill="${GELB}" fill-opacity=".14" stroke="${GELB}" stroke-width="4"/>`
        + `<path d="M46 20v70M64 20v70M82 20v70M100 20v70M114 20v70M32 26h96M32 44h96M32 62h96M32 80h96" stroke="${GELB}" stroke-width=".8" opacity=".6"/>`
        + boden(100) + unterschrift('unten offen, kein Profil'), 'Rahmen unten offen'),
    einfluegelig: svg(`${gelberRahmen(38, 8, 84, 84)}` + boden(100)
        + unterschrift('ein Flügel'), 'Ein Flügel'),
    zweifluegelig: svg(`${gelberRahmen(14, 8, 64, 84)}${gelberRahmen(82, 8, 64, 84)}` + boden(100)
        + unterschrift('zwei Flügel'), 'Zwei Flügel'),
    'ohne-sprosse': svg(`${gelberRahmen(20, 8, 120, 84)}`
        + unterschrift('durchgehende Fläche'), 'Ohne Querstrebe'),
    'mit-sprosse': svg(`${gelberRahmen(20, 8, 120, 84)}`
        + '<path d="M20 50h120" stroke-width="6"/>'
        + unterschrift('mit Querstrebe'), 'Mit Querstrebe'),
    'ohne-montagerahmen': svg(`${wand(4, 20, 26, 80)}${wand(130, 20, 26, 80)}${rahmen(30, 48, 100, 22)}`
        + netzkante(30, 38, 130, 38) + seiten()
        + text(44, 114, 'direkt montiert', 11), 'Ohne Montagerahmen: direkt am Blendrahmen'),
    'mit-montagerahmen': svg(`${wand(4, 20, 26, 80)}${wand(130, 20, 26, 80)}${rahmen(30, 52, 100, 22)}`
        + '<path d="M30 34h100v14H30z" fill="currentColor" fill-opacity=".45" stroke-width="2.2"/>'
        + netzkante(30, 26, 130, 26) + seiten()
        + text(44, 114, 'Rahmen dazwischen', 11), 'Mit Montagerahmen als Zwischenstück'),
    tuerschliesser: svg(`${rahmen(34, 6, 76, 90)}${netz(44, 16, 56, 70)}`
        + '<path d="M110 22h32v12h-32z" fill="currentColor" fill-opacity=".45" stroke-width="2.2"/>'
        + '<path d="M126 34v12" stroke-width="2.6"/>' + pfeil(126, 52, 112, 60, 2)
        + boden(100) + unterschrift('zieht die Tür zu'), 'Türschließer zieht die Tür zu'),

    // ---------- Einbauweisen ----------
    einbauweise: svg(`${wand(4, 30, 18, 52)}${rahmen(22, 54, 22, 16)}${netzkante(22, 44, 44, 44)}`
        + `${wand(58, 30, 12, 52)}${wand(94, 30, 12, 52)}${rahmen(70, 54, 24, 16)}${netzkante(72, 58, 92, 58)}`
        + `${wand(118, 30, 8, 52)}${wand(152, 30, 4, 52)}${rahmen(126, 60, 26, 16)}${netzkante(126, 40, 152, 40)}`
        + text(20, 98, 'auf', 11) + text(70, 98, 'im', 11) + text(110, 98, 'Leibung', 12), 'Einbauweisen: auf dem Blendrahmen, im Blendrahmen, in der Mauerleibung'),
    amb: svg(`${wand(4, 20, 34, 80)}${wand(122, 20, 34, 80)}${rahmen(38, 54, 84, 22)}`
        + netzkante(30, 40, 130, 40)
        + text(40, 114, 'liegt auf dem Rahmen', 11) + seiten(), 'Auf den Blendrahmen gesetzt'),
    lmb: svg(`${wand(4, 20, 34, 80)}${wand(122, 20, 34, 80)}${rahmen(38, 54, 22, 22)}${rahmen(100, 54, 22, 22)}`
        + netzkante(60, 60, 100, 60)
        + text(40, 114, 'sitzt im Rahmen drin', 11) + seiten(), 'In den Blendrahmen eingesetzt'),
    lmm: svg(`${wand(4, 20, 34, 80)}${wand(122, 20, 34, 80)}${rahmen(38, 62, 84, 22)}`
        + netzkante(38, 32, 122, 32)
        + text(44, 114, 'sitzt in der Wand', 11) + seiten(), 'In die Mauerleibung gesetzt'),

    // ---------- Maßklassen: derselbe Spalt in drei Breiten ----------
    // Die Maßfragen haben alle dieselbe Staffelung (wenig – mittel – viel), deshalb dieselben drei Bilder.
    'spalt-eng': svg(`${rahmen(10, 22, 52, 62)}${fluegel(74, 22, 76, 62)}`
        + mass(62, 52, 74, 52) + unterschrift('kleiner Abstand'), 'sehr schmaler Spalt'),
    'spalt-mittel': svg(`${rahmen(10, 22, 52, 62)}${fluegel(92, 22, 58, 62)}`
        + mass(62, 52, 92, 52) + unterschrift('mittlerer Abstand'), 'mittlerer Spalt'),
    'spalt-weit': svg(`${rahmen(10, 22, 52, 62)}${fluegel(116, 22, 34, 62)}`
        + mass(62, 52, 116, 52) + unterschrift('großer Abstand'), 'weiter Spalt'),

    // ---------- Maße ----------
    'mass-seitlich': svg('<path d="M24 18v78" stroke-width="8"/>'
        + `${rahmen(32, 18, 40, 78)}${fluegel(72, 18, 68, 78)}`
        + mass(34, 64, 70, 64) + text(6, 12, 'Schiene', 11) + text(86, 12, 'Flügel', 12)
        + unterschrift('freie Auflage seitlich'), 'Freie Auflagefläche seitlich am Blendrahmen'),
    'mass-fuehrung': svg('<path d="M26 18v78" stroke-width="8"/>'
        + `${rahmen(54, 18, 36, 78)}${fluegel(90, 18, 52, 78)}`
        + mass(32, 60, 52, 60) + text(6, 12, 'Schiene', 11) + text(96, 12, 'Flügel', 12)
        + unterschrift('Abstand Schiene – Rahmen'), 'Abstand der Führungsschiene zum Blendrahmen'),
    'mass-oben': svg(kasten(14, 6, 90, 18)
        + `${rahmen(14, 26, 132, 26)}${fluegel(30, 52, 100, 44)}`
        + mass(88, 28, 88, 50) + text(108, 18, 'Kasten', 12)
        + unterschrift('freie Fläche oben'), 'Freie Blendrahmenfläche oben über dem Flügel'),
    'mass-tiefe': svg(`${rahmen(14, 68, 132, 24)}`
        + '<path d="M10 26h140" stroke-width="7" stroke-dasharray="9 4"/>'
        + mass(80, 32, 80, 66, 'Tiefe') + text(6, 18, 'Rollladen', 12)
        + unterschrift('Platz davor'), 'Platz vor dem Blendrahmen bis zum Rollladen'),
};

globalThis.H2Skizzen = H2Skizzen;
})();
