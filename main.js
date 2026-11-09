// main.js — Motel Zero. Renderer, post pipeline, scenes, state machine, UI.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TOUCH, LOW, seed, R, rnd, pick, clamp, lerp, ease, easeOut, setAniso, basic, glow, cnv, toTex, glowTex, LOOK, VIDEO as VIDEO_LOOK, VPOOL, DEBUG } from './kit.js';
import { buildSpace, RAMP, RWY } from './space.js';
import { buildMotel, makeCar } from './motel.js';
import { buildLobby, buildHyodo, buildFreddie, buildAlien, buildFmk, buildKur, buildOrchid, buildHall, buildCasino, buildParking, WHEEL, REDS } from './rooms.js';
import { Snd, setTv, bindState } from './audio.js';

const $ = (s) => document.querySelector(s);
// film grain tile for the CSS overlay
{ const c = document.createElement('canvas'); c.width = c.height = 180; const g = c.getContext('2d'), im = g.createImageData(180, 180); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); const gr = document.getElementById('grain'); if (gr) { gr.style.backgroundImage = `url(${c.toDataURL()})`; if (matchMedia('(pointer: coarse)').matches) gr.style.animation = 'none'; } }
const EMAIL = 'bookmotelzero@gmail.com';

/* ---------------- projects ---------------- */
const PROJECTS = {
  kur: { room: 'Suite 307', title: 'KUR', kind: 'Documentary feature', status: 'In production', door: 'documentary · in production', css: '#e9b54d', paper: '#1d1a2b', ink: '#f1e8d4',
    body: ['How we make sense of death, filmed across cultures around the world.', '<i>Kur</i> is the Sumerian word for both mountain and underworld.'], links: [{ label: 'Ask about KUR', href: `mailto:${EMAIL}?subject=KUR` }] },
  hyodo: { room: 'Room 102', title: "HYODO'S PARADISE", kind: 'Short documentary · 22 min', status: 'Released', door: 'short doc · released', css: '#ff5fa8', paper: '#f6d5e0', ink: '#3a1626',
    body: ['Hyodo lives near Tokyo in a vibrant house filled with hundreds of sex dolls. An unconventional character amidst the normalcy and conformity of Japan, his life blurs the lines between reality and fantasy.', 'Big Sky selection &amp; multiple award winning.'], links: [{ label: 'Watch', href: 'https://directorsnotes.com/2026/08/24/jacque-rabie-hyodos-paradise/' }] },
  orchid: { room: 'Room 101', title: 'ORCHID', kind: 'Narrative feature · 2024', status: 'Out now', door: 'narrative feature · out now', css: '#25633c', t: '#f1e8d4', paper: '#dfe6d2', ink: '#16301e',
    body: ["In a remote estate, a young caretaker's obsession with an older woman curdles when her long-lost lover arrives at the door.", 'Available to rent &amp; on Blu-ray.'], links: [{ label: 'Rent on Amazon', href: 'https://www.amazon.com/Orchid-Jacque-Rabie/dp/B0FJYQMCVT' }, { label: 'Blu-ray', href: 'https://www.amazon.com/Orchid-Blu-ray-Jacque-Rabie/dp/B0FR8L4SWD' }] },
  freddie: { room: 'Room 104', title: 'FREDDIE', kind: 'Short film', status: 'Released', door: 'short film · released', css: '#ff8a1f', paper: '#f3dcc2', ink: '#3a2310',
    body: ['On the last night of his life, a struggling, young firecracker takes to the streets of Los Angeles to prove his mother wrong.'], links: [{ label: 'Watch on No Budge', href: 'https://www.nobudge.com/freddie' }] },
  alien: { room: 'Room 106', title: 'ALIEN SPA', kind: 'Horror comedy feature', status: 'Coming this year', door: 'horror comedy feature · coming this year', css: '#5cff7a', paper: '#d9efd9', ink: '#12301a',
    body: ['Three siblings, grieving the death of their parents, have a spa day from hell (or shall we say… from space).', 'A truly “out of this world” spa experience.'], links: [] },
  fmk: { room: 'Room 203', title: 'FMK', kind: 'Horror · concept trailer', status: 'Concept', door: 'horror · concept trailer', css: '#ff2a2a', paper: '#e9d6c9', ink: '#3b0b0b',
    body: [], links: [{ label: 'Watch the trailer', href: 'https://www.youtube.com/watch?v=jcyv2PX8QQA' }] },
};
const ROOM_COLORS = { orchid: 0x2fb36a, hyodo: 0xff4f9e, freddie: 0xff7a14, alien: 0x3dff6a, fmk: 0xff1414, kur: 0xffb347 };
const KUR_HUES = [0xffb347, 0x2fd6c4, 0xd94a8c, 0xe8d24a, 0x5f74ff, 0xff7a4a, 0x9be05a];

/* ---------------- renderer ---------------- */
// built to run smoothly on anything: one render straight to the screen (no post passes, no shadow maps),
// resolution capped and adapted to the frame rate. Vignette and film grain are CSS overlays.
const renderer = new THREE.WebGLRenderer({ canvas: $('#c'), antialias: !LOW, powerPreference: 'high-performance', stencil: false });
// resolution follows the device: everyone starts modest, fast screens climb toward full retina, slow ones drop. A pixel budget keeps big monitors sane.
const PR_HARD = Math.min(devicePixelRatio || 1, 2), PR_MIN = 0.6; let prCeil = PR_HARD;
const prCap = () => Math.max(PR_MIN, Math.min(prCeil, Math.sqrt((LOW ? 2.8e6 : 4.2e6) / Math.max(1, innerWidth * innerHeight))));
let pr = Math.min(prCap(), LOW ? 1 : 1.25);
renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = false;
setAniso(Math.min(4, renderer.capabilities.getMaxAnisotropy()));
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.08, 7000);
const envTex = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
// keep only the strongest few local lights per scene: every extra light costs every pixel
function trimLights(sc, max) { const L = []; sc.traverse((o) => { if ((o.isPointLight || o.isSpotLight) && o.visible) L.push(o); o.castShadow = false; }); L.sort((x, y) => y.intensity * (y.distance || 10) - x.intensity * (x.distance || 10)); L.slice(max).forEach((l) => { l.visible = false; }); }
// merge everything that never moves into one mesh per look, so a scene is a few dozen draw calls instead of hundreds.
// Things that move or change are found by running the scene's own update functions for a few frames first.
// Clickable meshes stay in place but invisible, so clicks still find them; their look is drawn by the batch.
function batchStatic(root, ups, order, keep = []) {
  const matState = (m) => [m.color?.getHex(), m.emissive?.getHex(), m.emissiveIntensity, m.opacity, m.visible].join();
  root.updateMatrixWorld(true); const snap = new Map(), msnap = new Map();
  root.traverse((o) => { snap.set(o, [o.matrixWorld.clone(), o.visible]); if (o.material && !Array.isArray(o.material)) msnap.set(o.material, matState(o.material)); });
  for (let i = 0; i < 14; i++) { const dt = 0.07, t = 2 + i * 0.53; ups.forEach((f) => { try { order === 'tdt' ? f(t, dt) : f(dt, t); } catch (e) {} }); }
  root.updateMatrixWorld(true);
  const dyn = new Set(keep.filter(Boolean)); root.traverse((o) => { const sn = snap.get(o); if (!sn || !sn[0].equals(o.matrixWorld) || sn[1] !== o.visible) dyn.add(o); });
  const live = new Set(); msnap.forEach((v, m) => { if (matState(m) !== v) live.add(m); });
  const moving = (o) => { for (let p = o; p && p !== root; p = p.parent) if (dyn.has(p)) return true; return false; };
  const look = (m) => live.has(m) || m.onBeforeCompile.toString().length > 40 ? m.uuid : [m.type, m.color?.getHex(), m.emissive?.getHex(), m.emissiveIntensity, m.roughness, m.metalness, m.map?.uuid, m.normalMap?.uuid, m.roughnessMap?.uuid, m.normalScale?.x, m.vertexColors, m.side, m.envMapIntensity, m.toneMapped, m.fog, m.flatShading].join('|');
  const inv = root.matrixWorld.clone().invert(), groups = new Map(), _m = new THREE.Matrix4();
  // static additive glow sprites -> one camera-facing instanced batch (one draw call instead of dozens)
  { const list = []; root.traverse((o) => { if (o.isSprite && o.visible && o.material.map === glowTex && o.material.blending === THREE.AdditiveBlending && o.material.opacity > 0.001 && !o.userData.noBatch && !moving(o) && !live.has(o.material)) list.push(o); });
    if (list.length >= 3) {
      const mat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: list[0].material.fog });
      mat.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', 'vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); mvPosition.xy += position.xy * vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz)); gl_Position = projectionMatrix * mvPosition;'); };
      const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, list.length), c = new THREE.Color(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), q0 = new THREE.Quaternion(), mm = new THREE.Matrix4();
      list.forEach((o, i) => { mm.multiplyMatrices(inv, o.matrixWorld).decompose(p, q, sc); im.setMatrixAt(i, mm.compose(p, q0, sc)); im.setColorAt(i, c.copy(o.material.color).multiplyScalar(o.material.opacity)); o.parent.remove(o); });
      im.frustumCulled = false; im.renderOrder = 2; im.userData.noBatch = true; root.add(im);
    } }
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || !o.visible || Array.isArray(o.material) || o.material.transparent || o.material.alphaTest > 0 || o.userData.noBatch || moving(o)) return;
    if (o.matrixWorld.determinant() < 0 || !o.geometry.attributes.position || o.geometry.morphAttributes.position) return;
    const g = o.geometry, key = look(o.material) + '#' + Object.keys(g.attributes).sort().join(',') + (g.index ? 'i' : 'n');
    if (!groups.has(key)) groups.set(key, { mat: o.material, list: [], src: [] }); _m.multiplyMatrices(inv, o.matrixWorld);
    const gg = g.clone(); for (const k of Object.keys(gg.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) gg.deleteAttribute(k); gg.applyMatrix4(_m); groups.get(key).list.push(gg); groups.get(key).src.push(o);
  });
  let n = 0;
  for (const G of groups.values()) {
    if (G.list.length < 2) continue; const mg = mergeGeometries(G.list, false); if (!mg) continue;
    const mm = new THREE.Mesh(mg, G.mat); mm.matrixAutoUpdate = false; mm.userData.noBatch = true; root.add(mm); n++;
    for (const o of G.src) { if (o.userData.go || o.userData.toast || o.userData.poolToast || o.userData.ding || o.userData.vend) o.visible = false; else o.parent?.remove(o); }
  }
  return n;
}

/* ---------------- optional filters (debug panel): vintage pixel, VHS. Off = one direct render. ---------------- */
function setPR(v) { if (Math.abs(v - pr) < 0.01) return; pr = v; renderer.setPixelRatio(pr); sizeFX(); }
let FX = 'none', fxRT = null; const fxScene = new THREE.Scene(), fxCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const fxMat = new THREE.ShaderMaterial({
  uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(1, 1) }, time: { value: 0 }, mode: { value: 1 }, amt: { value: 0.25 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; uniform float time; uniform int mode; uniform float amt; varying vec2 vUv;
    float bayer4(vec2 p) { ivec2 i = ivec2(mod(p, 4.0)); float m[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.); return m[i.x + i.y * 4] / 16.0 - 0.5; }
    vec3 disp(vec3 c) { return sRGBTransferOETF(vec4(toneMapping(c), 1.0)).rgb; }
    void main() {
      if (mode == 1) {
        vec2 cell = floor(vUv * res); vec3 c = disp(texture2D(tDiffuse, (cell + 0.5) / res).rgb);
        float lv = mix(24.0, 7.0, amt); c = floor(c * lv + 0.5 + bayer4(cell) * mix(0.35, 0.9, amt)) / lv; c = mix(c, c * vec3(1.06, 0.98, 0.88) + vec3(0.02, 0.0, 0.03), 0.6 * amt);
        gl_FragColor = vec4(c, 1.0);
      } else if (mode == 3) {
        vec2 px = 1.0 / res; vec2 uv = vUv + vec2(sin(time * 7.0) * 0.00025, cos(time * 5.3) * 0.0002);
        vec3 c = texture2D(tDiffuse, uv).rgb, b = vec3(0.0);
        for (int i = 0; i < 8; i++) { float a = float(i) * 0.7854; vec2 o = vec2(cos(a), sin(a)) * px * 3.0; vec3 t = texture2D(tDiffuse, uv + o).rgb; b += max(t - 0.75, 0.0); }
        c += b * vec3(0.32, 0.12, 0.06) * 0.6;
        c = disp(c); float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(c, c * vec3(1.06, 1.0, 0.9), smoothstep(0.35, 1.0, l)); c = mix(c, c * vec3(0.9, 1.0, 1.06) + vec3(0.0, 0.01, 0.02), 1.0 - smoothstep(0.0, 0.4, l));
        c = c * 0.94 + 0.035; float v = smoothstep(1.15, 0.3, length(vUv - 0.5) * 1.4); c *= mix(0.86, 1.0, v);
        float n = fract(sin(dot(floor(vUv * res) + mod(floor(time * 24.0), 997.0), vec2(12.9898, 78.233))) * 43758.5453); c += (n - 0.5) * 0.035;
        gl_FragColor = vec4(c, 1.0);
      } else {
        float ty = fract(time * 0.06), near = 1.0 - smoothstep(0.0, 0.035, abs(vUv.y - ty)); vec2 uv = vUv;
        uv.x += (near * 0.008 * sin(vUv.y * 500.0 + time * 30.0) + sin(vUv.y * 4.0 + time * 0.7) * 0.0007) * amt;
        float o = 1.5 / res.x; vec3 c;
        c.r = texture2D(tDiffuse, uv + vec2(o * 1.6 * amt, 0.0)).r; c.g = texture2D(tDiffuse, uv).g; c.b = texture2D(tDiffuse, uv - vec2(o * 1.6 * amt, 0.0)).b;
        c = 0.5 * c + 0.25 * texture2D(tDiffuse, uv + vec2(o, 0.0)).rgb + 0.25 * texture2D(tDiffuse, uv - vec2(o, 0.0)).rgb;
        c = disp(c); float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(c, mix(vec3(l), c, 0.8) * 0.9 + vec3(0.05, 0.035, 0.06), amt);
        c *= 1.0 - 0.12 * amt + 0.12 * amt * sin(vUv.y * res.y * 3.14159);
        float n = fract(sin(dot(floor(vUv * res * vec2(0.5, 1.0)) + mod(floor(time * 30.0), 997.0), vec2(12.9898, 78.233))) * 43758.5453);
        c += ((n - 0.5) * 0.07 + near * n * 0.22) * amt;
        gl_FragColor = vec4(c, 1.0);
      }
    }`,
  depthTest: false, depthWrite: false,
});
fxScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fxMat));
function sizeFX() {
  fxRT?.dispose(); fxRT = null; if (FX === 'none') return; const px = FX === 'pixel';
  const W = px ? Math.round(clamp(innerWidth / 1.6, 360, 900)) : Math.round(innerWidth * Math.min(pr, 1.25)), H = Math.round((W * innerHeight) / innerWidth);
  fxRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: px ? THREE.NearestFilter : THREE.LinearFilter, magFilter: px ? THREE.NearestFilter : THREE.LinearFilter });
  fxMat.uniforms.res.value.set(W, H); fxMat.uniforms.mode.value = px ? 1 : FX === 'film' ? 3 : 2;
}
function setFX(m) { FX = m; sizeFX(); }

/* ---------------- scenes ---------------- */
const ext = new THREE.Scene(); ext.background = new THREE.Color(0x05040b); ext.fog = new THREE.FogExp2(0x0b0818, 0.00045); ext.environment = envTex; ext.environmentIntensity = 0.2;
const world = new THREE.Group(); ext.add(world);
const extUp = [], hotspots = { ext: [], lobby: [], hall: [] };
let motel = null, labelsDef = [], flickers = [], doors = {};
const introLogo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1 / 1.915), basic({ transparent: true, depthWrite: false, opacity: 1, fog: false })); introLogo.userData.noAO = true; ext.add(introLogo);
const tvVideo = $('#tvvid'); setTv(tvVideo);
const interiors = {};
let logoTex = null;

/* ---------------- cars ---------------- */
const cars = []; const _b0 = new THREE.Vector3(), _b1 = new THREE.Vector3();
function addCar() { const c = makeCar(pick([0x8a6a4a, 0x6a7a6a, 0x9a8a6a, 0x7a3a2a, 0x5a6a7a, 0xa89a7a, 0x6a5a6a, 0x8a8a6a])); c.t = 0; world.add(c.g); cars.push(c); return c; }
function spawnArrival() {
  if (cars.length >= 4) return; const c = addCar(); c.state = 'approach'; c.dur = R(3.8, 5.2); const z = RWY.z + R(-0.3, 0.3);
  c.p0 = new THREE.Vector3(RWY.x0 - 190, R(50, 95), z + R(-60, 60)); c.p1 = new THREE.Vector3(RWY.x0 - 60, R(7, 12), z); c.p2 = new THREE.Vector3(RWY.x0, RWY.y, z); c.g.position.copy(c.p0);
}
function spawnDeparture(boost) { const c = addCar(); c.state = 'emerge'; c.boost = boost; c.v = 0; c.g.position.set(RAMP.x1 - 0.5, RAMP.bottom + 0.7, RAMP.zc); c.g.rotation.y = Math.PI; return c; }
function updateCars(dt, t) {
  for (let i = cars.length - 1; i >= 0; i--) {
    const c = cars[i], p = c.g.position; c.t += dt; const flick = (0.75 + Math.sin(t * 40 + i) * 0.15) * (Math.random() < 0.06 ? 0.2 : 1);
    const puff = c.state === 'approach' || c.state === 'takeoff' || c.state === 'emerge' ? 1 : c.state === 'roll' ? 0.5 : 0;
    c.smoke.forEach((sp, k) => { const ph = (t * 0.9 + sp.userData.k) % 1; sp.position.set(-2.8 - ph * 2.6, 0.1 + ph * 0.5, Math.sin(k * 2.3 + t) * 0.15); sp.scale.setScalar(0.4 + ph * 1.5); sp.material.opacity = (1 - ph) * 0.28 * puff; });
    if (c.state === 'approach') {
      const k = Math.min(1, c.t / c.dur), e = easeOut(k); _b0.lerpVectors(c.p0, c.p1, e); _b1.lerpVectors(c.p1, c.p2, e); p.lerpVectors(_b0, _b1, e);
      c.g.rotation.set(Math.sin(k * 6) * 0.08 * (1 - e), 0, -0.22 * (1 - e)); c.flame.visible = true; c.flame.scale.setScalar(flick * (1.2 - k * 0.6)); c.fg.material.opacity = 0.7;
      if (k >= 1) { c.state = 'roll'; c.t = 0; }
    } else if (c.state === 'roll') {
      const k = Math.min(1, c.t / 2.6); p.x = lerp(RWY.x0, RAMP.x0, easeOut(k)); p.y = RWY.y + Math.sin(t * 3 + i) * 0.05; c.g.rotation.set(0, 0, 0); c.flame.scale.setScalar(flick * 0.4); c.fg.material.opacity = 0.5;
      if (k >= 1) { c.state = 'dive'; c.t = 0; }
    } else if (c.state === 'dive') {
      const k = Math.min(1, c.t / 1.7); p.x = lerp(RAMP.x0, RAMP.x1 - 0.4, k); p.y = lerp(RWY.y, RAMP.bottom + 0.6, Math.pow(k, 1.4)); c.g.rotation.z = -0.16;
      if (k >= 1) { world.remove(c.g); cars.splice(i, 1); }
    } else if (c.state === 'emerge') {
      const k = Math.min(1, c.t / 1.6); p.x = lerp(RAMP.x1 - 0.5, RAMP.x0, k); p.y = lerp(RAMP.bottom + 0.7, RWY.y, Math.pow(k, 0.7)); c.g.rotation.z = -0.16; c.flame.visible = true; c.flame.scale.setScalar(flick * 0.6);
      if (k >= 1) { c.state = 'takeoff'; c.t = 0; c.v = 6; }
    } else if (c.state === 'takeoff') {
      c.v += dt * (c.boost ? 38 : 22); p.x -= c.v * dt; if (p.x < RWY.x0 + 14) p.y += c.v * dt * 0.32; c.g.rotation.z = p.x < RWY.x0 + 14 ? -0.25 : 0;
      c.flame.visible = true; c.flame.scale.setScalar(flick * 1.4); c.fg.material.opacity = 1; if (p.x < -280) { world.remove(c.g); cars.splice(i, 1); }
    }
  }
}
let carTimer = 6.0;
// it's a motel on an asteroid: traffic is rare, and only one car uses the runway at a time
function carSpawner(dt) { carTimer -= dt; if (carTimer > 0) return; if (cars.length) { carTimer = 2; return; } carTimer = state === 'landing' ? R(11, 17) : R(30, 55); if (rnd() < 0.3 && state !== 'landing') spawnDeparture(false); else spawnArrival(); }

/* ---------------- flicker ---------------- */
function updateFlickers(dt, t) {
  for (const f of flickers) {
    if (!f.next) f.next = t + R(2, 8) / f.rate;
    if (t > f.next) { f.burst = t + R(0.15, 0.7); f.next = t + R(3, 12) / f.rate; if (f.sputter && state === 'exterior') Snd.sputter(); }
    let on = 1; if (f.burst && t < f.burst) on = Math.random() < 0.5 ? 0.15 : 1;
    f.mat.opacity = on; f.mat.transparent = true; if (f.light) f.light.intensity = f.li * on;
  }
}

/* ---------------- camera + state ---------------- */
let state = 'loading', active = ext, busy = false, currentRoom = null;
bindState(() => state);
const cam = { pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 42 };
let pan = 0, panTarget = 0; const mouse = new THREE.Vector2();
const gyro = { on: false, x: 0, y: 0, tx: 0, ty: 0, b0: null, g0: null };
function onTilt(e) { if (e.beta == null) return; if (gyro.b0 == null) { gyro.b0 = e.beta; gyro.g0 = e.gamma; } gyro.on = true; gyro.tx = clamp((e.gamma - gyro.g0) / 22, -1, 1); gyro.ty = clamp(-(e.beta - gyro.b0) / 22, -1, 1); }
function gyroAsk() { if (!TOUCH || gyro.asked) return; gyro.asked = true; const D = window.DeviceOrientationEvent; if (!D) return; if (typeof D.requestPermission === 'function') D.requestPermission().then((r) => { if (r === 'granted') addEventListener('deviceorientation', onTilt); }).catch(() => {}); else addEventListener('deviceorientation', onTilt); }
const tweens = [];
function tween(dur, fn, e = ease) { return new Promise((res) => tweens.push({ t: 0, dur, fn, e, res })); }
function runTweens(dt) { for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i]; tw.t += dt; const k = Math.min(1, tw.t / tw.dur); tw.fn(tw.e(k), k); if (k >= 1) { tweens.splice(i, 1); tw.res(); } } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const frames = (n = 2) => Promise.race([new Promise((r) => { const f = () => (--n <= 0 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), sleep(1500)]);
async function fade(on) { if (!on) await frames(2); $('#fade').classList.toggle('on', on); await sleep(380); }
const aspect = () => innerWidth / innerHeight;
const portrait = () => aspect() < 0.9;
function vfovFor(minHdeg, base, cap = 92) { const need = (2 * Math.atan(Math.tan((minHdeg * Math.PI) / 360) / aspect()) * 180) / Math.PI; return Math.min(cap, Math.max(base, need)); }

function extView(name) {
  const P = portrait();
  if (name === 'intro') return { pos: new THREE.Vector3(0, P ? -300 : -240, P ? 640 : 470), target: new THREE.Vector3(0, P ? 48 : 26, 0), fov: P ? 60 : 50 };
  if (name === 'exterior') {
    // phones see the whole place at once (no swiping); computers get the three-quarter view with the casino in it
    if (P) { const T = new THREE.Vector3(-4.5, 3.6, -1.5), off = new THREE.Vector3(0.3, 0.32, 0.9).normalize(); return { pos: T.clone().addScaledVector(off, clamp(57 / aspect(), 80, 145)), target: T, fov: 56 }; }
    const T = new THREE.Vector3(-6.5, 7.2, -0.5); const off = new THREE.Vector3(14.5, 8.4, 30);
    const k = clamp(1.78 / aspect(), 1, 1.5) * 1.55; return { pos: T.clone().addScaledVector(off, k), target: T, fov: 40 };
  }
  if (name === 'casino') { const c = motel.casino; return { pos: c.door.clone().addScaledVector(c.front, P ? 10 : 7).add(new THREE.Vector3(0, P ? 2.6 : 1.9, 0)), target: c.door.clone().add(new THREE.Vector3(0, P ? 1.2 : 0.6, 0)), fov: P ? 62 : 50 }; }
  if (name === 'landing') return P ? { pos: new THREE.Vector3(2, 7, 30), target: new THREE.Vector3(-9, 2.6, 13), fov: 62 } : { pos: new THREE.Vector3(6, 4.4, 25), target: new THREE.Vector3(-10, 2.6, 12), fov: 50 };
  if (name === 'pool' && VPOOL) { const c = motel.pool.center; return P ? { pos: c.clone().add(new THREE.Vector3(0.2, 1.75, 4.3)), target: c.clone().add(new THREE.Vector3(0, 0.15, -1.8)), fov: 72 } : { pos: c.clone().add(new THREE.Vector3(0.4, 1.55, 4.15)), target: c.clone().add(new THREE.Vector3(-0.2, 0.45, -2.4)), fov: 58 }; }
  if (name === 'pool') { const c = motel.pool.center; return P ? { pos: c.clone().add(new THREE.Vector3(0.5, 3.3, 3.2)), target: c.clone().add(new THREE.Vector3(-0.2, -0.1, -0.9)), fov: 62 } : { pos: c.clone().add(new THREE.Vector3(1.2, 2.5, 2.8)), target: c.clone().add(new THREE.Vector3(-0.3, 0.0, -0.95)), fov: 52 }; }
  if (SPOTS.includes(name)) { const sp = motel.spots[name], x = sp.x;
    if (name === 'diner' && VIDEO_LOOK) return P ? { pos: new THREE.Vector3(x, 1.45, -0.05), target: new THREE.Vector3(x, 1.2, -6.0), fov: 74 } : { pos: new THREE.Vector3(x + 0.1, 1.5, -0.05), target: new THREE.Vector3(x, 1.3, -6.0), fov: 58 };
    if (name === 'diner') return P ? { pos: new THREE.Vector3(x + 0.25, 1.45, 0.02), target: new THREE.Vector3(x - 0.1, 0.98, -2.8), fov: 70 } : { pos: new THREE.Vector3(x + 0.45, 1.5, 0.0), target: new THREE.Vector3(x - 0.3, 1.08, -2.8), fov: 54 };
    // between the arcade columns and the glass on computers; phones stand back and to the left so the column stays out of shot
    return P ? { pos: new THREE.Vector3(x - 1.05, 1.45, 1.9), target: new THREE.Vector3(x - 0.05, 0.55, -1.9), fov: 70 } : { pos: new THREE.Vector3(x, 1.22, -0.02), target: new THREE.Vector3(x, 0.86, -2.0), fov: 60 }; }
  if (name === 'garage') return { pos: new THREE.Vector3(-4.5, 2.4, 17.2), target: new THREE.Vector3(-11, 0.2, 13), fov: 50 };
  if (name === 'office') return { pos: new THREE.Vector3(9, 2.0, P ? 12 : 10.5), target: new THREE.Vector3(9, 1.7, 0.6), fov: P ? 62 : 50 };
  const d = doors[name]; if (d) return { pos: new THREE.Vector3(d.x + 0.6, d.y0 + 1.4, P ? 4.2 : 3.6), target: new THREE.Vector3(d.x, d.y0 + 1.15, 0), fov: P ? 62 : 50 };
}
function boardView() { const v = interiors.lobby.views.board; return portrait() ? { pos: v.p.pos.clone(), target: v.p.target.clone(), fov: vfovFor(40, 64) } : { pos: v.pos.clone(), target: v.target.clone(), fov: vfovFor(60, 54) }; }
function wheelView() { const v = interiors.casino.views.wheel; return portrait() ? { pos: v.p.pos.clone(), target: v.p.target.clone(), fov: 60 } : { pos: v.pos.clone(), target: v.target.clone(), fov: 46 }; }
function parkView() { const v = interiors.parking.views.park; return portrait() ? { pos: v.p.pos.clone(), target: v.p.target.clone(), fov: vfovFor(46, 68) } : { pos: v.pos.clone(), target: v.target.clone(), fov: vfovFor(70, 52) }; }
function casinoView() { const v = interiors.casino.views.table; return portrait() ? { pos: v.p.pos.clone(), target: v.p.target.clone(), fov: vfovFor(44, 66) } : { pos: v.pos.clone(), target: v.target.clone(), fov: vfovFor(62, 50) }; }
function hallView() { const v = interiors.hall.views.hall; return portrait() ? { pos: v.p.pos.clone(), target: v.p.target.clone(), fov: vfovFor(40, 64) } : { pos: v.pos.clone(), target: v.target.clone(), fov: vfovFor(64, 52) }; }
function setCam(v) { cam.pos.copy(v.pos); cam.target.copy(v.target); cam.fov = v.fov; }
function inView(v, minH = 82, card = true) {
  const pos = v.pos.clone(), target = v.target.clone();
  if (v.corner) { if (portrait()) { target.y -= 0.9; return { pos, target, fov: vfovFor(46, 78) }; } return { pos, target, fov: vfovFor(88, 60) }; }
  if (!card) { if (portrait() && v.p) { pos.copy(v.p.pos); target.copy(v.p.target); return { pos, target, fov: vfovFor(v.p.minH ?? minH, v.p.base ?? 56) }; } }
  else if (portrait()) { target.y -= 0.55; pos.y += 0.25; pos.z += 0.25; }
  else if (innerWidth > 720) { const sx = v.shift ?? 1.25; pos.x += sx; target.x += sx * 1.35; }
  return { pos, target, fov: vfovFor(minH, 56) };
}
function flyTo(v, dur, arc = 0) { const p0 = cam.pos.clone(), t0 = cam.target.clone(), f0 = cam.fov; return tween(dur, (k) => { cam.pos.lerpVectors(p0, v.pos, k); cam.pos.y += Math.sin(k * Math.PI) * arc; cam.target.lerpVectors(t0, v.target, k); cam.fov = lerp(f0, v.fov, k); }); }
function applyCamera(dt, t) {
  const P = portrait(); pan = lerp(pan, panTarget, Math.min(1, dt * 6));
  const px = state === 'exterior' ? pan * (P ? 13 : 4.5) : state === 'lobby' ? pan * 0.9 : state === 'room' ? pan * 0.3 : state === 'landing' ? pan * 4 : state === 'projects' ? pan * 0.5 : state === 'pool' ? pan * 1.4 : 0;
  if (TOUCH && gyro.on) { gyro.x = lerp(gyro.x, gyro.tx, Math.min(1, dt * 4)); gyro.y = lerp(gyro.y, gyro.ty, Math.min(1, dt * 4)); }
  // phones: a slow drift that always runs (tilt adds to it when the browser allows motion access); scaled by distance so it feels the same everywhere
  const mx = TOUCH ? Math.sin(t * 0.23) * 0.55 + (gyro.on ? gyro.x * 0.9 : 0) : mouse.x, my = TOUCH ? Math.sin(t * 0.17 + 1) * 0.4 + (gyro.on ? gyro.y * 0.9 : 0) : mouse.y, sway = state === 'intro' ? 0 : 1, drift = state === 'room' ? Math.sin(t * 0.11) * 0.09 : 0;
  const amp = TOUCH ? clamp(cam.pos.distanceTo(cam.target) / 6.5, 0.6, 14) * 0.35 : 0.35;
  camera.position.set(cam.pos.x + px + drift + mx * amp * sway, cam.pos.y + my * amp * 0.5 * sway + Math.sin(t * 0.5) * 0.03 * sway, cam.pos.z);
  camera.lookAt(cam.target.x + px * (state === 'room' || state === 'lobby' ? 1.6 : 1), cam.target.y, cam.target.z);
  if (Math.abs(camera.fov - cam.fov) > 0.01) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
}
function useScene(sc) { active = sc; }

/* ---------------- ui ---------------- */
const card = $('#card');
function hideCard() { card.classList.add('hidden'); card.classList.remove('min'); }
function showCard(html, cls = '') { card.innerHTML = html; card.className = cls; card.scrollTop = 0; requestAnimationFrame(() => card.classList.remove('hidden')); const c = card.querySelector('.collapse'); if (c) c.onclick = (e) => { e.stopPropagation(); card.classList.toggle('min'); c.textContent = card.classList.contains('min') ? '+' : '–'; }; }
function roomCard(id) {
  const p = PROJECTS[id];
  return `<div class="paper hanger" style="--hc:${p.paper};--ht:${p.ink}"><span class="roomno">${p.room.toUpperCase()}</span><span class="status">${p.status}</span><button class="collapse" aria-label="Minimize">–</button>
  <h2>${p.title}</h2><div class="kind">${p.kind}</div>${p.body.map((b) => `<p>${b}</p>`).join('')}${p.links.map((l) => `<a class="btn" href="${l.href}" target="_blank" rel="noopener">${l.label} →</a>`).join(' ')}</div>`;
}
function landingCard() {
  return `<div class="paper ticket"><div class="perm"><span>LANDING PERMIT</span><span>Nº ${String(Math.floor(Math.random() * 90000 + 10000))}</span></div><button class="collapse" aria-label="Minimize">–</button>
  <h2>Contact us</h2><p>Reach out to us for any and all inquiries!</p>
  <a class="btn" id="transfer" href="mailto:${EMAIL}?subject=Hi%20Motel%20Zero">Initiate transfer ↑</a><div class="mail">${EMAIL}</div><div class="barcode"></div></div>`;
}
card.addEventListener('click', (e) => { const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.dataset.go); return; } if (e.target.closest('#transfer')) launchFromPad(); });
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3200); }
const pillsEl = $('#pills'), LOBBY_PILLS = [['Read about us', 'board'], ['▶ Watch the TV', 'tv']];
function pills(list) { document.body.classList.toggle('pills-on', !!(list && list.length)); if (!list || !list.length) { pillsEl.classList.remove('show'); return; } pillsEl.innerHTML = list.map(([t, g]) => `<button class="pill" data-go="${g}">${t}</button>`).join(''); pillsEl.classList.add('show'); }
pillsEl.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
const keysEl = $('#keys');
function showKeys(on) { keysEl.classList.toggle('off', !on); }
keysEl.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
function launchFromPad() { interiors.parking?.leaveNow?.(); Snd.whoosh(2.6, 0.18); }
const labelsEl = $('#labels'); let labels = [];
const _v = new THREE.Vector3();
function updateLabels() {
  const show = state === 'exterior' && !busy; labelsEl.classList.toggle('off', !show); if (!show) return;
  // labels that fall off the side of the screen pin to the edge with an arrow, so every destination stays findable on a phone
  const P = portrait();
  for (const L of labels) {
    // on phones some labels hang under their building instead of sitting on top of it
    const hang = !!L.below; _v.copy(hang ? L.below : L.pos); world.localToWorld(_v); _v.project(camera); let x = (_v.x * 0.5 + 0.5) * innerWidth; const y = clamp((-_v.y * 0.5 + 0.5) * innerHeight + (hang ? 6 : 0) + (L.dy ? L.dy * (P ? 0.35 : 1) : 0), 70, innerHeight - (hang ? 60 : 90)), w = L.el.offsetWidth || 90, m = 10;
    const left = x < w / 2 + m, right = x > innerWidth - w / 2 - m; if (left) x = w / 2 + m; if (right) x = innerWidth - w / 2 - m;
    L.el.classList.toggle('edge-l', left); L.el.classList.toggle('edge-r', right); L.el.style.display = _v.z < 1 ? '' : 'none'; L.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, ${hang ? '0%' : '-100%'})`; L.el.classList.toggle('hang', !!hang);
  }
}
function setHash(h) { try { history.replaceState(null, '', h ? '#' + h : location.pathname + location.search); } catch (e) {} }
function hud() { const out = !['intro', 'loading', 'exterior', 'flying'].includes(state); $('#home').classList.toggle('show', out); $('#mute').classList.toggle('show', state !== 'loading' && (state !== 'intro' || !!Snd.ctx)); }

/* ---------------- navigation ---------------- */
const INSIDE = ['lobby', 'tv', 'board', 'room'];
const SPOTS = ['diner', 'machines']; let pendingFx = null;
const SPOT_FX = { vending: () => { motel.spots.vending.fire(); Snd.clunk?.(); }, ice: () => { motel.spots.ice.fire(); Snd.ice?.(); }, order: () => { if (motel.spots.diner.order) { motel.spots.diner.order(); Snd.order?.(); } } };
const swing = (d, k) => d.pivots.forEach((p, i) => (p.rotation.y = (d.double && i === 1 ? -1 : 1) * d.open * k));
function resetHall() { Object.values(interiors.hall.doors).forEach((d) => swing(d, 0)); }
function arrive(s2, hash = '') { state = s2; Snd.mix(s2); setHash(hash); busy = false; hud(); }
async function go(to) {
  if (to === 'about') to = 'lobby'; if (to === 'contact') to = 'landing';
  if (busy || to === state) return;
  if ((to === 'tv' || to === 'board') && !['lobby', 'tv', 'board'].includes(state)) { await go('lobby'); return go(to); }
  if (to === 'lobby' && (state === 'tv' || state === 'board')) { busy = true; pills(); tvVideo.muted = true; Snd.mix('lobby'); await flyTo(inView(interiors.lobby.views.lobby, 50, false), 1.1); state = 'lobby'; pills(LOBBY_PILLS); busy = false; hud(); return; }
  if (to === 'board') { busy = true; pills(); tvVideo.muted = true; state = 'board'; Snd.mix('board'); await flyTo(boardView(), 1.2); pills([['← Back to the desk', 'lobby'], ['▶ Watch the TV', 'tv']]); busy = false; hud(); return; }
  if (to === 'tv') { busy = true; hideCard(); pills(); state = 'tv'; Snd.mix('tv'); tvVideo.muted = !Snd.on; tvVideo.currentTime = 0; tvVideo.play().catch(() => {}); await flyTo({ ...interiors.lobby.views.tv, fov: portrait() ? vfovFor(27, 40) : vfovFor(58, 48) }, 1.2); pills([['← Back to the desk', 'lobby'], ['Read about us', 'board']]); busy = false; hud(); return; }
  busy = true; hideCard(); pills(); showKeys(false);
  if (state === 'exterior') Snd.whoosh(1.3, 0.05);
  if (state === 'landing') {
    await fade(true); useScene(ext); setCam(extView('garage')); panTarget = pan = 0; state = 'exterior'; Snd.mix('exterior'); hud(); setHash('');
    if (to === 'exterior') { await frames(2); fade(false); await flyTo(extView('exterior'), 1.5); busy = false; return; }
    await fade(false);
  }
  if (state === 'casino') {
    // out of the casino: fade, back on the lot by its door
    showCasino(false); await fade(true); useScene(ext, 0.9); setCam(extView('casino')); panTarget = pan = 0; state = 'exterior'; Snd.mix('exterior'); hud(); setHash('');
    if (to === 'exterior') { await frames(2); fade(false); await flyTo(extView('exterior'), 1.5); busy = false; return; }
    await fade(false);
  }
  if (state === 'projects' && PROJECTS[to]) return hallToRoom(to);
  if (state === 'room' && to === 'projects') return roomToHall();
  if (to === 'projects') return fadeToHall();
  if (state === 'projects') {
    // out of the hallway: fade to black, back outside
    await fade(true); useScene(ext, 0.9); setCam(extView('exterior')); panTarget = pan = 0; state = 'exterior'; Snd.mix('exterior'); hud(); setHash(''); await fade(false);
    if (to === 'exterior') { busy = false; return; }
  }
  if (INSIDE.includes(state)) {
    // back out through the door we came in by
    const lobbyish = state === 'lobby' || state === 'tv' || state === 'board', from = state === 'room' ? currentRoom : state === 'projects' ? 'projects' : 'office';
    if (lobbyish) await fade(true); if (state === 'room') Snd.acStop();
    useScene(ext, 0.9); tvVideo.pause(); tvVideo.muted = true; setCam(extView(from)); panTarget = pan = 0;
    if (from !== 'office') { const d = doors[from]; d.hinge.rotation.y = -1.35; d.voidM.visible = true; }
    state = 'door'; Snd.mix('door'); hud();
    if (lobbyish) await fade(false);
    if (from !== 'office') { const d = doors[from]; Snd.creak(); await tween(0.7, (k) => (d.hinge.rotation.y = -1.35 * (1 - k))); d.voidM.visible = false; }
    if (to === 'exterior') { await flyTo(extView('exterior'), 1.5); return arrive('exterior'); }
  }
  if (to === 'exterior') { await flyTo(extView('exterior'), state === 'landing' || state === 'pool' ? 1.6 : 1.2); return arrive('exterior'); }
  if (to === 'landing') {
    // Contact us: down the tube into the underground parking, where the cars come in
    if (state === 'pool') await flyTo(extView('exterior'), 0.9);
    panTarget = 0; await zoomInFade(extView('garage'), 1.8, 0.55);
    useScene(interiors.parking.scene); setCam(parkView()); state = 'landing'; Snd.mix('landing'); hud(); setHash('landing');
    await fade(false); showCard(landingCard(), ''); busy = false; return;
  }
  if (SPOTS.includes(to)) {
    // close-ups on the ground floor: look in the diner window, watch the machines go
    if (state === 'landing' || state === 'pool') await flyTo(extView('exterior'), 0.9);
    panTarget = 0; state = to; Snd.mix('exterior'); hud(); if (to === 'diner') { motel.spots.diner.show(true); motel.spots.diner.wake(); } await flyTo(extView(to), 1.7, 0.8); setHash(''); busy = false;
    const fx = pendingFx; pendingFx = null; if (fx && SPOT_FX[fx]) setTimeout(() => { if (state === to) SPOT_FX[fx](); }, 250); return;
  }
  if (to === 'pool') {
    if (state === 'landing') await flyTo(extView('exterior'), 0.9);
    state = 'pool'; Snd.mix('pool'); hud(); panTarget = 0; await flyTo(extView('pool'), 2.0, 2.5);
    setHash('pool'); busy = false; return;
  }
  if (to === 'lobby') {
    panTarget = 0; await flyTo(extView('office'), 1.2); await fade(true);
    useScene(interiors.lobby.scene, 0.45); setCam(inView(interiors.lobby.views.lobby, 50, false));
    state = 'lobby'; Snd.mix('lobby'); hud(); tvVideo.muted = true; tvVideo.preload = 'auto'; tvVideo.play().catch(() => {});
    await fade(false); pills(LOBBY_PILLS); setHash('lobby'); busy = false; return;
  }
  if (to === 'casino') {
    if (state === 'landing' || state === 'pool') await flyTo(extView('exterior'), 0.9);
    panTarget = 0; const c = motel.casino; await zoomInFade({ pos: c.door.clone().addScaledVector(c.front, 1.4).add(new THREE.Vector3(0, 0.5, 0)), target: c.door.clone().add(new THREE.Vector3(0, 0.3, 0)), fov: 50 }, 2.0, 0.55);
    useScene(interiors.casino.scene, 0.5); setCam(casinoView()); state = 'casino'; Snd.mix('casino'); hud(); setHash('casino');
    await fade(false); showCasino(true); busy = false; return;
  }
  if (PROJECTS[to]) {
    panTarget = 0; const d = doors[to]; d.voidM.visible = true;
    setTimeout(() => { Snd.creak(); tween(0.5, (k) => (d.hinge.rotation.y = -1.35 * k)); }, 450);
    await flyTo(extView(to), 1.0); await zoomFade(1.3, 0.7);
    return enterRoom(to);
  }
  busy = false;
}
// fly toward a view and start fading to black part way through the move
async function zoomInFade(v, dur, fadeAt = 0.5) { const f = (async () => { await sleep(dur * fadeAt * 1000); await fade(true); })(); await flyTo(v, dur); await f; }
// push in through the doorway while the screen goes black
async function zoomFade(dist = 1.2, dur = 0.7) {
  const dir = cam.target.clone().sub(cam.pos).normalize(), v = { pos: cam.pos.clone().addScaledVector(dir, dist), target: cam.target.clone().addScaledVector(dir, dist), fov: cam.fov * 0.84 };
  const f = (async () => { await sleep(dur * 380); await fade(true); })(); await flyTo(v, dur); await f;
}
async function enterRoom(id) {
  currentRoom = id; const R0 = interiors[id]; useScene(R0.scene, 0.4); setCam(inView(R0.views.room));
  state = 'room'; Snd.mix('room'); Snd.acStart(); hud(); setHash(id); await fade(false);
  showCard(roomCard(id)); pills([['← Back to the hallway', 'projects']]); busy = false;
}
async function fadeToHall() {
  panTarget = 0;
  if (state === 'exterior' || state === 'door') await zoomInFade(extView('projects'), 1.2, 0.18); else await fade(true);
  tvVideo.pause(); tvVideo.muted = true; resetHall(); useScene(interiors.hall.scene, 0.5);
  const v = hallView(); setCam({ pos: v.pos.clone().add(new THREE.Vector3(0, 0, 0.45)), target: v.target.clone(), fov: v.fov });
  state = 'projects'; Snd.mix('hall'); hud(); setHash('projects');
  await fade(false); await flyTo(v, 1.1); showKeys(true); busy = false;
}
async function hallToRoom(id) {
  const d = interiors.hall.doors[id]; panTarget = 0;
  await flyTo({ pos: d.view.pos.clone(), target: d.view.target.clone(), fov: vfovFor(portrait() ? 48 : 64, 50) }, 1.0);
  Snd.creak(); await tween(0.42, (k) => swing(d, easeOut(k))); await sleep(60);
  await zoomFade(1.0, 0.7); return enterRoom(id);
}
async function roomToHall() {
  Snd.acStop(); const d = interiors.hall.doors[currentRoom];
  useScene(interiors.hall.scene, 0.5); resetHall();
  if (d) { swing(d, 1); setCam({ pos: d.view.pos.clone(), target: d.view.target.clone(), fov: vfovFor(portrait() ? 48 : 64, 50) }); }
  state = 'projects'; Snd.mix('hall'); hud(); setHash('projects');
  if (d) { await sleep(150); Snd.creak(); await tween(0.55, (k) => swing(d, 1 - k)); }
  await flyTo(hallView(), 1.1); showKeys(true); busy = false;
}

/* ---------------- casino: roulette with credits ---------------- */
const czEl = $('#casino'), CZ = { credits: 500, chip: 5, bets: {}, spinning: false, hist: [] };
try { const v = +localStorage.getItem('mz_credits'); if (v > 0) CZ.credits = v; } catch (e) {}
const czTotal = () => Object.values(CZ.bets).reduce((a, b) => a + b, 0);
function czSave() { try { localStorage.setItem('mz_credits', String(CZ.credits)); } catch (e) {} }
function czBuild() {
  const cells = []; for (let row = 0; row < 3; row++) for (let col = 0; col < 12; col++) { const n = col * 3 + (3 - row); cells.push(`<button data-bet="n${n}" class="${REDS.has(n) ? 'r' : 'b'}" style="grid-row:${row + 1};grid-column:${col + 2}">${n}</button>`); }
  $('#czGrid').innerHTML = `<button data-bet="n0" class="g" style="grid-row:1 / span 3;grid-column:1">0</button>` + cells.join('');
}
function czRender(msg) {
  $('#czCredits').textContent = CZ.credits; $('#czBet').textContent = czTotal();
  czEl.querySelectorAll('[data-bet]').forEach((b) => { const a = CZ.bets[b.dataset.bet]; if (a) b.dataset.amt = a; else delete b.dataset.amt; });
  czEl.querySelectorAll('[data-chip]').forEach((b) => b.classList.toggle('on', +b.dataset.chip === CZ.chip));
  if (msg != null) $('#czMsg').innerHTML = msg; $('#czSpin').disabled = CZ.spinning; czEl.classList.toggle('spinning', CZ.spinning);
}
const _cc = new THREE.PerspectiveCamera();
function czSide() {
  if (portrait()) { czEl.classList.remove('left'); return; }
  _cc.fov = cam.fov; _cc.aspect = aspect(); _cc.updateProjectionMatrix(); _cc.position.copy(cam.pos); _cc.lookAt(cam.target); _cc.updateMatrixWorld();
  const p = interiors.casino.views.wheel.target.clone().project(_cc), x = (p.x * 0.5 + 0.5) * innerWidth, pw = Math.min(410, innerWidth - 24) + 26;
  const overR = Math.max(0, x + 110 - (innerWidth - pw)), overL = Math.max(0, pw - (x - 110)); czEl.classList.toggle('left', overR > 0 && overL < overR);
}
function showCasino(on) { if (on) czSide(); czEl.classList.toggle('off', !on); if (on) czRender(CZ.hist.length ? null : 'Pick a chip, tap numbers or boxes to bet, then spin.'); }
czEl.addEventListener('click', (e) => {
  const chip = e.target.closest('[data-chip]'); if (chip) { CZ.chip = +chip.dataset.chip; czRender(); return; }
  const b = e.target.closest('[data-bet]');
  if (b) { if (CZ.spinning) return; if (CZ.credits < CZ.chip) { czRender('Not enough credits for that chip.'); return; } CZ.bets[b.dataset.bet] = (CZ.bets[b.dataset.bet] || 0) + CZ.chip; CZ.credits -= CZ.chip; czRender(''); return; }
  if (e.target.closest('#czClear')) { if (CZ.spinning) return; CZ.credits += czTotal(); CZ.bets = {}; czRender('Bets cleared.'); return; }
  if (e.target.closest('#czSpin')) czSpin();
});
async function czSpin() {
  if (CZ.spinning) return; const stake = czTotal(); if (!stake) { czRender('Place a bet first.'); return; }
  CZ.spinning = true; czRender('No more bets…'); const k = Math.floor(Math.random() * 37), n = WHEEL[k], T = 8.5; Snd.roll(T);
  czEl.classList.add('watch'); setCam(wheelView());
  await interiors.casino.wheel.spin(k, T); await sleep(1100);
  if (state === 'casino') setCam(casinoView()); czEl.classList.remove('watch');
  const red = REDS.has(n), col = n === 0 ? 'green' : red ? 'red' : 'black'; let win = 0;
  for (const [key, amt] of Object.entries(CZ.bets)) {
    const hit = key[0] === 'n' ? +key.slice(1) === n : n !== 0 && ((key === 'red' && red) || (key === 'black' && !red) || (key === 'odd' && n % 2 === 1) || (key === 'even' && n % 2 === 0) || (key === 'low' && n <= 18) || (key === 'high' && n >= 19));
    if (hit) win += key[0] === 'n' ? amt * 36 : amt * 2;
  }
  CZ.credits += win; CZ.bets = {}; CZ.spinning = false; CZ.hist.unshift({ n, c: col[0] }); if (CZ.hist.length > 12) CZ.hist.length = 12;
  $('#czHist').innerHTML = CZ.hist.map((h) => `<i class="${h.c}">${h.n}</i>`).join('');
  let msg = `<b class="${col[0]}">${n} ${col.toUpperCase()}</b> · ` + (win ? `you win ${win}` : `the house takes ${stake}`);
  if (win) Snd.chime(win >= stake * 10);
  if (CZ.credits < 5) { CZ.credits += 100; msg += '<br>Out of credits: +100.'; }
  czSave(); czRender(msg);
}

/* ---------------- lobby postcard: a real render of the place, printed like a souvenir ---------------- */
function makePostcard() {
  const W = 640, H = 430, rt = new THREE.WebGLRenderTarget(W, H, { samples: 4 }), pc = new THREE.PerspectiveCamera(34, W / H, 0.5, 8000);
  pc.position.set(26, 15, 44); pc.lookAt(-3, 6.5, -2);
  const r0 = world.rotation.y, il = introLights.map((o) => o.l.intensity), mo = bigMoon.material.opacity, ho = moonHalo.material.opacity;
  world.rotation.y = 0; introLights.forEach((o) => (o.l.intensity = o.base ?? 0)); bigMoon.material.opacity = 1; moonHalo.material.opacity = 1; world.updateMatrixWorld(true);
  renderer.setRenderTarget(rt); renderer.render(ext, pc); renderer.setRenderTarget(null);
  world.rotation.y = r0; introLights.forEach((o, i) => (o.l.intensity = il[i])); bigMoon.material.opacity = mo; moonHalo.material.opacity = ho;
  const px = new Uint8Array(W * H * 4); renderer.readRenderTargetPixels(rt, 0, 0, W, H, px); rt.dispose();
  const B = 30, [c, g] = cnv(W + B * 2, H + B * 2 + 80), im = g.createImageData(W, H), d = im.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const si = ((H - 1 - y) * W + x) * 4, di = (y * W + x) * 4;
    for (let ch = 0; ch < 3; ch++) { const v = (px[si + ch] / 255) * 1.35, a = (v * (2.51 * v + 0.03)) / (v * (2.43 * v + 0.59) + 0.14); d[di + ch] = Math.pow(clamp(a, 0, 1), 1 / 2.2) * 255 * 0.9 + [22, 16, 8][ch]; }
    d[di + 3] = 255;
  }
  g.fillStyle = '#efe6cf'; g.fillRect(0, 0, c.width, c.height); g.putImageData(im, B, B);
  g.fillStyle = '#7a2a3a'; g.font = '46px "Yellowtail"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Greetings from Motel Zero', c.width / 2, H + B + 42);
  g.fillStyle = 'rgba(40,30,20,.6)'; g.font = 'bold 13px "Courier Prime"'; g.fillText('THE ASTEROID · VACANCY ALWAYS', c.width / 2, H + B + 82);
  for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(120,90,50,${0.03 + Math.random() * 0.05})`; g.beginPath(); g.arc(Math.random() * c.width, Math.random() * c.height, 30 + Math.random() * 120, 0, 7); g.fill(); }
  return toTex(c);
}

/* ---------------- input ---------------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null, lastPick = 0; const canvasEl = renderer.domElement;
function pickAt(cx, cy) { ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); const list = state === 'exterior' || state === 'pool' || SPOTS.includes(state) ? hotspots.ext : state === 'lobby' || state === 'tv' || state === 'board' ? hotspots.lobby : state === 'projects' ? hotspots.hall : []; if (!list.length) return null; const hits = ray.intersectObjects(list, false); let hit = hits[0]; if (hit && SPOTS.includes(state)) { const f = hits.find((h) => h.object.userData.fx && h.object.userData.go === state); if (f) hit = f; } return hit ? hit.object : null; }
canvasEl.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, pan: panTarget }; canvasEl.setPointerCapture?.(e.pointerId); });
canvasEl.addEventListener('pointermove', (e) => {
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (down && e.pointerType !== 'touch' && e.buttons) { const dx = (e.clientX - down.x) / innerWidth; panTarget = clamp(down.pan - dx * 2.2, -1, 1); }
  if (!TOUCH && !down && performance.now() - lastPick > 90) { lastPick = performance.now(); let o = pickAt(e.clientX, e.clientY); if (o && o.userData.go === state && !o.userData.fx && !o.userData.poolToast) o = null; canvasEl.style.cursor = o ? 'pointer' : 'default'; labels.forEach((L) => L.el.classList.toggle('hot', !!o && o.userData.go === L.go)); }
});
canvasEl.addEventListener('pointerup', (e) => {
  if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (moved > 10 || busy) return;
  const o = pickAt(e.clientX, e.clientY); if (!o) { if (state === 'tv') go('lobby'); return; }
  if (o.userData.ding) { const pl = interiors.lobby?.plunger; if (pl) tween(0.22, (k, r) => (pl.position.y = pl.userData.y0 - Math.sin(r * Math.PI) * 0.025)); Snd.ding(); return; }
  if (o.userData.lobby) { interiors.lobby?.fx?.[o.userData.lobby]?.(); return; }
  if (o.userData.toast) { const tx = o.userData.toast; toast(Array.isArray(tx) ? pick(tx) : tx); return; }
  if (o.userData.fx) { if (state === o.userData.go) { SPOT_FX[o.userData.fx](); return; } pendingFx = o.userData.fx; }
  if (state === 'pool' && o.userData.poolToast) { const f = motel.pool.swimmer; const r0 = f.rotation.y; tween(1.6, (k) => (f.rotation.y = r0 + k * Math.PI * 0.5)); return; }
  if (o.userData.go) go(o.userData.go);
});
canvasEl.addEventListener('pointercancel', () => (down = null));
$('#home').onclick = () => go('exterior'); $('#mute').onclick = () => Snd.toggle();
addEventListener('keydown', (e) => { if (e.key !== 'Escape' || busy) return; if (state === 'tv' || state === 'board') go('lobby'); else if (state === 'room') go('projects'); else if (!['intro', 'loading', 'flying', 'exterior'].includes(state)) go('exterior'); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !['intro', 'loading', 'exterior'].includes(state)) go('exterior'); });

/* ---------------- intro ---------------- */
async function checkIn() {
  if (state !== 'intro') return;
  Snd.init(); Snd.ctx?.resume?.(); Snd.mix('exterior', 1.6); Snd.whoosh(4.2, 0.06); gyroAsk();
  $('#intro').classList.add('gone'); busy = true; state = 'flying'; hud();
  const r0 = world.rotation.y, r1 = Math.ceil(r0 / (Math.PI * 2)) * Math.PI * 2;
  tween(4.0, (k) => { world.rotation.y = lerp(r0, r1, k); introLogo.material.opacity = 1 - Math.min(1, k * 1.5); introLights.forEach((o) => (o.l.intensity = lerp(o.i, o.base ?? 0, clamp(k * 1.6, 0, 1)))); if (bigMoon) { const mo = clamp((k - 0.25) / 0.6, 0, 1); bigMoon.material.opacity = mo; moonHalo.material.opacity = mo; } });
  await flyTo(extView('exterior'), 4.4, 34);
  introLogo.visible = false; introLights.forEach((o) => { if (!(o.base > 0)) o.l.visible = false; }); state = 'exterior'; busy = false; hud();
  const h = (location.hash || '').slice(1); if (h && (PROJECTS[h] || ['lobby', 'landing', 'projects', 'pool', 'about', 'contact', 'board', 'casino'].includes(h))) go(h);
}
$('#checkin').onclick = checkIn;

function onResize() {
  if (pr > prCap()) { pr = prCap(); renderer.setPixelRatio(pr); } renderer.setSize(innerWidth, innerHeight); camera.aspect = aspect(); camera.updateProjectionMatrix(); sizeFX();
  if (state === 'intro') setCam(extView('intro')); else if (state === 'exterior') setCam(extView('exterior')); else if (state === 'landing') setCam(parkView());
  else if (state === 'lobby') setCam(inView(interiors.lobby.views.lobby, 50, false)); else if (state === 'board') setCam(boardView()); else if (state === 'tv') setCam({ ...interiors.lobby.views.tv, fov: portrait() ? vfovFor(27, 40) : vfovFor(58, 48) }); else if (state === 'casino') { setCam(casinoView()); czSide(); } else if (state === 'room') setCam(inView(interiors[currentRoom].views.room));
  else if (state === 'projects') setCam(hallView()); else if (state === 'pool' || SPOTS.includes(state)) setCam(extView(state));
}
addEventListener('resize', onResize);

/* ---------------- loop ---------------- */
const clock = new THREE.Clock(); let fpsAcc = 0, fpsN = 0; const FAST = new URLSearchParams(location.search).has('fast'); const DTMAX = FAST ? 0.5 : 0.05; let perfT = 0, perfN = 0, perfStage = 0, perfMax = 0; const _up = new THREE.Vector3(), _fw = new THREE.Vector3();
let spaceUp = [], bigMoon = null, moonHalo = null, introLights = []; const _sw = new THREE.Vector3();
// one broken animation shouldn't freeze the frame: report it once and carry on
const safe = (f, a, b) => { try { f(a, b); } catch (e) { if (!f._err) { f._err = 1; console.error(e); } } };
function loop() {
  requestAnimationFrame(loop);
  const rdt = clock.getDelta(), dt = Math.min(DTMAX, rdt), t = clock.elapsedTime;
  runTweens(dt);
  if (state === 'intro' || state === 'loading') world.rotation.y += dt * 0.05;
  if (introLogo.visible) {
    const P = portrait(), D = 100, half = D * Math.tan((camera.fov * Math.PI) / 360);
    _up.set(0, 1, 0).applyQuaternion(camera.quaternion); camera.getWorldDirection(_fw);
    introLogo.position.copy(camera.position).addScaledVector(_fw, D).addScaledVector(_up, half * (P ? 0.42 : 0.38) + Math.sin(t * 0.8) * 0.6);
    introLogo.quaternion.copy(camera.quaternion); const wmax = 2 * half * aspect() * 0.86; introLogo.scale.setScalar(Math.min(P ? 999 : half * 1.25, wmax));
  }
  if (active === ext) { updateCars(dt, t); if (state !== 'intro' && state !== 'loading') carSpawner(dt); updateFlickers(dt, t); extUp.forEach((f) => safe(f, t, dt)); spaceUp.forEach((f) => safe(f, t, dt)); }
  else { const I = Object.values(interiors).find((x) => x.scene === active); I?.up.forEach((f) => safe(f, dt, t)); }
  if (interiors.casino && active !== interiors.casino.scene && interiors.casino.wheel.spinning) interiors.casino.up.forEach((f) => safe(f, dt, t));
  if (state === 'pool' && !busy) { motel.pool.swimmer.getWorldPosition(_sw); _sw.lerp(extView('pool').target, 0.6); cam.target.lerp(_sw, 1 - Math.exp(-dt * 1.2)); }
  if (motel && motel.spots) motel.spots.diner.show(state === 'diner');
  applyCamera(dt, t); updateLabels();
  if (FX === 'none') renderer.render(active, camera);
  else { renderer.setRenderTarget(fxRT); renderer.render(active, camera); renderer.setRenderTarget(null); fxMat.uniforms.tDiffuse.value = fxRT.texture; fxMat.uniforms.time.value = t % 1000; renderer.render(fxScene, fxCam); }
  // adaptive resolution: drop quickly when frames run long, creep back up when there's headroom
  if (!FAST && !document.hidden && !busy) { perfT += rdt; perfN++; perfMax = Math.max(perfMax, rdt); if (perfT > 1.0) { const fps = perfN / perfT, stall = perfMax > 0.2; perfT = 0; perfN = 0; perfMax = 0;
    if (!stall) {
      // a level that ran slow becomes the ceiling, so it never climbs back into it (no see-sawing)
      if (fps < 44 && pr > PR_MIN) { prCeil = Math.max(PR_MIN, pr - 0.05); setPR(Math.max(PR_MIN, pr - (fps < 28 ? 0.25 : 0.12))); perfStage = 0; }
      else if (fps > 100 && pr < prCap()) setPR(Math.min(prCap(), pr + 0.2));
      else if (fps > 57) { if (++perfStage >= 3 && pr < prCap()) { setPR(Math.min(prCap(), pr + 0.1)); perfStage = 0; } } else perfStage = 0;
    } } }
  fpsAcc += rdt; fpsN++; if (fpsAcc > 0.5) { const el = document.getElementById('fps'); if (el) el.textContent = `${Math.round(fpsN / fpsAcc)} fps · ${state} · calls ${renderer.info.render.calls} · tris ${(renderer.info.render.triangles / 1000) | 0}k`; fpsAcc = 0; fpsN = 0; }
}

/* ---------------- boot ---------------- */
async function fontsReady() { try { await Promise.race([Promise.all(['40px "Bebas Neue"', '40px "Special Elite"', '40px "Yellowtail"', '40px "Courier Prime"', 'bold 40px "Courier Prime"'].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 3500))]); } catch (e) {} }
const prog = (p) => { const b = $('#loadbar'); if (b) b.style.transform = `scaleX(${p})`; const l = $('#loadlbl'); if (l) l.textContent = p >= 1 ? 'ready' : `loading ${Math.round(p * 100)}%`; };
(async function boot() {
  seed(20220);
  useScene(ext, 0.9); setCam(extView('intro')); camera.fov = cam.fov; camera.updateProjectionMatrix();
  loop();
  prog(0.05, 'warming up the neon'); await fontsReady(); await sleep(20);
  logoTex = new THREE.TextureLoader().load('assets/logo.webp'); logoTex.colorSpace = THREE.SRGBColorSpace; logoTex.anisotropy = 8;
  introLogo.material.map = logoTex; introLogo.material.needsUpdate = true;
  prog(0.15, 'surveying the asteroid'); const sp = buildSpace(ext, world); spaceUp = sp.up; bigMoon = sp.bigMoon; moonHalo = sp.moonHalo; bigMoon.material.opacity = 0; moonHalo.material.opacity = 0; introLights = sp.introLights; introLights.forEach((o) => (o.l.intensity = o.i)); await sleep(20);
  prog(0.35, 'pouring the parking lot'); motel = buildMotel(world, { PROJECTS, ROOM_COLORS, KUR_HUES, logoTex });
  hotspots.ext.push(...motel.hot); labelsDef = motel.labels; flickers = motel.flickers; doors = motel.doors; extUp.push(...motel.up); await sleep(20);
  labels = labelsDef.map((L) => { const el = document.createElement('div'); el.className = 'lbl'; el.style.setProperty('--c', L.color); el.innerHTML = `<i></i>${L.text}`; el.onclick = () => go(L.go); el.setAttribute('role', 'button'); el.tabIndex = 0; el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(L.go); } }; labelsEl.appendChild(el); return { ...L, el }; });
  const ctx = { logoTex, tvVideo, envTex, KUR_HUES, sfx: (n, v) => Snd[n]?.(v) }; try { ctx.postcardTex = makePostcard(); } catch (e) { console.warn('postcard', e); }
  prog(0.55, 'making the beds'); interiors.lobby = buildLobby(ctx); hotspots.lobby.push(...interiors.lobby.hot); await sleep(20);
  prog(0.7, 'making the beds'); interiors.hyodo = buildHyodo(ctx); interiors.freddie = buildFreddie(ctx); await sleep(20);
  prog(0.85, 'making the beds'); interiors.alien = buildAlien(ctx); interiors.fmk = buildFmk(ctx); interiors.kur = buildKur(ctx); interiors.orchid = buildOrchid(ctx); await sleep(20);
  prog(0.88, 'shuffling the cards'); interiors.casino = buildCasino({ ...ctx, onSlotWin: () => { if (state === 'casino') Snd.slot(); }, onFret: (v) => Snd.fret(v) }); czBuild(); await sleep(20);
  prog(0.89, 'sweeping the garage'); interiors.parking = buildParking({ ...ctx, onCar: () => { if (state === 'landing') Snd.whoosh(2.6, 0.1); } }); await sleep(20);
  prog(0.9, 'vacuuming the hallway'); interiors.hall = buildHall({ ...ctx, PROJECTS, ROOM_COLORS }); hotspots.hall.push(...interiors.hall.hot); await sleep(20);
  const fob = (id, cls) => { const p = PROJECTS[id]; return `<button class="fob ${cls}" data-go="${id}" style="--c:${p.css}${p.t ? ';--t:' + p.t : ''}"><b>${p.title}</b><span>${p.room}</span></button>`; };
  keysEl.innerHTML = `<div class="row">${['hyodo', 'orchid', 'kur'].map((id) => fob(id, 'big')).join('')}</div><div class="row">${['freddie', 'alien', 'fmk'].map((id) => fob(id, 'sm')).join('')}</div>`;
  prog(0.95, 'turning on the vacancy sign');
  // light and lean: a handful of local lights per scene, static geometry merged
  trimLights(ext, 6); batchStatic(world, [...extUp, ...spaceUp, (t, dt) => updateFlickers(dt, t)], 'tdt', Object.values(doors).flatMap((d) => [d.hinge, d.voidM]));
  // the intro's key and rim lights go dark after check-in; compile the exterior for that lighting now, so switching them off later costs nothing
  { const off = introLights.filter((o) => !(o.base > 0)); off.forEach((o) => (o.l.visible = false)); try { renderer.compileAsync ? renderer.compileAsync(ext, camera).catch(() => {}) : renderer.compile(ext, camera); } catch (e) {} off.forEach((o) => (o.l.visible = true)); }
  for (const [k, I] of Object.entries(interiors)) { trimLights(I.scene, 4); batchStatic(I.scene, I.up, 'dtt', k === 'hall' ? Object.values(I.doors).flatMap((d) => d.pivots) : I.dyn || []); }
  try { for (const I of Object.values(interiors)) renderer.compile(I.scene, camera); renderer.compile(ext, camera); } catch (e) {}
  prog(1, 'ready'); await sleep(150);
  beginIntro();
})();
// the opening is silent; the first tap anywhere (usually Check in) wakes the space drone
function wakeAudio() { if (Snd.ctx) return; Snd.init(); Snd.ctx?.resume?.(); if (state === 'intro') Snd.mix('intro'); hud(); }
addEventListener('pointerdown', wakeAudio, { capture: true, once: true }); addEventListener('keydown', wakeAudio, { capture: true, once: true });
let tvWas = false;
document.addEventListener('visibilitychange', () => { const h = document.hidden; Snd.away(h); if (h) { tvWas = !tvVideo.paused; tvVideo.pause(); } else if (state === 'tv' && tvWas) tvVideo.play().catch(() => {}); });
addEventListener('pagehide', () => Snd.away(true));
// phones sometimes refuse to resume audio without a touch: the next touch does it
addEventListener('pointerdown', () => { if (Snd.ctx && Snd.on && Snd.ctx.state !== 'running' && !document.hidden) { Snd.ctx.resume?.().catch?.(() => {}); if (Snd._was) Snd.music?.play().catch(() => {}); } }, { capture: true });
function beginIntro() {
  if (state !== 'loading') return;
  state = 'intro'; hud(); $('#loader').classList.add('gone');
  const b = $('#checkin'); b.disabled = false; b.innerHTML = 'Check in<small>tap to enter</small>';
  if (new URLSearchParams(location.search).has('auto')) checkIn();
}

/* ---------------- debug (preview only) ---------------- */
// the debug panel only exists in previews: on motelzero.com it removes itself (add ?debug to bring it back)
// the debug panel only exists with ?debug in the address
if (!DEBUG) { document.getElementById('dbgbtn')?.remove(); document.getElementById('dbg')?.remove(); }
const dbgBtn = document.getElementById('dbgbtn');
if (dbgBtn) {
  dbgBtn.onclick = () => document.getElementById('dbg').classList.toggle('on');
  const j = document.getElementById('dbgjump');
  ['exterior', 'lobby', 'tv', 'board', 'landing', 'pool', 'casino', 'projects', 'kur', 'hyodo', 'orchid', 'freddie', 'alien', 'fmk'].forEach((n) => { const b = document.createElement('button'); b.textContent = n; b.onclick = () => { if (state === 'intro') checkIn(); else go(n); }; j.appendChild(b); });
  [['look: classic', 'classic'], ['look: video', 'video'], ['look: mix', 'mix']].forEach(([lbl, v]) => { const b = document.createElement('button'); b.textContent = lbl + (LOOK === v ? ' ✓' : ''); b.className = 'fx'; b.onclick = () => { try { localStorage.setItem('mz_look', v); } catch (e) {} const u = new URL(location.href); u.searchParams.delete('look'); location.href = u.toString(); }; j.appendChild(b); });
  [['filter: off', 'none'], ['vhs (very subtle)', 'vhs'], ['pixel (very subtle)', 'pixel'], ['film', 'film']].forEach(([lbl, m]) => { const b = document.createElement('button'); b.textContent = lbl; b.className = 'fx'; b.onclick = () => setFX(m); j.appendChild(b); });
  window.__mz = { go, stepExt: (n, dt = 0.05) => { let t = clock.elapsedTime; for (let i = 0; i < n; i++) { t += dt; extUp.forEach((f) => f(t, dt)); } }, get motel() { return motel; }, get state() { return state; }, get busy() { return busy; }, checkIn, renderer, camera, cam, Snd, beginIntro, setFX, get doors() { return doors; }, interiors, extView, setCam, useScene, ext, hallView, swing };
}
