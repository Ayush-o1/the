// Hazard 4, Drift. As the position error grows, a thin ring marks where the probe should be and a
// line joins it to where the probe is. At the star fix a ring spreads out from the probe and the
// error returns to zero. Both are pure functions of the timeline, so they scrub cleanly.
import {
  Group,
  Mesh,
  RingGeometry,
  MeshBasicMaterial,
  DoubleSide,
  Line,
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
} from 'three';

export function createDrift() {
  const group = new Group();
  const ghostGeometry = new RingGeometry(0.95, 1, 40);
  const ghostMaterial = new MeshBasicMaterial({
    color: 0xffb454,
    side: DoubleSide,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const ghost = new Mesh(ghostGeometry, ghostMaterial);
  ghost.scale.setScalar(1.6);

  const lineGeometry = new BufferGeometry();
  lineGeometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(6), 3));
  const lineMaterial = new LineBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0.5 });
  const line = new Line(lineGeometry, lineMaterial);
  line.frustumCulled = false;

  const pulseMaterial = new MeshBasicMaterial({
    color: 0xffd9a0,
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
  });
  const pulse = new Mesh(ghostGeometry, pulseMaterial);

  group.add(ghost, line, pulse);
  group.visible = false;

  return {
    object: group,
    // drift is the error, 0 to the peak. fix is 0 before the star fix and 1 after it.
    update({ drift, fix, truePosition, probePosition, camera }) {
      const showError = drift > 0.02;
      const showPulse = fix > 0 && fix < 1;
      group.visible = showError || showPulse;
      if (!group.visible) return;

      ghost.visible = showError;
      line.visible = showError;
      ghost.position.copy(truePosition);
      ghost.quaternion.copy(camera.quaternion);
      const positions = lineGeometry.attributes.position;
      positions.setXYZ(0, truePosition.x, truePosition.y, truePosition.z);
      positions.setXYZ(1, probePosition.x, probePosition.y, probePosition.z);
      positions.needsUpdate = true;

      pulse.visible = showPulse;
      pulse.position.copy(probePosition);
      pulse.quaternion.copy(camera.quaternion);
      pulse.scale.setScalar(1 + fix * 14);
      pulseMaterial.opacity = (1 - fix) * 0.6;
    },
    dispose() {
      ghostGeometry.dispose();
      ghostMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      pulseMaterial.dispose();
    },
  };
}
