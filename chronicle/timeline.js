/* THREE THOUSAND YEARS — timeline: 28 milestones of Western civilization. */
'use strict';

const FPS = 30;
// [year (negative = BC), label, title, line, model, era]
const STATIONS = [
  [-750, 'c. 750 BC', 'HOMER', 'The Iliad and the Odyssey give the West its first epics.', 'openBook', 'ANTIQUITY'],
  [-447, '447 BC', 'THE PARTHENON', 'Athens builds a temple to reason and proportion, and governs itself by vote.', 'parthenon', 'ANTIQUITY'],
  [-300, 'c. 300 BC', 'EUCLID', 'The Elements: truth derived step by step from first principles.', 'euclid', 'ANTIQUITY'],
  [-100, 'c. 100 BC', 'ANTIKYTHERA', 'A bronze computer of gears predicts the heavens.', 'antikythera', 'ANTIQUITY'],
  [80, 'AD 80', 'THE COLOSSEUM', 'Rome masters the arch, concrete and the engineering of a city.', 'colosseum', 'ANTIQUITY'],
  [126, 'AD 126', 'THE PANTHEON', 'An unreinforced concrete dome, unsurpassed for thirteen centuries.', 'pantheon', 'ANTIQUITY'],
  [533, 'AD 533', 'CORPUS JURIS CIVILIS', 'Justinian codifies Roman law, the root of Europe’s legal systems.', 'triumphalArch', 'LATE ANTIQUITY'],
  [1163, '1163', 'NOTRE-DAME', 'Gothic masons lift stone and light toward heaven.', 'notreDame', 'MIDDLE AGES'],
  [1215, '1215', 'MAGNA CARTA', 'Even the king is bound by law.', 'sheet', 'MIDDLE AGES'],
  [1436, '1436', 'BRUNELLESCHI’S DOME', 'Florence crowns its cathedral with engineering genius.', 'duomo', 'RENAISSANCE'],
  [1440, 'c. 1440', 'THE PRINTING PRESS', 'Gutenberg sets knowledge free.', 'press', 'RENAISSANCE'],
  [1490, 'c. 1490', 'LEONARDO', 'Art and anatomy meet in the measure of man.', 'vitruvian', 'RENAISSANCE'],
  [1492, '1492', 'THE AGE OF DISCOVERY', 'Across the Atlantic, the known world doubles.', 'caravel', 'RENAISSANCE'],
  [1543, '1543', 'COPERNICUS', 'The Earth moves; the Sun takes the centre.', 'orrery', 'SCIENTIFIC REVOLUTION'],
  [1609, '1609', 'GALILEO', 'A telescope turned to the sky; evidence over authority.', 'galileoScope', 'SCIENTIFIC REVOLUTION'],
  [1665, '1665', 'THE MICROSCOPE', 'Hooke discovers the cell, a world within the world.', 'microscope', 'SCIENTIFIC REVOLUTION'],
  [1687, '1687', 'NEWTON’S PRINCIPIA', 'One set of laws for the apple and the Moon.', 'openBook', 'SCIENTIFIC REVOLUTION'],
  [1716, '1716', 'STRADIVARI', 'The violin reaches perfection in Cremona.', 'violin', 'ENLIGHTENMENT'],
  [1776, '1776', 'THE STEAM ENGINE', 'Watt’s engine turns heat into work.', 'wattEngine', 'ENLIGHTENMENT'],
  [1787, '1787', 'THE CONSTITUTION', 'Government of the people, by written consent, under law.', 'capitol', 'ENLIGHTENMENT'],
  [1829, '1829', 'THE RAILWAY', 'Stephenson’s Rocket collapses distance.', 'rocketLoco', 'INDUSTRY'],
  [1883, '1883', 'THE BROOKLYN BRIDGE', 'Steel cable spans the impossible.', 'brooklyn', 'INDUSTRY'],
  [1889, '1889', 'THE EIFFEL TOWER', 'Iron lattice rises three hundred metres.', 'eiffel', 'INDUSTRY'],
  [1903, '1903', 'FLIGHT', 'Twelve seconds at Kitty Hawk.', 'wrightFlyer', 'MODERN'],
  [1905, '1905', 'RELATIVITY', 'Einstein rewrites space, time and energy.', 'equation', 'MODERN'],
  [1953, '1953', 'THE DOUBLE HELIX', 'The code of life is read.', 'dna', 'MODERN'],
  [1969, '1969', 'THE MOON', 'Humanity walks on another world.', 'saturnV', 'MODERN'],
  [1991, '1991', 'THE WORLD WIDE WEB', 'Knowledge connects the whole planet.', 'networkGlobe', 'MODERN'],
];
const INTRO = 5.0, STEP = 3.1, OUTRO = 10.0;
const DURATION = INTRO + STATIONS.length * STEP + OUTRO;
const T = { chronicle: [0, DURATION] };
const stationTime = (i) => INTRO + i * STEP;
const CUES = STATIONS.map(([, , , line], i) => [stationTime(i) + 0.35, stationTime(i) + STEP - 0.15, line]);
CUES.unshift([1.2, 4.6, 'Three thousand years of ideas, carried forward.']);
CUES.push([DURATION - OUTRO + 1.0, DURATION - OUTRO + 4.2, 'Each generation inherited. Each generation added.']);
CUES.push([DURATION - OUTRO + 4.6, DURATION - 2.0, 'What will ours add?']);
function letterbox(t) { return 96 * (1 - E.io(seg(t, DURATION - OUTRO + 4.2, DURATION - OUTRO + 5.4))); }
