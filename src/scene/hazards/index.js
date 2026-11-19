// Runs the hazards. What is happening at any moment comes from the pure timeline in
// core/hazard-timeline.js. This file owns the things that need the scene: the Belt objects,
// the drift markers, the camera shake and the aim of the lens pass.
import { Vector2, Vector3 } from 'three';
import { createTimeline, DRIFT_PEAK } from '../../core/hazard-timeline.js';
import { TIERS } from '../../core/tier.js';
import { missDistanceKm } from '../../lib/orbit.js';
import { $$ } from '../../lib/dom.js';
import { createBelt } from './belt.js';
import { createDrift } from './drift.js';
import { DEBRIS } from '../worlds/europa.js';

const DRIFT_UNITS = 2.2; // sideways error at the peak of the drift, in scene units
const SHAKE_SECONDS = 0.3;
const SHAKE_PIXELS = 4;
const BELT_NEAR = 0.9; // the Belt exists within this many stops of its sector
const BELT_FAR = 1.25;

export function createHazards({ scene, curve, stops, canvas, worlds, tier, reducedMotion }) {
  const indexOf = (id) => stops.findIndex((stop) => stop.id === id);
  const timeline = createTimeline(indexOf);
  const beltIndex = indexOf('belt');
  const phrases = $$('[data-belt] li').map((item) => item.textContent.trim());
  const missKm = missDistanceKm(DEBRIS.position, DEBRIS.velocity, [0, 0, 0]);

  const drift = createDrift();
  scene.add(drift.object);

  let currentTier = tier;
  let belt = null;
  let previousParam = 0;
  let shakeStart = -1;
  let beltHitFired = false;
  const projected = new Vector3();
  const lensCenter = new Vector2(0.5, 0.5);

  function makeBelt() {
    belt = createBelt({
      curve,
      stopCount: stops.length,
      beltIndex,
      probeCount: TIERS[currentTier].beltProbes,
      phrases,
    });
    scene.add(belt.group);
  }

  function removeBelt() {
    scene.remove(belt.group);
    belt.dispose();
    belt = null;
  }

  // One-shot events fire on the first forward crossing only, so scrubbing back never replays them.
  function checkEvents(param, time) {
    if (!beltHitFired && previousParam < timeline.beltHit && param >= timeline.beltHit) {
      beltHitFired = true;
      if (!reducedMotion) shakeStart = time;
    }
  }

  // Camera shake: 300 ms, at most 4 px, done by nudging the canvas. Off under reduced motion.
  function applyShake(time) {
    if (shakeStart < 0) return;
    const age = time - shakeStart;
    if (age > SHAKE_SECONDS) {
      shakeStart = -1;
      canvas.style.transform = '';
      return;
    }
    const decay = 1 - age / SHAKE_SECONDS;
    const x = Math.sin(age * 90) * SHAKE_PIXELS * decay;
    const y = Math.cos(age * 70) * SHAKE_PIXELS * decay;
    canvas.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(1.01)`;
  }

  // Screen position of the black hole, for the lens pass. Null when it does not exist or is behind the camera.
  function lensTarget(camera) {
    const group = worlds.groupOf('blackwater');
    if (!group) return null;
    projected.copy(group.position).project(camera);
    if (projected.z > 1) return null;
    return lensCenter.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5);
  }

  return {
    timeline,
    // Called every frame. Returns what the HUD and the post pass need.
    update({ param, time, camera, rig, probe }) {
      const state = timeline.evaluate(param);
      checkEvents(param, time);
      previousParam = param;

      const beltDistance = beltIndex >= 0 ? Math.abs(param - beltIndex) : Infinity;
      if (!belt && beltDistance < BELT_NEAR) makeBelt();
      else if (belt && beltDistance > BELT_FAR) removeBelt();
      belt?.update(time);

      drift.update({
        drift: state.drift,
        fix: state.fix,
        truePosition: rig.pathPosition,
        probePosition: probe.position,
        camera,
      });
      applyShake(time);

      const center = lensTarget(camera);
      const motionScale = reducedMotion ? 0.5 : 1;
      const lens = {
        center,
        strength: center ? state.gravity * motionScale : 0,
        chroma: reducedMotion ? 0 : state.chroma,
      };
      return {
        state: { ...state, flicker: reducedMotion ? 0 : state.flicker },
        lens,
        driftUnits: (state.drift / DRIFT_PEAK) * DRIFT_UNITS,
        values: {
          n: TIERS[currentTier].beltProbes.toLocaleString('en-US'),
          x: state.drift.toFixed(1),
          km: missKm.toFixed(1),
          hull: state.hull,
        },
      };
    },
    // Click or tap on empty page: try to break a rock in the Belt.
    pick(ndc, camera, time) {
      return belt ? belt.pick(ndc, camera, time) : false;
    },
    setTier(nextTier) {
      if (nextTier === currentTier) return;
      currentTier = nextTier;
      if (belt) removeBelt();
    },
    dispose() {
      if (belt) removeBelt();
      scene.remove(drift.object);
      drift.dispose();
      canvas.style.transform = '';
    },
  };
}
