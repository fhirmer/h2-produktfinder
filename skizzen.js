// Skizzen für Fragen und Antworten: einfache Strichzeichnungen, einfarbig über currentColor (Dunkelmodus).
// Schnitte: oben = außen. Blendrahmen dunkel gefüllt, Flügel hell, Insektenschutz gestrichelt.
(function () {
'use strict';

const svg = (inhalt, titel) => `<svg viewBox="0 0 120 90" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${titel}">${inhalt}</svg>`;
const rahmen = (x, y, b, h) => `<rect x="${x}" y="${y}" width="${b}" height="${h}" fill="currentColor" fill-opacity=".35"/>`;
const fluegel = (x, y, b, h) => `<rect x="${x}" y="${y}" width="${b}" height="${h}" fill="currentColor" fill-opacity=".08"/>`;
const netz = (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke-dasharray="4 4"/>`;
const pfeil = (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}"/><path d="M${x2} ${y2}l${x1 < x2 ? -6 : x1 > x2 ? 6 : -4} ${y1 < y2 ? -6 : y1 > y2 ? 6 : -4}"/>`;
const mass = (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke-width="1.5"/><circle cx="${x1}" cy="${y1}" r="2" fill="currentColor"/><circle cx="${x2}" cy="${y2}" r="2" fill="currentColor"/>`;
const text = (x, y, t, groesse = 10) => `<text x="${x}" y="${y}" font-size="${groesse}" fill="currentColor" stroke="none" font-family="Arial,sans-serif">${t}</text>`;
const wand = (x, y, b, h) => `<rect x="${x}" y="${y}" width="${b}" height="${h}" fill="currentColor" fill-opacity=".15" stroke-dasharray="2 3"/>`;

const H2Skizzen = {
    fenster: svg('<rect x="22" y="10" width="76" height="70" rx="2"/><path d="M60 10v70M22 45h76"/>', 'Fenster'),
    tuer: svg('<rect x="36" y="6" width="48" height="80" rx="2"/><path d="M74 46h4"/><path d="M20 86h80"/>', 'Tür'),
    lichtschacht: svg(`${wand(10, 8, 100, 14)}<rect x="18" y="26" width="84" height="54" rx="2"/><path d="M18 40h84M18 54h84M18 68h84M34 26v54M50 26v54M66 26v54M82 26v54" stroke-width="1.5"/>`, 'Lichtschacht'),
    dachfenster: svg('<path d="M6 70L78 12L114 40"/><path d="M40 43l30-24 14 18-30 24z" fill="currentColor" fill-opacity=".1"/><path d="M47 49l30-24" stroke-width="1.5"/>', 'Dachfenster'),
    stulp: svg('<rect x="14" y="10" width="92" height="70"/><rect x="18" y="14" width="41" height="62" fill="currentColor" fill-opacity=".08"/><rect x="61" y="14" width="41" height="62" fill="currentColor" fill-opacity=".08"/><path d="M60 14v62" stroke-width="4"/>' + text(44, 88, 'kein Pfosten', 9), 'Stulp: zwei Flügel ohne Mittelpfosten'),
    schiebetuer: svg('<rect x="10" y="8" width="100" height="74"/><rect x="14" y="12" width="50" height="66" fill="currentColor" fill-opacity=".08"/><rect x="56" y="16" width="50" height="62" fill="currentColor" fill-opacity=".15"/>' + pfeil(40, 45, 20, 45), 'Schiebetür'),

    fluegellage: svg(`${rahmen(6, 44, 24, 24)}${fluegel(30, 44, 20, 24)}<path d="M2 44h52" stroke-dasharray="3 4" stroke-width="1.2"/>${rahmen(66, 44, 24, 24)}${fluegel(90, 30, 24, 24)}<path d="M62 44h56" stroke-dasharray="3 4" stroke-width="1.2"/>` + text(8, 84, 'bündig', 10) + text(72, 84, 'versetzt', 10) + text(2, 20, 'außen', 9), 'Flügellage im Schnitt: bündig und versetzt'),
    buendig: svg(`${rahmen(14, 36, 44, 34)}${fluegel(58, 36, 48, 34)}<path d="M6 36h108" stroke-dasharray="3 4" stroke-width="1.2"/>` + text(8, 26, 'außen', 10), 'bündig: Flügel und Rahmen in einer Ebene'),
    versetzt: svg(`${rahmen(14, 44, 44, 32)}${fluegel(58, 20, 48, 32)}<path d="M6 44h108" stroke-dasharray="3 4" stroke-width="1.2"/>${mass(110, 20, 110, 44)}` + text(8, 14, 'außen', 10), 'flächenversetzt: Flügel steht vor'),
    halbversetzt: svg(`${rahmen(14, 40, 44, 32)}${fluegel(58, 28, 48, 32)}<path d="M6 40h108" stroke-dasharray="3 4" stroke-width="1.2"/>${mass(110, 28, 110, 40)}` + text(8, 18, 'außen', 10), 'halbflächenversetzt'),

    ueberschlag: svg('<path d="M8 70V30h26v40"/><path d="M46 70V30h14l12 12v28"/><path d="M84 70V30h8q20 0 20 22v18"/>' + text(10, 84, 'gerade', 8) + text(46, 84, 'schräg', 8) + text(82, 84, 'sehr schräg', 8), 'Überschlag: gerade, schräg, sehr schräg'),
    'ueberschlag-gerade': svg('<path d="M30 78V22h56v56" fill="currentColor" fill-opacity=".35"/>', 'gerader Überschlag'),
    'ueberschlag-schraeg': svg('<path d="M30 78V22h34l22 22v34" fill="currentColor" fill-opacity=".35"/>', 'schräger Überschlag'),
    'ueberschlag-sehrschraeg': svg('<path d="M30 78V22h10q46 0 46 44v12" fill="currentColor" fill-opacity=".35"/>', 'sehr schräger oder abgerundeter Überschlag'),

    rollladen: svg('<rect x="16" y="6" width="88" height="16" rx="2" fill="currentColor" fill-opacity=".2"/><path d="M22 22v60M98 22v60" stroke-width="4"/><path d="M26 30h68M26 38h68M26 46h68M26 54h68M26 62h68" stroke-width="1.5"/>', 'Rollladen mit Kasten und Führungsschienen'),
    panzer: svg(`${rahmen(20, 50, 30, 30)}${fluegel(50, 44, 50, 30)}<path d="M50 34h52" stroke-width="5" stroke-dasharray="6 2"/>${mass(106, 36, 106, 44)}` + text(8, 20, 'Rollladenpanzer', 10), 'Rollladenpanzer eng am Flügel'),
    fuehrung: svg('<rect x="24" y="10" width="72" height="72"/><rect x="30" y="16" width="60" height="60" fill="currentColor" fill-opacity=".08"/><path d="M16 10v72M104 10v72" stroke-width="6"/>' + pfeil(8, 50, 16, 50) + pfeil(112, 50, 104, 50), 'Führungsschienen eng am Rahmen'),
    haengend: svg('<rect x="16" y="6" width="88" height="14" rx="2" fill="currentColor" fill-opacity=".2"/><path d="M22 20v64M98 20v64" stroke-width="4"/><path d="M26 26h68M26 32h68" stroke-width="2"/><rect x="26" y="40" width="68" height="44" stroke-dasharray="4 4"/>' + pfeil(60, 34, 60, 46), 'Rollladen hängt in die Öffnung'),

    regenschiene: svg(`${fluegel(46, 10, 30, 44)}${rahmen(14, 54, 90, 16)}<path d="M40 56h40v8h8" stroke-width="3.5"/>` + text(8, 86, 'Regenschiene am Blendrahmen', 9), 'Regenschiene unten am Blendrahmen'),
    wetterschenkel: svg(`${fluegel(46, 10, 30, 48)}${rahmen(14, 60, 90, 14)}<path d="M76 40h16l-4 12H76z" fill="currentColor" fill-opacity=".35"/>` + text(8, 86, 'Wetterschenkel am Flügel', 9), 'Wetterschenkel unten am Flügel'),
    schwelle: svg('<path d="M4 70h40M76 70h40"/><rect x="44" y="60" width="32" height="10" fill="currentColor" fill-opacity=".35"/><rect x="50" y="10" width="20" height="50" fill="currentColor" fill-opacity=".08"/>' + text(30, 86, 'Schwelle', 10), 'Türschwelle'),
    trittschutz: svg('<path d="M4 76h112"/><rect x="36" y="62" width="48" height="14" fill="currentColor" fill-opacity=".35"/><path d="M40 62h40v-6H40z" fill="currentColor" fill-opacity=".6"/><rect x="50" y="8" width="20" height="48" fill="currentColor" fill-opacity=".08"/>' + text(28, 90, 'Trittschutz', 10), 'Trittschutzprofil unten an der Tür'),
    mauerleibung: svg(`${wand(4, 20, 30, 60)}${wand(86, 20, 30, 60)}${rahmen(34, 44, 52, 12)}<path d="M34 20v24M86 20v24" stroke-width="4"/>` + text(8, 14, 'außen', 10), 'Mauerleibung: Wandfläche neben dem Rahmen'),

    innenfutter: svg('<path d="M10 20L100 20" stroke-width="1.5"/><path d="M30 40l40 20" stroke-width="6"/><path d="M30 40v44M70 60l40 0" /><path d="M30 40L14 30" stroke-dasharray="4 4"/>' + text(60, 84, 'Innenfutter', 10), 'Innenfutter am Dachfenster'),

    auflage: svg(`${wand(8, 6, 104, 14)}<rect x="16" y="26" width="88" height="56" stroke-width="4"/><path d="M28 38h64v32H28z" stroke-dasharray="4 4"/>`, 'Auflage der Lichtschachtabdeckung'),
    'auflage-4': svg('<rect x="14" y="14" width="92" height="66" stroke-width="5"/><path d="M26 26h68v42H26z" stroke-dasharray="4 4"/>' + text(46, 50, '4 Seiten', 10), 'Auflage auf 4 Seiten'),
    'auflage-3': svg(`${wand(8, 4, 104, 16)}<path d="M14 20v60h92V20" stroke-width="5"/><path d="M26 22h68v46H26z" stroke-dasharray="4 4"/>` + text(40, 50, '3 Seiten', 10), 'Auflage auf 3 Seiten, hinten Hauswand'),
    kellerfenster: svg(`${wand(4, 4, 22, 82)}<rect x="26" y="30" width="22" height="30" fill="currentColor" fill-opacity=".2"/><path d="M26 22h90" stroke-width="4"/>${mass(26, 70, 48, 70)}` + text(56, 72, 'Überstand', 10), 'Kellerfenster steht in den Schacht'),

    spannrahmen: svg('<rect x="20" y="8" width="80" height="74" rx="2" stroke-width="5"/><path d="M28 16h64v58H28z" stroke-dasharray="3 3" stroke-width="1.5"/><path d="M36 16v58M48 16v58M60 16v58M72 16v58M84 16v58" stroke-width=".8"/>', 'Spannrahmen, fest eingesetzt'),
    rollo: svg('<rect x="18" y="6" width="84" height="14" rx="3" fill="currentColor" fill-opacity=".2"/><path d="M24 20v66M96 20v66" stroke-width="4"/><path d="M28 20h64v44H28z" stroke-dasharray="3 3" stroke-width="1.5"/><path d="M28 64h64" stroke-width="4"/>' + pfeil(60, 76, 60, 60), 'Rollo zum Aufrollen'),
    pendel: svg('<path d="M10 84h100"/><rect x="40" y="10" width="40" height="74"/>' + pfeil(60, 48, 24, 48) + pfeil(60, 48, 96, 48), 'Pendelflügel öffnet in beide Richtungen'),
    dreh: svg('<path d="M10 84h100"/><rect x="30" y="10" width="40" height="74"/><path d="M70 30q30 10 30 44" stroke-dasharray="4 4"/>' + pfeil(96, 60, 100, 74), 'Drehrahmen öffnet in eine Richtung'),
    plissee: svg('<rect x="10" y="8" width="100" height="74"/><path d="M16 12l6 70 6-70 6 70 6-70 6 70" stroke-width="1.5"/><path d="M52 12v70" stroke-width="4"/>' + pfeil(64, 46, 96, 46), 'Plissee zum seitlichen Falten'),
    schiebe: svg('<path d="M6 82h108M6 8h108"/><rect x="12" y="12" width="52" height="66" fill="currentColor" fill-opacity=".08"/><rect x="56" y="16" width="52" height="62" stroke-dasharray="4 3"/>' + pfeil(88, 46, 108, 46), 'Schiebeanlage'),
    schieberahmen: svg('<path d="M6 76L86 14"/><path d="M34 70l52-40 8 10-52 40z" stroke-dasharray="4 3"/>' + pfeil(64, 62, 84, 46), 'Schieberahmen am Dachfenster'),

    einbauweise: svg(`${wand(2, 30, 18, 40)}${rahmen(20, 50, 18, 10)}<path d="M20 44h18" stroke-dasharray="3 3"/>${wand(42, 30, 12, 40)}${wand(70, 30, 12, 40)}${rahmen(54, 50, 16, 10)}<path d="M56 50h12" stroke-dasharray="3 3" stroke-width="3"/>${wand(86, 30, 6, 40)}${wand(114, 30, 6, 40)}${rahmen(92, 56, 22, 10)}<path d="M92 40h22" stroke-dasharray="3 3" stroke-width="3"/>` + text(8, 84, 'AMB', 9) + text(50, 84, 'LMB', 9) + text(92, 84, 'LMM', 9), 'Einbauweisen AMB, LMB, LMM'),
    amb: svg(`${wand(4, 20, 26, 60)}${wand(90, 20, 26, 60)}${rahmen(30, 50, 60, 14)}<path d="M24 40h72" stroke-dasharray="5 4" stroke-width="3.5"/>` + text(8, 14, 'außen', 10), 'AMB: auf dem Blendrahmen'),
    lmb: svg(`${wand(4, 20, 26, 60)}${wand(90, 20, 26, 60)}${rahmen(30, 50, 14, 14)}${rahmen(76, 50, 14, 14)}<path d="M44 52h32" stroke-dasharray="5 4" stroke-width="3.5"/>` + text(8, 14, 'außen', 10), 'LMB: in der Öffnung des Blendrahmens'),
    lmm: svg(`${wand(4, 20, 26, 60)}${wand(90, 20, 26, 60)}${rahmen(30, 58, 60, 14)}<path d="M30 32h60" stroke-dasharray="5 4" stroke-width="3.5"/>` + text(8, 14, 'außen', 10), 'LMM: in der Mauerleibung'),

    'mass-seitlich': svg(`<path d="M20 20v60" stroke-width="7"/>${rahmen(24, 20, 28, 60)}${fluegel(52, 20, 50, 60)}${mass(26, 50, 50, 50)}` + text(28, 14, 'Auflage', 10), 'freie Auflagefläche seitlich'),
    'mass-fuehrung': svg(`<path d="M22 14v66" stroke-width="7"/>${rahmen(40, 14, 26, 66)}${fluegel(66, 14, 44, 66)}${mass(26, 48, 40, 48)}` + text(8, 90, 'Führung ↔ Rahmen', 9), 'Abstand Führungsschiene zum Blendrahmen'),
    'mass-oben': svg(`<rect x="10" y="6" width="100" height="14" fill="currentColor" fill-opacity=".2"/>${rahmen(10, 20, 100, 22)}${fluegel(22, 42, 76, 42)}${mass(60, 22, 60, 42)}` + text(66, 36, 'oben frei', 9), 'freie Blendrahmenfläche oben'),
    'mass-tiefe': svg(`${rahmen(10, 58, 100, 16)}<path d="M8 20h104" stroke-width="5" stroke-dasharray="7 2"/>${mass(60, 24, 60, 56)}` + text(66, 44, 'Einbautiefe', 9), 'Platz vor dem Blendrahmen'),
};

globalThis.H2Skizzen = H2Skizzen;
})();
