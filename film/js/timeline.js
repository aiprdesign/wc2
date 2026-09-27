/* THE INHERITANCE — master timeline.
   Scene windows overlap slightly; each scene owns its own transitions.
   All times are in seconds from the first frame. */
'use strict';

const FPS = 30;

const T = {
  open: [0, 12.4],
  reason: [11.6, 19.3],
  civic: [18.9, 30.4],
  beauty: [30.0, 38.0],
  science: [37.6, 47.4],
  industry: [47.0, 56.1],
  connect: [55.8, 61.0],
  medicine: [60.6, 67.9],
  explore: [67.4, 81.7],
  compute: [81.4, 87.1],
  inherit: [86.8, 96.9],
  chain: [96.6, 100.0],
  questions: [99.7, 106.7],
  pullback: [106.4, 115.5],
  title: [115.2, 126.0],
};
const DURATION = 126.0;

// Voiceover, verbatim from the script. [start, end, text]
const CUES = [
  [1.7, 4.0, 'We arrive in a world already begun.'],
  [4.2, 5.9, 'Before us, others wondered.'],
  [6.6, 7.6, 'Others built.'],
  [7.7, 8.8, 'Others questioned.'],
  [8.9, 9.9, 'Others failed.'],
  [10.0, 11.5, 'And others tried again.'],

  [12.3, 14.9, 'They asked whether the world could be understood…'],
  [15.1, 16.2, '…through observation…'],
  [16.3, 17.3, '…through reason…'],
  [17.4, 18.9, '…and through argument.'],

  [19.2, 21.4, 'Across centuries came another radical idea…'],
  [21.7, 23.6, '…that power itself could be restrained.'],
  [23.8, 25.7, 'That law could stand above the ruler.'],
  [25.9, 29.7, 'And that the individual could possess rights no government simply grants at whim.'],

  [30.4, 32.6, 'But understanding the world was never enough.'],
  [32.8, 35.3, 'We wanted to express what it felt like to be alive.'],
  [35.5, 37.6, 'Beauty became another form of knowledge.'],

  [37.9, 40.5, 'And sometimes progress required something difficult…'],
  [40.7, 43.1, '…the willingness to discover that we were wrong.'],
  [43.3, 45.1, 'Authority could preserve knowledge.'],
  [45.3, 47.0, 'But evidence could challenge it.'],

  [50.5, 51.7, 'Ideas left the page…'],
  [51.8, 53.3, '…and began moving the world.'],
  [53.5, 55.6, 'Human strength became mechanical power.'],

  [56.0, 58.5, 'Distances that had separated people for centuries…'],
  [58.7, 60.0, '…began to collapse.'],

  [61.2, 63.1, 'Knowledge acquired another purpose.'],
  [63.4, 65.1, 'Not simply to understand life…'],
  [65.4, 66.9, '…but to preserve it.'],

  [74.3, 77.7, 'For thousands of years, our ancestors looked toward the heavens.'],
  [78.7, 80.6, 'Then one generation looked back.'],

  [82.0, 83.3, 'Nothing began with us.'],
  [83.5, 85.6, 'Every breakthrough rested upon another.'],

  [89.6, 92.3, 'Civilization is not something we merely inherit.'],
  [93.0, 94.0, 'For a moment…'],
  [94.6, 96.4, '…it is entrusted to us.'],

  [100.3, 102.0, 'We inherited their questions.'],
  [102.2, 103.3, 'Their discoveries.'],
  [103.5, 104.5, 'Their mistakes.'],
  [104.7, 106.5, 'Their courage to begin again.'],

  [107.0, 109.5, 'Their achievements became our inheritance.'],
  [110.3, 111.7, 'What we leave behind…'],
  [112.5, 114.5, '…will become someone else’s.'],
];

// Letterbox bar height over time (the frame opens fully in space).
function letterbox(t) {
  const base = 104;
  const open = E.io(seg(t, 73.4, 75.2)) * (1 - E.io(seg(t, 81.0, 82.4)));
  const titleOpen = E.io(seg(t, 115.2, 116.4));
  return base * (1 - Math.max(open, titleOpen));
}
