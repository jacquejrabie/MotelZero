// space.js — sky, moons, stars, the asteroid and the parking lot on top of it.
import * as THREE from 'three';
import { LOW, R, RI, rnd, pick, clamp, lerp, fbm, vnoise, cnv, toTex, blotch, speckle, std, basic, asphaltTex, concreteTex, texMat, heightToNormal, softTex } from './kit.js';

export const LOT_R = 42;
export const PLATEAU = -2.2;
// draw a canvas at half size (big textures on phones)
function half(c) { const o = document.createElement('canvas'); o.width = c.width >> 1; o.height = c.height >> 1; const g = o.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, o.width, o.height); return o; }
export const RAMP = { x0: -12, x1: 1, z0: 10.4, z1: 15.6, zc: 13, bottom: -2.2 };
export const RWY = { x0: -46, x1: -12, z: 13, y: 1.4 };

export function buildSpace(scene, world) {
  const up = []; const out = { up };

  /* ---- lights ---- */
  const hemi = new THREE.HemisphereLight(0x8a8cb4, 0x2a2228, 1.0); scene.add(hemi); out.hemi = hemi;
  // intro-only lights: a hard raking key from the right and a violet rim from behind, faded out on check-in
  const key = new THREE.DirectionalLight(0xfff1e2, 0); key.position.set(330, 40, 150); scene.add(key);
  const rimL = new THREE.DirectionalLight(0x9a84ff, 0); rimL.position.set(-240, 60, -330); scene.add(rimL);
  out.introLights = [{ l: key, i: 3.4 }, { l: rimL, i: 2.2 }, { l: hemi, i: 0.42, base: 1.0 }];
  const moon = new THREE.DirectionalLight(0xb8c4ff, 2.3); moon.position.set(-44, 72, 58); scene.add(moon); scene.add(moon.target);
  moon.castShadow = true; moon.shadow.mapSize.set(LOW ? 1024 : 2048, LOW ? 1024 : 2048);
  Object.assign(moon.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 1, far: 240 }); moon.shadow.bias = -0.0005; moon.shadow.normalBias = 0.05; moon.shadow.radius = 3;
  const fill = new THREE.DirectionalLight(0xd8c8e8, 0.55); fill.position.set(70, 30, -60); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xff9a6a, 0.35); rim.position.set(80, 20, -90); scene.add(rim);

  /* ---- sky dome ---- */
  (function sky() {
    // painted per pixel from 3D noise on the view direction: seamless, no pole pinch, and no canvas-gradient dither (that was the grid)
    const W = LOW ? 1024 : 2048, H = W / 2, NW = LOW ? 256 : 512, NH = NW / 2;
    const dens = new Float32Array(NW * NH), hueF = new Float32Array(NW * NH), dustF = new Float32Array(NW * NH), bandF = new Float32Array(NW * NH);
    const bn = new THREE.Vector3(0.28, 0.9, 0.33).normalize();
    for (let j = 0; j < NH; j++) {
      const lat = (0.5 - (j + 0.5) / NH) * Math.PI, cy = Math.cos(lat), sy = Math.sin(lat);
      for (let i = 0; i < NW; i++) {
        const lon = ((i + 0.5) / NW) * Math.PI * 2, x = -cy * Math.cos(lon), y = sy, z = cy * Math.sin(lon), k = j * NW + i;
        const bd = x * bn.x + y * bn.y + z * bn.z, band = Math.exp(-(bd * bd) / 0.045);
        const w = fbm(x * 1.6 + 3.1, y * 1.6, z * 1.6, 2);
        const n = fbm(x * 2.8 + w * 1.5, y * 2.8 - w, z * 2.8 + 7.7, 5);
        dens[k] = Math.pow(clamp((n - 0.36) * 2.1, 0, 1), 1.8) * (0.14 + band * 0.9);
        hueF[k] = fbm(x * 1.2 + 11, y * 1.2, z * 1.2, 2);
        dustF[k] = clamp((fbm(x * 5.5, y * 5.5 + 4, z * 5.5, 3) - 0.47) * 3.4, 0, 1) * band;
        bandF[k] = band;
      }
    }
    const samp = (A, u, v) => { u = ((u % NW) + NW) % NW; v = clamp(v, 0, NH - 1.001); const i0 = Math.floor(u), j0 = Math.floor(v), fu = u - i0, fv = v - j0, i1 = (i0 + 1) % NW, j1 = Math.min(NH - 1, j0 + 1);
      return (A[j0 * NW + i0] * (1 - fu) + A[j0 * NW + i1] * fu) * (1 - fv) + (A[j1 * NW + i0] * (1 - fu) + A[j1 * NW + i1] * fu) * fv; };
    const pal = [[92, 64, 196], [44, 128, 168], [176, 62, 134], [214, 128, 92]];
    const [c, g] = cnv(W, H), im = g.createImageData(W, H), d = im.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = ((x + 0.5) / W) * NW - 0.5, v = ((y + 0.5) / H) * NH - 0.5;
      const den = samp(dens, u, v), hu = samp(hueF, u, v), du = samp(dustF, u, v), ba = samp(bandF, u, v);
      const t = clamp((hu - 0.3) * 2.4, 0, 0.999) * 3, ix = Math.floor(t), f = t - ix, p0 = pal[ix], p1 = pal[Math.min(3, ix + 1)];
      const inten = den * 0.34 * (1 - du * 0.9), milk = ba * 0.05 * (1 - du * 0.8), i = (y * W + x) * 4;
      d[i] = 4 + (p0[0] + (p1[0] - p0[0]) * f) * inten + 150 * milk + Math.random() - 0.5;
      d[i + 1] = 3 + (p0[1] + (p1[1] - p0[1]) * f) * inten + 140 * milk + Math.random() - 0.5;
      d[i + 2] = 10 + (p0[2] + (p1[2] - p0[2]) * f) * inten + 190 * milk + Math.random() - 0.5; d[i + 3] = 255;
    }
    // faint stars baked in, denser along the band
    for (let n = 0; n < (LOW ? 4000 : 9000); n++) {
      const x = RI(0, W - 1), y = RI(0, H - 1), ba = samp(bandF, ((x + 0.5) / W) * NW - 0.5, ((y + 0.5) / H) * NH - 0.5); if (rnd() > 0.35 + ba) continue;
      const a = R(0.08, 0.5) * (rnd() < 0.04 ? 2 : 1), i = (y * W + x) * 4, tint = pick([[1, 1, 1], [0.8, 0.86, 1], [1, 0.9, 0.8]]);
      d[i] = Math.min(255, d[i] + 255 * a * tint[0]); d[i + 1] = Math.min(255, d[i + 1] + 255 * a * tint[1]); d[i + 2] = Math.min(255, d[i + 2] + 255 * a * tint[2]);
    }
    g.putImageData(im, 0, 0);
    const m = new THREE.Mesh(new THREE.SphereGeometry(3200, 64, 32), new THREE.MeshBasicMaterial({ map: toTex(c), side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false }));
    m.renderOrder = -10; scene.add(m);
    const mkStars = (n, size, op, rmin, rmax) => {
      const p = new Float32Array(n * 3), col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const v = new THREE.Vector3(R(-1, 1), R(-1, 1), R(-1, 1)).normalize().multiplyScalar(R(rmin, rmax)); p.set([v.x, v.y, v.z], i * 3); const tint = pick([[1, 1, 1], [0.8, 0.85, 1], [1, 0.9, 0.78], [1, 0.8, 0.9], [0.9, 1, 1]]); col.set(tint, i * 3); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, opacity: op, depthWrite: false, toneMapped: false }));
      scene.add(pts); return pts;
    };
    mkStars(4200, 1.4, 0.9, 1800, 2800); const mid = mkStars(420, 2.4, 0.9, 1800, 2800); const big = mkStars(36, 3.6, 1, 1800, 2800);
    up.push((t) => { mid.material.opacity = 0.75 + Math.sin(t * 1.7) * 0.15; big.material.opacity = 0.8 + Math.sin(t * 2.3 + 1) * 0.2; });
    // shooting star now and then
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(60, 1.2), basic({ color: 0xffffff, transparent: true, opacity: 0, fog: false, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(streak);
    let next = 6, life = 0; const dir = new THREE.Vector3();
    up.push((t, dt) => { if (life > 0) { life -= dt; streak.position.addScaledVector(dir, dt * 900); streak.material.opacity = Math.min(1, life * 2) * 0.8; if (life <= 0) streak.material.opacity = 0; } else if (t > next) { next = t + R(7, 20); life = 0.7; streak.position.set(R(-1200, 1200), R(500, 1100), -2200); dir.set(R(-0.6, 0.6), -0.7, 0).normalize(); streak.lookAt(streak.position.clone().add(new THREE.Vector3(0, 0, 1))); streak.rotation.z = Math.atan2(dir.y, dir.x); } });
  })();

  /* ---- big cratered moon + small one ---- */
  (function moons() {
    const W = 2048, H = 1024, [c, g] = cnv(W, H), [hc, hg] = cnv(1024, 512);
    g.fillStyle = '#b4b0aa'; g.fillRect(0, 0, W, H); hg.fillStyle = '#808080'; hg.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 70; i++) blotch(g, R(0, W), R(H * 0.15, H * 0.85), R(80, 260), 'rgba(70,68,74,A)', R(0.06, 0.16)); // maria
    for (let i = 0; i < 90; i++) blotch(g, R(0, W), R(0, H), R(40, 160), 'rgba(225,220,212,A)', R(0.03, 0.08)); // highlands
    speckle(g, W, H, 60000, 0.12, ['#000', '#fff', '#8a8680']);
    const crater = (x, y, r, a) => {
      // soft bowl, lit rim on the upper-left, shadowed lip on the lower-right
      const bg = g.createRadialGradient(x + r * 0.15, y + r * 0.15, 0, x, y, r); bg.addColorStop(0, `rgba(60,58,62,${a * 0.5})`); bg.addColorStop(0.8, `rgba(80,78,82,${a * 0.35})`); bg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = bg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.lineWidth = Math.max(0.8, r * 0.14); g.strokeStyle = `rgba(240,236,228,${a * 0.75})`; g.beginPath(); g.arc(x, y, r * 0.95, Math.PI * 0.15, Math.PI * 1.05); g.stroke();
      g.strokeStyle = `rgba(40,38,42,${a * 0.6})`; g.beginPath(); g.arc(x, y, r * 0.9, Math.PI * 1.15, Math.PI * 2.05); g.stroke();
      const hx = x / 2, hy = y / 2, hr = r / 2; const hb = hg.createRadialGradient(hx, hy, 0, hx, hy, hr * 1.15); hb.addColorStop(0, '#5a5a5a'); hb.addColorStop(0.78, '#6e6e6e'); hb.addColorStop(0.9, '#b0b0b0'); hb.addColorStop(1, 'rgba(128,128,128,0)'); hg.fillStyle = hb; hg.beginPath(); hg.arc(hx, hy, hr * 1.15, 0, 7); hg.fill();
    };
    for (let i = 0; i < 1400; i++) crater(R(0, W), R(H * 0.06, H * 0.94), R(1.5, 7), R(0.25, 0.6));
    for (let i = 0; i < 160; i++) crater(R(0, W), R(H * 0.1, H * 0.9), R(8, 22), R(0.25, 0.5));
    for (let i = 0; i < 14; i++) crater(R(0, W), R(H * 0.15, H * 0.85), R(26, 60), R(0.2, 0.35));
    for (let k = 0; k < 3; k++) { const x = R(0, W), y = R(H * 0.25, H * 0.75); g.strokeStyle = 'rgba(245,242,235,.05)'; for (let i = 0; i < 40; i++) { const a = R(0, Math.PI * 2), l = R(60, 260); g.lineWidth = R(1, 4); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.6); g.stroke(); } crater(x, y, R(10, 16), 0.7); }
    const mat = std({ map: toTex(LOW ? half(c) : c), normalMap: toTex(heightToNormal(hc, 2.4), null, false), normalScale: new THREE.Vector2(0.9, 0.9), roughness: 1, fog: false });
    // the big moon is a soft-focus billboard: shaded disc painted from the moon texture, then blurred by down/up sampling
    const D = 1024, [dc, dg] = cnv(D, D), cx = D / 2, rr = D * 0.4;
    dg.save(); dg.beginPath(); dg.arc(cx, cx, rr, 0, 7); dg.clip(); dg.drawImage(c, W * 0.18, 0, W * 0.5, H, cx - rr * 1.35, cx - rr, rr * 2.7, rr * 2);
    const sh = dg.createRadialGradient(cx - rr * 0.45, cx - rr * 0.4, rr * 0.1, cx + rr * 0.1, cx + rr * 0.1, rr * 1.25); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.55, 'rgba(10,8,20,.15)'); sh.addColorStop(0.85, 'rgba(10,8,20,.62)'); sh.addColorStop(1, 'rgba(6,4,14,.9)'); dg.fillStyle = sh; dg.fillRect(0, 0, D, D);
    const tint = dg.createLinearGradient(0, 0, D, D); tint.addColorStop(0, 'rgba(190,200,255,.12)'); tint.addColorStop(1, 'rgba(120,80,170,.18)'); dg.fillStyle = tint; dg.fillRect(0, 0, D, D); dg.restore();
    const [sc1, sg1] = cnv(176, 176); sg1.imageSmoothingQuality = 'high'; sg1.drawImage(dc, 0, 0, 176, 176);
    const [fc, fg] = cnv(D, D); fg.imageSmoothingEnabled = true; fg.imageSmoothingQuality = 'high'; fg.drawImage(sc1, 0, 0, D, D);
    const big = new THREE.Sprite(new THREE.SpriteMaterial({ map: toTex(fc), transparent: true, depthWrite: false, fog: false, toneMapped: true, color: 0xd8d8e2 }));
    big.scale.setScalar(780); big.position.set(-1920, 38, -1374); scene.add(big); out.bigMoon = big;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex(256, (r) => (r < 0.55 ? 0.2 : 0.2 * Math.pow(1 - (r - 0.55) / 0.45, 2))), color: 0xbec8ff, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(1080); halo.position.copy(big.position); scene.add(halo); out.moonHalo = halo;
    const small = new THREE.Mesh(new THREE.SphereGeometry(62, 64, 32), std({ color: 0x9b98a8, roughness: 1, fog: false, map: mat.map, normalMap: mat.normalMap })); small.position.set(1100, 380, -1500); scene.add(small);
  })();

  /* ---- the asteroid ---- */
  (function asteroid() {
    const R0 = 74, CY = -49;
    const raw = new THREE.IcosahedronGeometry(1, LOW ? 4 : 5).attributes.position;
    const map = new Map(), idx = [], P = [];
    for (let i = 0; i < raw.count; i++) {
      const k = `${Math.round(raw.getX(i) * 1e4)},${Math.round(raw.getY(i) * 1e4)},${Math.round(raw.getZ(i) * 1e4)}`;
      let j = map.get(k); if (j === undefined) { j = P.length / 3; map.set(k, j); P.push(raw.getX(i), raw.getY(i), raw.getZ(i)); } idx.push(j);
    }
    const n = P.length / 3, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), v = new THREE.Vector3();
    // craters at three scales: bowl, flat-ish floor, sharp raised rim, bright ejecta on the fresh ones
    const craters = [];
    const addC = (cnt, r0, r1, k0, k1) => { for (let i = 0; i < cnt; i++) { const d = new THREE.Vector3(R(-1, 1), R(-1, 0.3), R(-1, 1)).normalize(), r = R(r0, r1); craters.push({ d, r, depth: r * R(k0, k1), fresh: rnd() < 0.28, cut: 2 - 2 * Math.cos(Math.min(1.5, r * 1.7)) }); } };
    addC(7, 0.2, 0.32, 0.3, 0.42); addC(40, 0.075, 0.15, 0.32, 0.46); addC(150, 0.03, 0.065, 0.28, 0.4);
    const ridge = (x, y, z) => 1 - Math.abs(fbm(x, y, z, 3) * 2 - 1);
    const cA = new THREE.Color(0x67625f), cB = new THREE.Color(0x9a948d), cC = new THREE.Color(0x2b2928), cE = new THREE.Color(0xb9b3aa), tmp = new THREE.Color();
    for (let i = 0; i < n; i++) {
      v.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]).normalize();
      const under = clamp(-v.y, 0, 1);
      let r = 1 + (0.2 + 0.16 * under) * (fbm(v.x * 1.15 + 5, v.y * 1.15, v.z * 1.15) - 0.5) + 0.1 * under * (fbm(v.x * 2.1 + 3, v.y * 2.1, v.z * 2.1) - 0.5) + 0.075 * (fbm(v.x * 3.4, v.y * 3.4, v.z * 3.4) - 0.5) + 0.035 * (ridge(v.x * 6.5, v.y * 6.5 + 2, v.z * 6.5) - 0.55) + 0.012 * (fbm(v.x * 19, v.y * 19, v.z * 19, 2) - 0.5);
      let dark = 0, ej = 0;
      for (const c of craters) {
        const dot = v.x * c.d.x + v.y * c.d.y + v.z * c.d.z, ch2 = 2 - 2 * dot; if (ch2 > c.cut) continue;
        const t = Math.sqrt(ch2) / c.r;
        if (t < 1) { const bowl = Math.max(t * t - 1, -0.78); r += c.depth * bowl; dark += 0.42 * (1 - t * 0.6); }
        const rim = Math.exp(-((t - 1) * (t - 1)) / 0.022); r += c.depth * 0.42 * rim;
        if (t >= 1 && t < 1.7) r += c.depth * 0.08 * (1 - (t - 1) / 0.7);
        if (c.fresh) ej += rim * 0.55 + (t > 1 && t < 2.4 ? 0.22 * (1 - (t - 1) / 1.4) : 0);
      }
      const p = v.clone().multiplyScalar(R0 * r); let wy = p.y + CY; let top = false;
      if (wy > PLATEAU - 0.2) { wy = PLATEAU - 0.2 - 0.3 * vnoise(p.x * 0.2, 3, p.z * 0.2) - 0.06 * vnoise(p.x * 1.5, 7, p.z * 1.5); top = true; }
      pos.set([p.x, wy, p.z], i * 3);
      const m1 = fbm(v.x * 2.2 + 9, v.y * 2.2, v.z * 2.2), m2 = fbm(v.x * 9, v.y * 9 + 4, v.z * 9, 3);
      tmp.copy(cA).lerp(cB, clamp((m1 - 0.42) * 2.6, 0, 1)).lerp(cC, clamp(dark + (0.5 - m2) * 0.9, 0, 0.8)).lerp(cE, clamp(ej, 0, 0.75));
      if (top) tmp.multiplyScalar(0.7 + 0.15 * vnoise(p.x * 0.4, 1, p.z * 0.4));
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const det = rockDetail(LOW ? 256 : 512);
    const mat = std({ vertexColors: true, roughness: 0.93 });
    // triplanar detail in object space (the world spins in the intro): small craters, grit and boulders far below the mesh resolution
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { tDN: { value: det.normal }, tDA: { value: det.albedo }, uS1: { value: 1 / 15 }, uS2: { value: 1 / 5.3 } });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON; varying vec3 vBX; varying vec3 vBY; varying vec3 vBZ;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position; vON = normal; vBX = normalize(normalMatrix * vec3(1.0, 0.0, 0.0)); vBY = normalize(normalMatrix * vec3(0.0, 1.0, 0.0)); vBZ = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        uniform sampler2D tDN; uniform sampler2D tDA; uniform float uS1; uniform float uS2;
        varying vec3 vOP; varying vec3 vON; varying vec3 vBX; varying vec3 vBY; varying vec3 vBZ;
        float triA(vec3 p, vec3 w, float s) { return texture2D(tDA, p.zy * s).r * w.x + texture2D(tDA, p.xz * s + 0.37).r * w.y + texture2D(tDA, p.xy * s + 0.71).r * w.z; }
        vec3 triN(vec3 p, vec3 n, vec3 w, float s) {
          vec3 tx = texture2D(tDN, p.zy * s).xyz * 2.0 - 1.0, ty = texture2D(tDN, p.xz * s + 0.37).xyz * 2.0 - 1.0, tz = texture2D(tDN, p.xy * s + 0.71).xyz * 2.0 - 1.0;
          tx = vec3(tx.xy + n.zy, abs(tx.z) * n.x); ty = vec3(ty.xy + n.xz, abs(ty.z) * n.y); tz = vec3(tz.xy + n.xy, abs(tz.z) * n.z);
          return normalize(tx.zyx * w.x + ty.xzy * w.y + tz.xyz * w.z);
        }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          vec3 oN = normalize(vON); vec3 tW = pow(abs(oN), vec3(5.0)); tW /= (tW.x + tW.y + tW.z);
          float dA = triA(vOP, tW, uS1);
          diffuseColor.rgb *= 0.5 + dA;`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          { vec3 n1 = triN(vOP, oN, tW, uS1); normal = normalize(vBX * n1.x + vBY * n1.y + vBZ * n1.z); }`);
    };
    const rock = new THREE.Mesh(geo, mat); rock.receiveShadow = true; rock.userData.noCast = true; world.add(rock);
    // rocks & boulders on the plateau ring
    const rg = new THREE.IcosahedronGeometry(1, 1); const rp = rg.attributes.position; for (let i = 0; i < rp.count; i++) { const k = 1 + (vnoise(rp.getX(i) * 3, rp.getY(i) * 3, rp.getZ(i) * 3) - 0.5) * 0.5; rp.setXYZ(i, rp.getX(i) * k, rp.getY(i) * k, rp.getZ(i) * k); } rg.computeVertexNormals();
    const N = LOW ? 140 : 260; const inst = new THREE.InstancedMesh(rg, std({ roughness: 0.95, color: 0xffffff }), N); const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), cc = new THREE.Color();
    for (let i = 0; i < N; i++) { const a = R(0, Math.PI * 2), d = R(LOT_R + 0.8, LOT_R + 12); const s = rnd() < 0.08 ? R(1.6, 3.2) : R(0.25, 1.1); e.set(R(0, 3), R(0, 3), R(0, 3)); q.setFromEuler(e); mm.compose(new THREE.Vector3(Math.cos(a) * d, PLATEAU - 0.3 + s * 0.35, Math.sin(a) * d), q, new THREE.Vector3(s * R(0.8, 1.3), s * R(0.55, 0.9), s * R(0.8, 1.3))); inst.setMatrixAt(i, mm); cc.setHSL(0.07, R(0.02, 0.08), R(0.22, 0.42)); inst.setColorAt(i, cc); }
    inst.castShadow = inst.receiveShadow = true; world.add(inst);
  })();

  /* ---- the lot ---- */
  (function lot() {
    const S = 2048, RAD = LOT_R, px = (x) => ((x + RAD) / (RAD * 2)) * S;
    const t = asphaltTex(S, '#2a2433', (g) => {
      g.strokeStyle = 'rgba(236,220,160,.5)'; g.lineWidth = 4; g.lineCap = 'round';
      for (let x = -22; x <= -0.99; x += 3.5) { g.beginPath(); g.moveTo(px(x), px(3.6)); g.lineTo(px(x), px(8.8)); g.stroke(); }
      for (let x = 17; x <= 36; x += 3.5) { g.beginPath(); g.moveTo(px(x), px(3.6)); g.lineTo(px(x), px(8.8)); g.stroke(); }
      g.fillStyle = 'rgba(236,228,205,.55)'; for (let x = 6.2; x < 12.0; x += 0.9) g.fillRect(px(x), px(3.2), px(0.5) - px(0), px(8.2) - px(3.2));
      g.fillStyle = 'rgba(236,220,160,.42)'; g.font = '38px "Bebas Neue"'; g.textAlign = 'center'; g.fillText('LOBBY', px(9), px(10.0));
      g.beginPath(); g.moveTo(px(9), px(8.9)); g.lineTo(px(8.6), px(9.35)); g.lineTo(px(9.4), px(9.35)); g.fill();
      g.clearRect(px(RAMP.x0), px(RAMP.z0), px(RAMP.x1) - px(RAMP.x0), px(RAMP.z1) - px(RAMP.z0));
      for (let i = 0; i < 14; i++) blotch(g, px(R(-26, 32)), px(R(-4, 12)), R(90, 240), 'rgba(140,70,220,A)', R(0.06, 0.16));
    });
    if (LOW) ['map', 'normalMap'].forEach((k) => { const tx = t[k]; if (tx && tx.image && tx.image.width > 1024) { tx.image = half(tx.image); tx.needsUpdate = true; } }); // phones: a quarter of the memory, same look
    const top = new THREE.Mesh(new THREE.CircleGeometry(RAD, 128).rotateX(-Math.PI / 2), texMat(t, { roughness: 1, metalness: 0.04, alphaTest: 0.5 }));
    top.receiveShadow = true; top.userData.noCast = true; world.add(top);
    const curbT = concreteTex('#8a847c', [60, 1], 1, 0.7, 256);
    const curb = new THREE.Mesh(new THREE.CylinderGeometry(RAD + 0.5, RAD + 0.6, 0.32, 128, 1, true), texMat(curbT, { roughness: 1 })); curb.position.y = -0.16 + 0.16; curb.userData.noCast = true; world.add(curb);
    const curbTop = new THREE.Mesh(new THREE.RingGeometry(RAD - 0.05, RAD + 0.5, 128).rotateX(-Math.PI / 2), std({ color: 0x9a948c, roughness: 1 })); curbTop.position.y = 0.16; curbTop.userData.noCast = true; world.add(curbTop);
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(RAD + 0.6, RAD + 1.2, 3.2, 128, 1, true), std({ color: 0x3a363e, roughness: 1 })); edge.position.y = -1.6; edge.userData.noCast = true; world.add(edge);
  })();

  out.moon = moon; return out;
}

/* tileable rock detail: periodic value noise + wrapped craters + grit → albedo (sRGB) and normal (linear) */
function rockDetail(S) {
  const h = new Float32Array(S * S), alb = new Float32Array(S * S);
  const hsh = (a, b, L, o) => { a = ((a % L) + L) % L; b = ((b % L) + L) % L; let q = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(o + 1, 2246822519); q = Math.imul(q ^ (q >>> 13), 1274126177); q ^= q >>> 16; return (q >>> 0) / 4294967295; };
  const pn = (x, y, L, o) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    const a = hsh(xi, yi, L, o), b = hsh(xi + 1, yi, L, o), c = hsh(xi, yi + 1, L, o), d = hsh(xi + 1, yi + 1, L, o); return (a + (b - a) * u) * (1 - w) + (c + (d - c) * u) * w; };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S, v = y / S; let f = 0, amp = 0.5, L = 4;
    for (let o = 0; o < 6; o++) { f += amp * pn(u * L, v * L, L, o); amp *= 0.5; L *= 2; }
    const rg = 1 - Math.abs(pn(u * 16, v * 16, 16, 9) * 2 - 1);
    h[y * S + x] = f * 0.55 + rg * 0.12; alb[y * S + x] = 0.5 + (pn(u * 8, v * 8, 8, 11) - 0.5) * 0.5 + (f - 0.5) * 0.35;
  }
  const crater = (cx, cy, rad, depth, fresh) => {
    const ext = Math.ceil(rad * 1.9);
    for (let dy = -ext; dy <= ext; dy++) for (let dx = -ext; dx <= ext; dx++) {
      const t = Math.hypot(dx, dy) / rad; if (t > 1.9) continue;
      const k = ((((Math.round(cy) + dy) % S) + S) % S) * S + ((((Math.round(cx) + dx) % S) + S) % S);
      if (t < 1) { h[k] += depth * Math.max(t * t - 1, -0.75); alb[k] -= 0.14 * (1 - t); }
      const rim = Math.exp(-((t - 1) * (t - 1)) / 0.03); h[k] += depth * 0.45 * rim; if (fresh) alb[k] += 0.22 * rim + (t > 1 ? 0.08 * (1 - (t - 1) / 0.9) : 0);
    }
  };
  for (let i = 0; i < 46; i++) { const big = rnd() < 0.12, rad = big ? R(26, 48) * S / 512 : rnd() < 0.5 ? R(4, 10) * S / 512 : R(10, 24) * S / 512; crater(R(0, S), R(0, S), rad, rad * 0.016, rnd() < 0.3); }
  for (let i = 0; i < (S * S) / 520; i++) { const cx = R(0, S), cy = R(0, S), rad = R(1.2, 3.4) * S / 512; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const t = Math.hypot(dx, dy) / rad; if (t > 1.6) continue; const k = ((((Math.round(cy) + dy) % S) + S) % S) * S + ((((Math.round(cx) + dx) % S) + S) % S); h[k] += 0.025 * Math.exp(-t * t * 1.8); alb[k] += 0.05 * Math.exp(-t * t * 2); } }
  const [nc, ng] = cnv(S, S), [ac, ag] = cnv(S, S), ni = ng.createImageData(S, S), ai = ag.createImageData(S, S), nd = ni.data, ad = ai.data, st = 26 * S / 512;
  const H = (x, y) => h[(((y + S) % S) * S) + ((x + S) % S)];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * st, dy = (H(x, y + 1) - H(x, y - 1)) * st, l = Math.hypot(dx, dy, 1), i = (y * S + x) * 4;
    nd[i] = (-dx / l * 0.5 + 0.5) * 255; nd[i + 1] = (dy / l * 0.5 + 0.5) * 255; nd[i + 2] = (1 / l * 0.5 + 0.5) * 255; nd[i + 3] = 255;
    const a = clamp(alb[y * S + x], 0.05, 1) * 255; ad[i] = ad[i + 1] = ad[i + 2] = a + Math.random() - 0.5; ad[i + 3] = 255;
  }
  ng.putImageData(ni, 0, 0); ag.putImageData(ai, 0, 0);
  return { normal: toTex(nc, [1, 1], false), albedo: toTex(ac, [1, 1], false) };
}
