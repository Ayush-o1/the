// The 3D flight. Loaded with a dynamic import after first paint, so the page is readable before
// any of this code arrives. Everything here is an enhancement over the HTML.
import { Scene, PerspectiveCamera, DirectionalLight, AmbientLight } from 'three';
import { gsap } from 'gsap';
import { createScroll } from '../core/scroll.js';
import { collectStops, measureStops } from '../core/sectors.js';
import { stopScrolls, stopParam, nearestStop, jumpIntensity } from '../core/route-math.js';
import { damp } from '../core/damp.js';
import { TIERS, createTierMonitor } from '../core/tier.js';
import { createRenderer } from './renderer.js';
import { createStarfield } from './starfield.js';
import { createProbe } from './probe.js';
import { createWorldManager } from './worlds/index.js';
import { createNebula } from './nebula.js';
import { createJump } from './jump.js';
import { createCameraPath } from './camera-path.js';
import { createPost } from './post.js';
import { createHazards } from './hazards/index.js';
import { buildRoute } from './route.js';

const FOLLOW_RATE = 6; // docs/PLAN.md 5.2: tune between 4 and 8
// A click on one of these, or inside one, belongs to the page and never breaks a rock.
const INTERACTIVE =
  'a, button, input, textarea, select, summary, dialog, form, header, nav, label, details, .panel';

export function startScene({ env, startTier, pinTier, onContextLost, onSector, onFrame }) {
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
  const worlds = createWorldManager({ scene, stops, tier: startTier });
  const nebula = createNebula();
  const jump = createJump();
  const probe = createProbe();
  scene.add(nebula.object, starfield.object, jump.object, probe.object);
  const rig = createCameraPath(curve, camera, probe.object);
  const hazards = createHazards({
    scene,
    curve,
    stops,
    canvas,
    worlds,
    tier: startTier,
    reducedMotion: env.reducedMotion,
  });

  // J1 runs from Argus to BlackWater and J2 from BlackWater to BeetleJuice.
  const jumps = [
    ['argus', 'blackwater'],
    ['blackwater', 'beetlejuice'],
  ]
    .map(([a, b]) => [a, b].map((id) => stops.findIndex((stop) => stop.id === id)))
    .filter(([a, b]) => a >= 0 && b >= 0);

  const scroll = createScroll();
  const tierMonitor = createTierMonitor(startTier);
  let tier = startTier;
  let post = null;

  let scrolls = [];
  let param = 0;
  let steer = 0;
  let steerTarget = 0;
  let thrust = 0;
  let sectorIndex = -1;
  let fps = 60;
  let lastTime = 0;
  let stopped = false;
  let firstFrame = true;

  function sizePost() {
    post?.setSize(window.innerWidth, window.innerHeight, rendererBundle.pixelRatio);
  }

  function applyTier(name) {
    tier = name;
    const settings = TIERS[name];
    rendererBundle.setDprCap(settings.dpr);
    starfield.setCount(settings.stars);
    worlds.setTier(name);
    hazards.setTier(name);
    nebula.object.visible = name !== 'low';
    // The low tier skips post-processing and renders straight to the screen.
    if (settings.post && !post) post = createPost({ renderer, scene, camera });
    if (!settings.post && post) {
      post.dispose();
      post = null;
    }
    sizePost();
  }

  function measure() {
    scrolls = stopScrolls(measureStops(stops), window.innerHeight);
  }

  function resize() {
    rendererBundle.resize();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    sizePost();
    measure();
  }

  // Pointer steering: a small lateral offset. Not on touch screens.
  function onPointerMove(event) {
    if (env.touch) return;
    steerTarget = (event.clientX / window.innerWidth) * 2 - 1;
  }

  // The canvas sits behind the page, so clicks never reach it. A click on bare page background
  // is cast into the scene to see if it hit a rock in the Belt.
  function onPointerDown(event) {
    if (event.button !== 0 || !(event.target instanceof Element)) return;
    if (event.target.closest(INTERACTIVE)) return;
    if (!['HTML', 'BODY', 'MAIN', 'SECTION'].includes(event.target.tagName)) return;
    const ndc = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1,
    };
    hazards.pick(ndc, camera, lastTime);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(document.body);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown);
  applyTier(startTier);
  resize();
  document.body.prepend(canvas);

  // Start where the page already is, so a deep link does not begin with a flight from the pad.
  param = stopParam(scrolls, window.scrollY);

  function tick(time, deltaMs) {
    if (stopped || document.hidden) return;
    const dt = Math.min(deltaMs / 1000, 0.1);
    if (dt <= 0) return;
    lastTime = time;
    renderer.info.reset();

    const target = stopParam(scrolls, window.scrollY);
    const previous = param;
    param = damp(param, target, FOLLOW_RATE, dt);
    const previousSteer = steer;
    steer = damp(steer, steerTarget, 4, dt);

    const speed = Math.abs(param - previous) / dt; // stops per second
    thrust = damp(thrust, Math.min(1, speed / 1.5), 8, dt);

    // Tunnels are off under reduced motion, even if the flight was asked for explicitly.
    const jumpAmount = env.reducedMotion ? 0 : jumpIntensity(param, jumps);
    const fov = jump.fovFor(jumpAmount);
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    // Hazards come first: drift changes where the probe sits.
    const hazard = hazards.update({ param, time, camera, rig, probe: probe.object });
    rig.update(param, stops.length, steer, (steer - previousSteer) / dt, hazard.driftUnits);
    worlds.update(param, time, camera);
    nebula.update(time, camera.position);
    jump.update(jumpAmount, time, camera);

    const workStart = performance.now();
    probe.update(time, thrust);
    starfield.update(time, rendererBundle.pixelRatio, window.innerHeight);
    if (post) {
      post.setLens({ ...hazard.lens, time });
      post.render();
    } else {
      renderer.render(scene, camera);
    }

    fps = damp(fps, 1000 / Math.max(deltaMs, 1), 3, dt);
    // A pinned tier (?tier=) never adapts, so tests see the same scene on fast and slow machines.
    const nextTier = pinTier ? null : tierMonitor.sample(deltaMs, performance.now() - workStart);
    if (nextTier) applyTier(nextTier);

    const nearest = nearestStop(scrolls, window.scrollY);
    if (nearest !== sectorIndex) {
      sectorIndex = nearest;
      onSector(stops[nearest], nearest);
    }
    onFrame({ param, stops: stops.length, dt, hazard: hazard.state, values: hazard.values });

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
        programs: info.programs?.length ?? 0,
        worlds: worlds.active.join(','),
      };
    },
    dispose() {
      stopped = true;
      gsap.ticker.remove(tick);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      scroll.destroy();
      post?.dispose();
      hazards.dispose();
      starfield.dispose();
      worlds.dispose();
      nebula.dispose();
      jump.dispose();
      probe.dispose();
      rendererBundle.dispose();
      document.documentElement.classList.remove('scene');
    },
  };
}
