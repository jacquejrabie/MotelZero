// rooms.js — the lobby and the five room dioramas.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LOW, R, RI, rnd, pick, clamp, lerp, fbm, vnoise, cnv, toTex, blotch, speckle, grime, fitFont, neonText, heightToNormal, woodTex, carpetTex, wallpaperTex, ceilingTex, tileTex, acTex, concreteTex, std, phys, basic, texMat, glow, spill, neonQuad, box, rbox, cyl, sph, quad, lathe, torus, RBG, Merger, curtain, glowTex, VIDEO, coveGeo, zeroTex, zeroSign } from './kit.js';
import { lampMini, plant, palm, makeCar } from './motel.js';

const cream = std({ color: 0xe8e0cf, roughness: 0.7 });
const brass = phys({ color: 0xc9a24a, roughness: 0.28, metalness: 0.9, clearcoat: 0.5 });
const chromeM = phys({ color: 0xe8e8ea, roughness: 0.12, metalness: 1, clearcoat: 1 });
const darkM = std({ color: 0x1b1922, roughness: 0.45, metalness: 0.4 });

function shell(scene, o) {
  const { w, d, h } = o; const M = new Merger(scene);
  const fl = quad(w, d, texMat(o.floor, { roughness: 0.95 }), 0, 0, 0, scene); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  const ce = quad(w, d, texMat(o.ceil, { roughness: 1 }), 0, h, 0, scene); ce.rotation.x = Math.PI / 2;
  const wb = quad(w, h, texMat(o.wall), 0, h / 2, -d / 2, scene); wb.receiveShadow = true;
  const ws = o.wallSide || o.wall;
  const l = quad(d, h, texMat(ws), -w / 2, h / 2, 0, scene); l.rotation.y = Math.PI / 2; l.receiveShadow = true;
  const r = quad(d, h, texMat(ws), w / 2, h / 2, 0, scene); r.rotation.y = -Math.PI / 2; r.receiveShadow = true;
  const f = quad(w, h, texMat(ws), 0, h / 2, d / 2, scene); f.rotation.y = Math.PI;
  const trim = o.trim || cream;
  // crown moulding + baseboard
  [[0, h - 0.06, -d / 2 + 0.06, 0, w], [0, 0.06, -d / 2 + 0.06, 0, w], [-w / 2 + 0.06, h - 0.06, 0, Math.PI / 2, d], [-w / 2 + 0.06, 0.06, 0, Math.PI / 2, d], [w / 2 - 0.06, h - 0.06, 0, Math.PI / 2, d], [w / 2 - 0.06, 0.06, 0, Math.PI / 2, d]]
    .forEach(([x, y, z, ry, len]) => M.rbox(len, 0.12, 0.12, 0.03, trim, x, y, z, [0, ry, 0]));
  M.build();
  scene.environmentIntensity = 0.18;
  return M;
}
function keyLight(scene, x, y, z, color, intensity, angle = 1.0, tx = 0, tz = 0) {
  const L = new THREE.SpotLight(color, intensity, 14, angle, 0.6, 1.4); L.position.set(x, y, z); L.target.position.set(tx, 0, tz); L.castShadow = true; L.shadow.mapSize.set(LOW ? 512 : 1024, LOW ? 512 : 1024); L.shadow.bias = -0.0006; L.shadow.normalBias = 0.02; scene.add(L, L.target); return L;
}
function frame(w, h, tex, parent, x, y, z, ry = 0, fcol = 0x5a3a1a) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  rbox(w + 0.12, h + 0.12, 0.05, 0.015, std({ color: fcol, roughness: 0.5 }), 0, 0, 0, g, 2); quad(w, h, std({ map: tex, roughness: 0.75 }), 0, 0, 0.03, g); return g;
}
const _texLoader = new THREE.TextureLoader();
function posterFrame(url, w, h, parent, x, y, z, ry = 0) {
  const t = _texLoader.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  rbox(w + 0.07, h + 0.07, 0.04, 0.008, std({ color: 0x141012, roughness: 0.4, metalness: 0.3 }), 0, 0, 0, g, 1);
  const q = quad(w, h, std({ map: t, roughness: 0.55 }), 0, 0, 0.022, g); q.userData.noBatch = true; return g;
}
function paintingTex(kind) {
  const [c, g] = cnv(256, 192);
  if (kind === 'asteroid') { g.fillStyle = '#20183a'; g.fillRect(0, 0, 256, 192); for (let i = 0; i < 80; i++) { g.fillStyle = '#fff'; g.fillRect(R(0, 256), R(0, 120), 1.5, 1.5); } g.fillStyle = '#6a5a5a'; g.beginPath(); g.ellipse(128, 150, 110, 60, 0, 0, 7); g.fill(); g.fillStyle = '#e8dcc4'; g.fillRect(90, 96, 76, 26); g.fillStyle = '#4f9e92'; g.fillRect(86, 92, 84, 6); g.fillStyle = '#ffd27a'; for (let i = 0; i < 5; i++) g.fillRect(96 + i * 14, 104, 6, 8); g.fillStyle = '#d6a0ff'; g.font = '22px "Yellowtail"'; g.fillText('Motel Zero', 92, 80); }
  else if (kind === 'boat') { g.fillStyle = '#7fb0c8'; g.fillRect(0, 0, 256, 120); g.fillStyle = '#2f5f80'; g.fillRect(0, 120, 256, 72); g.fillStyle = '#e8dcc0'; g.beginPath(); g.moveTo(128, 30); g.lineTo(128, 120); g.lineTo(70, 120); g.fill(); g.fillStyle = '#6a3a1a'; g.fillRect(70, 120, 110, 12); g.fillStyle = '#f0c040'; g.beginPath(); g.arc(210, 40, 16, 0, 7); g.fill(); }
  else if (kind === 'clown') { g.fillStyle = '#d8c8a8'; g.fillRect(0, 0, 256, 192); g.fillStyle = '#f0e0d0'; g.beginPath(); g.arc(128, 100, 50, 0, 7); g.fill(); g.fillStyle = '#c02020'; g.beginPath(); g.arc(128, 108, 10, 0, 7); g.fill(); g.fillStyle = '#222'; g.fillRect(104, 86, 10, 6); g.fillRect(142, 86, 10, 6); g.strokeStyle = '#c02020'; g.lineWidth = 4; g.beginPath(); g.arc(128, 118, 22, 0.2, 2.9); g.stroke(); g.fillStyle = '#e07020'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(80 + i * 12, 60 + Math.abs(i - 4) * 6, 10, 0, 7); g.fill(); } }
  else if (kind === 'desert') { const gr = g.createLinearGradient(0, 0, 0, 192); gr.addColorStop(0, '#f0a060'); gr.addColorStop(0.55, '#e06040'); gr.addColorStop(0.56, '#6a3a3a'); gr.addColorStop(1, '#3a2030'); g.fillStyle = gr; g.fillRect(0, 0, 256, 192); g.fillStyle = '#fff0c0'; g.beginPath(); g.arc(190, 60, 26, 0, 7); g.fill(); g.fillStyle = '#2a1a20'; g.fillRect(60, 80, 8, 40); g.fillRect(52, 90, 24, 6); g.fillRect(52, 84, 6, 14); g.fillRect(70, 86, 6, 12); }
  grime(g, 256, 192, 0.4); return toTex(c);
}
function bed(parent, x, z, ry, spreadTex, w = 1.7, len = 2.1) {
  const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; parent.add(b);
  rbox(w - 0.1, 0.34, len, 0.04, texMat(woodTex(256, 128, '#3a2416', 4), { roughness: 0.6 }), 0, 0.2, 0, b);
  rbox(w, 0.26, len, 0.1, std({ color: 0xf0ead8, roughness: 0.9 }), 0, 0.5, 0, b, 3);
  const sp = rbox(w + 0.08, 0.1, len * 0.72, 0.05, texMat(spreadTex, { roughness: 0.95 }), 0, 0.68, len * 0.14, b, 3);
  rbox(w + 0.08, 0.5, 0.04, 0.02, texMat(spreadTex, { roughness: 0.95 }), 0, 0.42, len / 2 + 0.02, b, 2);
  [-0.4, 0.4].forEach((px) => { const p = rbox(0.64, 0.16, 0.4, 0.07, std({ color: 0xf6f0e0, roughness: 0.9 }), px, 0.7, -len / 2 + 0.3, b, 3); p.rotation.x = -0.18; });
  rbox(w + 0.2, 1.15, 0.1, 0.03, texMat(woodTex(256, 128, '#5a3a1e', 8), { roughness: 0.55 }), 0, 0.78, -len / 2 - 0.06, b);
  return b;
}
function nightstand(parent, x, z, ry = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g); rbox(0.5, 0.55, 0.45, 0.02, texMat(woodTex(128, 128, '#4a2e18', 4), { roughness: 0.55 }), 0, 0.275, 0, g); rbox(0.36, 0.14, 0.02, 0.01, std({ color: 0x3a2214 }), 0, 0.33, 0.226, g); cyl(0.025, 0.025, 0.02, brass, 0, 0.33, 0.24, g, 10).rotation.x = Math.PI / 2; return g; }
function wallAC(parent, x, y, z, ry) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); rbox(0.8, 0.45, 0.3, 0.03, texMat(acTex(), { roughness: 0.7 }), 0, 0, 0.15, g); return g; }
function smokePuffs(parent, x, y, z, n = 10, col = 0xbbbbbb, spread = 0.1, rise = 0.8, size = 0.3) {
  const arr = []; for (let i = 0; i < n; i++) { const s = glow(col, size, 0.0); s.material.blending = THREE.NormalBlending; parent.add(s); arr.push({ s, t: i / n }); }
  return (dt) => arr.forEach((p) => { p.t += dt * 0.25; if (p.t > 1) p.t = 0; const k = p.t; p.s.position.set(x + Math.sin(k * 9 + p.t * 3) * spread * k * 3, y + k * rise, z + Math.cos(k * 7) * spread * k * 2); p.s.material.opacity = Math.sin(k * Math.PI) * 0.16; p.s.scale.setScalar(size * (0.5 + k * 1.8)); });
}
function staticTex() { const [c, g] = cnv(96, 72); const t = toTex(c); t.userData = { g, c }; return t; }
function drawStatic(t) { const { g } = t.userData; const im = g.createImageData(96, 72); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); t.needsUpdate = true; }
function crtTV(parent, x, y, z, ry, w = 0.9, aspect = 1 / 0.78) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); const h = w * 0.78, d = w * 0.7;
  rbox(w, h, d, 0.06, texMat(woodTex(256, 128, '#4a2e1a', 6), { roughness: 0.5 }), 0, 0, 0, g, 3);
  rbox(w * 0.84, h * 0.84, 0.03, 0.03, std({ color: 0x15120f, roughness: 0.3 }), -0.02 * w, 0, d / 2, g, 2);
  const scr = new THREE.Mesh(new THREE.SphereGeometry(w * 1.6, 32, 24, 0, 0.5, 1.3, 0.4), basic({ color: 0x0a0a0a })); // slightly convex screen
  scr.position.set(-0.02 * w, 0, d / 2 - w * 1.6 + 0.07); scr.rotation.y = -0.25; scr.scale.set(1, 0.85, 1); g.add(scr);
  const sq = quad(w * 0.72, (w * 0.72) / aspect, basic({ color: 0x0a0a0a }), -0.02 * w, 0, d / 2 + 0.02, g); // the picture plane sits just in front
  cyl(0.03, 0.03, 0.05, brass, w * 0.37, -h * 0.25, d / 2 + 0.01, g, 12).rotation.x = Math.PI / 2; cyl(0.03, 0.03, 0.05, brass, w * 0.37, -h * 0.05, d / 2 + 0.01, g, 12).rotation.x = Math.PI / 2;
  [[0.15, 0.4], [-0.15, -0.35]].forEach(([ax, rz]) => { const a = cyl(0.008, 0.008, 0.7, chromeM, ax * w, h / 2 + 0.3, 0, g, 6); a.rotation.z = rz; });
  return { g, screen: sq };
}
function doll(parent, x, z, ry, dress, hair, seated = false, longHair = true) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
  const skin = phys({ color: 0xf3d9c8, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.45, sheen: 0.35, sheenColor: new THREE.Color(0xffe2d2) });
  const hm = phys({ color: hair, roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.25, sheen: 0.7, sheenColor: new THREE.Color(hair).lerp(new THREE.Color(0xffffff), 0.45) });
  const dm = phys({ color: dress, roughness: 0.6, sheen: 0.6, sheenColor: new THREE.Color(dress).lerp(new THREE.Color(0xffffff), 0.5) });
  const shoe = phys({ color: 0x1a1214, roughness: 0.25, clearcoat: 1 });
  const eye = phys({ color: 0x140c18, roughness: 0.05, clearcoat: 1 }), white = basic({ color: 0xffffff }), lip = phys({ color: 0xc8304e, roughness: 0.3, clearcoat: 0.8 });
  const cap = (r, len, mat, px, py, pz, rx = 0, rz = 0) => { const c = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat); c.position.set(px, py, pz); c.rotation.set(rx, 0, rz); g.add(c); return c; };
  const hipY = seated ? 0.6 : 0.84;
  // torso + skirt
  const torso = lathe([[0, 0], [0.13, 0], [0.135, 0.08], [0.105, 0.2], [0.125, 0.31], [0.115, 0.38], [0.06, 0.45], [0, 0.45]], dm, 0, hipY, 0, g, 28); torso.scale.z = 0.72;
  const skirt = lathe(seated ? [[0, 0], [0.14, 0], [0.2, -0.1], [0, -0.1]] : [[0, 0], [0.135, 0], [0.22, -0.26], [0.235, -0.3], [0, -0.3]], dm, 0, hipY + 0.05, 0, g, 28); skirt.scale.z = 0.8;
  // neck, head, face
  cyl(0.03, 0.035, 0.08, skin, 0, hipY + 0.49, 0, g, 14);
  const hy = hipY + 0.6; const head = sph(0.093, skin, 0, hy, 0, g, 32); head.scale.set(0.9, 1.08, 0.96);
  [-0.034, 0.034].forEach((ex) => { const e = sph(0.021, eye, ex, hy + 0.005, 0.078, g, 16); e.scale.set(1, 1.25, 0.45); const hl = sph(0.006, white, ex + 0.006, hy + 0.014, 0.087, g, 6); hl.userData.noCast = true; });
  const lp = sph(0.014, lip, 0, hy - 0.052, 0.083, g, 12); lp.scale.set(1.5, 0.55, 0.6);
  // hair: cap, fringe, long back
  const hc = sph(0.102, hm, 0, hy + 0.018, -0.012, g, 32); hc.scale.set(0.95, 1.05, 1.02);
  const fringe = rbox(0.16, 0.05, 0.05, 0.022, hm, 0, hy + 0.06, 0.07, g, 3); fringe.rotation.x = -0.35;
  if (longHair) { const lh = lathe([[0, 0], [0.095, 0], [0.115, -0.18], [0.11, -0.34], [0.09, -0.4], [0, -0.4]], hm, 0, hy, -0.035, g, 24); lh.scale.z = 0.62; }
  // arms
  [-1, 1].forEach((sd) => {
    const sx = sd * 0.15, sy = hipY + 0.39;
    if (seated) { cap(0.026, 0.2, skin, sx, sy - 0.12, 0.0, 0, sd * 0.12); cap(0.022, 0.18, skin, sx * 0.85, sy - 0.27, 0.1, Math.PI / 2 - 0.2, 0); sph(0.026, skin, sx * 0.75, sy - 0.29, 0.2, g, 12); }
    else { cap(0.026, 0.2, skin, sx + sd * 0.01, sy - 0.12, 0, 0, sd * 0.1); cap(0.022, 0.19, skin, sx + sd * 0.03, sy - 0.34, 0.03, -0.15, sd * 0.05); sph(0.027, skin, sx + sd * 0.035, sy - 0.47, 0.05, g, 12); }
  });
  // legs
  [-0.07, 0.07].forEach((lx) => {
    if (seated) { cap(0.05, 0.3, skin, lx, hipY + 0.01, 0.17, Math.PI / 2, 0); cap(0.037, 0.34, skin, lx, hipY - 0.22, 0.34, 0, 0); const sh = rbox(0.075, 0.06, 0.15, 0.025, shoe, lx, 0.04 + hipY - 0.6, 0.38, g, 2); }
    else { cap(0.05, 0.32, skin, lx, hipY - 0.22, 0, 0, lx > 0 ? -0.03 : 0.03); cap(0.037, 0.32, skin, lx, hipY - 0.6, 0.0, 0, 0); rbox(0.075, 0.06, 0.15, 0.025, shoe, lx, 0.035, 0.03, g, 2); }
  });
  g.traverse((o) => { if (o.isMesh && !o.userData.noCast) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* ================= LOBBY ================= */
export function buildLobby(ctx) {
  const { logoTex, tvVideo } = ctx;
  const s = new THREE.Scene(); s.background = new THREE.Color(0x0a0706); s.environment = ctx.envTex; const up = [];
  const w = 10, d = 7.5, h = 3.1;
  shell(s, { w, d, h, wall: wallpaperTex(1400, 434, { bg: '#1f4744', fg: '#d9b25c', kind: 'atomic', scale: 70, wainscot: { col: '#5a3820', frac: 0.36 }, ghost: [0.08, 0.18, 0.12, 0.22] }), wallSide: wallpaperTex(1050, 434, { bg: '#1f4744', fg: '#d9b25c', kind: 'atomic', scale: 70, wainscot: { col: '#5a3820', frac: 0.36 } }), floor: carpetTex(['#8a5a1e', '#c4862e', '#4a2a12'], 'circles', [6, 4.5]), ceil: ceilingTex([5, 3.75]) });
  s.add(new THREE.HemisphereLight(0xffe0bc, 0x3a2416, 0.38));
  keyLight(s, 0.4, h - 0.1, -0.5, 0xfff0dc, 22, 1.15, 0.4, -1.5);
  // fluorescent fixture (steady, with the faintest breathing)
  const fx = rbox(1.5, 0.08, 0.3, 0.02, cream, 0.6, h - 0.05, -1.2, s); const tube = box(1.3, 0.04, 0.16, basic({ color: 0xeaffea }), 0.6, h - 0.1, -1.2, s); tube.userData.noCast = true;
  const tubeL = new THREE.PointLight(0xe8ffe6, 6, 9, 1.4); tubeL.position.set(0.6, h - 0.3, -1.0); s.add(tubeL);
  up.push((dt, t) => { const on = (Math.sin(t * 0.23) > 0.995 && Math.random() < 0.3) ? 0.6 : 1; tubeL.intensity = 6 * on; tube.material.color.setScalar(on); });
  // front desk
  const deskWood = texMat(woodTex(512, 256, '#6a4222', 18, [1, 1]), { roughness: 0.5 });
  const deskFront = (() => { const [c, g] = cnv(512, 128); g.drawImage(deskWood.map.image, 0, 0, 512, 128); g.fillStyle = '#c9a24a'; g.font = '46px "Bebas Neue"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 4; g.fillText('R E G I S T R A T I O N', 256, 60); return toTex(c); })();
  const desk = new THREE.Group(); desk.position.set(0.6, 0, -1.7); s.add(desk);
  rbox(4.4, 1.08, 0.75, 0.03, deskWood, 0, 0.54, 0, desk); quad(4.3, 1.0, std({ map: deskFront, roughness: 0.5 }), 0, 0.54, 0.38, desk);
  rbox(4.6, 0.07, 0.9, 0.03, phys({ color: 0xc7b28c, roughness: 0.3, clearcoat: 0.6 }), 0, 1.115, 0, desk);
  const bell = sph(0.09, brass, 1.1, 1.17, 0.18, desk, 24); bell.scale.y = 0.7; cyl(0.11, 0.11, 0.025, darkM, 1.1, 1.16, 0.18, desk, 24); const plunger = cyl(0.012, 0.012, 0.05, brass, 1.1, 1.24, 0.18, desk, 8);
  bell.userData.ding = true; plunger.userData.noBatch = true; plunger.userData.y0 = plunger.position.y;
  const bellHit = sph(0.26, basic({ color: 0xffffff }), 1.1, 1.22, 0.18, desk, 8); bellHit.visible = false; bellHit.userData.ding = true; // a bigger target than the bell itself, for thumbs
  const book = rbox(0.62, 0.04, 0.42, 0.01, std({ color: 0xf0e8d4 }), -0.5, 1.17, 0.12, desk); book.rotation.y = 0.15; rbox(0.015, 0.045, 0.42, 0.005, std({ color: 0x7a2020 }), -0.5, 1.175, 0.12, desk).rotation.y = 0.15;
  cyl(0.012, 0.012, 0.14, darkM, -0.3, 1.19, 0.2, desk, 8).rotation.set(0.4, 0, 0.6);
  lampMini(desk, -1.9, 1.15, -0.15, 0x2f6a3a, 0xffc070, 4);
  const [nc2, ng2] = cnv(256, 80); ng2.fillStyle = '#efe6cf'; ng2.fillRect(0, 0, 256, 80); ng2.fillStyle = '#222'; ng2.font = '40px "Bebas Neue"'; ng2.textAlign = 'center'; ng2.textBaseline = 'middle'; ng2.fillText('NO REFUNDS', 128, 30); ng2.font = 'bold 13px "Courier Prime"'; ng2.fillText('(SPIRITUAL OR OTHERWISE)', 128, 62);
  const plac = quad(0.42, 0.13, std({ map: toTex(nc2) }), -1.2, 1.21, 0.36, desk); plac.rotation.x = -0.35;
  // key rack with hooks and fobs
  rbox(2.0, 1.0, 0.06, 0.02, texMat(woodTex(256, 128, '#4a2c18', 6), { roughness: 0.6 }), 0.6, 1.5, -d / 2 + 0.04, s);
  [0xff5fa8, 0xff8a1f, 0x5cff7a, 0x6b6458, 0xff2a2a, 0xe9b54d].forEach((col, i) => { const x = -0.1 + i * 0.28; const hk = cyl(0.008, 0.008, 0.06, chromeM, x, 1.8, -d / 2 + 0.09, s, 6); hk.rotation.x = Math.PI / 2; if (i === 3) return; const f = rbox(0.1, 0.24, 0.015, 0.02, phys({ color: col, roughness: 0.4, clearcoat: 0.5 }), x, 1.61, -d / 2 + 0.1, s); f.rotation.z = 0.03 * (i - 2); cyl(0.004, 0.004, 0.1, chromeM, x, 1.74, -d / 2 + 0.1, s, 6); });
  // neon logo
  const ll = quad(1.9, 1.9 / 1.915, basic({ map: logoTex, transparent: true, depthWrite: false, color: new THREE.Color(1.5, 1.5, 1.5) }), 0.6, 2.47, -d / 2 + 0.05, s); ll.userData.noCast = true;
  const llL = new THREE.PointLight(0x9a7cff, 7, 6, 1.6); llL.position.set(0.6, 2.45, -d / 2 + 0.8); s.add(llL);
  frame(1.2, 0.98, ctx.postcardTex || paintingTex('asteroid'), s, -2.6, 1.85, -d / 2 + 0.05, 0);
  // TV in the corner on a bracket
  const tv = crtTV(s, -3.85, 2.25, -2.9, 0.65, 1.0, 466 / 352);
  const vtex = new THREE.VideoTexture(tvVideo); vtex.colorSpace = THREE.SRGBColorSpace; vtex.repeat.set(466 / 640, 352 / 360); vtex.offset.set(86 / 640, 4 / 360);
  const stTex = staticTex(); drawStatic(stTex); tv.screen.material = basic({ map: stTex });
  rbox(0.1, 0.1, 0.7, 0.02, darkM, 0, -0.5, -0.5, tv.g);
  const tvL = new THREE.PointLight(0x8fb4ff, 6, 5, 1.6); tvL.position.set(0, 0, 0.9); tv.g.add(tvL); const tvGlow = glow(0x8fb4ff, 1.8, 0.3); tvGlow.position.set(0, 0, 0.5); tv.g.add(tvGlow);
  tv.g.traverse((o) => { if (o.isMesh) o.userData.go = 'tv'; });
  up.push((dt, t) => { if (tvVideo.readyState >= 2 && !tvVideo.paused) { if (tv.screen.material.map !== vtex) { tv.screen.material.map = vtex; tv.screen.material.needsUpdate = true; } } else if (Math.floor(t * 20) % 2) drawStatic(stTex); tvL.intensity = 5 + Math.sin(t * 13) * 0.8 + Math.random() * 0.6; });
  // couch, side table, plant, rug
  const couch = new THREE.Group(); couch.position.set(4.3, 0, 0.6); couch.rotation.y = -Math.PI / 2; s.add(couch); const vinyl = phys({ color: 0xc8611e, roughness: 0.4, clearcoat: 0.5 });
  rbox(2.4, 0.42, 0.85, 0.12, vinyl, 0, 0.3, 0, couch); rbox(2.4, 0.6, 0.22, 0.1, vinyl, 0, 0.72, -0.35, couch); rbox(0.2, 0.55, 0.85, 0.08, vinyl, -1.2, 0.42, 0, couch); rbox(0.2, 0.55, 0.85, 0.08, vinyl, 1.2, 0.42, 0, couch);
  [-0.6, 0.6].forEach((x) => rbox(1.1, 0.14, 0.7, 0.07, phys({ color: 0xd8742e, roughness: 0.4, clearcoat: 0.4 }), x, 0.56, 0.04, couch));
  [[-1.0, 0.3], [1.0, 0.3], [-1.0, -0.3], [1.0, -0.3]].forEach(([a, b]) => cyl(0.025, 0.02, 0.14, brass, a, 0.06, b, couch, 8));
  rbox(0.6, 0.55, 0.6, 0.02, texMat(woodTex(128, 128, '#4a2e18', 4), { roughness: 0.55 }), 4.4, 0.275, 2.4, s); lampMini(s, 4.4, 0.55, 2.4, 0xe8d8b0, 0xffb060, 5);
  plant(s, -2.2, 0, -3.0, 1.1);
  // window to space on the left wall, blinds half up
  const [wc, wg] = cnv(512, 300); wg.fillStyle = '#07051a'; wg.fillRect(0, 0, 512, 300); for (let i = 0; i < 200; i++) { wg.fillStyle = `rgba(255,255,255,${R(0.3, 1)})`; wg.fillRect(R(0, 512), R(0, 300), 1.6, 1.6); }
  blotch(wg, 380, 120, 120, 'rgba(160,90,200,A)', 0.4); wg.fillStyle = '#a7a39c'; wg.beginPath(); wg.arc(390, 110, 52, 0, 7); wg.fill(); for (let i = 0; i < 12; i++) { wg.fillStyle = 'rgba(60,55,60,.5)'; wg.beginPath(); wg.arc(390 + R(-40, 40), 110 + R(-40, 40), R(3, 9), 0, 7); wg.fill(); }
  for (let y = 0; y < 130; y += 11) { wg.fillStyle = 'rgba(210,200,180,.95)'; wg.fillRect(0, y, 512, 7); }
  const win = quad(2.4, 1.4, basic({ map: toTex(wc), color: 0xcccccc }), -w / 2 + 0.02, 1.75, 0.6, s); win.rotation.y = Math.PI / 2; win.userData.noCast = true;
  const M2 = new Merger(s); [[0, 0.72, 2.5, 0.08], [0, -0.72, 2.5, 0.08], [1.22, 0, 0.08, 1.52], [-1.22, 0, 0.08, 1.52]].forEach(([dz, dy, lw, lh]) => M2.box(0.08, lh, lw, cream, -w / 2 + 0.05, 1.75 + dy, 0.6 + dz)); M2.build();
  // ceiling fan
  const fan = new THREE.Group(); fan.position.set(-0.8, h - 0.35, 0.8); s.add(fan); cyl(0.02, 0.02, 0.35, brass, 0, 0.17, 0, fan, 8); lathe([[0, 0], [0.14, 0], [0.12, 0.14], [0.05, 0.16], [0, 0.16]], brass, 0, -0.08, 0, fan, 24);
  for (let i = 0; i < 4; i++) { const b = rbox(0.75, 0.015, 0.14, 0.01, texMat(woodTex(64, 32, '#5a3a1e', 2), { roughness: 0.5 }), 0, 0, 0, null, 1); const piv = new THREE.Group(); piv.rotation.y = i * Math.PI / 2; b.position.x = 0.48; b.rotation.x = 0.12; piv.add(b); fan.add(piv); }
  up.push((dt) => (fan.rotation.y += dt * 2.2));
  // a NO SMOKING stanchion by the door and a key-drop pedestal at the end of the desk
  const lfx = {}, ldyn = [];
  { const piv = new THREE.Group(); piv.position.set(-1.95 + 0.22, 0, -0.3); s.add(piv); const mid = new THREE.Group(); mid.position.set(-0.22, 0, 0); piv.add(mid); const st = new THREE.Group(); st.rotation.y = 0.5; mid.add(st); ldyn.push(piv);
    cyl(0.2, 0.22, 0.05, chromeM, 0, 0.025, 0, st, 28); cyl(0.016, 0.016, 1.25, chromeM, 0, 0.67, 0, st, 10); rbox(0.38, 0.27, 0.03, 0.01, chromeM, 0, 1.4, 0, st, 1);
    const [nc, ng] = cnv(256, 180); ng.fillStyle = '#f2ece0'; ng.fillRect(0, 0, 256, 180); ng.fillStyle = '#1a1416'; ng.font = '44px "Bebas Neue"'; ng.textAlign = 'center'; ng.textBaseline = 'middle'; ng.fillText('NO SMOKING', 128, 148);
    ng.fillStyle = '#d8d2c4'; ng.fillRect(72, 66, 96, 16); ng.fillStyle = '#c87a3a'; ng.fillRect(148, 66, 20, 16); ng.strokeStyle = '#c0182a'; ng.lineWidth = 9; ng.beginPath(); ng.arc(128, 74, 50, 0, 7); ng.stroke(); ng.beginPath(); ng.moveTo(93, 39); ng.lineTo(163, 109); ng.stroke(); grime(ng, 256, 180, 0.25);
    const nt = toTex(nc); [0.017, -0.017].forEach((z, i) => { const q = quad(0.34, 0.24, std({ map: nt, roughness: 0.5 }), 0, 1.4, z, st); if (i) q.rotation.y = Math.PI; });
    const hitM = basic({ color: 0xffffff }); [[0.46, 0.34, 0.12, 1.4], [0.12, 1.2, 0.12, 0.66], [0.46, 0.08, 0.46, 0.04]].forEach(([bw, bh, bd, by]) => { const sh = box(bw, bh, bd, hitM, 0, by, 0, st); sh.visible = false; sh.userData.lobby = 'smoke'; });
    // tap: it rocks on its base. Tap again while it's still rocking: over it goes, to the right. Tap it lying down: stood back up
    let wobT = 0, last = -9, mode = 'up', th = 0, om = 0, bounces = 0, rise = 0; const TF = -1.42;
    lfx.smoke = () => { const now = performance.now() / 1000;
      if (mode === 'down') { mode = 'rising'; rise = 0; return; }
      if (mode !== 'up') return;
      if (wobT > 0 && now - last < 1.6) { mode = 'falling'; wobT = 0; om = -0.9; bounces = 0; mid.rotation.z = 0; return; }
      last = now; wobT = 1.7; ctx.sfx && ctx.sfx('wobble', 0.55); };
    up.push((dt) => { const d = Math.min(dt, 0.05);
      if (wobT > 0) { wobT = Math.max(0, wobT - d); const k = 1.7 - wobT; mid.rotation.z = 0.085 * Math.exp(-k * 2.2) * Math.sin(k * 13); }
      if (mode === 'falling') { om -= 11 * Math.sin(Math.abs(th) + 0.06) * d; th += om * d; if (th <= TF) { th = TF; if (bounces++ < 2 && Math.abs(om) > 0.6) { om = -om * 0.22; if (bounces === 1) ctx.sfx && ctx.sfx('thud'); } else { mode = 'down'; om = 0; } } piv.rotation.z = th; }
      if (mode === 'rising') { rise = Math.min(1, rise + d / 0.7); const e = rise * rise * (3 - 2 * rise); th = TF * (1 - e); piv.rotation.z = th; if (rise >= 1) { th = 0; mode = 'up'; wobT = 0.9; last = -9; ctx.sfx && ctx.sfx('wobble', 0.35); } } }); }
  { const kd = new THREE.Group(); kd.position.set(-2.25, 0, -1.5); kd.rotation.y = 0.45; s.add(kd); const kh = box(0.38, 1.18, 0.36, basic({ color: 0xffffff }), 0, 0.59, 0, kd); kh.visible = false; kh.userData.lobby = 'keys';
    // a room key on a brass fob drops into the slot
    const key = new THREE.Group(); key.visible = false; kd.add(key); ldyn.push(key); const kb = phys({ color: 0xd8b25a, roughness: 0.25, metalness: 0.95 }); torus(0.018, 0.005, kb, 0, 0.07, 0, key, 16); box(0.008, 0.07, 0.003, kb, 0, 0.025, 0, key); box(0.012, 0.006, 0.003, kb, 0.008, 0.0, 0, key); box(0.01, 0.006, 0.003, kb, 0.007, 0.014, 0, key); rbox(0.035, 0.07, 0.01, 0.008, phys({ color: 0xc8202a, roughness: 0.4, clearcoat: 0.6 }), 0, 0.12, 0, key, 2);
    let kt = -1, kc2 = false; lfx.keys = () => { if (kt >= 0) return; kt = 0; kc2 = false; key.visible = true; };
    up.push((dt) => { if (kt < 0) return; kt += Math.min(dt, 0.05); const k = Math.min(1, kt / 0.42); key.position.set(0, 1.32 - 0.24 * k * k, 0.2 - 0.03 * k); key.rotation.x = -0.25 * k; if (kt > 0.36 && !kc2) { kc2 = true; ctx.sfx && ctx.sfx('clink', 0.9); } if (kt > 0.5) { key.visible = false; kt = -1; } });
    rbox(0.32, 0.92, 0.32, 0.02, texMat(woodTex(128, 256, '#4a2e18', 3), { roughness: 0.5 }), 0, 0.46, 0, kd, 2); rbox(0.38, 0.24, 0.34, 0.03, brass, 0, 1.04, 0, kd, 2);
    box(0.2, 0.02, 0.02, darkM, 0, 1.1, 0.171, kd); const [kc, kg] = cnv(128, 40); kg.fillStyle = '#2a2016'; kg.fillRect(0, 0, 128, 40); kg.fillStyle = '#e6c26a'; kg.font = '28px "Bebas Neue"'; kg.textAlign = 'center'; kg.textBaseline = 'middle'; kg.fillText('KEY DROP', 64, 22); quad(0.2, 0.06, basic({ map: toTex(kc) }), 0, 0.99, 0.172, kd); }
  // about-us letter board on a brass easel
  const board = aboutBoard(s);
  // dust in the light
  const dust = []; for (let i = 0; i < 40; i++) { const p = sph(0.006, basic({ color: 0xfff0d0, transparent: true, opacity: 0.5 }), R(-3, 3), R(0.5, 2.8), R(-3, 2), s, 4); p.userData.noCast = true; dust.push(p); }
  up.push((dt, t) => dust.forEach((p, i) => { p.position.y += Math.sin(t * 0.5 + i) * 0.0015; p.position.x += Math.cos(t * 0.3 + i) * 0.001; }));
  const hot = []; s.traverse((o) => { if (o.isMesh && (o.userData.go || o.userData.ding || o.userData.lobby)) hot.push(o); });
  return { scene: s, up, hot, plunger, fx: lfx, dyn: ldyn, views: { board, lobby: { pos: new THREE.Vector3(0.1, 1.6, 3.7), target: new THREE.Vector3(1.0, 1.3, -2.4), p: { pos: new THREE.Vector3(0.6, 1.72, 2.9), target: new THREE.Vector3(0.72, 1.22, -2.0), minH: 42, base: 64 } }, tv: { pos: new THREE.Vector3(-2.3, 1.95, -0.6), target: new THREE.Vector3(-3.85, 2.2, -2.9) } } };
}
function aboutBoard(s) {
  const W = 1024, H = 1300; const [c, g] = cnv(W, H);
  g.fillStyle = '#141216'; g.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 13) { g.fillStyle = 'rgba(255,255,255,.035)'; g.fillRect(0, y, W, 2); }
  g.strokeStyle = '#6a4222'; g.lineWidth = 34; g.strokeRect(17, 17, W - 34, H - 34);
  const paras = [['ABOUT US', 1.7], ['MOTEL ZERO STRIVES TO CREATE INNOVATIVE CONTENT AND PRODUCTS THAT ARE SOCIALLY AND ENVIRONMENTALLY CONSCIOUS.', 1], ["RANGING FROM IRONIC MUSICALS TO MINDFULNESS-LED VIDEO GAMES, M0 PROJECTS AREN'T TIED TO ANY SINGULAR FORMAT, ONLY TO AN ETHOS OF COMPASSION AND THOUGHTFUL ENGAGEMENT.", 1], ['CO-FOUNDED BY JACQUE RABIE AND TEGAN SLATTERY IN 2022.', 1], ['CREATED IN LOS ANGELES, CALIFORNIA, ON EARTH.', 1]];
  const layout = (base) => { const lines = []; for (const [txt, k] of paras) { const size = base * k; g.font = `${size}px "Bebas Neue"`; let ln = ''; for (const wd of txt.split(' ')) { const t = ln ? ln + ' ' + wd : wd; if (g.measureText(t).width > W - 170) { lines.push([ln, size]); ln = wd; } else ln = t; } if (ln) lines.push([ln, size]); lines.push(['', base * 0.45]); } lines.pop(); return lines; };
  let base = 56, lines = layout(base); const total = (ls) => ls.reduce((a, [, sz]) => a + sz * 1.12, 0);
  while (total(lines) > H - 170 && base > 24) { base -= 2; lines = layout(base); }
  let y = (H - total(lines)) / 2; g.textAlign = 'center'; g.textBaseline = 'top';
  for (const [ln, size] of lines) { g.font = `${size}px "Bebas Neue"`; let x = W / 2 - g.measureText(ln).width / 2; for (const ch of ln) { const cw = g.measureText(ch).width; g.save(); g.translate(x + cw / 2, y + R(-1.5, 1.5)); g.rotate(R(-0.025, 0.025)); g.fillStyle = `rgba(245,240,230,${R(0.85, 1)})`; g.fillText(ch, 0, 0); g.restore(); x += cw; } y += size * 1.12; }
  const brd = new THREE.Group(); brd.position.set(4.3, 0, -1.95); brd.rotation.y = -0.9; s.add(brd);
  [-0.72, 0.72].forEach((x) => { const l = cyl(0.022, 0.022, 2.4, brass, x, 1.15, -0.04, brd, 10); l.rotation.x = -0.05; }); const bl = cyl(0.022, 0.022, 2.0, brass, 0, 1.0, -0.4, brd, 10); bl.rotation.x = 0.25;
  rbox(1.62, 2.06, 0.06, 0.015, texMat(woodTex(128, 256, '#5a3820', 2), { roughness: 0.5 }), 0, 1.45, 0.05, brd, 2);
  quad(1.5, 1.5 * H / W, std({ map: toTex(c), roughness: 0.9 }), 0, 1.45, 0.085, brd);
  const bL = new THREE.SpotLight(0xfff0d8, 16, 7, 0.5, 0.6, 1.4); bL.position.set(2.6, 3.0, 0.0); bL.target.position.set(4.3, 1.45, -1.95); s.add(bL, bL.target);
  brd.traverse((o) => { if (o.isMesh) o.userData.go = 'board'; });
  // close-up view straight onto the board
  brd.updateMatrixWorld(true); const c0 = new THREE.Vector3(0, 1.45, 0.09).applyMatrix4(brd.matrixWorld), nrm = new THREE.Vector3(Math.sin(-0.9), 0, Math.cos(-0.9));
  const xa = new THREE.Vector3(Math.cos(-0.9), 0, -Math.sin(-0.9));
  return { pos: c0.clone().addScaledVector(nrm, 2.1).add(new THREE.Vector3(0, 0.15, 0)), target: c0.clone(), p: { pos: c0.clone().addScaledVector(nrm, 2.5).addScaledVector(xa, 0.35).add(new THREE.Vector3(0, 0.3, 0)), target: c0.clone().add(new THREE.Vector3(0, -0.08, 0)) } };
}

/* ================= ROOMS ================= */
function makeMountain(rad, hgt) {
  const rings = 56, segs = 120, pos = [], col = [], idx = [];
  const ridge = (x, z) => { let s = 0, a = 0.5, f = 1; for (let o = 0; o < 5; o++) { const n = 1 - Math.abs(2 * vnoise(x * f * 3.1 + 11, 0.5, z * f * 3.1) - 1); s += a * n * n; f *= 2.1; a *= 0.5; } return s; };
  for (let i = 0; i <= rings; i++) for (let j = 0; j <= segs; j++) {
    const rr = i / rings, th = (j / segs) * Math.PI * 2; const x = Math.cos(th) * rr * rad, z = Math.sin(th) * rr * rad;
    const core = Math.pow(1 - rr, 1.75), rg = ridge(x, z);
    let y = hgt * (core * 0.8 + rg * 0.42 * Math.pow(1 - rr, 0.9) * Math.min(1, rr * 3 + 0.25)) - (rr > 0.97 ? (rr - 0.97) * 2 : 0);
    if (rr === 1) y = 0; pos.push(x, y, z);
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < segs; j++) { const a = i * (segs + 1) + j, b = a + segs + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const nrm = geo.attributes.normal, P = geo.attributes.position, c = new THREE.Color();
  for (let i = 0; i < P.count; i++) {
    const y = P.getY(i) / hgt, slope = nrm.getY(i), n = vnoise(P.getX(i) * 9, P.getY(i) * 9, P.getZ(i) * 9);
    const snow = clamp((y - 0.5 + (n - 0.5) * 0.3) * 6, 0, 1) * clamp((slope - 0.3) * 3.5, 0, 1);
    c.setRGB(0.07 + n * 0.05, 0.07 + n * 0.05, 0.085 + n * 0.05); c.lerp(new THREE.Color(0.8, 0.82, 0.88), snow); col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const mesh = new THREE.Mesh(geo, std({ vertexColors: true, roughness: 0.9 })); mesh.castShadow = mesh.receiveShadow = true; return mesh;
}

const cornerView = (w, d, h, tx, ty, tz) => ({ pos: new THREE.Vector3(-(w / 2 - 0.55), h - 0.26, d / 2 - 0.5), target: new THREE.Vector3(tx, ty, tz), corner: true });
function roomBase(s, o) { s.background = new THREE.Color(0x050304); s.environment = o.envTex; shell(s, o); s.add(new THREE.HemisphereLight(o.hemi ?? 0xffe0d0, 0x201418, o.hemiI ?? 0.3)); }

export function buildHyodo(ctx) {
  const s = new THREE.Scene(); const up = []; const w = 6.2, d = 5.4, h = 2.7;
  roomBase(s, { envTex: ctx.envTex, w, d, h, wall: wallpaperTex(900, 392, { bg: '#c9748e', fg: '#8a1f4a', fg2: '#ffe8a0', kind: 'floral', scale: 46 }), floor: carpetTex(['#c9c27a', '#4a6a3a'], 'tatami', [3, 3]), ceil: ceilingTex([3, 3], false), hemi: 0xffd0e0, hemiI: 0.2, trim: std({ color: 0x6a3a2a, roughness: 0.6 }) });
  keyLight(s, 0.8, h - 0.1, 0.6, 0xffe6ee, 12, 1.0, 0, -1.4);
  const pink = new THREE.PointLight(0xff4f9e, 5, 9, 1.4); pink.position.set(0, 2.3, -0.5); s.add(pink);
  // paper lantern
  const lan = lathe([[0, -0.3], [0.2, -0.3], [0.3, -0.1], [0.3, 0.1], [0.2, 0.3], [0, 0.3]], std({ color: 0xff3a3a, emissive: 0xff2020, emissiveIntensity: 0.9, side: THREE.DoubleSide }), -1.4, 2.15, -1.3, s, 24); lan.userData.noCast = true;
  for (let i = -2; i <= 2; i++) torus(0.3 * Math.cos(i * 0.32) + 0.005, 0.006, std({ color: 0x701010 }), -1.4, 2.15 + i * 0.12, -1.3, s, 32).rotation.x = Math.PI / 2;
  cyl(0.004, 0.004, 0.25, darkM, -1.4, 2.58, -1.3, s, 6);
  const lanL = new THREE.PointLight(0xff5040, 6, 5, 1.6); lanL.position.set(-1.4, 2.15, -1.3); s.add(lanL); const lg = glow(0xff4040, 1.6, 0.5); lg.position.copy(lanL.position); s.add(lg);
  // pink velvet couch with seated dolls
  const velvet = std({ color: 0xd04a86, roughness: 0.95 });
  const couch = new THREE.Group(); couch.position.set(-0.4, 0, -2.1); s.add(couch);
  rbox(2.6, 0.42, 0.8, 0.1, velvet, 0, 0.22, 0, couch); rbox(2.6, 0.62, 0.2, 0.08, velvet, 0, 0.64, -0.35, couch); rbox(0.2, 0.5, 0.8, 0.07, velvet, -1.3, 0.35, 0, couch); rbox(0.2, 0.5, 0.8, 0.07, velvet, 1.3, 0.35, 0, couch);
  [-0.85, 0, 0.85].forEach((x) => rbox(0.8, 0.12, 0.72, 0.06, velvet, x, 0.49, 0.02, couch));
  const dresses = [0xffffff, 0x2a2a6a, 0xff9ec4, 0xe8d040, 0x8a2a4a, 0x40a0c0, 0x1a1a1a, 0xf07040, 0xc0a0ff, 0xe0e0e0, 0x3a7a4a, 0xff5050];
  const hairs = [0x1a1210, 0x3a2414, 0xe8c070, 0xff7ab0, 0x6a8aff, 0x1a1210, 0xc04020, 0xeaeaea, 0x1a1210];
  [-1.2, -0.5, 0.2].forEach((x, i) => { const d = doll(s, x, -2.22, 0, dresses[i], hairs[i], true); d.position.y = -0.04; });
  for (let i = 0; i < 5; i++) doll(s, -2.75, -1.9 + i * 0.62, Math.PI / 2 + R(-0.2, 0.2), dresses[(i + 3) % 12], hairs[(i + 2) % 9], false, rnd() < 0.7);
  for (let i = 0; i < 4; i++) doll(s, 2.75, -1.7 + i * 0.62, -Math.PI / 2 + R(-0.2, 0.2), dresses[(i + 7) % 12], hairs[(i + 5) % 9], false, rnd() < 0.7);
  const dt1 = doll(s, 1.2, -0.75, -1.9, 0xffe0f0, 0x1a1210, true); dt1.position.y = -0.12;
  // low table with tea + sake
  const lac = phys({ color: 0x5a2a18, roughness: 0.25, clearcoat: 1 });
  rbox(1.0, 0.06, 0.7, 0.02, lac, 0.3, 0.36, -0.6, s); [[-0.4, -0.28], [0.4, -0.28], [-0.4, 0.28], [0.4, 0.28]].forEach(([a, b]) => rbox(0.05, 0.33, 0.05, 0.01, lac, 0.3 + a, 0.165, -0.6 + b, s));
  lathe([[0, 0], [0.05, 0], [0.06, 0.16], [0.04, 0.2], [0.02, 0.22], [0.02, 0.3], [0, 0.3]], phys({ color: 0xe8e0d0, roughness: 0.3, clearcoat: 0.5 }), 0.15, 0.39, -0.55, s, 24);
  [0.4, 0.52].forEach((x) => lathe([[0, 0], [0.03, 0], [0.035, 0.05], [0, 0.05]], phys({ color: 0xe8e0d0, roughness: 0.3 }), x, 0.39, -0.65, s, 16));
  rbox(0.5, 0.45, 0.5, 0.12, std({ color: 0x8a2a4a, roughness: 0.95 }), 1.2, 0.225, -0.75, s);
  // fairy lights across the ceiling
  const fcols = [0xff7ab0, 0xfff0a0, 0x8af0ff, 0xc0a0ff];
  for (let k = 0; k < 2; k++) for (let i = 0; i <= 18; i++) { const tt = i / 18; const x = -w / 2 + 0.1 + tt * (w - 0.2); const y = h - 0.15 - Math.sin(tt * Math.PI) * 0.35 - k * 0.1; const z = -1.6 + k * 1.4; const b = sph(0.022, basic({ color: fcols[i % 4] }), x, y, z, s, 6); b.userData.noCast = true; }
  const poster = (txt, bg, fg) => { const [c, g] = cnv(160, 220); g.fillStyle = bg; g.fillRect(0, 0, 160, 220); g.fillStyle = fg; g.beginPath(); g.arc(80, 90, 46, 0, 7); g.fill(); g.font = '34px serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(txt, 80, 190); grime(g, 160, 220, 0.3); return toTex(c); };
  frame(0.5, 0.68, poster('楽園', '#2a2a6a', '#ff6fa8'), s, 1.3, 1.7, -d / 2 + 0.04, 0, 0xd8d0c0); frame(0.4, 0.55, poster('♡', '#ffd040', '#ff4040'), s, 2.1, 1.55, -d / 2 + 0.04, 0, 0xd8d0c0);
  wallAC(s, -1.8, 2.1, -d / 2 + 0.02, 0);
  return { scene: s, up, views: { room: cornerView(w, d, h, 1.1, 0.55, -1.1) } };
}

export function buildFreddie(ctx) {
  const s = new THREE.Scene(); const up = []; const w = 5.6, d = 5, h = 2.6;
  roomBase(s, { envTex: ctx.envTex, w, d, h, wall: wallpaperTex(860, 400, { bg: '#b98a4e', fg: '#6b3a12', kind: 'stripe', scale: 40, ghost: [0.6, 0.25, 0.14, 0.2] }), floor: carpetTex(['#5a3a1c', '#7a5226', '#3a2412'], 'shag', [5, 5]), ceil: ceilingTex([3, 3]), hemiI: 0.22, trim: std({ color: 0x4a2e18, roughness: 0.6 }) });
  keyLight(s, 0.6, h - 0.1, 0.4, 0xffc080, 13, 1.0, 0, -1.4);
  const spread = (() => { const [c, g] = cnv(256, 256); g.fillStyle = '#c86a1e'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 256; i += 32) { g.fillStyle = '#e8a040'; g.fillRect(i, 0, 12, 256); g.fillStyle = '#7a3a10'; g.fillRect(0, i, 256, 6); } grime(g, 256, 256, 0.5); return { map: toTex(c, [2, 2]) }; })();
  bed(s, -1.1, -1.2, 0, spread);
  nightstand(s, 0.2, -2.15); lampMini(s, 0.2, 0.55, -2.15, 0xff9a40, 0xff8a1f, 9);
  const ch = new THREE.Group(); ch.position.set(1.5, 0, 0.6); ch.rotation.y = -0.6; s.add(ch); const orange = std({ color: 0xd8701e, roughness: 0.85 });
  rbox(0.9, 0.45, 0.85, 0.1, orange, 0, 0.27, 0, ch); rbox(0.9, 0.72, 0.22, 0.09, orange, 0, 0.8, -0.35, ch); rbox(0.2, 0.55, 0.8, 0.07, orange, -0.45, 0.45, 0, ch); rbox(0.2, 0.55, 0.8, 0.07, orange, 0.45, 0.45, 0, ch);
  const tv = crtTV(s, 2.1, 0.78, -1.9, -0.4, 0.7); rbox(0.9, 0.5, 0.5, 0.02, texMat(woodTex(128, 64, '#3a2a1a', 3), { roughness: 0.6 }), 2.1, 0.25, -1.9, s);
  const st = staticTex(); tv.screen.material = basic({ map: st });
  const stL = new THREE.PointLight(0xc0d0ff, 3, 4, 1.6); stL.position.set(1.9, 0.9, -1.4); s.add(stL);
  up.push((dt, t) => { if (Math.floor(t * 20) % 2) drawStatic(st); stL.intensity = 2.5 + Math.random(); });
  lathe([[0, 0], [0.08, 0], [0.085, 0.02], [0.06, 0.03], [0, 0.03]], chromeM, 1.82, 0.69, 0.42, s, 24);
  up.push(smokePuffs(s, 1.82, 0.73, 0.42, 10, 0xcfcfcf, 0.04, 0.9, 0.18));
  // record player on a cabinet
  rbox(0.5, 0.55, 0.42, 0.02, texMat(woodTex(128, 128, '#4a2e18', 4), { roughness: 0.55 }), -2.4, 0.275, 0.5, s);
  rbox(0.5, 0.15, 0.4, 0.02, texMat(woodTex(128, 64, '#6a4222', 4), { roughness: 0.5 }), -2.4, 0.62, 0.5, s);
  const rec = cyl(0.16, 0.16, 0.008, phys({ color: 0x111111, roughness: 0.25, clearcoat: 1 }), -2.42, 0.705, 0.5, s, 32); cyl(0.05, 0.05, 0.01, basic({ color: 0xff8a1f }), -2.42, 0.708, 0.5, s, 16);
  const arm = cyl(0.006, 0.006, 0.2, chromeM, -2.3, 0.73, 0.4, s, 6); arm.rotation.set(Math.PI / 2, 0, 0.6);
  up.push((dt) => (rec.rotation.y += dt * 3.5));
  frame(0.8, 0.6, paintingTex('desert'), s, -1.1, 1.75, -d / 2 + 0.04, 0);
  wallAC(s, w / 2 - 0.02, 1.9, 0.5, -Math.PI / 2);
  return { scene: s, up, views: { room: cornerView(w, d, h, 1.0, 0.45, -0.9) } };
}

export function buildAlien(ctx) {
  const s = new THREE.Scene(); const up = []; const w = 6, d = 5.2, h = 2.7;
  roomBase(s, { envTex: ctx.envTex, w, d, h, wall: tileTex(['#e2d6c2', '#8a8070', '#c9b9a0'], [6, 3], 8, 0.7), floor: carpetTex(['#e8e6da', '#3f6a5a'], 'checker', [5, 5]), ceil: ceilingTex([3, 3]), hemi: 0xfff0e0, hemiI: 0.3, trim: std({ color: 0x3f6a5a, roughness: 0.5 }) });
  keyLight(s, -1.2, h - 0.1, 0.6, 0xffe0c0, 14, 1.0, 0, -1);
  const gl1 = new THREE.PointLight(0x3dff6a, 3, 5, 1.6); gl1.position.set(0.2, 0.9, -0.6); s.add(gl1);
  // hot tub
  const tubWood = texMat(woodTex(512, 64, '#7a5232', 28, [3, 1]), { roughness: 0.65 });
  lathe([[1.05, 0], [1.2, 0], [1.2, 0.7], [1.15, 0.74], [1.05, 0.74], [1.05, 0]], tubWood, 0.2, 0, -1.2, s, 48);
  torus(1.13, 0.07, phys({ color: 0xd8d0b8, roughness: 0.4, clearcoat: 0.4 }), 0.2, 0.76, -1.2, s, 48).rotation.x = Math.PI / 2;
  const water = cyl(1.04, 1.04, 0.02, phys({ color: 0x48ff8c, emissive: 0x20c060, emissiveIntensity: 0.3, roughness: 0.05, transparent: true, opacity: 0.85, clearcoat: 1 }), 0.2, 0.66, -1.2, s, 48); water.userData.noCast = true;
  const wg = glow(0x3dff6a, 2.6, 0.2); wg.position.set(0.2, 0.85, -1.2); s.add(wg);
  // nobody here. a drink left on the rim, slippers, a folded towel
  lathe([[0, 0], [0.015, 0], [0.015, 0.09], [0.06, 0.19], [0.065, 0.2], [0, 0.2]], phys({ color: 0xffffff, transparent: true, opacity: 0.45, roughness: 0.05, clearcoat: 1 }), 1.05, 0.73, -0.62, s, 20);
  lathe([[0, 0.1], [0.055, 0.17], [0, 0.17]], phys({ color: 0x7dff9a, roughness: 0.1, transparent: true, opacity: 0.8 }), 1.05, 0.73, -0.62, s, 20);
  const umb = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.04, 10), std({ color: 0xff5fa8 })); umb.position.set(1.08, 0.94, -0.62); umb.rotation.z = -0.4; s.add(umb);
  const slip = std({ color: 0xf4f1ea, roughness: 1 }); [[0.95, 0.45, 0.15], [1.18, 0.38, -0.2]].forEach(([x, z, r]) => { const sl = rbox(0.12, 0.035, 0.28, 0.02, slip, x, 0.02, z, s, 2); sl.rotation.y = r; const st = rbox(0.12, 0.05, 0.08, 0.02, slip, x + Math.sin(r) * 0.06, 0.05, z + Math.cos(r) * 0.06, s, 2); st.rotation.y = r; });
  const tw = rbox(0.42, 0.08, 0.3, 0.035, std({ color: 0xffffff, roughness: 1 }), -0.55, 0.8, -0.35, s, 3); tw.rotation.y = 0.5;
  const bub = []; for (let i = 0; i < 22; i++) { const b = sph(R(0.015, 0.035), basic({ color: 0xd0ffe0, transparent: true, opacity: 0.6 }), 0, 0, 0, s, 6); b.userData.noCast = true; bub.push({ b, a: R(0, 6), r: R(0.1, 0.9), t: R(0, 1) }); }
  up.push((dt, t) => { bub.forEach((p) => { p.t += dt * R(1.5, 3); if (p.t > 1) { p.t = 0; p.a = R(0, 6); p.r = R(0.1, 0.9); } p.b.position.set(0.2 + Math.cos(p.a) * p.r, 0.67 + p.t * 0.05, -1.2 + Math.sin(p.a) * p.r); p.b.material.opacity = 0.6 * (1 - p.t); }); water.material.color.setHSL(0.37, 1, 0.55 + Math.sin(t * 2) * 0.04); });
  up.push(smokePuffs(s, 0.2, 0.8, -1.2, 10, 0xeaffea, 0.25, 1.4, 0.55));
  // robes, shelf, candles, fern, sign
  [-2.3, -1.6].forEach((x) => { const r = rbox(0.5, 1.0, 0.1, 0.05, std({ color: 0xf4f0e8, roughness: 1 }), x, 1.45, -d / 2 + 0.08, s); r.rotation.z = R(-0.04, 0.04); rbox(0.12, 0.1, 0.11, 0.03, std({ color: 0xf4f0e8 }), x, 1.95, -d / 2 + 0.1, s); cyl(0.015, 0.015, 0.08, brass, x, 2.0, -d / 2 + 0.05, s, 8).rotation.x = Math.PI / 2; });
  rbox(1.2, 0.04, 0.35, 0.01, std({ color: 0x8a6a4a }), 2.3, 1.2, -d / 2 + 0.2, s);
  for (let i = 0; i < 3; i++) { const t = cyl(0.1, 0.1, 0.32, std({ color: [0xffffff, 0xd0ffe0, 0xffe0f0][i], roughness: 1 }), 1.95 + i * 0.25, 1.32, -d / 2 + 0.22, s, 16); t.rotation.z = Math.PI / 2; }
  for (let i = 0; i < 5; i++) { const cx = -0.8 + i * 0.25, cz = -d / 2 + 0.25; cyl(0.04, 0.04, R(0.1, 0.22), std({ color: 0xf2ead8 }), cx, 0.85, cz, s, 10); const f = glow(0xffc070, 0.25, 0.9); f.position.set(cx, 1.0, cz); s.add(f); up.push(() => f.scale.setScalar(0.2 + Math.random() * 0.06)); }
  rbox(1.6, 0.06, 0.3, 0.01, std({ color: 0x8a6a4a }), -0.3, 0.75, -d / 2 + 0.2, s);
  plant(s, -2.4, 0, 0.8, 1.2);
  const [lc, lg] = cnv(256, 128); lg.fillStyle = '#1a1a1a'; lg.fillRect(0, 0, 256, 128); for (let y = 8; y < 128; y += 12) { lg.fillStyle = '#262626'; lg.fillRect(0, y, 256, 2); } lg.fillStyle = '#f0f0f0'; lg.font = '30px "Bebas Neue"'; lg.textAlign = 'center'; lg.fillText('PLEASE KEEP VOICES', 128, 46); lg.fillText('TO A WHISPER', 128, 84); lg.font = '18px "Bebas Neue"'; lg.fillText('— MGMT —', 128, 112);
  frame(0.8, 0.4, toTex(lc), s, w / 2 - 0.03, 1.7, -0.6, -Math.PI / 2, 0x6a4a2a);
  const [sc, sg] = cnv(256, 120); neonText(sg, 'spa', 128, 60, '100px "Yellowtail"', '#5cff7a', 18);
  const sq = neonQuad(sc, 0.9, 0.42); sq.position.set(0.2, 2.15, -d / 2 + 0.02); s.add(sq);
  wallAC(s, -w / 2 + 0.02, 1.9, -0.9, Math.PI / 2);
  return { scene: s, up, views: { room: cornerView(w, d, h, 0.6, 0.45, -1.0) } };
}

export function buildFmk(ctx) {
  const s = new THREE.Scene(); const up = []; const w = 5.6, d = 5, h = 2.6;
  const back = wallpaperTex(860, 400, { bg: '#b2a272', fg: '#5a4a28', kind: 'damask', scale: 54, dirt: 1.3 });
  { const g = back.map.image.getContext('2d');
    const spat = (x, y, r, n) => { g.fillStyle = '#5a0606'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); for (let i = 0; i < n; i++) { const a = R(0, 6.28), dd = R(r, r * 4); g.beginPath(); g.arc(x + Math.cos(a) * dd, y + Math.sin(a) * dd, R(1, r * 0.25), 0, 7); g.fill(); } for (let i = 0; i < 6; i++) { const dx = x + R(-r, r); g.fillRect(dx, y, R(2, 5), R(30, 140)); g.beginPath(); g.arc(dx + 2, y + R(30, 140), 4, 0, 7); g.fill(); } };
    spat(560, 160, 26, 90); spat(640, 230, 10, 30);
    g.font = '150px "Special Elite"'; g.fillStyle = '#6a0808'; g.textAlign = 'center'; g.save(); g.translate(300, 150); g.rotate(-0.05); g.fillText('F M K', 0, 0); g.restore();
    for (let i = 0; i < 12; i++) { const x = R(150, 460); g.fillRect(x, 150, R(2, 4), R(20, 110)); }
    back.map.needsUpdate = true; }
  roomBase(s, { envTex: ctx.envTex, w, d, h, wall: back, wallSide: wallpaperTex(800, 372, { bg: '#b2a272', fg: '#5a4a28', kind: 'damask', scale: 54, dirt: 1.3 }), floor: carpetTex(['#4a3a2a', '#3a2a1e', '#2a1e14'], 'shag', [5, 5]), ceil: ceilingTex([3, 3]), hemi: 0xffd0c0, hemiI: 0.1, trim: std({ color: 0x3a2a1a, roughness: 0.7 }) });
  // bare red bulb on a cord
  cyl(0.006, 0.006, 0.6, darkM, 0, h - 0.3, -0.4, s, 6); const bulb = lathe([[0, 0], [0.03, 0], [0.03, 0.03], [0.065, 0.1], [0.055, 0.17], [0, 0.19]], basic({ color: 0xff3020 }), 0, h - 0.78, -0.4, s, 20); bulb.userData.noCast = true;
  const red = keyLight(s, 0, h - 0.7, -0.4, 0xff1a10, 34, 1.3, 0, -0.6);
  const rg = glow(0xff2010, 1.2, 0.6); rg.position.set(0, h - 0.68, -0.4); s.add(rg);
  up.push((dt, t) => { const f = Math.random() < 0.05 ? 0.2 : 0.85 + Math.sin(t * 9) * 0.1; red.intensity = 34 * f; bulb.material.color.setRGB(1 * f, 0.2 * f, 0.12 * f); rg.material.opacity = 0.6 * f; });
  const sheet = (() => { const [c, g] = cnv(256, 256); g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, 256, 256); grime(g, 256, 256, 0.5); g.fillStyle = '#6a0606'; g.beginPath(); for (let i = 0; i < 20; i++) { const a = (i / 20) * 6.28, r = 50 + R(-16, 22); g.lineTo(140 + Math.cos(a) * r, 120 + Math.sin(a) * r * 0.8); } g.fill(); blotch(g, 140, 120, 90, 'rgba(90,0,0,A)', 0.5); for (let i = 0; i < 4; i++) g.fillRect(R(100, 180), 160, R(4, 10), R(40, 96)); return { map: toTex(c) }; })();
  bed(s, -0.6, -1.25, 0, sheet);
  nightstand(s, 0.7, -2.15);
  const knife = new THREE.Group(); knife.position.set(0.7, 0.62, -2.1); knife.rotation.set(0.15, 0.4, 0.1); s.add(knife); rbox(0.03, 0.2, 0.006, 0.003, chromeM, 0, 0, 0, knife, 1); rbox(0.04, 0.12, 0.025, 0.01, darkM, 0, 0.15, 0, knife, 1);
  const ch = new THREE.Group(); ch.position.set(1.7, 0.25, -0.6); ch.rotation.set(1.45, 0.4, 0); s.add(ch); const cw = texMat(woodTex(64, 64, '#4a2e18', 2), { roughness: 0.6 });
  rbox(0.45, 0.04, 0.45, 0.01, cw, 0, 0, 0, ch); rbox(0.45, 0.5, 0.04, 0.01, cw, 0, 0.27, -0.21, ch); [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([a, b]) => cyl(0.018, 0.015, 0.45, cw, a, -0.22, b, ch, 8));
  for (let i = 0; i < 3; i++) { const [c, g] = cnv(64, 76); g.fillStyle = '#f0ece0'; g.fillRect(0, 0, 64, 76); g.fillStyle = '#2a2a30'; g.fillRect(5, 5, 54, 52); g.fillStyle = '#c8a890'; g.beginPath(); g.arc(32, 28, 11, 0, 7); g.fill(); g.fillRect(20, 40, 24, 20); g.fillStyle = '#222'; g.font = '11px "Special Elite"'; g.fillText(['F', 'M', 'K'][i], 28, 70); if (i === 2) { g.strokeStyle = '#8a0000'; g.lineWidth = 4; g.beginPath(); g.moveTo(6, 6); g.lineTo(58, 56); g.moveTo(58, 6); g.lineTo(6, 56); g.stroke(); } const q = quad(0.16, 0.19, std({ map: toTex(c) }), w / 2 - 0.02, 1.55 + R(-0.05, 0.05), -1.2 + i * 0.25, s); q.rotation.y = -Math.PI / 2; q.rotation.z = R(-0.15, 0.15); }
  frame(0.6, 0.45, paintingTex('clown'), s, -w / 2 + 0.02, 1.6, -0.5, Math.PI / 2).rotation.z = 0.12;
  const phoneM = phys({ color: 0x1a1a1a, roughness: 0.3, clearcoat: 0.8 }); rbox(0.22, 0.08, 0.18, 0.02, phoneM, -1.5, 0.04, 0.6, s); const hs = rbox(0.22, 0.05, 0.06, 0.02, phoneM, -1.25, 0.03, 0.85, s); hs.rotation.y = 0.8;
  const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-1.4, 0.05, 0.62), new THREE.Vector3(-1.35, 0.1, 0.72), new THREE.Vector3(-1.3, 0.04, 0.8)]), 12, 0.006, 6), phoneM); s.add(cord);
  const drop = sph(0.012, basic({ color: 0x8a0000 }), 1.1, h, -0.9, s, 6); const pud = quad(0.4, 0.3, basic({ color: 0x3a0000, transparent: true, opacity: 0.85 }), 1.1, 0.005, -0.9, s); pud.rotation.x = -Math.PI / 2; pud.userData.noCast = true;
  const cst = quad(0.5, 0.5, basic({ map: glowTex, color: 0x3a0000, transparent: true, opacity: 0.8 }), 1.1, h - 0.005, -0.9, s); cst.rotation.x = Math.PI / 2;
  let dropT = 0; up.push((dt) => { dropT += dt; const k = (dropT % 2.2) / 0.55; drop.visible = k < 1; drop.position.y = h - 0.02 - (k * k) * (h - 0.03); });
  rbox(0.62, 0.36, 0.46, 0.02, texMat(woodTex(128, 64, '#2a1a10', 3), { roughness: 0.6 }), -2.2, 0.18, 0.7, s, 2).rotation.y = 0.9; const tv = crtTV(s, -2.2, 0.6, 0.7, 0.9, 0.6); const st = staticTex(); tv.screen.material = basic({ map: st }); up.push((dt, t) => { if (Math.floor(t * 20) % 2) drawStatic(st); });
  wallAC(s, w / 2 - 0.02, 1.95, -0.7, -Math.PI / 2);
  return { scene: s, up, views: { room: cornerView(w, d, h, 1.2, 0.5, -1.0) } };
}

export function buildKur(ctx) {
  const s = new THREE.Scene(); const up = []; const w = 9, d = 7, h = 3.2;
  roomBase(s, { envTex: ctx.envTex, w, d, h, wall: wallpaperTex(1300, 462, { bg: '#1e1a32', fg: '#c9a24a', kind: 'damask', scale: 70, dirt: 0.5 }), floor: carpetTex(['#3a2418', '#2a1810', '#4a3020'], 'planks', [6, 4]), ceil: ceilingTex([4, 3], false), hemi: 0xd8d0ff, hemiI: 0.25, trim: std({ color: 0xc9a24a, roughness: 0.4, metalness: 0.4 }) });
  // big window to space
  const [wc, wg] = cnv(1024, 400); wg.fillStyle = '#05030f'; wg.fillRect(0, 0, 1024, 400); for (let i = 0; i < 600; i++) { wg.fillStyle = `rgba(255,255,255,${R(0.2, 1)})`; wg.fillRect(R(0, 1024), R(0, 400), 1.5, 1.5); }
  blotch(wg, 300, 150, 260, 'rgba(120,60,160,A)', 0.35); blotch(wg, 700, 260, 220, 'rgba(40,110,150,A)', 0.3);
  const eg = wg.createRadialGradient(780, 520, 160, 780, 520, 330); eg.addColorStop(0, '#2a5ea0'); eg.addColorStop(0.85, '#3a8ac8'); eg.addColorStop(1, 'rgba(120,200,255,0)'); wg.fillStyle = eg; wg.beginPath(); wg.arc(780, 520, 330, 0, 7); wg.fill();
  const win = quad(5.2, 2.0, basic({ map: toTex(wc), color: 0xbbbbbb }), 0, 1.85, -d / 2 + 0.03, s); win.userData.noCast = true;
  const M2 = new Merger(s); M2.rbox(5.5, 0.14, 0.2, 0.03, brass, 0, 2.92, -d / 2 + 0.1).rbox(5.5, 0.14, 0.2, 0.03, brass, 0, 0.78, -d / 2 + 0.1).rbox(0.14, 2.3, 0.2, 0.03, brass, -2.68, 1.85, -d / 2 + 0.1).rbox(0.14, 2.3, 0.2, 0.03, brass, 2.68, 1.85, -d / 2 + 0.1); M2.build();
  [-3.4, 3.4].forEach((x) => { const c = curtain(1.3, 2.6, 0x3a2a5a, 0x000000, 5); c.position.set(x, 1.65, -d / 2 + 0.15); s.add(c); });
  const Ls = [[-3.4, 2.6, -2], [3.4, 2.6, -2], [0, 2.8, 2]].map(([x, y, z], i) => { const L = new THREE.PointLight(ctx.KUR_HUES[i], 6, 10, 1.4); L.position.set(x, y, z); s.add(L); return L; });
  const _kc = new THREE.Color(), _ka = new THREE.Color(), _kb = new THREE.Color();
  const kurColor = (t) => { const K = ctx.KUR_HUES; const sv = t * 0.22, i = Math.floor(sv), f = sv - i; _ka.setHex(K[i % K.length]); _kb.setHex(K[(i + 1) % K.length]); return _kc.copy(_ka).lerp(_kb, f * f * (3 - 2 * f)); };
  up.push((dt, t) => Ls.forEach((L, i) => L.color.copy(kurColor(t + i * 2.3))));
  keyLight(s, 1.2, h - 0.1, 2.4, 0xfff0e0, 16, 0.9, 0, -0.8);
  // plinth + the mountain
  lathe([[0, 0], [1.45, 0], [1.45, 0.34], [1.4, 0.4], [0, 0.4]], std({ color: 0x1d1a22, roughness: 0.55, metalness: 0.2 }), 0, 0, -0.8, s, 64);
  torus(1.43, 0.025, brass, 0, 0.38, -0.8, s, 64).rotation.x = Math.PI / 2;
  const mtn = makeMountain(1.18, 1.55); mtn.position.set(0, 0.4, -0.8); s.add(mtn);
  const cave = quad(0.36, 0.3, basic({ map: glowTex, color: 0xff6a20, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0.52, 0.42, s); cave.userData.noCast = true;
  const caveDark = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20, 0, Math.PI), basic({ color: 0x120604 })); caveDark.position.set(0, 0.41, 0.4); caveDark.rotation.x = -0.25; s.add(caveDark);
  const under = new THREE.PointLight(0xff6a20, 5, 4, 1.6); under.position.set(0, 0.6, 0.5); s.add(under);
  up.push((dt, t) => { under.intensity = 4.5 + Math.sin(t * 3) * 0.8 + Math.random() * 0.6; cave.material.opacity = 0.8 + Math.sin(t * 2.3) * 0.15; });
  const flames = [];
  for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2, r = 1.75 + (i % 2) * 0.12; const hh = R(0.08, 0.3); const x = Math.cos(a) * r, z = -0.8 + Math.sin(a) * r; cyl(0.035, 0.04, hh, std({ color: 0xf0e6cc, roughness: 0.7 }), x, hh / 2, z, s, 12); const f = glow(0xffb04a, 0.22, 0.95); f.position.set(x, hh + 0.05, z); s.add(f); flames.push(f); }
  const cL = new THREE.PointLight(0xffa040, 6, 6, 1.6); cL.position.set(0, 0.5, -0.8); s.add(cL);
  up.push(() => flames.forEach((f) => f.scale.set(0.18 + Math.random() * 0.05, 0.24 + Math.random() * 0.08, 1)));
  lathe([[0, 0], [0.15, 0], [0.12, 0.06], [0.06, 0.08], [0, 0.08]], brass, 2.2, 0, 0.9, s, 24); [-0.03, 0.02, 0.05].forEach((dx) => { const st = cyl(0.004, 0.004, 0.4, std({ color: 0x6a2a1a }), 2.2 + dx, 0.25, 0.9, s, 4); st.rotation.z = dx * 3; });
  up.push(smokePuffs(s, 2.2, 0.45, 0.9, 12, 0xd8d0e0, 0.06, 1.8, 0.25));
  const lanterns = []; const lanG = new THREE.LatheGeometry([[0, -0.13], [0.07, -0.13], [0.105, -0.07], [0.115, 0], [0.105, 0.07], [0.07, 0.13], [0, 0.13]].map(([a2, b2]) => new THREE.Vector2(a2, b2)), 20);
  const sideX = () => (rnd() < 0.5 ? -1 : 1) * R(1.7, 3.8);
  for (let i = 0; i < 10; i++) { const col = ctx.KUR_HUES[i % ctx.KUR_HUES.length]; const g = new THREE.Group(); const b = new THREE.Mesh(lanG, std({ color: col, emissive: col, emissiveIntensity: 1.4, roughness: 1, transparent: true, opacity: 0.92, side: THREE.DoubleSide })); b.userData.noCast = true; g.add(b); cyl(0.07, 0.07, 0.015, darkM, 0, 0.13, 0, g, 12); cyl(0.07, 0.07, 0.015, darkM, 0, -0.13, 0, g, 12); const gl = glow(col, 0.7, 0.45); g.add(gl); s.add(g); lanterns.push({ g, b, gl, x: sideX(), z: R(-3, 1.2), t: R(0, 1), sp: R(0.025, 0.05) }); }
  up.push((dt, t) => lanterns.forEach((l, i) => { l.t += dt * l.sp; if (l.t > 1) { l.t = 0; l.x = sideX(); l.z = R(-3, 1.2); } l.g.position.set(l.x + Math.sin(t * 0.4 + i) * 0.15, 0.5 + l.t * (h - 0.8), l.z); l.g.rotation.y = t * 0.2 + i; const fade = Math.min(1, l.t * 6, (1 - l.t) * 5); l.b.material.opacity = 0.92 * fade; l.gl.material.opacity = 0.45 * fade; }));
  const flagCols = [0x2a5ab0, 0xf0f0f0, 0xc82a2a, 0x2a9a4a, 0xf0c82a];
  const string = (z, y0, sag, cols, kind) => { const n = 22; cyl(0.004, 0.004, w - 0.4, darkM, 0, y0 - sag * 0.6, z, s, 4).rotation.z = Math.PI / 2; for (let i = 0; i < n; i++) { const tt = (i + 0.5) / n, x = -w / 2 + 0.2 + tt * (w - 0.4), y = y0 - Math.sin(tt * Math.PI) * sag; const col = cols[i % cols.length];
      if (kind === 'flag') { const q = quad(0.3, 0.24, std({ color: col, side: THREE.DoubleSide, roughness: 1 }), x, y - 0.12, z, s); q.rotation.y = R(-0.2, 0.2); up.push((dt, t) => (q.rotation.x = Math.sin(t * 1.5 + i) * 0.12)); }
      else if (kind === 'picado') { const [c, g] = cnv(64, 64); g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 64); g.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(R(8, 56), R(10, 54), R(3, 7), 0, 7); g.fill(); } g.beginPath(); g.moveTo(0, 64); for (let k = 0; k <= 8; k++) g.lineTo(k * 8, 58 + (k % 2) * 6); g.lineTo(64, 64); g.fill(); const q = quad(0.26, 0.26, std({ map: toTex(c), color: col, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }), x, y - 0.17, z, s); up.push((dt, t) => (q.rotation.x = Math.sin(t * 1.2 + i * 0.7) * 0.15)); }
      else { sph(0.06, std({ color: 0xff8a10, roughness: 1 }), x, y - 0.05, z, s, 10); } } };
  string(-2.6, h - 0.1, 0.4, flagCols, 'flag'); string(-1.6, h - 0.06, 0.25, [0xff4fa3, 0xff8a1f, 0x8a4aff, 0x2fd6c4, 0xf0d040], 'picado'); string(-0.6, h - 0.08, 0.45, [0], 'marigold');
  sph(0.08, std({ color: 0xff8a10 }), -0.75, 0.47, -0.05, s, 12); sph(0.07, std({ color: 0xc8202a }), -0.62, 0.46, 0.0, s, 12); lathe([[0, 0], [0.14, 0], [0.13, 0.05], [0.08, 0.06], [0, 0.06]], brass, -0.7, 0.4, -0.02, s, 20);
  [0.12, 0.09, 0.06].forEach((r, i) => { const st = sph(r, std({ color: 0x5a5560, roughness: 1 }), 0.75, 0.44 + i * r * 1.4, -0.05, s, 12); st.scale.y = 0.5; });
  wallAC(s, w / 2 - 0.02, 2.2, 0.0, -Math.PI / 2);
  return { scene: s, up, views: { room: cornerView(w, d, h, 1.4, 0.7, -1.3) } };
}

/* ================= HALLWAY (PROJECTS) ================= */
// A long El Royale corridor: walnut doors, a lit blade sign over each, colour leaking from under the doors.
// KUR is the suite at the far end.

/* ================= ORCHID (101): a 1970s estate dining room, candlelit, the plants taking over ================= */
function leafTex(kind = 'pothos') {
  const [c, g] = cnv(64, 96); g.clearRect(0, 0, 64, 96);
  if (kind === 'pothos') { g.fillStyle = '#3f7a2c'; g.beginPath(); g.moveTo(32, 92); g.bezierCurveTo(-6, 60, 6, 6, 32, 4); g.bezierCurveTo(58, 6, 70, 60, 32, 92); g.fill(); g.fillStyle = 'rgba(214,226,120,.35)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(R(18, 46), R(20, 70), R(3, 8), R(6, 14), R(-1, 1), 0, 7); g.fill(); } }
  else { g.fillStyle = '#245a26'; g.beginPath(); g.moveTo(32, 94); g.bezierCurveTo(-8, 70, -2, 8, 32, 4); g.bezierCurveTo(66, 8, 72, 70, 32, 94); g.fill(); g.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 5; k++) { const y = 22 + k * 13; g.fillRect(0, y, 18 - k, 3); g.fillRect(46 + k, y + 4, 18, 3); } g.beginPath(); g.ellipse(22, 46, 3, 5, 0, 0, 7); g.ellipse(42, 58, 3, 5, 0, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over'; }
  g.strokeStyle = 'rgba(190,220,140,.55)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(32, 90); g.lineTo(32, 10); g.stroke();
  const t = toTex(c); return t;
}
// trailing vines: a thin stem along a curve with instanced leaves, one draw call per vine set
function vines(s, curves, perM = 26, tex = leafTex('pothos'), size = 0.085) {
  const stemM = std({ color: 0x3a5a22, roughness: 0.8 }); let total = 0; const lens = curves.map((cv) => cv.getLength()); lens.forEach((L) => (total += Math.max(4, Math.round(L * perM))));
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(size * 0.72, size).translate(0, size * 0.42, 0), std({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.65 }), total);
  const o = new THREE.Object3D(), col = new THREE.Color(); let k = 0;
  curves.forEach((cv, ci) => { s.add(new THREE.Mesh(new THREE.TubeGeometry(cv, Math.max(8, Math.round(lens[ci] * 10)), 0.006, 4), stemM)); const n = Math.max(4, Math.round(lens[ci] * perM));
    for (let i = 0; i < n; i++) { const u = (i + R(0, 0.8)) / n; cv.getPointAt(Math.min(1, u), o.position); o.position.x += R(-0.03, 0.03); o.position.z += R(-0.03, 0.03); o.rotation.set(R(-1.2, 1.2), R(0, 6.28), R(-0.9, 0.9) + Math.PI); o.scale.setScalar(R(0.7, 1.25)); o.updateMatrix(); im.setMatrixAt(k, o.matrix); im.setColorAt(k, col.setHSL(R(0.24, 0.31), R(0.35, 0.6), R(0.32, 0.52))); k++; } });
  s.add(im); return im;
}
function orchidPlant(parent, x, y, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  lathe([[0, 0], [0.085, 0], [0.1, 0.16], [0.095, 0.17], [0.08, 0.02], [0, 0.02]], phys({ color: 0xf2ece0, roughness: 0.25, clearcoat: 0.8 }), 0, 0, 0, g, 24);
  cyl(0.088, 0.088, 0.01, std({ color: 0x5a6a2a, roughness: 1 }), 0, 0.15, 0, g, 16);
  const leafM = std({ color: 0x2f5a24, roughness: 0.45, side: THREE.DoubleSide });
  for (let k = 0; k < 5; k++) { const lf = new THREE.Mesh(new THREE.CircleGeometry(0.1, 14), leafM); lf.scale.set(0.42, 1, 1); lf.position.set(0, 0.17, 0); lf.rotation.set(-1.2 + R(-0.2, 0.2), (k / 5) * 6.28, 0); lf.translateY(0.08); g.add(lf); }
  // two arching spikes of white-and-magenta blooms
  const [fc, fg] = cnv(128, 128); fg.clearRect(0, 0, 128, 128); fg.fillStyle = '#f7eef2'; for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; fg.beginPath(); fg.ellipse(64 + Math.cos(a) * 28, 64 + Math.sin(a) * 28, k === 0 ? 20 : 26, 17, a, 0, 7); fg.fill(); }
  fg.fillStyle = '#c2357e'; fg.beginPath(); fg.ellipse(64, 74, 14, 18, 0, 0, 7); fg.fill(); fg.fillStyle = '#f2c040'; fg.beginPath(); fg.arc(64, 62, 6, 0, 7); fg.fill(); fg.strokeStyle = 'rgba(194,53,126,.5)'; fg.lineWidth = 2; for (let k = 0; k < 12; k++) { const a = R(0, 6.28); fg.beginPath(); fg.moveTo(64 + Math.cos(a) * 14, 64 + Math.sin(a) * 14); fg.lineTo(64 + Math.cos(a) * 34, 64 + Math.sin(a) * 34); fg.stroke(); }
  const flM = std({ map: toTex(fc), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6, emissive: 0x2a1a20 }), stemM = std({ color: 0x4a5a2a, roughness: 0.7 });
  [[0.0, 1], [2.4, 0.8]].forEach(([yaw, sc]) => { const pts = [new THREE.Vector3(0, 0.16, 0), new THREE.Vector3(0.02, 0.42 * sc, 0.01), new THREE.Vector3(0.1 * sc, 0.62 * sc, 0.02), new THREE.Vector3(0.24 * sc, 0.66 * sc, 0.03)].map((v) => v.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)); const cv = new THREE.CatmullRomCurve3(pts);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 16, 0.005, 5), stemM)); for (let k = 0; k < 6; k++) { const u = 0.58 + k * 0.08; if (u > 1) break; const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.075), flM); cv.getPointAt(u, fl.position); fl.position.y -= 0.025; fl.rotation.set(R(-0.3, 0.2), yaw + R(-0.6, 0.6) + 0.6, R(-0.4, 0.4)); fl.scale.setScalar(1 - k * 0.07); g.add(fl); } });
  return g;
}
export function buildOrchid(ctx) {
  const s = new THREE.Scene(); const up = []; const w = 5.8, d = 5.2, h = 2.6;
  roomBase(s, { envTex: ctx.envTex, w, d, h, wall: wallpaperTex(900, 420, { bg: '#3e2817', fg: '#1c1009', kind: 'stripe', scale: 20, dirt: 0.3 }), floor: carpetTex(['#3a4418', '#4e5a22', '#262e10'], 'shag', [5, 5]), ceil: ceilingTex([3, 3], false), hemi: 0xffcf9a, hemiI: 0.09, trim: std({ color: 0x24140a, roughness: 0.5 }) });
  s.environmentIntensity = 0.1; s.fog = new THREE.FogExp2(0x0c0806, 0.05);
  const walnut = texMat(woodTex(256, 128, '#4a2a14', 6), { roughness: 0.38 }), teak = texMat(woodTex(256, 128, '#6a3c1a', 8), { roughness: 0.42 });
  const velvet = std({ color: 0x7a3414, roughness: 0.95 }), brassM = phys({ color: 0xc9a24a, roughness: 0.3, metalness: 0.9 });
  // the big window on the back wall: night outside, plants pressed against the glass, mustard drapes
  { const [c, g] = cnv(512, 400); const gr = g.createLinearGradient(0, 0, 0, 400); gr.addColorStop(0, '#0b1424'); gr.addColorStop(1, '#16243a'); g.fillStyle = gr; g.fillRect(0, 0, 512, 400); g.fillStyle = '#e8eef8'; g.beginPath(); g.arc(380, 80, 18, 0, 7); g.fill();
    g.fillStyle = '#05080a'; for (let i = 0; i < 26; i++) { g.save(); g.translate(R(0, 512), R(150, 420)); g.rotate(R(-0.8, 0.8)); g.beginPath(); g.ellipse(0, 0, R(18, 46), R(60, 140), 0, 0, 7); g.fill(); g.restore(); }
    const win = quad(2.0, 1.6, basic({ map: toTex(c), color: 0x8a96b0 }), -0.5, 1.4, -d / 2 + 0.02, s); win.userData.noCast = true;
    const fr = std({ color: 0x1a1008, roughness: 0.5 }); [[-1.5, 2.0], [0.5, 2.0]].forEach(([x]) => rbox(0.08, 1.7, 0.06, 0.01, fr, x, 1.4, -d / 2 + 0.04, s, 1)); rbox(2.08, 0.08, 0.06, 0.01, fr, -0.5, 2.22, -d / 2 + 0.04, s, 1); rbox(2.08, 0.08, 0.06, 0.01, fr, -0.5, 0.58, -d / 2 + 0.04, s, 1);
    for (const x of [-0.83, -0.17]) rbox(0.035, 1.6, 0.04, 0.01, fr, x, 1.4, -d / 2 + 0.05, s, 1); rbox(2.0, 0.035, 0.04, 0.01, fr, -0.5, 1.4, -d / 2 + 0.05, s, 1);
    [-1.75, 0.75].forEach((x) => { const cu = curtain(0.62, 2.3, 0x6e5418, 0x000000, 5); cu.position.set(x, 1.2, -d / 2 + 0.14); s.add(cu); });
    cyl(0.018, 0.018, 3.3, brassM, -0.5, 2.38, -d / 2 + 0.16, s, 8).rotation.z = Math.PI / 2;
    const moon = new THREE.SpotLight(0x5a78c8, 6, 7, 0.7, 0.8, 1.4); moon.position.set(-0.5, 2.1, -d / 2 + 0.3); moon.target.position.set(0.4, 0, -0.6); s.add(moon, moon.target); }
  // round shag rug, tulip table, two chairs facing off across it
  { const rug = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48).rotateX(-Math.PI / 2), texMat(carpetTex(['#7a3a12', '#9a4c18', '#4a2008'], 'shag', [2, 2]), { roughness: 1 })); rug.position.set(0.3, 0.006, -0.7); s.add(rug); }
  const T = new THREE.Group(); T.position.set(0.3, 0, -0.7); s.add(T);
  lathe([[0, 0], [0.32, 0], [0.31, 0.03], [0.1, 0.1], [0.055, 0.3], [0.05, 0.62], [0.11, 0.72], [0, 0.72]], phys({ color: 0xece4d4, roughness: 0.3, clearcoat: 0.6 }), 0, 0, 0, T, 32);
  cyl(0.62, 0.62, 0.035, walnut, 0, 0.74, 0, T, 48); cyl(0.625, 0.6, 0.012, std({ color: 0x2a160a }), 0, 0.72, 0, T, 48);
  const chair = (x, ry) => { const c = new THREE.Group(); c.position.set(x, 0, 0); c.rotation.y = ry; T.add(c); rbox(0.46, 0.05, 0.44, 0.02, walnut, 0, 0.44, 0, c, 1); rbox(0.44, 0.07, 0.42, 0.03, velvet, 0, 0.49, 0, c, 2); rbox(0.46, 0.46, 0.045, 0.02, walnut, 0, 0.78, -0.21, c, 1); rbox(0.42, 0.34, 0.04, 0.02, velvet, 0, 0.8, -0.18, c, 2);
    [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]].forEach(([a, b]) => { const l = cyl(0.018, 0.012, 0.44, walnut, a, 0.22, b, c, 8); l.rotation.x = b > 0 ? -0.08 : 0.08; }); };
  chair(-0.92, Math.PI / 2); chair(0.92, -Math.PI / 2);
  // on the table: the candle in pink glass, amber mug, blue carafe, two plates
  const glassP = (col, op = 0.55) => phys({ color: col, roughness: 0.08, transparent: true, opacity: op, clearcoat: 1, depthWrite: false });
  lathe([[0, 0], [0.07, 0], [0.065, 0.03], [0.03, 0.06], [0.022, 0.24], [0.045, 0.27], [0.03, 0.29], [0, 0.29]], glassP(0xd23aa0, 0.75), 0, 0.757, 0, T, 24);
  cyl(0.02, 0.02, 0.24, std({ color: 0xf0ead8, roughness: 0.6, emissive: 0x6a4020, emissiveIntensity: 0.4 }), 0, 1.16, 0, T, 12);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.045, 8), basic({ color: 0xffd890 })); flame.position.set(0, 1.305, 0); T.add(flame);
  const fglow = glow(0xffa040, 0.55, 0.85); fglow.position.set(0, 1.3, 0); T.add(fglow); const halo = glow(0xff8a30, 2.2, 0.16); halo.position.set(0, 1.25, 0); T.add(halo);
  const candle = new THREE.PointLight(0xff9a40, 7, 5.5, 1.7); candle.position.set(0, 1.36, 0); T.add(candle);
  up.push((dt, t) => { const f = 0.82 + 0.1 * Math.sin(t * 13.7) + 0.06 * Math.sin(t * 23.1 + 1) + 0.05 * Math.sin(t * 5.3); candle.intensity = 7 * f; flame.scale.set(1, 0.85 + 0.25 * f, 1); fglow.material.opacity = 0.6 * f; flame.rotation.z = Math.sin(t * 3.1) * 0.08; });
  lathe([[0, 0], [0.04, 0], [0.045, 0.1], [0, 0.1]], glassP(0xc87a1a, 0.6), -0.32, 0.757, 0.12, T, 18);
  lathe([[0, 0], [0.05, 0], [0.06, 0.08], [0.035, 0.16], [0.02, 0.24], [0.028, 0.26], [0, 0.26]], glassP(0x6a9ab8, 0.4), 0.18, 0.757, -0.26, T, 20);
  lathe([[0, 0], [0.04, 0], [0.042, 0.11], [0, 0.11]], glassP(0xb06a20, 0.55), 0.3, 0.757, 0.2, T, 16);
  [[-0.38, -0.12], [0.38, 0.1]].forEach(([x, z]) => { cyl(0.13, 0.11, 0.015, std({ color: 0xeee6d4, roughness: 0.3 }), x, 0.765, z, T, 28); for (let k = 0; k < 4; k++) sph(R(0.02, 0.035), std({ color: pick([0xd8b070, 0x6a8a3a, 0xc8642a]), roughness: 0.7 }), x + R(-0.05, 0.05), 0.78, z + R(-0.05, 0.05), T, 8); });
  // teak credenza under a sunburst mirror, the orchid on top
  { const cr = new THREE.Group(); cr.position.set(1.75, 0, -d / 2 + 0.3); s.add(cr);
    rbox(1.7, 0.56, 0.46, 0.02, teak, 0, 0.42, 0, cr, 2); for (const x of [-0.43, 0, 0.43]) box(0.008, 0.5, 0.01, std({ color: 0x1a0c04 }), x, 0.42, 0.235, cr);
    [[-0.78, -0.18], [0.78, -0.18], [-0.78, 0.18], [0.78, 0.18]].forEach(([a, b]) => cyl(0.012, 0.008, 0.14, brassM, a, 0.07, b, cr, 6));
    orchidPlant(cr, -0.45, 0.7, 0.02, 0.3);
    lampMini(cr, 0.55, 0.7, -0.05, 0xc89a3a, 0xffa860, 2.2);
    [[0.08, 0.035, 0x6a2a1a], [0.1, 0.03, 0x2a4a3a], [0.09, 0.04, 0xc8a050]].forEach(([dd, hh, col], i) => rbox(0.26, hh, 0.19, 0.005, std({ color: col, roughness: 0.8 }), 0.05 + R(-0.02, 0.02), 0.72 + i * 0.04, 0.02, cr, 1));
    const sb = new THREE.Group(); sb.position.set(0, 1.62, -0.2); cr.add(sb); const n = 28, ray = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.34, 0.01).translate(0, 0.33, 0), brassM, n), mt = new THREE.Matrix4();
    for (let k = 0; k < n; k++) { mt.makeRotationZ((k / n) * Math.PI * 2); ray.setMatrixAt(k, mt); } sb.add(ray); cyl(0.17, 0.17, 0.02, phys({ color: 0x9aa0a8, metalness: 1, roughness: 0.05 }), 0, 0, 0.005, sb, 32).rotation.x = Math.PI / 2; torus(0.17, 0.012, brassM, 0, 0, 0.012, sb, 32); }
  // the namesake: a big orchid on a white pedestal by the window, catching the moonlight
  { const ped = lathe([[0, 0], [0.2, 0], [0.2, 0.04], [0.12, 0.08], [0.1, 0.78], [0.16, 0.82], [0.16, 0.86], [0, 0.86]], phys({ color: 0xece4d4, roughness: 0.3, clearcoat: 0.6 }), -1.75, 0, -1.75, s, 28); const op = orchidPlant(s, -1.75, 0.86, -1.75, 0.9); op.scale.setScalar(1.55); }
  // low rust velvet sofa along the right wall, arc lamp leaning over it
  { const so = new THREE.Group(); so.position.set(w / 2 - 0.5, 0, 0.7); so.rotation.y = -Math.PI / 2; s.add(so);
    rbox(2.2, 0.3, 0.86, 0.05, velvet, 0, 0.2, 0, so, 3); rbox(2.2, 0.5, 0.2, 0.08, velvet, 0, 0.55, -0.34, so, 3); for (const x of [-0.55, 0.55]) rbox(1.06, 0.14, 0.62, 0.06, velvet, x, 0.42, 0.08, so, 3); for (const x of [-1.12, 1.12]) rbox(0.16, 0.42, 0.86, 0.06, velvet, x, 0.32, 0, so, 3);
    rbox(0.42, 0.42, 0.12, 0.08, std({ color: 0xc8a040, roughness: 0.9 }), -0.65, 0.62, -0.18, so, 3).rotation.z = 0.2; }
  { const base = cyl(0.17, 0.19, 0.06, std({ color: 0xe8e2d8, roughness: 0.2 }), w / 2 - 0.45, 0.03, 2.0, s, 24);
    const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(w / 2 - 0.45, 0.06, 2.0), new THREE.Vector3(w / 2 - 0.5, 1.4, 1.85), new THREE.Vector3(w / 2 - 0.9, 2.15, 1.35), new THREE.Vector3(w / 2 - 1.5, 2.05, 0.75)]); s.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 32, 0.012, 6), phys({ color: 0xd8d8d8, metalness: 1, roughness: 0.2 })));
    const dome = lathe([[0, 0.2], [0.12, 0.18], [0.2, 0.08], [0.22, 0]], phys({ color: 0xd8d8d8, metalness: 1, roughness: 0.25, side: THREE.DoubleSide }), w / 2 - 1.5, 1.82, 0.75, s, 32);
    const bulb = sph(0.06, basic({ color: 0xfff0d0 }), w / 2 - 1.5, 1.86, 0.75, s, 12); bulb.userData.noCast = true;
    const al = new THREE.PointLight(0xffb070, 3.5, 4.5, 1.8); al.position.set(w / 2 - 1.5, 1.7, 0.75); s.add(al); const ag = glow(0xffc080, 1.1, 0.3); ag.position.set(w / 2 - 1.5, 1.8, 0.75); s.add(ag); }
  // greenery creeping in: palm and fern in the corners, a macrame hanger, pothos trailing off every ledge
  { const pm = palm(s, w / 2 - 0.55, 0, -d / 2 + 0.6); pm.scale.setScalar(0.62); plant(s, -w / 2 + 0.55, 0, -d / 2 + 0.55, 1.5); plant(s, -2.3, 0, -0.9, 1.1);
    const hz = new THREE.Group(); hz.position.set(1.9, h - 1.0, -1.0); s.add(hz); lathe([[0, 0], [0.13, 0], [0.16, 0.18], [0, 0.18]], std({ color: 0xb87a4a, roughness: 0.8 }), 0, 0, 0, hz, 18);
    for (let k = 0; k < 4; k++) { const a = (k / 4) * 6.28; const st = cyl(0.004, 0.004, 1.0, std({ color: 0xd8c8a8 }), Math.cos(a) * 0.08, 0.6, Math.sin(a) * 0.08, hz, 4); st.rotation.set(Math.sin(a) * 0.14, 0, -Math.cos(a) * 0.14); }
    const C3 = (pts) => new THREE.CatmullRomCurve3(pts.map(([a, b, c]) => new THREE.Vector3(a, b, c)));
    const curves = [
      C3([[-1.6, 2.5, -2.5], [-1.1, 2.3, -2.45], [-0.5, 2.42, -2.45], [0.1, 2.28, -2.45], [0.7, 2.45, -2.45]]),            // over the window
      C3([[-1.55, 2.4, -2.48], [-1.62, 1.9, -2.4], [-1.58, 1.4, -2.38], [-1.66, 1.0, -2.36]]),                             // down the left drape
      C3([[0.75, 2.4, -2.45], [0.82, 1.8, -2.42], [0.95, 1.2, -2.36], [1.05, 0.95, -2.3]]),                               // down onto the credenza
      C3([[1.2, 0.72, -2.15], [1.45, 0.7, -2.08], [1.62, 0.5, -2.05], [1.6, 0.25, -2.02]]),                               // spilling off the credenza
      C3([[1.9, 1.75, -1.0], [2.05, 1.4, -0.92], [2.0, 1.05, -0.95], [2.08, 0.82, -0.9]]), C3([[1.85, 1.75, -1.05], [1.7, 1.35, -1.1], [1.76, 1.1, -1.18]]), C3([[1.95, 1.76, -0.95], [1.98, 1.5, -0.8], [2.1, 1.3, -0.72]]), // macrame hanger
      C3([[w / 2 - 0.03, 2.5, -2.5], [w / 2 - 0.05, 2.3, -1.6], [w / 2 - 0.04, 2.48, -0.6], [w / 2 - 0.06, 2.2, 0.3], [w / 2 - 0.04, 1.85, 0.6]]), // along the right wall top
      C3([[-w / 2 + 0.04, 2.5, -2.5], [-w / 2 + 0.06, 2.25, -1.4], [-w / 2 + 0.05, 2.45, -0.2], [-w / 2 + 0.07, 2.1, 0.5]]),
    ];
    vines(s, curves, 30); }
  // a framed print of the poster by the door
  return { scene: s, up, views: { room: cornerView(w, d, h, 0.8, 0.62, -1.0) } };
}

export function buildHall(ctx) {
  const { PROJECTS, ROOM_COLORS, KUR_HUES } = ctx;
  const s = new THREE.Scene(); s.background = new THREE.Color(0x050304); s.environment = ctx.envTex; s.environmentIntensity = 0.14;
  const up = [], hot = [], doors = {};
  const W = 3.2, H = 2.85, Z0 = 5, Z1 = -11.4, hx = W / 2;
  const M = new Merger(s);
  const walnut = texMat(woodTex(256, 512, '#3e2414', 6, null, 0.3), { roughness: 0.45 });
  const walnutD = std({ color: 0x2a170c, roughness: 0.5 });
  const trim = std({ color: 0x3a2214, roughness: 0.5 });
  s.add(new THREE.HemisphereLight(0xffe0c0, 0x2a1810, 0.32));

  // floor runner + border
  const carpet = (() => { const S = 256, [c, g] = cnv(S, S), [hc, hg] = cnv(S, S); g.fillStyle = '#6e1420'; g.fillRect(0, 0, S, S); hg.fillStyle = '#808080'; hg.fillRect(0, 0, S, S);
    g.strokeStyle = '#c9952e'; g.lineWidth = 5; for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const cx = 64 + x * 128, cy = 64 + y * 128; g.beginPath(); g.moveTo(cx, cy - 46); g.lineTo(cx + 46, cy); g.lineTo(cx, cy + 46); g.lineTo(cx - 46, cy); g.closePath(); g.stroke(); g.fillStyle = '#2a0810'; g.beginPath(); g.arc(cx, cy, 14, 0, 7); g.fill(); g.fillStyle = '#e0a840'; g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill(); }
    g.fillStyle = '#e0a840'; [0, 128, 256].forEach((p) => { g.fillRect(p - 3, 0, 6, 6); g.fillRect(p - 3, 122, 6, 12); g.fillRect(p - 3, 250, 6, 6); });
    speckle(g, S, S, 6000, 0.25, ['#000', '#fff', '#3a0a10']); for (let i = 0; i < 5000; i++) { hg.fillStyle = `rgba(${rnd() < 0.5 ? 255 : 0},${rnd() < 0.5 ? 255 : 0},${rnd() < 0.5 ? 255 : 0},.2)`; hg.fillRect(R(0, S), R(0, S), 1.5, 2.5); }
    for (let i = 0; i < 6; i++) blotch(g, R(0, S), R(0, S), R(20, 60), 'rgba(20,0,0,A)', R(0.08, 0.2));
    return { map: toTex(c, [2.2, 12]), normalMap: toTex(heightToNormal(hc, 1.2), [2.2, 12], false), normalScale: new THREE.Vector2(0.5, 0.5) }; })();
  const fl = quad(W, Z0 - Z1, texMat(carpet, { roughness: 0.95 }), 0, 0, (Z0 + Z1) / 2, s); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  [-hx + 0.12, hx - 0.12].forEach((x) => { const b = quad(0.24, Z0 - Z1, std({ color: 0x2a0a0e, roughness: 0.95 }), x, 0.003, (Z0 + Z1) / 2, s); b.rotation.x = -Math.PI / 2; b.receiveShadow = true; });
  const ce = quad(W, Z0 - Z1, texMat(ceilingTex([2, 9], false), { color: 0xf2e6d2 }), 0, H, (Z0 + Z1) / 2, s); ce.rotation.x = Math.PI / 2;

  // walls (built in pieces so the doors have real openings)
  const wallT = wallpaperTex(512, 730, { bg: '#c7b083', fg: '#7a5a22', kind: 'damask', scale: 58, wainscot: { col: '#4a2a14', frac: 0.38 }, dirt: 0.45 });
  [wallT.map, wallT.normalMap].forEach((t) => { t.wrapS = THREE.RepeatWrapping; });
  const wallMat = texMat(wallT, { roughness: 0.85 });
  const piece = (x, z, ry, len, y0, y1, u0) => {
    const h = y1 - y0, g = new THREE.PlaneGeometry(len, h), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) { uv.setX(i, u0 + uv.getX(i) * len / 2); uv.setY(i, (y0 + uv.getY(i) * h) / H); }
    const mesh = new THREE.Mesh(g, wallMat); mesh.position.set(x, (y0 + y1) / 2, z); mesh.rotation.y = ry; mesh.receiveShadow = true; s.add(mesh); return mesh;
  };
  const sideDoors = [
    { id: 'hyodo', side: -1, z: -1.0, num: '102' },
    { id: 'orchid', side: 1, z: -1.0, num: '101' },
    { id: 'alien', side: 1, z: -3.6, num: '106' },
    { id: 'freddie', side: -1, z: -6.2, num: '104' },
    { id: 'fmk', side: 1, z: -8.6, num: '203' },
  ];
  const DW = 1.0, DH = 2.2;
  [-1, 1].forEach((side) => {
    const ds = sideDoors.filter((d) => d.side === side).sort((a, b) => b.z - a.z);
    let zTop = Z0; const x = side * hx, ry = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    const uAt = (z) => (side < 0 ? (Z0 - z) / 2 : (z - Z1) / 2);
    const run = (za, zb) => { if (za - zb < 0.01) return; piece(x, (za + zb) / 2, ry, za - zb, 0, H, side < 0 ? uAt(za) : uAt(zb)); };
    for (const d of ds) { const a = d.z + DW / 2, b = d.z - DW / 2; run(zTop, a); piece(x, d.z, ry, DW, DH, H, side < 0 ? uAt(a) : uAt(b)); zTop = b; }
    run(zTop, Z1);
  });
  // back wall (behind the camera) and the end wall with the suite's double doors
  piece(0, Z0, Math.PI, W, 0, H, 0);
  const SW = 1.9, SH = 2.12;
  piece(-hx + (hx - SW / 2) / 2, Z1, 0, hx - SW / 2, 0, H, 0); piece(hx - (hx - SW / 2) / 2, Z1, 0, hx - SW / 2, 0, H, (hx + SW / 2) / 2); piece(0, Z1, 0, SW, SH, H, (hx - SW / 2) / 2);
  // crown moulding + chair rail + baseboard down both walls
  // crown runs the full length; baseboard and brass chair rail stop at each door
  const railM = std({ color: 0xc9a24a, roughness: 0.35, metalness: 0.7 });
  [-1, 1].forEach((side) => {
    const x = side * (hx - 0.03); M.rbox(0.07, 0.12, Z0 - Z1, 0.02, trim, x, H - 0.06, (Z0 + Z1) / 2);
    const cuts = sideDoors.filter((d) => d.side === side).map((d) => [d.z + DW / 2 + 0.1, d.z - DW / 2 - 0.1]).sort((p, q) => q[0] - p[0]);
    let za = Z0; const seg = (z0, z1) => { const L = z0 - z1; if (L < 0.05) return; M.rbox(0.05, 0.14, L, 0.015, trim, x, 0.07, (z0 + z1) / 2).rbox(0.05, 0.05, L, 0.015, railM, x, H * 0.38, (z0 + z1) / 2); };
    for (const [c0, c1] of cuts) { seg(za, c0); za = c1; } seg(za, Z1);
  });

  // a door: walnut, raised panels, brass kick plate / number / knob. local +z faces the hall, hinge at local x=0
  const numTex = (num) => { const [c, g] = cnv(128, 64); const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#e6c06a'); gr.addColorStop(0.5, '#b8913e'); gr.addColorStop(1, '#d9b259'); g.fillStyle = gr; g.fillRect(0, 0, 128, 64); g.fillStyle = '#3a2a10'; g.font = '46px "Bebas Neue"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(num, 64, 35); return toTex(c); };
  const makeLeaf = (w, num, flip = false) => {
    const leaf = new THREE.Group(); const sx = flip ? -1 : 1;
    rbox(w, DH, 0.055, 0.015, walnut, sx * w / 2, DH / 2, 0, leaf, 2);
    rbox(w * 0.66, 0.62, 0.02, 0.01, walnutD, sx * w / 2, 1.55, 0.032, leaf, 1); rbox(w * 0.66, 0.92, 0.02, 0.01, walnutD, sx * w / 2, 0.66, 0.032, leaf, 1);
    rbox(w * 0.9, 0.22, 0.008, 0.004, brass, sx * w / 2, 0.14, 0.032, leaf, 1);
    if (num) quad(0.26, 0.13, std({ map: numTex(num), roughness: 0.3, metalness: 0.6 }), sx * w / 2, 1.98, 0.034, leaf);
    sph(0.018, darkM, sx * w / 2, 1.8, 0.03, leaf, 8);
    const knob = sph(0.045, brass, sx * (w - 0.12), 1.02, 0.07, leaf, 14); cyl(0.022, 0.022, 0.06, brass, sx * (w - 0.12), 1.02, 0.04, leaf, 10).rotation.x = Math.PI / 2;
    leaf.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return leaf;
  };
  const casing = (g, w, h) => { const C = new Merger(g); C.rbox(0.09, h + 0.09, 0.07, 0.015, trim, -0.045, (h + 0.09) / 2, 0.02).rbox(0.09, h + 0.09, 0.07, 0.015, trim, w + 0.045, (h + 0.09) / 2, 0.02).rbox(w + 0.18, 0.09, 0.07, 0.015, trim, w / 2, h + 0.045, 0.02); C.build(); };
  const gradTex = (() => { const Wd = 128, Hd = 128, [c, g] = cnv(Wd, Hd), im = g.createImageData(Wd, Hd), d = im.data; const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) { const u = (x + 0.5) / Wd, v = (y + 0.5) / Hd, a = Math.exp(-v * 4.2) * sm(0, 0.3, u) * sm(1, 0.7, u) * (0.75 + 0.25 * sm(0.0, 0.06, v)), i = (y * Wd + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.max(0, Math.min(255, a * 255 + Math.random() - 0.5)); }
    g.putImageData(im, 0, 0); return toTex(c); })();
  const bladeTex = (num, p) => { const Wt = 620, Ht = 220, [c, g] = cnv(Wt, Ht); g.fillStyle = '#f3ead6'; g.fillRect(0, 0, Wt, Ht); g.fillStyle = p.css; g.fillRect(0, 0, Wt, 40); g.fillStyle = p.t || 'rgba(0,0,0,.7)'; g.font = 'bold 24px "Courier Prime"'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('ROOM ' + num, 18, 21); g.fillStyle = '#1e1814'; g.textAlign = 'center'; g.font = fitFont(g, p.title, '104px "Bebas Neue"', Wt - 50); g.fillText(p.title, Wt / 2, 118); g.fillStyle = '#5a4a3a'; const sub = p.door.toUpperCase(); g.font = fitFont(g, sub, 'bold 20px "Courier Prime"', Wt - 60); g.fillText(sub, Wt / 2, 186); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 6; g.strokeRect(3, 3, Wt - 6, Ht - 6); grime(g, Wt, Ht, 0.15); return toTex(c); };
  const voidMat = basic({ color: 0xf6efe4 });
  const nLights = LOW ? 0 : 1;

  for (const d of sideDoors) {
    const p = PROJECTS[d.id], col = ROOM_COLORS[d.id];
    const G = new THREE.Group(); G.position.set(d.side * hx, 0, d.z + (d.side < 0 ? DW / 2 : -DW / 2)); G.rotation.y = d.side < 0 ? Math.PI / 2 : -Math.PI / 2; s.add(G);
    casing(G, DW, DH);
    const pivot = new THREE.Group(); G.add(pivot); const leaf = makeLeaf(DW, d.num); pivot.add(leaf);
    const vb = box(DW, DH, 1.4, voidMat, DW / 2, DH / 2, -0.72, G); vb.userData.noCast = true; // darkness of the room beyond
    // colour leaking under the door onto the carpet
    const strip = quad(DW * 1.5, 0.9, basic({ map: gradTex, color: new THREE.Color(col).multiplyScalar(0.85), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), DW / 2, 0.006, 0.45, G); strip.rotation.x = -Math.PI / 2; strip.userData.noCast = true;
    const sp = spill(col, 2.2, 1.6, 0.2); sp.position.set(DW / 2, 0.008, 0.6); G.add(sp);
    if (nLights) { const L = new THREE.PointLight(col, 2.2, 3, 2); L.position.set(DW / 2, 0.15, 0.4); G.add(L); }
    // blade sign, sticking out over the door so you read it down the hall
    const bl = new THREE.Group(); bl.position.set(d.side * (hx - 0.66), 2.42, d.z + 0.68); s.add(bl);
    const bw = 1.12, bh = 0.4;
    rbox(bw + 0.08, bh + 0.08, 0.08, 0.02, darkM, 0, 0, 0, bl, 2);
    const fq = quad(bw, bh, basic({ map: bladeTex(d.num, p), color: 0xe6e6e6 }), 0, 0, 0.045, bl); fq.userData.noCast = true;
    const bq = quad(bw, bh, basic({ map: bladeTex(d.num, p), color: 0xe6e6e6 }), 0, 0, -0.045, bl); bq.rotation.y = Math.PI; bq.userData.noCast = true;
    const edge = box(bw + 0.1, 0.025, 0.1, basic({ color: col }), 0, -bh / 2 - 0.05, 0, bl); edge.userData.noCast = true;
    cyl(0.012, 0.012, 0.38, brass, -d.side * 0.4, bh / 2 + 0.19, 0, bl, 6); cyl(0.012, 0.012, 0.38, brass, d.side * 0.4, bh / 2 + 0.19, 0, bl, 6);
    M.rbox(0.66, 0.05, 0.05, 0.02, brass, d.side * (hx - 0.33), 2.82, d.z + 0.68);
    const gl = glow(col, 1.6, 0.12); gl.position.set(0, 0, 0.2); bl.add(gl);
    [leaf, fq, bq, strip, vb].forEach((o) => o.traverse((c) => { c.userData.go = d.id; if (c.isMesh) hot.push(c); }));
    const cx = d.side * hx * 0.18, cz = d.z + 0.15;
    doors[d.id] = { pivots: [pivot], open: 1.25, view: { pos: new THREE.Vector3(-d.side * 0.35, 1.55, d.z + 0.5), target: new THREE.Vector3(d.side * hx, 1.3, d.z - 0.15) } };
  }

  // the suite at the end of the hall
  {
    const p = PROJECTS.kur; const E = new THREE.Group(); E.position.set(-SW / 2, 0, Z1); s.add(E);
    const C = new Merger(E); C.rbox(0.12, SH + 0.12, 0.09, 0.02, trim, -0.06, (SH + 0.12) / 2, 0.03).rbox(0.12, SH + 0.12, 0.09, 0.02, trim, SW + 0.06, (SH + 0.12) / 2, 0.03).rbox(SW + 0.24, 0.12, 0.09, 0.02, trim, SW / 2, SH + 0.06, 0.03); C.build();
    const pl = new THREE.Group(); E.add(pl); const pr = new THREE.Group(); pr.position.x = SW; E.add(pr);
    const lw = SW / 2 - 0.01; const leafL = (() => { const g = new THREE.Group(); rbox(lw, SH, 0.06, 0.015, walnut, lw / 2, SH / 2, 0, g, 2); rbox(lw * 0.7, 0.7, 0.02, 0.01, walnutD, lw / 2, 1.7, 0.035, g, 1); rbox(lw * 0.7, 1.0, 0.02, 0.01, walnutD, lw / 2, 0.72, 0.035, g, 1); rbox(lw * 0.1, 0.9, 0.04, 0.015, brass, lw - 0.1, 1.2, 0.05, g, 1); return g; })();
    const leafR = leafL.clone(); leafR.scale.x = -1; pl.add(leafL); pr.add(leafR);
    leafL.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); leafR.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    const vb = box(SW, SH, 1.4, voidMat, SW / 2, SH / 2, -0.72, E); vb.userData.noCast = true;
    // "SUITE" sign in brass + the KUR light box over the doors
    const sgn = new THREE.Group(); sgn.position.set(SW / 2, SH + 0.36, 0.06); E.add(sgn);
    const [c, g] = cnv(1100, 260); g.fillStyle = '#16121c'; g.fillRect(0, 0, 1100, 260); g.fillStyle = '#e9b54d'; g.font = '34px "Bebas Neue"'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('SUITE', 60, 112); g.fillText('307', 60, 152); g.textAlign = 'right'; g.fillText('IN', 1040, 112); g.fillText('PRODUCTION', 1040, 152);
    neonText(g, 'KUR', 550, 134, '230px "Bebas Neue"', '#e9b54d', 16);
    const kq = quad(2.75, 0.65, basic({ map: toTex(c), color: new THREE.Color(1.1, 1.1, 1.1) }), 0, 0, 0.02, sgn); kq.userData.noCast = true;
    rbox(2.86, 0.74, 0.05, 0.015, brass, 0, 0, -0.01, sgn, 2);
    const kgl = glow(0xe9b54d, 3.2, 0.12); kgl.position.set(0, 0, 0.3); sgn.add(kgl);
    const strip = quad(SW * 1.4, 1.2, basic({ map: gradTex, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), SW / 2, 0.006, 0.6, E); strip.rotation.x = -Math.PI / 2; strip.userData.noCast = true;
    const sp = spill(0xffffff, 3.0, 2.2, 0.34); sp.position.set(SW / 2, 0.008, 0.9); E.add(sp);
    const kL = new THREE.PointLight(KUR_HUES[0], LOW ? 0 : 3, 4, 2); kL.position.set(SW / 2, 0.2, 0.5); E.add(kL);
    const _a = new THREE.Color(), _b = new THREE.Color();
    up.push((dt, t) => { const sv = t * 0.22, i = Math.floor(sv), f = sv - i; _a.setHex(KUR_HUES[i % KUR_HUES.length]); _b.setHex(KUR_HUES[(i + 1) % KUR_HUES.length]); _a.lerp(_b, f * f * (3 - 2 * f)); strip.material.color.copy(_a).multiplyScalar(0.9); sp.material.color.copy(_a); kL.color.copy(_a); });
    [leafL, leafR, kq, strip, vb].forEach((o) => o.traverse((c2) => { c2.userData.go = 'kur'; if (c2.isMesh) hot.push(c2); }));
    doors.kur = { pivots: [pl, pr], open: 1.2, double: true, view: { pos: new THREE.Vector3(0, 1.6, Z1 + 3.0), target: new THREE.Vector3(0, 1.4, Z1) } };
  }

  // pendant globes down the ceiling
  for (const z of [1.6, -2.3, -7.4]) {
    const pend = z > 0, gy = pend ? H - 0.6 : H - 0.07;
    if (pend) { cyl(0.012, 0.012, 0.45, brass, 0, H - 0.22, z, s, 8); lathe([[0, 0], [0.09, 0], [0.07, 0.04], [0, 0.05]], brass, 0, H - 0.05, z, s, 20); }
    else { const fm = sph(0.2, std({ color: 0xfff2dc, emissive: 0xffd8a8, emissiveIntensity: 1.3, roughness: 0.4 }), 0, H - 0.02, z, s, 24); fm.scale.set(1, 0.32, 1); fm.userData.noCast = true; torus(0.2, 0.018, brass, 0, H - 0.015, z, s, 32).rotation.x = Math.PI / 2; }
    if (pend) { const globe = sph(0.17, std({ color: 0xfff2dc, emissive: 0xffd8a8, emissiveIntensity: 1.6, roughness: 0.4 }), 0, gy, z, s, 24); globe.userData.noCast = true; }
    const gl = glow(0xffd2a0, pend ? 1.3 : 1.0, pend ? 0.32 : 0.22); gl.position.set(0, gy - 0.04, z); s.add(gl);
    const L = new THREE.PointLight(0xffcf98, LOW ? 9 : 6, 8, 1.6); L.position.set(0, pend ? H - 0.75 : H - 0.3, z); s.add(L);
    if (!LOW && z === -2.3) { L.castShadow = true; L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -0.002; L.shadow.radius = 4; }
  }
  // furnishings between the doors
  { const t = new THREE.Group(); t.position.set(hx - 0.24, 0, 1.4); s.add(t); rbox(0.36, 0.05, 1.1, 0.015, walnut, 0, 0.82, 0, t, 2); [[-0.12, -0.48], [-0.12, 0.48], [0.12, -0.48], [0.12, 0.48]].forEach(([a, b]) => cyl(0.018, 0.012, 0.8, brass, a, 0.4, b, t, 8)); lampMini(t, 0, 0.85, -0.25, 0xe8d8b0, 0xffb060, LOW ? 0 : 2.5); lathe([[0, 0], [0.05, 0], [0.07, 0.12], [0.04, 0.24], [0.045, 0.28], [0, 0.28]], phys({ color: 0x2f6a8a, roughness: 0.2, clearcoat: 1 }), 0, 0.85, 0.28, t, 20); }
  frame(0.55, 0.42, paintingTex('clown'), s, -hx + 0.03, 1.65, -8.6, Math.PI / 2).rotation.z = 0.05;
  frame(0.9, 0.68, paintingTex('asteroid'), s, hx - 0.03, 1.6, -6.2, -Math.PI / 2);
  // the posters, framed between the doors
  [['hyodo', 0.65, -hx + 0.03, -2.6, Math.PI / 2], ['freddie', 0.68, -hx + 0.03, -4.55, Math.PI / 2], ['orchid', 0.68, hx - 0.03, -2.3, -Math.PI / 2], ['alien', 0.67, hx - 0.03, -4.9, -Math.PI / 2], ['kur', 0.8, hx - 0.03, -10.2, -Math.PI / 2]].forEach(([id, pw, x, z, ry]) => posterFrame('assets/posters/' + id + '.jpg', pw, 1.0, s, x, 1.62, z, ry));
  // room service tray outside FMK, half eaten
  { const t = new THREE.Group(); t.position.set(hx - 0.7, 0, -7.7); t.rotation.y = 0.3; s.add(t); rbox(0.5, 0.025, 0.36, 0.01, chromeM, 0, 0.013, 0, t, 1); const cl = lathe([[0, 0], [0.15, 0], [0.13, 0.08], [0.06, 0.13], [0.02, 0.14], [0.02, 0.16], [0, 0.16]], chromeM, -0.08, 0.025, 0, t, 24); cl.rotation.z = 0.0; lathe([[0, 0], [0.035, 0], [0.04, 0.1], [0, 0.1]], phys({ color: 0xffffff, transparent: true, opacity: 0.4, roughness: 0.05 }), 0.15, 0.025, 0.08, t, 14); const sp2 = sph(0.012, basic({ color: 0x7a0a0a }), 0.12, 0.03, -0.1, t, 6); }
  // fire hose cabinet, ash urn, smoke detectors
  { rbox(0.5, 0.7, 0.12, 0.02, std({ color: 0xa01a1a, roughness: 0.4 }), -hx + 0.07, 1.25, 2.8, s, 2).rotation.y = Math.PI / 2; const gq = quad(0.42, 0.5, phys({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0.05 }), -hx + 0.14, 1.27, 2.8, s); gq.rotation.y = Math.PI / 2; gq.userData.noCast = true; }
  { lathe([[0, 0], [0.16, 0], [0.16, 0.05], [0.09, 0.08], [0.08, 0.6], [0.14, 0.62], [0.15, 0.66], [0, 0.66]], chromeM, -hx + 0.35, 0, -10.6, s, 24); }
  [1.0, -4.9, -9.6].forEach((z) => cyl(0.06, 0.06, 0.03, std({ color: 0xf2efe8 }), 0.6, H - 0.015, z, s, 16));
  // dust in the light
  const dust = []; for (let i = 0; i < 46; i++) { const p = sph(0.005, basic({ color: 0xfff0d0, transparent: true, opacity: 0.5 }), R(-1.4, 1.4), R(0.4, 2.7), R(-10, 4), s, 4); p.userData.noCast = true; dust.push(p); }
  up.push((dt, t) => dust.forEach((p, i) => { p.position.y += Math.sin(t * 0.5 + i) * 0.0012; p.position.x += Math.cos(t * 0.3 + i) * 0.0008; }));
  M.build();
  return { scene: s, up, hot, doors, views: { hall: { pos: new THREE.Vector3(0, 1.62, 3.9), target: new THREE.Vector3(0, 1.42, -8), p: { pos: new THREE.Vector3(0, 1.62, 4.4), target: new THREE.Vector3(0, 1.38, -8), minH: 56, base: 64 } } } };
}

/* ================= CASINO: a roulette table you can actually play ================= */
export const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
export const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export function buildCasino(ctx) {
  const s = new THREE.Scene(); const up = [], hot = [];
  const w = 16, d = 12, h = 3.8;
  if (!VIDEO) roomBase(s, { ...ctx, w, d, h, wall: wallpaperTex(1800, 430, { bg: '#4a0e16', fg: '#c9a24a', kind: 'damask', scale: 64, wainscot: { col: '#2a1408', frac: 0.3 }, dirt: 0.5 }), floor: carpetTex(['#3a0812', '#c9a24a', '#1a0408'], 'diamond', [6, 4]), ceil: ceilingTex([4, 3], false), hemi: 0xffd8b0, hemiI: 0.22, trim: brass });
  else roomBase(s, { ...ctx, w, d, h, wall: paddedTex(), floor: woodTex(512, 512, '#2e1c12', 12, [6, 4], 0.35), ceil: { map: (() => { const [c, g] = cnv(64, 64); g.fillStyle = '#2a2230'; g.fillRect(0, 0, 64, 64); return toTex(c); })() }, hemi: 0xd8c8ff, hemiI: 0.3, trim: std({ color: 0x9a9aa6, roughness: 0.25, metalness: 0.8 }) });
  if (VIDEO) videoCasino(s, w, d, h, up);
  s.background = new THREE.Color(0x070305); s.fog = new THREE.FogExp2(VIDEO ? 0x3a2f4a : 0x3a2c22, VIDEO ? 0.045 : 0.04); // a little haze, so the far wall sits back in the smoke
  // ---- the table ----
  const T = new THREE.Group(); s.add(T);
  const wood = texMat(woodTex(512, 256, '#4a2614', 10), { roughness: 0.45 });
  rbox(4.1, 0.78, 1.7, 0.08, wood, 0.35, 0.39, 0, T, 3);
  rbox(4.3, 0.1, 1.9, 0.05, phys({ color: 0x3a1c0c, roughness: 0.35, clearcoat: 0.6 }), 0.35, 0.83, 0, T, 2);
  // felt with the betting layout
  const [fc, fg] = cnv(1024, 512); fg.fillStyle = '#0f5a34'; fg.fillRect(0, 0, 1024, 512); speckle(fg, 1024, 512, 9000, 0.25, ['#0a4a2a', '#147040']);
  fg.strokeStyle = 'rgba(240,235,210,.85)'; fg.lineWidth = 4; fg.font = '34px "Bebas Neue"'; fg.textAlign = 'center'; fg.textBaseline = 'middle';
  const gx = 150, gy = 70, cw = 64, ch = 82;
  fg.strokeRect(gx - 80, gy, 80, ch * 3); fg.fillStyle = '#f0ebd2'; fg.fillText('0', gx - 40, gy + ch * 1.5);
  for (let col = 0; col < 12; col++) for (let row = 0; row < 3; row++) { const n = col * 3 + (3 - row), x = gx + col * cw, y = gy + row * ch; fg.strokeRect(x, y, cw, ch); fg.fillStyle = REDS.has(n) ? '#c8202a' : '#141414'; fg.beginPath(); fg.ellipse(x + cw / 2, y + ch / 2, 22, 26, 0, 0, 7); fg.fill(); fg.fillStyle = '#f0ebd2'; fg.fillText(String(n), x + cw / 2, y + ch / 2 + 2); }
  ['1-18', 'EVEN', 'RED', 'BLACK', 'ODD', '19-36'].forEach((t, i) => { const x = gx + i * cw * 2, y = gy + ch * 3; fg.strokeRect(x, y, cw * 2, 70); if (t === 'RED' || t === 'BLACK') { fg.fillStyle = t === 'RED' ? '#c8202a' : '#141414'; fg.beginPath(); fg.moveTo(x + cw, y + 14); fg.lineTo(x + cw + 34, y + 35); fg.lineTo(x + cw, y + 56); fg.lineTo(x + cw - 34, y + 35); fg.closePath(); fg.fill(); } else { fg.fillStyle = '#f0ebd2'; fg.fillText(t, x + cw, y + 37); } });
  grime(fg, 1024, 512, 0.25);
  const felt = quad(3.3, 1.5, std({ map: toTex(fc), roughness: 0.95 }), 0.75, 0.885, 0, T); felt.rotation.x = -Math.PI / 2; felt.receiveShadow = true;
  // chips stacked on the felt
  const chipCols = [0xc8202a, 0x1a4ad0, 0x1a1a1a, 0x2a9a4a, 0xe8e2d0];
  for (let k = 0; k < 7; k++) { const x = R(0.2, 2.0), z = R(-0.55, 0.55), n = RI(2, 7), cm = std({ color: pick(chipCols), roughness: 0.4 }); for (let j = 0; j < n; j++) cyl(0.04, 0.04, 0.012, cm, x + R(-0.004, 0.004), 0.892 + j * 0.0125, z, T, 18); }
  // ---- the wheel ----
  const W = new THREE.Group(); W.position.set(-1.25, 0.86, 0); T.add(W);
  lathe([[0.4, 0.0], [0.66, 0.0], [0.7, 0.06], [0.66, 0.15], [0.6, 0.165], [0.5, 0.11], [0.43, 0.075]], texMat(woodTex(256, 128, '#3a1c0c', 8), { roughness: 0.35 }), 0, 0, 0, W, 72);
  lathe([[0.43, 0.075], [0.5, 0.11], [0.6, 0.165]], phys({ color: 0x2a1a10, roughness: 0.25, clearcoat: 0.8 }), 0, 0.002, 0, W, 72);
  const RT = new THREE.Group(); RT.position.y = 0.04; W.add(RT);
  const S = 1024, [pc, pg] = cnv(S, S), cx = S / 2, rad = (r) => (r / 0.42) * (S / 2);
  pg.fillStyle = '#3a2412'; pg.fillRect(0, 0, S, S);
  for (let k = 0; k < 37; k++) {
    const n = WHEEL[k], a = (k / 37) * Math.PI * 2, da = Math.PI / 37, col = n === 0 ? '#118a3a' : REDS.has(n) ? '#b81c26' : '#141214';
    pg.fillStyle = col; pg.beginPath(); pg.arc(cx, cx, rad(0.42), a - da, a + da); pg.arc(cx, cx, rad(0.27), a + da, a - da, true); pg.closePath(); pg.fill();
    pg.save(); pg.translate(cx + Math.cos(a) * rad(0.39), cx + Math.sin(a) * rad(0.39)); pg.rotate(a + Math.PI / 2); pg.fillStyle = '#f2ead6'; pg.font = '40px "Bebas Neue"'; pg.textAlign = 'center'; pg.textBaseline = 'middle'; pg.fillText(String(n), 0, 2); pg.restore();
  }
  pg.strokeStyle = '#c9a24a'; pg.lineWidth = 5; [0.36, 0.42, 0.27].forEach((r) => { pg.beginPath(); pg.arc(cx, cx, rad(r) - 2, 0, 7); pg.stroke(); });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.42, 111, 1).rotateX(-Math.PI / 2), std({ map: toTex(pc), roughness: 0.45 })); RT.add(ring);
  // pocket frets
  const fretM = phys({ color: 0xd8d4c8, metalness: 1, roughness: 0.25 });
  for (let k = 0; k < 37; k++) { const a = ((k + 0.5) / 37) * Math.PI * 2, f = box(0.09, 0.022, 0.005, fretM, Math.cos(a) * 0.315, 0.011, Math.sin(a) * 0.315, RT); f.rotation.y = -a; }
  // centre cone and the cross handle
  lathe([[0.27, 0], [0.22, 0.03], [0.12, 0.07], [0.05, 0.085], [0.035, 0.14], [0.05, 0.16], [0.02, 0.19], [0, 0.2]], texMat(woodTex(128, 64, '#5a3018', 4), { roughness: 0.3 }), 0, 0, 0, RT, 48);
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2, arm = cyl(0.008, 0.008, 0.16, fretM, Math.cos(a) * 0.08, 0.165, Math.sin(a) * 0.08, RT, 8); arm.rotation.z = Math.PI / 2; arm.rotation.y = -a; sph(0.016, fretM, Math.cos(a) * 0.16, 0.165, Math.sin(a) * 0.16, RT, 10); }
  const ball = sph(0.017, phys({ color: 0xffffff, roughness: 0.15, clearcoat: 1 }), 0.315, 0.06, 0, W, 16); ball.castShadow = true;
  // spin state: rotor angle th; ball at world angle phi, radius br, height by
  let th = 0, idleW = 0.35, spin = null, pocket = 0;
  const posBall = (phi, r, y) => ball.position.set(Math.cos(phi) * r, y, Math.sin(phi) * r);
  const bounce = (u) => { const n1 = 7.5625, d1 = 2.75; if (u < 1 / d1) return n1 * u * u; if (u < 2 / d1) return n1 * (u -= 1.5 / d1) * u + 0.75; if (u < 2.5 / d1) return n1 * (u -= 2.25 / d1) * u + 0.9375; return n1 * (u -= 2.625 / d1) * u + 0.984375; };
  up.push((dt) => {
    if (spin) {
      spin.t += dt; const sk = Math.min(1, spin.t / spin.T);
      th = spin.th0 + spin.w0 * spin.T * (sk - 0.42 * sk * sk);
      const phi = (pocket / 37) * Math.PI * 2 + th + spin.K * Math.pow(1 - sk, 3);
      let r = 0.545, y = 0.152 + 0.004 * Math.sin(spin.t * 30) * (1 - sk), hop = 0;
      if (sk > 0.58) { const u = Math.min(1, (sk - 0.58) / 0.12), e = bounce(u); r = 0.545 + (0.31 - 0.545) * e; y = 0.152 + (0.057 - 0.152) * e; }
      // in the pocket ring it clatters off the frets: hops back and forth across a few pockets, each one a little smaller
      if (sk > 0.68 && sk < 0.95) { const v = (sk - 0.68) / 0.27, D = Math.pow(1 - v, 1.7); hop = 0.36 * D * Math.sin(v * Math.PI * 5.2 + 0.5); y += 0.034 * D * Math.abs(Math.sin(v * Math.PI * 10.4)); r += 0.018 * D * Math.abs(Math.sin(v * Math.PI * 10.4 + 0.7)); }
      posBall(phi + hop, r, y);
      if (sk > 0.6) { const slot = Math.floor((phi + hop - th) / ((Math.PI * 2) / 37) + 0.5); if (spin.slot !== undefined && slot !== spin.slot && spin.t - (spin.lastTick || 0) > 0.045) { spin.lastTick = spin.t; ctx.onFret && ctx.onFret(sk < 0.7 ? 0.12 : 0.2 * (1.15 - sk)); } spin.slot = slot; }
      if (sk >= 1) { idleW = spin.w0 * 0.16; const done = spin.done; spin = null; done(); }
    } else { th += idleW * dt; idleW = Math.max(0.25, idleW - dt * 0.05); posBall((pocket / 37) * Math.PI * 2 + th, 0.31, 0.057); }
    RT.rotation.y = -th;
  });
  const wheel = { spin(k, T = 6) { pocket = k; return new Promise((done) => { spin = { t: 0, T, th0: th, w0: 3.6, K: Math.PI * 2 * 7 + R(0, 1), done }; }); }, get spinning() { return !!spin; } };
  // ---- lights: lamp over the table, chandelier ----
  const shade = lathe([[0, 0], [0.75, 0], [0.7, 0.18], [0.06, 0.24], [0, 0.24]], std({ color: 0x0f3a24, roughness: 0.4, side: THREE.DoubleSide }), 0.1, h - 1.25, 0, s, 48);
  cyl(0.01, 0.01, 1.0, brass, 0.1, h - 0.5, 0, s, 6);
  const tl = new THREE.SpotLight(0xfff0d0, 46, 6, 0.95, 0.5, 1.3); tl.position.set(0.1, h - 1.3, 0); tl.target.position.set(0.1, 0, 0); tl.castShadow = !LOW; tl.shadow.mapSize.set(1024, 1024); tl.shadow.bias = -0.0005; s.add(tl, tl.target);
  const tglow = glow(0xfff0c8, 1.4, 0.25); tglow.position.set(0.1, h - 1.3, 0); s.add(tglow);
  if (!VIDEO) { const chan = new THREE.Group(); chan.position.set(-3.6, h - 0.75, -1.8); s.add(chan);
  cyl(0.01, 0.01, 0.6, brass, 0, 0.45, 0, chan, 6); lathe([[0, -0.25], [0.18, -0.2], [0.32, 0.0], [0.3, 0.06], [0, 0.1]], brass, 0, 0, 0, chan, 32);
  for (let k = 0; k < 40; k++) { const a = R(0, 6.28), rr = R(0.1, 0.34); const cr = sph(0.022, phys({ color: 0xffffff, roughness: 0, transmission: 0, transparent: true, opacity: 0.7, clearcoat: 1 }), Math.cos(a) * rr, R(-0.4, -0.12), Math.sin(a) * rr, chan, 8); cr.userData.noCast = true; }
  const chL = new THREE.PointLight(0xffd8a0, 9, 8, 1.6); chL.position.set(0, -0.3, 0); chan.add(chL); }
  // ---- banks of slot machines that play themselves ----
  const bank = [];
  for (let k = 0; k < 11; k++) bank.push([-6.6 + k * 1.32, -d / 2 + 0.55, 0]);                       // along the back wall
  for (let k = 0; k < 6; k++) { bank.push([5.25, -3.6 + k * 1.2, Math.PI / 2]); bank.push([6.75, -3.6 + k * 1.2, -Math.PI / 2]); } // double bank, right
  for (let k = 0; k < 4; k++) bank.push([-4.0, -3.2 + k * 1.2, Math.PI / 2]);                        // left bank, a step back from the roulette table
  for (let k = 0; k < 2; k++) bank.push([-5.5, -3.2 + k * 1.2, -Math.PI / 2]);
  const CX = -3.6, CZ = 3.15, CR = 1.17; for (let k = 0; k < 8; k++) { const a = 0.466 + (k / 8) * Math.PI * 2; bank.push([CX + Math.sin(a) * CR, CZ + Math.cos(a) * CR, a]); } // slot carousel, front left
  slotBank(s, up, bank, ctx.onSlotWin, VIDEO ? { video: true, cols: [0xb8b8c4, 0x8a8c96, 0xa8a0b8, 0x9aa4b0, 0x7a7684, 0xc8c8d0], seat: 0xb03072 } : null);
  { // carousel core: lacquered drum, a turning marquee, chasing bulbs
    cyl(0.86, 0.86, 2.36, std({ color: 0x3a0812, roughness: 0.35, metalness: 0.3 }), CX, 1.18, CZ, s, 32);
    const [mc, mg] = cnv(2048, 176); mg.fillStyle = '#12060c'; mg.fillRect(0, 0, 2048, 176); mg.fillStyle = '#c9a24a'; mg.fillRect(0, 8, 2048, 5); mg.fillRect(0, 163, 2048, 5);
    const words = [['GAMBLE MORE NOW!', 768], ['777', 256], ['MORE MORE MORE!', 768], ['777', 256]]; let wx = 0; words.forEach(([w2, ww], i) => { mg.font = fitFont(mg, w2, '104px "Bebas Neue"', ww - 70); neonText(mg, w2, wx + ww / 2, 92, mg.font, i % 2 ? '#ffc84a' : '#ff5fd8', 12); wx += ww;
      const x = wx, y = 88, r = 18; mg.save(); mg.shadowColor = '#ffc84a'; mg.shadowBlur = 16; mg.fillStyle = '#fff6d8'; mg.beginPath(); mg.moveTo(x, y - r); mg.quadraticCurveTo(x, y, x + r, y); mg.quadraticCurveTo(x, y, x, y + r); mg.quadraticCurveTo(x, y, x - r, y); mg.quadraticCurveTo(x, y, x, y - r); mg.fill(); mg.restore(); });
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.6, 64, 1, true), basic({ map: toTex(mc) })); drum.position.set(CX, 2.72, CZ); s.add(drum);
    const capM = std({ color: 0x1a0a0e, roughness: 0.5 }); const capT = new THREE.Mesh(new THREE.CircleGeometry(1.12, 48).rotateX(-Math.PI / 2), capM); capT.position.set(CX, 3.02, CZ); s.add(capT); const capB = new THREE.Mesh(new THREE.CircleGeometry(1.12, 48).rotateX(Math.PI / 2), capM); capB.position.set(CX, 2.42, CZ); s.add(capB);
    up.push((dt) => { drum.rotation.y += dt * 0.12; });
    const nb = 60, bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.026, 8, 6), basic({ color: 0xffffff }), nb * 2), mt = new THREE.Matrix4(), cc = new THREE.Color();
    for (let k = 0; k < nb * 2; k++) { const a = (((k % nb) + (k >= nb ? 0.5 : 0)) / nb) * Math.PI * 2; mt.makeTranslation(CX + Math.sin(a) * 1.15, k < nb ? 2.45 : 2.99, CZ + Math.cos(a) * 1.15); bulbs.setMatrixAt(k, mt); bulbs.setColorAt(k, cc.setHex(0xffd27a)); }
    s.add(bulbs); let last = -1; up.push((dt, t) => { const st = Math.floor(t * 9); if (st === last) return; last = st; for (let k = 0; k < nb * 2; k++) bulbs.setColorAt(k, cc.setHex((k + st) % 4 === 0 ? 0xfff4d0 : 0x7a4a18)); bulbs.instanceColor.needsUpdate = true; });
    const mgl = glow(0xff5fd8, 4.2, 0.22); mgl.position.set(CX, 2.72, CZ); s.add(mgl);
  }
  // ---- the bar on the left wall ----
  const bar = new THREE.Group(); bar.position.set(-w / 2 + 1.2, 0, 1.0); bar.rotation.y = Math.PI / 2; s.add(bar);
  rbox(4.2, 1.08, 0.7, 0.04, wood, 0, 0.54, 0, bar, 2); [-1.6, -0.4, 0.8].forEach((x) => { lathe([[0, 0], [0.04, 0], [0.004, 0.012], [0.004, 0.07], [0.045, 0.12], [0, 0.12]], phys({ color: 0xffffff, transparent: true, opacity: 0.4, roughness: 0.05 }), x, 1.15, 0.15, bar, 14); cyl(0.06, 0.045, 0.025, std({ color: 0x2a2a2a, roughness: 0.4 }), x + 0.3, 1.16, 0.2, bar, 16); }); rbox(4.4, 0.07, 0.85, 0.03, phys({ color: 0x2a1a10, roughness: 0.2, clearcoat: 1 }), 0, 1.115, 0.05, bar, 2);
  rbox(4.0, 0.04, 0.3, 0.01, wood, 0, 1.55, -0.95, bar, 1); rbox(4.0, 0.04, 0.3, 0.01, wood, 0, 2.0, -0.95, bar, 1);
  for (let k = 0; k < 26; k++) { const x = -1.9 + (k % 13) * 0.3 + R(-0.04, 0.04), y = k < 13 ? 1.57 : 2.02; lathe([[0, 0], [0.045, 0], [0.045, 0.18], [0.018, 0.24], [0.016, 0.3], [0, 0.3]], phys({ color: pick([0x2a6a2a, 0x8a4a10, 0xd8d0c0, 0x5a1020, 0x1a3a6a]), roughness: 0.1, transparent: true, opacity: 0.85, clearcoat: 1 }), x, y, -0.95, bar, 12); }
  [-1.2, 0, 1.2].forEach((x) => { cyl(0.025, 0.03, 0.75, fretM, x, 0.375, 0.85, bar, 10); cyl(0.2, 0.2, 0.08, phys({ color: 0x8a1a2a, roughness: 0.4, clearcoat: 0.5 }), x, 0.78, 0.85, bar, 24); });
  const [bc, bg] = cnv(512, 160); neonText(bg, 'BAR', 256, 84, '120px "Bebas Neue"', '#4ad0ff', 14); const bq = neonQuad(bc, 1.6, 0.5, 1.05); bq.position.set(1.3, 2.7, -1.0); bar.add(bq);
  // ---- CASINO neon on the back wall, velvet ropes ----
  const [cc, cg] = cnv(1024, 220); neonText(cg, 'Casino', 512, 116, '170px "Yellowtail"', '#ff5fd8', 16); const cq = neonQuad(cc, 3.6, 0.78, 1.05); cq.position.set(-3.4, VIDEO ? 2.88 : 3.1, -d / 2 + 0.06); s.add(cq);
  const [jc, jg] = cnv(1024, 200); neonText(jg, 'JACKPOT', 512, 104, '150px "Bebas Neue"', '#ffc84a', 14); const jq = neonQuad(jc, 4.2, 0.82, 1.05); jq.position.set(2.4, VIDEO ? 2.9 : 3.15, -d / 2 + 0.06); s.add(jq);
  const [sc7, sg7] = cnv(512, 220); neonText(sg7, '777', 256, 116, '190px "Bebas Neue"', '#ff3b3b', 14); const q7 = neonQuad(sc7, 1.9, 0.82, 1.05); q7.position.set(w / 2 - 0.06, VIDEO ? 2.84 : 3.0, -0.3); q7.rotation.y = -Math.PI / 2; s.add(q7);
  const [wc2, wg2] = cnv(512, 160); neonText(wg2, 'WIN WIN WIN', 256, 84, '96px "Bebas Neue"', '#4ad0ff', 12); const qw = neonQuad(wc2, 2.6, 0.8, 1.05); qw.position.set(w / 2 - 0.06, VIDEO ? 2.84 : 3.0, 3.6); qw.rotation.y = -Math.PI / 2; s.add(qw);
  flickerUp(up, jq.material, 0.6); flickerUp(up, qw.material, 1.4);
  const cL = new THREE.PointLight(0xff5fd8, 5, 7, 1.6); cL.position.set(-3.4, 2.8, -d / 2 + 0.9); s.add(cL);
  const jL = new THREE.PointLight(0xffc84a, 5, 8, 1.6); jL.position.set(3.0, 2.8, -d / 2 + 1.2); s.add(jL);
  // ---- blackjack table, cashier cage, palms, ceiling lights, smoke ----
  if (!VIDEO) blackjack(s, 2.4, 3.2, -0.5, wood);
  if (!VIDEO) { const cg2 = new THREE.Group(); cg2.position.set(-w / 2 + 1.0, 0, -d / 2 + 1.6); s.add(cg2); rbox(1.8, 1.1, 0.6, 0.03, wood, 0, 0.55, 0, cg2, 2); rbox(1.9, 0.06, 0.7, 0.02, brass, 0, 1.13, 0, cg2, 1);
    for (let k = 0; k < 14; k++) cyl(0.012, 0.012, 1.3, brass, -0.85 + k * 0.13, 1.8, 0.2, cg2, 6); rbox(1.9, 0.08, 0.06, 0.02, brass, 0, 2.47, 0.2, cg2, 1);
    const [kc, kg] = cnv(512, 120); kg.fillStyle = '#1a1210'; kg.fillRect(0, 0, 512, 120); kg.fillStyle = '#e8c860'; kg.font = '84px "Bebas Neue"'; kg.textAlign = 'center'; kg.textBaseline = 'middle'; kg.fillText('CASHIER', 256, 64); quad(1.7, 0.4, basic({ map: toTex(kc) }), 0, 2.75, 0.2, cg2); }
  if (!VIDEO) { palm(s, -w / 2 + 0.6, 0, d / 2 - 0.8); palm(s, w / 2 - 0.6, 0, d / 2 - 0.8); palm(s, -w / 2 + 0.6, 0, -1.0); }
  { const n = 70, im = new THREE.InstancedMesh(new THREE.CircleGeometry(0.06, 12).rotateX(Math.PI / 2), basic({ color: 0xfff0c8 }), n), mt = new THREE.Matrix4(); for (let k = 0; k < n; k++) { mt.makeTranslation(R(-w / 2 + 0.5, w / 2 - 0.5), h - 0.01, R(-d / 2 + 0.5, d / 2 - 0.5)); im.setMatrixAt(k, mt); } s.add(im); }
  casinoSmoke(s, up, w, d);
  const velvet = std({ color: 0x8a0f1a, roughness: 0.8 });
  [[2.6, 1.6], [2.6, -1.6]].forEach(([x, z]) => { cyl(0.03, 0.05, 0.9, brass, x, 0.45, z, s, 12); sph(0.05, brass, x, 0.92, z, s, 12); cyl(0.12, 0.14, 0.04, brass, x, 0.02, z, s, 16); });
  { const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(2.6, 0.85, 1.6), new THREE.Vector3(2.6, 0.55, 0), new THREE.Vector3(2.6, 0.85, -1.6)]); const rope = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.025, 8), velvet); rope.castShadow = true; s.add(rope); }
  T.traverse((o) => { if (o.isMesh) { o.castShadow = o.castShadow || !o.material.transparent; o.receiveShadow = true; } });
  return { scene: s, up, hot, wheel, views: { table: { pos: new THREE.Vector3(2.6, 2.85, 5.2), target: new THREE.Vector3(-2.6, 0.95, -1.0), p: { pos: new THREE.Vector3(1.75, 1.28, 1.25), target: new THREE.Vector3(-1.08, -0.18, 0.07) } }, wheel: { pos: new THREE.Vector3(-0.62, 1.62, 0.66), target: new THREE.Vector3(-1.25, 0.86, 0.0), p: { pos: new THREE.Vector3(-1.25, 2.05, 0.62), target: new THREE.Vector3(-1.25, 0.86, -0.06) } } } };
}

/* ---- casino pieces ---- */
// cocktails: a few glass shapes, a glowing pour in each. Each drink owns its materials so a swapped-out one can be thrown away cleanly
const DRINKS = [['martini', 0xff7ad8], ['highball', 0x7af4ff], ['coupe', 0xffb347], ['rocks', 0xffa040], ['martini', 0x9dff6a], ['highball', 0xd07aff], ['coupe', 0xff5f7a]];
function mkDrink(kind, col) {
  const g = new THREE.Group(), glass = phys({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.42, clearcoat: 1 }), pour = basic({ color: col });
  if (kind === 'martini') { lathe([[0, 0], [0.03, 0], [0.006, 0.01], [0.006, 0.08], [0.05, 0.14], [0, 0.135]], glass, 0, 0, 0, g, 16); cyl(0.04, 0.004, 0.04, pour, 0, 0.115, 0, g, 12); sph(0.009, basic({ color: 0x8aa83a }), 0.012, 0.112, 0, g, 8); }
  else if (kind === 'highball') { lathe([[0, 0], [0.028, 0], [0.03, 0.15], [0.026, 0.15], [0.024, 0.006], [0, 0.006]], glass, 0, 0, 0, g, 16); cyl(0.024, 0.023, 0.11, pour, 0, 0.062, 0, g, 12); cyl(0.003, 0.003, 0.2, basic({ color: 0xffffff }), 0.012, 0.12, 0, g, 6).rotation.z = 0.18; }
  else if (kind === 'coupe') { lathe([[0, 0], [0.032, 0], [0.006, 0.01], [0.006, 0.07], [0.05, 0.1], [0.055, 0.12], [0, 0.1]], glass, 0, 0, 0, g, 16); cyl(0.05, 0.03, 0.022, pour, 0, 0.104, 0, g, 14); sph(0.01, basic({ color: 0xd0142a }), 0.02, 0.122, 0, g, 8); }
  else { lathe([[0, 0], [0.036, 0], [0.038, 0.085], [0.034, 0.085], [0.032, 0.008], [0, 0.008]], glass, 0, 0, 0, g, 16); cyl(0.032, 0.031, 0.05, pour, 0, 0.034, 0, g, 12); box(0.03, 0.03, 0.03, phys({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.1 }), 0.006, 0.06, 0.004, g).rotation.set(0.3, 0.5, 0.2); }
  g.traverse((o) => { o.userData.noBatch = true; }); return g;
}
const BOTTLES = [0x2a6a2a, 0x8a4a10, 0xd8d0c0, 0x5a1020, 0x1a3a6a, 0x6a2a7a];
function mkBottle(col) { const g = new THREE.Group(); lathe([[0, 0], [0.035, 0], [0.035, 0.16], [0.012, 0.22], [0.012, 0.26], [0, 0.26]], phys({ color: col, roughness: 0.1, transparent: true, opacity: 0.85, clearcoat: 1 }), 0, 0, 0, g, 12);
  cyl(0.0365, 0.0365, 0.05, std({ color: 0xefe6d0, roughness: 0.6 }), 0, 0.09, 0, g, 12); cyl(0.013, 0.013, 0.018, std({ color: 0x1a1a1c, roughness: 0.4 }), 0, 0.268, 0, g, 8); g.traverse((o) => { o.userData.noBatch = true; }); return g; }
/* the waiter: the diner robot's big cousin on a chrome neck. Every half minute or so it does a round of its stops: at each one it takes the thing there in through the lid in its head and pops a different one out in its place */
function waiterBot(s, up, stops, home, homePath) {
  const shell = phys({ color: 0xe9dfc6, roughness: 0.45, clearcoat: 0.4 }), trimR = phys({ color: 0xb81c2a, roughness: 0.4, clearcoat: 0.5 }), chromeS = phys({ color: 0xd8d8dc, metalness: 1, roughness: 0.22 });
  const rb = new THREE.Group(); rb.position.set(home[0], 0, home[1]); s.add(rb); const body = new THREE.Group(); rb.add(body);
  cyl(0.24, 0.27, 0.13, shell, 0, 0.085, 0, rb, 32); cyl(0.275, 0.275, 0.03, trimR, 0, 0.03, 0, rb, 32); torus(0.242, 0.008, chromeS, 0, 0.152, 0, rb, 48).rotation.x = Math.PI / 2;
  const under = spill(0x7af4ff, 1.0, 1.0, 0.22); under.position.y = 0.006; rb.add(under);
  cyl(0.034, 0.042, 0.5, chromeS, 0, 0.4, 0, body, 12);
  rbox(0.52, 0.36, 0.28, 0.045, shell, 0, 0.82, 0, body, 3); box(0.53, 0.05, 0.285, trimR, 0, 0.672, 0, body); box(0.29, 0.123, 0.012, std({ color: 0x14161a, roughness: 0.3 }), 0, 0.865, 0.141, body);
  const eyeM = basic({ color: 0x7fe8ff }), eyes = [-0.065, 0.065].map((ex) => { const e = cyl(0.02, 0.02, 0.006, eyeM, ex, 0.872, 0.149, body, 14); e.rotation.x = Math.PI / 2; return e; });
  cyl(0.006, 0.006, 0.13, chromeS, 0.19, 1.065, -0.07, body, 6); const bulbM = basic({ color: 0xff3a3a }); sph(0.017, bulbM, 0.19, 1.135, -0.07, body, 10);
  const lid = new THREE.Group(); lid.position.set(0, 1.0, -0.12); body.add(lid); box(0.44, 0.016, 0.24, chromeS, 0, 0.008, 0.12, lid);
  rb.traverse((o) => { o.userData.noBatch = true; }); rb.name = 'waiter';
  const V3 = THREE.Vector3, sm = (k) => k * k * (3 - 2 * k), wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let h = 0, moving = 0, steps = [], si = 0, st = 0, wait = R(4, 7), t = 0, t0 = 0, blink = 3;
  const path = (pts) => new THREE.CatmullRomCurve3([new V3(rb.position.x, 0, rb.position.z), ...pts.map(([x, z]) => new V3(x, 0, z))], false, 'centripetal');
  const turn = (to) => { let h0 = 0, dh = 0; return { init(S) { h0 = h; dh = wrap((typeof to === 'function' ? to() : to) - h); S.dur = Math.abs(dh) / 2.4 + 0.15; }, fn(k) { h = h0 + dh * sm(k); } }; };
  const drive = (pts) => { let c = null; return { init(S) { c = path(pts); S.dur = c.getLength() / 0.48 + 0.5; }, fn(k, d) { const u = sm(k), p = c.getPointAt(u), tg = c.getTangentAt(Math.min(0.999, Math.max(0.001, u))); rb.position.set(p.x, 0, p.z); h += wrap(Math.atan2(tg.x, tg.z) - h) * Math.min(1, d * 9); moving = Math.sin(Math.PI * k); } }; };
  const reverse = (dist) => { let p0 = null; return { dur: dist / 0.25 + 0.3, init() { p0 = rb.position.clone(); }, fn(k) { const e = sm(k); rb.position.set(p0.x - Math.sin(h) * dist * e, 0, p0.z - Math.cos(h) * dist * e); moving = 0.4 * Math.sin(Math.PI * k); } }; };
  const lidTo = (a, dur = 0.3) => { let a0 = 0; return { dur, init() { a0 = lid.rotation.x; }, fn(k) { lid.rotation.x = a0 + (a - a0) * sm(k); } }; };
  const head = () => { rb.updateMatrixWorld(true); return rb.localToWorld(new V3(0, 1.04, 0)); };
  const startTan = (pts) => () => { const tg = path(pts).getTangentAt(0); return Math.atan2(tg.x, tg.z); };
  const swap = (S) => { let P = null, H = null, nd = null;
    return [turn(() => Math.atan2(S.obj.position.x - rb.position.x, S.obj.position.z - rb.position.z)), lidTo(-1.9),
      { dur: 0.62, init() { P = S.obj.position.clone(); H = head(); }, fn(k) { S.obj.position.lerpVectors(P, H, k); S.obj.position.y += 0.34 * 4 * k * (1 - k); S.obj.scale.setScalar(1 - 0.35 * k); S.obj.rotation.z = 0.6 * Math.sin(k * Math.PI); if (k >= 1) S.obj.visible = false; } },
      lidTo(0, 0.28), { dur: 0.8, fn(k) { eyes.forEach((e) => (e.scale.z = k < 0.9 ? 0.25 : 1)); } }, lidTo(-1.9, 0.28),
      { dur: 0.66, init() { let rc; do { rc = pick(S.list); } while (rc === S.cur); S.cur = rc; nd = S.make(rc); s.add(nd); H = head(); nd.position.copy(H); nd.scale.setScalar(0.65); },
        fn(k) { nd.position.lerpVectors(H, P, k); nd.position.y += 0.36 * 4 * k * (1 - k); nd.scale.setScalar(0.65 + 0.35 * k); nd.rotation.z = -0.5 * Math.sin(k * Math.PI);
          if (k >= 1) { const old = S.obj; s.remove(old); old.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); S.obj = nd; } } },
      { dur: 0.22, fn(k) { const q = Math.sin(k * Math.PI) * 0.12; nd.scale.set(1 + q, 1 - q, 1 + q); } }, lidTo(0), reverse(S.rev)]; };
  const plan = () => { const out = []; stops.forEach((S) => out.push(turn(startTan(S.path)), drive(S.path), ...swap(S))); out.push(turn(startTan(homePath)), drive(homePath), turn(0)); return out; };
  rb.userData.state = () => ({ si, n: steps.length, wait });
  up.push((dt) => { const d = Math.min(dt, 0.05); t += d;
    if (si >= steps.length) { moving = 0; if ((wait -= d) <= 0) { steps = plan(); si = 0; st = 0; t0 = t; steps[0].init?.(steps[0]); } }
    else { const S = steps[si]; st += d; const k = Math.min(1, st / S.dur); S.fn?.(k, d); if (k >= 1) { si++; st = 0; if (si < steps.length) steps[si].init?.(steps[si]); else { wait = Math.max(5, R(30, 34) - (t - t0)); moving = 0; } } }
    rb.rotation.y = h; body.position.y = 0.004 * Math.sin(t * 15) * moving; body.rotation.x = 0.05 * moving;
    if ((blink -= d) < 0) { blink = R(2.5, 6); } if (si >= steps.length || !steps.length) eyes.forEach((e) => (e.scale.z = blink < 0.12 ? 0.15 : 1));
    bulbM.color.setHex(Math.sin(t * (si < steps.length ? 9 : 2.2)) > 0.6 ? 0xff5a4a : 0x6a1410); });
}
/* smoke hanging in the casino: one instanced batch of soft billboards that drift and turn very slowly. One draw call, a single texture read per pixel */
let _smokeTex = null;
function smokeTex() {
  if (_smokeTex) return _smokeTex; const S = 128, [c, g] = cnv(S * 2, S * 2), im = g.createImageData(S * 2, S * 2), D = im.data;
  for (let q = 0; q < 4; q++) { const ox = (q % 2) * S, oy = Math.floor(q / 2) * S, sd = q * 17.3 + 3.1;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const u = (x + 0.5) / S - 0.5, v = (y + 0.5) / S - 0.5, r = Math.hypot(u, v) * 2;
      const wx = fbm(u * 3 + sd, v * 3, sd, 3) * 1.2, wy = fbm(u * 3, v * 3 + sd, sd + 5, 3) * 1.2, n = fbm(u * 4 + wx, v * 4 + wy, sd * 0.37, 4);
      const a = Math.pow(Math.max(0, 1 - r), 1.25) * Math.min(1, Math.max(0, (n - 0.2) * 1.8)), i = ((oy + y) * S * 2 + ox + x) * 4; D[i] = D[i + 1] = D[i + 2] = Math.round(a * 255); D[i + 3] = 255; } }
  g.putImageData(im, 0, 0); _smokeTex = toTex(c, null, false); return _smokeTex;
}
function casinoSmoke(s, up, w, d) {
  const N = LOW ? 9 : 16, geo = new THREE.PlaneGeometry(1, 1), aP = new Float32Array(N * 4), mt = new THREE.Matrix4();
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uMap: { value: smokeTex() }, uCol: { value: new THREE.Color(0xb4a8c4) } }, transparent: true, depthWrite: false,
    vertexShader: `attribute vec4 aP; uniform float uT; varying vec2 vUv; varying float vA;
      void main() { vec4 c = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float ph = aP.y;
        c.xyz += vec3(sin(uT * 0.05 + ph) * 0.7, sin(uT * 0.07 + ph * 1.7) * 0.12, cos(uT * 0.04 + ph * 1.3) * 0.7);
        vec4 mv = modelViewMatrix * c; float an = ph * 6.2831 + uT * (0.01 + 0.012 * fract(ph * 7.3)) * (fract(ph * 3.1) < 0.5 ? -1.0 : 1.0);
        mv.xy += mat2(cos(an), sin(an), -sin(an), cos(an)) * position.xy * aP.x; gl_Position = projectionMatrix * mv;
        vUv = (uv + vec2(mod(aP.z, 2.0), floor(aP.z / 2.0))) * 0.5;
        vA = aP.w * (0.7 + 0.3 * sin(uT * 0.11 + ph * 2.3)) * smoothstep(0.9, 3.0, -mv.z); }`,
    fragmentShader: `uniform sampler2D uMap; uniform vec3 uCol; varying vec2 vUv; varying float vA;
      void main() { float a = texture2D(uMap, vUv).r * vA; if (a < 0.002) discard; gl_FragColor = vec4(uCol, a);
        #include <colorspace_fragment>
      }` });
  const im = new THREE.InstancedMesh(geo, mat, N);
  for (let k = 0; k < N; k++) { const hi = k < N * 0.65; let x, y, z, n = 0; do { x = R(-w / 2 + 1.5, w / 2 - 1.5); z = R(-d / 2 + 1.2, d / 2 - 2.0); y = hi ? R(2.5, 3.2) : R(1.7, 2.3); } while (n++ < 40 && (Math.hypot(x - 2.6, z - 5.2) < 3.2 || (!hi && Math.hypot(x + 0.9, z) < 2.2)));
    mt.makeTranslation(x, y, z); im.setMatrixAt(k, mt); aP.set([hi ? R(3.0, 4.6) : R(2.2, 3.2), R(0, 100), RI(0, 3), hi ? R(0.55, 0.85) : R(0.4, 0.6)], k * 4); }
  geo.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4)); im.frustumCulled = false; im.renderOrder = 3; im.userData.noBatch = true; im.userData.noCast = true; s.add(im);
  up.push((dt) => { mat.uniforms.uT.value += Math.min(dt, 0.05); });
}
// video look: upholstered walls, curved warm coves, a recessed ring dome with downlights, a round CASINO bar, a pit in the aisle
function paddedTex() {
  const W = 1800, H = 430, [c, g] = cnv(W, H), [hc, hg] = cnv(W, H), top = H * 0.66;
  g.fillStyle = '#5c5068'; g.fillRect(0, 0, W, H); hg.fillStyle = '#808080'; hg.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 30) { const gr = g.createLinearGradient(x, 0, x + 30, 0); gr.addColorStop(0, '#463c52'); gr.addColorStop(0.5, '#6a5e78'); gr.addColorStop(1, '#463c52'); g.fillStyle = gr; g.fillRect(x, 0, 30, top); const hgr = hg.createLinearGradient(x, 0, x + 30, 0); hgr.addColorStop(0, '#303030'); hgr.addColorStop(0.5, '#d0d0d0'); hgr.addColorStop(1, '#303030'); hg.fillStyle = hgr; hg.fillRect(x, 0, 30, top); }
  for (let y = 0; y < top; y += 72) { g.fillStyle = 'rgba(20,14,28,.5)'; g.fillRect(0, y, W, 3); hg.fillStyle = '#202020'; hg.fillRect(0, y, W, 4); }
  g.fillStyle = '#2a1a12'; g.fillRect(0, top, W, H - top); for (let x = 0; x < W; x += 14) { g.fillStyle = `rgba(${R(60, 90)},${R(36, 50)},${R(22, 30)},1)`; g.fillRect(x, top + 6, 10, H - top); hg.fillStyle = '#a0a0a0'; hg.fillRect(x, top, 10, H - top); hg.fillStyle = '#404040'; hg.fillRect(x + 10, top, 4, H - top); }
  g.fillStyle = '#9a9aa6'; g.fillRect(0, top - 4, W, 8); grime(g, W, H, 0.15);
  return { map: toTex(c), normalMap: toTex(heightToNormal(hc, 2.2), null, false), normalScale: new THREE.Vector2(0.8, 0.8) };
}
function videoCasino(s, w, d, h, up) {
  const purple = basic({ color: 0xd07aff }), cyan = basic({ color: 0x7af4ff }), warm = basic({ color: 0xffae6a }), chrome = phys({ color: 0xd8d8e0, metalness: 1, roughness: 0.18, clearcoat: 0.5 });
  // curved coves where walls meet the ceiling, lit warm from a hidden strip (gradient baked into vertex colours, so it costs nothing)
  const coveM = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false }), RC = 0.5, ledge = std({ color: 0x2a2234, roughness: 0.6 });
  [[0, -d / 2, 0, w], [0, d / 2, Math.PI, w], [-w / 2, 0, Math.PI / 2, d], [w / 2, 0, -Math.PI / 2, d]].forEach(([x, z, ry, len]) => { const g = new THREE.Group(); g.position.set(x, h, z); g.rotation.y = ry; s.add(g); g.add(new THREE.Mesh(coveGeo(len, RC, 0xffa060, 0x3a2e44, 22, 0.75), coveM)); box(len, 0.04, 0.09, ledge, 0, -RC - 0.02, 0.045, g); box(len, 0.014, 0.014, warm, 0, -RC + 0.007, 0.082, g); });
  // the ceiling dome: chrome lip, a shallow recess, magenta and cyan neon rings, a glowing core, downlights around it
  const D = new THREE.Group(); D.position.set(0.3, h, 0.4); s.add(D);
  const recess = new THREE.Mesh(new THREE.CircleGeometry(2.42, 96).rotateX(Math.PI / 2), std({ color: 0x1e1828, roughness: 0.45, metalness: 0.2 })); recess.position.y = -0.012; D.add(recess);
  const step = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.95, 0.12, 96, 1, true), std({ color: 0x2c2438, roughness: 0.4, side: THREE.DoubleSide })); step.position.y = -0.07; D.add(step);
  torus(2.36, 0.07, chrome, 0, -0.04, 0, D, 128).rotation.x = Math.PI / 2;
  [[2.12, 0.05, purple], [1.6, 0.022, purple], [1.15, 0.045, cyan], [0.62, 0.035, cyan]].forEach(([r, t, m]) => { torus(r, t, m, 0, -0.06 - (2.2 - r) * 0.035, 0, D, 128).rotation.x = Math.PI / 2; });
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.42, 48).rotateX(Math.PI / 2), basic({ color: 0xd8fbff })); core.position.y = -0.13; D.add(core);
  [[0xd07aff, 6.2, 0.18], [0x7af4ff, 3.4, 0.26], [0xffffff, 1.4, 0.35]].forEach(([c, sz, op]) => { const gl = glow(c, sz, op); gl.position.y = -0.2; D.add(gl); });
  const dL = new THREE.PointLight(0xc08aff, 9, 10, 1.4); dL.position.set(0, -0.6, 0); D.add(dL);
  { const n = 26, ring = new THREE.InstancedMesh(new THREE.TorusGeometry(0.075, 0.016, 8, 24).rotateX(Math.PI / 2), chrome, n), lens = new THREE.InstancedMesh(new THREE.CircleGeometry(0.06, 20).rotateX(Math.PI / 2), basic({ color: 0xffe6c8 }), n), mt = new THREE.Matrix4(); let k = 0;
    for (let ix = -3; ix <= 3; ix++) for (const z of [-4.6, -2.2, 3.0, 5.0]) { if (k >= n) break; const x = ix * 2.2 + 0.3; if (Math.hypot(x - 0.3, z - 0.4) < 3.0) continue; mt.makeTranslation(x, h - 0.012, z); ring.setMatrixAt(k, mt); mt.makeTranslation(x, h - 0.014, z); lens.setMatrixAt(k, mt); const gl = glow(0xffd8b0, 0.5, 0.25); gl.position.set(x, h - 0.08, z); s.add(gl); k++; }
    ring.count = lens.count = k; s.add(ring, lens); }
  // the round bar: glowing column, curved counter with cyan neon fins, chrome rims, CASINO lettered round the crown
  const B = new THREE.Group(); B.position.set(1.4, 0, -3.15); s.add(B);
  const cream = phys({ color: 0xe8e0ec, roughness: 0.35, clearcoat: 0.6 }), deep = std({ color: 0x2a3a6a, roughness: 0.4, metalness: 0.3 });
  lathe([[0, 0], [1.02, 0], [1.02, 0.08], [0.96, 0.12], [0.96, 0.98], [1.08, 1.02], [1.08, 1.08], [0, 1.08]], deep, 0, 0, 0, B, 72);
  torus(1.06, 0.03, chrome, 0, 1.08, 0, B, 96).rotation.x = Math.PI / 2; torus(1.0, 0.02, chrome, 0, 0.1, 0, B, 96).rotation.x = Math.PI / 2;
  { const n = 28, fin = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 0.78, 0.02), cyan, n), o = new THREE.Object3D(); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; o.position.set(Math.cos(a) * 0.975, 0.55, Math.sin(a) * 0.975); o.rotation.y = -a; o.updateMatrix(); fin.setMatrixAt(k, o.matrix); } B.add(fin); }
  const col = cyl(0.42, 0.42, h - 1.1, cream, 0, 1.1 + (h - 1.1) / 2, 0, B, 48);
  const [lc, lg] = cnv(2048, 160); lg.fillStyle = '#e8e0ec'; lg.fillRect(0, 0, 2048, 160); ['CASINO', 'CASINO'].forEach((t, i) => { neonText(lg, t, 512 + i * 1024, 84, '110px "Bebas Neue"', '#3ad8ff', 10); });
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.435, 0.435, 0.36, 64, 1, true), basic({ map: toTex(lc) })); crown.position.y = 2.55; B.add(crown);
  lathe([[0.42, 0], [0.9, 0.12], [1.1, 0.22], [1.1, 0.3], [0.42, 0.3]], cream, 0, h - 0.62, 0, B, 72); torus(1.1, 0.025, cyan, 0, h - 0.4, 0, B, 96).rotation.x = Math.PI / 2;
  const bL = new THREE.PointLight(0x5ae8ff, 6, 6, 1.5); bL.position.set(0, 1.6, 0); B.add(bL); const bg2 = glow(0x5ae8ff, 3.2, 0.14); bg2.position.set(0, 0.6, 0); B.add(bg2);
  for (let k = 0; k < 9; k++) { let a = R(0, 6.28); while (Math.abs(Math.atan2(Math.sin(a - 1.87), Math.cos(a - 1.87))) < 0.4) a = R(0, 6.28); const r = R(0.6, 0.8); lathe([[0, 0], [0.035, 0], [0.035, 0.16], [0.012, 0.22], [0.012, 0.26], [0, 0.26]], phys({ color: pick([0x2a6a2a, 0x8a4a10, 0xd8d0c0, 0x5a1020, 0x1a3a6a]), roughness: 0.1, transparent: true, opacity: 0.85, clearcoat: 1 }), Math.cos(a) * r, 1.085, Math.sin(a) * r, B, 12); }
  // tall magenta bar stools round it
  const mag = std({ color: 0xb03072, roughness: 0.75 });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.3; if (Math.sin(a) < -0.7) continue; const x = Math.cos(a) * 1.5, z = Math.sin(a) * 1.5; cyl(0.2, 0.2, 0.1, mag, x, 0.86, z, B, 28); torus(0.2, 0.012, chrome, x, 0.81, z, B, 28).rotation.x = Math.PI / 2; cyl(0.03, 0.03, 0.8, chrome, x, 0.41, z, B, 10); torus(0.16, 0.01, chrome, x, 0.32, z, B, 24).rotation.x = Math.PI / 2; cyl(0.2, 0.22, 0.03, chrome, x, 0.015, z, B, 24); }
  // the game table near the front: rings of symbols (not numbers, so it never reads as a second roulette) turning slowly and flicking over, the 0★ in the middle
  { const TX = 0.05, TZ = 2.85, T = new THREE.Group(); T.position.set(TX, 0, TZ); s.add(T); const lac = phys({ color: 0x15101e, roughness: 0.22, clearcoat: 1 });
    lathe([[0, 0], [0.56, 0], [0.56, 0.04], [0.3, 0.1], [0.2, 0.6], [0.44, 0.7], [0, 0.7]], lac, 0, 0, 0, T, 48); torus(0.6, 0.01, cyan, 0, 0.012, 0, T, 96).rotation.x = Math.PI / 2;
    cyl(1.0, 0.95, 0.06, lac, 0, 0.71, 0, T, 96); torus(1.0, 0.03, chrome, 0, 0.745, 0, T, 128).rotation.x = Math.PI / 2;
    const [dc, dg] = cnv(1280, 128); dg.fillStyle = '#000'; dg.fillRect(0, 0, 1280, 128); dg.fillStyle = '#fff'; dg.strokeStyle = '#fff'; dg.lineCap = dg.lineJoin = 'round';
    const pstar = (n, r1, r2, y0 = 0) => { dg.beginPath(); for (let k = 0; k < n * 2; k++) { const r = k % 2 ? r2 : r1, an = (k / (n * 2)) * Math.PI * 2 - Math.PI / 2; dg.lineTo(Math.cos(an) * r, y0 + Math.sin(an) * r); } dg.closePath(); dg.fill(); };
    [() => pstar(5, 50, 20, 4), // star, diamond, heart, spade, club, moon, sparkle, bell, cherries, bolt
      () => { dg.beginPath(); dg.moveTo(0, -50); dg.lineTo(36, 0); dg.lineTo(0, 50); dg.lineTo(-36, 0); dg.closePath(); dg.fill(); },
      () => { dg.beginPath(); dg.moveTo(0, 44); dg.bezierCurveTo(-26, 22, -50, 4, -48, -16); dg.bezierCurveTo(-46, -42, -12, -46, 0, -22); dg.bezierCurveTo(12, -46, 46, -42, 48, -16); dg.bezierCurveTo(50, 4, 26, 22, 0, 44); dg.fill(); },
      () => { dg.beginPath(); dg.moveTo(0, -48); dg.bezierCurveTo(-26, -24, -50, -6, -48, 14); dg.bezierCurveTo(-46, 38, -14, 40, -4, 22); dg.lineTo(-16, 48); dg.lineTo(16, 48); dg.lineTo(4, 22); dg.bezierCurveTo(14, 40, 46, 38, 48, 14); dg.bezierCurveTo(50, -6, 26, -24, 0, -48); dg.fill(); },
      () => { [[0, -24], [-24, 6], [24, 6]].forEach(([x, y]) => { dg.beginPath(); dg.arc(x, y, 20, 0, 7); dg.fill(); }); dg.beginPath(); dg.moveTo(-14, 48); dg.lineTo(14, 48); dg.lineTo(0, 4); dg.closePath(); dg.fill(); },
      () => { dg.beginPath(); dg.arc(0, 0, 44, 0, 7); dg.fill(); dg.fillStyle = '#000'; dg.beginPath(); dg.arc(20, -14, 38, 0, 7); dg.fill(); },
      () => pstar(4, 52, 12),
      () => { dg.beginPath(); dg.moveTo(-38, 26); dg.quadraticCurveTo(-34, -40, 0, -44); dg.quadraticCurveTo(34, -40, 38, 26); dg.closePath(); dg.fill(); dg.fillRect(-44, 22, 88, 10); dg.beginPath(); dg.arc(0, 40, 9, 0, 7); dg.fill(); },
      () => { dg.lineWidth = 6; dg.beginPath(); dg.moveTo(-18, 8); dg.quadraticCurveTo(0, -38, 22, -44); dg.moveTo(18, 12); dg.quadraticCurveTo(10, -18, 22, -44); dg.stroke(); [[-20, 24], [18, 28]].forEach(([x, y]) => { dg.beginPath(); dg.arc(x, y, 19, 0, 7); dg.fill(); }); },
      () => { dg.beginPath(); dg.moveTo(12, -50); dg.lineTo(-28, 6); dg.lineTo(-2, 6); dg.lineTo(-14, 50); dg.lineTo(28, -8); dg.lineTo(2, -8); dg.closePath(); dg.fill(); }
    ].forEach((f, k) => { dg.save(); dg.translate(k * 128 + 64, 64); f(); dg.restore(); });
    const gm = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uDig: { value: toTex(dc, null, false) }, uLogo: { value: zeroTex } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uT; uniform sampler2D uDig, uLogo; varying vec2 vUv;
        float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main() {
          vec2 p = (vUv - 0.5) * 2.0; float r = length(p), a = atan(p.y, p.x);
          vec3 col = mix(vec3(0.016, 0.012, 0.04), vec3(0.05, 0.03, 0.1), 1.0 - r);
          float rr2 = max(r * r, 1e-4), dax = (p.x * dFdx(p.y) - p.y * dFdx(p.x)) / rr2, day = (p.x * dFdy(p.y) - p.y * dFdy(p.x)) / rr2;
          const float R0 = 0.32, R1 = 0.97;
          if (r > R0 && r < R1) {
            float rr = (r - R0) / (R1 - R0) * 4.0, ri = floor(rr), rf = fract(rr), dir = mod(ri, 2.0) < 0.5 ? 1.0 : -1.0, cells = 12.0 + ri * 7.0;
            float ca = (-a / 6.2831853 + 0.5 + uT * (0.014 + 0.005 * ri) * dir) * cells, ci = mod(floor(ca), cells), cf = fract(ca);
            float sd = h21(vec2(ci, ri + 3.0)), tick = floor(uT * (0.06 + 0.16 * sd) + sd * 13.0), dgt = floor(h21(vec2(ci * 1.37 + tick * 7.3, ri + tick * 0.61)) * 10.0);
            vec2 g = (vec2(cf, rf) - 0.5) * vec2(1.05, 1.2) + 0.5; float k = cells / 6.2831853 * 1.05 / 10.0, kr = 4.0 / (R1 - R0) * 1.2;
            float m = (g.x > 0.0 && g.x < 1.0 && g.y > 0.02 && g.y < 0.98) ? textureGrad(uDig, vec2((dgt + g.x) / 10.0, g.y), vec2(dax * k, dFdx(r) * kr), vec2(day * k, dFdy(r) * kr)).r : 0.0;
            vec3 rc = ri < 0.5 ? vec3(0.35, 0.9, 1.0) : ri < 1.5 ? vec3(1.0, 0.38, 0.86) : ri < 2.5 ? vec3(1.0, 0.8, 0.36) : vec3(0.62, 0.7, 1.0);
            float hot = step(0.97, h21(vec2(ci + 0.5, ri + floor(uT * 0.6) * 0.37))), sweep = pow(max(0.0, cos(a - uT * 0.4)), 24.0);
            col += rc * m * (0.55 + 0.7 * hot + 0.6 * sweep) + rc * (0.22 + 0.25 * sweep) * (smoothstep(0.07, 0.0, rf) + smoothstep(0.93, 1.0, rf)) + rc * 0.05 * (smoothstep(0.04, 0.0, cf) + smoothstep(0.96, 1.0, cf));
          }
          if (r < R0) { float an = -uT * 0.08; vec2 q = mat2(cos(an), -sin(an), sin(an), cos(an)) * p / R0; if (abs(q.x) < 0.95 && abs(q.y) < 0.95) col += texture(uLogo, q * 0.54 + 0.5).rgb * 1.15; }
          col += vec3(0.3, 0.5, 1.0) * smoothstep(0.02, 0.0, abs(r - R0)) * 0.6 + vec3(0.25, 0.45, 1.0) * smoothstep(0.93, 1.0, r) * 0.5;
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }` });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.97, 96).rotateX(-Math.PI / 2), gm); disc.position.y = 0.743; disc.userData.noBatch = true; T.add(disc); up.push((dt, t) => { gm.uniforms.uT.value = t; });
    const tgl = glow(0x6a7cff, 3.0, 0.1); tgl.position.set(0, 0.85, 0); T.add(tgl);
    const mag = std({ color: 0xb03072, roughness: 0.75 }); [3.6, 4.35].forEach((an) => { const x = Math.cos(an) * 1.35, z = Math.sin(an) * 1.35; cyl(0.19, 0.19, 0.09, mag, x, 0.64, z, T, 28); torus(0.19, 0.011, chrome, x, 0.6, z, T, 28).rotation.x = Math.PI / 2; cyl(0.028, 0.028, 0.6, chrome, x, 0.3, z, T, 10); cyl(0.19, 0.21, 0.03, chrome, x, 0.015, z, T, 24); });
    // three glass orbs hanging low over it, under the sightline to the signs on the far walls
    [[-0.38, 2.2, -0.2, 0xff7ad8], [0.32, 2.36, 0.12, 0x7af4ff], [-0.02, 2.06, 0.38, 0xfff2e0]].forEach(([x, y, z, c]) => { sph(0.11, basic({ color: c }), x, y, z, T, 24); cyl(0.004, 0.004, h - y - 0.11, chrome, x, (h + y + 0.11) / 2, z, T, 6); const og = glow(c, 0.9, 0.35); og.position.set(x, y, z); T.add(og); }); }
  // a high-top for two between the left bank and the bar
  { const C = new THREE.Group(); C.position.set(-1.75, 0, -2.85); s.add(C); const dk = phys({ color: 0x1a1424, roughness: 0.15, clearcoat: 1 });
    cyl(0.24, 0.26, 0.03, chrome, 0, 0.015, 0, C, 32); cyl(0.03, 0.03, 1.0, chrome, 0, 0.52, 0, C, 12); cyl(0.36, 0.36, 0.03, dk, 0, 1.04, 0, C, 48); torus(0.36, 0.008, cyan, 0, 1.04, 0, C, 64).rotation.x = Math.PI / 2;
    const d1 = mkDrink('martini', 0x7af4ff); d1.position.set(-0.1, 1.055, -0.05); C.add(d1);
    // what the waiter swaps lives in the room itself (world coordinates): a bottle on the bar counter, a drink here
    const barB = mkBottle(BOTTLES[0]); barB.position.set(1.18, 1.085, -2.43); s.add(barB); const hiD = mkDrink(DRINKS[0][0], DRINKS[0][1]); hiD.position.set(-1.67, 1.055, -2.79); s.add(hiD);
    // one trip: over to the bar to grab a bottle, across to the high-top with a fresh drink, then back to its spot
    waiterBot(s, up, [{ obj: barB, cur: BOTTLES[0], list: BOTTLES, make: mkBottle, path: [[-0.3, -1.7], [0.45, -1.4], [0.97, -1.76]], rev: 0.2 },
      { obj: hiD, cur: DRINKS[0], list: DRINKS, make: (r) => mkDrink(r[0], r[1]), path: [[0.2, -1.45], [-0.7, -1.62], [-1.55, -1.55], [-1.7, -2.12]], rev: 0.35 }], [-0.45, -2.5], [[-1.05, -2.0], [-0.45, -2.5]]);
    const mag = std({ color: 0xb03072, roughness: 0.75 }); [-0.55, 0.55].forEach((x) => { cyl(0.18, 0.18, 0.09, mag, x, 0.82, 0.05, C, 28); torus(0.18, 0.01, chrome, x, 0.78, 0.05, C, 28).rotation.x = Math.PI / 2; cyl(0.026, 0.026, 0.78, chrome, x, 0.39, 0.05, C, 10); torus(0.14, 0.009, chrome, x, 0.3, 0.05, C, 24).rotation.x = Math.PI / 2; cyl(0.19, 0.21, 0.03, chrome, x, 0.015, 0.05, C, 24); }); }
  ledSign(s, up, { w: 3.4, h: 0.34, x: -w / 2 + 0.07, y: 2.72, z: -3.95, ry: Math.PI / 2, scroll: 'NO ONE EVER REGRETS THEIR TIME IN THE CASINO!', color: 0xff4a2a });
  ledSign(s, up, { w: 2.4, h: 0.56, x: -6.5, y: 2.74, z: -d / 2 + 0.07, ry: 0, color: 0xffb347, flip: [['THE HOUSE ALWAYS LOSES', 'HERE AT M0!'], ['RELAX, DRINK, BET...', 'BE HAPPY!'], ["DON'T REGRET IT TOMORROW,", 'BET MORE TODAY!']] });
  // palms on the left wall, and the 0★ between the two big neons
  palm(s, -w / 2 + 0.6, 0, -1.0); palm(s, -w / 2 + 0.6, 0, d / 2 - 0.8);
  zeroSign(0.72, s, -0.35, 2.8, -d / 2 + 0.07);
}
function flickerUp(up, mat, rate) { up.push((dt, t) => { mat.opacity = Math.sin(t * rate * 5.3) > 0.985 && Math.random() < 0.6 ? 0.35 : 1; }); }
/* an LED sign: a grid of round dots, each lit by sampling the text at its centre. Either a line that scrolls through, or a few lines that roll over one to the next */
function ledSign(parent, up, o) {
  const dot = o.dot || 0.014, cols = Math.round(o.w / dot), rows = Math.round(o.h / dot), S = 4, G = new THREE.Group(); G.position.set(o.x, o.y, o.z); G.rotation.y = o.ry || 0; parent.add(G);
  rbox(o.w + 0.08, o.h + 0.08, 0.06, 0.02, std({ color: 0x0c0a10, roughness: 0.5 }), 0, 0, -0.03, G, 2); rbox(o.w + 0.1, o.h + 0.1, 0.04, 0.02, phys({ color: 0xc8c8d0, metalness: 1, roughness: 0.2 }), 0, 0, -0.045, G, 2);
  let c, g, TW = cols, N = 1;
  if (o.scroll) { [c, g] = cnv(8, 8); g.font = `${Math.round(rows * S * 0.8)}px "Bebas Neue"`; const tw = Math.ceil(g.measureText(o.scroll).width); TW = Math.ceil((tw + cols * S * 0.6) / S); c.width = TW * S; c.height = rows * S;
    g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.font = `${Math.round(rows * S * 0.8)}px "Bebas Neue"`; g.fillText(o.scroll, 0, rows * S * 0.54); }
  else { N = o.flip.length; [c, g] = cnv(cols * S, rows * S * N); g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    o.flip.forEach((ls, k) => { const by = k * rows * S, fs = Math.round(rows * S * (ls.length > 1 ? 0.4 : 0.66)); ls.forEach((ln, j) => { g.font = fitFont(g, ln, `${fs}px "Bebas Neue"`, cols * S * 0.94); g.fillText(ln, cols * S / 2, by + rows * S * (ls.length > 1 ? (j ? 0.73 : 0.29) : 0.53)); }); }); }
  const t = toTex(c, null, false); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter;
  const col = new THREE.Color(o.color), mat = new THREE.ShaderMaterial({ uniforms: { uMap: { value: t }, uDots: { value: new THREE.Vector2(cols, rows) }, uX: { value: 0 }, uM: { value: 0 }, uTW: { value: TW }, uN: { value: N }, uFlip: { value: o.scroll ? 0 : 1 }, uCol: { value: new THREE.Vector3(col.r, col.g, col.b) } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D uMap; uniform vec2 uDots; uniform float uX, uM, uTW, uN, uFlip; uniform vec3 uCol; varying vec2 vUv;
      void main() { vec2 cell = vUv * uDots, ci = floor(cell), cf = fract(cell); float px = max(fwidth(cell.x), fwidth(cell.y)), m = mix(smoothstep(0.46, 0.3, length(cf - 0.5)), 0.5, smoothstep(0.3, 0.7, px));
        float mq = floor(uM * uDots.y + 0.5) / uDots.y;
        vec2 tc = uFlip > 0.5 ? vec2((ci.x + 0.5) / uDots.x, (uN - mq - 1.0 + (ci.y + 0.5) / uDots.y) / uN) : vec2((ci.x + 0.5 + floor(uX)) / uTW, (ci.y + 0.5) / uDots.y);
        float v = smoothstep(0.2, 0.7, texture2D(uMap, tc).r);
        gl_FragColor = vec4(mix(vec3(0.02, 0.016, 0.024), uCol * (0.07 + 1.25 * v), m), 1.0);
        #include <colorspace_fragment>
      }` });
  const panel = quad(o.w, o.h, mat, 0, 0, 0.002, G); panel.userData.noBatch = true;
  const wash = quad(o.w * 1.35, o.h * 4.2, new THREE.MeshBasicMaterial({ map: glowTex, color: o.color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.16, toneMapped: false }), 0, 0, -0.062, G); wash.userData.noCast = true; wash.userData.noBatch = true;
  if (o.scroll) up.push((dt) => { mat.uniforms.uX.value = (mat.uniforms.uX.value + Math.min(dt, 0.05) * 24) % TW; });
  else { let k = 0, hold = 4.5, roll = 0; up.push((dt) => { const d = Math.min(dt, 0.05); if (roll > 0) { roll = Math.max(0, roll - d / 0.45); const e = 1 - roll; mat.uniforms.uM.value = k - 1 + e * e * (3 - 2 * e); if (!roll) mat.uniforms.uM.value = k % N; } else if ((hold -= d) <= 0) { hold = 4.5; k = (k % N) + 1; roll = 1; } }); }
  return G;
}
let _symTex = null;
function symStrip() {
  if (_symTex) return _symTex; const S = 128, [c, g] = cnv(S, S * 8), cx = S / 2;
  const bg = g.createLinearGradient(0, 0, 0, S); bg.addColorStop(0, '#120c2c'); bg.addColorStop(0.5, '#1e1446'); bg.addColorStop(1, '#120c2c');
  const star = (x, y, r1, r2, n) => { g.beginPath(); for (let k = 0; k < n * 2; k++) { const r = k % 2 ? r2 : r1, a = (k / (n * 2)) * Math.PI * 2 - Math.PI / 2; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); };
  ['7', 'BAR', 'cherry', 'bell', '$', 'star', 'moon', 'planet'].forEach((sy, i) => { const y = i * S, cy = y + S / 2; g.save(); g.translate(0, y); g.fillStyle = bg; g.fillRect(0, 0, S, S); g.restore();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (sy === '7') { g.font = '108px "Bebas Neue"'; g.lineWidth = 8; g.strokeStyle = '#ffd25a'; g.strokeText('7', cx, cy + 6); g.fillStyle = '#ff2a44'; g.fillText('7', cx, cy + 6); }
    else if (sy === 'BAR') { g.fillStyle = '#ffd25a'; g.beginPath(); g.roundRect ? g.roundRect(14, cy - 24, 100, 48, 10) : g.rect(14, cy - 24, 100, 48); g.fill(); g.fillStyle = '#1a1030'; g.font = '44px "Bebas Neue"'; g.fillText('BAR', cx, cy + 3); }
    else if (sy === 'cherry') { g.strokeStyle = '#5ae06a'; g.lineWidth = 6; g.beginPath(); g.moveTo(44, cy + 4); g.quadraticCurveTo(60, cy - 40, 84, cy - 42); g.moveTo(82, cy + 8); g.quadraticCurveTo(74, cy - 20, 84, cy - 42); g.stroke(); g.fillStyle = '#ff2a44'; [[42, cy + 18], [82, cy + 22]].forEach(([x, yy]) => { g.beginPath(); g.arc(x, yy, 19, 0, 7); g.fill(); }); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(36, cy + 11, 5, 0, 7); g.arc(76, cy + 15, 5, 0, 7); g.fill(); }
    else if (sy === 'bell') { g.fillStyle = '#ffc83a'; g.beginPath(); g.moveTo(cx - 36, cy + 26); g.quadraticCurveTo(cx - 32, cy - 38, cx, cy - 42); g.quadraticCurveTo(cx + 32, cy - 38, cx + 36, cy + 26); g.closePath(); g.fill(); g.beginPath(); g.arc(cx, cy + 32, 9, 0, 7); g.fill(); }
    else if (sy === '$') { g.font = '104px "Bebas Neue"'; g.fillStyle = '#4af08a'; g.fillText('$', cx, cy + 6); }
    else if (sy === 'star') { g.fillStyle = '#7af4ff'; star(cx, cy + 4, 44, 18, 5); }
    else if (sy === 'moon') { g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(cx, cy, 38, 0, 7); g.fill(); g.fillStyle = bg; g.save(); g.translate(0, y); g.beginPath(); g.arc(cx + 18, S / 2 - 10, 34, 0, 7); g.fill(); g.restore(); }
    else { g.fillStyle = '#c87aff'; g.beginPath(); g.arc(cx, cy, 28, 0, 7); g.fill(); g.strokeStyle = '#ffd0ff'; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, cy, 52, 14, -0.35, 0, 7); g.stroke(); g.fillStyle = '#c87aff'; g.beginPath(); g.arc(cx, cy, 28, Math.PI * 1.05, Math.PI * 1.95); g.fill(); } });
  _symTex = toTex(c); return _symTex;
}
let _reelTex = null;
// a reel strip: eight symbols around the drum (drawn turned a quarter so they read upright once the drum lies on its side)
function reelTex() {
  if (_reelTex) return _reelTex;
  const W = 1024, H = 192, [c, g] = cnv(W, H); g.fillStyle = '#f6efe0'; g.fillRect(0, 0, W, H);
  const draw = (sym, cx, cy) => {
    g.save(); g.translate(cx, cy); g.rotate(Math.PI / 2); g.textAlign = 'center'; g.textBaseline = 'middle';
    if (sym === '7') { g.fillStyle = '#c0182a'; g.font = '112px "Bebas Neue"'; g.fillText('7', 0, 6); }
    else if (sym === 'BAR') { g.fillStyle = '#141414'; g.fillRect(-56, -26, 112, 52); g.fillStyle = '#f6efe0'; g.font = '44px "Bebas Neue"'; g.fillText('BAR', 0, 3); }
    else if (sym === 'cherry') { g.strokeStyle = '#2a7a2a'; g.lineWidth = 6; g.beginPath(); g.moveTo(-18, 10); g.quadraticCurveTo(0, -40, 22, -44); g.moveTo(18, 14); g.quadraticCurveTo(10, -20, 22, -44); g.stroke(); g.fillStyle = '#d0142a'; [[-20, 22], [18, 26]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 20, 0, 7); g.fill(); }); }
    else if (sym === 'bell') { g.fillStyle = '#e0a820'; g.beginPath(); g.moveTo(-34, 26); g.quadraticCurveTo(-30, -36, 0, -40); g.quadraticCurveTo(30, -36, 34, 26); g.closePath(); g.fill(); g.beginPath(); g.arc(0, 32, 9, 0, 7); g.fill(); }
    else if (sym === '$') { g.fillStyle = '#1f7a3e'; g.font = '104px "Bebas Neue"'; g.fillText('$', 0, 6); }
    else if (sym === 'star') { g.fillStyle = '#2a4ad0'; g.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 18 : 42, a = (k / 10) * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); }
    else { g.fillStyle = '#f0d020'; g.beginPath(); g.ellipse(0, 0, 40, 28, 0, 0, 7); g.fill(); }
    g.restore();
  };
  ['7', 'BAR', 'cherry', 'bell', '$', 'star', '7', 'lemon'].forEach((sy, i) => { draw(sy, (i + 0.5) * (W / 8), H / 2); g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(i * (W / 8), 0, 2, H); });
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(0,0,0,.25)'); gr.addColorStop(0.2, 'rgba(0,0,0,0)'); gr.addColorStop(0.8, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return (_reelTex = toTex(c));
}
function topperTex(name, bg) {
  const [c, g] = cnv(512, 272); g.fillStyle = bg; g.fillRect(0, 0, 512, 272);
  const gr = g.createLinearGradient(0, 0, 0, 272); gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 272);
  g.fillStyle = '#ffe9a0'; for (let k = 0; k < 22; k++) { const x = 16 + k * 22.8; g.beginPath(); g.arc(x, 14, 6, 0, 7); g.arc(x, 258, 6, 0, 7); g.fill(); }
  g.fillStyle = '#ffd25a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = fitFont(g, name, '120px "Bebas Neue"', 440); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 6; g.fillText(name, 256, 146);
  return toTex(c);
}
// banks of slot machines from shared instanced parts: a few dozen machines cost a dozen draw calls. They play themselves now and then.
function slotBank(s, up, P, onWin, look = null) {
  const V = !!(look && look.video);
  const N = P.length, cols = look ? look.cols : [0x8a1020, 0x1a2a7a, 0x18161c, 0xa87818, 0x0e5a5a, 0x4a1a6a], glowC = V ? [0x7af4ff, 0xd07aff, 0xffffff, 0x7af4ff] : [0xffc84a, 0xff5fa8, 0x4ad0ff, 0x7dff9a];
  const mach = P.map(([x, z, ry]) => new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(1, 1, 1)));
  const inst = (geo, mat, n = N, colorFn = null) => { const im = new THREE.InstancedMesh(geo, mat, n); for (let i = 0; i < n; i++) { im.setMatrixAt(i, mach[i % N]); if (colorFn) im.setColorAt(i, new THREE.Color(colorFn(i))); } s.add(im); return im; };
  // cabinet: the classic side profile, extruded across the width
  const sh = new THREE.Shape();
  if (V) { sh.moveTo(-0.3, 0); sh.lineTo(0.33, 0); sh.lineTo(0.33, 0.6); sh.quadraticCurveTo(0.33, 0.74, 0.25, 0.8); sh.lineTo(0.2, 0.86); sh.lineTo(0.2, 1.5); sh.quadraticCurveTo(0.22, 1.6, 0.21, 1.66); sh.quadraticCurveTo(0.14, 1.96, -0.3, 1.96); sh.closePath(); }
  else { [[-0.3, 0], [0.32, 0], [0.32, 0.74], [0.17, 0.9], [0.19, 1.52], [0.25, 1.62], [0.23, 1.86], [0.12, 1.97], [-0.3, 1.97]].forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); sh.closePath(); }
  const bodyG = new THREE.ExtrudeGeometry(sh, { depth: 0.64, bevelEnabled: true, bevelThickness: V ? 0.03 : 0.012, bevelSize: V ? 0.03 : 0.012, bevelSegments: V ? 4 : 2, curveSegments: 4 }); bodyG.rotateY(-Math.PI / 2); bodyG.translate(0.32, 0, 0); bodyG.computeVertexNormals();
  inst(bodyG, V ? phys({ roughness: 0.24, metalness: 0.75, clearcoat: 0.7, clearcoatRoughness: 0.2 }) : std({ roughness: 0.32, metalness: 0.45 }), N, (i) => cols[i % cols.length]);
  let faceT = null, faceM = null;
  if (V) { // porthole toppers and a cyan glow along the base, like the video's machines
    // round lit toppers: a dark can, a chrome bezel, and a glowing face (a soft gradient with a few stars), tinted per machine
    const [fc, fg] = cnv(256, 256), fgr = fg.createRadialGradient(128, 168, 6, 128, 140, 134); fgr.addColorStop(0, '#ffffff'); fgr.addColorStop(0.3, '#e8d8ff'); fgr.addColorStop(0.62, '#8a6ad8'); fgr.addColorStop(0.9, '#2a1e5a'); fgr.addColorStop(1, '#160f30'); fg.fillStyle = fgr; fg.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 70; i++) { fg.fillStyle = `rgba(255,255,255,${R(0.35, 0.95)})`; const r = R(0.8, 2.4); fg.fillRect(R(40, 216), R(26, 120), r, r); }
    inst(new THREE.CylinderGeometry(0.19, 0.19, 0.08, 48).rotateX(Math.PI / 2).translate(0, 2.13, -0.035), std({ color: 0x1c1826, roughness: 0.35, metalness: 0.5 }));
    inst(new THREE.TorusGeometry(0.17, 0.026, 14, 64).translate(0, 2.13, 0.008), phys({ color: 0xd8d8e2, metalness: 1, roughness: 0.16, clearcoat: 0.6 }));
    faceT = toTex(fc); faceT.center.set(0.5, 0.5); faceM = basic({ map: faceT }); inst(new THREE.CircleGeometry(0.155, 48).translate(0, 2.13, 0.006), faceM, N, (i) => [0xb8f8ff, 0xffd0ff, 0xffffff, 0xd8c8ff][i % 4]);
    inst(new THREE.BoxGeometry(0.52, 0.075, 0.02).translate(0, 0.16, 0.36), basic({ color: 0x7af4ff }));
    inst(new THREE.BoxGeometry(0.46, 0.02, 0.012).translate(0, 0.66, 0.335), basic({ color: 0xd07aff })); }
  // bezel round the reel window, coin tray, lever mount
  const bz = V ? [new THREE.BoxGeometry(0.52, 0.024, 0.02).translate(0, 1.392, 0.236), new THREE.BoxGeometry(0.52, 0.024, 0.02).translate(0, 1.008, 0.236), new THREE.BoxGeometry(0.024, 0.408, 0.02).translate(-0.248, 1.2, 0.236), new THREE.BoxGeometry(0.024, 0.408, 0.02).translate(0.248, 1.2, 0.236), new THREE.BoxGeometry(0.46, 0.08, 0.14).translate(0, 0.62, 0.36)] : [new THREE.BoxGeometry(0.56, 0.045, 0.06).translate(0, 1.445, 0.215), new THREE.BoxGeometry(0.56, 0.045, 0.06).translate(0, 1.155, 0.215), new THREE.BoxGeometry(0.04, 0.33, 0.06).translate(-0.26, 1.3, 0.215), new THREE.BoxGeometry(0.04, 0.33, 0.06).translate(0.26, 1.3, 0.215), new THREE.BoxGeometry(0.012, 0.28, 0.035).translate(-0.077, 1.3, 0.215), new THREE.BoxGeometry(0.012, 0.28, 0.035).translate(0.077, 1.3, 0.215), new THREE.BoxGeometry(0.46, 0.08, 0.14).translate(0, 0.62, 0.36), new THREE.BoxGeometry(0.06, 0.16, 0.12).translate(0.35, 1.08, 0.02)];
  inst(mergeGeometries(bz.map((b) => b.toNonIndexed())), std({ color: 0xc8c4ba, roughness: 0.25, metalness: 0.9 }));
  // reels: three drums per machine, spun by rewriting their instance matrices
  const reels = V ? null : new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.11, 0.13, 24, 1).rotateZ(Math.PI / 2), basic({ map: reelTex() }), N * 3); if (reels) s.add(reels);
  const RX = [-0.15, 0, 0.15], ang = new Float32Array(N * 3).map(() => (Math.floor(Math.random() * 8) + 0.5) * (Math.PI / 4)), vel = new Float32Array(N * 3), stopT = new Float32Array(N * 3);
  const _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), setReel = (i, r) => { _r.makeRotationX(ang[i * 3 + r]).setPosition(RX[r], 1.3, 0.105); _m.multiplyMatrices(mach[i], _r); reels.setMatrixAt(i * 3 + r, _m); };
  if (!V) { for (let i = 0; i < N; i++) for (let r = 0; r < 3; r++) setReel(i, r); inst(new THREE.BoxGeometry(0.5, 0.006, 0.004).translate(0, 1.3, 0.219), basic({ color: 0xd8202a })); }
  // video machines: a screen per machine drawn by one shader. Three reels that spin and settle when the machine plays, a glint that crosses now and then, lights chasing along the top, a flash on a win
  let scrA = null, scrB = null, scrW = null, scrM = null; const cur = new Float32Array(N * 3), endT = new Float32Array(N), winAt = new Uint8Array(N);
  if (V) { const sg = new THREE.PlaneGeometry(0.472, 0.36).translate(0, 1.2, 0.234); scrA = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4); scrB = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4); scrW = new THREE.InstancedBufferAttribute(new Float32Array(N), 1);
    for (let i = 0; i < N; i++) { const a = RI(0, 7), b = RI(0, 7), c = RI(0, 7); cur.set([a, b, c], i * 3); scrA.setXYZW(i, -99, a, b, c); scrB.setXYZW(i, Math.random(), a, b, c); scrW.setX(i, -1); }
    sg.setAttribute('aA', scrA); sg.setAttribute('aB', scrB); sg.setAttribute('aW', scrW);
    scrM = new THREE.ShaderMaterial({ uniforms: { uSym: { value: symStrip() }, uTime: { value: 0 } },
      vertexShader: `attribute vec4 aA; attribute vec4 aB; attribute float aW; varying vec2 vUv; varying vec4 vA; varying vec4 vB; varying float vW;
        void main() { vUv = uv; vA = aA; vB = aB; vW = aW; vec4 p = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * p; }`,
      fragmentShader: `uniform sampler2D uSym; uniform float uTime; varying vec2 vUv; varying vec4 vA; varying vec4 vB; varying float vW;
        float back(float x) { float c1 = 0.9, c3 = c1 + 1.0, y = x - 1.0; return 1.0 + c3 * y * y * y + c1 * y * y; }
        vec3 sym(float sv, float cx, vec2 gx, vec2 gy) { float idx = mod(floor(sv), 8.0); vec2 uv = vec2(cx, 1.0 - (idx + 1.0 - fract(sv)) / 8.0); return textureGrad(uSym, uv, gx, gy).rgb; }
        void main() {
          vec2 uv = vUv; float t = uTime, win = step(t, vW), blink = win * step(0.5, fract(t * 4.0));
          vec3 col = mix(vec3(0.05, 0.03, 0.12), vec3(0.11, 0.05, 0.2), uv.y);
          vec2 a0 = vec2(0.05, 0.1), a1 = vec2(0.95, 0.84);
          if (uv.x > a0.x && uv.x < a1.x && uv.y > a0.y && uv.y < a1.y) {
            vec2 r = (uv - a0) / (a1 - a0); float c = floor(r.x * 3.0), cx = fract(r.x * 3.0);
            float pv = c < 0.5 ? vA.y : (c < 1.5 ? vA.z : vA.w), tg = c < 0.5 ? vB.y : (c < 1.5 ? vB.z : vB.w), dur = 1.1 + 0.42 * c;
            float k = clamp((t - vA.x) / dur, 0.0, 1.0), dist = 24.0 + mod(tg - pv + 64.0, 8.0), pos = pv + dist * back(k);
            float sp = (k > 0.0 && k < 1.0) ? dist * 3.0 * (1.0 - k) * (1.0 - k) / dur : 0.0, sv = r.y * 3.0 + pos - 1.0, bl = clamp(sp * 0.004, 0.0, 0.35);
            vec2 gx = vec2(dFdx(r.x * 3.0), -dFdx(sv) / 8.0), gy = vec2(dFdy(r.x * 3.0), -dFdy(sv) / 8.0);
            col = bl > 0.01 ? (sym(sv - bl, cx, gx, gy) + sym(sv, cx, gx, gy) + sym(sv + bl, cx, gx, gy)) / 3.0 : sym(sv, cx, gx, gy);
            float shade = 1.0 - 0.55 * pow(abs(r.y - 0.5) * 2.0, 2.0); col *= shade;
            float mid = step(1.0 / 3.0, r.y) * step(r.y, 2.0 / 3.0); col += mid * (0.06 + 0.3 * blink) * vec3(1.0, 0.85, 0.5);
            float sep = 1.0 - smoothstep(0.0, 0.025, min(cx, 1.0 - cx)); col = mix(col, vec3(0.85, 0.65, 0.25), sep * 0.8);
          } else {
            float top = step(a1.y, uv.y); float dots = step(0.55, fract(uv.x * 14.0 - t * 1.6 + vB.x * 7.0)) * (1.0 - smoothstep(0.2, 0.32, abs(fract(uv.x * 14.0) - 0.5)));
            col += top * dots * mix(vec3(0.2, 0.9, 1.0), vec3(1.0, 0.85, 0.3), win) * (0.55 + 0.45 * blink);
            col += (1.0 - top) * blink * vec3(0.9, 0.6, 0.2) * 0.5;
          }
          float gl = fract((uv.x + uv.y * 0.6) * 0.45 - t * 0.11 - vB.x * 3.1); col += vec3(0.7, 0.8, 1.0) * smoothstep(0.0, 0.015, gl) * (1.0 - smoothstep(0.015, 0.05, gl)) * 0.18;
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }` });
    const sim2 = new THREE.InstancedMesh(sg, scrM, N); for (let i = 0; i < N; i++) sim2.setMatrixAt(i, mach[i]); s.add(sim2); }
  // buttons, light strips, topper box + sign, lever
  inst(mergeGeometries([-0.15, 0, 0.15].map((x) => new THREE.BoxGeometry(0.075, 0.025, 0.055).rotateX(-0.75).translate(x, 0.84, 0.26).toNonIndexed())), basic({ color: 0xffffff }), N, (i) => glowC[(i + 1) % 4]);
  const strips = inst(mergeGeometries([-0.335, 0.335].map((x) => new THREE.BoxGeometry(0.028, 0.96, 0.028).translate(x, 1.4, 0.19).toNonIndexed())), basic({ color: 0xffffff }), N, (i) => new THREE.Color(glowC[i % 4]).multiplyScalar(0.75).getHex());
  if (!V) inst(RBG(0.64, 0.38, 0.3, 0.05, 2).translate(0, 2.16, 0.02), std({ color: 0xd8d2c4, roughness: 0.3, metalness: 0.7 }));
  const names = V ? [] : [['LUCKY 7', '#7a0e1c'], ['ZERO G', '#122a6a'], ['MORE MORE MORE!', '#3a1460'], ['COMET CASH', '#0e4a3a'], ['JACKPOT', '#5a1010']];
  const tops = names.map(([n, bg], v) => { const idx = []; for (let i = 0; i < N; i++) if (i % names.length === v) idx.push(i); const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.58, 0.31).translate(0, 2.16, 0.175), basic({ map: topperTex(n, bg) }), idx.length); idx.forEach((i, k) => { im.setMatrixAt(k, mach[i]); im.setColorAt(k, new THREE.Color(0xdddddd)); }); s.add(im); return { im, idx }; });
  if (!V) inst(new THREE.CylinderGeometry(0.016, 0.016, 0.56, 8).translate(0.37, 1.38, 0.02), std({ color: 0xd0ccc4, roughness: 0.2, metalness: 1 }));
  if (!V) inst(new THREE.SphereGeometry(0.045, 12, 10).translate(0.37, 1.68, 0.02), std({ color: 0xc0101e, roughness: 0.3 }));
  // a stool in front of every machine
  const stoolAt = mach.map((mm) => new THREE.Matrix4().multiplyMatrices(mm, new THREE.Matrix4().makeTranslation(0, 0, 0.68)));
  [[new THREE.CylinderGeometry(0.19, 0.19, 0.08, 20).translate(0, 0.7, 0), std({ color: look ? look.seat : 0x8a1020, roughness: 0.5 })], [new THREE.CylinderGeometry(0.025, 0.03, 0.66, 8).translate(0, 0.35, 0), std({ color: 0xc8c4ba, roughness: 0.25, metalness: 0.9 })], [new THREE.CylinderGeometry(0.17, 0.19, 0.03, 20).translate(0, 0.015, 0), std({ color: 0x2a2a2e, roughness: 0.4, metalness: 0.6 })]]
    .concat(V ? [[new THREE.TorusGeometry(0.19, 0.012, 8, 32).rotateX(Math.PI / 2).translate(0, 0.66, 0), phys({ color: 0xd8d8e0, metalness: 1, roughness: 0.2 })], [new THREE.TorusGeometry(0.14, 0.01, 8, 28).rotateX(Math.PI / 2).translate(0, 0.28, 0), phys({ color: 0xd8d8e0, metalness: 1, roughness: 0.2 })]] : [])
    .forEach(([g2, m2]) => { const im = new THREE.InstancedMesh(g2, m2, N); stoolAt.forEach((mt, i) => im.setMatrixAt(i, mt)); s.add(im); });
  // the machines play themselves: reels spin up, stop one by one, now and then one pays out and flashes
  const spinning = new Set(), flash = new Map(); let next = 1.0; const _c = new THREE.Color();
  up.push((dt, t) => {
    if (V) { scrM.uniforms.uTime.value = t; faceT.rotation = t * 0.06; faceM.color.setScalar(0.9 + 0.1 * Math.sin(t * 1.3));
      next -= dt; if (next <= 0) { next = R(0.6, 1.6); const i = RI(0, N - 1); if (!spinning.has(i)) { spinning.add(i); const w = Math.random() < 0.22, s0 = RI(0, 7); let tg = w ? [s0, s0, s0] : [RI(0, 7), RI(0, 7), RI(0, 7)]; if (!w && tg[0] === tg[1] && tg[1] === tg[2]) tg[2] = (tg[2] + 3) % 8;
        scrA.setXYZW(i, t, cur[i * 3], cur[i * 3 + 1], cur[i * 3 + 2]); scrB.setXYZW(i, scrB.getX(i), tg[0], tg[1], tg[2]); cur.set(tg, i * 3); scrA.needsUpdate = scrB.needsUpdate = true; endT[i] = t + 2.05; winAt[i] = w ? 1 : 0; } }
      for (const i of spinning) if (t >= endT[i]) { spinning.delete(i); if (winAt[i]) { flash.set(i, t + 2.4); scrW.setX(i, t + 2.4); scrW.needsUpdate = true; onWin && onWin(); } }
    } else {
    next -= dt; if (next <= 0) { next = R(0.7, 2.0); const i = RI(0, N - 1); if (!spinning.has(i)) { spinning.add(i); for (let r = 0; r < 3; r++) { vel[i * 3 + r] = R(15, 20); stopT[i * 3 + r] = t + 1.1 + r * 0.42 + R(0, 0.15); } } }
    let moved = false;
    for (const i of spinning) {
      let done = 0;
      for (let r = 0; r < 3; r++) { const k = i * 3 + r; if (vel[k] > 0) { if (t >= stopT[k]) { const st = Math.PI / 4; ang[k] = (Math.ceil(ang[k] / st - 0.5) + 0.5) * st; vel[k] = 0; } else ang[k] += vel[k] * dt; setReel(i, r); moved = true; } else done++; }
      if (done === 3) { spinning.delete(i); if (Math.random() < 0.22) { flash.set(i, t + 2.4); onWin && onWin(); } }
    }
    if (moved) reels.instanceMatrix.needsUpdate = true; }
    if (flash.size) { for (const [i, until] of flash) { const on = Math.floor(t * 9) % 2 === 0; strips.setColorAt(i, _c.setHex(on ? 0xffffff : glowC[i % 4])); const T = names.length ? tops[i % names.length] : null; if (T) { T.im.setColorAt(T.idx.indexOf(i), _c.setHex(on ? 0xffffff : 0x999999)); T.im.instanceColor.needsUpdate = true; } if (t > until) { strips.setColorAt(i, _c.setHex(glowC[i % 4]).multiplyScalar(0.75)); if (T) { T.im.setColorAt(T.idx.indexOf(i), _c.setHex(0xdddddd)); T.im.instanceColor.needsUpdate = true; } flash.delete(i); } } strips.instanceColor.needsUpdate = true; }
  });
}
function blackjack(s, x, z, ry, wood) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; s.add(g);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.1, 40, 1, false, -Math.PI / 2, Math.PI), wood); rim.position.y = 0.86; g.add(rim);
  rbox(2.62, 0.1, 0.12, 0.03, wood, 0, 0.86, -0.02, g, 1);
  const felt = new THREE.Mesh(new THREE.CircleGeometry(1.18, 32, Math.PI, Math.PI).rotateX(-Math.PI / 2), std({ color: 0x0f5a34, roughness: 0.95 })); felt.position.y = 0.915; g.add(felt);
  rbox(1.6, 0.8, 0.5, 0.04, std({ color: 0x2a1408, roughness: 0.6 }), 0, 0.4, 0.25, g, 2);
  rbox(0.6, 0.05, 0.16, 0.02, std({ color: 0x1a1a1a, roughness: 0.4 }), 0, 0.93, 0.1, g, 1);
  const card = std({ color: 0xf6f2e8, roughness: 0.6 }), chipC = [0xc8202a, 0x1a4ad0, 0x1a1a1a, 0x2a9a4a];
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + ((k + 0.5) / 5) * Math.PI, px = Math.sin(a) * 0.85, pz = Math.cos(a) * 0.85; [0, 0.035].forEach((o, j) => { const cd = box(0.065, 0.003, 0.09, card, px + o, 0.92 + j * 0.003, pz, g); cd.rotation.y = a + 0.2 * j; }); const n = RI(2, 6), cm = std({ color: pick(chipC), roughness: 0.4 }); for (let j = 0; j < n; j++) cyl(0.035, 0.035, 0.011, cm, px * 0.8, 0.926 + j * 0.0115, pz * 0.8, g, 16);
    const st = new THREE.Group(); st.position.set(Math.sin(a) * 1.65, 0, Math.cos(a) * 1.65); g.add(st); cyl(0.19, 0.19, 0.08, std({ color: 0x8a1020, roughness: 0.5 }), 0, 0.72, 0, st, 20); cyl(0.025, 0.03, 0.68, std({ color: 0xc8c4ba, roughness: 0.25, metalness: 0.9 }), 0, 0.36, 0, st, 8); }
  [-0.25, 0.25].forEach((o) => { const cd = box(0.065, 0.003, 0.09, card, o, 0.922, 0.35, g); cd.rotation.y = o; });
}

/* ================= UNDERGROUND PARKING (Contact us): cars come down the ramp and park ================= */
let _band = null;
function glowBand() { if (_band) return _band; const [c, g] = cnv(4, 64), im = g.createImageData(4, 64); for (let y = 0; y < 64; y++) { const r = Math.abs(y - 31.5) / 31.5, al = Math.round(255 * Math.exp(-5 * r * r) * (1 - r)); for (let x = 0; x < 4; x++) { const i = (y * 4 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = al; } } g.putImageData(im, 0, 0); _band = toTex(c); return _band; }
export function buildParking(ctx) {
  const s = new THREE.Scene(); const up = [], dyn = [];
  const w = 26, d = 16, h = 3.0;
  s.background = new THREE.Color(0x07080b); s.environment = ctx.envTex; s.environmentIntensity = 0.25; s.fog = new THREE.FogExp2(0x0a0c12, 0.028);
  const conc = concreteTex('#6e6a66', [6, 1], 3, 0.7), floorT = concreteTex('#3a3836', [8, 5], 1, 0.9);
  const fl = quad(w, d, texMat(floorT, { roughness: 0.75 }), 0, 0, 0, s); fl.rotation.x = -Math.PI / 2;
  const ce = quad(w, d, texMat(concreteTex('#55524e', [6, 4], 1, 0.5), { roughness: 0.95 }), 0, h, 0, s); ce.rotation.x = Math.PI / 2;
  [[0, -d / 2, 0, w], [-w / 2, 0, Math.PI / 2, d], [w / 2, 0, -Math.PI / 2, d], [0, d / 2, Math.PI, w]].forEach(([x, z, ry, len]) => { const q = quad(len, h, texMat(conc, { roughness: 0.9 }), x, h / 2, z, s); q.rotation.y = ry; });
  s.add(new THREE.HemisphereLight(0xc8d8ff, 0x1a1816, 0.55));
  const white = basic({ color: 0xd8d8d0 }), yellow = basic({ color: 0xc8a020 });
  // stalls along the back wall, painted lines, arrows, level marking
  const stalls = []; for (let k = 0; k < 5; k++) stalls.push({ x: -1.4 + k * 2.8, car: null });
  const bayM = basic({ color: 0x3ad8f0 }); for (let k = 0; k <= 5; k++) { const ln = quad(0.1, 5.6, bayM, -2.8 + k * 2.8, 0.004, -d / 2 + 2.8, s); ln.rotation.x = -Math.PI / 2; }
  { const ln = quad(17, 0.1, white, 2.8, 0.004, -2.2, s); ln.rotation.x = -Math.PI / 2; const c2 = quad(26, 0.14, yellow, 0, 0.004, 5.8, s); c2.rotation.x = -Math.PI / 2; }
  { const [ac, ag] = cnv(256, 256); ag.fillStyle = 'rgba(0,0,0,0)'; ag.fillRect(0, 0, 256, 256); ag.fillStyle = 'rgba(230,230,220,.85)'; ag.beginPath(); ag.moveTo(14, 128); ag.lineTo(84, 70); ag.lineTo(84, 106); ag.lineTo(172, 106); ag.lineTo(172, 70); ag.lineTo(242, 128); ag.lineTo(172, 186); ag.lineTo(172, 150); ag.lineTo(84, 150); ag.lineTo(84, 186); ag.closePath(); ag.fill();
    const at = toTex(ac); [-1, 5, 10].forEach((x) => { const a = quad(1.6, 1.6, basic({ map: at, transparent: true, depthWrite: false }), x, 0.006, 3.6, s); a.rotation.x = -Math.PI / 2; a.rotation.z = Math.PI; }); }
  // ---- neon: docking-bay glow. Unlit tubes + one merged additive halo per colour, so it stays cheap ----
  const CY = 0x52eaff, MG = 0xff4fd8, neonM = { [CY]: basic({ color: CY }), [MG]: basic({ color: MG }) };
  const halos = new Map(), _o = new THREE.Object3D();
  const halo = (col, len, wid, x, y, z, rx = 0, ry = 0, rz = 0) => { const g = new THREE.PlaneGeometry(len, wid); _o.position.set(x, y, z); _o.rotation.set(rx, ry, rz); _o.updateMatrix(); g.applyMatrix4(_o.matrix); if (!halos.has(col)) halos.set(col, []); halos.get(col).push(g); };
  const tube = (col, sx, sy, sz, x, y, z) => box(sx, sy, sz, neonM[col], x, y, z, s);
  // back wall: cyan skirting line, magenta line over the bays
  tube(CY, w - 0.4, 0.035, 0.03, 0, 0.1, -d / 2 + 0.03); halo(CY, w - 0.4, 0.5, 0, 0.13, -d / 2 + 0.02);
  tube(MG, 16, 0.035, 0.03, 4.8, 2.25, -d / 2 + 0.03); halo(MG, 16, 0.55, 4.8, 2.25, -d / 2 + 0.02);
  // under every ceiling beam, a cyan line running the length of the deck
  for (let x = -11; x <= 11; x += 4.4) { tube(CY, 0.04, 0.02, d - 0.3, x, h - 0.415, 0); halo(CY, d - 0.3, 0.55, x, h - 0.43, 0, Math.PI / 2, 0, Math.PI / 2); }
  // bay numbers and the level sign in neon
  { const [nc, ng] = cnv(2048, 192); ng.clearRect(0, 0, 2048, 192); for (let k = 0; k < 5; k++) neonText(ng, '0' + (k + 1), ((1.4 + k * 2.8) / 14) * 2048, 100, '130px "Bebas Neue"', '#52eaff', 14);
    const nq = neonQuad(nc, 14, 1.31, 1.05); nq.position.set(4.2, 1.85, -d / 2 + 0.05); s.add(nq); }
  { const [pc, pg] = cnv(1024, 200); pg.clearRect(0, 0, 1024, 200); neonText(pg, 'DOCKING · LEVEL B1', 512, 104, '120px "Bebas Neue"', '#ff4fd8', 16); const pq = neonQuad(pc, 5.6, 1.1, 1.05); pq.position.set(-7.4, 1.9, -d / 2 + 0.05); s.add(pq); zeroSign(0.95, s, -3.95, 1.92, -d / 2 + 0.06); }
  // pillars with hazard bands
  const hz = (() => { const [c, g] = cnv(128, 128); g.fillStyle = '#d8b020'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#141414'; for (let i = -128; i < 256; i += 32) { g.beginPath(); g.moveTo(i, 128); g.lineTo(i + 16, 128); g.lineTo(i + 144, 0); g.lineTo(i + 128, 0); g.closePath(); g.fill(); } return toTex(c, [2, 1]); })();
  [-5.6, -0.0, 5.6, 11.2].forEach((x) => { box(0.7, h, 0.7, texMat(conc, { roughness: 0.9 }), x, h / 2, -2.3, s); box(0.72, 0.6, 0.72, basic({ map: hz }), x, 0.3, -2.3, s); });
  [[-5.6, -2.3], [0, -2.3], [5.6, -2.3], [11.2, -2.3], [-5.6, 6.6], [0, 6.6]].forEach(([x, z]) => { tube(CY, 0.74, 0.05, 0.74, x, 1.3, z); tube(CY, 0.74, 0.05, 0.74, x, 2.72, z); tube(MG, 0.04, 1.3, 0.02, x, 2.0, z + 0.355); halo(MG, 1.3, 0.4, x, 2.0, z + 0.362, 0, 0, Math.PI / 2); });
  [-5.6, 0].forEach((x) => { box(0.7, h, 0.7, texMat(conc, { roughness: 0.9 }), x, h / 2, 6.6, s); box(0.72, 0.6, 0.72, basic({ map: hz }), x, 0.3, 6.6, s); });
  // ceiling beams, pipes, fluorescent tubes
  const beam = texMat(concreteTex('#5a5652', [2, 1], 1, 0.5), { roughness: 0.95 });
  for (let x = -11; x <= 11; x += 4.4) box(0.45, 0.4, d, beam, x, h - 0.2, 0, s);
  const pipe = std({ color: 0x8a2a1a, roughness: 0.6 }), duct = std({ color: 0x9a9a9a, roughness: 0.5, metalness: 0.6 });
  cyl(0.07, 0.07, w, pipe, 0, h - 0.5, -6.6, s, 10).rotation.z = Math.PI / 2; cyl(0.25, 0.25, w, duct, 0, h - 0.42, 7.2, s, 16).rotation.z = Math.PI / 2;
  const tubeM = basic({ color: 0xeaf4ff }), tubes = [];
  for (let x = -9; x <= 11; x += 4.4) for (const z of [-4.5, 2.5]) { box(1.3, 0.06, 0.16, std({ color: 0xbababa, roughness: 0.5 }), x, h - 0.06, z, s); const tb = box(1.2, 0.04, 0.1, tubeM, x, h - 0.1, z, s); tubes.push(tb); }
  const flick = basic({ color: 0xeaf4ff }); tubes[3].material = flick; up.push((dt, t) => { flick.color.setScalar(Math.sin(t * 13.0) > 0.6 && Math.sin(t * 2.1) > 0.3 ? 0.25 : 1); });
  const L1 = new THREE.PointLight(0xdde8ff, 12, 14, 1.4); L1.position.set(2, h - 0.4, 0); s.add(L1);
  const L2 = new THREE.PointLight(0xdde8ff, 9, 12, 1.4); L2.position.set(-6, h - 0.4, 3); s.add(L2);
  // the ramp down from the glass tube, blue light pouring in at the top
  const ramp = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 4.6).rotateX(-Math.PI / 2), texMat(concreteTex('#3e3c3a', [3, 2], 1, 0.6), { roughness: 0.8 })); ramp.rotation.z = -0.35; ramp.position.set(-9.4, 1.5, 3.6); s.add(ramp);
  [-1, 1].forEach((sd) => { const rg = new THREE.Group(); rg.position.set(-9.4, 1.8, 3.6 + sd * 2.3); rg.rotation.z = -0.35; s.add(rg); box(8.6, 0.6, 0.18, texMat(conc, { roughness: 0.9 }), 0, 0, 0, rg); box(8.6, 0.03, 0.05, neonM[CY], 0, 0.315, 0, rg); });
  [-1, 1].forEach((sd) => { tube(MG, 0.03, 1.7, 0.04, -w / 2 + 0.05, 2.15, 3.6 + sd * 2.4); halo(MG, 1.7, 0.45, -w / 2 + 0.04, 2.15, 3.6 + sd * 2.4, 0, Math.PI / 2, Math.PI / 2); });
  const opening = quad(4.6, 2.2, basic({ color: 0x4f8cff }), -w / 2 + 0.03, h - 0.5, 3.6, s); opening.rotation.y = Math.PI / 2;
  const og = glow(0x4f8cff, 6, 0.35); og.position.set(-w / 2 + 1.0, h - 0.6, 3.6); s.add(og);
  const L3 = new THREE.PointLight(0x4f8cff, 10, 10, 1.4); L3.position.set(-11, h - 0.8, 3.6); s.add(L3);
  // odds and ends: ticket machine, elevator, exit sign, cones, oil stains
  { const tm = new THREE.Group(); tm.position.set(9.5, 0, 6.0); s.add(tm); rbox(0.5, 1.4, 0.4, 0.04, std({ color: 0xc8a020, roughness: 0.5 }), 0, 0.7, 0, tm, 2); quad(0.3, 0.2, basic({ color: 0x40e0a0 }), 0, 1.1, 0.205, tm); }
  { const el = new THREE.Group(); el.position.set(w / 2 - 0.05, 0, 2.0); el.rotation.y = -Math.PI / 2; s.add(el); rbox(1.6, 2.3, 0.08, 0.02, std({ color: 0x9aa0a6, roughness: 0.35, metalness: 0.8 }), 0, 1.15, 0, el, 2); box(0.02, 2.2, 0.09, std({ color: 0x2a2a2a }), 0, 1.15, 0, el); sph(0.04, basic({ color: 0xffb040 }), 1.1, 1.2, 0.06, el, 10);
    const [ec, eg] = cnv(256, 96); eg.fillStyle = '#0a2a12'; eg.fillRect(0, 0, 256, 96); eg.fillStyle = '#40ff80'; eg.font = '64px "Bebas Neue"'; eg.textAlign = 'center'; eg.textBaseline = 'middle'; eg.fillText('EXIT', 128, 52); quad(0.5, 0.19, basic({ map: toTex(ec) }), 0, 2.6, 0.06, el); }
  [[3, 4.6], [3.6, 4.9]].forEach(([x, z]) => { lathe([[0, 0], [0.18, 0], [0.16, 0.04], [0.03, 0.5], [0, 0.5]], std({ color: 0xff6a1a, roughness: 0.6 }), x, 0, z, s, 16); });
  for (let k = 0; k < 6; k++) { const st = quad(R(0.6, 1.4), R(0.4, 1.0), basic({ map: glowTex, color: 0x000000, transparent: true, opacity: R(0.25, 0.5), depthWrite: false }), R(-6, 11), 0.005, R(-6, 4), s); st.rotation.x = -Math.PI / 2; }
  { const n = 22, gl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.012, 0.07), basic({ color: 0xffffff }), n * 2), mt = new THREE.Matrix4(), cc = new THREE.Color();
    for (let k = 0; k < n * 2; k++) { mt.makeTranslation(-5 + (k % n) * 0.8, 0.008, k < n ? 2.2 : 4.9); gl.setMatrixAt(k, mt); gl.setColorAt(k, cc.setHex(CY)); } s.add(gl);
    up.push((dt, t) => { for (let k = 0; k < n * 2; k++) { const v = Math.pow(Math.max(0, Math.sin((k % n) * 0.55 - t * 5)), 6); gl.setColorAt(k, cc.setHex(CY).multiplyScalar(0.18 + 0.82 * v)); } gl.instanceColor.needsUpdate = true; }); }
  halos.forEach((list, col) => { const m = new THREE.Mesh(mergeGeometries(list), basic({ map: glowBand(), color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 })); m.userData.noCast = true; s.add(m); });
  const L4 = new THREE.PointLight(MG, 7, 10, 1.5); L4.position.set(4.2, 2.2, -6.6); s.add(L4);
  // parked cars, and the one that's arriving or leaving
  const colors = [0x8a6a4a, 0x6a7a6a, 0x9a8a6a, 0x7a3a2a, 0x5a6a7a, 0xa89a7a, 0x6a5a6a];
  const park = (st, car) => { car.g.position.set(st.x, 0.62, -5.0); car.g.rotation.set(0, Math.PI / 2, 0); car.flame.visible = false; car.fg.visible = false; car.smoke.forEach((p) => (p.material.opacity = 0)); st.car = car; };
  [0, 2, 4].forEach((k) => { const c = makeCar(pick(colors)); s.add(c.g); park(stalls[k], c); dyn.push(c.g); });
  const path = (st) => [new THREE.Vector3(-13.8, 3.5, 3.6), new THREE.Vector3(-9.4, 2.15, 3.6), new THREE.Vector3(-5.4, 0.75, 3.6), new THREE.Vector3(st.x - 2.2, 0.62, 3.4), new THREE.Vector3(st.x - 0.4, 0.62, 0.9), new THREE.Vector3(st.x, 0.62, -1.9), new THREE.Vector3(st.x, 0.62, -5.0)];
  let mover = null, timer = 2.2; const _p = new THREE.Vector3(), _tg = new THREE.Vector3();
  const lerpA = (a, b, k) => { let dd = b - a; while (dd > Math.PI) dd -= Math.PI * 2; while (dd < -Math.PI) dd += Math.PI * 2; return a + dd * k; };
  const start = (st, leaving) => {
    let car = st.car; if (!leaving) { car = makeCar(pick(colors)); s.add(car.g); } else st.car = null;
    const pts = path(st); if (leaving) pts.reverse(); mover = { car, st, leaving, curve: new THREE.CatmullRomCurve3(pts, false, 'centripetal'), k: 0, dur: leaving ? 6.5 : 7.5 };
    car.g.position.copy(pts[0]); if (!leaving) { mover.curve.getTangentAt(0, _tg); car.g.rotation.y = Math.atan2(-_tg.z, _tg.x); }
    ctx.onCar && ctx.onCar();
  };
  ctx.leaveNow = () => { if (mover) return; const full = stalls.filter((x) => x.car); if (full.length) start(pick(full), true); };
  up.push((dt, t) => {
    if (!mover) { timer -= dt; if (timer <= 0) { timer = R(8, 13); const free = stalls.filter((x) => !x.car), full = stalls.filter((x) => x.car); if (free.length && (Math.random() < 0.75 || !full.length)) start(pick(free), false); else if (full.length) start(pick(full), true); } return; }
    const M = mover; M.k = Math.min(1, M.k + dt / M.dur); const e = M.k < 0.5 ? 2 * M.k * M.k : 1 - Math.pow(-2 * M.k + 2, 2) / 2;
    M.curve.getPointAt(e, _p); M.curve.getTangentAt(Math.min(0.995, e), _tg); const c = M.car;
    c.g.position.copy(_p); c.g.position.y += Math.sin(t * 3) * 0.03; c.g.rotation.y = lerpA(c.g.rotation.y, Math.atan2(-_tg.z, _tg.x), Math.min(1, dt * (M.leaving && M.k < 0.25 ? 1.6 : 4)));
    c.g.rotation.z = -_tg.y * 0.6; c.flame.visible = true; c.flame.scale.setScalar(0.5 + Math.random() * 0.2); c.fg.visible = true;
    if (M.k >= 1) { if (M.leaving) s.remove(c.g); else park(M.st, c); mover = null; }
  });
  const hot = [];
  return { scene: s, up, hot, dyn, leaveNow: ctx.leaveNow, views: { park: { pos: new THREE.Vector3(7.5, 1.95, 6.2), target: new THREE.Vector3(-3.5, 0.9, -0.8), p: { pos: new THREE.Vector3(4.4, 1.95, 6.4), target: new THREE.Vector3(1.6, -1.1, -5.0) } } } };
}
