// Fragenkatalog des Produktfinders (Phase 2). Beschreibung: Katalog/FRAGENKATALOG.md
//
// Jede Frage beschreibt eine Eigenschaft der Einbausituation. Eine Antwort setzt Labels der
// Wissensbasis auf wahr oder falsch. Daraus folgt nur Sortierung – außer die Antwort trägt eine
// Ausschlussregel (A2–A5) mit Beleg. „Weiß ich nicht“ setzt nichts und schließt nie aus.
//
// modus 'eins': Die Labels einer Variante sind Alternativen („flächenbündig und flächenversetzt“).
// modus 'alle': Die Labels einer Variante gelten zusammen („links und rechts eng“); exakt: diese Labels müssen genau übereinstimmen.
// spezifisch: Eine Ja-Antwort sortiert Varianten nach hinten, die für diese Besonderheit nicht ausgelegt sind.
(function () {
'use strict';

const alsFenster = (a) => a.element === 'fenster' && a.fenstertyp !== 'dach';
const alsTuer = (a) => a.element === 'tuer';
const fensterOderTuer = (a) => a.element === 'fenster' || a.element === 'tuer';
const fassade = (a) => a.element === 'tuer' || alsFenster(a);
const mitRollladen = (a) => fassade(a) && a.rollladen === 'ja';
const system = (a, ...s) => !a.system || a.system === 'egal' || a.system === 'unbekannt' || s.includes(a.system);

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
        id: 'element', block: 'A', pflicht: true, weissNicht: false,
        frage: 'Was bekommt Insektenschutz?',
        antworten: [
            {id: 'fenster', text: 'Fenster', hinweis: 'in der Fassade oder im Dach', skizze: 'fenster'},
            {id: 'tuer', text: 'Tür', hinweis: 'Balkon, Terrasse, Hauseingang', skizze: 'tuer'},
            {id: 'lichtschacht', text: 'Lichtschacht', hinweis: 'Kellerfenster, Gitterrost', skizze: 'lichtschacht'},
        ],
    },
    {
        id: 'fenstertyp', block: 'A', pflicht: true, weissNicht: false,
        zeigen: (a) => a.element === 'fenster',
        frage: 'Welches Fenster?',
        antworten: [
            {id: 'fassade', text: 'Fenster in der Wand', hinweis: 'senkrecht in der Fassade', skizze: 'fenster'},
            {id: 'dach', text: 'Dachfenster', hinweis: 'schräg im Dach', skizze: 'dachfenster'},
        ],
    },
    {
        id: 'tuerart', block: 'A',
        zeigen: alsTuer,
        frage: 'Wie ist die Tür aufgebaut?',
        hilfe: 'Stulptür: zwei Flügel, und beim Öffnen bleibt kein fester Mittelpfosten stehen.',
        labels: ['geometry.stulp_without_fixed_mullion', 'element.sliding_window_or_door'],
        antworten: [
            {id: 'einfluegel', text: 'Ein Flügel', skizze: 'tuer', setzt: {'geometry.stulp_without_fixed_mullion': false, 'element.sliding_window_or_door': false}},
            {id: 'stulp', text: 'Zwei Flügel ohne Mittelpfosten', hinweis: 'Stulptür', skizze: 'stulp', setzt: {'geometry.stulp_without_fixed_mullion': true, 'element.sliding_window_or_door': false}},
            {id: 'schiebe', text: 'Schiebetür', hinweis: 'auch Hebe-Schiebe-Tür', skizze: 'schiebetuer', setzt: {'element.sliding_window_or_door': true}},
        ],
    },

    // B – Rahmen
    {
        id: 'material', block: 'B',
        zeigen: fensterOderTuer,
        frage: 'Aus welchem Material ist der Rahmen?',
        hilfe: 'Das Material sortiert nur. Holz-Alu und Kunststoff-Alu behandelt der Katalog wie Kunststoff.',
        labels: ['material.wood_suitable', 'material.plastic_suitable', 'material.aluminium_suitable'],
        antworten: [
            {id: 'kunststoff', text: 'Kunststoff', setzt: {'material.plastic_suitable': true, 'material.wood_suitable': false}},
            {id: 'holz', text: 'Holz', setzt: {'material.wood_suitable': true, 'material.plastic_suitable': false}},
            {id: 'alu', text: 'Aluminium', setzt: {'material.aluminium_suitable': true, 'material.wood_suitable': false}},
            {id: 'holzalu', text: 'Holz-Alu', hinweis: 'wie Kunststoff', setzt: {'material.plastic_suitable': true, 'material.wood_suitable': false}},
            {id: 'kunststoffalu', text: 'Kunststoff-Alu', hinweis: 'wie Kunststoff', setzt: {'material.plastic_suitable': true, 'material.wood_suitable': false}},
        ],
    },
    {
        id: 'stulpfenster', block: 'B',
        zeigen: alsFenster,
        frage: 'Hat das Fenster zwei Flügel ohne festen Mittelpfosten?',
        hilfe: 'Stulpfenster: Öffnet man beide Flügel, bleibt in der Mitte kein Pfosten stehen.',
        skizze: 'stulp',
        labels: ['geometry.stulp_without_fixed_mullion'],
        antworten: [
            {id: 'ja', text: 'Ja, Stulpfenster', setzt: {'geometry.stulp_without_fixed_mullion': true}},
            {id: 'nein', text: 'Nein', setzt: {'geometry.stulp_without_fixed_mullion': false}},
        ],
    },
    {
        id: 'fluegellage', block: 'B',
        zeigen: (a) => fassade(a) && a.tuerart !== 'schiebe',
        frage: 'Wie liegt der Flügel zum Rahmen?',
        hilfe: 'Von außen seitlich auf das geschlossene Fenster bzw. die Tür schauen.',
        skizze: 'fluegellage',
        labels: ['geometry.sash_flush_with_frame', 'geometry.sash_offset_from_frame', 'geometry.sash_half_offset_from_frame'],
        antworten: [
            {id: 'buendig', text: 'Bündig', hinweis: 'Flügel und Rahmen in einer Ebene', skizze: 'buendig',
                setzt: {'geometry.sash_flush_with_frame': true, 'geometry.sash_offset_from_frame': false, 'geometry.sash_half_offset_from_frame': false},
                schliesstAus: [{art: 'A2', label: 'excluded.when_sash_flush_with_frame', grund: 'nicht für flächenbündige Flügel'}]},
            {id: 'versetzt', text: 'Flügel steht vor', hinweis: 'flächenversetzt', skizze: 'versetzt',
                setzt: {'geometry.sash_offset_from_frame': true, 'geometry.sash_flush_with_frame': false, 'geometry.sash_half_offset_from_frame': false}},
            {id: 'halb', text: 'Flügel steht halb vor', hinweis: 'halbflächenversetzt', skizze: 'halbversetzt',
                setzt: {'geometry.sash_half_offset_from_frame': true, 'geometry.sash_flush_with_frame': false, 'geometry.sash_offset_from_frame': false}},
        ],
    },
    {
        id: 'ueberschlag', block: 'B',
        zeigen: (a) => fassade(a) && a.tuerart !== 'schiebe',
        frage: 'Wie sieht die Außenkante des Blendrahmens aus?',
        hilfe: 'Gemeint ist der Überschlag: die äußere Kante des festen Rahmens, auf der der Insektenschutz aufliegt.',
        skizze: 'ueberschlag',
        labels: ['geometry.frame_overlap_straight', 'geometry.frame_overlap_sloped', 'geometry.frame_overlap_extremely_sloped'],
        antworten: [
            {id: 'gerade', text: 'Gerade', skizze: 'ueberschlag-gerade',
                setzt: {'geometry.frame_overlap_straight': true, 'geometry.frame_overlap_sloped': false, 'geometry.frame_overlap_extremely_sloped': false},
                schliesstAus: [{art: 'A2', label: 'excluded.when_frame_overlap_straight', grund: 'nicht bei geradem Blendrahmenüberschlag'}]},
            {id: 'schraeg', text: 'Schräg', skizze: 'ueberschlag-schraeg',
                setzt: {'geometry.frame_overlap_sloped': true, 'geometry.frame_overlap_straight': false, 'geometry.frame_overlap_extremely_sloped': false}},
            {id: 'sehrschraeg', text: 'Sehr schräg oder stark abgerundet', skizze: 'ueberschlag-sehrschraeg',
                setzt: {'geometry.frame_overlap_extremely_sloped': true, 'geometry.frame_overlap_straight': false},
                schliesstAus: [{art: 'A2', label: 'excluded.when_frame_overlap_extremely_sloped', grund: 'nicht bei extrem schrägem Blendrahmenüberschlag'}]},
        ],
    },
    {
        id: 'sonderform', block: 'B',
        zeigen: alsFenster,
        frage: 'Ist das Fenster rechteckig?',
        labels: ['geometry.special_form_curved_supported', 'geometry.special_form_out_of_square_supported'],
        antworten: [
            {id: 'rechteckig', text: 'Ja, rechteckig'},
            {id: 'sonderform', text: 'Nein: Bogen oder schiefwinklig', setzt: {'geometry.special_form_curved_supported': true, 'geometry.special_form_out_of_square_supported': true}},
        ],
    },

    // C – Rollladen und Platz
    {
        id: 'rollladen', block: 'C',
        zeigen: fassade,
        frage: 'Ist ein Rollladen vorhanden?',
        skizze: 'rollladen',
        labels: ['shutter.present', 'shutter.armour_close_to_sash', 'shutter.guide_close_left', 'shutter.guide_close_right', 'shutter.guide_close_hinge_side', 'shutter.armour_hanging_down'],
        antworten: [
            {id: 'ja', text: 'Ja', setzt: {'shutter.present': true}},
            {id: 'nein', text: 'Nein', setzt: {'shutter.present': false, 'shutter.armour_close_to_sash': false, 'shutter.guide_close_left': false, 'shutter.guide_close_right': false, 'shutter.guide_close_hinge_side': false, 'shutter.armour_hanging_down': false}},
        ],
    },
    {
        id: 'panzer', block: 'C',
        zeigen: mitRollladen,
        frage: 'Liegt der heruntergelassene Rollladen eng am Flügel?',
        hilfe: 'Rollladen ganz herunterlassen und schauen, wie viel Platz zwischen Panzer und Flügel bleibt.',
        skizze: 'panzer',
        labels: ['shutter.armour_close_to_sash'],
        antworten: [
            {id: 'eng', text: 'Eng, kaum Platz', setzt: {'shutter.armour_close_to_sash': true}},
            {id: 'abstand', text: 'Genug Abstand', setzt: {'shutter.armour_close_to_sash': false}},
        ],
    },
    {
        id: 'fuehrung', block: 'C',
        zeigen: mitRollladen,
        modus: 'alle',
        exakt: ['shutter.guide_close_left', 'shutter.guide_close_right'],
        frage: 'Sitzen die Führungsschienen eng am Blendrahmen?',
        hilfe: 'Seitlich schauen: Bleibt zwischen Führungsschiene und Flügel nur wenig Rahmenfläche frei?',
        skizze: 'fuehrung',
        labels: ['shutter.guide_close_left', 'shutter.guide_close_right', 'shutter.guide_close_hinge_side'],
        antworten: [
            {id: 'beide', text: 'Ja, auf beiden Seiten', setzt: {'shutter.guide_close_left': true, 'shutter.guide_close_right': true, 'shutter.guide_close_hinge_side': true}},
            {id: 'links', text: 'Nur links eng', hinweis: 'von außen gesehen', setzt: {'shutter.guide_close_left': true, 'shutter.guide_close_right': false}},
            {id: 'rechts', text: 'Nur rechts eng', hinweis: 'von außen gesehen', setzt: {'shutter.guide_close_right': true, 'shutter.guide_close_left': false}},
            {id: 'nein', text: 'Nein, genug Platz', setzt: {'shutter.guide_close_left': false, 'shutter.guide_close_right': false, 'shutter.guide_close_hinge_side': false}},
        ],
    },
    {
        id: 'haengend', spezifisch: true, block: 'C',
        zeigen: mitRollladen,
        frage: 'Hängt der Rollladen in die Öffnung, auch wenn er ganz hochgezogen ist?',
        skizze: 'haengend',
        labels: ['shutter.armour_hanging_down'],
        antworten: [
            {id: 'ja', text: 'Ja, er hängt herunter', setzt: {'shutter.armour_hanging_down': true}},
            {id: 'nein', text: 'Nein', setzt: {'shutter.armour_hanging_down': false}},
        ],
    },
    {
        id: 'geteilt', spezifisch: true, block: 'C',
        zeigen: (a) => mitRollladen(a) && a.element === 'tuer',
        frage: 'Ist der Rollladen geteilt (zwei Rollläden nebeneinander)?',
        labels: ['shutter.split_roller_shutter'],
        antworten: [
            {id: 'ja', text: 'Ja, geteilt', setzt: {'shutter.split_roller_shutter': true}},
            {id: 'nein', text: 'Nein', setzt: {'shutter.split_roller_shutter': false}},
        ],
    },

    // D – Unten und Anschluss
    {
        id: 'regenschiene', block: 'D',
        zeigen: alsFenster,
        frage: 'Ist unten am Blendrahmen eine Regenschiene?',
        hilfe: 'Regenschiene: Alu-Profil unten am festen Rahmen, meist bei Holzfenstern. Die Fensterbank ist keine Regenschiene.',
        skizze: 'regenschiene',
        labels: ['component.rain_rail_present'],
        antworten: [
            {id: 'ja', text: 'Ja', setzt: {'component.rain_rail_present': true}},
            {id: 'nein', text: 'Nein', setzt: {'component.rain_rail_present': false},
                schliesstAus: [{art: 'A4', label: 'component.rain_rail_contact_required', grund: 'dichtet an der Regenschiene ab, es gibt aber keine'}]},
        ],
    },
    {
        id: 'regenschiene_lage', block: 'D',
        zeigen: (a) => alsFenster(a) && a.regenschiene === 'ja',
        frage: 'Liegt die Regenschiene am Blendrahmen an oder steht sie über?',
        skizze: 'regenschiene',
        labels: ['component.rain_rail_contact_required', 'component.rain_rail_may_project'],
        antworten: [
            {id: 'anliegend', text: 'Liegt am Blendrahmen an', setzt: {'component.rain_rail_contact_required': true, 'component.rain_rail_may_project': false}},
            {id: 'ueberstehend', text: 'Steht über den Blendrahmen vor', setzt: {'component.rain_rail_may_project': true, 'component.rain_rail_contact_required': false}},
        ],
    },
    {
        id: 'wetterschenkel', block: 'D',
        zeigen: alsFenster,
        frage: 'Ist unten am Flügel ein Wetterschenkel?',
        hilfe: 'Wetterschenkel: Leiste unten am beweglichen Flügel, die Wasser ableitet. Nicht mit der Regenschiene verwechseln.',
        skizze: 'wetterschenkel',
        labels: ['component.weather_bar_present', 'component.weather_bar_suitable'],
        antworten: [
            {id: 'ja', text: 'Ja', setzt: {'component.weather_bar_present': true, 'component.weather_bar_suitable': true}},
            {id: 'nein', text: 'Nein', setzt: {'component.weather_bar_present': false}},
        ],
    },
    {
        id: 'schwelle', spezifisch: true, block: 'D',
        zeigen: alsTuer,
        frage: 'Ist die Tür unten schwellenfrei?',
        hilfe: 'Schwellenfrei bzw. barrierefrei: Der Boden geht ohne Stufe oder Kante durch die Tür.',
        skizze: 'schwelle',
        labels: ['geometry.threshold_free_door', 'geometry.barrier_free_door', 'geometry.threshold_present', 'geometry.surrounding_door_frame_present'],
        antworten: [
            {id: 'ja', text: 'Ja, schwellenfrei', setzt: {'geometry.threshold_free_door': true, 'geometry.barrier_free_door': true, 'geometry.threshold_present': false, 'geometry.surrounding_door_frame_present': false}},
            {id: 'nein', text: 'Nein, mit Schwelle', hinweis: 'Blendrahmen läuft auch unten durch', setzt: {'geometry.threshold_present': true, 'geometry.surrounding_door_frame_present': true, 'geometry.threshold_free_door': false, 'geometry.barrier_free_door': false}},
        ],
    },
    {
        id: 'trittschutz', block: 'D',
        zeigen: (a) => alsTuer(a) && a.tuerart !== 'schiebe',
        frage: 'Hat die Tür unten ein Trittschutzprofil?',
        hilfe: 'Trittschutz: Profil unten auf dem Rahmen, typisch bei Kunststofftüren.',
        skizze: 'trittschutz',
        labels: ['geometry.kick_plate_present'],
        antworten: [
            {id: 'ja', text: 'Ja', setzt: {'geometry.kick_plate_present': true}},
            {id: 'nein', text: 'Nein', setzt: {'geometry.kick_plate_present': false}},
        ],
    },
    {
        id: 'boden', block: 'D',
        zeigen: (a) => alsTuer(a) || (alsFenster(a) && ['rollo', 'plissee'].includes(a.system)),
        frage: 'Ist die Fläche unten eben (Boden bzw. Fensterbank)?',
        labels: ['geometry.bottom_surface_level', 'geometry.bottom_surface_uneven'],
        antworten: [
            {id: 'eben', text: 'Eben', setzt: {'geometry.bottom_surface_level': true, 'geometry.bottom_surface_uneven': false}},
            {id: 'uneben', text: 'Uneben oder ansteigend', setzt: {'geometry.bottom_surface_uneven': true, 'geometry.bottom_surface_level': false}},
        ],
    },
    {
        id: 'mauerleibung', block: 'D',
        zeigen: fassade,
        frage: 'Gibt es neben dem Rahmen eine gerade Mauerleibung, an der montiert werden kann?',
        hilfe: 'Mauerleibung: die seitliche Wandfläche neben dem Fenster- oder Türrahmen.',
        skizze: 'mauerleibung',
        labels: ['geometry.wall_reveal_present'],
        antworten: [
            {id: 'ja', text: 'Ja', setzt: {'geometry.wall_reveal_present': true}},
            {id: 'nein', text: 'Nein', setzt: {'geometry.wall_reveal_present': false},
                schliesstAus: [{art: 'A4', label: 'mounting.in_wall_reveal', grund: 'wird in der Mauerleibung montiert, es gibt aber keine'}]},
        ],
    },

    {
        id: 'schiebefluegel', block: 'D',
        zeigen: (a) => alsTuer(a) && (a.tuerart === 'schiebe' || a.system === 'schiebe'),
        frage: 'Wie viele Schiebeflügel soll die Anlage haben?',
        skizze: 'schiebe',
        labels: ['slide.single_leaf', 'geometry.double_leaf', 'geometry.fixed_side_panels_present'],
        antworten: [
            {id: 'einer', text: 'Einen Flügel', setzt: {'slide.single_leaf': true, 'geometry.double_leaf': false}},
            {id: 'zwei_seitenteile', text: 'Zwei gegenläufige Flügel', hinweis: 'links und rechts feste Seitenteile', setzt: {'geometry.double_leaf': true, 'geometry.fixed_side_panels_present': true, 'slide.single_leaf': false}},
            {id: 'zwei', text: 'Zwei Flügel ohne feste Seitenteile', setzt: {'geometry.double_leaf': true, 'geometry.fixed_side_panels_present': false, 'slide.single_leaf': false},
                schliesstAus: [{art: 'A4', label: 'geometry.fixed_side_panels_present', grund: 'braucht links und rechts ein festes Seitenteil'}]},
        ],
    },

    // E – Dachfenster
    {
        id: 'innenfutter_unten', block: 'E',
        zeigen: (a) => a.fenstertyp === 'dach',
        frage: 'Wie verläuft das Innenfutter unten?',
        hilfe: 'Innenfutter: die Verkleidung der Dachfenster-Leibung im Raum.',
        skizze: 'innenfutter',
        labels: ['geometry.inner_lining_bottom_perpendicular_to_frame', 'geometry.inner_lining_bottom_vertical'],
        antworten: [
            {id: 'gerade', text: 'Im rechten Winkel zum Fenster', setzt: {'geometry.inner_lining_bottom_perpendicular_to_frame': true, 'geometry.inner_lining_bottom_vertical': false}},
            {id: 'senkrecht', text: 'Senkrecht nach unten', setzt: {'geometry.inner_lining_bottom_vertical': true, 'geometry.inner_lining_bottom_perpendicular_to_frame': false}},
        ],
    },
    {
        id: 'innenfutter_oben', block: 'E',
        zeigen: (a) => a.fenstertyp === 'dach',
        frage: 'Wie verläuft das Innenfutter oben?',
        skizze: 'innenfutter',
        labels: ['geometry.inner_lining_top_perpendicular_to_frame', 'geometry.inner_lining_top_horizontal'],
        antworten: [
            {id: 'gerade', text: 'Im rechten Winkel zum Fenster', setzt: {'geometry.inner_lining_top_perpendicular_to_frame': true, 'geometry.inner_lining_top_horizontal': false}},
            {id: 'waagerecht', text: 'Waagerecht', setzt: {'geometry.inner_lining_top_horizontal': true, 'geometry.inner_lining_top_perpendicular_to_frame': false}},
        ],
    },
    {
        id: 'innenfutter_montage', block: 'E',
        zeigen: (a) => a.fenstertyp === 'dach',
        frage: 'Kann direkt im Innenfutter montiert werden?',
        labels: ['mounting.in_roof_window_inner_lining', 'mounting.on_inner_lining_cover_strips'],
        antworten: [
            {id: 'ja', text: 'Ja', setzt: {'mounting.in_roof_window_inner_lining': true}},
            {id: 'nein', text: 'Nein, nur auf den Abdeckleisten', setzt: {'mounting.on_inner_lining_cover_strips': true, 'mounting.in_roof_window_inner_lining': false},
                schliesstAus: [{art: 'A4', label: 'mounting.in_roof_window_inner_lining', grund: 'wird im Innenfutter montiert, das geht hier nicht'}]},
        ],
    },

    // F – Lichtschacht
    {
        id: 'auflage', block: 'F', pflicht: true,
        zeigen: (a) => a.element === 'lichtschacht',
        frage: 'Auf wie vielen Seiten liegt die Abdeckung auf?',
        hilfe: 'Bei 3 Seiten schließt die Abdeckung hinten an die Hauswand an.',
        skizze: 'auflage',
        labels: ['light_well.support_4_sided', 'light_well.support_3_sided'],
        antworten: [
            {id: 'vier', text: '4 Seiten', skizze: 'auflage-4', setzt: {'light_well.support_4_sided': true, 'light_well.support_3_sided': false}},
            {id: 'drei', text: '3 Seiten, hinten Hauswand', skizze: 'auflage-3', setzt: {'light_well.support_3_sided': true, 'light_well.support_4_sided': false},
                schliesstAus: [{art: 'A4', label: 'light_well.support_4_sided', ohneLabel: 'light_well.support_3_sided', grund: 'braucht Auflage auf allen 4 Seiten'}]},
        ],
    },
    {
        id: 'kellerfenster', spezifisch: true, block: 'F',
        zeigen: (a) => a.element === 'lichtschacht' && a.auflage !== 'vier',
        frage: 'Steht das Kellerfenster über die Hauswand in den Schacht?',
        skizze: 'kellerfenster',
        labels: ['light_well.basement_window_projecting'],
        antworten: [
            {id: 'ja', text: 'Ja', setzt: {'light_well.basement_window_projecting': true}},
            {id: 'nein', text: 'Nein', setzt: {'light_well.basement_window_projecting': false}},
        ],
    },
    {
        id: 'gitterrost', block: 'F',
        zeigen: (a) => a.element === 'lichtschacht',
        frage: 'Ist der Gitterrost tragfähig, formstabil und nicht verrostet?',
        antworten: [
            {id: 'ja', text: 'Ja'},
            {id: 'nein', text: 'Nein',
                schliesstAus: [{art: 'A4', label: 'excluded.when_grating_not_load_bearing', grund: 'braucht einen tragfähigen Gitterrost'}]},
        ],
    },

    // G – Bedienung
    {
        id: 'system', block: 'G',
        zeigen: (a) => a.element === 'fenster' || a.element === 'tuer',
        frage: 'Wie soll der Insektenschutz funktionieren?',
        antworten: [
            {id: 'spannrahmen', text: 'Fest einsetzen', hinweis: 'Spannrahmen', skizze: 'spannrahmen', system: 'spannrahmen', nur: (a) => alsFenster(a)},
            {id: 'rollo', text: 'Aufrollen', hinweis: 'Rollo', skizze: 'rollo', system: 'rollo'},
            {id: 'pendel', text: 'In beide Richtungen pendeln', hinweis: 'Pendelfenster, Pendeltür', skizze: 'pendel', system: 'pendel', nur: fassade},
            {id: 'dreh', text: 'Aufdrehen', hinweis: 'Drehrahmen', skizze: 'dreh', system: 'dreh', nur: fassade},
            {id: 'plissee', text: 'Seitlich falten', hinweis: 'Plissee', skizze: 'plissee', system: 'plissee', nur: fassade},
            {id: 'schiebe', text: 'Seitlich schieben', hinweis: 'Schiebeanlage', skizze: 'schiebe', system: 'schiebe', nur: alsTuer},
            {id: 'schieberahmen', text: 'Hochschieben', hinweis: 'Schieberahmen', skizze: 'schieberahmen', system: 'schieberahmen', nur: (a) => a.fenstertyp === 'dach'},
            {id: 'egal', text: 'Noch offen', hinweis: 'alle Bedienarten zeigen', system: 'egal'},
        ],
    },
    {
        id: 'richtung', block: 'G',
        zeigen: (a) => fassade(a) && a.system === 'dreh',
        frage: 'In welche Richtung soll der Drehrahmen öffnen?',
        hilfe: 'Der Hauptkatalog empfiehlt bei Fenstern nach innen, damit man sich nicht hinauslehnen muss.',
        antworten: [
            {id: 'aussen', text: 'Nach außen', richtung: 'operation.hinged_outward'},
            {id: 'innen', text: 'Nach innen', richtung: 'operation.hinged_inward'},
            {id: 'egal', text: 'Egal'},
        ],
    },
    {
        id: 'tuerschliesser', block: 'G',
        zeigen: (a) => alsTuer(a) && system(a, 'dreh'),
        frage: 'Soll die Tür einen Türschließer bekommen?',
        antworten: [
            {id: 'ja', text: 'Ja', setzt: {'operation.door_closer_available': true},
                schliesstAus: [{art: 'A2', label: 'excluded.when_door_closer_required', grund: 'Türschließer nicht möglich'}]},
            {id: 'nein', text: 'Nein'},
        ],
        labels: ['operation.door_closer_available'],
    },

    // H – Einbauweise
    {
        id: 'einbauweise', block: 'H',
        zeigen: fassade,
        frage: 'Wo soll montiert werden?',
        hilfe: 'Es erscheinen nur Einbauweisen, die bei den verbliebenen Varianten vorkommen.',
        skizze: 'einbauweise',
        labels: ['mounting_frame.position_amb_exterior_on_frame', 'mounting_frame.position_lmb_in_clear_opening', 'mounting_frame.position_lmm_in_clear_wall_reveal', 'mounting.on_frame_front', 'mounting.in_frame_opening', 'mounting.in_wall_reveal'],
        antworten: [
            {id: 'amb', text: 'Auf dem Blendrahmen', hinweis: 'von außen vorgesetzt (AMB)', skizze: 'amb', setzt: {'mounting_frame.position_amb_exterior_on_frame': true, 'mounting.on_frame_front': true, 'mounting_frame.position_lmb_in_clear_opening': false, 'mounting.in_frame_opening': false, 'mounting_frame.position_lmm_in_clear_wall_reveal': false, 'mounting.in_wall_reveal': false}},
            {id: 'lmb', text: 'In der Rahmenöffnung', hinweis: 'im Lichtmaß des Blendrahmens (LMB)', skizze: 'lmb', setzt: {'mounting_frame.position_lmb_in_clear_opening': true, 'mounting.in_frame_opening': true, 'mounting_frame.position_amb_exterior_on_frame': false, 'mounting.on_frame_front': false, 'mounting_frame.position_lmm_in_clear_wall_reveal': false, 'mounting.in_wall_reveal': false}},
            {id: 'lmm', text: 'In der Mauerleibung', hinweis: 'LMM', skizze: 'lmm', setzt: {'mounting_frame.position_lmm_in_clear_wall_reveal': true, 'mounting.in_wall_reveal': true, 'mounting_frame.position_amb_exterior_on_frame': false, 'mounting.on_frame_front': false, 'mounting_frame.position_lmb_in_clear_opening': false, 'mounting.in_frame_opening': false}},
        ],
    },
    {
        id: 'abschluss', block: 'H',
        zeigen: (a) => fassade(a) && system(a, 'pendel', 'dreh', 'plissee', 'rollo'),
        frage: 'Soll der Rahmen unten geschlossen oder offen sein?',
        hilfe: 'Unten offen: keine Stolperkante, die Bürste dichtet zum Boden bzw. zur Fensterbank ab. Unten geschlossen: umlaufender Rahmen, gut bei unebenem Untergrund.',
        labels: ['mounting_frame.closed_bottom', 'mounting_frame.open_bottom', 'roller.bottom_closed', 'roller.bottom_open'],
        antworten: [
            {id: 'geschlossen', text: 'Unten geschlossen', setzt: {'mounting_frame.closed_bottom': true, 'roller.bottom_closed': true, 'mounting_frame.open_bottom': false, 'roller.bottom_open': false}},
            {id: 'offen', text: 'Unten offen', setzt: {'mounting_frame.open_bottom': true, 'roller.bottom_open': true, 'mounting_frame.closed_bottom': false, 'roller.bottom_closed': false}},
            {id: 'egal', text: 'Egal'},
        ],
    },
    {
        id: 'zweifluegelig', block: 'H',
        zeigen: (a) => alsTuer(a) && a.tuerart === 'stulp' && system(a, 'pendel', 'dreh', 'plissee'),
        frage: 'Soll der Insektenschutz selbst zwei Flügel haben?',
        hilfe: 'Zweiflügelig: je Türflügel ein Insektenschutzflügel. Einflügelig: ein Flügel über die ganze Breite oder nur für den Gehflügel.',
        labels: ['geometry.double_leaf', 'operation.opens_double_leaf'],
        antworten: [
            {id: 'einer', text: 'Ein Flügel', setzt: {'geometry.double_leaf': false, 'operation.opens_double_leaf': false}},
            {id: 'zwei', text: 'Zwei Flügel', setzt: {'geometry.double_leaf': true, 'operation.opens_double_leaf': true}},
            {id: 'egal', text: 'Egal'},
        ],
    },
    {
        id: 'sprosse', block: 'H',
        zeigen: (a) => alsFenster(a) && system(a, 'spannrahmen'),
        frage: 'Darf der Spannrahmen eine Quersprosse haben?',
        hilfe: 'Sprossenfreie Varianten sehen ruhiger aus; bei großen Elementen kann eine Sprosse nötig sein (Sprossengrenzen im Katalog).',
        labels: ['geometry.crossbar_present', 'geometry.crossbar_absent'],
        antworten: [
            {id: 'ohne', text: 'Ohne Sprosse', setzt: {'geometry.crossbar_absent': true, 'geometry.crossbar_present': false}},
            {id: 'mit', text: 'Sprosse ist in Ordnung', setzt: {'geometry.crossbar_present': true, 'geometry.crossbar_absent': false}},
            {id: 'egal', text: 'Egal'},
        ],
    },
    {
        id: 'montagerahmen', block: 'H',
        zeigen: (a) => fassade(a) && system(a, 'dreh'),
        frage: 'Mit oder ohne Montagerahmen?',
        hilfe: 'Ohne Rahmen wird der Drehrahmen direkt am Blendrahmen befestigt.',
        labels: ['mounting_frame.present', 'mounting_frame.absent_confirmed'],
        antworten: [
            {id: 'ohne', text: 'Ohne Montagerahmen', setzt: {'mounting_frame.absent_confirmed': true, 'mounting_frame.present': false}},
            {id: 'mit', text: 'Mit Montagerahmen', setzt: {'mounting_frame.present': true, 'mounting_frame.absent_confirmed': false}},
            {id: 'egal', text: 'Egal'},
        ],
    },

    // J – Maße (A3 nur bei gemessenem Wert)
    {
        id: 'mass_seitlich', block: 'J', typ: 'mass', einheit: 'mm',
        zeigen: fassade,
        frage: 'Wie breit ist die freie Auflagefläche seitlich am Blendrahmen?',
        hilfe: 'Von der Kante des Blendrahmens bis zum Flügel bzw. zur Führungsschiene messen, die schmalere Seite zählt.',
        skizze: 'mass-seitlich',
        schluessel: ['side_support_min', 'mounting_frame_side_support_min'],
    },
    {
        id: 'mass_fuehrung', block: 'J', typ: 'mass', einheit: 'mm',
        zeigen: mitRollladen,
        frage: 'Wie weit ist die Führungsschiene vom Blendrahmen entfernt?',
        hilfe: 'Seitlich von der Führungsschiene bis zur Außenkante des Blendrahmens messen.',
        skizze: 'mass-fuehrung',
        schluessel: ['shutter.guide_to_frame_min'],
    },
    {
        id: 'mass_oben', block: 'J', typ: 'mass', einheit: 'mm',
        zeigen: alsFenster,
        frage: 'Wie viel Blendrahmenfläche ist oben über dem Flügel frei?',
        hilfe: 'Von der Oberkante des Flügels bis zur Innenkante des Rollladenkastens bzw. Sturzes messen.',
        skizze: 'mass-oben',
        schluessel: ['upper_frame_projection_min'],
    },
    {
        id: 'mass_tiefe', block: 'J', typ: 'mass', einheit: 'mm',
        zeigen: fassade,
        frage: 'Wie viel Platz ist vor dem Blendrahmen bis zum Rollladen?',
        hilfe: 'Einbautiefe: vom Blendrahmen nach außen bis zum ersten Hindernis messen.',
        skizze: 'mass-tiefe',
        schluessel: ['installation_depth_min'],
    },
    {
        id: 'mass_versatz', block: 'J', typ: 'mass', einheit: 'mm',
        zeigen: (a) => fassade(a) && a.fluegellage !== 'buendig',
        frage: 'Wie weit steht der Flügel vor dem Blendrahmen vor?',
        hilfe: 'Flächenversatz: von der Außenfläche des Blendrahmens bis zur Außenfläche des Flügels.',
        skizze: 'versetzt',
        schluessel: ['sash_offset_min'],
    },
    {
        id: 'mass_regenschiene', block: 'J', typ: 'mass', einheit: 'mm',
        zeigen: (a) => alsFenster(a) && a.regenschiene === 'ja',
        frage: 'Wie weit steht die Regenschiene über den Blendrahmen vor?',
        skizze: 'regenschiene',
        schluessel: ['rain_rail_projection_max'],
    },
    {
        id: 'mass_wetterschenkel', block: 'J', typ: 'mass', einheit: 'mm',
        zeigen: (a) => alsFenster(a) && a.wetterschenkel === 'ja',
        frage: 'Wie weit steht der Wetterschenkel vor?',
        skizze: 'wetterschenkel',
        schluessel: ['weather_bar_projection_max'],
    },
    {
        id: 'mass_kellerfenster', block: 'J', typ: 'mass', einheit: 'mm',
        zeigen: (a) => a.element === 'lichtschacht' && a.kellerfenster === 'ja',
        frage: 'Wie weit steht das Kellerfenster über?',
        hilfe: 'Von der Hauswand bis zur vordersten Kante des Kellerfensters messen.',
        skizze: 'kellerfenster',
        schluessel: ['light_well_window_overhang_max', 'light_well_window_overhang_min'],
    },

    // K – Wünsche (nur Hinweise zum Gewebe, nie Ausschluss)
    {
        id: 'wunsch', block: 'K', typ: 'mehrfach',
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

const H2Fragen = {bloecke, fragen};
globalThis.H2Fragen = H2Fragen;
})();
