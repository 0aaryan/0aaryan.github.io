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
    look: { x: 0, y: 0 }, lookT: { x: 0, y: 0 },
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

  // ---- pointer
  addEventListener('pointermove', e => {
    state.lookT.x = (e.clientX / innerWidth) * 2 - 1;
    state.lookT.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { state.lookT.x = 0; state.lookT.y = 0; });

  // ---- idle life: blinks at natural intervals, occasional brow lift
  let nextBlink = 1.8, blinkT = -1;
  function idle(t, dt) {
    if (reduced) return;
    if (t > nextBlink && blinkT < 0) { blinkT = 0; nextBlink = t + 2.4 + Math.random() * 3.5; }
    let b = 0;
    if (blinkT >= 0) {
      blinkT += dt;
      const p = blinkT / 0.17; b = p < 1 ? Math.sin(p * Math.PI) : 0;
      if (p >= 1) blinkT = -1;
    }
    state.expr.eyeBlinkLeft = state.expr.eyeBlinkRight = Math.max(b, state.exprT.eyeBlinkLeft || 0);
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
  let last = performance.now(), visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; last = performance.now(); });

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 1 / 20); last = now;
    if (!visible || !state.ready) return;
    const t = now / 1000;
    state.look.x = damp(state.look.x, state.lookT.x, 5, dt);
    state.look.y = damp(state.look.y, state.lookT.y, 5, dt);
    const sway = reduced ? 0 : 1;
    head.rotation.y = state.look.x * 0.42 + Math.sin(t * 0.35) * 0.03 * sway;
    head.rotation.x = state.look.y * 0.22 + Math.sin(t * 0.5) * 0.015 * sway;
    head.rotation.z = -state.look.x * 0.04;
    head.position.y = Math.sin(t * 0.9) * 0.012 * sway;   // breathing
    state.on = parseFloat(canvas.style.opacity || '1') > 0.01;
    if (!state.on) return;
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const ease = 1 - Math.pow(1 - state.intro, 3);
    rig.position.set(state.dock.x * halfH * camera.aspect, state.dock.y * halfH - (1 - ease) * 0.12, 0);
    rig.scale.setScalar(state.dock.s * (0.94 + 0.06 * ease));
    rig.rotation.y = state.dock.ry - (1 - ease) * 0.5;
    idle(t, dt);
    for (const k in state.exprT) if (k !== 'eyeBlinkLeft' && k !== 'eyeBlinkRight') state.expr[k] = damp(state.expr[k] ?? 0, state.exprT[k], 9, dt);
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
