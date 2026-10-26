// The avatar stage: one fixed WebGL canvas that persists behind the page.
// The head tracks the pointer, blinks on its own, and reacts to the page
// (a brow lift on CTA hover and when the contact section arrives).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const damp = (a, b, lambda, dt) => THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));

export function createAvatar(canvas, { reduced = false, onProgress } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 50);
  camera.position.set(0, 0, 4.2);

  // close to 1:1 on the painted albedo; a cool rim separates the silhouette from the dark page
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6d6a66, 1.0));
  const key = new THREE.DirectionalLight(0xfff3e6, 0.75); key.position.set(-1.4, 1.5, 2.4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xd8e4ff, 1.4); rim.position.set(1.8, 0.9, -1.8); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xffd9b8, 0.6); rim2.position.set(-1.8, 0.4, -1.6); scene.add(rim2);

  const rig = new THREE.Group();      // dock position/scale driven by scroll
  const head = new THREE.Group();     // pointer look + idle sway
  rig.add(head); scene.add(rig);

  const state = {
    ready: false,
    look: { x: 0, y: 0 }, lookV: { x: 0, y: 0 }, lookT: { x: 0, y: 0 },
    scrollV: 0,                           // smoothed scroll velocity (px per 60 Hz frame)
    dock: { x: 0, y: 0, s: 1, ry: 0 },   // tweened by main.js; x/y in view half-widths/heights
    intro: 0, introOp: 0,                 // 0→1 entrance after the loader
    on: true,                             // false while the canvas is faded out: skip rendering
    expr: {}, exprT: {},
  };
  let morphs = [];
  const setT = (name, v) => { state.exprT[name] = v; };

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const ready = new Promise((resolve, reject) => {
    loader.load(`${import.meta.env.BASE_URL}models/avatar.glb`, gltf => {
      const root = gltf.scene;
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
      const s = 1.6 / size.y;
      root.scale.setScalar(s);
      root.position.copy(ctr).multiplyScalar(-s);
      root.traverse(o => {
        if (!o.isMesh) return;
        o.frustumCulled = false;
        if (o.morphTargetDictionary) morphs.push(o);
        const m = o.material; if (!m) return;
        if (m.name === 'M_avatar') { m.roughness = 0.9; m.metalness = 0; m.emissiveMap = m.map; m.emissive.setScalar(0.45); }
        if (m.name === 'M_teeth') m.emissive.setRGB(0.35, 0.34, 0.32);
        if (m.name === 'M_lens') { m.depthWrite = false; o.renderOrder = 2; m.roughness = 0.7; m.opacity = 0.1; }
      });
      head.add(root);
      for (const n of Object.keys(morphs[0]?.morphTargetDictionary || {})) state.expr[n] = state.exprT[n] = 0;
      // compile shaders now so the first visible frame doesn't hitch
      try { if (!renderer.getContext().isContextLost()) renderer.compile(scene, camera); } catch { /* compiled lazily on first render */ }
      state.ready = true; resolve();
    }, e => e.total && onProgress?.(e.loaded / e.total), reject);
  });

  function applyMorphs() {
    for (const m of morphs) {
      const d = m.morphTargetDictionary, inf = m.morphTargetInfluences;
      for (const k in state.expr) { const i = d[k]; if (i !== undefined) inf[i] = state.expr[k]; }
    }
  }

  // ---- attention: the head follows the mouse, a finger, or the phone's tilt;
  // with none of those it looks around by itself
  let lastInput = -1e9, poke = 0;
  const now = () => performance.now() / 1000;
  const aim = (x, y) => {
    const nx = (x / innerWidth) * 2 - 1, ny = (y / innerHeight) * 2 - 1;
    if (Math.hypot(nx - state.lookT.x, ny - state.lookT.y) > 0.5) poke = Math.max(poke, 0.5);   // big gaze shifts come with a blink
    state.lookT.x = nx; state.lookT.y = ny; lastInput = now();
  };
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') aim(e.clientX, e.clientY); }, { passive: true });
  // touch: pointer events get cancelled as soon as the page scrolls, touch events keep coming
  addEventListener('touchstart', e => { const t = e.touches[0]; aim(t.clientX, t.clientY); poke = 1; }, { passive: true });
  addEventListener('touchmove', e => { const t = e.touches[0]; aim(t.clientX, t.clientY); }, { passive: true });
  document.addEventListener('pointerleave', () => { lastInput = -1e9; });
  // tilt (no permission prompt: only where the browser gives it freely)
  let tilt = null;
  addEventListener('deviceorientation', e => {
    if (e.gamma == null) return;
    const g = THREE.MathUtils.clamp(e.gamma / 30, -1, 1), b = THREE.MathUtils.clamp((e.beta - 45) / 35, -1, 1);
    if (!tilt) tilt = { g, b, g0: g, b0: b };
    tilt.g = g; tilt.b = b;
  }, { passive: true });

  // ---- idle life: natural blinks (some doubled), a wandering gaze when nobody
  // is steering, and small brow/eye movements so the face never freezes
  let nextBlink = 1.2, blinkT = -1, blinksLeft = 0;
  let nextWander = 0, wander = { x: 0, y: 0 };
  let nextMicro = 2.5;
  const micro = {}, microT = {};
  const MICRO = [
    { browInnerUp: 0.35 }, { browOuterUpLeft: 0.4, browOuterUpRight: 0.15 }, { browOuterUpRight: 0.4, browOuterUpLeft: 0.15 },
    { eyeSquintLeft: 0.3, eyeSquintRight: 0.3, browDownLeft: 0.15, browDownRight: 0.15 },
    { eyeWideLeft: 0.3, eyeWideRight: 0.3, browInnerUp: 0.2 }, { browDownLeft: 0.3, browDownRight: 0.3 },
  ];
  const rand = (a, b) => a + Math.random() * (b - a);
  function idle(t, dt) {
    // blink: fast close, slower open; 1 in 5 is a double blink; a tap or a big gaze shift triggers one
    if (poke > 0.3 && blinkT < 0 && t > nextBlink - 2) { nextBlink = t; }
    poke = Math.max(0, poke - dt * 2);
    if (t > nextBlink && blinkT < 0) {
      blinkT = 0;
      if (blinksLeft > 0) blinksLeft--; else if (Math.random() < 0.2) blinksLeft = 1;
      nextBlink = t + (blinksLeft ? 0.22 : rand(1.4, 4.2));
    }
    let b = 0;
    if (blinkT >= 0) {
      blinkT += dt;
      const c = 0.06, o = 0.13;
      b = blinkT < c ? blinkT / c : 1 - (blinkT - c) / o;
      if (blinkT >= c + o) { blinkT = -1; b = 0; }
      b = Math.max(0, Math.min(1, b));
      b = b * b * (3 - 2 * b);
    }
    state.expr.eyeBlinkLeft = state.expr.eyeBlinkRight = Math.max(b, state.exprT.eyeBlinkLeft || 0);

    // wandering gaze once input has been quiet for a while (always on touch screens between touches)
    if (t > nextWander) {
      wander = { x: rand(-0.55, 0.55), y: rand(-0.35, 0.25) };
      if (Math.random() < 0.3) wander = { x: rand(-0.12, 0.12), y: rand(-0.1, 0.05) };   // back to the viewer
      nextWander = t + rand(1.6, 4);
      if (Math.random() < 0.5) poke = Math.max(poke, 0.5);
    }

    // micro-expressions
    if (t > nextMicro) {
      for (const k in microT) microT[k] = 0;
      if (Math.random() < 0.75) Object.assign(microT, MICRO[Math.floor(Math.random() * MICRO.length)]);
      nextMicro = t + rand(1.8, 4.5);
      setTimeout(() => { for (const k in microT) microT[k] = 0; }, rand(500, 1300));
    }
    for (const k in microT) micro[k] = damp(micro[k] || 0, microT[k], 6, dt);
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    // keep the head the same apparent size on portrait screens
    camera.position.z = camera.aspect < 0.8 ? 4.2 / Math.max(camera.aspect, 0.5) * 0.8 : 4.2;
  }
  addEventListener('resize', resize); resize();

  const _v = new THREE.Vector3(), _w = new THREE.Vector3();
  let lastB = -1, lastF = -1;
  let last = performance.now(), visible = true, lastY = scrollY;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; last = performance.now(); });

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 1 / 20); last = now;
    if (!visible || !state.ready) return;
    const t = now / 1000;
    if (!reduced) idle(t, dt);
    const sy = scrollY; state.scrollV = damp(state.scrollV, (sy - lastY) / Math.max(dt * 60, 0.5), 6, dt); lastY = sy;
    // where to look: live input wins; then the phone's tilt; then the wandering gaze
    const quiet = t - lastInput > 2.2;
    let tx = state.lookT.x, ty = state.lookT.y;
    if (quiet) {
      tx = wander.x; ty = wander.y;
      if (tilt) { tx = THREE.MathUtils.clamp(tilt.g - tilt.g0, -1, 1) * 0.9 + wander.x * 0.3; ty = THREE.MathUtils.clamp(tilt.b - tilt.b0, -1, 1) * 0.6 + wander.y * 0.3; }
    }
    if (reduced) { tx = state.lookT.x; ty = state.lookT.y; }
    // scrolling nods the head along with the page
    ty += THREE.MathUtils.clamp(state.scrollV * 0.02, -0.35, 0.35);
    // a slightly underdamped spring: the head settles with a hint of follow-through instead of gliding
    const k = 38, c = 9.5;
    state.lookV.x += ((tx - state.look.x) * k - state.lookV.x * c) * dt;
    state.lookV.y += ((ty - state.look.y) * k - state.lookV.y * c) * dt;
    state.look.x += state.lookV.x * dt; state.look.y += state.lookV.y * dt;
    const sway = reduced ? 0 : 1;
    head.rotation.y = state.look.x * 0.42 + (Math.sin(t * 0.35) * 0.03 + Math.sin(t * 0.83 + 2) * 0.012) * sway;
    head.rotation.x = state.look.y * 0.22 + (Math.sin(t * 0.5) * 0.015 + Math.sin(t * 1.1 + 1) * 0.006) * sway;
    head.rotation.z = -state.look.x * 0.05 - state.lookV.x * 0.012 + Math.sin(t * 0.27 + 4) * 0.012 * sway;
    head.position.y = (Math.sin(t * 1.3) * 0.5 + 0.5) * 0.014 * sway;   // breathing
    state.on = parseFloat(canvas.style.opacity || '1') > 0.01;
    if (!state.on) return;
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const ease = 1 - Math.pow(1 - state.intro, 3);
    rig.position.set(state.dock.x * halfH * camera.aspect, state.dock.y * halfH - (1 - ease) * 0.12, 0);
    rig.scale.setScalar(state.dock.s * (0.94 + 0.06 * ease));
    rig.rotation.y = state.dock.ry - (1 - ease) * 0.5;
    for (const k in state.exprT) if (k !== 'eyeBlinkLeft' && k !== 'eyeBlinkRight') state.expr[k] = Math.min(1, damp(state.expr[k] ?? 0, state.exprT[k] + (micro[k] || 0), 9, dt));
    applyMorphs();
    // fade the cut-off bottom of the bust: project its base to the screen and
    // move the canvas mask there (cheaper and sort-free compared with alpha in the shader)
    head.updateWorldMatrix(true, false);
    _v.set(0, -0.8, 0); head.localToWorld(_v); _v.project(camera);
    _w.set(0, -0.32, 0); head.localToWorld(_w); _w.project(camera);
    const b = (1 - (_v.y * 0.5 + 0.5)) * 100, f = (1 - (_w.y * 0.5 + 0.5)) * 100;
    if (Math.abs(b - lastB) > 0.05 || Math.abs(f - lastF) > 0.05) {
      canvas.style.setProperty('--fade-start', f.toFixed(2) + '%'); canvas.style.setProperty('--fade-end', b.toFixed(2) + '%');
      lastB = b; lastF = f;
    }
    renderer.render(scene, camera);
  }

  return {
    ready, state, renderer, frame,
    curious(on) { setT('browInnerUp', on ? 0.55 : 0); setT('browOuterUpLeft', on ? 0.35 : 0); setT('eyeWideLeft', on ? 0.2 : 0); setT('eyeWideRight', on ? 0.2 : 0); },
    set: setT,
  };
}
