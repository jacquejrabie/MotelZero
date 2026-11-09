// motel.js — the building, its signage, the ship garage, the casino pod, the pool dome and the cars.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LOW, R, RI, rnd, pick, clamp, lerp, easeOut, cnv, toTex, blotch, speckle, grime, fitFont, neonText, heightToNormal, stuccoTex, concreteTex, woodTex, carpetTex, wallpaperTex, ceilingTex, tileTex, metalTex, acTex, std, phys, basic, texMat, glow, spill, neonQuad, box, rbox, cyl, sph, quad, lathe, torus, RBG, Merger, curtain, glowTex, softTex, VIDEO, VPOOL, coveGeo, zeroTex } from './kit.js';
import { RAMP, RWY, LOT_R, PLATEAU } from './space.js';

export const F = 3.2, SX0 = -21, SX1 = 4, TX0 = 4, TX1 = 14;

export function buildMotel(world, ctx) {
  const { PROJECTS, ROOM_COLORS, KUR_HUES, logoTex } = ctx;
  const m = new THREE.Group(); world.add(m);
  const hot = [], labels = [], flickers = [], up = [], doors = {}, kurWindows = [], kurLights = [];
  const M = new Merger(m);

  /* ---------- palette ---------- */
  const stT = stuccoTex('#cf8878', [5, 3], 0.45, 512);
  const stucco = texMat(stT, { roughness: 0.9 });
  const stTower = texMat(stuccoTex('#e6dccb', [3, 5], 0.4, 512), { roughness: 0.9 });
  const coralT = stuccoTex('#cf7f73', [4, 1], 0.5, 256);
  const coral = texMat(coralT, { roughness: 0.85 });
  const cream = std({ color: 0xece3d1, roughness: 0.55 });
  const teal = std({ color: 0x4a9c90, roughness: 0.38, metalness: 0.35 });
  const tealD = std({ color: 0x2f6b66, roughness: 0.5 });
  const steel = phys({ color: 0xc9ccd0, roughness: 0.22, metalness: 0.9, clearcoat: 0.3 });
  const dark = std({ color: 0x1b1922, roughness: 0.45, metalness: 0.4 });
  const greyDoor = std({ color: 0x716f6c, roughness: 0.55 });
  const greyDoorD = std({ color: 0x5f5d5a, roughness: 0.6 });
  const brass = phys({ color: 0xc9a24a, roughness: 0.28, metalness: 0.9, clearcoat: 0.5 });
  const concT = concreteTex('#8d877e', [8, 1], 4, 0.6, 512);
  const concrete = texMat(concT, { roughness: 1 });
  const cyanStrip = basic({ color: new THREE.Color(0x6fe8ff).multiplyScalar(0.62) });
  const glass = phys({ color: 0xcfe6ee, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.14, envMapIntensity: 3, depthWrite: false });
  const purple = basic({ color: 0xc04fff });
  const railGlass = phys({ color: 0xbfe4ee, roughness: 0.25, metalness: 0, transparent: true, opacity: 0.13, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false });

  /* ---------- bodies ---------- */
  const slab = rbox(SX1 - SX0, F * 3, 10, 0.12, stucco, (SX0 + SX1) / 2, F * 2.5, -5, m);
  if (!VIDEO) box(SX1 - SX0, F, 7, stucco, (SX0 + SX1) / 2, F / 2, -6.5, m); // ground floor behind the arcade
  else { const DXR = SX0 + 0.4 + ((SX1 - 0.4 - (SX0 + 0.4)) / 6) * 2; box(DXR - SX0, F, 3.4, stucco, (SX0 + DXR) / 2, F / 2, -8.3, m); box(SX1 - DXR, F, 7, stucco, (DXR + SX1) / 2, F / 2, -6.5, m); box(0.3, F, 3.7, stucco, SX0 + 0.15, F / 2, -4.75, m); } // the diner goes deep
  [SX0 + 0.15, SX1 - 0.15].forEach((x) => box(0.3, F, 3.1, stucco, x, F / 2, -1.55, m));
  const tower = rbox(TX1 - TX0 + 0.3, F * 4, 11, 0.12, stTower, (TX0 + TX1) / 2, F * 3, -5.5, m);
  box(TX1 - TX0 + 0.3, F, 3, stTower, (TX0 + TX1) / 2, F / 2, -9.5, m); // behind the lobby
  [TX0 + 0.12, TX1 + 0.03].forEach((x) => box(0.25, F, 8.2, stTower, x, F / 2, -3.9, m)); // lobby side walls
  // coral spandrel band under each row of windows (the wall between balcony and window sill)
  for (let f = 1; f <= 4; f++) rbox(TX1 - TX0 - 0.3, 0.9, 0.08, 0.02, coral, (TX0 + TX1) / 2, F * f + 0.47, 0.04, m);
  // roof: slab parapet + tower cap
  M.rbox(SX1 - SX0 + 1.0, 0.5, 11.2, 0.06, cream, (SX0 + SX1) / 2 - 0.3, F * 4 + 0.25, -4.6);
  M.rbox(TX1 - TX0 + 1.8, 0.7, 12.4, 0.1, cream, (TX0 + TX1) / 2, F * 5 + 0.35, -4.9);
  const capBand = box(TX1 - TX0 + 1.9, 0.26, 12.5, purple, (TX0 + TX1) / 2, F * 5 + 0.02, -4.9, m); capBand.userData.noCast = true;
  const capL = new THREE.PointLight(0xc04fff, 30, 16, 1.5); capL.position.set(9, F * 5 - 0.5, 2.6); m.add(capL);
  const capG = glow(0xc04fff, 12, 0.13); capG.position.set(9, F * 5 + 0.3, 2.8); m.add(capG);
  if (!LOW) { const capL2 = new THREE.PointLight(0xc04fff, 14, 12, 1.6); capL2.position.set(TX1 + 1.5, F * 5 - 0.5, -4); m.add(capL2); }
  // slab roof clutter
  M.rbox(1.6, 1.0, 1.2, 0.08, steel, -14, F * 4 + 1.0, -5.5).rbox(1.6, 1.0, 1.2, 0.08, steel, -3.5, F * 4 + 1.0, -7).cyl(0.55, 0.55, 0.06, dark, -14, F * 4 + 1.53, -5.5, null, 24).cyl(0.55, 0.55, 0.06, dark, -3.5, F * 4 + 1.53, -7, null, 24);
  M.cyl(0.14, 0.14, 1.2, dark, -18, F * 4 + 1.1, -8).cyl(0.03, 0.03, 3.2, steel, -8, F * 4 + 2.1, -8.5);
  [0.6, 1.1, 1.6, 2.1].forEach((y, i) => M.box(1.6 - i * 0.3, 0.03, 0.03, steel, -8, F * 4 + 0.5 + y, -8.5));

  /* ---------- balconies, rails, piers ---------- */
  const BX0 = SX0 - 0.5, BX1 = TX1 + 0.5;
  for (let f = 1; f <= 4; f++) {
    const y = F * f, x0 = f === 4 ? TX0 - 0.3 : BX0, len = BX1 - x0, cx = (x0 + BX1) / 2;
    M.rbox(len, 0.3, 2.7, 0.05, cream, cx, y - 0.15, 1.35);
    M.box(len, 0.1, 0.06, teal, cx, y - 0.04, 2.73); // teal nosing
    const strip = box(len - 0.4, 0.035, 0.12, cyanStrip, cx, y - 0.31, 2.5, m); strip.userData.noCast = true;
    const so = spill(0x6fe8ff, len, 3.2, 0.1); so.position.set(cx, y - F + 0.03, 1.4); if (f > 1) m.add(so);
    M.rbox(len, 0.07, 0.07, 0.03, teal, cx, y + 1.02, 2.62);
    const gr = quad(len, 0.86, railGlass, cx, y + 0.56, 2.62, m); gr.userData.noCast = true; gr.renderOrder = 2;
    for (let x = x0 + 0.05; x <= BX1 - 0.04; x += len / Math.max(1, Math.round(len / 3.6))) M.box(0.05, 0.95, 0.05, teal, x, y + 0.5, 2.62);
  }
  const mm = new THREE.Matrix4();
  const pierXs = []; for (let i = 0; i <= 6; i++) pierXs.push(SX0 + (i * (SX1 - SX0)) / 6); pierXs.push(9, TX1);
  const stripG = new THREE.BoxGeometry(0.07, F - 0.9, 0.03); const strips = new THREE.InstancedMesh(stripG, cyanStrip, pierXs.length * 5); let si = 0;
  for (const x of pierXs) for (let f = 0; f < 5; f++) {
    if (f >= 4 && x < TX0 - 0.1) continue; if (f === 0 && x < TX0 - 0.1 && x > SX0 + 0.1) continue; // open arcade on the ground floor of the slab
    if (f === 0 && x === 9) continue; // and nothing standing in the lobby doorway
    M.rbox(0.4, F, 0.6, 0.05, cream, x, f * F + F / 2, 0.25);
    if (f >= 1 || x >= TX0 - 0.1) { mm.makeTranslation(x, f * F + F / 2 + 0.1, 0.56); strips.setMatrixAt(si++, mm); }
  }
  strips.count = si; strips.userData.noCast = true; m.add(strips);
  for (const x of pierXs) if (x < TX0 - 0.1 && x > SX0 + 0.1) M.cyl(0.13, 0.13, F, teal, x, F / 2, 0.3, null, 18).cyl(0.2, 0.2, 0.08, cream, x, 0.04, 0.3, null, 18).cyl(0.2, 0.2, 0.08, cream, x, F - 0.04, 0.3, null, 18);
  for (const x of (LOW ? [SX0 + 12] : [SX0 + 4, SX0 + 12, SX0 + 20, TX1 - 2])) { const sL = new THREE.PointLight(0x6fe8ff, LOW ? 14 : 7, LOW ? 20 : 10, 1.6); sL.position.set(x, 8, 2.2); m.add(sL); }

  /* ---------- rooms ---------- */
  const bw = (SX1 - SX0) / 6;
  const ROOMS = [];
  for (let f = 1; f <= 3; f++) for (let i = 0; i < 6; i++) ROOMS.push({ x0: SX0 + i * bw, x1: SX0 + (i + 1) * bw, fl: f, num: `${f}0${i + 1}` });
  ROOMS.push({ x0: TX0, x1: 9, fl: 1, num: '107' }, { x0: 9, x1: TX1, fl: 1, num: '108' }, { x0: TX0, x1: 9, fl: 2, num: '207' }, { x0: 9, x1: TX1, fl: 2, num: '208' });
  ROOMS.push({ x0: TX0, x1: TX1, fl: 3, num: '307', suite: true }, { x0: TX0, x1: TX1, fl: 4, num: 'PH', ph: true });
  const assign = { '101': 'orchid', '102': 'hyodo', '104': 'freddie', '106': 'alien', '203': 'fmk', '307': 'kur' };
  const curtainBlue = 0x2a3a8a;
  const numPlate = (num) => { const [c, g] = cnv(128, 64); const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#e0bb62'); gr.addColorStop(0.5, '#b8913e'); gr.addColorStop(1, '#d4ad55'); g.fillStyle = gr; g.fillRect(0, 0, 128, 64); g.fillStyle = '#3a2a10'; g.font = '44px "Bebas Neue"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(num, 64, 34); return toTex(c); };
  const plaque = (p) => { const [c, g] = cnv(256, 128); g.fillStyle = '#efe6cf'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#8a7a5a'; g.lineWidth = 4; g.strokeRect(4, 4, 248, 120); g.fillStyle = '#231c18'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = fitFont(g, p.title, '54px "Bebas Neue"', 228); g.fillText(p.title, 128, 50); g.fillStyle = '#5a4a3a'; g.font = fitFont(g, p.door.toUpperCase(), 'bold 15px "Courier Prime"', 236); g.fillText(p.door.toUpperCase(), 128, 98); grime(g, 256, 128, 0.2); return toTex(c); };
  const sconceG = glowTex;
  for (const r of ROOMS) {
    const id = assign[r.num], p = id && PROJECTS[id], y0 = r.fl * F, dead = !id;
    const color = id === 'kur' ? KUR_HUES[0] : id ? ROOM_COLORS[id] : pick([0x3a4aa0, 0x3a4aa0, 0x4a5ab0, 0x1a1a28, 0x6a3a8a]);
    const lit = !dead || rnd() < 0.7;
    // window: protruding frame, glass, curtain with folds
    const wx0 = r.x0 + 1.45, wx1 = r.x1 - 0.35, wcx = (wx0 + wx1) / 2, ww = wx1 - wx0, wh = 2.25, wy = y0 + 1.4;
    M.box(ww + 0.16, 0.08, 0.26, steel, wcx, wy + wh / 2 + 0.04, 0.13).box(ww + 0.16, 0.08, 0.26, steel, wcx, wy - wh / 2 - 0.04, 0.13).box(0.08, wh + 0.16, 0.26, steel, wcx - ww / 2 - 0.04, wy, 0.13).box(0.08, wh + 0.16, 0.26, steel, wcx + ww / 2 + 0.04, wy, 0.13);
    if (r.suite) M.box(0.05, wh, 0.2, steel, wcx, wy, 0.13); M.box(ww + 0.3, 0.06, 0.4, cream, wcx, wy - wh / 2 - 0.1, 0.2); // sill
    let cur;
    if (p) {
      // project rooms: curtains drawn back, the room glowing behind them
      const peek = quad(ww, wh, basic({ map: peekTex(id, r.suite), color: new THREE.Color(color).multiplyScalar(1.15) }), wcx, wy, -0.25, m); peek.userData.noCast = true; peek.userData.go = id; hot.push(peek);
      M.box(ww, 0.02, 0.3, dark, wcx, wy + wh / 2, -0.1).box(ww, 0.02, 0.3, dark, wcx, wy - wh / 2, -0.1).box(0.02, wh, 0.3, dark, wcx - ww / 2, wy, -0.1).box(0.02, wh, 0.3, dark, wcx + ww / 2, wy, -0.1);
      const cw2 = ww * 0.24;
      [-1, 1].forEach((sd) => { const c = curtain(cw2, wh, 0x2a2350, new THREE.Color(color).multiplyScalar(0.35), 3); c.position.set(wcx + sd * (ww / 2 - cw2 / 2), wy, 0.06); m.add(c); c.userData.go = id; hot.push(c); if (!cur) cur = c; else cur.userData.twin = c; });
    } else {
      cur = curtain(ww, wh, lit ? 0x1e2a78 : 0x141a40, lit ? new THREE.Color(0x3048c0).multiplyScalar(rnd() < 0.25 ? 0.55 : 0.32) : 0x000000, Math.round(ww * 3.2)); cur.position.set(wcx, wy, 0.06); m.add(cur);
    }
    const pane = quad(ww, wh, glass, wcx, wy, 0.2, m); pane.userData.noCast = true;
    // door with raised panels, brass number, handle, peephole
    const dx = r.x0 + 0.3, dcx = dx + 0.475;
    const hinge = new THREE.Group(); hinge.position.set(dx, y0, 0.08); m.add(hinge);
    const door = rbox(0.95, 2.2, 0.07, 0.02, greyDoor, 0.475, 1.1, 0, hinge, 2);
    rbox(0.62, 0.55, 0.02, 0.01, greyDoorD, 0.475, 1.55, 0.04, hinge, 1); rbox(0.62, 0.95, 0.02, 0.01, greyDoorD, 0.475, 0.62, 0.04, hinge, 1);
    quad(0.3, 0.15, std({ map: numPlate(r.num), roughness: 0.3, metalness: 0.6 }), 0.475, 1.98, 0.045, hinge);
    sph(0.022, dark, 0.475, 1.78, 0.04, hinge, 8); cyl(0.03, 0.03, 0.08, brass, 0.84, 1.05, 0.07, hinge, 10).rotation.x = Math.PI / 2; sph(0.045, brass, 0.84, 1.05, 0.11, hinge, 12);
    M.box(0.1, 2.3, 0.22, dark, dx - 0.05, y0 + 1.15, 0.06).box(0.1, 2.3, 0.22, dark, dx + 1.0, y0 + 1.15, 0.06).box(1.2, 0.1, 0.22, dark, dcx, y0 + 2.25, 0.06);
    const voidM = quad(0.95, 2.2, basic({ color: 0x050407 }), dcx, y0 + 1.1, 0.02, m); voidM.visible = false; voidM.userData.noCast = true;
    // sconce by the door
    M.rbox(0.1, 0.22, 0.06, 0.02, steel, dx + 1.12, y0 + 2.0, 0.05); const sc = cyl(0.045, 0.035, 0.16, basic({ color: lit || !dead ? 0xffe2b0 : 0x55443a }), dx + 1.12, y0 + 2.0, 0.11, m, 12); sc.userData.noCast = true;
    if (lit || !dead) { const sg = glow(0xffd9a0, 0.8, 0.4); sg.position.set(dx + 1.12, y0 + 2.0, 0.25); m.add(sg); }
    if (p) {
      const g1 = glow(color, ww * 1.1, 0.16); g1.position.set(wcx, wy, 0.6); m.add(g1);
      const sp = spill(color, ww + 1.4, 2.6, 0.32); sp.position.set(wcx, y0 + 0.03, 1.3); m.add(sp);
      const L = new THREE.PointLight(color, r.suite ? 16 : 11, 8, 1.6); L.position.set(wcx, wy + 0.2, 1.6); m.add(L);
      if (id === 'kur') { kurWindows.push({ cur, glow: g1, spill: sp, peek: m.children.find((o) => o.userData.go === 'kur' && o.material && o.material.map && o.material.isMeshBasicMaterial && o.position.z < -0.2) }); kurLights.push(L); }
      [cur, pane, door].forEach((o) => { o.userData.go = 'projects'; hot.push(o); });
      doors[id] = { hinge, voidM, x: dcx, y0, color };
    } else if (r.num === '204') {
      [door, pane].forEach((o) => { o.userData.go = 'projects'; hot.push(o); });
      doors.projects = { hinge, voidM, x: dcx, y0, color: 0xe9b54d };
    } else {
      [door, pane].forEach((o) => { o.userData.go = 'projects'; hot.push(o); });
    }
  }

  let dinerRobot = null;
  /* ---------- ground floor: arcade under the slab ---------- */
  const AX0 = SX0 + 0.4, AX1 = SX1 - 0.4;
  const units = [['DINER', 2], ['BAR', 1], ['LAUNDRY', 1], ['ICE · VENDING', 2]];
  const shopW = (AX1 - AX0) / 6; let ux = AX0; const unitX = {};
  units.forEach(([t, wN], i) => {
    const uw = shopW * wN, cx = ux + uw / 2; ux += uw; unitX[t] = cx;
    const [c, g] = cnv(512, 160); g.fillStyle = '#efe4c8'; g.fillRect(0, 0, 512, 160); g.fillStyle = '#5a1e8a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = fitFont(g, t, '112px "Bebas Neue"', 460); g.fillText(t, 256, 84); grime(g, 512, 160, 0.3);
    let sq = null; if (t !== 'DINER' && t !== 'BAR') { sq = quad(uw - 0.6, 0.55, basic({ map: toTex(c), color: 0xf0f0f0 }), cx, F - 0.6, -2.85, m); sq.userData.noCast = true; M.rbox(uw - 0.5, 0.65, 0.08, 0.02, dark, cx, F - 0.6, -2.9); }
    M.box(uw - 0.7, 0.06, 0.1, steel, cx, 0.08, -2.0).box(uw - 0.7, 0.06, 0.1, steel, cx, F - 0.95, -2.0).box(0.06, F - 0.9, 0.1, steel, cx - uw / 2 + 0.35, F / 2 - 0.45, -2.0).box(0.06, F - 0.9, 0.1, steel, cx + uw / 2 - 0.35, F / 2 - 0.45, -2.0);
    const gp = quad(uw - 0.7, F - 0.95, glass, cx, F / 2 - 0.45, -2.0, m); gp.userData.noCast = true;
    if (t === 'DINER') gp.userData.go = 'diner', hot.push(gp);
    if (!LOW || i === 0 || i === 3) { const sl = new THREE.PointLight(t === 'DINER' ? 0xffd2a0 : 0xb060ff, LOW ? 20 : 10, LOW ? 14 : 8, 1.6); sl.position.set(cx, 2.2, -1.4); if (VIDEO && t === 'DINER') { sl.position.set(cx, 2.5, -4.1); sl.distance = 10; sl.color.setHex(0xffc890); } m.add(sl); }
  });
  // diner: booths, counter stools and a pie case glowing behind the glass, marquee with chaser bulbs under the balcony
  { const cx = unitX.DINER, uw = shopW * 2;
    dinerRobot = VIDEO ? videoDiner(m, cx, uw, up) : diner(m, cx, uw, M, up); if (dinerRobot.hot) hot.push(...dinerRobot.hot);
    const mq = new THREE.Group(); mq.position.set(cx, F - 0.85, 2.95); m.add(mq);
    rbox(uw - 0.5, 0.72, 0.36, 0.05, phys({ color: 0x3a0f22, roughness: 0.4, metalness: 0.3, clearcoat: 0.6 }), 0, 0, 0, mq, 2);
    const [mc, mg] = cnv(1024, 160); mg.fillStyle = '#f3e6c4'; mg.fillRect(0, 0, 1024, 160); mg.fillStyle = '#c0182a'; mg.textAlign = 'center'; mg.textBaseline = 'middle'; mg.font = fitFont(mg, 'DINER', '128px "Bebas Neue"', 600); mg.fillText('DINER', 360, 86); mg.fillStyle = '#3a0f22'; mg.font = 'bold 26px "Courier Prime"'; mg.fillText('BURGERS · SHAKES', 820, 62); mg.fillText('PIE ALL NIGHT', 820, 104); grime(mg, 1024, 160, 0.2);
    const mqq = quad(uw - 0.9, 0.5, basic({ map: toTex(mc), color: new THREE.Color(1.0, 1.0, 1.0) }), 0, 0, 0.235, mq);
  [-(uw - 1.2) / 2, (uw - 1.2) / 2].forEach((x) => box(0.04, 0.5, 0.04, steel, x, 0.6, -0.1, mq)); mqq.userData.noCast = true;
    const bulbs = []; const bw2 = (uw - 0.75) / 2, bh2 = 0.31; const per = 4 * bw2 + 4 * bh2;
    for (let k = 0; k < 44; k++) { let d = (k / 44) * per, x, y; if (d < 2 * bw2) { x = -bw2 + d; y = bh2; } else if ((d -= 2 * bw2) < 2 * bh2) { x = bw2; y = bh2 - d; } else if ((d -= 2 * bh2) < 2 * bw2) { x = bw2 - d; y = -bh2; } else { d -= 2 * bw2; x = -bw2; y = -bh2 + d; } const b = sph(0.032, basic({ color: 0xffd9a0 }), x, y, 0.245, mq, 8); b.userData.noCast = true; bulbs.push(b); }
    up.push((t) => bulbs.forEach((b, k) => b.material.color.setHex((Math.floor(t * 9) + k) % 3 === 0 ? 0xffffff : 0x9a6a3a)));
    { let dip = 0, nxt = R(2, 6); up.push((t, dt) => { nxt -= dt; if (nxt <= 0) { dip = R(0.15, 0.6); nxt = R(3, 9); } if (dip > 0) dip -= dt; const f = dip > 0 ? (Math.sin(t * 53) > -0.2 ? 0.45 : 1) : 1; mqq.material.color.setScalar(f); }); }
    const cg = glow(0xff4060, uw * 0.5, 0.04); cg.position.set(0, 0, 0.5); mq.add(cg);
    [mqq].forEach((o) => { o.userData.go = 'diner'; hot.push(o); });
  }
  // bar: neon martini glass
  { const cx = unitX.BAR; const [c, g] = cnv(512, 512); g.lineCap = g.lineJoin = 'round';
    const tube = (col, w, fn) => { g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 26; g.lineWidth = w; fn(); g.stroke(); g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = w * 0.35; fn(); g.stroke(); };
    tube('#40e8ff', 14, () => { g.beginPath(); g.moveTo(130, 90); g.lineTo(382, 90); g.lineTo(256, 250); g.closePath(); g.moveTo(256, 250); g.lineTo(256, 400); g.moveTo(190, 410); g.lineTo(322, 410); });
    tube('#ff5fd8', 12, () => { g.beginPath(); g.moveTo(300, 60); g.lineTo(250, 150); g.moveTo(262, 150); g.arc(250, 150, 12, 0, Math.PI * 2); });
    neonText(g, 'BAR', 256, 470, '64px "Bebas Neue"', '#ff5fd8', 16);
    const bq = neonQuad(c, 1.2, 1.2); bq.position.set(cx, F - 0.85, 2.0); m.add(bq); const bgl = glow(0x40e8ff, 2.4, 0.1); bgl.position.set(cx, F - 0.85, 2.2); m.add(bgl);
    flickers.push({ mat: bq.material, rate: 0.25, base: 1 });
  }
  // vending + ice machines in their bays
  const KV = unitX['ICE · VENDING'] - 0.4; const vendG = new THREE.Group(); vendG.position.set(KV + 0.58, 0, -2.4); m.add(vendG);
  rbox(1.0, 1.9, 0.8, 0.04, std({ color: 0xa02a2a, roughness: 0.35, metalness: 0.2 }), 0, 0.95, 0, vendG);
  const vface = quad(0.82, 1.6, basic({ map: vendTex(), color: 0xe8e8e8 }), 0, 1.05, 0.41, vendG);
  rbox(0.62, 0.16, 0.06, 0.02, dark, 0, 0.32, 0.41, vendG, 1); box(0.54, 0.1, 0.02, std({ color: 0x050505 }), 0, 0.32, 0.44, vendG);
  const vhit = box(1.0, 1.9, 0.85, basic({ color: 0xffffff }), 0, 0.95, 0.02, vendG); vhit.visible = false; [vface, vhit].forEach((o) => { o.userData.go = 'machines'; o.userData.fx = 'vending'; hot.push(o); });
  const vg = glow(0xbfe8ff, 2.2, 0.25); vg.position.set(0, 1.1, 0.6); vendG.add(vg);
  const iceG = new THREE.Group(); iceG.position.set(KV - 0.62, 0, -2.4); m.add(iceG);
  rbox(1.1, 1.5, 0.85, 0.05, phys({ color: 0xd0d0c8, roughness: 0.3, metalness: 0.5, clearcoat: 0.4 }), 0, 0.75, 0, iceG);
  const [ic, ig] = cnv(256, 96); ig.fillStyle = '#1d5fa8'; ig.fillRect(0, 0, 256, 96); ig.fillStyle = '#fff'; ig.font = '74px "Bebas Neue"'; ig.textAlign = 'center'; ig.textBaseline = 'middle'; ig.fillText('ICE', 128, 52); grime(ig, 256, 96, 0.4);
  quad(0.9, 0.34, basic({ map: toTex(ic), color: 0xcccccc }), 0, 1.25, 0.43, iceG);
  rbox(0.4, 0.22, 0.08, 0.03, dark, 0, 0.66, 0.43, iceG, 1); box(0.32, 0.14, 0.02, std({ color: 0x050505 }), 0, 0.66, 0.48, iceG);
  const ihit = box(1.1, 1.5, 0.9, basic({ color: 0xffffff }), 0, 0.75, 0.02, iceG); ihit.visible = false; ihit.userData.go = 'machines'; ihit.userData.fx = 'ice'; hot.push(ihit);
  const pile = makePile(KV - 2.6, KV + 2.6, -2.0, 1.4); const spots = { vending: spitter(m, up, new THREE.Vector3(KV + 0.58, 0.32, -1.95), pile), ice: iceBurst(m, up, new THREE.Vector3(KV - 0.62, 0.66, -1.92), pile), diner: { x: unitX.DINER, order: () => dinerRobot && dinerRobot.order && dinerRobot.order(), wake: () => dinerRobot && dinerRobot.wake(), show: (on) => dinerRobot && dinerRobot.show(on) }, machines: { x: KV } };
  const purpleGround = spill(0xa040ff, 30, 12, 0.34); purpleGround.position.set((AX0 + AX1) / 2, 0.04, 2.6); m.add(purpleGround);
  // sidewalk
  M.rbox(SX1 - SX0 + 1.2, 0.16, 3.2, 0.03, concrete, (SX0 + SX1) / 2, 0.08, 1.4);

  /* ---------- the lobby: orange glass box under the tower ---------- */
  const L = new THREE.Group(); m.add(L);
  const lx = (TX0 + TX1) / 2, LD = 8.5;
  const inF = quad(TX1 - TX0 - 0.2, LD, texMat(carpetTex(['#8a5a1e', '#c4862e', '#4a2a12'], 'circles', [4, 4]), { roughness: 0.95 }), lx, 0.03, -LD / 2 + 0.5, L); inF.rotation.x = -Math.PI / 2; inF.receiveShadow = true;
  quad(TX1 - TX0 - 0.2, F - 0.2, texMat(wallpaperTex(900, 300, { bg: '#7a4a24', fg: '#e8b860', kind: 'atomic', scale: 60, wainscot: { col: '#5a3820', frac: 0.4 } })), lx, F / 2 - 0.1, -LD + 0.53, L);
  const woodW = texMat(woodTex(512, 256, '#6a4222', 20, [1, 1]), { roughness: 0.5 });
  [TX0 + 0.28, TX1 - 0.13].forEach((x, i) => { const sw = quad(LD - 0.1, F - 0.2, woodW, x, F / 2 - 0.1, -LD / 2 + 0.5, L); sw.rotation.y = i ? -Math.PI / 2 : Math.PI / 2; });
  const lc = quad(TX1 - TX0 - 0.2, LD, texMat(ceilingTex([4, 3], false)), lx, F - 0.22, -LD / 2 + 0.5, L); lc.rotation.x = Math.PI / 2;
  // luminous egg-crate ceiling panel, the warm box you see from the lot
  const lum = (() => { const [c, g] = cnv(256, 256); g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(120,80,40,.55)'; g.lineWidth = 3; for (let i = 0; i <= 256; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); } return toTex(c, [4, 3]); })();
  const lp = quad(TX1 - TX0 - 1.2, LD - 2.4, basic({ map: lum, color: new THREE.Color(0xff9a40).multiplyScalar(1.45) }), lx, F - 0.25, -LD / 2 + 0.9, L); lp.rotation.x = Math.PI / 2; lp.userData.noCast = true;
  // desk, lamp, logo neon, couch, plant, rack
  rbox(4.2, 1.08, 0.75, 0.04, woodW, lx, 0.54, -4.6, L); rbox(4.4, 0.07, 0.9, 0.03, phys({ color: 0xc7b28c, roughness: 0.3, clearcoat: 0.6 }), lx, 1.115, -4.6, L);
  const bell = sph(0.09, brass, lx + 1.3, 1.2, -4.4, L, 20); bell.scale.y = 0.7;
  quad(3.4, 3.4 / 1.915, basic({ map: logoTex, transparent: true, depthWrite: false, color: new THREE.Color(1.5, 1.5, 1.5) }), lx, 2.3, -LD + 0.58, L).userData.noCast = true;
  const logoL = new THREE.PointLight(0x9a7cff, 8, 7, 1.6); logoL.position.set(lx, 2.3, -LD + 1.5); L.add(logoL);
  lampMini(L, lx - 1.5, 1.15, -4.65, 0x2f6a3a, 0xffc070);
  const sofa = new THREE.Group(); sofa.position.set(TX0 + 1.7, 0, -2.3); sofa.rotation.y = 0.4; L.add(sofa); const vinyl = phys({ color: 0xc8611e, roughness: 0.4, clearcoat: 0.5 });
  rbox(2.2, 0.45, 0.85, 0.12, vinyl, 0, 0.3, 0, sofa); rbox(2.2, 0.6, 0.22, 0.1, vinyl, 0, 0.7, -0.33, sofa); rbox(0.2, 0.55, 0.85, 0.08, vinyl, -1.1, 0.42, 0, sofa); rbox(0.2, 0.55, 0.85, 0.08, vinyl, 1.1, 0.42, 0, sofa);
  plant(L, TX1 - 0.9, 0, -LD + 1.3);
  const inL = new THREE.SpotLight(0xffa850, 60, 16, 1.1, 0.5, 1.3); inL.position.set(lx, F - 0.3, -3.5); inL.target.position.set(lx, 0, -3); inL.castShadow = !LOW; inL.shadow.mapSize.set(1024, 1024); inL.shadow.bias = -0.0005; L.add(inL, inL.target);
  if (!LOW) { const inL2 = new THREE.PointLight(0xffb870, 16, 10, 1.6); inL2.position.set(lx, 1.6, 1.6); L.add(inL2); }
  const og = glow(0xffa040, 10, 0.2); og.position.set(lx, 1.6, 1.2); L.add(og);
  const osp = spill(0xffa040, 12, 6, 0.55); osp.position.set(lx, 0.04, 3.2); L.add(osp);
  // glass curtain wall + doors
  const gw = quad(TX1 - TX0 - 0.3, F - 0.3, phys({ color: 0xffe0c0, roughness: 0.03, transparent: true, opacity: 0.1, envMapIntensity: 2.5, depthWrite: false }), lx, F / 2 - 0.05, 0.62, L); gw.userData.noCast = true;
  for (let i = 0; i <= 5; i++) M.box(0.08, F - 0.2, 0.14, steel, TX0 + 0.15 + i * ((TX1 - TX0 - 0.3) / 5), F / 2 - 0.05, 0.62);
  M.box(TX1 - TX0, 0.14, 0.2, steel, lx, F - 0.22, 0.62).box(TX1 - TX0, 0.12, 0.2, steel, lx, 0.22, 0.62).box(TX1 - TX0, 0.06, 0.08, steel, lx, 2.3, 0.62);
  [-0.42, 0.42].forEach((x) => M.rbox(0.74, 0.05, 0.05, 0.02, steel, lx + x, 1.15, 0.72));
  const [nc, ng] = cnv(1024, 300); neonText(ng, 'Lobby', 512, 160, '240px "Yellowtail"', '#ff8a3a', 30);
  const lobbySign = neonQuad(nc, 4.6, 1.35); lobbySign.position.set(lx, F + 0.66, 2.8); L.add(lobbySign);
  const lsL = new THREE.PointLight(0xff8a3a, 12, 9, 1.5); lsL.position.set(lx, F + 0.6, 3.8); L.add(lsL);
  const [oc, ogx] = cnv(256, 96); neonText(ogx, 'OPEN', 128, 50, '70px "Bebas Neue"', '#ff3030', 16); ogx.strokeStyle = '#3aa0ff'; ogx.shadowColor = '#3aa0ff'; ogx.shadowBlur = 10; ogx.lineWidth = 4; ogx.strokeRect(14, 10, 228, 76);
  const openSign = neonQuad(oc, 0.8, 0.3); openSign.position.set(TX0 + 1.3, 2.1, 0.55); L.add(openSign); flickers.push({ mat: openSign.material, rate: 0.5, base: 1 });
  M.rbox(TX1 - TX0 + 1.2, 0.16, 4.0, 0.03, concrete, lx, 0.08, 1.9); // entry apron
  [gw, lobbySign].forEach((o) => { o.userData.go = 'lobby'; hot.push(o); });
  labels.push({ go: 'lobby', text: 'About', color: '#ff8a3a', pos: new THREE.Vector3(lx, 0.55, 3.6), below: new THREE.Vector3(lx, 0.0, 4.3), dy: -22, always: true });
  labels.push({ go: 'projects', text: 'Projects', color: '#e9b54d', pos: new THREE.Vector3(SX0 + 3 * ((SX1 - SX0) / 6) + 0.78, F * 2 + 2.75, 0.9), always: true });

  /* ---------- signage ---------- */
  // MOTEL blade on the tower's right flank
  const blade = new THREE.Group(); blade.position.set(TX1 + 1.15, 0, 1.6); blade.rotation.y = 0.55; m.add(blade);
  rbox(1.9, 11.4, 0.55, 0.08, phys({ color: 0x2a1450, roughness: 0.35, metalness: 0.3, clearcoat: 0.6 }), 0, 9.9, 0, blade, 3);
  const bEdge = box(2.0, 11.5, 0.1, basic({ color: 0x8a3aff }), 0, 9.9, -0.3, blade); bEdge.userData.noCast = true;
  [5.0, 9.9, 14.6].forEach((y) => { const ax = TX1 + 0.15, az = 0.4, bx = TX1 + 0.95, bz = 1.35; M.box(Math.hypot(bx - ax, bz - az), 0.12, 0.12, dark, (ax + bx) / 2, y, (az + bz) / 2, [0, -Math.atan2(bz - az, bx - ax), 0]); });
  ['M', 'O', 'T', 'E', 'L'].forEach((ch, i) => { const [lc2, lg] = cnv(192, 192); neonText(lg, ch, 96, 104, '170px "Bebas Neue"', '#e070ff', 18); const q = neonQuad(lc2, 1.7, 1.7); q.position.set(0, 14.1 - i * 2.1, 0.29); blade.add(q); if (ch === 'E') flickers.push({ mat: q.material, rate: 0.6, base: 1, sputter: true }); });
  const bg = glow(0xc060ff, 9, 0.06); bg.position.set(0, 9.9, 0.9); blade.add(bg);
  const bL = new THREE.PointLight(0xc060ff, 15, 14, 1.5); bL.position.set(0.6, 9.9, 2.4); blade.add(bL);
  // VACANCY on the tower cap
  const vac = new THREE.Group(); vac.position.set(10.5, F * 5 + 0.7, -0.8); vac.rotation.y = 0.25; m.add(vac);
  [-2.75, 0, 2.75].forEach((x) => { cyl(0.05, 0.06, 2.45, steel, x, 1.22, -0.07, vac, 8); box(0.32, 0.04, 0.32, steel, x, 0.02, -0.07, vac); });
  box(5.9, 0.06, 0.06, steel, 0, 1.37, -0.07, vac); box(5.9, 0.05, 0.05, steel, 0, 2.43, -0.07, vac);
  [-2.75, 2.75].forEach((x) => { const br = cyl(0.025, 0.025, 1.15, steel, x, 0.5, -0.5, vac, 6); br.rotation.x = 0.78; });
  const [vc3, vg4] = cnv(1024, 160); neonText(vg4, 'VACANCY', 512, 84, '140px "Bebas Neue"', '#3ff3ff', 14);
  const vq = neonQuad(vc3, 6.4, 1.0); vq.position.set(0, 1.9, 0); vac.add(vq); flickers.push({ mat: vq.material, rate: 0.3, base: 1, sputter: true });
  const vgl = glow(0x3ff3ff, 6, 0.08); vgl.position.set(0, 1.9, 0.3); vac.add(vgl);
  const beacon = sph(0.1, basic({ color: 0xff2020 }), -3.6, 3.3, -0.5, vac, 8); beacon.userData.noCast = true; cyl(0.022, 0.035, 3.2, steel, -3.6, 1.6, -0.5, vac, 8); box(0.3, 0.04, 0.3, steel, -3.6, 0.02, -0.5, vac); box(0.5, 0.025, 0.025, steel, -3.6, 2.7, -0.5, vac); box(0.32, 0.025, 0.025, steel, -3.6, 2.95, -0.5, vac);
  up.push((t) => (beacon.material.color.setHex(Math.sin(t * 2.5) > 0.7 ? 0xff3030 : 0x401010)));
  // Motel Zero neon logo on the slab roof, on a frame
  const lg = new THREE.Group(); lg.position.set(-9, F * 4 + 0.5, -1.2); lg.rotation.y = 0.12; m.add(lg);
  [-3.4, 0, 3.4].forEach((x) => M.cyl(0.05, 0.05, 2.2, steel, x - 9, F * 4 + 1.6, -1.2)); M.box(7.4, 0.06, 0.06, steel, -9, F * 4 + 2.7, -1.2);
  // same neon logo, now with depth: channel-letter sides stacked behind the face, and the pink star wired on its own (it blinks)
  const LW = 10.4, LH = 10.4 / 1.915, ldr = new THREE.TextureLoader(), noStar = ldr.load('assets/logo_nostar.webp'), starT = ldr.load('assets/logo_star.webp'); [noStar, starT].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });
  const rl = quad(LW, LH, basic({ map: noStar, transparent: true, depthWrite: false, color: new THREE.Color(1.3, 1.3, 1.3) }), 0, 2.75, 0, lg); rl.userData.noCast = true;
  { const sides = mergeGeometries(Array.from({ length: 9 }, (_, i) => new THREE.PlaneGeometry(LW, LH).translate(0, 2.75, -0.025 * (i + 1)))); const sm = new THREE.Mesh(sides, basic({ map: noStar, alphaTest: 0.62, color: 0x23163a })); sm.userData.noBatch = true; lg.add(sm);
    const sx = (261 / 994 - 0.5) * LW, sy = 2.75 + (0.5 - 171 / 519) * LH, ss = (142 / 994) * LW;
    const star = quad(ss, ss, basic({ map: starT, transparent: true, depthWrite: false, color: new THREE.Color(1.3, 1.3, 1.3) }), sx, sy, 0.002, lg); star.userData.noCast = true; star.userData.noBatch = true;
    const ssides = new THREE.Mesh(mergeGeometries(Array.from({ length: 9 }, (_, i) => new THREE.PlaneGeometry(ss, ss).translate(sx, sy, -0.025 * (i + 1)))), basic({ map: starT, alphaTest: 0.62, color: 0x3a1430 })); ssides.userData.noBatch = true; lg.add(ssides);
    let on = true, next = R(4, 9), stut = 0;
    up.push((t, dt) => { next -= dt; if (next <= 0) { on = !on; next = on ? R(3, 10) : R(0.4, 1.6); stut = on ? 0.35 : 0.25; } if (stut > 0) stut -= dt; const lit = on ? (stut > 0 ? Math.sin(t * 60) > 0 : true) : (stut > 0 ? Math.sin(t * 47) > 0.3 : false); star.visible = lit; star.material.opacity = 1; }); }
  const rlL = new THREE.PointLight(0x8f7bff, 28, 18, 1.5); rlL.position.set(0, 2.2, 2.4); lg.add(rlL);
  const rlg = glow(0xa080ff, 12, 0.1); rlg.position.set(0, 2.75, 0.2); lg.add(rlg);
  flickers.push({ mat: rl.material, rate: 0.08, base: 1, light: rlL, li: 28 });

  /* ---------- sunken ship garage: glass tube over a glowing ramp, runway leading in ---------- */
  const zc = RAMP.zc, w = RAMP.z1 - RAMP.z0, len = RAMP.x1 - RAMP.x0;
  const laneT = (() => { const [c, g] = cnv(512, 256); g.fillStyle = '#0a1a5a'; g.fillRect(0, 0, 512, 256); g.fillStyle = 'rgba(160,220,255,.95)'; g.fillRect(0, 10, 512, 6); g.fillRect(0, 240, 512, 6); for (let x = 0; x < 512; x += 64) g.fillRect(x, 124, 36, 8); g.fillStyle = 'rgba(160,220,255,.6)'; g.font = '70px "Bebas Neue"'; g.textAlign = 'center'; g.fillText('P ▸', 420, 105); return toTex(c); })();
  const ramp = box(Math.hypot(len, RAMP.bottom) + 0.05, 0.12, w, std({ map: laneT, emissive: 0x2050ff, emissiveMap: laneT, emissiveIntensity: 1.1, roughness: 0.25 }), (RAMP.x0 + RAMP.x1) / 2, RAMP.bottom / 2 - 0.06, zc, m);
  ramp.rotation.z = Math.atan2(RAMP.bottom, len); ramp.userData.noCast = true;
  const rampWall = texMat(concreteTex('#6a6670', [4, 1], 2, 0.5, 256), { roughness: 0.8 });
  [RAMP.z0, RAMP.z1].forEach((z, i) => { const q = quad(len, 2.6, rampWall, (RAMP.x0 + RAMP.x1) / 2, -1.3, z, m); q.rotation.y = i ? Math.PI : 0; });
  const [pc, pg] = cnv(256, 128); pg.fillStyle = '#05060c'; pg.fillRect(0, 0, 256, 128); const pgr = pg.createRadialGradient(128, 128, 10, 128, 110, 140); pgr.addColorStop(0, 'rgba(60,140,255,.9)'); pgr.addColorStop(1, 'rgba(0,0,0,0)'); pg.fillStyle = pgr; pg.fillRect(0, 0, 256, 128); pg.strokeStyle = '#5fe8ff'; pg.lineWidth = 6; pg.strokeRect(10, 10, 236, 118);
  const portal = quad(w, 2.6, basic({ map: toTex(pc) }), RAMP.x1, -1.3, zc, m); portal.rotation.y = -Math.PI / 2; portal.userData.noCast = true;
  const tubeLen = 11, R0t = 3.1;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(R0t, R0t, tubeLen, 48, 1, true, 0, Math.PI), phys({ color: 0x9fe8ff, roughness: 0.02, transparent: true, opacity: 0.18, envMapIntensity: 3, side: THREE.DoubleSide, depthWrite: false }));
  tube.rotation.z = Math.PI / 2; tube.position.set(RAMP.x0 + tubeLen / 2, 0, zc); tube.userData.noCast = true; m.add(tube);
  for (let k = 0; k <= 6; k++) { const rib = torus(R0t, k === 0 ? 0.11 : 0.055, k === 0 ? cyanStrip : steel, RAMP.x0 + k * (tubeLen / 6), 0, zc, m, 40, Math.PI); rib.rotation.y = Math.PI / 2; if (k === 0) rib.userData.noCast = true; }
  [zc - R0t, zc + R0t].forEach((z) => { M.rbox(tubeLen + 0.4, 0.22, 0.3, 0.05, steel, RAMP.x0 + tubeLen / 2, 0.11, z); const b = box(tubeLen, 0.05, 0.08, cyanStrip, RAMP.x0 + tubeLen / 2, 0.24, z, m); b.userData.noCast = true; });
  const tL = new THREE.PointLight(0x3f7bff, 26, 13, 1.4); tL.position.set(RAMP.x0 + 4, 1.2, zc); m.add(tL);
  const tg = glow(0x3f7bff, 12, 0.22); tg.position.set(RAMP.x0 + 4, 0.8, zc); m.add(tg);
  const rT = (() => { const [c, g] = cnv(1024, 128); g.fillStyle = '#16161c'; g.fillRect(0, 0, 1024, 128); speckle(g, 1024, 128, 4000, 0.3, ['#000', '#555']); g.fillStyle = 'rgba(120,200,255,.85)'; g.fillRect(0, 6, 1024, 4); g.fillRect(0, 118, 1024, 4); g.fillStyle = 'rgba(240,240,240,.75)'; for (let x = 40; x < 900; x += 70) g.fillRect(x, 61, 38, 6); for (let k = 0; k < 4; k++) { g.beginPath(); const x = 930 + k * 20; g.moveTo(x, 40); g.lineTo(x + 14, 64); g.lineTo(x, 88); g.lineTo(x - 6, 88); g.lineTo(x + 8, 64); g.lineTo(x - 6, 40); g.fill(); } g.font = '64px "Bebas Neue"'; g.save(); g.translate(60, 64); g.rotate(Math.PI / 2); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('M0', 0, 0); g.restore(); return toTex(c); })();
  const rwy = quad(RWY.x1 - RWY.x0, w + 0.8, std({ map: rT, roughness: 0.6 }), (RWY.x0 + RWY.x1) / 2, 0.02, zc, m); rwy.rotation.x = -Math.PI / 2; rwy.userData.noCast = true;
  const rwyLights = []; for (let x = RWY.x0 + 0.5; x < RWY.x1; x += 1.6) for (const z of [RAMP.z0 - 0.45, RAMP.z1 + 0.45]) rwyLights.push(sph(0.09, basic({ color: 0x3f7bff }), x, 0.1, z, m, 8));
  up.push((t) => rwyLights.forEach((l, i) => { const k = Math.floor(i / 2); const on = (Math.floor(t * 10) - k) % 17 === 0 || (Math.floor(t * 10) - k) % 17 === 1; l.material.color.setHex(on ? 0xffffff : 0x2a50d0); }));
  const [gc, gg] = cnv(512, 160); neonText(gg, 'DOCKING', 256, 84, '128px "Bebas Neue"', '#5fe8ff', 5);
  const gs = new THREE.Group(); gs.position.set(RAMP.x0 - 1.5, 0, RAMP.z1 + 2.6); gs.rotation.y = 0.5; m.add(gs);
  [-1.25, 1.25].forEach((x) => cyl(0.035, 0.035, 2.75, steel, x, 1.37, -0.06, gs, 10));
  rbox(3.0, 0.82, 0.07, 0.035, std({ color: 0x17181d, roughness: 0.35, metalness: 0.6 }), 0, 3.05, -0.05, gs, 3);
  const gEdge = box(2.8, 0.018, 0.02, basic({ color: 0x3aa8c0 }), 0, 2.67, 0.0, gs); gEdge.userData.noCast = true;
  const gq = neonQuad(gc, 2.8, 0.875, 0.92); gq.position.set(0, 3.05, 0.0); gs.add(gq);
  [tube, ramp, gq, portal, rwy].forEach((o) => { o.userData.go = 'landing'; hot.push(o); });
  labels.push({ go: 'landing', text: 'Contact us', color: '#5fe8ff', pos: new THREE.Vector3(RAMP.x0 + 5.5, 4.0, RAMP.zc), below: new THREE.Vector3(RAMP.x0 + 5.5, 0.0, RAMP.z1 + 0.5), always: true });

  /* ---------- pool under a glass dome, so people can breathe (right of the tower). Click it to look in. ---------- */
  const PD = new THREE.Group(); PD.position.set(22, 0, -14); m.add(PD);
  const dR = 5.4, PRX = 3.4, PRZ = 2.1, DECK = 1.21, WL = 1.12, DEPTH = 1.05;
  const flagT = flagstoneTex();
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(dR + 0.2, dR + 0.45, 1.2, 56, 1, true), texMat(flagT, { roughness: 0.95 })); plinth.position.y = 0.6; PD.add(plinth);
  const dsh = new THREE.Shape(); dsh.absarc(0, 0, dR + 0.2, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absellipse(0, 0, PRX + 0.05, PRZ + 0.05, 0, Math.PI * 2, true); dsh.holes.push(hole);
  const dgeo = new THREE.ShapeGeometry(dsh, 72); { const uv = dgeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / (2 * dR) + 0.5, uv.getY(i) / (2 * dR) + 0.5); } dgeo.rotateX(-Math.PI / 2);
  const deck = new THREE.Mesh(dgeo, VPOOL ? texMat(woodTex(512, 512, '#3a2a22', 14, [3, 3], 0.6), { roughness: 0.5 }) : texMat(tileTex(['#b4a891', '#968b76'], [4, 4], 8, 0.45), { roughness: 0.6 })); deck.position.y = DECK; deck.receiveShadow = true; PD.add(deck);
  // the basin: tiled walls and floor, lamps in the walls, caustics dancing on the bottom
  const poolTile = (rep) => texMat(tileTex(['#2f7690', '#1d5266', '#76b8c8'], rep, 8, 0.3), { roughness: 0.35, emissive: 0x0e6a80, emissiveIntensity: LOW ? 0.42 : 0.34 });
  const walls = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, DEPTH, 72, 1, true), poolTile([9, 0.55])); walls.material.side = THREE.BackSide; walls.scale.set(PRX, 1, PRZ); walls.position.y = DECK - DEPTH / 2; walls.receiveShadow = true; PD.add(walls);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1, 72).rotateX(-Math.PI / 2), poolTile([3.4, 2.1])); floor.scale.set(PRX, 1, PRZ); floor.position.y = DECK - DEPTH; floor.receiveShadow = true; PD.add(floor);
  const caus = causticTex(); const causL = [];
  [[3.4, 2.1, 0.34], [2.3, 1.45, 0.24]].forEach(([rx, rz, op], i) => { const t = caus.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, rz); const q = new THREE.Mesh(new THREE.CircleGeometry(1, 72).rotateX(-Math.PI / 2), basic({ map: t, color: 0x9ff4ff, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); q.scale.set(PRX - 0.02, 1, PRZ - 0.02); q.position.y = DECK - DEPTH + 0.01 + i * 0.004; q.userData.noCast = true; PD.add(q); causL.push(t); });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.3, lamp = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20), basic({ color: 0xd8fbff })); lamp.position.set(Math.cos(a) * (PRX - 0.01), DECK - DEPTH * 0.55, Math.sin(a) * (PRZ - 0.01)); lamp.lookAt(0, lamp.position.y, 0); lamp.userData.noCast = true; PD.add(lamp); const lg = glow(0x7ff0ff, 0.7, 0.22); lg.position.copy(lamp.position).multiplyScalar(0.94); PD.add(lg); }
  if (!LOW) { const uw = new THREE.PointLight(0x5fe8ff, 6, 5.5, 1.6); uw.position.set(0, DECK - DEPTH * 0.5, 0); PD.add(uw); }
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 72).rotateX(-Math.PI / 2), phys({ color: 0x0d5f78, emissive: 0x0a8aa2, emissiveIntensity: 0.34, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.5, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 2.2, depthWrite: false, normalMap: rippleTex(), normalScale: new THREE.Vector2(0.28, 0.28) }));
  water.material.normalMap.repeat.set(3.4, 2.1); water.scale.set(PRX, 1, PRZ); water.position.y = WL; water.userData.noCast = true; PD.add(water);
  const rimT = torus(1, 0.09, phys({ color: 0xe8e0d0, roughness: 0.4, clearcoat: 0.3 }), 0, DECK + 0.04, 0, PD, 72); rimT.rotation.x = Math.PI / 2; rimT.scale.set(PRX + 0.1, PRZ + 0.1, 1);
  const ladder = new THREE.Group(); ladder.position.set(PRX - 0.18, DECK, 0.35); ladder.rotation.y = -Math.PI / 2; PD.add(ladder); [-0.22, 0.22].forEach((x) => { const rl = torus(0.2, 0.02, chromeM(), x, 0.0, 0.05, ladder, 16, Math.PI); rl.rotation.y = Math.PI / 2; cyl(0.02, 0.02, 0.9, chromeM(), x, -0.45, -0.15, ladder, 8); }); [0.25, 0.55].forEach((d) => rbox(0.46, 0.03, 0.12, 0.01, chromeM(), 0, -d, -0.12, ladder, 1));
  const poolL = new THREE.PointLight(0x40e0ff, 9, 14, 1.4); poolL.position.set(0, 3.6, 0); PD.add(poolL);
  // someone on a floatie
  const SW = floatie(); SW.g.position.set(0, WL, 0); PD.add(SW.g);
  const ripT = softTex(128, (r) => Math.exp(-Math.pow((r - 0.82) / 0.07, 2))); const rips = [0, 0.5].map((ph) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), basic({ map: ripT, color: 0xe8ffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); q.position.y = WL + 0.006; q.userData.noCast = true; PD.add(q); return { q, ph }; });
  up.push((t) => {
    water.material.emissiveIntensity = 0.32 + Math.sin(t * 1.7) * 0.04; poolL.intensity = 9 + Math.sin(t * 2.3) * 1;
    water.material.normalMap.offset.set(t * 0.012, t * 0.007); causL[0].offset.set(t * 0.021, t * 0.013); causL[1].offset.set(-t * 0.017, t * 0.019);
    const a = t * 0.045; SW.g.position.set(Math.cos(a) * PRX * 0.36, WL + Math.sin(t * 1.25) * 0.012, Math.sin(a * 1.3) * PRZ * 0.3);
    SW.g.rotation.set(Math.sin(t * 0.9) * 0.025, 0.6 + Math.sin(t * 0.06) * 0.9 + a * 0.4, Math.sin(t * 1.1 + 1) * 0.03);
    rips.forEach((r) => { const k = (t * 0.22 + r.ph) % 1; r.q.position.x = SW.g.position.x; r.q.position.z = SW.g.position.z; r.q.scale.setScalar(1.4 + k * 2.2); r.q.material.opacity = (1 - k) * 0.22; });
  });
  if (!VPOOL) [[-3.0, 3.25, 0.5], [0.2, 4.35, 0], [3.1, 3.15, -0.5]].forEach(([x, z, ry]) => { const lg2 = new THREE.Group(); lg2.position.set(x, 1.33, z); lg2.rotation.y = ry; PD.add(lg2); rbox(0.7, 0.08, 1.8, 0.03, std({ color: VPOOL ? 0x34508a : 0xf0e2b0, roughness: 0.8 }), 0, 0, 0, lg2); const bk = rbox(0.7, 0.08, 0.7, 0.03, std({ color: 0xf0e2b0, roughness: 0.8 }), 0, 0.28, -0.85, lg2); bk.rotation.x = 0.7; [[-0.3, 0.8], [0.3, 0.8], [-0.3, -0.7], [0.3, -0.7]].forEach(([a2, b2]) => cyl(0.02, 0.02, 0.26, steel, a2, -0.13, b2, lg2, 6)); });
  // a towel and flip-flops by the far lounger
  if (!VPOOL) { const tw = rbox(0.55, 0.03, 1.2, 0.012, std({ color: 0xf2f0ea, roughness: 0.95 }), 0.2, 1.4, 4.3, PD, 1); tw.rotation.y = 0.05; const st2 = rbox(0.56, 0.032, 0.12, 0.01, std({ color: 0xe0484f, roughness: 0.95 }), 0.2, 1.401, 4.0, PD, 1); st2.rotation.y = 0.05; [[-0.62, 3.6, 0.2], [-0.48, 3.55, -0.1]].forEach(([x, z, r2]) => { const ff = rbox(0.1, 0.02, 0.26, 0.01, std({ color: 0xff7eb6, roughness: 0.6 }), x, 1.225, z, PD, 1); ff.rotation.y = r2; }); }
  if (!VPOOL) [[-4.2, -2.4], [4.2, -2.2]].forEach(([x, z]) => palm(PD, x, 1.25, z));
  const dome = VPOOL ? videoPod(PD, dR, DECK, PRX, PRZ, up) : new THREE.Mesh(new THREE.SphereGeometry(dR, 56, 28, 0, Math.PI * 2, 0, Math.PI / 2), phys({ color: 0xbfeaff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.13, envMapIntensity: 3, side: THREE.DoubleSide, depthWrite: false }));
  if (!VPOOL) { dome.position.y = 1.2; dome.userData.noCast = true; PD.add(dome); }
  const ribs = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(dR + 0.02, 2)), new THREE.LineBasicMaterial({ color: 0xd8e8f0, transparent: true, opacity: 0.2 }));
  { const pos = ribs.geometry.attributes.position, keep = []; for (let i = 0; i < pos.count; i += 2) { if (pos.getY(i) >= -0.01 && pos.getY(i + 1) >= -0.01) keep.push(pos.getX(i), pos.getY(i), pos.getZ(i), pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1)); } const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3)); ribs.geometry = g2; }
  ribs.position.y = 1.2; if (!VPOOL) PD.add(ribs);
  const baseRing = torus(dR + 0.05, 0.08, steel, 0, 1.22, 0, PD, 64); baseRing.rotation.x = Math.PI / 2;
  // (video look: see videoPod)
  const dgl = glow(0x40e0ff, 14, 0.08); dgl.position.y = 3.5; if (!VPOOL) PD.add(dgl);
  // NO DIVING, enamel sign on a chrome post at the deep end
  { const [nc2, ng2] = cnv(512, 256); ng2.fillStyle = '#f4f1e8'; ng2.fillRect(0, 0, 512, 256); ng2.strokeStyle = '#141414'; ng2.lineWidth = 14; ng2.strokeRect(14, 14, 484, 228); ng2.fillStyle = '#c8202a'; ng2.textAlign = 'center'; ng2.textBaseline = 'middle'; ng2.font = fitFont(ng2, 'NO DIVING', '150px "Bebas Neue"', 420); ng2.fillText('NO DIVING', 256, 118); ng2.fillStyle = '#141414'; ng2.font = 'bold 26px "Courier Prime"'; ng2.fillText('DEPTH 3 FT', 256, 200); grime(ng2, 512, 256, 0.35);
    const ns = new THREE.Group(); ns.position.set(-0.6, DECK, -PRZ - 0.6); ns.rotation.y = 0.12; PD.add(ns);
    cyl(0.025, 0.025, 1.25, chromeM(), 0, 0.62, -0.03, ns, 10); rbox(0.66, 0.35, 0.025, 0.008, std({ color: 0xd8d4c8, roughness: 0.5, metalness: 0.3 }), 0, 1.1, 0, ns, 1);
    const nq = quad(0.62, 0.31, std({ map: toTex(nc2), roughness: 0.35 }), 0, 1.1, 0.014, ns); nq.userData.go = 'pool'; hot.push(nq); }
  [dome, deck, water, plinth].forEach((o) => { o.userData.go = 'pool'; hot.push(o); });
  SW.g.traverse((o) => { if (o.isMesh) { o.userData.go = 'pool'; o.userData.poolToast = true; hot.push(o); } });
  const pool = { center: new THREE.Vector3(22, WL, -14), swimmer: SW.g };

  const casino = casinoTower(m, hot, up, M);

  /* ---------- lot furniture: lamp posts, parked cars, bench ---------- */
  const lampPost = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; m.add(g); cyl(0.08, 0.12, 7, phys({ color: 0x6a6a72, roughness: 0.4, metalness: 0.8 }), 0, 3.5, 0, g, 12); const arm = rbox(1.8, 0.1, 0.1, 0.04, dark, 0.8, 6.95, 0, g); rbox(0.9, 0.16, 0.4, 0.06, dark, 1.6, 6.9, 0, g); const hd = box(0.7, 0.03, 0.3, basic({ color: 0xffb060 }), 1.6, 6.8, 0, g); hd.userData.noCast = true; if (!LOW) { const l = new THREE.SpotLight(0xffb060, 40, 16, 0.75, 0.6, 1.4); l.position.set(1.6, 6.8, 0); l.target.position.set(1.8, 0, 0); g.add(l, l.target); } const s = spill(0xffb060, 9, 9, 0.35); s.position.set(1.8, 0.05, 0); g.add(s); const gl = glow(0xffb060, 2.2, 0.5); gl.position.set(1.6, 6.7, 0); g.add(gl); };
  lampPost(22, 10.5, 2.6); lampPost(-22.5, 8.6, 0.3);
  const parkedCars = [[-16, 6.4, 0.08, 0xd8c8b0], [-9, 6.4, -0.05, 0x7fc1b8], [24, 6.4, 0.04, 0xe8a0b8]];
  parkedCars.forEach(([x, z, ry, col]) => { const c = makeCar(col); c.g.position.set(x, 0.72, z); c.g.rotation.y = Math.PI / 2 + ry; c.flame.visible = false; c.fg.visible = false; m.add(c.g); up.push((t) => { c.g.position.y = 0.72 + Math.sin(t * 1.1 + x) * 0.04; }); });

  M.build();
  world.traverse((o) => { if (o.isMesh && !o.userData.noCast && !(o.material && (o.material.isMeshBasicMaterial || o.material.transparent))) { o.castShadow = true; o.receiveShadow = true; } });

  /* ---------- kur colour drift ---------- */
  const _kc = new THREE.Color(), _ka = new THREE.Color(), _kb = new THREE.Color();
  const kurColor = (t) => { const s = t * 0.22, i = Math.floor(s), f = s - i; _ka.setHex(KUR_HUES[i % KUR_HUES.length]); _kb.setHex(KUR_HUES[(i + 1) % KUR_HUES.length]); const e = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2; return _kc.copy(_ka).lerp(_kb, e); };
  up.push((t) => { const c = kurColor(t); kurWindows.forEach((w) => { w.cur.material.emissive.copy(c).multiplyScalar(0.35); if (w.cur.userData.twin) w.cur.userData.twin.material.emissive.copy(c).multiplyScalar(0.35); if (w.peek) w.peek.material.color.copy(c).multiplyScalar(1.15); w.glow.material.color.copy(c); w.spill.material.color.copy(c); }); kurLights.forEach((l) => l.color.copy(c)); });

  return { group: m, hot, labels, flickers, up, doors, pool, casino, spots };
}

/* ---------- pieces ---------- */
function peekTex(id, wide) {
  const W = wide ? 768 : 384, H = 256; const [c, g] = cnv(W, H);
  const gr = g.createRadialGradient(W / 2, H * 0.62, 10, W / 2, H * 0.5, W * 0.62); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#c8c8c8'); gr.addColorStop(1, '#5a5a5a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(30,12,30,.55)';
  if (id === 'hyodo') for (let i = 0; i < 9; i++) { const x = W * 0.28 + i * W * 0.055, y = H * 0.48 + (i % 2) * 6; g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); g.beginPath(); g.moveTo(x - 12, y + 12); g.lineTo(x + 12, y + 12); g.lineTo(x + 16, y + 110); g.lineTo(x - 16, y + 110); g.fill(); }
  if (id === 'alien') { g.fillRect(W / 2 - 90, H * 0.74, 180, 70); g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(W / 2 - 60 + i * 40, H * 0.66 - i * 8, 10, 20, 0, 0, 7); g.fill(); } }
  if (id === 'fmk') { g.fillStyle = 'rgba(70,0,0,.75)'; for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(W * 0.38 + i * 18, H * 0.36 + i * 7, 8, 12, 0.3, 0, 7); g.fill(); g.fillRect(W * 0.38 + i * 18 - 2, H * 0.36 + i * 7, 3, R(20, 70)); } g.fillStyle = 'rgba(20,0,0,.6)'; g.fillRect(W * 0.25, H * 0.72, W * 0.5, H * 0.3); }
  if (id === 'freddie') { g.fillRect(W * 0.32, H * 0.6, 90, 70); g.fillRect(W * 0.36, H * 0.42, 22, 50); g.fillRect(W * 0.62, H * 0.3, 8, 140); g.beginPath(); g.moveTo(W * 0.6, H * 0.3); g.lineTo(W * 0.68, H * 0.3); g.lineTo(W * 0.66, H * 0.2); g.lineTo(W * 0.62, H * 0.2); g.fill(); }
  if (id === 'kur') { g.beginPath(); g.moveTo(W * 0.36, H); g.lineTo(W * 0.5, H * 0.38); g.lineTo(W * 0.64, H); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(W * 0.47, H * 0.5); g.lineTo(W * 0.5, H * 0.38); g.lineTo(W * 0.53, H * 0.5); g.fill(); for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(255,255,255,.65)'; g.fillRect(W * 0.12 + R(0, W * 0.76), R(16, H * 0.55), 9, 13); } }
  return toTex(c);
}
function signTex(r, p) {
  const W = r.suite ? 1400 : 760, H = r.suite ? 216 : 184; const [c, g] = cnv(W, H);
  g.fillStyle = '#f3ead6'; g.fillRect(0, 0, W, H);
  const blockW = H * 0.95; g.fillStyle = p.css; g.fillRect(0, 0, blockW, H);
  g.fillStyle = 'rgba(0,0,0,.72)'; g.font = `${H * 0.42}px "Bebas Neue"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(r.num, blockW / 2, H * 0.55);
  g.fillStyle = '#1e1814'; g.textAlign = 'left'; g.font = fitFont(g, p.title, `${H * 0.6}px "Bebas Neue"`, W - blockW - 44); g.fillText(p.title, blockW + 24, H * 0.42);
  g.fillStyle = '#5a4a3a'; const sub = p.door.toUpperCase() + (r.suite ? '  ·  THE SUITE' : ''); g.font = fitFont(g, sub, `bold ${H * 0.15}px "Courier Prime"`, W - blockW - 44); g.fillText(sub, blockW + 26, H * 0.8);
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
  grime(g, W, H, 0.2); return toTex(c);
}

/* ---------- diner counter behind the glass (Nighthawks, minus the people) ---------- */
function diner(m, cx, uw, M, up) {
  let botRef = null;
  const g = new THREE.Group(); g.position.set(cx, 0, 0); m.add(g); const W = uw - 0.8, z0 = -2.97;
  // back wall: mint tile low, cream high, a pass-through, a dark menu board, a neon coffee cup
  const [c, x] = cnv(1024, 300); x.fillStyle = '#efe4c8'; x.fillRect(0, 0, 1024, 300);
  for (let yy = 150; yy < 300; yy += 16) for (let xx = 0; xx < 1024; xx += 16) { x.fillStyle = (xx / 16 + yy / 16) % 2 ? '#9fd4c0' : '#8cc8b2'; x.fillRect(xx, yy, 15, 15); }
  x.fillStyle = '#b81c2a'; x.fillRect(0, 140, 1024, 12); x.fillStyle = '#2a1a14'; x.fillRect(80, 24, 300, 96); x.fillStyle = 'rgba(240,232,210,.65)'; for (let r = 0; r < 6; r++) { x.fillRect(100, 38 + r * 13, R(120, 180), 4); x.fillRect(320, 38 + r * 13, 40, 4); }
  x.fillStyle = '#1a0e0a'; x.fillRect(470, 40, 230, 80); x.fillStyle = '#ffd9a0'; x.fillRect(476, 46, 218, 68); x.fillStyle = '#c8b090'; x.fillRect(476, 98, 218, 16);
  x.lineCap = 'round'; x.strokeStyle = '#ff5f6a'; x.shadowColor = '#ff5f6a'; x.shadowBlur = 16; x.lineWidth = 6; x.beginPath(); x.moveTo(800, 60); x.lineTo(810, 118); x.lineTo(870, 118); x.lineTo(880, 60); x.closePath(); x.moveTo(880, 74); x.arc(892, 88, 14, -Math.PI / 2, Math.PI / 2); x.stroke();
  x.strokeStyle = '#ffe0a0'; x.shadowColor = '#ffe0a0'; for (const sx of [826, 846, 864]) { x.beginPath(); x.moveTo(sx, 50); x.bezierCurveTo(sx - 8, 40, sx + 8, 32, sx, 20); x.stroke(); } x.shadowBlur = 0;
  grime(x, 1024, 300, 0.25);
  if (VIDEO) { x.fillStyle = '#e8dcc8'; x.fillRect(0, 0, 1024, 300); x.fillStyle = '#d4c4aa'; x.fillRect(0, 170, 1024, 130); x.fillStyle = '#8a4a2a'; for (let xx = 0; xx < 1024; xx += 9) { if (xx < 70 || xx > 954) x.fillRect(xx, 0, 5, 300); }
    const port = (px, py, r, planet) => { x.fillStyle = '#c8b8a0'; x.beginPath(); x.ellipse(px, py, r * 1.25 + 8, r + 8, 0, 0, 7); x.fill(); x.fillStyle = '#05060c'; x.beginPath(); x.ellipse(px, py, r * 1.25, r, 0, 0, 7); x.fill(); x.save(); x.clip(); for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(255,255,255,${R(0.3, 1)})`; x.fillRect(px + R(-r * 1.3, r * 1.3), py + R(-r, r), 1.5, 1.5); }
      if (planet) { x.fillStyle = '#d89a5a'; x.beginPath(); x.arc(px, py, r * 0.42, 0, 7); x.fill(); x.strokeStyle = '#f0d8a8'; x.lineWidth = 3; x.beginPath(); x.ellipse(px, py, r * 0.85, r * 0.2, -0.3, 0, 7); x.stroke(); } x.restore(); };
    port(180, 88, 46, false); port(512, 84, 52, true); port(844, 88, 46, false); x.fillStyle = 'rgba(255,150,70,.35)'; x.fillRect(0, 0, 1024, 10); grime(x, 1024, 300, 0.2); }
  const wall = quad(W, 3.0, basic({ map: toTex(c), color: VIDEO ? 0x9a8a78 : 0x86786a }), 0, 1.5, z0, g); wall.userData.noCast = true;
  const fl = quad(W, 1.0, texMat((() => { const [cc, cg] = cnv(256, 64); for (let yy = 0; yy < 64; yy += 16) for (let xx = 0; xx < 256; xx += 16) { cg.fillStyle = VIDEO ? (Math.random() < 0.5 ? '#3a3a40' : '#34343a') : (xx / 16 + yy / 16) % 2 ? '#e8e0d0' : '#1a1416'; cg.fillRect(xx, yy, 16, 16); } return { map: toTex(cc, [3, 1]) }; })(), { roughness: VIDEO ? 0.95 : 0.4 }), 0, 0.02, -2.5, g); fl.rotation.x = -Math.PI / 2;
  // the counter, stools in a row with their backs to the street
  const red = phys({ color: VIDEO ? 0xd8642a : 0xb81c2a, roughness: 0.35, clearcoat: 0.6 }), chromeS = phys({ color: 0xd8d8dc, metalness: 1, roughness: 0.22 }), cream = std({ color: 0xece2cc, roughness: 0.6 });
  rbox(W - 0.4, 0.98, 0.34, 0.02, cream, 0, 0.49, -2.76, g, 2); box(W - 0.38, 0.06, 0.02, chromeS, 0, 0.9, -2.585, g); box(W - 0.38, 0.12, 0.02, red, 0, 0.15, -2.585, g);
  rbox(W - 0.3, 0.05, 0.42, 0.015, std({ color: 0xd8d4cc, roughness: 0.3 }), 0, 1.0, -2.74, g, 1);
  const n = Math.max(5, Math.floor((W - 0.8) / 0.82)); for (let k = 0; k < n; k++) { const sx = -((n - 1) * 0.82) / 2 + k * 0.82; cyl(0.03, 0.03, 0.62, chromeS, sx, 0.33, -2.32, g, 10); cyl(0.2, 0.2, 0.08, red, sx, 0.68, -2.32, g, 20); cyl(0.17, 0.2, 0.025, chromeS, sx, 0.013, -2.32, g, 20); }
  // on the counter: coffee urn, a pie case, cups, napkin dispensers, ketchup
  cyl(0.13, 0.13, 0.42, chromeS, -W / 2 + 0.7, 1.24, -2.78, g, 20); sph(0.05, chromeS, -W / 2 + 0.7, 1.47, -2.78, g, 10);
  const pc = new THREE.Group(); pc.position.set(W / 2 - 1.1, 1.03, -2.74); g.add(pc); box(0.62, 0.36, 0.3, phys({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0.05, depthWrite: false }), 0, 0.18, 0, pc); box(0.6, 0.01, 0.28, chromeS, 0, 0.18, 0, pc);
  [[-0.14, 0.04], [0.14, 0.04], [-0.12, 0.22], [0.12, 0.22]].forEach(([px, py]) => { cyl(0.1, 0.09, 0.05, std({ color: pick([0xd8a050, 0xc04060, 0x7a4a2a]), roughness: 0.7 }), px, py, 0, pc, 18); });
  for (let k = 0; k < 6; k++) { const ux = -W / 2 + 1.3 + k * ((W - 2.8) / 5); if (k === 3) continue; cyl(0.04, 0.035, 0.07, std({ color: 0xf2efe8, roughness: 0.4 }), ux, 1.06, -2.66, g, 12); if (k % 2) { box(0.09, 0.11, 0.06, chromeS, ux + 0.25, 1.08, -2.575, g); cyl(0.022, 0.026, 0.13, std({ color: 0xb81c1c, roughness: 0.4 }), ux + 0.38, 1.09, -2.575, g, 10); } }
  { const mx = -W / 2 + 1.3 + 3 * ((W - 2.8) / 5), mz = -2.62, mug = std({ color: 0xf2efe8, roughness: 0.35 });
    lathe([[0, 0], [0.042, 0], [0.046, 0.09], [0.04, 0.09], [0.037, 0.008], [0, 0.008]], mug, mx, 1.025, mz, g, 20); const coffee = cyl(0.039, 0.039, 0.004, std({ color: 0x2a140a, roughness: 0.15 }), mx, 1.07, mz, g, 20); coffee.userData.noBatch = true; g.userData.mug = { x: mx, z: mz, coffee };
    torus(0.025, 0.007, mug, mx + 0.05, 1.07, mz, g, 16, Math.PI * 1.3).rotation.set(0, 0, -Math.PI * 0.65);
    cyl(0.07, 0.07, 0.006, std({ color: 0xf2efe8, roughness: 0.35 }), mx, 1.028, mz, g, 20);
    const puffs = []; for (let i = 0; i < 7; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xf4f0ea, transparent: true, depthWrite: false, opacity: 0 })); g.add(sp); puffs.push({ sp, t: i / 7 }); }
    up.push((t, dt) => { for (const pf of puffs) { pf.t = (pf.t + dt / 2.6) % 1; const k = pf.t, sp = pf.sp; sp.position.set(mx + Math.sin(k * 5 + pf.t * 9) * 0.02 * k, 1.11 + k * 0.38, mz + Math.cos(k * 4) * 0.012 * k); sp.scale.setScalar(0.05 + k * 0.2); sp.material.opacity = Math.sin(Math.PI * k) * 0.5; sp.material.rotation = k * 2; } }); }
  g.userData.W = W; const bot = dinerBot(g, up);
  // green enamel pendants over the counter
  const shade = std({ color: VIDEO ? 0xe8d8bc : 0x2f6a4a, roughness: 0.4, side: THREE.DoubleSide }), bulbM = basic({ color: 0xfff0d0 });
  if (VIDEO) { const og = basic({ color: 0xff9a40 }); box(W - 0.3, 0.03, 0.03, og, 0, 0.05, -2.565, g); box(W - 0.2, 0.04, 0.04, og, 0, 2.3, z0 + 0.04, g); const wash = quad(W - 0.4, 0.5, basic({ map: glowTex, color: 0xff8a3a, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 2.15, z0 + 0.03, g); const fw = quad(W - 0.4, 0.35, basic({ map: glowTex, color: 0xff8a3a, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0.03, -2.4, g); fw.rotation.x = -Math.PI / 2; }
  for (let k = 0; k < 5; k++) { const lx = -W / 2 + 0.9 + k * ((W - 1.8) / 4); cyl(0.006, 0.006, 0.9, chromeS, lx, 2.7, -2.62, g, 6); lathe([[0.02, 0.18], [0.1, 0.14], [0.19, 0.02], [0.2, 0]], shade, lx, 2.07, -2.62, g, 24); const b = sph(0.045, bulbM, lx, 2.09, -2.62, g, 10); b.userData.noCast = true; const gl = glow(0xffd9a0, 0.9, 0.35); gl.position.set(lx, 2.02, -2.62); g.add(gl); }
  const sp = spill(0xffd9a0, W, 1.6, 0.22); sp.position.set(0, 0.17, -1.2); g.add(sp);
  return bot;
}


/* windows that look out. The view is worked out per pixel from where the camera is: stars at infinity, a plain running off to a horizon,
   a line of hills and a pale planet, so it holds together as you move like a real window does. One pass, no textures */
let _outU = null; const outsideU = () => (_outU || (_outU = { uTime: { value: 0 }, uFloor: { value: 0 } }));
let _frost = null; // the 0★ mark as a mask, for the frosted decal on the porthole
function outsideMat(rect, hx, hy, logo = 0) {
  const U = outsideU(); if (logo && !_frost) { _frost = new THREE.TextureLoader().load('assets/zero_frost.png'); _frost.colorSpace = THREE.NoColorSpace; }
  return new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uFloor: U.uFloor, uRect: { value: rect ? 1 : 0 }, uHalf: { value: new THREE.Vector2(hx, hy) }, uLogo: { value: logo ? _frost : null }, uLogoHalf: { value: logo } },
    vertexShader: `varying vec3 vW; varying vec2 vL; void main() { vL = position.xy; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uTime, uFloor, uRect, uLogoHalf; uniform vec2 uHalf; uniform sampler2D uLogo; varying vec3 vW; varying vec2 vL;
      float h13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
      float h11(float x) { return fract(sin(x * 127.1) * 43758.5453); }
      float n11(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h11(i), h11(i + 1.0), f); }
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n21(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
      vec3 stars(vec3 d, float N, float thr, float sz, float sd) {
        vec3 p = d * N, c = floor(p), f = fract(p); float h = h13(c + sd); if (h < thr) return vec3(0.0);
        vec3 o = vec3(h13(c + sd + 1.7), h13(c + sd + 3.1), h13(c + sd + 5.3)) * 0.6 + 0.2;
        float b = smoothstep(sz, 0.0, length(f - o)) * (0.35 + 0.65 * fract(h * 13.0)) * (0.8 + 0.2 * sin(uTime * (1.0 + 3.0 * fract(h * 7.0)) + h * 40.0));
        return b * mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.88, 0.75), fract(h * 29.0)); }
      void main() {
        vec3 d = normalize(vW - cameraPosition); float el = asin(clamp(d.y, -1.0, 1.0)), az = atan(d.z, d.x);
        vec3 col = mix(vec3(0.004, 0.005, 0.014), vec3(0.03, 0.026, 0.06), exp(-max(el, 0.0) * 14.0));
        col += stars(d, 60.0, 0.86, 0.11, 0.0) * 1.3 + stars(d, 150.0, 0.9, 0.16, 11.0) * 0.6;
        vec3 P = normalize(vec3(-0.06, 0.085, -1.0)), T1 = normalize(cross(P, vec3(0.0, 1.0, 0.0))), T2 = cross(T1, P); float cp = dot(d, P);
        vec2 q = vec2(dot(d, T1), dot(d, T2)) / sin(0.035); float qq = dot(q, q);
        if (cp > 0.0 && qq < 1.0) { vec3 nr = vec3(q, sqrt(1.0 - qq)); float lit = clamp(dot(nr, normalize(vec3(0.7, 0.35, 0.6))), 0.0, 1.0);
          col = mix(vec3(0.012, 0.014, 0.03), vec3(0.62, 0.66, 0.78) * (0.85 + 0.15 * n11(q.y * 9.0 + 2.0)), pow(lit, 0.8)); }
        else if (cp > 0.0) col += vec3(0.25, 0.32, 0.55) * exp(-(sqrt(qq) - 1.0) * 9.0) * 0.18;
        float prof = 0.006 + 0.022 * n11(az * 8.0 + 3.0) + 0.009 * n11(az * 27.0 + 7.0);
        if (el < prof) {
          if (d.y < -0.0005) { float t = (uFloor - cameraPosition.y) / d.y; vec2 hp = (cameraPosition + d * t).xz;
            float g = n21(hp * 0.45) * 0.55 + n21(hp * 1.9) * 0.3 + n21(hp * 7.0) * 0.15, cr = smoothstep(0.62, 0.7, n21(hp * 0.22 + 9.0)) * 0.35;
            col = mix(mix(vec3(0.07, 0.065, 0.075), vec3(0.2, 0.19, 0.2), g) * (1.0 - cr), vec3(0.045, 0.045, 0.065), smoothstep(12.0, 140.0, t));
          } else col = mix(vec3(0.045, 0.045, 0.065), vec3(0.075, 0.072, 0.095), smoothstep(prof - 0.012, prof, el));
          col += vec3(0.16, 0.13, 0.2) * smoothstep(prof - 0.0035, prof, el) * step(0.0, el);
        }
        // frosted red 0★ on the glass: the view still shows through, softened, under a milky diner red with a fine grain
        if (uLogoHalf > 0.0) { vec2 lu = vL / (2.0 * uLogoHalf) + 0.5; float m = (lu.x > 0.0 && lu.x < 1.0 && lu.y > 0.0 && lu.y < 1.0) ? texture2D(uLogo, lu).r : 0.0;
          float fr = 0.86 + 0.14 * n21(vL * 320.0); col = mix(col, col * 0.5 + vec3(0.62, 0.075, 0.1) * fr, m * 0.55); }
        float e = uRect > 0.5 ? max(abs(vL.x) / uHalf.x, abs(vL.y) / uHalf.y) : length(vL) / uHalf.x;
        col *= 1.0 - 0.5 * smoothstep(0.7, 1.0, e);
        col += vec3(0.55, 0.62, 0.72) * exp(-pow((vL.x * 0.75 + vL.y) / uHalf.x - 0.35, 2.0) * 22.0) * 0.045;
        col += vec3(0.07, 0.045, 0.025) * smoothstep(0.1, 1.0, -vL.y / uHalf.y) * 0.6;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }` });
}
/* ---------- video look: a deep space diner behind the glass. Booths, portholes, a glowing counter, the moon in the window ---------- */
function videoDiner(m, cx, uw, up) {
  const g = new THREE.Group(); g.position.set(cx, 0, 0); m.add(g); const hwO = uw / 2 - 0.02, hw = Math.min(hwO, 3.15), WI = hw * 2 + 0.04, z0 = -2.02, z1 = -6.58, H = 3.0, zc = (z0 + z1) / 2, D = z0 - z1;
  const cream = std({ color: 0xeee2cc, roughness: 0.7 }), creamD = std({ color: 0xd8c8ae, roughness: 0.75 }), vinyl = phys({ color: 0xb81c2a, roughness: 0.35, clearcoat: 0.6 }), chromeS = phys({ color: 0xd8d8dc, metalness: 1, roughness: 0.2 }), led = basic({ color: 0xffe8c8 }), neonR = basic({ color: 0xff3a4a }), dark = std({ color: 0x2a2224, roughness: 0.5 });
  // shell: cream walls over a mint tile wainscot with a red stripe, black-and-white floor (the classic diner's colours)
  const [wc, wg] = cnv(128, 384); wg.fillStyle = '#efe4c8'; wg.fillRect(0, 0, 128, 384); wg.fillStyle = '#7ab8a2'; wg.fillRect(0, 256, 128, 128);
  for (let yy = 256; yy < 384; yy += 16) for (let xx = 0; xx < 128; xx += 16) { wg.fillStyle = (xx / 16 + yy / 16) % 2 ? '#9fd4c0' : '#8cc8b2'; wg.fillRect(xx + 0.5, yy + 0.5, 15, 15); }
  wg.fillStyle = '#b81c2a'; wg.fillRect(0, 247, 128, 9); wg.fillStyle = '#d8d8dc'; wg.fillRect(0, 245, 128, 2); grime(wg, 128, 384, 0.18);
  const wallM = (len) => texMat({ map: toTex(wc, [len, 1]) }, { roughness: 0.6 });
  quad(WI, H, wallM(WI), 0, H / 2, z1, g); const lw = quad(D, H, wallM(D), -hw, H / 2, zc, g); lw.rotation.y = Math.PI / 2; const rw = quad(D, H, wallM(D), hw, H / 2, zc, g); rw.rotation.y = -Math.PI / 2;
  const [cc, cg] = cnv(256, 256); for (let yy = 0; yy < 256; yy += 32) for (let xx = 0; xx < 256; xx += 32) { cg.fillStyle = (xx / 32 + yy / 32) % 2 ? '#e8e0d0' : '#1a1416'; cg.fillRect(xx, yy, 32, 32); } grime(cg, 256, 256, 0.2);
  const fl = quad(WI, D, texMat({ map: toTex(cc, [2, 2]) }, { roughness: 0.32 }), 0, 0.012, zc, g); fl.rotation.x = -Math.PI / 2;
  if (hwO - hw > 0.05) [-1, 1].forEach((sd) => { const wd = hwO - hw + 0.03; quad(wd, H, wallM(wd), sd * (hw + wd / 2 - 0.01), H / 2, z0 - 0.03, g); });
  // warm coves along the side walls and across the back, lit from a hidden strip (gradient in the vertex colours)
  const coveM = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false }), RC = 0.34;
  [[-hw, zc, Math.PI / 2, D], [hw, zc, -Math.PI / 2, D], [0, z1, 0, WI]].forEach(([x, z, ry, len]) => { const c = new THREE.Group(); c.position.set(x, H, z); c.rotation.y = ry; g.add(c); c.add(new THREE.Mesh(coveGeo(len, RC, 0xffdcaa, 0xf6e6c8, 22, 0.8), coveM)); box(len, 0.035, 0.075, cream, 0, -RC - 0.0175, 0.0375, c); box(len, 0.012, 0.012, led, 0, -RC + 0.006, 0.068, c); });
  // the ceiling between the coves: warm where the coves wash it, a soft halo round the light (painted rather than lit, so it costs nothing)
  { const cw = WI - 2 * RC, cd = D - RC, [kc, kg] = cnv(256, 256), lx = 128, ly = (1 - (zc - 0.4 - (z1 + RC)) / cd) * 256;
    kg.fillStyle = '#d8ccb4'; kg.fillRect(0, 0, 256, 256);
    const edge = (x0, y0, x1, y1) => { const gr = kg.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(246,230,200,1)'); gr.addColorStop(1, 'rgba(246,230,200,0)'); kg.fillStyle = gr; };
    edge(0, 0, 44, 0); kg.fillRect(0, 0, 44, 256); edge(256, 0, 212, 0); kg.fillRect(212, 0, 44, 256); edge(0, 256, 0, 212); kg.fillRect(0, 212, 256, 44);
    const hg = kg.createRadialGradient(lx, ly, 30, lx, ly, 120); hg.addColorStop(0, 'rgba(255,242,220,.85)'); hg.addColorStop(1, 'rgba(255,242,220,0)'); kg.fillStyle = hg; kg.fillRect(0, 0, 256, 256);
    const ce = quad(cw, cd, basic({ map: toTex(kc) }), 0, H, z1 + RC + cd / 2, g); ce.rotation.x = Math.PI / 2; }
  // round ceiling light
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.85, 64).rotateX(Math.PI / 2), basic({ color: 0xfff2dc })); disc.position.set(0, H - 0.03, zc - 0.4); g.add(disc); torus(0.92, 0.035, creamD, 0, H - 0.05, zc - 0.4, g, 96).rotation.x = Math.PI / 2;
  const cgl = glow(0xffe0b0, 3.2, 0.25); cgl.position.set(0, H - 0.25, zc - 0.4); g.add(cgl);
  // booth platforms with vinyl light lines, and the booths themselves: channel-tufted backs, chrome-legged tables, round stools
  const tuft = new THREE.CylinderGeometry(0.075, 0.075, 0.95, 16); const tufts = [];
  [-1, 1].forEach((sd) => {
    const px = sd * (hw - 0.8); box(1.6, 0.12, 3.42, std({ color: 0x1e1a1c, roughness: 0.6 }), px, 0.06, -3.91, g); box(0.03, 0.03, 3.42, neonR, sd * (hw - 1.62), 0.11, -3.91, g);
    [-3.05, -4.75].forEach((bz) => {
      const bx = sd * (hw - 0.2); rbox(0.28, 0.5, 1.5, 0.06, vinyl, bx, 0.37, bz, g, 3);
      for (let k = 0; k < 9; k++) tufts.push([bx - sd * 0.02, 1.02, bz - 0.64 + k * 0.16]);
      rbox(0.58, 0.16, 1.5, 0.06, vinyl, bx - sd * 0.38, 0.47, bz, g, 3); box(0.56, 0.3, 1.46, dark, bx - sd * 0.38, 0.27, bz, g);
      const tx = sd * (hw - 1.15); cyl(0.04, 0.05, 0.62, chromeS, tx, 0.43, bz, g, 12); cyl(0.2, 0.24, 0.025, chromeS, tx, 0.13, bz, g, 24); rbox(0.62, 0.04, 0.85, 0.02, std({ color: 0xf0ebe0, roughness: 0.3 }), tx, 0.765, bz, g, 2); box(0.64, 0.025, 0.87, chromeS, tx, 0.74, bz, g);
      cyl(0.022, 0.026, 0.12, std({ color: 0xb81c1c, roughness: 0.4 }), tx - 0.1, 0.84, bz + 0.25, g, 10); cyl(0.022, 0.026, 0.12, std({ color: 0xe8b020, roughness: 0.4 }), tx + 0.02, 0.84, bz + 0.27, g, 10);
      const sx = sd * (hw - 1.75); rbox(0.42, 0.18, 0.42, 0.08, vinyl, sx, 0.5, bz, g, 3); cyl(0.035, 0.035, 0.4, chromeS, sx, 0.21, bz, g, 12); cyl(0.15, 0.17, 0.025, chromeS, sx, 0.0125, bz, g, 24);
      // porthole above each booth
      const ph = new THREE.Group(); ph.position.set(sd * (hw - 0.012), 1.85, bz); ph.rotation.y = -sd * Math.PI / 2; g.add(ph);
      const rr = (w, h, r) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2 + r, -h / 2); sh.lineTo(w / 2 - r, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); sh.lineTo(w / 2, h / 2 - r); sh.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); sh.lineTo(-w / 2 + r, h / 2); sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); sh.lineTo(-w / 2, -h / 2 + r); sh.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return sh; };
      const frame = rr(1.15, 0.8, 0.32); frame.holes.push(rr(0.95, 0.6, 0.26)); const fr = new THREE.Mesh(new THREE.ExtrudeGeometry(frame, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 12 }), creamD); ph.add(fr);
      const win = new THREE.Mesh(new THREE.ShapeGeometry(rr(0.95, 0.6, 0.26), 12), outsideMat(true, 0.475, 0.3)); win.position.z = 0.01; win.userData.noBatch = true; ph.add(win);
    });
  });
  { const im = new THREE.InstancedMesh(tuft, vinyl, tufts.length), mt = new THREE.Matrix4(); tufts.forEach(([x, y, z], i) => { mt.makeTranslation(x, y, z); im.setMatrixAt(i, mt); }); g.add(im); }
  // the counter at the back: rounded ends, cream front with a red band and chrome trim
  const CZ = -5.95, CL = 2.9;
  { const shp = new THREE.Shape(); shp.moveTo(-CL / 2, -0.25); shp.lineTo(CL / 2, -0.25); shp.absarc(CL / 2, 0, 0.25, -Math.PI / 2, Math.PI / 2, false); shp.lineTo(-CL / 2, 0.25); shp.absarc(-CL / 2, 0, 0.25, Math.PI / 2, Math.PI * 1.5, false);
    const top = new THREE.Mesh(new THREE.ExtrudeGeometry(shp, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 24 }), std({ color: 0xf2eadc, roughness: 0.3 })); top.rotation.x = -Math.PI / 2; top.position.set(0, 1.0, CZ); g.add(top);
    const front = new THREE.Mesh(new THREE.ExtrudeGeometry(shp, { depth: 0.98, bevelEnabled: false, curveSegments: 24 }), std({ color: 0xece2cc, roughness: 0.5 })); front.rotation.x = -Math.PI / 2; front.position.set(0, 0.02, CZ); front.scale.set(0.97, 0.94, 1); g.add(front);
    [[0.1, 0.11, vinyl], [0.84, 0.035, chromeS]].forEach(([y, dd, mm]) => { const b2 = new THREE.Mesh(new THREE.ExtrudeGeometry(shp, { depth: dd, bevelEnabled: false, curveSegments: 24 }), mm); b2.rotation.x = -Math.PI / 2; b2.position.set(0, y, CZ); b2.scale.set(0.976, 0.952, 1); g.add(b2); });
    const cgl2 = glow(0xffd9a0, 4.0, 0.1); cgl2.position.set(0, 0.6, CZ + 0.35); g.add(cgl2); }
  // behind the counter: the big round porthole full of stars, stainless pilasters either side, a lit shelf of bottles
  { const port = new THREE.Mesh(new THREE.CircleGeometry(0.72, 64), outsideMat(false, 0.72, 0.72, 0.4)); port.position.set(0, 1.78, z1 + 0.012); port.userData.noBatch = true; g.add(port); const slv = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.08, 64, 1, true).rotateX(Math.PI / 2), std({ color: 0x3a3a42, roughness: 0.35, metalness: 0.6, side: THREE.BackSide })); slv.position.set(0, 1.78, z1 + 0.052); g.add(slv); const prim = torus(0.76, 0.06, chromeS, 0, 1.78, z1 + 0.03, g, 96);
    { const sx0 = 1.6, sx1 = hw - 0.25, scx = (sx0 + sx1) / 2, n = Math.floor((sx1 - sx0 - 0.1) / 0.13) + 1, bc = [0x8a4a10, 0xd8b060, 0x6a2010, 0xe8e0c8, 0xc86a2a, 0x2a6a2a];
      box(sx1 - sx0, 0.03, 0.22, cream, scx, 1.12, z1 + 0.11, g); box(sx1 - sx0, 0.012, 0.012, chromeS, scx, 1.135, z1 + 0.222, g);
      for (let k = 0; k < n; k++) lathe([[0, 0], [0.03, 0], [0.03, 0.16], [0.012, 0.22], [0.012, 0.26], [0, 0.26]], phys({ color: pick(bc), roughness: 0.1, transparent: true, opacity: 0.85, clearcoat: 1 }), sx0 + 0.07 + k * 0.13, 1.135, z1 + 0.12, g, 12);
      const sgl = glow(0xffe0b0, 1.4, 0.2); sgl.position.set(scx, 1.3, z1 + 0.3); g.add(sgl); }
    const slats = []; [-1.2, 1.2].forEach((x) => { for (let k = 0; k < 5; k++) slats.push([x - 0.12 + k * 0.06, z1 + 0.1]); });
    const SH = H - 0.4, sim = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, SH, 0.12), std({ color: 0xc4c4cc, roughness: 0.28, metalness: 0.85 }), slats.length), mt = new THREE.Matrix4(); slats.forEach(([x, z], i) => { mt.makeTranslation(x, SH / 2, z); sim.setMatrixAt(i, mt); }); g.add(sim); }
  // the menu board on the blank stretch of back wall, left of the slats
  { const left = -hw + 0.14, right = -1.45, bw = Math.min(1.75, right - left), bh = bw / 1.5, W2 = 1200, H2 = 800, [mc, mg] = cnv(W2, H2);
    mg.fillStyle = '#f3e8cf'; mg.fillRect(0, 0, W2, H2); mg.fillStyle = '#b81c2a'; mg.fillRect(0, 0, W2, 172); mg.fillStyle = '#d8d8dc'; mg.fillRect(0, 172, W2, 6);
    mg.fillStyle = '#fff6e8'; mg.textAlign = 'center'; mg.textBaseline = 'alphabetic'; mg.font = '150px "Bebas Neue"'; mg.fillText('MENU', W2 / 2, 146);
    const star = (x, y, r) => { mg.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? r * 0.42 : r, a = (k / 10) * Math.PI * 2 - Math.PI / 2; mg.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } mg.closePath(); mg.fill(); };
    star(W2 / 2 - 190, 92, 24); star(W2 / 2 + 190, 92, 24);
    const items = [['SPACE GRUB', '', '30'], ['VEGAN SPACE GRUB', '', '30'], ['SPACE WATER', '', '5'], ['SPACE SODA', '(extra sugarose)', '10'], ['ASTEROID CAKE', '(100% MSDKOS free)', '25']], X0 = 70, X1 = W2 - 70;
    items.forEach(([name, note, price], i) => { const y = 292 + i * 112;
      mg.textAlign = 'right'; mg.font = 'italic 32px Helvetica, Arial, sans-serif'; mg.fillStyle = '#8a7a6a'; mg.fillText('credits', X1, y); const cw2 = mg.measureText('credits').width + 12;
      mg.font = '80px "Bebas Neue"'; mg.fillStyle = '#b81c2a'; mg.fillText(price, X1 - cw2, y); const pEnd = X1 - cw2 - mg.measureText(price).width - 26;
      mg.textAlign = 'left'; mg.fillStyle = '#2a1a14'; mg.fillText(name, X0, y); let x = X0 + mg.measureText(name).width + 18;
      if (note) { mg.font = fitFont(mg, note, 'italic 32px Helvetica, Arial, sans-serif', pEnd - x - 40, 20); mg.fillStyle = '#7a6a5a'; mg.fillText(note, x, y); x += mg.measureText(note).width + 18; }
      mg.fillStyle = 'rgba(42,26,20,.42)'; for (let dx = x + 6; dx < pEnd; dx += 17) { mg.beginPath(); mg.arc(dx, y - 9, 3, 0, 7); mg.fill(); } });
    grime(mg, W2, H2, 0.12);
    const MB = new THREE.Group(); MB.position.set((left + right) / 2, 2.47 - 0.045 - bh / 2, z1 + 0.012); g.add(MB); rbox(bw + 0.09, bh + 0.09, 0.04, 0.025, chromeS, 0, 0, 0, MB, 3);
    quad(bw, bh, basic({ map: toTex(mc), color: 0xf2ece2 }), 0, 0, 0.027, MB); }
  // and its partner on the blank wall right of the slats
  { const left = 1.45, right = hw - 0.14, bw = Math.min(1.5, right - left), bh = bw * 0.6, W2 = 1200, H2 = 720, [rc, rg] = cnv(W2, H2);
    const bg = rg.createRadialGradient(W2 / 2, H2 / 2, 120, W2 / 2, H2 / 2, 720); bg.addColorStop(0, '#c4202e'); bg.addColorStop(1, '#8e1420'); rg.fillStyle = bg; rg.fillRect(0, 0, W2, H2);
    rg.strokeStyle = '#f3e8cf'; rg.lineWidth = 7; rg.beginPath(); rg.roundRect ? rg.roundRect(30, 30, W2 - 60, H2 - 60, 26) : rg.rect(30, 30, W2 - 60, H2 - 60); rg.stroke();
    rg.fillStyle = '#fff6e8'; rg.textAlign = 'center'; rg.textBaseline = 'alphabetic'; try { rg.letterSpacing = '10px'; } catch (e) {} rg.font = '128px "Bebas Neue"'; rg.fillText('ABSOLUTELY', W2 / 2, 222); try { rg.letterSpacing = '0px'; } catch (e) {}
    const star = (x, y, r) => { rg.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? r * 0.42 : r, a = (k / 10) * Math.PI * 2 - Math.PI / 2; rg.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } rg.closePath(); rg.fill(); };
    const aw = rg.measureText('ABSOLUTELY').width; star(W2 / 2 - aw / 2 - 70, 176, 24); star(W2 / 2 + aw / 2 + 70, 176, 24);
    rg.font = fitFont(rg, 'NO REFUNDS!', '330px "Bebas Neue"', W2 - 150, 120); rg.shadowColor = 'rgba(0,0,0,.25)'; rg.shadowOffsetY = 6; rg.fillText('NO REFUNDS!', W2 / 2, 596); rg.shadowColor = 'transparent';
    grime(rg, W2, H2, 0.12);
    const RB = new THREE.Group(); RB.position.set((left + right) / 2, 2.47 - 0.045 - bh / 2, z1 + 0.012); g.add(RB); rbox(bw + 0.09, bh + 0.09, 0.04, 0.025, chromeS, 0, 0, 0, RB, 3);
    quad(bw, bh, basic({ map: toTex(rc), color: 0xf2ece2 }), 0, 0, 0.027, RB); }
  // the coffee mug on the counter (steaming), and the robot who works this counter
  { const mx = 0.42, mz = CZ + 0.14, mug = std({ color: 0xf2efe8, roughness: 0.35 }), Y = 1.065, mg = new THREE.Group(); mg.position.set(mx, Y, mz); mg.scale.setScalar(1.3); g.add(mg);
    lathe([[0, 0], [0.042, 0], [0.046, 0.09], [0.04, 0.09], [0.037, 0.008], [0, 0.008]], mug, 0, 0, 0, mg, 24); const coffee = cyl(0.039, 0.039, 0.004, std({ color: 0x2a140a, roughness: 0.15 }), 0, 0.055, 0, mg, 24); coffee.userData.noBatch = true;
    torus(0.025, 0.007, mug, 0.05, 0.045, 0, mg, 16, Math.PI * 1.3).rotation.set(0, 0, -Math.PI * 0.65); cyl(0.07, 0.07, 0.006, mug, 0, 0.003, 0, mg, 24);
    g.userData.mug = { x: mx, z: mz, coffee }; g.userData.W = 6;
    const puffs = []; for (let i = 0; i < 9; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xf6f2ec, transparent: true, depthWrite: false, opacity: 0 })); g.add(sp); puffs.push({ sp, t: i / 9 }); }
    up.push((t, dt) => { for (const pf of puffs) { pf.t = (pf.t + dt / 2.8) % 1; const k = pf.t, sp = pf.sp; sp.position.set(mx + Math.sin(k * 5 + pf.t * 9 + t * 0.6) * 0.03 * k, Y + 0.12 + k * 0.5, mz + Math.cos(k * 4) * 0.015 * k); sp.scale.setScalar(0.06 + k * 0.26); sp.material.opacity = Math.sin(Math.PI * k) * 0.62; sp.material.rotation = k * 2; } }); }
  { const _wv = new THREE.Vector3(); up.push((t) => { outsideU().uTime.value = t; g.getWorldPosition(_wv); outsideU().uFloor.value = _wv.y + 0.012; }); }
  const bot = dinerBot(g, up, { Y: 1.065, ZB: CZ - 0.12, ZF: CZ + 0.15, x0: -1.25, x1: 1.25, spots: [-0.85, -0.15], start: -0.6 });
  // the order kiosk just inside the door: tap it and the robot pops a burger out of its head; they land in the aisle and pile up
  const kiosk = new THREE.Group(); kiosk.position.set(0.55, 0, -2.95); kiosk.rotation.y = -0.17; g.add(kiosk); const kred = phys({ color: 0xb81c2a, roughness: 0.3, clearcoat: 0.8 });
  cyl(0.2, 0.22, 0.03, chromeS, 0, 0.015, 0, kiosk, 40); lathe([[0.075, 0], [0.06, 0.05], [0.045, 0.6], [0.05, 0.84], [0, 0.84]], kred, 0, 0.03, 0, kiosk, 32); cyl(0.056, 0.056, 0.03, chromeS, 0, 0.88, 0, kiosk, 24);
  const khead = new THREE.Group(); khead.position.set(0, 1.03, 0); khead.rotation.x = -0.55; kiosk.add(khead); rbox(0.5, 0.36, 0.05, 0.025, kred, 0, 0, -0.025, khead, 3); rbox(0.52, 0.38, 0.03, 0.02, chromeS, 0, 0, -0.045, khead, 3);
  const [kc, kg] = cnv(512, 352), kt = toTex(kc); let orders = 0, kflash = 0;
  const drawK = (lit) => { const bgG = kg.createLinearGradient(0, 0, 0, 352); bgG.addColorStop(0, lit ? '#2c3070' : '#161a40'); bgG.addColorStop(1, lit ? '#1c1f4a' : '#0c0e24'); kg.fillStyle = bgG; kg.fillRect(0, 0, 512, 352);
    kg.fillStyle = '#b81c2a'; kg.fillRect(0, 0, 512, 64); kg.fillStyle = '#fff6e8'; kg.textAlign = 'center'; kg.textBaseline = 'middle'; kg.font = '46px "Bebas Neue"'; kg.fillText('ORDER HERE', 256, 35);
    const zi = zeroTex.image; if (zi && zi.complete && zi.naturalWidth) { kg.save(); kg.globalCompositeOperation = 'lighter'; kg.drawImage(zi, 10, 2, 60, 60); kg.drawImage(zi, 442, 2, 60, 60); kg.restore(); }
    if (orders) { kg.textAlign = 'right'; kg.font = '30px "Bebas Neue"'; kg.fillStyle = '#7af4ff'; kg.fillText('#' + String(orders).padStart(3, '0'), 492, 92); kg.textAlign = 'center'; }
    const bx = 256, by = 168; kg.fillStyle = '#e09a44'; kg.beginPath(); kg.ellipse(bx, by - 12, 86, 50, 0, Math.PI, 0); kg.fill(); kg.fillStyle = '#f4ead0'; for (const [sx, sy] of [[-40, -38], [-10, -50], [22, -44], [50, -30], [-58, -22], [8, -26]]) { kg.beginPath(); kg.ellipse(bx + sx, by + sy, 5, 2.6, 0.3, 0, 7); kg.fill(); }
    kg.fillStyle = '#5aa83a'; kg.beginPath(); kg.moveTo(bx - 94, by - 8); for (let k = 0; k <= 12; k++) kg.lineTo(bx - 94 + k * 15.7, by - 8 + (k % 2 ? 9 : 0)); kg.lineTo(bx + 94, by + 2); kg.lineTo(bx - 94, by + 2); kg.fill();
    kg.fillStyle = '#f2b81e'; kg.fillRect(bx - 84, by + 2, 168, 8); kg.fillStyle = '#5a2e18'; kg.beginPath(); kg.roundRect ? kg.roundRect(bx - 90, by + 8, 180, 24, 12) : kg.rect(bx - 90, by + 8, 180, 24); kg.fill();
    kg.fillStyle = '#e09a44'; kg.beginPath(); kg.roundRect ? kg.roundRect(bx - 84, by + 32, 168, 22, 10) : kg.rect(bx - 84, by + 32, 168, 22); kg.fill();
    kg.fillStyle = lit ? '#ff5a6a' : '#d82a3a'; kg.beginPath(); kg.roundRect ? kg.roundRect(96, 258, 320, 66, 33) : kg.rect(96, 258, 320, 66); kg.fill(); kg.fillStyle = '#ffffff'; kg.font = '42px "Bebas Neue"'; kg.fillText('TAP TO ORDER', 256, 293); kt.needsUpdate = true; };
  drawK(false); const scr = quad(0.44, 0.3, basic({ map: kt }), 0, 0, 0.006, khead); scr.userData.noBatch = true; const kgl = glow(0x8a9cff, 0.8, 0.14); kgl.position.set(0, 0.02, 0.12); khead.add(kgl);
  const khit = box(0.62, 1.35, 0.55, basic({ color: 0xffffff }), 0, 0.68, 0, kiosk); khit.visible = false; bot.hot = [scr, khit]; bot.hot.forEach((o) => { o.userData.go = 'diner'; o.userData.fx = 'order'; });
  // burgers: one merged mesh with baked colours, instanced, so a mountain of them is still one draw call
  const bgeo = (() => { const parts = [], add = (geo, hex, y = 0, ry = 0) => { const gg = geo.index ? geo.toNonIndexed() : geo; if (ry) gg.rotateY(ry); gg.translate(0, y, 0); if (gg.attributes.uv) gg.deleteAttribute('uv'); const c = new THREE.Color(hex), n = gg.attributes.position.count, col = new Float32Array(n * 3); for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3); gg.setAttribute('color', new THREE.BufferAttribute(col, 3)); parts.push(gg); };
    add(new THREE.LatheGeometry([[0, 0], [0.066, 0], [0.074, 0.01], [0.074, 0.022], [0, 0.026]].map(([a, b]) => new THREE.Vector2(a, b)), 20), 0xd8913a);
    add(new THREE.CylinderGeometry(0.077, 0.077, 0.024, 20), 0x4a2614, 0.038); add(new THREE.BoxGeometry(0.15, 0.005, 0.15), 0xf2b81e, 0.052, Math.PI / 4);
    add(new THREE.CylinderGeometry(0.081, 0.079, 0.008, 20), 0x5aa83a, 0.058); add(new THREE.CylinderGeometry(0.066, 0.066, 0.01, 20), 0xd8382a, 0.067);
    const bunTop = new THREE.SphereGeometry(0.075, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); bunTop.scale(1, 0.62, 1); add(bunTop, 0xd8913a, 0.072);
    for (let k = 0; k < 7; k++) { const a = k * 0.9, r = k ? 0.036 : 0, sd = new THREE.SphereGeometry(0.0065, 6, 4); sd.scale(1, 0.5, 1.6); sd.rotateY(a); sd.translate(Math.cos(a) * r, 0, Math.sin(a) * r); add(sd, 0xf4ead0, 0.072 + 0.0465 * Math.sqrt(1 - (r / 0.075) ** 2)); }
    const mg = mergeGeometries(parts); mg.translate(0, -0.06, 0); return mg; })();
  const BN = 160, bim = new THREE.InstancedMesh(bgeo, std({ vertexColors: true, roughness: 0.6 }), BN), Zm = new THREE.Matrix4().makeScale(0, 0, 0), M4 = new THREE.Matrix4(), bq = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), _h = new THREE.Vector3();
  for (let i = 0; i < BN; i++) bim.setMatrixAt(i, Zm); bim.frustumCulled = false; bim.userData.noBatch = true; bim.visible = false; g.add(bim);
  const pile = makePile(-1.3, 1.3, -5.5, -2.35), B = []; let moving = 0, born = 0, queue = 0, gap = 0;
  const launch = (from) => { let it; if (B.length < BN) { it = { slot: B.length }; B.push(it); } else { it = B.reduce((a, b) => (a.born < b.born ? a : b)); if (!it.rest) moving--; }
    const tx = R(-0.28, 0.28), tz = R(-4.25, -3.75), T = R(0.85, 1.0), ty = pile.at(tx, tz, 0.05) + 0.06;
    Object.assign(it, { p: from.clone(), v: new THREE.Vector3((tx - from.x) / T, (ty - from.y + 4.9 * T * T) / T, (tz - from.z) / T), e: new THREE.Euler(R(0, 6), R(0, 6), R(0, 6)), w: new THREE.Vector3(R(-8, 8), R(-5, 5), R(-8, 8)), rest: false, b: 0, born: ++born }); moving++; bim.visible = true; };
  let kLogo = false; up.push((t, dt) => { const d = Math.min(dt, 0.05); if (!kLogo && zeroTex.image && zeroTex.image.complete && zeroTex.image.naturalWidth) { kLogo = true; drawK(false); } scr.material.color.setScalar(kflash > 0 ? 1 : 0.86 + 0.14 * (0.5 + 0.5 * Math.sin(t * 3.2))); if (kflash > 0) { kflash -= d; if (kflash <= 0) drawK(false); }
    if (queue > 0) { gap -= d; if (gap <= 0) { gap = 0.16; queue--; bot.head(_h); launch(_h); bot.hop(); } }
    if (!moving) return;
    for (const it of B) { if (it.rest) continue; const p = it.p; it.v.y -= 9.8 * d; p.addScaledVector(it.v, d); it.e.x += it.w.x * d; it.e.y += it.w.y * d; it.e.z += it.w.z * d;
      const floor = pile.at(p.x, p.z, 0.05) + 0.06;
      if (it.v.y < 0 && p.y < floor) { p.y = floor; it.b++; it.v.y = -it.v.y * 0.22; it.v.x *= 0.3; it.v.z *= 0.3; it.w.multiplyScalar(0.4);
        if (it.b > 2 || Math.abs(it.v.y) < 0.35) { it.rest = true; moving--; it.e.x = Math.round(it.e.x / Math.PI) * Math.PI; it.e.z = Math.round(it.e.z / Math.PI) * Math.PI; p.y = pile.settle(p, 0.05, 0.12) + 0.06; pile.add(p.x, p.z, 0.06, p.y + 0.05); } }
      M4.compose(p, bq.setFromEuler(it.e), one); bim.setMatrixAt(it.slot, M4); }
    bim.instanceMatrix.needsUpdate = true; });
  bot.order = () => { orders++; kflash = 0.25; drawK(true); if (queue === 0 && gap <= 0) gap = 0.32; queue = Math.min(queue + 1, 40); bot.wake(); };
  return bot;
}

/* ---------- the diner's robot: a slow, clunky box on wheels that rolls the back of the counter, wipes, pours, swaps plates ---------- */
function dinerBot(g, up, o = {}) {
  const W = g.userData.W, mug = g.userData.mug, Y = o.Y ?? 1.025, ZB = o.ZB ?? -2.835, ZF = o.ZF ?? -2.62, X0 = o.x0 ?? -2.55, X1 = o.x1 ?? 2.0;
  const shell = phys({ color: 0xe9dfc6, roughness: 0.45, clearcoat: 0.4 }), trimR = phys({ color: 0xb81c2a, roughness: 0.4, clearcoat: 0.5 }), chromeS = phys({ color: 0xd8d8dc, metalness: 1, roughness: 0.22 }), rubber = std({ color: 0x1a1a1c, roughness: 0.8 });
  const rb = new THREE.Group(); rb.position.set(o.start ?? -0.9, Y, ZB); g.add(rb); const body = new THREE.Group(); rb.add(body);
  rbox(0.36, 0.25, 0.19, 0.03, shell, 0, 0.17, 0, body, 3); box(0.37, 0.035, 0.195, trimR, 0, 0.065, 0, body);
  const face = box(0.2, 0.085, 0.01, std({ color: 0x14161a, roughness: 0.3 }), 0, 0.2, 0.096, body);
  const eyeM = basic({ color: 0x7fe8ff }), eyes = [-0.045, 0.045].map((ex) => { const e = cyl(0.014, 0.014, 0.004, eyeM, ex, 0.205, 0.102, body, 12); e.rotation.x = Math.PI / 2; return e; });
  cyl(0.004, 0.004, 0.09, chromeS, 0.13, 0.33, -0.05, body, 6); const bulb = sph(0.012, basic({ color: 0xff3a3a }), 0.13, 0.38, -0.05, body, 8);
  const lid = new THREE.Group(); lid.position.set(0, 0.302, -0.08); body.add(lid); box(0.3, 0.012, 0.16, chromeS, 0, 0, 0.08, lid); // tray on top, hinged at the back
  let hopT = 0;
  const wheels = [[-0.13, 0.07], [0.13, 0.07], [-0.13, -0.07], [0.13, -0.07]].map(([wx, wz]) => { const w = cyl(0.032, 0.032, 0.026, rubber, wx, 0.032, wz, rb, 14); w.rotation.x = Math.PI / 2; return w; });
  // the spout: folds out of the right side, swings forward over the cup, tips
  const spP = new THREE.Group(); spP.position.set(0.12, 0.2, 0.09); body.add(spP); const spArm = new THREE.Group(); spP.add(spArm);
  const tube = cyl(0.011, 0.011, 1, chromeS, 0, 0, 0.5, spArm, 8); tube.rotation.x = Math.PI / 2; const nozzle = cyl(0.016, 0.009, 0.03, chromeS, 0, 0, 1, spArm, 10); nozzle.rotation.x = Math.PI / 2;
  const stream = cyl(0.0045, 0.0045, 1, std({ color: 0x3a1c0a, roughness: 0.1 }), 0, -0.5, 0, null, 6); const streamG = new THREE.Group(); streamG.add(stream); g.add(streamG); streamG.visible = false;
  // the wiper: an arm with a rag, out of the left side
  const wpP = new THREE.Group(); wpP.position.set(-0.1, 0.06, 0.09); body.add(wpP); const wpArm = cyl(0.008, 0.008, 1, chromeS, 0, 0, 0.5, wpP, 6); wpArm.rotation.x = Math.PI / 2; const rag = rbox(0.11, 0.014, 0.07, 0.006, std({ color: 0x9cc8e8, roughness: 0.95 }), 0, -0.04, 1, wpP, 2);
  // plates: one on the counter, one riding on the tray
  const plateM = std({ color: 0xf2ece0, roughness: 0.35 }), mkPlate = () => { const p = new THREE.Group(); cyl(0.1, 0.085, 0.014, plateM, 0, 0.007, 0, p, 24); for (let k = 0; k < 3; k++) sph(R(0.02, 0.032), std({ color: pick([0xd8a050, 0x6a8a3a, 0xc8642a, 0xe8d8a0]), roughness: 0.7 }), R(-0.04, 0.04), 0.022, R(-0.04, 0.04), p, 8); p.traverse((o) => (o.userData.noBatch = true)); g.add(p); return p; };
  const spots = (o.spots || [-1.95, 0.8]).map((x) => ({ x, plate: null })); spots[0].plate = mkPlate(); spots[0].plate.position.set(spots[0].x, Y, ZF); let carried = mkPlate();
  [rb, body, spP, wpP, streamG].forEach((o) => o.traverse((c) => (c.userData.noBatch = true)));
  const ext = (k) => { spArm.scale.set(1, 1, 0.02 + 0.13 * k); nozzle.position.z = 1; }; ext(0); spArm.visible = false; wpP.scale.set(1, 1, 0.01); wpP.visible = false;
  // a tiny sequencer: each step runs for dur seconds with k going 0 -> 1
  let seq = [], si = 0, st = 0, idle = 4 + R(0, 4), x = o.start ?? -0.9, first = true;
  const run = (steps) => { seq = steps; si = 0; st = 0; };
  const rollTo = (tx) => ({ dur: Math.abs(tx - x) / 0.24 + 0.4, fn: null, roll: tx });
  const plan = () => {
    const jobs = ['pour', 'wipe', 'wipe', 'plate', 'plate', 'wipe', 'plate']; const job = first ? 'pour' : pick(jobs); first = false;
    if (job === 'pour') { const tx = clamp(mug.x - 0.12, X0, X1); run([rollTo(tx), { dur: 0.9, fn: (k) => { spArm.visible = true; spArm.rotation.y = -Math.PI / 2 * (1 - k); ext(k * 0.6); } }, { dur: 0.7, fn: (k) => { ext(0.6 + 0.4 * k); spArm.rotation.x = 0.55 * k; } },
      { dur: 2.6, fn: (k, f) => { streamG.visible = k > 0.05 && k < 0.95; if (f) { nozzle.getWorldPosition(_v); g.worldToLocal(_v); streamG.position.copy(_v); streamG.scale.set(1, Math.max(0.01, _v.y - (Y + 0.05 + 0.03 * k)), 1); } if (k > 0.05 && k < 0.95) mug.coffee.position.y = Math.max(mug.coffee.position.y, cBase + 0.03 * Math.min(1, (k - 0.05) / 0.9)); } },
      { dur: 0.7, fn: (k) => { streamG.visible = false; spArm.rotation.x = 0.55 * (1 - k); ext(1 - 0.4 * k); } }, { dur: 0.9, fn: (k) => { spArm.rotation.y = -Math.PI / 2 * k; ext(0.6 * (1 - k)); if (k >= 1) spArm.visible = false; } }]); }
    else if (job === 'wipe') { const tx = R(X0 + 0.25, X1 - 0.2); run([rollTo(tx), { dur: 0.8, fn: (k) => { wpP.visible = true; wpP.scale.set(1, 1, 0.01 + 0.14 * k); } },
      { dur: 3.2, fn: (k) => { wpP.rotation.y = Math.sin(k * Math.PI * 8) * 0.55; } }, { dur: 0.8, fn: (k) => { wpP.rotation.y = 0; wpP.scale.set(1, 1, 0.01 + 0.14 * (1 - k)); if (k >= 1) wpP.visible = false; } }]); }
    else { const sp = pick(spots), tx = clamp(sp.x, X0, X1); run([rollTo(tx), { dur: 1.6, start: () => { sp.from = sp.plate ? 'counter' : 'tray'; }, fn: (k) => { // lift the plate across in a little arc
        const a = new THREE.Vector3(rb.position.x, Y + 0.31, ZB), b = new THREE.Vector3(sp.x, Y, ZF), p = sp.from === 'counter' ? sp.plate : carried; if (!p) return; const u = sp.from === 'counter' ? 1 - k : k; p.position.lerpVectors(a, b, u); p.position.y += Math.sin(u * Math.PI) * 0.12; },
        end: () => { if (sp.from === 'counter') { const p = sp.plate; sp.plate = null; if (carried) { g.remove(carried); } carried = p; } else { sp.plate = carried; carried = mkPlate(); carried.position.set(rb.position.x, Y + 0.31, ZB); } } }]); }
  };
  const _v = new THREE.Vector3();
  const cBase = mug.coffee.position.y;
  up.push((t, dt) => { const d = Math.min(dt, 0.05); if (hopT > 0) { hopT = Math.max(0, hopT - d); const k = 1 - hopT / 0.45; lid.rotation.x = -Math.sin(Math.min(1, k * 1.6) * Math.PI) * 1.1; body.position.y = Math.sin(Math.min(1, k * 2.2) * Math.PI) * 0.03; } mug.coffee.position.y = Math.max(cBase - 0.002, mug.coffee.position.y - d * 0.0006);
    // idle life: blink, antenna light
    eyes.forEach((e) => (e.scale.y = Math.sin(t * 0.7) > 0.985 ? 0.15 : 1)); bulb.material.color.setHex(Math.sin(t * 3) > 0.6 ? 0xff3a3a : 0x4a0a0a);
    if (carried && !(seq[si] && seq[si].fn && seq[si].start)) carried.position.set(rb.position.x, Y + 0.31, ZB);
    if (!seq.length || si >= seq.length) { if (seq.length) { seq = []; idle = R(9, 20); } idle -= d; body.rotation.z *= 0.9; if (idle <= 0) plan(); return; }
    const step = seq[si]; if (st === 0 && step.start) step.start(); st += d; let k = step.roll !== undefined ? 0 : Math.min(1, st / step.dur);
    if (step.roll !== undefined) { // clunky: lurches, little stalls, a wobble
      const lurch = Math.max(0, Math.sin(t * 4.2)) * 0.9 + 0.1, dir = Math.sign(step.roll - x), v = 0.26 * lurch * d; if (Math.abs(step.roll - x) <= v) { x = step.roll; k = 1; } else x += dir * v;
      rb.position.x = x; wheels.forEach((w) => (w.rotation.y += (dir * v) / 0.032)); body.rotation.z = -dir * 0.035 * lurch + Math.sin(t * 17) * 0.004; body.position.y = Math.abs(Math.sin(t * 9)) * 0.004;
    } else { body.rotation.z *= 0.85; step.fn && step.fn(k, true); }
    if (k >= 1) { step.end && step.end(); si++; st = 0; } });
  return { head: (v) => v.set(rb.position.x, Y + 0.33, rb.position.z), hop: () => { hopT = 0.45; bulb.material.color.setHex(0xffffff); }, wake: () => { if (!seq.length) idle = Math.min(idle, 1.5); }, show: (on) => { if (rb.visible !== on) rb.visible = on; } };
}

/* ---------- a height field in front of the machines, so spilled cans and ice pile up instead of vanishing ---------- */
function makePile(x0, x1, z0, z1, cell = 0.05) {
  const nx = Math.ceil((x1 - x0) / cell), nz = Math.ceil((z1 - z0) / cell), hf = new Float32Array(nx * nz);
  for (let iz = 0; iz < nz; iz++) { const z = z0 + (iz + 0.5) * cell; for (let ix = 0; ix < nx; ix++) hf[iz * nx + ix] = z > -0.2 ? 0.16 : 0.02; }
  const idx = (x, z) => { const ix = Math.floor((x - x0) / cell), iz = Math.floor((z - z0) / cell); return ix < 0 || iz < 0 || ix >= nx || iz >= nz ? -1 : iz * nx + ix; };
  const ground = (x, z) => (z > -0.2 ? 0.16 : 0.02);
  const at = (x, z, r) => { let h = ground(x, z); for (let dz = -r; dz <= r + 1e-6; dz += cell) for (let dx = -r; dx <= r + 1e-6; dx += cell) { const k = idx(x + dx, z + dz); if (k >= 0 && hf[k] > h) h = hf[k]; } return h; };
  const add = (x, z, r, top) => { for (let dz = -r; dz <= r + 1e-6; dz += cell) for (let dx = -r; dx <= r + 1e-6; dx += cell) { const k = idx(x + dx, z + dz); if (k >= 0 && hf[k] < top) hf[k] = top; } };
  // like sand: if the spot is a tower compared with its neighbours, slide toward the lowest one nearby
  const settle = (p, r, h) => { let best = at(p.x, p.z, r), bx = p.x, bz = p.z; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, x = p.x + Math.cos(a) * (r * 2 + 0.03), z = p.z + Math.sin(a) * (r * 2 + 0.03), v = at(x, z, r); if (v < best - h * 0.9) { best = v; bx = x; bz = z; } } p.x = bx; p.z = bz; return best; };
  return { at, add, settle };
}
/* ---------- the vending machine drops something in the tray and it tumbles out (tap fast for an avalanche) ---------- */
function spitter(m, up, at, pile) {
  const kinds = {
    can: { n: 140, parts: [[new THREE.CylinderGeometry(0.033, 0.033, 0.122, 14), phys({ color: 0xffffff, metalness: 0.55, roughness: 0.3, clearcoat: 0.6 }), 0, true], [new THREE.CylinderGeometry(0.0336, 0.0336, 0.03, 14), std({ color: 0xf2efe8, roughness: 0.4 }), 0.01, false], [new THREE.CylinderGeometry(0.028, 0.03, 0.006, 14), phys({ color: 0xc8c8cc, metalness: 1, roughness: 0.3 }), 0.062, false]], r: 0.035, h: 0.034, cols: [0xc81e2a, 0x1e5ac8, 0x2a9a4a, 0xe8b020, 0xe8e2d0, 0x6a2a8a, 0xff7a1a] },
    bag: { n: 70, parts: [[new THREE.BoxGeometry(0.13, 0.18, 0.045), phys({ color: 0xffffff, metalness: 0.35, roughness: 0.25, clearcoat: 0.8 }), 0, true]], r: 0.07, h: 0.024, cols: [0xe8c020, 0xd83a1a, 0x2a6ad8, 0x9a3ad8, 0x2aa84a] },
    bar: { n: 70, parts: [[new THREE.BoxGeometry(0.16, 0.034, 0.05), std({ color: 0xffffff, roughness: 0.5 }), 0, true]], r: 0.06, h: 0.018, cols: [0x5a2a12, 0xc8a050, 0x1a1a1a, 0xc81e5a, 0xe8e2d0] },
  };
  const Z = new THREE.Matrix4().makeScale(0, 0, 0), M4 = new THREE.Matrix4(), off = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), c = new THREE.Color();
  for (const k of Object.values(kinds)) { k.meshes = k.parts.map(([geo, mat]) => { const im = new THREE.InstancedMesh(geo, mat, k.n); for (let i = 0; i < k.n; i++) im.setMatrixAt(i, Z); im.frustumCulled = false; im.userData.noBatch = true; im.visible = false; m.add(im); return im; }); k.slots = []; k.free = Array.from({ length: k.n }, (_, i) => i); k.moving = 0; }
  const place = (k, it) => { M4.compose(it.p, q.setFromEuler(it.e), one); k.parts.forEach(([, , oy], pi) => k.meshes[pi].setMatrixAt(it.slot, oy ? off.makeTranslation(0, oy, 0).premultiply(M4) : M4)); };
  const fire = () => {
    const kn = pick(['can', 'can', 'bag', 'bar']), k = kinds[kn]; let slot;
    if (k.free.length) slot = k.free.pop(); else { const old = k.slots.shift(); slot = old.slot; if (!old.rest) k.moving--; } // a full pile recycles its oldest piece
    k.parts.forEach(([, , , tint], pi) => { if (tint) { k.meshes[pi].setColorAt(slot, c.setHex(pick(k.cols))); k.meshes[pi].instanceColor.needsUpdate = true; } k.meshes[pi].visible = true; });
    k.slots.push({ slot, p: at.clone().add(new THREE.Vector3(R(-0.12, 0.12), 0, 0)), v: new THREE.Vector3(R(-0.35, 0.35), R(1.1, 1.7), R(0.9, 1.5)), e: new THREE.Euler(R(-1, 1), R(0, 6), R(-1, 1)), w: new THREE.Vector3(R(-9, 9), R(-6, 6), R(-9, 9)), rest: false, b: 0 }); k.moving++;
  };
  up.push((t, dt) => { const d = Math.min(dt, 0.05);
    for (const k of Object.values(kinds)) { if (!k.moving) continue;
      for (const it of k.slots) { if (it.rest) continue; const p = it.p;
        it.v.y -= 9.8 * d; p.addScaledVector(it.v, d); it.e.x += it.w.x * d; it.e.y += it.w.y * d; it.e.z += it.w.z * d;
        const floor = pile.at(p.x, p.z, k.r * 0.6) + k.h;
        if (p.y < floor) { p.y = floor; it.b++; it.v.y = -it.v.y * 0.3; it.v.x *= 0.6; it.v.z *= 0.6; it.w.multiplyScalar(0.5);
          if (it.b > 3 || (Math.abs(it.v.y) < 0.3 && Math.hypot(it.v.x, it.v.z) < 0.3)) { it.rest = true; k.moving--; it.e.x = Math.round(it.e.x / (Math.PI / 2)) * (Math.PI / 2); it.e.z = Math.round(it.e.z / (Math.PI / 2)) * (Math.PI / 2);
            p.y = pile.settle(p, k.r * 0.6, k.h * 2) + k.h; pile.add(p.x, p.z, k.r * 0.6, p.y + k.h * 0.8); } }
        place(k, it); }
      k.meshes.forEach((im) => (im.instanceMatrix.needsUpdate = true)); } });
  return { fire };
}
/* ---------- the ice machine coughs up a scoop's worth onto the sidewalk (and it piles up if you keep tapping) ---------- */
function iceBurst(m, up, at, pile) {
  const N = 640, im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.034, 0.03, 0.034), phys({ color: 0xe6f6ff, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.82, clearcoat: 1, envMapIntensity: 2 }), N);
  im.frustumCulled = false; im.visible = false; im.userData.noBatch = true; m.add(im); const Z = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < N; i++) im.setMatrixAt(i, Z);
  const P = Array.from({ length: N }, (_, i) => ({ i, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), on: false, rest: true, b: 0, born: 0 })), o = new THREE.Object3D(); let moving = 0, clock = 0;
  const fire = () => { const order = [...P].sort((a, b) => (a.on === b.on ? a.born - b.born : a.on ? 1 : -1)); // unused first, then the oldest
    for (let k = 0; k < 26; k++) { const q = order[k]; if (q.on && !q.rest) moving--; q.on = true; q.rest = false; q.b = 0; q.born = ++clock; q.p.copy(at).add(new THREE.Vector3(R(-0.1, 0.1), R(-0.03, 0.03), 0)); q.v.set(R(-0.75, 0.75), R(0.8, 2.0), R(0.8, 1.9)); q.r.set(R(0, 6), R(0, 6), R(0, 6)); q.w.set(R(-14, 14), R(-14, 14), R(-14, 14)); moving++; }
    im.visible = true; };
  up.push((t, dt) => { if (!moving) return; const d = Math.min(dt, 0.05);
    for (const q of P) { if (!q.on || q.rest) continue;
      q.v.y -= 9.8 * d; q.p.addScaledVector(q.v, d); q.r.x += q.w.x * d; q.r.y += q.w.y * d; q.r.z += q.w.z * d; const floor = pile.at(q.p.x, q.p.z, 0.02) + 0.016;
      if (q.p.y < floor) { q.p.y = floor; q.b++; q.v.y = -q.v.y * 0.28; q.v.x *= 0.65; q.v.z *= 0.65; q.w.multiplyScalar(0.5);
        if (q.b > 3 || (Math.abs(q.v.y) < 0.25 && Math.hypot(q.v.x, q.v.z) < 0.25)) { q.rest = true; moving--; q.p.y = pile.settle(q.p, 0.02, 0.03) + 0.016; pile.add(q.p.x, q.p.z, 0.02, q.p.y + 0.012); } }
      o.position.copy(q.p); o.rotation.copy(q.r); o.scale.setScalar(1); o.updateMatrix(); im.setMatrixAt(q.i, o.matrix); }
    im.instanceMatrix.needsUpdate = true; });
  return { fire };
}
function vendTex() {
  const [c, g] = cnv(160, 320); g.fillStyle = '#e8f4ff'; g.fillRect(0, 0, 160, 320);
  g.fillStyle = '#c81e1e'; g.fillRect(0, 0, 160, 46); g.fillStyle = '#fff'; g.font = '32px "Bebas Neue"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('COLD DRINKS', 80, 24);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { g.fillStyle = pick(['#c81e1e', '#1e5ac8', '#e8a21e', '#2a9a4a', '#6b2ac8']); g.fillRect(14 + k * 34, 64 + r * 58, 24, 40); g.fillStyle = '#333'; g.fillRect(14 + k * 34, 106 + r * 58, 24, 4); }
  g.fillStyle = '#222'; g.fillRect(14, 300, 132, 12); grime(g, 160, 320, 0.4); return toTex(c);
}
function flagstoneTex() {
  const [c, g] = cnv(512, 512), [hc, hg] = cnv(512, 512); g.fillStyle = '#3a3330'; g.fillRect(0, 0, 512, 512); hg.fillStyle = '#404040'; hg.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { const x = R(0, 512), y = R(0, 512), w = R(40, 110), h = R(28, 70); g.fillStyle = pick(['#a89a88', '#8f8476', '#b8aa94', '#9a8a7a', '#7e7466', '#c0b4a0']); g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * R(0.8, 1), y + R(-6, 6)); g.lineTo(x + w + R(-6, 6), y + h); g.lineTo(x + R(-6, 6), y + h * R(0.85, 1.05)); g.closePath(); g.fill(); hg.fillStyle = `rgb(${RI(150, 200)},${RI(150, 200)},${RI(150, 200)})`; hg.fill(); }
  grime(g, 512, 512, 0.5);
  return { map: toTex(c, [2, 1.2]), normalMap: toTex(heightToNormal(hc, 1.8), [2, 1.2], false), normalScale: new THREE.Vector2(0.9, 0.9) };
}
export function lampMini(parent, x, y, z, shadeCol, lightCol, intensity = 5) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  lathe([[0, 0], [0.12, 0], [0.13, 0.05], [0.07, 0.12], [0.06, 0.4], [0.03, 0.42], [0.03, 0.55], [0, 0.55]], phys({ color: 0x8a6a3a, metalness: 0.7, roughness: 0.3, clearcoat: 0.5 }), 0, 0, 0, g, 24);
  const sh = cyl(0.15, 0.24, 0.26, std({ color: shadeCol, emissive: lightCol, emissiveIntensity: 0.6, side: THREE.DoubleSide, roughness: 0.9 }), 0, 0.62, 0, g, 24); sh.userData.noCast = true;
  const L = new THREE.PointLight(lightCol, intensity, 6, 1.6); L.position.y = 0.55; g.add(L); const gl = glow(lightCol, 1.2, 0.45); gl.position.y = 0.6; g.add(gl); return g;
}
export function plant(parent, x, y, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); parent.add(g);
  lathe([[0, 0], [0.18, 0], [0.22, 0.42], [0.2, 0.44], [0.17, 0.44], [0.16, 0.04], [0, 0.04]], std({ color: 0x8a4a2a, roughness: 0.8 }), 0, 0, 0, g, 24);
  cyl(0.19, 0.19, 0.02, std({ color: 0x2a1c12, roughness: 1 }), 0, 0.41, 0, g, 20);
  // fronds: arching stems with paired leaflets, built as one mesh so it has real volume from every side
  const pos = [], col = [], idx = []; let vi = 0; const dark = new THREE.Color(0x24461a), mid = new THREE.Color(0x3f6e2a), tip = new THREE.Color(0x7aa848);
  const push = (v, c) => { pos.push(v.x, v.y, v.z); col.push(c.r, c.g, c.b); return vi++; };
  const NF = 24;
  for (let f = 0; f < NF; f++) {
    const inner = f % 3 === 0, yaw = (f / NF) * Math.PI * 2 + R(-0.25, 0.25), len = inner ? R(0.45, 0.65) : R(0.6, 0.9), lift = inner ? R(2.2, 2.9) : R(1.3, 1.9), droop = inner ? R(1.6, 2.2) : R(1.4, 2.0), N = 14, pts = [];
    for (let i = 0; i <= N; i++) { const r = (i / N) * len; pts.push(new THREE.Vector3(Math.cos(yaw) * r, 0.42 + lift * r - droop * r * r, Math.sin(yaw) * r)); }
    const side = new THREE.Vector3(-Math.sin(yaw), 0, Math.cos(yaw));
    for (let i = 1; i < N; i++) {
      const p = pts[i], tan = pts[i + 1].clone().sub(pts[i - 1]).normalize(), up = new THREE.Vector3().crossVectors(tan, side).normalize(), t = i / N;
      const ll = 0.13 * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.08)) + 0.015, lw = ll * 0.32;
      for (const sd of [-1, 1]) {
        const out = side.clone().multiplyScalar(sd).addScaledVector(tan, 0.55).addScaledVector(up, 0.35).normalize();
        const tp = p.clone().addScaledVector(out, ll), m1 = p.clone().addScaledVector(out, ll * 0.42), wv = tan.clone().multiplyScalar(lw);
        const i0 = push(p, dark), i1 = push(m1.clone().add(wv), mid), i2 = push(tp, tip.clone().lerp(mid, t * 0.5)), i3 = push(m1.clone().sub(wv), mid);
        idx.push(i0, i1, i2, i0, i2, i3);
      }
    }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const fern = new THREE.Mesh(geo, std({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide })); fern.castShadow = true; fern.receiveShadow = true; g.add(fern);
  return g;
}
export function palm(parent, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  lathe([[0, 0], [0.32, 0], [0.3, 0.5], [0.26, 0.52], [0.24, 0.05], [0, 0.05]], std({ color: 0xc86a3a, roughness: 0.8 }), 0, 0, 0, g, 24);
  const trunk = cyl(0.07, 0.1, 2.8, texMat(woodTex(64, 256, '#7a5a3a', 1, [1, 3]), { roughness: 0.9 }), 0, 1.9, 0, g, 10); trunk.rotation.z = 0.08;
  const frond = std({ color: 0x3a8a4a, roughness: 0.7, side: THREE.DoubleSide });
  for (let k = 0; k < 8; k++) { const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 1.8, 1, 8), frond); const p = lf.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const yy = p.getY(i) + 0.9; p.setZ(i, -(yy * yy) * 0.25); } lf.geometry.computeVertexNormals(); lf.position.set(0.1, 3.3, 0); lf.rotation.set(-0.3, (k / 8) * Math.PI * 2, 0); lf.rotateX(-1.1); g.add(lf); }
  return g;
}
let _grime = null;
function carGrime() {
  if (_grime) return _grime;
  const W = 512, H = 256, [c, g] = cnv(W, H); g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) blotch(g, R(0, W), R(0, H), R(10, 60), 'rgba(120,60,24,A)', R(0.25, 0.6)); // rust
  for (let i = 0; i < 40; i++) blotch(g, R(0, W), R(0, H), R(4, 14), 'rgba(90,40,16,A)', R(0.4, 0.8));
  for (let i = 0; i < 14; i++) { const x = R(0, W), w = R(6, 30); const gr = g.createLinearGradient(0, H * 0.4, 0, H); gr.addColorStop(0, 'rgba(40,30,20,0)'); gr.addColorStop(1, 'rgba(40,30,20,.55)'); g.fillStyle = gr; g.fillRect(x, H * 0.4, w, H * 0.6); } // drip streaks
  g.strokeStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 60; i++) { g.lineWidth = R(0.5, 1.5); g.beginPath(); const x = R(0, W), y = R(0, H); g.moveTo(x, y); g.lineTo(x + R(-40, 40), y + R(-6, 6)); g.stroke(); } // scratches
  for (let i = 0; i < 10; i++) blotch(g, R(0, W), R(0, H), R(20, 70), 'rgba(0,0,0,A)', R(0.12, 0.3)); // grime
  speckle(g, W, H, 9000, 0.35, ['#3a2a1a', '#000', '#8a5a30']);
  return (_grime = toTex(c, [1, 1]));
}
export function makeCar(col) {
  const g = new THREE.Group();
  // old beaters: faded paint, rust, dull chrome, one mismatched panel
  const faded = new THREE.Color(col).lerp(new THREE.Color(0x8a867c), R(0.25, 0.45));
  const gm = carGrime().clone(); gm.needsUpdate = true; gm.offset.set(R(0, 1), R(0, 1));
  const paint = phys({ color: faded, map: gm, roughness: R(0.5, 0.7), metalness: 0.25, clearcoat: 0.15, clearcoatRoughness: 0.6 });
  const primer = std({ color: pick([0x7a766e, 0x5e6a62, 0x8a5a3a]), roughness: 0.85, map: gm });
  const chrome = phys({ color: 0xb8b4aa, metalness: 1, roughness: 0.38, clearcoat: 0.2 });
  const body = rbox(4.3, 0.62, 1.85, 0.3, paint, 0, 0, 0, g, 4); body.rotation.z = R(-0.02, 0.02);
  const nose = sph(0.5, rnd() < 0.3 ? primer : paint, 2.0, -0.02, 0, g, 24); nose.scale.set(1.2, 0.56, 1.75);
  rbox(0.6, 0.3, 0.02, 0.02, primer, R(-1, 1), 0.02, 0.93, g, 1); // patched panel
  const cab = new THREE.Mesh(new THREE.SphereGeometry(0.85, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), phys({ color: 0x2a3a3c, roughness: 0.22, metalness: 0.2, transparent: true, opacity: 0.9, clearcoat: 0.4, envMapIntensity: 1.2 })); cab.scale.set(1.5, 0.62, 0.95); cab.position.set(-0.15, 0.25, 0); cab.userData.noCast = true; g.add(cab);
  rbox(4.4, 0.05, 1.9, 0.02, chrome, 0, -0.12, 0, g, 1); rbox(0.5, 0.08, 1.7, 0.03, chrome, 2.05, 0.05, 0, g, 1);
  const oddFin = rnd() < 0.5 ? (rnd() < 0.5 ? -1 : 1) : 0;
  [-1, 1].forEach((sd) => { const fin = rbox(1.2, 0.55, 0.06, 0.03, sd === oddFin ? primer : paint, -1.7, 0.4, sd * 0.78, g, 2); fin.rotation.z = -0.55; const pod = cyl(0.17, 0.2, 0.7, chrome, -2.15, -0.05, sd * 0.62, g, 16); pod.rotation.z = Math.PI / 2; const tl = cyl(0.13, 0.13, 0.04, basic({ color: 0xff2a50 }), -2.52, -0.05, sd * 0.62, g, 16); tl.rotation.z = Math.PI / 2; tl.userData.noCast = true; const hl = sph(0.1, basic({ color: 0xfff1c0 }), 2.45, 0.02, sd * 0.55, g, 10); hl.userData.noCast = true; });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.17, 1.1, 12, 1, true), basic({ color: 0xff8a40, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); flame.rotation.z = Math.PI / 2; flame.position.x = -3.0; flame.userData.noCast = true; g.add(flame);
  const fg = glow(0xff8a40, 1.6, 0.25); fg.position.set(-2.9, 0, 0); g.add(fg);
  const smoke = []; for (let k = 0; k < 7; k++) { const p = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x6a6460, transparent: true, opacity: 0, depthWrite: false })); p.userData.noCast = true; p.userData.k = k / 7; g.add(p); smoke.push(p); }
  g.traverse((o) => { if (o.isMesh && !o.userData.noCast && !o.material.transparent) o.castShadow = true; });
  return { g, flame, fg, smoke };
}


/* ---------- video look: the pool pod. Hull walls with portholes onto a hazy dusk, blue banquettes, a pink cove, a cyan ring light ---------- */
function videoPod(PD, dR, DECK, PRX, PRZ, up) {
  const HW = 2.9, top = DECK + HW, N = 8;
  // inner wall, painted in one pass: worn panels, portholes onto a dusky landscape, little cyan lamps, two glowing screens
  const [ic, ig] = cnv(2048, 320); ig.fillStyle = '#26303a'; ig.fillRect(0, 0, 2048, 320);
  for (let x = 0; x < 2048; x += 128) { ig.fillStyle = 'rgba(0,0,0,.35)'; ig.fillRect(x, 0, 3, 320); ig.fillStyle = 'rgba(255,255,255,.04)'; ig.fillRect(x + 3, 0, 2, 320); }
  ig.fillStyle = '#1c2228'; ig.fillRect(0, 250, 2048, 70); ig.fillStyle = 'rgba(255,255,255,.06)'; ig.fillRect(0, 250, 2048, 3);
  for (let i = 0; i < 26; i++) blotch(ig, R(0, 2048), R(0, 320), R(30, 90), 'rgba(60,40,30,A)', R(0.1, 0.3));
  const rrect = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); };
  for (let k = 0; k < N; k++) { const cx = (k + 0.5) * (2048 / N), w = 150, h = 130, x = cx - w / 2, y = 62;
    if (k % 4 === 1) { ig.fillStyle = '#0c1018'; rrect(ig, cx - 70, 70, 140, 96, 10); ig.fill(); for (let q = 0; q < 70; q++) { ig.fillStyle = pick(['#ff5fd8', '#5fe8ff', '#ffd27a', '#3a5aff']); ig.globalAlpha = R(0.4, 0.9); ig.fillRect(cx - 62 + R(0, 124), 78 + R(0, 80), R(2, 9), R(2, 5)); } ig.globalAlpha = 1; ig.strokeStyle = '#8a8278'; ig.lineWidth = 6; rrect(ig, cx - 70, 70, 140, 96, 10); ig.stroke(); continue; }
    ig.fillStyle = '#8a8278'; rrect(ig, x - 10, y - 10, w + 20, h + 20, 40); ig.fill(); ig.fillStyle = '#5a544e'; rrect(ig, x - 4, y - 4, w + 8, h + 8, 36); ig.fill();
    ig.save(); rrect(ig, x, y, w, h, 34); ig.clip(); const sky = ig.createLinearGradient(0, y, 0, y + h); sky.addColorStop(0, '#f6dcc8'); sky.addColorStop(0.55, '#e8b8a0'); sky.addColorStop(1, '#a87870'); ig.fillStyle = sky; ig.fillRect(x, y, w, h);
    ig.fillStyle = 'rgba(120,80,84,.8)'; ig.beginPath(); ig.moveTo(x, y + h); for (let q = 0; q <= 10; q++) ig.lineTo(x + (q / 10) * w, y + h * 0.62 + Math.sin(q * 1.7 + k) * 12 + R(-4, 4)); ig.lineTo(x + w, y + h); ig.fill(); ig.restore();
    [cx - 108, cx + 108].forEach((lx) => { const gr = ig.createRadialGradient(lx, 120, 2, lx, 120, 22); gr.addColorStop(0, '#e8ffff'); gr.addColorStop(0.45, '#5fe8ff'); gr.addColorStop(1, 'rgba(95,232,255,0)'); ig.fillStyle = gr; ig.fillRect(lx - 22, 98, 44, 44); }); }
  grime(ig, 2048, 320, 0.25);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(dR, dR, HW, 96, 1, true), basic({ map: toTex(ic), side: THREE.BackSide, color: 0xd8d8d8 })); inner.position.y = DECK + HW / 2; PD.add(inner);
  // outer hull: white panels, the same portholes glowing warm
  const [oc, og] = cnv(2048, 320); og.fillStyle = '#dcdde2'; og.fillRect(0, 0, 2048, 320); for (let x = 0; x < 2048; x += 128) { og.fillStyle = 'rgba(0,0,0,.12)'; og.fillRect(x, 0, 2, 320); } og.fillStyle = 'rgba(0,0,0,.1)'; og.fillRect(0, 40, 2048, 2); og.fillRect(0, 250, 2048, 2);
  for (let k = 0; k < N; k++) { if (k % 4 === 1) continue; const cx = 2048 - (k + 0.5) * (2048 / N); og.fillStyle = '#a8a8b0'; rrect(og, cx - 85, 52, 170, 150, 44); og.fill(); const gl = og.createLinearGradient(0, 62, 0, 192); gl.addColorStop(0, '#ffe2c4'); gl.addColorStop(1, '#ff9ac8'); og.fillStyle = gl; rrect(og, cx - 75, 62, 150, 130, 34); og.fill(); }
  grime(og, 2048, 320, 0.3);
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(dR + 0.06, dR + 0.06, HW, 96, 1, true), std({ map: toTex(oc), roughness: 0.45, metalness: 0.25, emissive: 0x2a1a20, emissiveIntensity: 0.4 })); hull.position.y = DECK + HW / 2; PD.add(hull);
  // roof: a shallow cap, white outside, dark inside
  const RR = 12, th = Math.asin((dR + 0.06) / RR), capY = top - RR * Math.cos(th);
  const capO = new THREE.Mesh(new THREE.SphereGeometry(RR, 96, 10, 0, Math.PI * 2, 0, th), std({ color: 0xd8d9de, roughness: 0.5, metalness: 0.25 })); capO.position.y = capY; PD.add(capO);
  const capI = new THREE.Mesh(new THREE.SphereGeometry(RR - 0.04, 96, 10, 0, Math.PI * 2, 0, th), basic({ color: 0x1e2228, side: THREE.BackSide })); capI.position.y = capY; PD.add(capI);
  const steelR = phys({ color: 0xc8c8d0, metalness: 1, roughness: 0.25 }); torus(dR + 0.07, 0.07, steelR, 0, top, 0, PD, 128).rotation.x = Math.PI / 2; torus(dR + 0.07, 0.06, steelR, 0, DECK + 0.02, 0, PD, 128).rotation.x = Math.PI / 2;
  // pink neon cove round the top of the wall, with a wash; the cyan ring light hanging under the roof
  const pink = basic({ color: 0xff5fd8 }), cyan = basic({ color: 0x6af0ff });
  torus(dR - 0.08, 0.035, pink, 0, top - 0.08, 0, PD, 128).rotation.x = Math.PI / 2;
  { const wash = new THREE.Mesh(new THREE.CylinderGeometry(dR - 0.03, dR - 0.03, 0.9, 96, 1, true), basic({ map: (() => { const [wc, wg] = cnv(4, 64); const im = wg.createImageData(4, 64); for (let y = 0; y < 64; y++) { const a = Math.round(255 * Math.pow(1 - y / 63, 2.2)); for (let x = 0; x < 4; x++) { const i2 = (y * 4 + x) * 4; im.data[i2] = im.data[i2 + 1] = im.data[i2 + 2] = 255; im.data[i2 + 3] = a; } } wg.putImageData(im, 0, 0); const t = toTex(wc); t.flipY = true; return t; })(), color: 0xff5fd8, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide })); wash.position.y = top - 0.5; PD.add(wash); }
  const ringY = top + 0.95; [[1.7, 0.07], [1.05, 0.05], [0.55, 0.035]].forEach(([r, t]) => torus(r, t, cyan, 0, ringY - (1.7 - r) * 0.08, 0, PD, 96).rotation.x = Math.PI / 2);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.95, 64).rotateX(Math.PI / 2), basic({ color: 0x2a3440 })); disc.position.y = ringY + 0.08; PD.add(disc);
  [[0x6af0ff, 5.5, 0.2], [0xd8fbff, 1.8, 0.35]].forEach(([c, sz, op]) => { const gl = glow(c, sz, op); gl.position.y = ringY - 0.3; PD.add(gl); }); const gp = glow(0xff5fd8, 13, 0.07); gp.position.y = top - 0.8; PD.add(gp);
  // blue channel-tufted banquettes curving along the wall
  const vel = std({ color: 0x2f4c8c, roughness: 0.82 }), base = std({ color: 0x3a2a22, roughness: 0.6 });
  [[Math.PI * 0.5, 1.05], [Math.PI * 1.05, 0.9], [-0.05, 0.9]].forEach(([mid, span]) => { const n = 7; for (let k = 0; k < n; k++) { const a = mid - span / 2 + (k + 0.5) * (span / n), r = dR - 0.5, seg = new THREE.Group(); seg.position.set(Math.cos(a) * r, DECK, -Math.sin(a) * r); seg.rotation.y = a - Math.PI / 2; PD.add(seg);
    const L = r * (span / n) + 0.02; rbox(L, 0.36, 0.62, 0.07, vel, 0, 0.26, 0.02, seg, 2); rbox(L, 0.6, 0.2, 0.08, vel, 0, 0.66, -0.22, seg, 2); box(L, 0.08, 0.56, base, 0, 0.04, 0.0, seg); } });
  // a little table for two
  { const tg = new THREE.Group(); tg.position.set(-3.0, DECK, -3.0); PD.add(tg); cyl(0.05, 0.05, 0.72, steelR, 0, 0.36, 0, tg, 12); cyl(0.26, 0.3, 0.03, steelR, 0, 0.015, 0, tg, 24); cyl(0.42, 0.42, 0.035, std({ color: 0x8a7a6a, roughness: 0.35 }), 0, 0.74, 0, tg, 40);
    [[-0.62, 0], [0.62, 0]].forEach(([cx]) => { const c = new THREE.Group(); c.position.set(cx, 0, 0); c.rotation.y = cx < 0 ? Math.PI / 2 : -Math.PI / 2; tg.add(c); cyl(0.2, 0.2, 0.05, base, 0, 0.45, 0, c, 20); cyl(0.02, 0.02, 0.45, steelR, 0, 0.22, 0, c, 8); rbox(0.36, 0.3, 0.04, 0.02, base, 0, 0.65, -0.18, c, 2); });
    lathe([[0, 0], [0.03, 0], [0.035, 0.1], [0, 0.1]], phys({ color: 0xffffff, transparent: true, opacity: 0.4, roughness: 0.05 }), 0.1, 0.76, 0.05, tg, 14); }
  // a drain grate all round the pool's edge
  { const n = 110, gr = new THREE.InstancedMesh(new THREE.BoxGeometry(0.014, 0.012, 0.16), std({ color: 0x5a5a62, roughness: 0.4, metalness: 0.7 }), n), o = new THREE.Object3D(); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, x = Math.cos(a) * (PRX + 0.32), z = Math.sin(a) * (PRZ + 0.32); o.position.set(x, DECK + 0.008, z); o.rotation.y = -Math.atan2(z / (PRZ * PRZ), x / (PRX * PRX)); o.updateMatrix(); gr.setMatrixAt(k, o.matrix); } PD.add(gr); }
  hull.userData.go = 'pool'; return hull;
}

/* ---------- pool bits ---------- */
let _chrome = null; function chromeM() { return _chrome || (_chrome = phys({ color: 0xe8e8ea, roughness: 0.12, metalness: 1, clearcoat: 1 })); }
// periodic worley edges, the bright web light makes on the bottom of a pool
function causticTex() {
  const S = 160, [c, g] = cnv(S, S), im = g.createImageData(S, S), d = im.data, pts = [];
  for (let i = 0; i < 16; i++) pts.push([R(0, S), R(0, S)]);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let f1 = 1e9, f2 = 1e9;
    for (const [px, py] of pts) for (let oy = -S; oy <= S; oy += S) for (let ox = -S; ox <= S; ox += S) { const dd = Math.hypot(x - px - ox, y - py - oy); if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) f2 = dd; }
    const e = f2 - f1, v = Math.pow(clamp(1 - e / 9, 0, 1), 2.6), i = (y * S + x) * 4;
    d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.max(0, Math.min(255, v * 255 + Math.random() - 0.5));
  }
  g.putImageData(im, 0, 0); return toTex(c, [1, 1]);
}
// small wind ripples for the water surface
function rippleTex() {
  const S = 128, h = new Float32Array(S * S);
  const waves = []; for (let i = 0; i < 9; i++) { const kx = RI(-5, 5), ky = RI(1, 6) * (rnd() < 0.5 ? -1 : 1); waves.push([kx, ky, R(0, 6.28), R(0.4, 1) / Math.hypot(kx, ky)]); }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { let v = 0; for (const [kx, ky, ph, a] of waves) v += Math.sin(((x * kx + y * ky) / S) * Math.PI * 2 + ph) * a; h[y * S + x] = v; }
  const [c, g] = cnv(S, S), im = g.createImageData(S, S), d = im.data, H = (x, y) => h[((y + S) % S) * S + ((x + S) % S)];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const dx = (H(x + 1, y) - H(x - 1, y)) * 1.6, dy = (H(x, y + 1) - H(x, y - 1)) * 1.6, l = Math.hypot(dx, dy, 1), i = (y * S + x) * 4; d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255; }
  g.putImageData(im, 0, 0); return toTex(c, [1, 1], false);
}
// an empty striped lounger float, drifting on its own
function floatie() {
  const g = new THREE.Group();
  const pink = phys({ color: 0xff7aae, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12 }), white = phys({ color: 0xfff3ea, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12 });
  const L = 1.95, W = 0.82;
  for (let i = 0; i < 5; i++) { const tb = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, L - 0.16, 6, 18), i % 2 ? white : pink); tb.rotation.x = Math.PI / 2; tb.position.set(-W / 2 + 0.085 + (i * (W - 0.17)) / 4, 0.055, 0); g.add(tb); }
  const pil = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, W - 0.22, 6, 18), pink); pil.rotation.z = Math.PI / 2; pil.position.set(0, 0.15, -L / 2 + 0.13); g.add(pil);
  // valve and seams
  cyl(0.018, 0.018, 0.02, white, W / 2 - 0.085, 0.135, L / 2 - 0.25, g, 10);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { g };
}

/* ---------- casino & bar: glass tube tower on a saucer-roofed pavilion, flat cap, 777 topper, low annex with the sign ---------- */
function casinoTower(m, hot, up, M) {
  const C = new THREE.Group(); C.position.set(-33.6, 0, -1.3); C.rotation.y = 0.85; m.add(C);
  const white = std({ color: 0xe9e4da, roughness: 0.55 }), steelM = phys({ color: 0xc9ccd0, roughness: 0.25, metalness: 0.9 }), darkM2 = std({ color: 0x1b1922, roughness: 0.45, metalness: 0.4 });
  const glassM = phys({ color: 0xffe2cc, roughness: 0.04, transparent: true, opacity: 0.16, envMapIntensity: 2.4, depthWrite: false, side: THREE.DoubleSide });
  const hits = [];
  // pavilion: glass drum with slot machines glowing inside
  const PR = 3.4, PH = 3.0;
  const [sc, sg] = cnv(1024, 256); sg.fillStyle = '#3a0e26'; sg.fillRect(0, 0, 1024, 256);
  for (let k = 0; k < 14; k++) { const x = 12 + k * 72; sg.fillStyle = pick(['#ff4a6a', '#ffb43a', '#4ad0ff', '#c86aff']); sg.globalAlpha = 0.85; sg.fillRect(x, 70, 54, 186); sg.globalAlpha = 1; sg.fillStyle = '#fff4d0'; sg.fillRect(x + 8, 110, 38, 26); sg.fillStyle = '#ffe9a0'; sg.beginPath(); sg.arc(x + 27, 50, 14, 0, 7); sg.fill(); }
  sg.fillStyle = 'rgba(255,190,120,.25)'; sg.fillRect(0, 0, 1024, 40);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(PR - 0.25, PR - 0.25, PH - 0.2, 40, 1, true), basic({ map: toTex(sc, [2, 1]), side: THREE.BackSide })); inner.position.y = PH / 2; inner.userData.noCast = true; C.add(inner); hits.push(inner);
  const flo = new THREE.Mesh(new THREE.CircleGeometry(PR - 0.2, 40).rotateX(-Math.PI / 2), std({ color: 0x4a1a2a, roughness: 0.9 })); flo.position.y = 0.17; C.add(flo);
  cyl(PR + 0.15, PR + 0.3, 0.16, std({ color: 0x8a847c, roughness: 1 }), 0, 0.08, 0, C, 48);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(PR, PR, PH - 0.16, 48, 1, true), glassM); drum.position.y = PH / 2 + 0.08; drum.userData.noCast = true; C.add(drum); hits.push(drum);
  for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2, mu = box(0.07, PH - 0.16, 0.12, steelM, Math.cos(a) * PR, PH / 2 + 0.08, Math.sin(a) * PR, C); mu.rotation.y = -a; }
  const inL = new THREE.PointLight(0xff7a5a, LOW ? 10 : 14, 11, 1.6); inL.position.set(0, 2.2, 0); C.add(inL);
  // saucer roof with a violet underglow
  lathe([[0, PH], [PR + 1.7, PH], [PR + 1.95, PH + 0.16], [PR + 1.85, PH + 0.36], [PR + 0.6, PH + 0.55], [0, PH + 0.6]], white, 0, 0, 0, C, 64);
  const ug = torus(PR + 1.6, 0.05, basic({ color: 0xa868ff }), 0, PH - 0.02, 0, C, 96); ug.rotation.x = Math.PI / 2; ug.userData.noCast = true;
  const ugl = spill(0xa060ff, (PR + 3) * 2.2, (PR + 3) * 2.2, 0.16); ugl.position.y = 0.2; C.add(ugl);
  // doors under a little canopy
  const ent = new THREE.Group(); ent.position.set(0, 0, PR); C.add(ent);
  rbox(2.2, 0.12, 1.4, 0.04, white, 0, 2.55, 0.55, ent, 2); [-0.95, 0.95].forEach((x) => cyl(0.04, 0.04, 2.5, steelM, x, 1.27, 1.15, ent, 10));
  const dq = quad(1.6, 2.2, phys({ color: 0xffe0c0, roughness: 0.05, transparent: true, opacity: 0.25, depthWrite: false }), 0, 1.25, 0.05, ent); dq.userData.noCast = true; hits.push(dq);
  box(0.04, 2.2, 0.06, steelM, 0, 1.25, 0.06, ent); [-0.25, 0.25].forEach((x) => box(0.02, 0.5, 0.05, phys({ color: 0xc9a24a, metalness: 0.9, roughness: 0.3 }), x, 1.15, 0.12, ent));
  // the tower: a round glass tube, mullions and rings, a glowing core of rising light
  const TY0 = PH + 0.55, TH = 12.5, TR = 1.55;
  const [lc, lg] = cnv(256, 512); lg.fillStyle = '#4a22b8'; lg.fillRect(0, 0, 256, 512);
  for (let y = 0; y < 512; y++) { const k = y / 512, r = Math.round(74 + 110 * Math.sin(k * Math.PI)), gg = Math.round(34 + 30 * k), bb = 220; lg.fillStyle = `rgb(${r},${gg},${bb})`; lg.fillRect(0, y, 256, 1); }
  for (let i = 0; i < 90; i++) { lg.fillStyle = `rgba(255,255,255,${R(0.08, 0.35)})`; lg.beginPath(); lg.arc(R(4, 252), R(0, 512), R(1.5, 5), 0, 7); lg.fill(); }
  const colTex = toTex(lc, [2, 2]); const core = new THREE.Mesh(new THREE.CylinderGeometry(TR - 0.35, TR - 0.35, TH - 0.3, 32, 1, true), basic({ map: colTex })); core.position.y = TY0 + TH / 2; core.userData.noCast = true; C.add(core); hits.push(core);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(TR, TR, TH, 40, 1, true), glassM); tube.position.y = TY0 + TH / 2; tube.userData.noCast = true; C.add(tube); hits.push(tube);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.26, mu = rbox(0.12, TH, 0.12, 0.04, white, Math.cos(a) * TR, TY0 + TH / 2, Math.sin(a) * TR, C, 1); mu.rotation.y = -a; }
  [TY0 + 0.15, TY0 + TH * 0.5, TY0 + TH - 0.15].forEach((y) => { const r = torus(TR + 0.03, 0.09, white, 0, y, 0, C, 48); r.rotation.x = Math.PI / 2; });
  up.push((t) => { colTex.offset.y = -t * 0.05; });
  // flat cap with violet underglow
  const capY = TY0 + TH;
  cyl(2.7, 2.5, 0.55, white, 0, capY + 0.27, 0, C, 56);
  const cr = torus(2.55, 0.05, basic({ color: 0xa868ff }), 0, capY + 0.02, 0, C, 80); cr.rotation.x = Math.PI / 2; cr.userData.noCast = true;
  // 777 slot sign on top, chaser bulbs
  const top = new THREE.Group(); top.position.set(0, capY + 1.35, 0); C.add(top);
  rbox(2.9, 1.25, 0.5, 0.06, std({ color: 0x5a0f1a, roughness: 0.45, metalness: 0.3 }), 0, 0, 0, top, 2);
  const [rc, rg] = cnv(512, 220); rg.fillStyle = '#5a0f1a'; rg.fillRect(0, 0, 512, 220);
  for (let k = 0; k < 3; k++) { const x = 40 + k * 152; rg.fillStyle = '#f6efe0'; rg.fillRect(x, 30, 128, 160); rg.fillStyle = 'rgba(0,0,0,.15)'; rg.fillRect(x, 30, 128, 22); rg.fillRect(x, 168, 128, 22); rg.fillStyle = '#c0182a'; rg.font = '150px "Bebas Neue"'; rg.textAlign = 'center'; rg.textBaseline = 'middle'; rg.fillText('7', x + 64, 116); }
  [0.26, -0.26].forEach((z, i) => { const q = quad(2.6, 1.1, basic({ map: toTex(rc), color: 0xe6e6e6 }), 0, 0, z, top); if (i) q.rotation.y = Math.PI; q.userData.noCast = true; hits.push(q); });
  const bulbs = []; for (let k = 0; k < 26; k++) { const a = (k / 26) * Math.PI * 2, bb = sph(0.045, basic({ color: 0xffd9a0 }), Math.cos(a) * 1.5, Math.sin(a) * 0.68, 0.27, top, 8); bb.userData.noCast = true; bulbs.push(bb); }
  up.push((t) => bulbs.forEach((bb, k) => bb.material.color.setHex((Math.floor(t * 7) + k) % 3 === 0 ? 0xfff2c0 : 0x7a4a2a)));
  cyl(0.06, 0.06, 0.6, steelM, -0.9, -0.85, 0, top, 8); cyl(0.06, 0.06, 0.6, steelM, 0.9, -0.85, 0, top, 8);
  // low annex beside it, CASINO & BAR across the front
  const AX = new THREE.Group(); AX.position.set(6.2, 0, 1.1); C.add(AX);
  rbox(7.0, 3.0, 4.2, 0.05, white, 0, 1.5, 0, AX, 2); rbox(7.3, 0.3, 4.5, 0.05, white, 0, 3.12, 0, AX, 2);
  rbox(7.1, 0.5, 4.36, 0.02, darkM2, 0, 2.45, 0, AX, 1);
  const [wc, wg] = cnv(512, 128); wg.fillStyle = '#2a0c1c'; wg.fillRect(0, 0, 512, 128); for (let k = 0; k < 8; k++) { wg.fillStyle = pick(['#ffb46a', '#ff7a8a', '#ffd890']); wg.globalAlpha = R(0.55, 0.9); wg.fillRect(8 + k * 63, 18, 50, 110); } wg.globalAlpha = 1;
  const aw = quad(6.4, 1.5, basic({ map: toTex(wc), color: 0xd8d8d8 }), 0, 1.1, 2.16, AX); aw.userData.noCast = true; hits.push(aw);
  for (let k = 0; k <= 4; k++) box(0.06, 1.6, 0.08, steelM, -3.2 + k * 1.6, 1.1, 2.18, AX);
  const [nc, ng] = cnv(1024, 200); neonText(ng, 'CASINO & BAR', 512, 102, '150px "Bebas Neue"', '#ff5fd8', 10);
  const nq = neonQuad(nc, 5.6, 1.1, 1.05); nq.position.set(0, 2.45, 2.27); AX.add(nq); hits.push(nq);
  const aL = new THREE.PointLight(0xff60c0, LOW ? 6 : 8, 8, 1.6); aL.position.set(0, 2.2, 3.4); AX.add(aL);
  hits.forEach((o) => { o.userData.go = 'casino'; hot.push(o); });
  C.updateMatrix(); const door = new THREE.Vector3(0, 1.3, PR + 0.4).applyMatrix4(C.matrix);
  return { door, front: new THREE.Vector3(Math.sin(0.85), 0, Math.cos(0.85)) };
}
