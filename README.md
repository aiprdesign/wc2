# The Inheritance

A cinematic motion-graphics film celebrating the achievements of Western
civilization, told as a story of inheritance: what each generation receives,
and what it adds before passing it on.

Everything in the film is generated in code: the pictures, the typography,
and the score. There is no stock footage and there are no image assets. The
same renderer drives the browser player and the MP4 export, so what you
scrub in the browser is exactly what gets exported.

There are two cuts, sharing one script, timeline, voiceover and score:

- **`film3d/` — The Inheritance 3D** (current). Rebuilt in WebGL with three.js as
  holograms: every object combines a fresnel-lit translucent fill, a wireframe
  and a point cloud, and "prints" into existence along an axis. Words are
  extruded 3D Cinzel lettering you fly through; HUD callouts pin names and
  dates to the objects (Euclid c. 300 BC, Galileo 1610, Watt 1769, the Wright
  Flyer 1903, Apollo 8 1968, the Web 1991). Bloom, chromatic aberration,
  scanlines and a holographic dissolve between scenes finish the picture.
- **`film/` — the 2D cut**: the original line-art and silhouette version.

## Watch it

```sh
npm run serve          # then open http://127.0.0.1:8080/film3d/  (or /film/ for the 2D cut)
```

Use **Play with sound**; the score is composed in the browser the first time
it plays. Space plays and pauses, the arrow keys jump 5 s, and **Captions**
toggles the on-screen voiceover. Add `?t=73` to the URL to start at a given
second.

## Export an MP4

```sh
npm install
FFMPEG=/path/to/ffmpeg npm run render:3d  # out/the-inheritance-3d.mp4 + .srt
FFMPEG=/path/to/ffmpeg npm run render     # the 2D cut
```

The 3D export renders through headless Chromium's software WebGL
(SwiftShader), so it takes a while: roughly 30 minutes for the full film on
four cores.

The export needs an ffmpeg with `libx264` and `aac`. It renders frames headlessly
with Playwright's Chromium, renders the score offline, and muxes them. The
`.srt` sidecar holds the voiceover timings for a narrator or for subtitles.

`npm run stills -- --film film3d <dir> 12.5 40 75` writes individual frames for review.

## Structure

| Time | Chapter | What happens |
| --- | --- | --- |
| 0:00 | You inherited a world | An elder's hand and a child's hand over an old book; its drawings come alive |
| 0:12 | Reason | The line from the page becomes Euclid I.1, the geometry becomes a colonnade |
| 0:19 | Law above power | *Law, Citizen, Liberty, Representation, Rights*; the ruler dissolves into a chamber of citizens; the scale settles; print; pages become birds |
| 0:30 | Beauty | Failed sketches, then the line that works; drawing → marble → dome → painting → notation → concert hall |
| 0:38 | Science | Jupiter's moons, the old model struck through and shattered, orbits open around the observer |
| 0:47 | Industry | A jammed machine, one adjustment, *click*; steam, rail, a bridge, a turbine, lightning |
| 0:56 | Connection | Telegraph, a voice on the wire, the map's distances collapse |
| 1:01 | Medicine | A bedside, the microscope, the heart; the pulse strengthens and the child's eyes open |
| 1:07 | Exploration | Blueprint → biplane → jet → rocket; launch; silence; Earthrise |
| 1:21 | Computation | Earth's horizon becomes a wafer; calculator → relay → tube → transistor → IC → microprocessor → computer → network |
| 1:27 | Entrusted | The book is closed and handed on; years later a new maker fails, fails, and succeeds |
| 1:37 | The chain | Stone → column → arch → book → … → rocket → transistor → network, one continuous morph |
| 1:40 | Their questions | Ghosts of earlier work and earlier mistakes on the child's blank page |
| 1:46 | Legacy | Powers-of-ten pullback: page, room, city, Earth, a point among stars |
| 1:55 | Title | *Achievements of Western Civilization.* Inherited from the past. Entrusted to the present. Built for the future. *What will we add?* |

### Running time

The film runs 2:06. The brief asked for 75–90 seconds, but its voiceover is
about 240 words. At a readable caption pace, and at a normal narration pace
(about 150 words a minute), that script alone takes more than 90 seconds,
before any of the holds the brief asks for. Every line of the voiceover is
kept verbatim. For a 90-second cut, drop cues from `CUES` and shorten the
scene windows in `T`, both in `film/js/timeline.js`.

## Code

```
film3d/
  index.html        3D player page (import map for three.js)
  js/holo.js        holographic materials and builders: fill/wire/points, reveal, glow,
                    beams, grids, stars, 3D words, HUD labels, figures, hands, busts, Earth
  js/engine3d.js    renderer, scene registry, holographic dissolve, bloom and lens pass
  js/book3d.js      the book: real paper pages (v1 page art as textures), page turns
  js/s_open.js      opening: hands of two generations, knowledge rising off the pages
  js/s_reason.js    reason (Euclid → colonnade) and law (words, chamber, scale, press, birds)
  js/s_mid.js       beauty, science, industry
  js/s_late.js      connection (the map folds into a globe), medicine, exploration (Earthrise)
  js/s_end.js       computation, entrusted, the chain, questions, legacy pullback, title
  js/main.js        player and export hook
  vendor/           three.js r186 and the addons used (MIT)
  fonts/            Cinzel as three.js typeface JSON (tools/build-typeface.mjs)
film/
  index.html        player page
  js/core.js        math, easing, polylines and morphing, light, 3D projection, textures
  js/timeline.js    scene windows, voiceover cues, letterbox
  js/engine.js      compositor: scenes, fades, grain, letterbox, captions
  js/art.js         the book and its pages, hands, figures, profile heads
  js/act1.js        opening, reason, law
  js/act2.js        beauty, science, industry
  js/act3.js        connection, medicine, exploration (+ globe renderer)
  js/act4.js        computation, entrusted, the chain, questions, legacy, title
  js/score.js       the score (WebAudio, rendered offline)
  js/player.js      playback, scrubbing, export hook
  data/earth.js     Natural Earth land, pre-sampled (tools/build-earth.mjs)
  fonts/            Cinzel and Cormorant Garamond (SIL Open Font License)
tools/
  render.mjs        MP4 + SRT export
  stills.mjs        single frames
  serve.mjs         static server
  build-earth.mjs   regenerates film/data/earth.js
  build-typeface.mjs converts Cinzel to three.js typeface JSON
```

Each scene is a pure function of time, `draw(ctx, localTime)`, registered with
`Film.add(key, draw)` against a window in `T`.

## Credits

- 3D: [three.js](https://threejs.org/) (MIT), vendored in `film3d/vendor/`.
- Map data: [Natural Earth](https://www.naturalearthdata.com/) (public domain), via `world-atlas`.
- Typefaces: Cinzel (Natasha Raissa Yulvina) and Cormorant Garamond (Christian Thalmann), both under the SIL Open Font License; licences are in `film/fonts/`.
