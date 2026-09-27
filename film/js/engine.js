/* THE INHERITANCE — scene compositor. */
'use strict';

const Film = {
  scenes: [],
  layer: null,
  captions: true,
  add(key, draw, opts = {}) {
    const [s, e] = T[key];
    this.scenes.push({ key, s, e, draw, fadeIn: opts.fadeIn || 0, fadeOut: opts.fadeOut || 0 });
  },
  init() {
    buildTextures();
    this.layer = makeCanvas(W, H);
    this.lctx = this.layer.getContext('2d');
    for (const sc of this.scenes) if (sc.draw.init) sc.draw.init();
  },
  render(ctx, t) {
    const frame = Math.round(t * FPS);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = PAL.void;
    ctx.fillRect(0, 0, W, H);

    for (const sc of this.scenes) {
      if (t < sc.s || t >= sc.e) continue;
      let a = 1;
      if (sc.fadeIn) a = Math.min(a, E.sine(seg(t, sc.s, sc.s + sc.fadeIn)));
      if (sc.fadeOut) a = Math.min(a, 1 - E.sine(seg(t, sc.e - sc.fadeOut, sc.e)));
      if (a <= 0.002) continue;
      if (a < 0.998) {
        const l = this.lctx;
        l.setTransform(1, 0, 0, 1, 0, 0);
        l.globalAlpha = 1;
        l.globalCompositeOperation = 'source-over';
        l.clearRect(0, 0, W, H);
        l.save();
        sc.draw(l, t - sc.s, t, frame);
        l.restore();
        ctx.save();
        ctx.globalAlpha = a;
        ctx.drawImage(this.layer, 0, 0);
        ctx.restore();
      } else {
        ctx.save();
        sc.draw(ctx, t - sc.s, t, frame);
        ctx.restore();
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    grain(ctx, frame, 0.085);

    const lb = letterbox(t);
    if (lb > 0.5) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, lb);
      ctx.fillRect(0, H - lb, W, lb);
    }
    if (this.captions) this.caption(ctx, t, lb);
    // head and tail
    const edge = Math.max(1 - seg(t, 0, 0.6), seg(t, DURATION - 1.2, DURATION));
    if (edge > 0) wash(ctx, '#000000', edge);
  },
  caption(ctx, t, lb) {
    for (const [s, e, str] of CUES) {
      if (t < s - 0.05 || t > e + 0.35) continue;
      const out = 1 - E.sine(seg(t, e - 0.1, e + 0.35));
      const y = lb > 60 ? H - lb / 2 + 2 : H - 72;
      ctx.save();
      ctx.font = `italic 500 38px ${FONT.serif}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      const words = str.split(' ');
      const space = ctx.measureText(' ').width;
      const widths = words.map((w) => ctx.measureText(w).width);
      const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
      let x = W / 2 - total / 2, chars = 0;
      for (let i = 0; i < words.length; i++) {
        const d = Math.min(0.55, chars / 55);
        const a = E.out(seg(t, s + d, s + d + 0.4)) * out;
        if (a > 0) {
          ctx.globalAlpha = a;
          ctx.fillStyle = '#efe4cc';
          ctx.fillText(words[i], x, y + (1 - a) * 6);
        }
        x += widths[i] + space;
        chars += words[i].length + 1;
      }
      ctx.restore();
    }
  },
};
