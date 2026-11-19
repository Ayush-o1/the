// The 3D flight. Loaded with a dynamic import after first paint, so the page is readable before
// any of this code arrives. Everything here is an enhancement over the HTML.
import { Scene, PerspectiveCamera, DirectionalLight, AmbientLight } from 'three';
import { gsap } from 'gsap';
import { createScroll } from '../core/scroll.js';
import { collectStops, measureStops } from '../core/sectors.js';
import { stopScrolls, stopParam, nearestStop } from '../core/route-math.js';
import { damp } from '../core/damp.js';
import { TIERS, createTierMonitor } from '../core/tier.js';
import { createRenderer } from './renderer.js';
import { createStarfield } from './starfield.js';
import { createProbe } from './probe.js';
import { createMarkers } from './markers.js';
import { createCameraPath } from './camera-path.js';
import { buildRoute } from './route.js';

const FOLLOW_RATE = 6; // docs/PLAN.md 5.2: tune between 4 and 8

export function startScene({ env, startTier, onContextLost, onSector, onFrame }) {
  const stops = collectStops();
  const curve = buildRoute(stops.map((stop) => stop.id));

  const rendererBundle = createRenderer({ onContextLost });
  const { renderer, canvas } = rendererBundle;
  const scene = new Scene();
  const camera = new PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);

  const sun = new DirectionalLight(0xffe2b0, 2.4);
  sun.position.set(30, 40, 20);
  scene.add(sun, new AmbientLight(0x6a6f85, 1.1));

  const starfield = createStarfield();
  const markers = createMarkers();
  const probe = createProbe();
  scene.add(starfield.object, markers.object, probe.object);
  const rig = createCameraPath(curve, camera, probe.object);

  const scroll = createScroll();
  const tierMonitor = createTierMonitor(startTier);
  let tier = startTier;

  let scrolls = [];
  let param = 0;
  let steer = 0;
  let steerTarget = 0;
  let thrust = 0;
  let sectorIndex = -1;
  let fps = 60;
  let stopped = false;
  let firstFrame = true;

  function applyTier(name) {
    tier = name;
    const settings = TIERS[name];
    rendererBundle.setDprCap(settings.dpr);
    starfield.setCount(settings.stars);
  }

  function measure() {
    scrolls = stopScrolls(measureStops(stops), window.innerHeight);
  }

  function resize() {
    rendererBundle.resize();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    measure();
  }

  // Pointer steering: a small lateral offset. Not on touch screens.
  function onPointerMove(event) {
    if (env.touch) return;
    steerTarget = (event.clientX / window.innerWidth) * 2 - 1;
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(document.body);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  applyTier(startTier);
  resize();
  document.body.prepend(canvas);

  // Start where the page already is, so a deep link does not begin with a flight from the pad.
  param = stopParam(scrolls, window.scrollY);

  function tick(time, deltaMs) {
    if (stopped || document.hidden) return;
    const dt = Math.min(deltaMs / 1000, 0.1);
    if (dt <= 0) return;

    const target = stopParam(scrolls, window.scrollY);
    const previous = param;
    param = damp(param, target, FOLLOW_RATE, dt);
    const previousSteer = steer;
    steer = damp(steer, steerTarget, 4, dt);

    const speed = Math.abs(param - previous) / dt; // stops per second
    thrust = damp(thrust, Math.min(1, speed / 1.5), 8, dt);

    rig.update(param, stops.length, steer, (steer - previousSteer) / dt);
    const workStart = performance.now();
    probe.update(time, thrust);
    starfield.update(time, rendererBundle.pixelRatio, window.innerHeight);
    renderer.render(scene, camera);

    fps = damp(fps, 1000 / Math.max(deltaMs, 1), 3, dt);
    const nextTier = tierMonitor.sample(deltaMs, performance.now() - workStart);
    if (nextTier) applyTier(nextTier);

    const nearest = nearestStop(scrolls, window.scrollY);
    if (nearest !== sectorIndex) {
      sectorIndex = nearest;
      onSector(stops[nearest], nearest);
    }
    onFrame({ param, stops: stops.length, sectorIndex });

    if (firstFrame) {
      firstFrame = false;
      canvas.classList.add('on');
      document.documentElement.classList.add('scene');
    }
  }

  gsap.ticker.add(tick);

  return {
    stops,
    getStats() {
      const info = renderer.info;
      return {
        fps: Math.round(fps),
        tier,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
      };
    },
    dispose() {
      stopped = true;
      gsap.ticker.remove(tick);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      scroll.destroy();
      starfield.dispose();
      markers.dispose();
      probe.dispose();
      rendererBundle.dispose();
      document.documentElement.classList.remove('scene');
    },
  };
}
