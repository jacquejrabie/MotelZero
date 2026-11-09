// kit.js — shared helpers: random, noise, canvas textures (with generated normal maps), materials, geometry.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as BGU from 'three/addons/utils/BufferGeometryUtils.js';

export const TOUCH = matchMedia('(pointer: coarse)').matches;
export const LOW = TOUCH || Math.min(screen.width, screen.height) < 700;
// look: 'classic' (default) or 'video' (casino, diner and pool nudged toward the intro video). ?look=video or the debug panel picks it
const _q = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(); } })();
export const DEBUG = _q.has('debug'); // ?debug shows the debug panel; a look picked there is remembered only in debug mode
export const LOOK = (() => { let v = _q.get('look'); try { if (!v && DEBUG) v = localStorage.getItem('mz_look'); } catch (e) {} return ['classic', 'video', 'mix'].includes(v) ? v : 'mix'; })();
export const VIDEO = LOOK === 'video' || LOOK === 'mix'; // casino, diner, slots
export const VPOOL = LOOK === 'video'; // the pool only goes video in the full video look ('mix' keeps the classic pool)

/* ---------------- random / math ---------------- */
let _a = 20220;
export function seed(n) { _a = n | 0; }
export function rnd() { _a |= 0; _a = (_a + 0x6d2b79f5) | 0; let t = Math.imul(_a ^ (_a >>> 15), 1 | _a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
export const R = (a = 0, b = 1) => a + (b - a) * rnd();
export const RI = (a, b) => Math.floor(R(a, b + 1));
export const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t) => t * t * t;
export const smooth = (t) => t * t * (3 - 2 * t);

export function hash3(x, y, z) { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); }
export function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const c = (a, b, d) => hash3(xi + a, yi + b, zi + d);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}
export function fbm(x, y, z, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f, z * f); f *= 2.03; a *= 0.5; } return s / (1 - Math.pow(0.5, o)); }

/* ---------------- canvas ---------------- */
export let MAXANI = 4;
export function setAniso(n) { MAXANI = n; }
export function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
export function toTex(c, rep, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = MAXANI;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
export function speckle(g, w, h, n, a, cols) { for (let i = 0; i < n; i++) { g.globalAlpha = R(0, a); g.fillStyle = pick(cols); const s = R(0.6, 2.4); g.fillRect(R(0, w), R(0, h), s, s); } g.globalAlpha = 1; }
export function blotch(g, x, y, r, col, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col.replace('A', a)); gr.addColorStop(1, col.replace('A', 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
export function grime(g, w, h, amt = 1) {
  for (let i = 0; i < 14 * amt; i++) blotch(g, R(0, w), R(0, h), R(w * 0.04, w * 0.2), 'rgba(40,28,18,A)', R(0.04, 0.14));
  for (let i = 0; i < 8 * amt; i++) { const x = R(0, w), l = R(h * 0.1, h * 0.5), gr = g.createLinearGradient(0, 0, 0, l); gr.addColorStop(0, 'rgba(60,40,25,.2)'); gr.addColorStop(1, 'rgba(60,40,25,0)'); g.fillStyle = gr; g.fillRect(x, 0, R(2, w * 0.01), l); }
  const gb = g.createLinearGradient(0, h * 0.78, 0, h); gb.addColorStop(0, 'rgba(30,20,10,0)'); gb.addColorStop(1, `rgba(30,20,10,${0.22 * amt})`); g.fillStyle = gb; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 1400 * amt, 0.3, ['#000', '#3a2a1a', '#fff']);
}
export function fitFont(g, text, font, maxW, min = 8) {
  let px = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)[1]); g.font = font;
  while (g.measureText(text).width > maxW && px > min) { px -= Math.max(1, px * 0.04); g.font = font.replace(/\d+(?:\.\d+)?px/, px + 'px'); }
  return g.font;
}
// neon tube lettering: halo, tube body, hot core
export function neonText(g, text, x, y, font, col, blur = 18, align = 'center') {
  g.font = fitFont(g, text, font, g.canvas.width - 2 * blur - (align === 'left' ? x : 10));
  g.textAlign = align; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = col; g.shadowBlur = blur * 1.7; g.fillStyle = col; g.globalAlpha = 0.5; g.fillText(text, x, y); g.fillText(text, x, y);
  g.globalAlpha = 1; g.shadowBlur = blur * 0.6; g.lineWidth = Math.max(1.5, blur * 0.2); g.strokeStyle = col; g.strokeText(text, x, y); g.fillText(text, x, y);
  g.shadowBlur = 0; g.shadowColor = 'transparent'; g.fillStyle = 'rgba(255,255,255,.93)'; g.fillText(text, x, y);
  g.lineWidth = Math.max(1, blur * 0.09); g.strokeStyle = col; g.globalAlpha = 0.9; g.strokeText(text, x, y); g.globalAlpha = 1;
}
// grayscale height canvas -> tangent-space normal map canvas
export function heightToNormal(hc, strength = 2) {
  const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const [c, o] = cnv(w, h); const out = o.createImageData(w, h), d = out.data;
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const nx = -dx, ny = dy, nz = 1, l = Math.hypot(nx, ny, nz), i = (y * w + x) * 4;
    d[i] = (nx / l * 0.5 + 0.5) * 255; d[i + 1] = (ny / l * 0.5 + 0.5) * 255; d[i + 2] = (nz / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  o.putImageData(out, 0, 0); return c;
}
function hnoise(hg, w, h, n, amp = 0.35, rmin = 0.5, rmax = 2.4) { for (let i = 0; i < n; i++) { hg.globalAlpha = R(0.1, amp); hg.fillStyle = rnd() < 0.5 ? '#fff' : '#000'; hg.beginPath(); hg.arc(R(0, w), R(0, h), R(rmin, rmax), 0, 7); hg.fill(); } hg.globalAlpha = 1; }

/* ---------------- textures (map + normalMap) ---------------- */
export function stuccoTex(base, rep = [1, 1], dirt = 0.6, size = 512) {
  const [c, g] = cnv(size, size), [hc, hg] = cnv(size, size);
  g.fillStyle = base; g.fillRect(0, 0, size, size); hg.fillStyle = '#808080'; hg.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 30; i++) { const x = R(0, size), y = R(0, size), r = R(0.5, 2.2), v = rnd() < 0.5; g.globalAlpha = R(0.02, 0.07); g.fillStyle = v ? '#fff' : '#000'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); hg.globalAlpha = R(0.12, 0.3); hg.fillStyle = v ? '#fff' : '#000'; hg.beginPath(); hg.arc(x, y, r, 0, 7); hg.fill(); }
  g.globalAlpha = hg.globalAlpha = 1; grime(g, size, size, dirt);
  return { map: toTex(c, rep), normalMap: toTex(heightToNormal(hc, 1.4), rep, false), normalScale: new THREE.Vector2(0.55, 0.55) };
}
export function concreteTex(base, rep = [1, 1], panels = 2, dirt = 0.6, size = 512) {
  const [c, g] = cnv(size, size), [hc, hg] = cnv(size, size);
  g.fillStyle = base; g.fillRect(0, 0, size, size); hg.fillStyle = '#808080'; hg.fillRect(0, 0, size, size);
  speckle(g, size, size, size * 30, 0.2, ['#000', '#fff', '#777']); hnoise(hg, size, size, size * 12, 0.25, 0.6, 1.8);
  for (let i = 0; i < 6; i++) { // hairline cracks
    g.strokeStyle = 'rgba(10,8,10,.55)'; hg.strokeStyle = '#303030'; g.lineWidth = R(0.8, 1.6); hg.lineWidth = R(1.5, 3); let x = R(0, size), y = R(0, size);
    g.beginPath(); hg.beginPath(); g.moveTo(x, y); hg.moveTo(x, y); for (let k = 0; k < 10; k++) { x += R(-size * 0.04, size * 0.04); y += R(-size * 0.04, size * 0.04); g.lineTo(x, y); hg.lineTo(x, y); } g.stroke(); hg.stroke();
  }
  const step = size / panels; for (let i = 0; i <= panels; i++) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(i * step - 1, 0, 3, size); g.fillRect(0, i * step - 1, size, 3); hg.fillStyle = '#404040'; hg.fillRect(i * step - 2, 0, 5, size); hg.fillRect(0, i * step - 2, size, 5); }
  grime(g, size, size, dirt);
  return { map: toTex(c, rep), normalMap: toTex(heightToNormal(hc, 1.6), rep, false), normalScale: new THREE.Vector2(0.7, 0.7) };
}
export function asphaltTex(S, base = '#2b2534', paint = null) {
  const [c, g] = cnv(S, S), [hc, hg] = cnv(S / 2, S / 2);
  g.fillStyle = base; g.fillRect(0, 0, S, S); hg.fillStyle = '#808080'; hg.fillRect(0, 0, S / 2, S / 2);
  speckle(g, S, S, S * 60, 0.3, ['#000', '#4a3f5a', '#1b1622', '#5b4f6a', '#6a6274']); hnoise(hg, S / 2, S / 2, S * 6, 0.3, 0.6, 1.6);
  for (let i = 0; i < 60; i++) blotch(g, R(0, S), R(0, S), R(30, 160), 'rgba(0,0,0,A)', R(0.1, 0.3));
  if (paint) paint(g, S);
  const [rc, rg] = cnv(512, 512); rg.fillStyle = 'rgb(170,170,170)'; rg.fillRect(0, 0, 512, 512); for (let i = 0; i < 30; i++) blotch(rg, R(0, 512), R(0, 512), R(10, 50), 'rgba(20,20,20,A)', R(0.6, 1));
  return { map: toTex(c), normalMap: toTex(heightToNormal(hc, 1.2), null, false), normalScale: new THREE.Vector2(0.4, 0.4), roughnessMap: toTex(rc, null, false) };
}
export function woodTex(w, h, base, planks = 16, rep = null, dirt = 0.4) {
  const [c, g] = cnv(w, h), [hc, hg] = cnv(w, h); g.fillStyle = base; g.fillRect(0, 0, w, h); hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h);
  const step = w / planks;
  for (let i = 0; i < planks; i++) {
    const x = i * step; g.fillStyle = `rgba(0,0,0,${R(0, 0.12)})`; g.fillRect(x, 0, step, h);
    for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(40,20,5,${R(0.05, 0.2)})`; g.lineWidth = R(0.5, 1.6); g.beginPath(); let xx = x + R(2, step - 2); g.moveTo(xx, 0); for (let y = 0; y < h; y += 20) { xx += R(-0.8, 0.8); g.lineTo(xx, y); } g.stroke(); hg.strokeStyle = `rgba(0,0,0,${R(0.05, 0.15)})`; hg.lineWidth = 1; hg.stroke(); }
    g.fillStyle = 'rgba(15,8,2,.6)'; g.fillRect(x, 0, 2, h); hg.fillStyle = '#404040'; hg.fillRect(x, 0, 3, h); hg.fillStyle = '#9a9a9a'; hg.fillRect(x + 3, 0, 2, h);
  }
  grime(g, w, h, dirt);
  return { map: toTex(c, rep), normalMap: toTex(heightToNormal(hc, 1.3), rep, false), normalScale: new THREE.Vector2(0.5, 0.5) };
}
export function carpetTex(colors, kind = 'circles', rep = [4, 4]) {
  const S = 256, [c, g] = cnv(S, S), [hc, hg] = cnv(S, S); g.fillStyle = colors[0]; g.fillRect(0, 0, S, S); hg.fillStyle = '#808080'; hg.fillRect(0, 0, S, S);
  if (kind === 'circles') { for (let y = 0; y < 4; y++) for (let x = 0; x < 3; x++) for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const cx = x * (S / 3) + (y % 2) * (S / 6) + S / 6 + ox, cy = y * (S / 4) + S / 8 + oy; g.strokeStyle = colors[1]; g.lineWidth = 9; g.beginPath(); g.arc(cx, cy, 27, 0, 7); g.stroke(); g.fillStyle = colors[2]; g.beginPath(); g.arc(cx, cy, 11, 0, 7); g.fill(); hg.strokeStyle = '#8c8c8c'; hg.lineWidth = 9; hg.beginPath(); hg.arc(cx, cy, 27, 0, 7); hg.stroke(); } }
  else if (kind === 'diamond') { g.strokeStyle = colors[1]; g.lineWidth = 6; for (let i = -256; i < 512; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 256, 256); g.stroke(); g.beginPath(); g.moveTo(i + 256, 0); g.lineTo(i, 256); g.stroke(); } g.fillStyle = colors[2]; for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) g.fillRect(x + 28, y - 4, 8, 8); }
  else if (kind === 'shag') { for (let i = 0; i < 9000; i++) { g.fillStyle = pick(colors); g.globalAlpha = R(0.3, 0.9); g.fillRect(R(0, S), R(0, S), R(1, 3), R(2, 5)); } g.globalAlpha = 1; hnoise(hg, S, S, 6000, 0.5, 0.8, 2.2); }
  else if (kind === 'checker') { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? colors[1] : colors[0]; g.fillRect(x * 64, y * 64, 64, 64); } g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; hg.strokeStyle = '#303030'; hg.lineWidth = 3; for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); hg.beginPath(); hg.moveTo(i, 0); hg.lineTo(i, 256); hg.moveTo(0, i); hg.lineTo(256, i); hg.stroke(); } }
  else if (kind === 'tatami') { for (let y = 0; y < 256; y += 3) { g.fillStyle = `rgba(80,70,20,${R(0.05, 0.16)})`; g.fillRect(0, y, 256, 1.5); hg.fillStyle = `rgba(0,0,0,${R(0, 0.2)})`; hg.fillRect(0, y, 256, 1.5); } g.fillStyle = colors[1]; g.fillRect(0, 0, 256, 10); g.fillRect(0, 128, 256, 10); g.fillRect(0, 0, 10, 128); g.fillRect(128, 128, 10, 128); hg.fillStyle = '#a0a0a0'; hg.fillRect(0, 0, 256, 10); hg.fillRect(0, 128, 256, 10); hg.fillRect(0, 0, 10, 128); hg.fillRect(128, 128, 10, 128); }
  else if (kind === 'planks') { for (let y = 0; y < 256; y += 32) { g.fillStyle = `rgba(0,0,0,${R(0, 0.2)})`; g.fillRect(0, y, 256, 32); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, y, 256, 2); const sx = R(0, 256); g.fillRect(sx, y, 2, 32); hg.fillStyle = '#404040'; hg.fillRect(0, y, 256, 3); hg.fillRect(sx, y, 3, 32); } }
  if (kind !== 'shag') hnoise(hg, S, S, 2500, 0.25, 0.5, 1.4);
  speckle(g, S, S, 2400, 0.25, ['#000', '#fff']); for (let i = 0; i < 4; i++) blotch(g, R(0, S), R(0, S), R(20, 60), 'rgba(30,20,10,A)', R(0.08, 0.2));
  return { map: toTex(c, rep), normalMap: toTex(heightToNormal(hc, 1.2), rep, false), normalScale: new THREE.Vector2(0.45, 0.45) };
}
export function wallpaperTex(w, h, o) {
  const [c, g] = cnv(w, h), [hc, hg] = cnv(w, h); g.fillStyle = o.bg; g.fillRect(0, 0, w, h); hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h);
  const top = o.wainscot ? h * (1 - o.wainscot.frac) : h; g.save(); g.beginPath(); g.rect(0, 0, w, top); g.clip(); g.strokeStyle = o.fg; g.fillStyle = o.fg; const s = o.scale || 64;
  if (o.kind === 'atomic') { for (let y = 0; y < top + s; y += s) for (let x = 0; x < w + s; x += s) { const cx = x + ((y / s) % 2) * s / 2, cy = y; g.lineWidth = 1.6; g.globalAlpha = 0.7; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * s * 0.22, cy + Math.sin(a) * s * 0.22); g.stroke(); } g.beginPath(); g.arc(cx, cy, 2.5, 0, 7); g.fill(); g.globalAlpha = 0.35; g.beginPath(); g.moveTo(cx + s / 2, cy - s * 0.2); g.lineTo(cx + s / 2 + 6, cy); g.lineTo(cx + s / 2, cy + s * 0.2); g.lineTo(cx + s / 2 - 6, cy); g.closePath(); g.fill(); } }
  else if (o.kind === 'damask') { g.globalAlpha = 0.55; g.lineWidth = 2; for (let y = 0; y < top + s; y += s) for (let x = 0; x < w + s; x += s) { const cx = x + ((y / s) % 2) * s / 2, cy = y; g.beginPath(); g.ellipse(cx, cy, s * 0.16, s * 0.3, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(cx, cy - s * 0.42); g.quadraticCurveTo(cx + s * 0.25, cy, cx, cy + s * 0.42); g.quadraticCurveTo(cx - s * 0.25, cy, cx, cy - s * 0.42); g.stroke(); g.beginPath(); g.arc(cx, cy, 3, 0, 7); g.fill(); } }
  else if (o.kind === 'floral') { g.globalAlpha = 0.6; for (let y = 0; y < top + s; y += s) for (let x = 0; x < w + s; x += s) { const cx = x + ((y / s) % 2) * s / 2 + R(-4, 4), cy = y + R(-4, 4); for (let k = 0; k < 5; k++) { const a = k * 1.2566 + R(0, 0.2); g.beginPath(); g.ellipse(cx + Math.cos(a) * s * 0.12, cy + Math.sin(a) * s * 0.12, s * 0.1, s * 0.06, a, 0, 7); g.fill(); } g.globalAlpha = 0.9; g.fillStyle = o.fg2 || '#fff'; g.beginPath(); g.arc(cx, cy, s * 0.05, 0, 7); g.fill(); g.fillStyle = o.fg; g.globalAlpha = 0.6; } }
  else if (o.kind === 'stripe') { for (let x = 0; x < w; x += s) { g.globalAlpha = 0.45; g.fillRect(x, 0, s * 0.35, top); g.globalAlpha = 0.25; g.fillRect(x + s * 0.5, 0, s * 0.08, top); } }
  else if (o.kind === 'tile') { g.globalAlpha = 1; for (let y = 0; y < top; y += s) for (let x = 0; x < w; x += s) { g.fillStyle = o.bg; g.fillRect(x, y, s, s); g.fillStyle = `rgba(255,255,255,${R(0, 0.12)})`; g.fillRect(x + 2, y + 2, s - 4, s - 4); } g.fillStyle = o.fg; hg.fillStyle = '#404040'; for (let y = 0; y < top; y += s) { g.fillRect(0, y, w, 2.5); hg.fillRect(0, y, w, 3); } for (let x = 0; x < w; x += s) { g.fillRect(x, 0, 2.5, top); hg.fillRect(x, 0, 3, top); } }
  else if (o.kind === 'plain') { for (let i = 0; i < 40; i++) blotch(g, R(0, w), R(0, top), R(30, 140), 'rgba(255,255,255,A)', R(0.01, 0.05)); }
  g.restore(); g.globalAlpha = 1;
  if (o.wainscot) {
    g.fillStyle = o.wainscot.col; g.fillRect(0, top, w, h - top);
    for (let x = 0; x < w; x += 22) { g.fillStyle = `rgba(0,0,0,${R(0.05, 0.25)})`; g.fillRect(x, top, 22, h - top); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x, top, 2, h - top); hg.fillStyle = '#3a3a3a'; hg.fillRect(x, top, 3, h - top); hg.fillStyle = '#a8a8a8'; hg.fillRect(x + 3, top, 2, h - top); }
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, top - 6, w, 4); g.fillStyle = 'rgba(255,230,190,.25)'; g.fillRect(0, top - 9, w, 3); hg.fillStyle = '#c0c0c0'; hg.fillRect(0, top - 10, w, 6); hg.fillStyle = '#505050'; hg.fillRect(0, top - 4, w, 3);
  }
  g.fillStyle = 'rgba(20,12,8,.8)'; g.fillRect(0, h - h * 0.035, w, h * 0.035); hg.fillStyle = '#b0b0b0'; hg.fillRect(0, h - h * 0.035, w, h * 0.035); hg.fillStyle = '#505050'; hg.fillRect(0, h - h * 0.035 - 3, w, 3);
  hnoise(hg, w, h, w * 4, 0.12, 0.5, 1.5);
  grime(g, w, h, o.dirt ?? 0.6);
  if (o.ghost) { g.fillStyle = 'rgba(255,240,210,.12)'; g.fillRect(o.ghost[0] * w, o.ghost[1] * h, o.ghost[2] * w, o.ghost[3] * h); }
  return { map: toTex(c), normalMap: toTex(heightToNormal(hc, 1.6), null, false), normalScale: new THREE.Vector2(0.6, 0.6) };
}
export function ceilingTex(rep, stain = true) {
  const S = 256, [c, g] = cnv(S, S), [hc, hg] = cnv(S, S); g.fillStyle = '#d8d0bd'; g.fillRect(0, 0, S, S); hg.fillStyle = '#808080'; hg.fillRect(0, 0, S, S);
  speckle(g, S, S, 5000, 0.3, ['#8a8270', '#fff', '#6b6355']); hnoise(hg, S, S, 3000, 0.3, 0.5, 1.6);
  g.fillStyle = '#8c8577'; hg.fillStyle = '#303030'; [0, 128].forEach((i) => { g.fillRect(0, i, S, 4); g.fillRect(i, 0, 4, S); hg.fillRect(0, i, S, 5); hg.fillRect(i, 0, 5, S); });
  if (stain) { blotch(g, 60, 70, 40, 'rgba(140,100,40,A)', 0.4); g.strokeStyle = 'rgba(120,80,30,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(60, 70, 34, 0, 7); g.stroke(); }
  return { map: toTex(c, rep), normalMap: toTex(heightToNormal(hc, 1.4), rep, false), normalScale: new THREE.Vector2(0.5, 0.5) };
}
export function tileTex(colors, rep = [3, 3], n = 8, dirt = 0.6) {
  const S = 256, [c, g] = cnv(S, S), [hc, hg] = cnv(S, S); const st = S / n; g.fillStyle = colors[1]; g.fillRect(0, 0, S, S); hg.fillStyle = '#404040'; hg.fillRect(0, 0, S, S);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = rnd() < 0.08 ? colors[2] || colors[0] : colors[0]; g.fillRect(x * st + 2, y * st + 2, st - 4, st - 4); g.fillStyle = `rgba(255,255,255,${R(0, 0.14)})`; g.fillRect(x * st + 3, y * st + 3, st - 6, (st - 6) * 0.45); hg.fillStyle = '#8a8a8a'; hg.fillRect(x * st + 2, y * st + 2, st - 4, st - 4); }
  grime(g, S, S, dirt);
  return { map: toTex(c, rep), normalMap: toTex(heightToNormal(hc, 1.2), rep, false), normalScale: new THREE.Vector2(0.6, 0.6) };
}
export function metalTex(base, rep = [1, 1]) {
  const S = 256, [c, g] = cnv(S, S); g.fillStyle = base; g.fillRect(0, 0, S, S); for (let y = 0; y < S; y += 1) { g.fillStyle = `rgba(255,255,255,${R(0, 0.07)})`; g.fillRect(0, y, S, 1); } speckle(g, S, S, 1200, 0.15, ['#000', '#fff']);
  const [rc, rg] = cnv(S, S); rg.fillStyle = 'rgb(90,90,90)'; rg.fillRect(0, 0, S, S); for (let i = 0; i < 400; i++) { rg.fillStyle = `rgba(255,255,255,${R(0, 0.25)})`; rg.fillRect(R(0, S), R(0, S), R(1, 20), R(1, 2)); }
  return { map: toTex(c, rep), roughnessMap: toTex(rc, rep, false) };
}
export function acTex() {
  const [c, g] = cnv(128, 96), [hc, hg] = cnv(128, 96); g.fillStyle = '#cfc7b2'; g.fillRect(0, 0, 128, 96); hg.fillStyle = '#808080'; hg.fillRect(0, 0, 128, 96);
  g.fillStyle = '#6d675a'; hg.fillStyle = '#404040'; for (let y = 10; y < 70; y += 6) { g.fillRect(10, y, 108, 3); hg.fillRect(10, y, 108, 3); }
  g.fillStyle = '#8a8270'; g.fillRect(10, 76, 30, 10); g.fillStyle = 'rgba(120,70,20,.4)'; g.fillRect(56, 80, 4, 16); grime(g, 128, 96, 0.8);
  return { map: toTex(c), normalMap: toTex(heightToNormal(hc, 1.4), null, false), normalScale: new THREE.Vector2(0.8, 0.8) };
}

/* ---------------- materials ---------------- */
export const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0, ...o });
// physical-material extras (clearcoat, sheen...) cost a lot per pixel for little visible gain at this scale: everything renders as standard
const PHYS_ONLY = ['clearcoat', 'clearcoatRoughness', 'sheen', 'sheenColor', 'sheenRoughness', 'transmission', 'thickness', 'ior', 'iridescence', 'specularIntensity', 'specularColor', 'attenuationColor', 'attenuationDistance'];
export const phys = (o = {}) => { const p = { roughness: 0.5, metalness: 0, ...o }; PHYS_ONLY.forEach((k) => delete p[k]); if (o.clearcoat) p.roughness = Math.min(p.roughness, 0.35); return new THREE.MeshStandardMaterial(p); };
export const basic = (o) => new THREE.MeshBasicMaterial({ toneMapped: false, ...o });
export function texMat(t, o = {}, physical = false) {
  const p = { map: t.map, ...o }; if (t.normalMap) { p.normalMap = t.normalMap; p.normalScale = o.normalScale || t.normalScale; } if (t.roughnessMap) { p.roughnessMap = t.roughnessMap; if (p.roughness === undefined) p.roughness = 1; }
  return physical ? phys(p) : std(p);
}
// glow sprite: computed per pixel (canvas gradients get an ordered dither that turns into a visible grid when magnified)
export function softTex(S = 256, prof = (r) => Math.exp(-3.15 * r) * (1 - r * r)) {
  const [c, g] = cnv(S, S), im = g.createImageData(S, S), d = im.data, h = S / 2;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const r = Math.hypot(x + 0.5 - h, y + 0.5 - h) / h, a = r >= 1 ? 0 : prof(r) * (1 - Math.pow(r, 12)), i = (y * S + x) * 4;
    d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.max(0, Math.min(255, a * 255 + Math.random() - 0.5));
  }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export const glowTex = softTex(256);
export function glow(color, size, opacity = 1) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: opacity * 0.7, toneMapped: false })); s.scale.setScalar(size); s.userData.noCast = true; return s; }
export function spill(color, w, d, opacity = 0.5) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity, toneMapped: false })); p.rotation.x = -Math.PI / 2; p.userData.noCast = true; return p; }
export const NEON = 1.1; // neon tubes render hotter than 1.0 so the bloom pass catches them like real gas tubes
export const neonQuad = (canvas, w, h, hot = NEON) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic({ map: toTex(canvas), transparent: true, depthWrite: false, color: new THREE.Color(hot, hot, hot) })); q.userData.noCast = true; return q; };

/* ---------------- geometry ---------------- */
export function box(w, h, d, mat, x = 0, y = 0, z = 0, parent) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
export function rbox(w, h, d, r, mat, x = 0, y = 0, z = 0, parent, seg = 3) { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2)), mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
export function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, parent, seg = 24) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
export function sph(r, mat, x = 0, y = 0, z = 0, parent, seg = 24) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, Math.round(seg * 0.75))), mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
export function quad(w, h, mat, x = 0, y = 0, z = 0, parent) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
export function lathe(pts, mat, x = 0, y = 0, z = 0, parent, seg = 32) { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg), mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
export function torus(r, t, mat, x = 0, y = 0, z = 0, parent, seg = 48, arc = Math.PI * 2) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 10, seg, arc), mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
export const RBG = (w, h, d, r, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2));
// the 0★ mark: one texture, used as small neon signs around the place (additive blending, so its black square disappears)
export const zeroTex = (() => { const t = new THREE.TextureLoader().load('assets/zero.webp'); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })();
export function zeroSign(size, parent, x = 0, y = 0, z = 0, opacity = 1) { const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: zeroTex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); m.position.set(x, y, z); m.userData.noCast = true; m.userData.noBatch = true; if (parent) parent.add(m); return m; }
// a lit cove where a wall meets the ceiling: a quarter-round along local X, origin at the corner, concave toward +Z (the room).
// The glow is baked into vertex colours (low = by the hidden strip, high = where it meets the ceiling), so it costs nothing to light.
export function coveGeo(len, r, low, high, seg = 20, gam = 0.7) {
  const pos = [], nor = [], col = [], idx = [], a = new THREE.Color(low), b = new THREE.Color(high), c = new THREE.Color();
  for (let i = 0; i <= seg; i++) { const f = (i / seg) * Math.PI / 2, y = -r + r * Math.sin(f), z = r - r * Math.cos(f); c.copy(a).lerp(b, Math.pow(i / seg, gam));
    for (const x of [-len / 2, len / 2]) { pos.push(x, y, z); nor.push(0, -Math.sin(f), Math.cos(f)); col.push(c.r, c.g, c.b); } }
  for (let i = 0; i < seg; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); return g;
}

// collects many small parts and emits one mesh per material
export class Merger {
  constructor(parent) { this.parent = parent; this.byMat = new Map(); }
  add(geo, mat, x = 0, y = 0, z = 0, rot = null, scale = null) {
    const g = geo.clone(); const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); if (rot) q.setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2]));
    m.compose(new THREE.Vector3(x, y, z), q, scale ? new THREE.Vector3(scale[0], scale[1], scale[2]) : new THREE.Vector3(1, 1, 1)); g.applyMatrix4(m);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    const ng = g.index ? g.toNonIndexed() : g; if (!ng.attributes.uv) ng.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(ng.attributes.position.count * 2), 2));
    if (!this.byMat.has(mat)) this.byMat.set(mat, []); this.byMat.get(mat).push(ng); return this;
  }
  box(w, h, d, mat, x, y, z, rot) { return this.add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rot); }
  rbox(w, h, d, r, mat, x, y, z, rot, seg = 2) { return this.add(RBG(w, h, d, r, seg), mat, x, y, z, rot); }
  cyl(rt, rb, h, mat, x, y, z, rot, seg = 16) { return this.add(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, rot); }
  build(ud = {}) {
    const out = [];
    for (const [mat, geos] of this.byMat) { const merged = BGU.mergeGeometries(geos, false); if (!merged) continue; const mesh = new THREE.Mesh(merged, mat); mesh.castShadow = mesh.receiveShadow = true; Object.assign(mesh.userData, ud); this.parent.add(mesh); out.push(mesh); }
    this.byMat.clear(); return out;
  }
}

// curtain with real folds, lit faintly from behind by the room
export function curtain(w, h, color, emis = 0x000000, folds = 9, side = THREE.DoubleSide) {
  const geo = new THREE.PlaneGeometry(w, h, Math.max(32, folds * 10), 4);
  const p = geo.attributes.position, amp = Math.min(0.09, (w / folds) * 0.28);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const k = 1 - 0.25 * (y / h + 0.5); p.setZ(i, (Math.sin((x / w) * Math.PI * 2 * folds) * amp + Math.sin((x / w) * Math.PI * 2 * folds * 2.3 + 1) * amp * 0.25) * k); }
  geo.computeVertexNormals();
  const [c, g] = cnv(128, 128); const gr = g.createRadialGradient(64, 80, 6, 64, 64, 90); gr.addColorStop(0, '#fff'); gr.addColorStop(0.5, '#777'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, emissive: emis, emissiveIntensity: 1, emissiveMap: toTex(c), side });
  const m = new THREE.Mesh(geo, mat); m.castShadow = false; m.receiveShadow = true; return m;
}
