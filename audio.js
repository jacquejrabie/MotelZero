// audio.js — lounge record, neon hum, the old window AC, and a few foley bits.
export let tvEl = null;
export function setTv(el) { tvEl = el; }
export let getState = () => 'intro';
export function bindState(fn) { getState = fn; }

export const Snd = {
  ctx: null, on: true,
  init() {
    if (this.ctx) return;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const ctx = (this.ctx = new C());
    this.master = ctx.createGain(); this.master.connect(ctx.destination);
    // lounge music
    const el = (this.music = new Audio('assets/lounge.mp3')); el.loop = true; el.preload = 'auto';
    try {
      const src = ctx.createMediaElementSource(el);
      this.mf = ctx.createBiquadFilter(); this.mf.type = 'lowpass'; this.mf.frequency.value = 600;
      this.mg = ctx.createGain(); this.mg.gain.value = 0;
      src.connect(this.mf).connect(this.mg).connect(this.master);
    } catch (e) { this.fallback = true; el.volume = 0.3; }
    el.play().catch(() => {});
    // neon hum
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 60;
    const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 120.3;
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    const hf = ctx.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 380; hf.Q.value = 3;
    o1.connect(hf); o2.connect(g2).connect(hf);
    this.hg = ctx.createGain(); this.hg.gain.value = 0; hf.connect(this.hg).connect(this.master); o1.start(); o2.start();
    // brown noise (for whooshes)
    const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    // old window AC: pink-noise fan + compressor hum, spun up when you walk in
    const wl = ctx.sampleRate * 2, wb = ctx.createBuffer(1, wl, ctx.sampleRate), wd = wb.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < wl; i++) { const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526; wd[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11; }
    const fan = ctx.createBufferSource(); fan.buffer = wb; fan.loop = true;
    this.fanF = ctx.createBiquadFilter(); this.fanF.type = 'lowpass'; this.fanF.frequency.value = 200; this.fanF.Q.value = 0.4;
    this.fanG = ctx.createGain(); this.fanG.gain.value = 0;
    const flut = ctx.createOscillator(); flut.frequency.value = 3.1; const flutG = ctx.createGain(); flutG.gain.value = 0.05; flut.connect(flutG).connect(this.fanG.gain); flut.start();
    this.comp = ctx.createOscillator(); this.comp.type = 'sawtooth'; this.comp.frequency.value = 20;
    const compF = ctx.createBiquadFilter(); compF.type = 'lowpass'; compF.frequency.value = 150;
    this.compG = ctx.createGain(); this.compG.gain.value = 0;
    this.ag = ctx.createGain(); this.ag.gain.value = 0.12;
    fan.connect(this.fanF).connect(this.fanG).connect(this.ag); this.comp.connect(compF).connect(this.compG).connect(this.ag); this.ag.connect(this.master);
    fan.start(); this.comp.start();
    this.noiseBuf = buf;
    this.initWater(ctx, buf);
  },
  // deep space drone: detuned saws through a resonant lowpass that slowly breathes open ("vrrrm"), a sub, a cold pad, long reverb
  initSpace(ctx, brown) {
    const out = (this.sg = ctx.createGain()); out.gain.value = 0; out.connect(this.master);
    const rate = ctx.sampleRate, len = Math.floor(rate * 5), ir = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { const t = i / len; lp += (Math.random() * 2 - 1 - lp) * 0.18; d[i] = lp * Math.pow(1 - t, 2.4) * (i < rate * 0.02 ? i / (rate * 0.02) : 1); } }
    const verb = ctx.createConvolver(); verb.buffer = ir; const wet = ctx.createGain(); wet.gain.value = 0.9; verb.connect(wet).connect(out);
    const dry = ctx.createGain(); dry.gain.value = 0.75; dry.connect(out);
    const bus = ctx.createGain(); bus.connect(dry); bus.connect(verb);
    const f0 = 36.71; // D1
    const lp = (this.spLP = ctx.createBiquadFilter()); lp.type = 'lowpass'; lp.frequency.value = 190; lp.Q.value = 5.5;
    const dg = ctx.createGain(); dg.gain.value = 0.17; lp.connect(dg).connect(bus);
    this.spOsc = [];
    [[1, -9, 1], [1, 8, 1], [2, -4, 0.7], [2, 5, 0.7], [3, 2, 0.35]].forEach(([mul, cents, g]) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f0 * mul; o.detune.value = cents; const og = ctx.createGain(); og.gain.value = g; o.connect(og).connect(lp); o.start(); this.spOsc.push(o); });
    const l1 = ctx.createOscillator(); l1.frequency.value = 0.055; const l1g = ctx.createGain(); l1g.gain.value = 95; l1.connect(l1g).connect(lp.frequency); l1.start();
    const l2 = ctx.createOscillator(); l2.frequency.value = 6.2; const l2g = ctx.createGain(); l2g.gain.value = 14; l2.connect(l2g).connect(lp.frequency); l2.start(); // the rrr in the vrrrm
    const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = f0; const subg = ctx.createGain(); subg.gain.value = 0.12; sub.connect(subg).connect(dry); sub.start();
    // cold pad (D A E), slow swells, mostly reverb
    const padF = ctx.createBiquadFilter(); padF.type = 'lowpass'; padF.frequency.value = 900; const padG = ctx.createGain(); padG.gain.value = 0.045; padF.connect(padG); padG.connect(verb); padG.connect(dry);
    [146.83, 220.0, 329.63, 293.66].forEach((f, i) => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = (i % 2 ? 6 : -6); const g = ctx.createGain(); g.gain.value = 0; const lf = ctx.createOscillator(); lf.frequency.value = 0.031 + i * 0.013; const lfg = ctx.createGain(); lfg.gain.value = 0.5; lf.connect(lfg).connect(g.gain); const off = ctx.createConstantSource(); off.offset.value = 0.5; off.connect(g.gain); o.connect(g).connect(padF); o.start(); lf.start(); off.start(); });
    // low rumble
    const rs = ctx.createBufferSource(); rs.buffer = brown; rs.loop = true; const rf = ctx.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 85; const rg = ctx.createGain(); rg.gain.value = 0.28; rs.connect(rf).connect(rg).connect(bus); rs.start();
    // every so often the drone swells, like something big passing overhead
    const swell = () => { if (!this.ctx) return; const t = ctx.currentTime; lp.frequency.cancelScheduledValues(t); lp.frequency.setValueAtTime(lp.frequency.value, t); lp.frequency.linearRampToValueAtTime(560, t + 3.2); lp.frequency.linearRampToValueAtTime(190, t + 8);
      this.spOsc.forEach((o, i) => { o.detune.cancelScheduledValues(t); o.detune.setValueAtTime(o.detune.value, t); o.detune.linearRampToValueAtTime(o.detune.value + (i % 2 ? 14 : -14), t + 3.2); o.detune.linearRampToValueAtTime([-9, 8, -4, 5, 2][i], t + 8); });
      setTimeout(swell, 11000 + Math.random() * 7000); };
    setTimeout(swell, 2600);
  },
  // water lapping for the pool
  initWater(ctx, brown) {
    const s = ctx.createBufferSource(); s.buffer = brown; s.loop = true; s.playbackRate.value = 1.7;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 1.2;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.38; const lg = ctx.createGain(); lg.gain.value = 260; lfo.connect(lg).connect(bp.frequency); lfo.start();
    const am = ctx.createGain(); am.gain.value = 0.6; const al = ctx.createOscillator(); al.frequency.value = 0.27; const alg = ctx.createGain(); alg.gain.value = 0.4; al.connect(alg).connect(am.gain); al.start();
    this.wg = ctx.createGain(); this.wg.gain.value = 0; s.connect(bp).connect(am).connect(this.wg).connect(this.master); s.start();
  },
  acStart() {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime;
    // clunk of the relay
    const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(70, t + 0.25); o.frequency.exponentialRampToValueAtTime(32, t + 0.45);
    g.gain.setValueAtTime(0.0001, t + 0.25); g.gain.exponentialRampToValueAtTime(0.5, t + 0.27); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55); o.connect(g).connect(this.ag); o.start(t + 0.25); o.stop(t + 0.6);
    // compressor winds up, then the fan
    this.comp.frequency.cancelScheduledValues(t); this.comp.frequency.setValueAtTime(18, t + 0.3); this.comp.frequency.exponentialRampToValueAtTime(59, t + 2.2);
    this.compG.gain.cancelScheduledValues(t); this.compG.gain.setValueAtTime(0, t + 0.3); this.compG.gain.linearRampToValueAtTime(0.45, t + 1.6);
    this.fanG.gain.cancelScheduledValues(t); this.fanG.gain.setValueAtTime(0, t + 0.5); this.fanG.gain.linearRampToValueAtTime(0.9, t + 3.2);
    this.fanF.frequency.cancelScheduledValues(t); this.fanF.frequency.setValueAtTime(180, t + 0.5); this.fanF.frequency.exponentialRampToValueAtTime(1100, t + 3.2);
  },
  acStop() {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    this.compG.gain.cancelScheduledValues(t); this.compG.gain.setTargetAtTime(0, t, 0.25); this.comp.frequency.cancelScheduledValues(t); this.comp.frequency.setTargetAtTime(20, t, 0.4);
    this.fanG.gain.cancelScheduledValues(t); this.fanG.gain.setTargetAtTime(0, t, 0.35); this.fanF.frequency.cancelScheduledValues(t); this.fanF.frequency.setTargetAtTime(200, t, 0.4);
  },
  mix(name, slow = 0) {
    if (!this.ctx) return;
    // phones can suspend the context or pause the music element (e.g. after the TV played with sound): wake both
    if (this.ctx.state !== 'running') this.ctx.resume?.().catch?.(() => {});
    // [music, music lowpass, neon hum, space drone, water]
    const M = { intro: [0, 500, 0, 0, 0], exterior: [0.3, 900, 0.011, 0, 0], door: [0.26, 800, 0.01, 0, 0], landing: [0.16, 420, 0.05, 0, 0], lobby: [1.0, 18000, 0.01, 0, 0], tv: [0.1, 16000, 0, 0, 0], room: [0.06, 340, 0, 0, 0], hall: [0.2, 460, 0.006, 0, 0], pool: [0.16, 700, 0, 0, 0.55], board: [1.0, 18000, 0.01, 0, 0], casino: [0, 500, 0, 0, 0] };
    const [mv, mf, hv, sv, wv] = M[name] || M.exterior; const t = this.ctx.currentTime;
    if (this.sg) this.sg.gain.setTargetAtTime(sv * 0.36, t, name === 'intro' ? 1.4 : 1.1);
    if (this.wg) this.wg.gain.setTargetAtTime(wv, t, 0.8);
    if (this.mg) { this.mg.gain.setTargetAtTime(mv, t, slow || 0.5); this.mf.frequency.setTargetAtTime(mf, t, slow ? slow * 0.8 : 0.4); } else if (this.music) this.music.volume = mv * 0.5;
    if (mv > 0 && this.music && this.music.paused) this.music.play().catch(() => {});
    if (this.jz || name === 'casino') this.jazzOn(name === 'casino');
    this.hg.gain.setTargetAtTime(hv, t, 0.5);
    this.hum = hv;
  },
  sputter() { // neon flicker crackle
    if (!this.ctx || !this.on || !this.hum) return; const t = this.ctx.currentTime;
    this.hg.gain.cancelScheduledValues(t); this.hg.gain.setValueAtTime(this.hum * 3, t); this.hg.gain.setTargetAtTime(this.hum, t + 0.05, 0.08);
  },
  ding() {
    if (!this.ctx || !this.on) return; const ctx = this.ctx, t = ctx.currentTime;
    [2350, 2350 * 2.76, 2350 * 5.4].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime([0.25, 0.08, 0.03][i], t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + [1.6, 0.8, 0.4][i]); o.connect(g).connect(this.master); o.start(t); o.stop(t + 1.7); });
  },
  whoosh(dur = 2.5, vol = 0.5) {
    if (!this.ctx || !this.on) return; const ctx = this.ctx, t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.8;
    f.frequency.setValueAtTime(120, t); f.frequency.exponentialRampToValueAtTime(900, t + dur * 0.4); f.frequency.exponentialRampToValueAtTime(200, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master); s.start(t); s.stop(t + dur + 0.1);
  },
  creak() {
    if (!this.ctx || !this.on) return; const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(180, t); o.frequency.linearRampToValueAtTime(260, t + 0.25); o.frequency.linearRampToValueAtTime(150, t + 0.6);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 6;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
    o.connect(f).connect(g).connect(this.master); o.start(t); o.stop(t + 0.7);
  },
  // the casino has its own music: a smoky jazz trio, synthesized (brushes, walking bass, electric piano), behind a low-pass, with the crowd murmuring
  initJazz() {
    if (this.jz) return; const ctx = this.ctx;
    const out = ctx.createGain(); out.gain.value = 0; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000; lp.Q.value = 0.3;
    const rate = ctx.sampleRate, len = Math.floor(rate * 1.6), ir = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let l = 0; for (let i = 0; i < len; i++) { l += (Math.random() * 2 - 1 - l) * 0.3; d[i] = l * Math.pow(1 - i / len, 3); } }
    const verb = ctx.createConvolver(); verb.buffer = ir; const wet = ctx.createGain(); wet.gain.value = 0.32;
    const bus = ctx.createGain(); bus.connect(lp); bus.connect(verb); verb.connect(wet).connect(lp); lp.connect(out).connect(this.master);
    const murm = ctx.createBufferSource(); murm.buffer = this.noiseBuf; murm.loop = true; murm.playbackRate.value = 1.7;
    const mb = ctx.createBiquadFilter(); mb.type = 'bandpass'; mb.frequency.value = 540; mb.Q.value = 0.8; const mgn = ctx.createGain(); mgn.gain.value = 0.16;
    const ml = ctx.createOscillator(); ml.frequency.value = 0.21; const mlg = ctx.createGain(); mlg.gain.value = 0.06; ml.connect(mlg).connect(mgn.gain); ml.start();
    murm.connect(mb).connect(mgn).connect(out); murm.start();
    this.jz = { out, bus, next: 0, step: 0, timer: null };
  },
  jazzOn(on) {
    if (!this.ctx) return; this.initJazz(); const J = this.jz, t = this.ctx.currentTime;
    J.out.gain.setTargetAtTime(on ? 0.6 : 0, t, on ? 0.9 : 0.35);
    if (on && !J.timer) { J.next = t + 0.15; J.step = 0; J.timer = setInterval(() => this.jazzTick(), 100); }
    if (!on && J.timer) { const T = J.timer; setTimeout(() => { if (J.timer === T && J.out.gain.value < 0.02) { clearInterval(T); J.timer = null; } }, 1600); }
  },
  jazzTick() {
    const J = this.jz, ctx = this.ctx, spb = 60 / 72;
    // eight bars in D minor: Dm9 Dm9 Gm9 C13 | Fmaj9 Bbmaj7#11 Em7b5 A7b9
    const P = [[[73.42, 87.31, 110, 130.81], [174.61, 220, 261.63, 329.63]], [[146.83, 130.81, 110, 103.83], [174.61, 220, 261.63, 329.63]], [[98, 110, 116.54, 123.47], [233.08, 293.66, 349.23, 440]], [[130.81, 116.54, 98, 82.41], [164.81, 233.08, 293.66, 440]],
      [[87.31, 110, 130.81, 164.81], [220, 261.63, 329.63, 392]], [[116.54, 110, 98, 87.31], [174.61, 293.66, 329.63, 440]], [[82.41, 98, 116.54, 146.83], [196, 233.08, 293.66, 329.63]], [[110, 82.41, 98, 138.59], [196, 233.08, 277.18, 329.63]]];
    while (J.next < ctx.currentTime + 0.35) {
      const st = J.step, beat = Math.floor(st / 2) % 4, off = st % 2, ch = P[Math.floor(st / 8) % 8], t = J.next;
      if (!off) { this.jBass(t, ch[0][beat]); this.jRide(t, beat % 2 ? 0.05 : 0.034); if (beat % 2) this.jTap(t); }
      else if (beat % 2) this.jRide(t, 0.026);
      if ((!off && beat === 0 && Math.random() < 0.75) || (off && beat === 1 && Math.random() < 0.45) || (off && beat === 3 && Math.random() < 0.3)) this.jKeys(t, ch[1], off ? 0.65 : 0.9);
      this.jSwish(t, spb * 0.5);
      J.step++; J.next += off ? spb * 0.36 : spb * 0.64;
    }
  },
  jKeys(t, fs, vel) { const ctx = this.ctx; fs.forEach((f, i) => { const st = t + i * 0.011, c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain(); c.frequency.value = f; m.frequency.value = f; mg.gain.setValueAtTime(f * 2.0, st); mg.gain.exponentialRampToValueAtTime(f * 0.2, st + 0.4); m.connect(mg).connect(c.frequency); g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(0.05 * vel, st + 0.008); g.gain.exponentialRampToValueAtTime(0.016 * vel, st + 0.7); g.gain.exponentialRampToValueAtTime(0.0004, st + 2.2); c.connect(g).connect(this.jz.bus); c.start(st); m.start(st); c.stop(st + 2.3); m.stop(st + 2.3); }); },
  jBass(t, f) { const ctx = this.ctx, o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 480; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2, t + 0.012); g.gain.exponentialRampToValueAtTime(0.05, t + 0.26); g.gain.exponentialRampToValueAtTime(0.0006, t + 0.7); o.connect(lp); o2.connect(lp); lp.connect(g).connect(this.jz.bus); o.start(t); o2.start(t); o.stop(t + 0.75); o2.stop(t + 0.75); },
  jRide(t, v) { const ctx = this.ctx, s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = this.white(); bp.type = 'bandpass'; bp.frequency.value = 7200; bp.Q.value = 2.5; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0004, t + 0.42); s.connect(bp).connect(g).connect(this.jz.bus); s.start(t, Math.random() * 0.5); s.stop(t + 0.45); },
  jTap(t) { const ctx = this.ctx, s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = this.white(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.7; g.gain.setValueAtTime(0.045, t); g.gain.exponentialRampToValueAtTime(0.0004, t + 0.14); s.connect(bp).connect(g).connect(this.jz.bus); s.start(t, Math.random() * 0.5); s.stop(t + 0.16); },
  jSwish(t, d) { const ctx = this.ctx, s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = this.white(); bp.type = 'bandpass'; bp.frequency.value = 3600; bp.Q.value = 0.5; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.012, t + d * 0.6); g.gain.linearRampToValueAtTime(0, t + d); s.connect(bp).connect(g).connect(this.jz.bus); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02); },
  // a slot machine paying out somewhere across the room
  slot() { if (!this.ctx || !this.jz || this.jz.out.gain.value < 0.05) return; const ctx = this.ctx, t0 = ctx.currentTime; [1046.5, 1318.5, 1568, 2093, 1568, 2093].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = f; const t = t0 + i * 0.07; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.012, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0003, t + 0.12); o.connect(g).connect(this.jz.bus); o.start(t); o.stop(t + 0.13); }); },
  // roulette: the ball rolling round the track, then clacking into the pockets
  white() { if (this._white) return this._white; const ctx = this.ctx, b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return (this._white = b); },
  click(t, v) { const ctx = this.ctx, o = ctx.createBufferSource(); o.buffer = this.white(); const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 3200 + Math.random() * 1500; hp.Q.value = 3; const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.035); o.connect(hp).connect(g).connect(this.master); o.start(t, Math.random() * 0.9); o.stop(t + 0.05); },
  roll(T = 6) {
    if (!this.ctx) return; const ctx = this.ctx, t0 = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.white(); src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4; bp.frequency.setValueAtTime(2600, t0); bp.frequency.linearRampToValueAtTime(1100, t0 + T * 0.6);
    const am = ctx.createGain(); am.gain.value = 0.5; const lfo = ctx.createOscillator(); lfo.frequency.setValueAtTime(14, t0); lfo.frequency.linearRampToValueAtTime(4, t0 + T * 0.6); const lg = ctx.createGain(); lg.gain.value = 0.4; lfo.connect(lg).connect(am.gain);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.07, t0 + 0.25); g.gain.setValueAtTime(0.07, t0 + T * 0.5); g.gain.linearRampToValueAtTime(0, t0 + T * 0.62);
    src.connect(bp).connect(am).connect(g).connect(this.master); src.start(t0); lfo.start(t0); src.stop(t0 + T); lfo.stop(t0 + T);
  },
  fret(v = 0.2) { if (this.ctx) this.click(this.ctx.currentTime, v); },
  clunk() { if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime; const n = ctx.createBufferSource(); n.buffer = this.white(); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + 0.18); g.gain.exponentialRampToValueAtTime(0.5, t + 0.19); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42); n.connect(lp).connect(g).connect(this.master); n.start(t + 0.18); n.stop(t + 0.5);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(120, t + 0.18); o.frequency.exponentialRampToValueAtTime(55, t + 0.4); const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, t + 0.18); og.gain.exponentialRampToValueAtTime(0.35, t + 0.19); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.45); o.connect(og).connect(this.master); o.start(t + 0.18); o.stop(t + 0.5);
    for (let i = 0; i < 2; i++) this.click(t + i * 0.07, 0.12); },
  chime(big) {
    if (!this.ctx) return; const ctx = this.ctx, t0 = ctx.currentTime;
    (big ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [659.25, 783.99, 1046.5]).forEach((f, i) => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const g = ctx.createGain(); const t = t0 + i * 0.09; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.6); o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.65); });
  },
  // leaving the tab/app: everything goes quiet; coming back picks up where it was
  away(hidden) {
    if (!this.ctx) return;
    if (hidden) { this._was = this.music && !this.music.paused; this.music?.pause(); this.ctx.suspend?.().catch?.(() => {}); }
    else if (this.on) { this.ctx.resume?.().catch?.(() => {}); if (this._was) this.music?.play().catch(() => {}); }
  },
  // the diner's order kiosk: a two-note beep, then the pop of the robot's lid as a burger goes up
  order() { if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime;
    [[880, 0], [1320, 0.07]].forEach(([f, d]) => { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.045, t + d + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.06); o.connect(g).connect(this.master); o.start(t + d); o.stop(t + d + 0.08); });
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(170, t + 0.32); o.frequency.exponentialRampToValueAtTime(680, t + 0.43); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + 0.32); g.gain.exponentialRampToValueAtTime(0.26, t + 0.335); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.connect(g).connect(this.master); o.start(t + 0.32); o.stop(t + 0.52);
    this.click(t + 0.31, 0.12); },
  ice() { if (!this.ctx) return; const t = this.ctx.currentTime; for (let i = 0; i < 14; i++) this.click(t + 0.05 + Math.random() * 0.7, 0.05 + Math.random() * 0.09); },
  toggle() {
    this.on = !this.on;
    if (this.ctx) { this.master.gain.setTargetAtTime(this.on ? 1 : 0, this.ctx.currentTime, 0.1); if (this.on) this.ctx.resume(); }
    if (this.fallback && this.music) this.music.muted = !this.on;
    if (tvEl) tvEl.muted = !this.on || getState() !== 'tv';
    document.querySelector('#snd-on').style.display = this.on ? '' : 'none'; document.querySelector('#snd-off').style.display = this.on ? 'none' : '';
  },
};

