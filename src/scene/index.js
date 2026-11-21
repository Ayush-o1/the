// The 3D flight. Loaded with a dynamic import after first paint, so the page is readable before
// any of this code arrives. Everything here is an enhancement over the HTML.
import { Scene, PerspectiveCamera, Vector2, Vector3, PCFShadowMap } from 'three';
import { gsap } from 'gsap';
import { collectStops, measureStops } from '../core/sectors.js';
import {
  stopScrolls,
  stopParam,
  nearestStop,
  jumpIntensity,
  wellStrength,
  probePresence,
} from '../core/route-math.js';
import { damp } from '../core/damp.js';
import { createFollower } from '../core/motion.js';
import { TIERS, createTierMonitor } from '../core/tier.js';
import { createRenderer } from './renderer.js';
import { createStarfield } from './starfield.js';
import { createProbe } from './probe.js';
import { createWorldManager } from './worlds/index.js';
import { createNebula } from './nebula.js';
import { createJump } from './jump.js';
import { createCameraPath } from './camera-path.js';
import { createPost } from './post.js';
import { buildRoute } from './route.js';
import { warmUp } from './warmup.js';
import { createLighting } from './lighting.js';
import { SUN_DIRECTION } from './worlds/util.js';
import { loadMaps, mapsAllowed } from './maps.js';
import { exposureAt } from '../core/route-math.js';

// Exposure per stop. The red star and the disk are bright; the outer planets are dimmer.
const EXPOSURE = { blackwater: 0.92, beetlejuice: 0.8, theredarmy: 1.08, europa: 1.05 };

export function startScene({ env, startTier, pinTier, onContextLost, onSector, onFrame }) {
  const stops = collectStops();
  const curve = buildRoute(stops.map((stop) => stop.id));

  const rendererBundle = createRenderer({ onContextLost });
  const { renderer, canvas } = rendererBundle;
  const scene = new Scene();
  const camera = new PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);

  const lighting = createLighting({ renderer, scene });

  const starfield = createStarfield();
  const worlds = createWorldManager({ scene, stops, tier: startTier });
  const nebula = createNebula();
  const jump = createJump();
  const probe = createProbe({ anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()) });
  // The probe shades itself (the dish on the deck, the wings on the bus). Only the probe casts and
  // receives shadows, so the shadow map covers a small box around it and costs little.
  if (startTier !== 'low') {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    const { key } = lighting;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -3;
    key.shadow.camera.right = key.shadow.camera.top = 3;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 40;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
  }
  scene.add(nebula.object, starfield.object, jump.object, probe.object);
  const rig = createCameraPath(curve, camera, probe.object);

  // J1 runs from Argus to BlackWater and J2 from BlackWater to BeetleJuice.
  const jumps = [
    ['argus', 'blackwater'],
    ['blackwater', 'beetlejuice'],
  ]
    .map(([a, b]) => [a, b].map((id) => stops.findIndex((stop) => stop.id === id)))
    .filter(([a, b]) => a >= 0 && b >= 0);

  const tierMonitor = createTierMonitor(startTier);
  let tier = startTier;
  let post = null;

  let scrolls = [];
  const follower = createFollower(0);
  let param = 0;
  let steer = 0;
  let steerTarget = 0;
  let thrust = 0;
  let sectorIndex = -1;
  let fps = 60;
  let stopped = false;
  let firstFrame = true;
  let probeScale = 0.5;
  // Every section after the hero is read, so the probe is out of frame at all of them.
  const projectStops = stops.flatMap((stop, index) => (index > 0 ? [index] : []));
  let warmMs = 0;
  const holeScreen = new Vector3();
  const lensCenter = new Vector2(0.5, 0.5);
  const holeIndex = stops.findIndex((stop) => stop.id === 'blackwater');
  const exposures = stops.map((stop) => EXPOSURE[stop.id] ?? 1);

  function sizePost() {
    post?.setSize(window.innerWidth, window.innerHeight, rendererBundle.pixelRatio);
  }

  function applyTier(name) {
    tier = name;
    const settings = TIERS[name];
    rendererBundle.setDprCap(settings.dpr);
    starfield.setCount(settings.stars);
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
    // On a phone the text covers the screen, so the probe is smaller and sits low.
    probeScale = camera.aspect <= 1.2 ? 0.38 : 0.5;
    sizePost();
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
  follower.jumpTo(param);

  function tick(time, deltaMs) {
    if (stopped || document.hidden) return;
    const dt = Math.min(deltaMs / 1000, 0.1);
    if (dt <= 0) return;
    renderer.info.reset();

    const target = stopParam(scrolls, window.scrollY);
    const previous = param;
    param = follower.step(target, dt);
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

    rig.update(param, stops.length, steer, (steer - previousSteer) / dt);
    // The probe steps out of frame while a section is being read.
    const presence = probePresence(param, projectStops);
    probe.object.visible = presence > 0.01;
    probe.object.scale.setScalar(probeScale * Math.max(presence, 0.01));
    worlds.update(param, time, camera, dt);
    nebula.update(time, camera.position);
    jump.update(jumpAmount, time, camera);

    // The black hole bends the picture around it. Its screen position is where the lens is aimed.
    const lens = holeIndex >= 0 ? wellStrength(param, holeIndex) : 0;
    if (lens > 0) {
      worlds.groupOf('blackwater').getWorldPosition(holeScreen).project(camera);
      lensCenter.set(holeScreen.x * 0.5 + 0.5, holeScreen.y * 0.5 + 0.5);
    }

    // One exposure per world (bright stars darker, dim planets brighter), blended between stops.
    renderer.toneMappingExposure = exposureAt(param, exposures);

    const workStart = performance.now();
    probe.update(time, thrust);
    // The key light follows the probe so its shadow box stays around it. The direction is fixed.
    lighting.key.target.position.copy(probe.object.position);
    lighting.key.position.copy(probe.object.position).addScaledVector(SUN_DIRECTION, 20);
    starfield.update(time, rendererBundle.pixelRatio);
    if (post) {
      // A faint fringe toward the frame edges at all times, stronger inside the gravity well.
      post.setLens({ center: lensCenter, strength: lens * 0.3, chroma: 0.22 + lens * 0.5, time });
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
    onFrame({ param, stops: stops.length, dt, thrust });

    if (firstFrame) {
      firstFrame = false;
      canvas.classList.add('on');
      document.documentElement.classList.add('scene');
    }
  }

  // Every shader is compiled and every buffer uploaded before the first visible frame.
  function renderOnce() {
    if (post) post.render();
    else renderer.render(scene, camera);
  }
  const ready = (async () => {
    warmMs = await warmUp({ renderer, scene, camera, worlds, render: renderOnce });
    if (stopped) return;
    gsap.ticker.add(tick);
    // GSAP skips time after a slow frame by default, which would make the camera jump.
    gsap.ticker.lagSmoothing(0);
    // The planet maps load after the flight has started. Each world cross-fades to its map.
    if (mapsAllowed(tier)) {
      const requests = worlds.mapRequests();
      const byName = new Map(requests.map((request) => [request.name, request.world]));
      loadMaps({
        renderer,
        names: [...byName.keys()],
        onMap: (name, texture) => byName.get(name).setMap(name, texture),
        isStopped: () => stopped,
      });
    }
  })();

  return {
    stops,
    ready,
    tune: { renderer, scene, camera, worlds, probe, lighting, rig },
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
        warmMs: Math.round(warmMs),
        param,
        worlds: worlds.active.join(','),
      };
    },
    dispose() {
      stopped = true;
      gsap.ticker.remove(tick);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      post?.dispose();
      starfield.dispose();
      worlds.dispose();
      nebula.dispose();
      jump.dispose();
      probe.dispose();
      lighting.dispose();
      rendererBundle.dispose();
      document.documentElement.classList.remove('scene');
    },
  };
}
