// Creates each world when the probe gets near and disposes it when the probe is far,
// so only one or two worlds exist at a time and flying back and forth does not leak.
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
// near and far: how many stops away the world appears and disappears. Far is larger than near so a
// world does not flicker in and out at the boundary.
const DEFINITIONS = [
  { id: 'earth', stop: 'launch', create: createEarth, at: [0, -94, 20], near: 2.2, far: 2.8 },
  { id: 'argus', stop: 'argus', create: createArgus, offset: [-23, 1, 42], near: 1.25, far: 1.9 },
  {
    id: 'blackwater',
    stop: 'blackwater',
    create: createBlackWater,
    offset: [24, 0, 48],
    near: 1.6,
    far: 2.6,
  },
  {
    id: 'beetlejuice',
    stop: 'beetlejuice',
    create: createBeetleJuice,
    offset: [-34, 2, 56],
    near: 1.6,
    far: 2.6,
  },
  {
    id: 'theredarmy',
    stop: 'theredarmy',
    create: createMars,
    offset: [-24, 0, 36],
    near: 1.6,
    far: 2.6,
  },
  {
    id: 'deadletter',
    stop: 'deadletter',
    create: createRelay,
    offset: [22, 6, 40],
    near: 1.6,
    far: 2.6,
  },
  {
    id: 'europa',
    stop: 'europa',
    create: createEuropa,
    offset: [-26, -2, 40],
    near: 1.6,
    far: 2.6,
  },
  { id: 'home', stop: 'contact', create: createHome, at: [0, 6, -1050], near: 1.25, far: 1.9 },
];

export function createWorldManager({ scene, stops, tier }) {
  const entries = DEFINITIONS.map((definition) => ({
    ...definition,
    index: stops.findIndex((stop) => stop.id === definition.stop),
    instance: null,
  })).filter((entry) => entry.index >= 0);

  let currentTier = tier;

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

  function remove(entry) {
    scene.remove(entry.instance.group);
    entry.instance.dispose();
    entry.instance = null;
  }

  return {
    update(param, time, camera) {
      const portrait = camera.aspect <= 1.2;
      for (const entry of entries) {
        const distance = Math.abs(param - entry.index);
        if (!entry.instance && distance < entry.near) {
          entry.instance = entry.create({ tier: currentTier });
          scene.add(entry.instance.group);
        } else if (entry.instance && distance > entry.far) {
          remove(entry);
        }
        if (entry.instance) {
          place(entry, portrait);
          entry.instance.update(time, camera, param - entry.index);
        }
      }
    },
    // A new tier changes geometry detail, so live worlds are rebuilt on the next frame.
    setTier(nextTier) {
      if (nextTier === currentTier) return;
      currentTier = nextTier;
      for (const entry of entries) if (entry.instance) remove(entry);
    },
    // The group of a world that currently exists, or null. Used to aim the lens pass at the black hole.
    groupOf(id) {
      return entries.find((entry) => entry.id === id)?.instance?.group ?? null;
    },
    get active() {
      return entries.filter((entry) => entry.instance).map((entry) => entry.id);
    },
    dispose() {
      for (const entry of entries) if (entry.instance) remove(entry);
    },
  };
}
