/* WESTERN CIVILIZATION — a launch-film intro, cut to a 128 BPM grid.
   32 bars of 4 beats = exactly 60 seconds. Picture and score both read the
   beat map below, so every cut, slam and pulse lands on the music. */
'use strict';
const FPS = 30;
const BPM = 128;
const BEAT = 60 / BPM, BAR = BEAT * 4;
const DURATION = 60;
const T = { intro: [0, DURATION] };
const bt = (bar, beat = 0) => (bar * 4 + beat) * BEAT;
// sections, in bars
const SB = { ignite: 0, warp: 2, title: 4, cards: 6, heroes: 8, timeline: 16, globe: 18, chart: 20, wall: 22, finale: 24, end: 28 };
const SEC = {};
for (const k in SB) SEC[k] = bt(SB[k]);

// hero shots, one every two beats: [model, headline, kicker, stat, unit, year label, era year]
const HEROES = [
  ['parthenon', 'Built to last.', 'ATHENS', 2470, 'years standing', '447 BC', -447],
  ['igea', 'The human ideal.', 'CLASSICAL SCULPTURE', null, 'Hygieia · marble', '400 BC', -400],
  ['colosseum', 'Engineered for crowds.', 'ROME', 50000, 'seats', '80 AD', 80],
  ['pantheon', 'Concrete, perfected.', 'ROME', 43, 'metre unreinforced dome', '126 AD', 126],
  ['notreDame', 'Light, in stone.', 'PARIS', 182, 'years to complete', '1163', 1163],
  ['duomo', 'Engineered beauty.', 'FLORENCE', 4000000, 'bricks, no centring', '1436', 1436],
  ['press', 'Knowledge, printed.', 'MAINZ', 20000000, 'books by 1500', '1440', 1440],
  ['caravel', 'The world, circled.', 'MAGELLAN–ELCANO', 3, 'years at sea', '1522', 1522],
  ['orreryFull', 'The Earth moves.', 'COPERNICUS', 6, 'planets set in motion', '1543', 1543],
  ['wattAssembly', 'Power, unleashed.', 'JAMES WATT', 75, '% less coal', '1776', 1776],
  ['camera', 'Light, captured.', 'NIÉPCE · DAGUERRE', 8, 'hour first exposure', '1826', 1826],
  ['eiffel', 'Iron, elevated.', 'PARIS', 300, 'metres tall', '1889', 1889],
  ['planck', 'The quantum age.', 'MAX PLANCK', null, 'h = 6.626 × 10⁻³⁴ J·s', '1900', 1900],
  ['wrightFlyer', 'Flight.', 'KITTY HAWK', 12, 'seconds that changed everything', '1903', 1903],
  ['saturnV', 'The Moon.', 'APOLLO 11', 384400, 'kilometres away', '1969', 1969],
  ['hubble', 'The universe, revealed.', 'HUBBLE', 1600000, 'observations and counting', '1990', 1990],
];
const FEATURES = [
  ['vitruvian', 'PHILOSOPHY'], ['triumphalArch', 'LAW'], ['violin', 'ART'], ['galileoScope', 'SCIENCE'],
  ['rocketLoco', 'INDUSTRY'], ['dna', 'MEDICINE'], ['caravel', 'EXPLORATION'], ['chip', 'COMPUTING'],
];
const IGNITE_WORDS = ['3,000', 'YEARS.', 'ONE', 'STORY.'];
const WARP_WORDS = ['REASON', 'LAW', 'ART', 'SCIENCE', 'INDUSTRY', 'FLIGHT', 'SPACE', 'CODE'];
const FINALE_WORDS = ['WHAT', 'WILL', 'YOU', 'ADD?'];

// ---- the beat map ----
const KICKS = [], SNARES = [], HITS = [], TICKS = [];
(function () {
  const beats = (b0, b1, step = 1) => { const a = []; for (let b = b0 * 4; b < b1 * 4; b += step) a.push(b * BEAT); return a; };
  // ignition: a slam on every other beat
  for (let b = 0; b < 8; b += 2) { KICKS.push(b * BEAT); HITS.push(b * BEAT); }
  // a two-bar build: quarters, then eighths, then sixteenths, then one beat of silence
  const build = (bar) => {
    const a = beats(bar, bar + 1);
    for (let b = 0; b < 2; b += 0.5) a.push(bt(bar + 1, b));
    for (let b = 2; b < 3; b += 0.25) a.push(bt(bar + 1, b));
    return a;
  };
  // warp: four on the floor under a build, then a gap before the drop
  KICKS.push(...beats(2, 4).filter((t) => t < SEC.title - BEAT * 0.9));
  SNARES.push(...build(2));
  // drops and grooves
  KICKS.push(...beats(4, 16), ...beats(18, 22));
  SNARES.push(...beats(4, 16).filter((_, i) => i % 2 === 1), ...beats(18, 22).filter((_, i) => i % 2 === 1));
  // wall build: the same shape into drop two
  KICKS.push(...beats(22, 24).filter((t) => t < SEC.finale - BEAT * 0.9));
  SNARES.push(...build(22));
  KICKS.push(...beats(24, 28));
  SNARES.push(...beats(24, 28).filter((_, i) => i % 2 === 1));
  HITS.push(SEC.title, SEC.heroes, SEC.globe, SEC.finale, SEC.end);
  FINALE_WORDS.forEach((_, i) => i && HITS.push(SEC.finale + i * BEAT));
  // bright ticks: card snaps, hero cuts, arc launches, wall tiles
  FEATURES.forEach((_, i) => TICKS.push(SEC.cards + i * BEAT));
  HEROES.forEach((_, i) => TICKS.push(SEC.heroes + i * 2 * BEAT));
  for (let i = 0; i < 8; i++) TICKS.push(SEC.globe + i * BEAT);
  for (let i = 0; i < 16; i++) TICKS.push(SEC.wall + i * BEAT / 2);
  [KICKS, SNARES, HITS, TICKS].forEach((a) => a.sort((x, y) => x - y));
})();
// time since the most recent event in a list (Infinity before the first)
function since(list, t) {
  let lo = 0, hi = list.length - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (list[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; }
  return r < 0 ? Infinity : t - list[r];
}
// an exponential envelope that fires on each event
function pulse(list, t, decay = 7) { const d = since(list, t); return d === Infinity ? 0 : Math.exp(-d * decay); }

const CUES = [];
function letterbox() { return 0; }
