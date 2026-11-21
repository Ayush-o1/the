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
const AFTER = 0.85;

const DEFINITIONS = [
  { id: 'earth', stop: 'launch', create: createEarth, at: [55, -70, -25], near: 2.2 },
  { id: 'argus', stop: 'argus', create: createArgus, offset: [-23, 1, 42], near: 0.8 },
  {
    id: 'blackwater',
    stop: 'blackwater',
    create: createBlackWater,
    offset: [24, 4, 52],
    near: 1.6,
  },
  {
    id: 'beetlejuice',
    stop: 'beetlejuice',
    create: createBeetleJuice,
    offset: [-34, 2, 56],
    near: 1.6,
  },
  {
    id: 'theredarmy',
    stop: 'theredarmy',
    create: createMars,
    offset: [-24, 0, 36],
    near: 1.6,
  },
  {
    id: 'deadletter',
    stop: 'deadletter',
    create: createRelay,
    offset: [22, 6, 40],
    near: 1.6,
  },
  {
    id: 'europa',
    stop: 'europa',
    create: createEuropa,
    offset: [-26, -2, 40],
    near: 1.6,
  },
  { id: 'home', stop: 'contact', create: createHome, at: [0, 6, -1050], near: 1.25 },
];

export function createWorldManager({ scene, stops, tier }) {
  const entries = DEFINITIONS.map((definition) => ({
    ...definition,
    index: stops.findIndex((stop) => stop.id === definition.stop),
    instance: null,
  })).filter((entry) => entry.index >= 0);

  // Builds the worlds one at a time, handing the thread back between them, so no single task is
  // long. Called once, before the first frame.
  async function build(yieldToMain) {
    for (const entry of entries) {
      entry.instance = entry.create({ tier });
      entry.instance.group.visible = false;
      scene.add(entry.instance.group);
      await yieldToMain();
    }
  }

  function place(entry, portrait) {
    const { group } = entry.instance;
    if (entry.at) {
      group.position.set(...entry.at);
      return;
    }
    const [x, y, ahead] = entry.offset;
    const [wx, wy, wz] = WAYPOINTS[entry.stop];
    // On a phone the dossier covers the whole width, so the world moves up and toward the middle.
    group.position.set(wx + (portrait ? x * 0.3 : x), wy + y + (portrait ? 9 : 0), wz - ahead);
  }

  return {
    update(param, time, camera) {
      const portrait = camera.aspect <= 1.2;
      for (const entry of entries) {
        const offset = param - entry.index; // negative before the stop, positive after
        const { group } = entry.instance;
        // A pure function of progress, so flying forward and scrubbing back show the same worlds.
        group.visible = offset > -entry.near && offset < AFTER;
        if (group.visible) {
          place(entry, portrait);
          entry.instance.update(time, camera, param - entry.index);
        }
      }
    },
    build,
    // Shows each world alone for one render, so the renderer compiles and uploads it, then hides it.
    // One world per task keeps every task short.
    async warmEach(render, yieldToMain) {
      for (const entry of entries) {
        place(entry, false);
        entry.instance.group.visible = true;
        render();
        entry.instance.group.visible = false;
        await yieldToMain();
      }
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
