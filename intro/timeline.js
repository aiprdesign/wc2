/* WESTERN CIVILIZATION — a launch-film intro. 120 BPM: one beat = 0.5 s, one bar = 2 s. */
'use strict';
const FPS = 30;
const BEAT = 0.5, BAR = 2;
const DURATION = 60;
const T = { intro: [0, DURATION] };
const SEC = { open: 0, title: 8, grid: 12, heroes: 20, dash: 40, finale: 48 };
// hero shots: [model, headline, kicker, stat value, stat unit, year]
const HEROES = [
  ['parthenon', 'Built to last.', 'ATHENS', 2470, 'years standing', '447 BC'],
  ['press', 'Knowledge, printed.', 'MAINZ', 20000000, 'books by 1500', '1440'],
  ['duomo', 'Engineered beauty.', 'FLORENCE', 4000000, 'bricks, no centring', '1436'],
  ['orrery', 'The Earth moves.', 'COPERNICUS', 1543, 'heliocentric model', '1543'],
  ['wattEngine', 'Power, unleashed.', 'JAMES WATT', 4, '× the efficiency', '1776'],
  ['brooklyn', 'Distance, spanned.', 'NEW YORK', 486, 'metre main span', '1883'],
  ['eiffel', 'Iron, elevated.', 'PARIS', 300, 'metres of lattice', '1889'],
  ['wrightFlyer', 'Flight.', 'KITTY HAWK', 12, 'seconds that changed everything', '1903'],
  ['saturnV', 'The Moon.', 'APOLLO 11', 384400, 'kilometres away', '1969'],
  ['networkGlobe', 'Connected.', 'CERN', 5000000000, 'people online', '1991'],
];
const FEATURES = [
  ['vitruvian', 'PHILOSOPHY'], ['triumphalArch', 'LAW'], ['violin', 'ART'], ['galileoScope', 'SCIENCE'],
  ['rocketLoco', 'INDUSTRY'], ['dna', 'MEDICINE'], ['caravel', 'EXPLORATION'], ['chip', 'COMPUTING'],
];
const CUES = [];
function letterbox() { return 0; }
