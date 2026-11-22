// Builds every world once, before the first frame, so no shader is compiled while the visitor is
// scrolling. A world is shown when the probe is near and hidden when it is far. Nothing is created
// or destroyed during the flight, so flying back and forth cannot leak.
import { WAYPOINTS } from '../route.js';
import { createEarth, createHome } from './earth.js';
import { createArgus } from './argus.js';
import { createBlackWater } from './blackwater.js';
import { createBeetleJuice } from './beetlejuice.js';
import { createMars } from './mars.js';
import { createRelay } from './relay.js';
import { createEuropa } from './europa.js';

// stop: the sector the world belongs to.
// at: a fixed position. offset: [x, y, ahead] from the stop's waypoint. Each offset puts the
// world on the side of the screen where the dossier panel is not (left for most, right for the
// flipped panels), which is what "per-world camera framing" means here.
// near: how many stops before its own stop the world is shown. AFTER: how far past the stop it
// stays. Once the probe has gone by, the world is behind the camera, so it must not hang in front
// of the next one.
// How far past its stop a world stays visible, in stops.
const AFTER = 0.3;
// A world fades in and out over this many seconds instead of popping. Whether it should be shown
// is a pure function of progress; only the fade toward that answer takes time.
export const FADE_SECONDS = 0.5;

// Every material under a world reads one shared fade value: shader materials through a uFade
// uniform, the others through their opacity.
export function collectFade(group, fade) {
  const plain = [];
  group.traverse((node) => {
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (!material) continue;
      if (material.isShaderMaterial) {
        material.uniforms.uFade = fade;
        material.transparent = true;
      } else {
        material.transparent = true;
        plain.push({ material, opacity: material.opacity });
      }
    }
  });
  return plain;
}

// Moves value toward target at a steady rate, so a fade takes FADE_SECONDS whatever the frame rate.
export function stepFade(value, target, dt) {
  const step = dt / FADE_SECONDS;
  return target > value ? Math.min(target, value + step) : Math.max(target, value - step);
}

const DEFINITIONS = [
  {
    id: 'earth',
    stop: 'launch',
    create: createEarth,
    at: [33.16, -49.48, -96.07],
    atPortrait: [6.5, -44.2, -17.07],
    near: 2.2,
    // The opening reveals the Earth as the camera levels out (camera-path.js), so it stays a
    // little longer than the other worlds.
    after: 0.45,
  },
  { id: 'argus', stop: 'argus', create: createArgus, offset: [-19, 1, 46], near: 0.85 },
  {
    id: 'blackwater',
    stop: 'blackwater',
    create: createBlackWater,
    offset: [19, 3, 64],
    near: 0.85,
  },
  {
    id: 'beetlejuice',
    stop: 'beetlejuice',
    create: createBeetleJuice,
    offset: [-34, 2, 56],
    near: 0.85,
  },
  {
    id: 'theredarmy',
    stop: 'theredarmy',
    create: createMars,
    offset: [-27, 1, 50],
    near: 0.85,
  },
  {
    id: 'deadletter',
    stop: 'deadletter',
    create: createRelay,
    offset: [22, 6, 40],
    near: 0.85,
  },
  {
    id: 'europa',
    stop: 'europa',
    create: createEuropa,
    offset: [-26, -2, 40],
    near: 0.85,
  },
  { id: 'home', stop: 'contact', create: createHome, at: [0, 6, -1050], near: 1.25 },
];

export function createWorldManager({ scene, stops, tier }) {
  const entries = DEFINITIONS.map((definition) => ({
    ...definition,
    index: stops.findIndex((stop) => stop.id === definition.stop),
    instance: null,
    fade: { value: 0 },
    plain: [],
  })).filter((entry) => entry.index >= 0);
  let first = true;

  // Builds the worlds one at a time, handing the thread back between them, so no single task is
  // long. Called once, before the first frame.
  async function build(yieldToMain) {
    for (const entry of entries) {
      entry.instance = entry.create({ tier });
      entry.instance.group.visible = false;
      entry.plain = collectFade(entry.instance.group, entry.fade);
      scene.add(entry.instance.group);
      await yieldToMain();
    }
  }

  function applyFade(entry) {
    const amount = entry.fade.value;
    entry.instance.group.visible = amount > 0.001;
    for (const { material, opacity } of entry.plain) material.opacity = opacity * amount;
  }

  function place(entry, portrait) {
    const { group } = entry.instance;
    if (entry.at) {
      // On a phone the text fills the top of the screen, so a fixed world can sit lower.
      group.position.set(...(portrait && entry.atPortrait ? entry.atPortrait : entry.at));
      return;
    }
    const [x, y, ahead] = entry.offset;
    const [wx, wy, wz] = WAYPOINTS[entry.stop];
    // On a phone the dossier covers the whole width, so the world moves up and toward the middle.
    group.position.set(wx + (portrait ? x * 0.3 : x), wy + y + (portrait ? 9 : 0), wz - ahead);
  }

  return {
    update(param, time, camera, dt) {
      const portrait = camera.aspect <= 1.2;
      for (const entry of entries) {
        const offset = param - entry.index; // negative before the stop, positive after
        // A pure function of progress, so flying forward and scrubbing back show the same worlds.
        const wanted = offset > -entry.near && offset < (entry.after ?? AFTER) ? 1 : 0;
        // The first frame starts where the page is (a deep link does not fade in from nothing).
        entry.fade.value = first ? wanted : stepFade(entry.fade.value, wanted, dt);
        applyFade(entry);
        if (entry.instance.group.visible) {
          place(entry, portrait);
          entry.instance.update(time, camera, param - entry.index);
        }
      }
      first = false;
    },
    build,
    // Shows each world alone for one render, so the renderer compiles and uploads it, then hides it.
    // One world per task keeps every task short.
    async warmEach(render, yieldToMain) {
      for (const entry of entries) {
        place(entry, false);
        entry.fade.value = 1;
        applyFade(entry);
        render();
        entry.fade.value = 0;
        applyFade(entry);
        await yieldToMain();
      }
    },
    // Shows or hides every world at once, for compiling all their shaders together in warm-up.
    setAllVisible(visible) {
      for (const entry of entries) {
        entry.fade.value = visible ? 1 : 0;
        applyFade(entry);
        if (visible) place(entry, false);
      }
    },
    // A world's definition, for the ?debug framing scripts.
    debugEntry(id) {
      return entries.find((entry) => entry.id === id) ?? null;
    },
    // The maps each world asks for, and where to send each one when it arrives.
    mapRequests() {
      return entries.flatMap((entry) =>
        (entry.instance?.maps ?? []).map((name) => ({ name, world: entry.instance })),
      );
    },
    // The group of a world, or null. Used to aim the lens pass at the black hole.
    groupOf(id) {
      return entries.find((entry) => entry.id === id)?.instance?.group ?? null;
    },
    get active() {
      return entries.filter((entry) => entry.instance?.group.visible).map((entry) => entry.id);
    },
    dispose() {
      for (const entry of entries) {
        if (!entry.instance) continue;
        scene.remove(entry.instance.group);
        entry.instance.dispose();
      }
    },
  };
}
