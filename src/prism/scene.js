import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// A real bevel-cut, closed triangular solid. No raster sprite or CSS rotation.
export function createPrismGeometry() {
  const profile = new THREE.Shape();
  profile.moveTo(-1.45, -1.28);
  profile.lineTo(1.47, -1.28);
  profile.lineTo(0.14, 1.68);
  profile.closePath();
  const geometry = new THREE.ExtrudeGeometry(profile, {
    depth: 1.12, steps: 1, bevelEnabled: true,
    bevelThickness: 0.075, bevelSize: 0.075, bevelSegments: 1,
    curveSegments: 1,
  });
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

// These light paths illustrate review states. They are not scan telemetry.
export function opticalPaths(stage) {
  const incoming = [[-5.8, 0.22, -0.16], [-1.3, 0.22, -0.16]];
  const refracted = [[-1.3, 0.22, -0.16], [0.2, -0.16, 0.22], [1.05, -0.02, 0.48]];
  const outputs = [
    [[1.05, -0.02, 0.48], [5.4, -0.02, 0.48]],
    [[1.05, -0.02, 0.48], [5.4, 1.0, 0.1]],
    [[1.05, -0.02, 0.48], [5.4, -1.08, 0.9]],
  ];
  return { incoming, refracted, outputs, weights: stage === 0 ? [0.22, 0, 0] : stage === 1 ? [0.65, 0.5, 0.36] : [1, 0.08, 0.08] };
}

export async function mountPrism(host, options = {}) {
  let disposed = false;
  let initialized = false;
  let renderer;
  let scene;
  let environmentTarget;
  let raf = 0;
  const cleanups = [];
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'high-performance' });
  if (!context) throw new Error('WEBGL_UNAVAILABLE');
  function dispose() {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(raf);
    cleanups.forEach((cleanup) => cleanup());
    const geometries = new Set(); const materials = new Set();
    scene?.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
    });
    geometries.forEach((geometry) => geometry.dispose()); materials.forEach((material) => material.dispose());
    environmentTarget?.dispose();
    if (renderer) { renderer.dispose(); renderer.forceContextLoss(); }
    canvas.remove();
  }
  try {
  renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.transmissionResolutionScale = 0.75;
  host.append(canvas);

  scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
  camera.position.set(0.1, 0.4, 9.5);
  camera.lookAt(0, 0, 0);
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  try { environmentTarget = pmrem.fromScene(environment, 0.04); }
  finally { environment.dispose(); pmrem.dispose(); }
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 1.6;

  const objects = new THREE.Group();
  scene.add(objects);
  const geometry = createPrismGeometry();
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', metalness: 0, roughness: 0.025,
    transmission: 1, thickness: 1.6, ior: 1.52,
    dispersion: 0.035, clearcoat: 0.3, clearcoatRoughness: 0.025,
    attenuationColor: new THREE.Color('#9fceca'), attenuationDistance: 10,
    specularIntensity: 0.7, envMapIntensity: 1.1,
  });
  const crystal = new THREE.Mesh(geometry, glass);
  objects.add(crystal);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 28), new THREE.LineBasicMaterial({ color: '#6caaa9', transparent: true, opacity: 0.32 }));
  objects.add(edges);
  objects.rotation.set(-0.19, 0.56, -0.17);

  // A locally built optical bench makes transmission and parallax visible.
  const bench = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(15, 10), new THREE.MeshBasicMaterial({ color: '#edf1ef', toneMapped: false }));
  plate.position.z = -1.6;
  bench.add(plate);
  const bars = new THREE.Group();
  const barMaterial = new THREE.MeshBasicMaterial({ color: '#c4d2ce', toneMapped: false });
  for (let i = -12; i <= 12; i++) {
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.016, 9), barMaterial);
    bar.position.set(i * 0.39, 0, -1.55);
    bars.add(bar);
  }
  bench.add(bars);
  scene.add(bench);
  const key = new THREE.DirectionalLight('#ffffff', 4);
  key.position.set(-3, 5, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#83c9c6', 2.5);
  rim.position.set(4, -2, 3);
  scene.add(rim);

  const rays = new THREE.Group();
  scene.add(rays);
  function tube(points, radius, color, opacity) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, radius, 5, false), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, toneMapped: false, depthWrite: false }));
    rays.add(mesh);
    return mesh;
  }
  const paths = opticalPaths(0);
  const input = tube(paths.incoming, 0.015, '#7aaba8', 0.8);
  const inner = tube(paths.refracted, 0.025, '#0c7580', 0.8);
  const outputs = paths.outputs.map((points, i) => tube(points, i === 0 ? 0.019 : 0.011, i === 0 ? '#0c7580' : '#74aaa5', 0));
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.039, 10, 8), new THREE.MeshBasicMaterial({ color: '#0c7580', toneMapped: false }));
  scene.add(pulse);

  let stage = options.stage || 0;
  let paused = !!options.paused;
  let reduced = !!options.reduced;
  let dark = !!options.dark;
  let active = true;
  let clock = 0;
  let lastTime = 0;
  let pointerX = 0;
  let pointerY = 0;
  let angleX = 0;
  let angleY = 0;
  let frames = 0;
  let locked = false;

  function theme() {
    plate.material.color.set(dark ? '#131f24' : '#edf1ef');
    barMaterial.color.set(dark ? '#507d7e' : '#a3bcb5');
    glass.color.set('#ffffff');
    edges.material.color.set(dark ? '#a1cac5' : '#6caaa9');
    input.material.color.set(dark ? '#a6d9d3' : '#7aaba8');
    renderer.setClearColor(dark ? '#131f24' : '#edf1ef', 0);
  }
  function requestDraw() {
    if (initialized && !disposed && active && !document.hidden && !locked && !raf) raf = requestAnimationFrame(draw);
  }
  function draw(time) {
    raf = 0;
    if (disposed || !active || document.hidden || locked) return;
    const dt = Math.min((time - (lastTime || time)) / 1000, 0.05);
    lastTime = time;
    if (!paused && !reduced) clock += dt;
    const targetX = reduced ? 0 : pointerX;
    const targetY = reduced ? 0 : pointerY;
    const damp = reduced ? 1 : 1 - Math.exp(-dt * 8);
    angleX += (targetX - angleX) * damp;
    angleY += (targetY - angleY) * damp;
    objects.rotation.y = 0.56 + angleX * 0.35 + stage * 0.08;
    objects.rotation.x = -0.19 + angleY * 0.17;
    objects.rotation.z = -0.17 + stage * 0.025;
    const next = opticalPaths(stage);
    outputs.forEach((mesh, i) => { mesh.material.opacity = next.weights[i]; });
    inner.material.opacity = stage === 0 ? 0.26 : 0.85;
    const travel = reduced || paused ? 0.6 : (clock * 0.28) % 1;
    pulse.position.set(-5.8 + travel * 4.5, 0.22, -0.16);
    renderer.render(scene, camera);
    frames++;
    host.dataset.frameCount = String(frames);
    host.dataset.stage = String(stage);
    host.dataset.renderer = 'three-webgl2';
    host.dataset.drawCalls = String(renderer.info.render.calls);
    if (!paused && !reduced || Math.abs(targetX - angleX) > 0.002 || Math.abs(targetY - angleY) > 0.002) requestDraw();
  }
  function resize() {
    if (disposed) return;
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // On portrait screens keep the complete prism, not a crop of its face.
    camera.position.z = camera.aspect < 0.9 ? 11.3 : 9.5;
    camera.updateProjectionMatrix();
    requestDraw();
  }
  function move(event) {
    if (reduced) return;
    const box = host.getBoundingClientRect();
    pointerX = ((event.clientX - box.left) / box.width - 0.5) * 2;
    pointerY = ((event.clientY - box.top) / box.height - 0.5) * 2;
    requestDraw();
  }
  function leave() { pointerX = 0; pointerY = 0; requestDraw(); }
  function visibility() {
    lastTime = 0;
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else requestDraw();
  }
  function lost(event) {
    event.preventDefault(); locked = true; cancelAnimationFrame(raf); raf = 0;
    host.dataset.status = 'lost'; options.onFallback?.();
  }
  host.addEventListener('pointermove', move, { passive: true });
  cleanups.push(() => host.removeEventListener('pointermove', move));
  host.addEventListener('pointerleave', leave);
  cleanups.push(() => host.removeEventListener('pointerleave', leave));
  canvas.addEventListener('webglcontextlost', lost);
  cleanups.push(() => canvas.removeEventListener('webglcontextlost', lost));
  document.addEventListener('visibilitychange', visibility);
  cleanups.push(() => document.removeEventListener('visibilitychange', visibility));
  const resizeObserver = new ResizeObserver(resize);
  cleanups.push(() => resizeObserver.disconnect());
  resizeObserver.observe(host);
  const intersection = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    if (active) { lastTime = 0; requestDraw(); }
    else { cancelAnimationFrame(raf); raf = 0; }
  }, { rootMargin: '0px' });
  cleanups.push(() => intersection.disconnect());
  intersection.observe(host);
  const api = {
    setStage(value) { if (Number.isInteger(value) && value >= 0 && value <= 2) stage = value; requestDraw(); },
    setPaused(value) { paused = value; lastTime = 0; requestDraw(); },
    setReduced(value) { reduced = value; lastTime = 0; requestDraw(); },
    setDark(value) { dark = value; theme(); requestDraw(); },
    turn(direction) { pointerX = Math.max(-1, Math.min(1, pointerX + direction * 0.5)); requestDraw(); },
    dispose,
  };
    theme(); resize();
    await renderer.compileAsync(scene, camera);
    if (!disposed && !locked) {
      initialized = true;
      renderer.render(scene, camera);
      host.dataset.status = 'ready';
      options.onReady?.();
      requestDraw();
    }
    return api;
  } catch (error) {
    dispose();
    throw error;
  }
}
