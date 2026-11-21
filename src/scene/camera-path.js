// Puts the probe and the camera on the route. The probe sits on the curve. The camera trails
// behind it and a little above, looking ahead along the curve.
import { Vector3 } from 'three';

const UP = new Vector3(0, 1, 0);
const MAX_LATERAL = 1.4;
const MAX_ROLL = 0.12;

export function createCameraPath(curve, camera, probe) {
  const position = new Vector3();
  const tangent = new Vector3();
  const right = new Vector3();
  const target = new Vector3();

  return {
    // param runs 0 to (stops - 1). steer is -1 to 1 from the pointer. steerVelocity is its change per second.
    update(param, stops, steer, steerVelocity) {
      const t = Math.min(1, Math.max(0, stops > 1 ? param / (stops - 1) : 0));
      curve.getPoint(t, position);
      curve.getTangent(t, tangent);
      right.crossVectors(tangent, UP).normalize();

      probe.position.copy(position).addScaledVector(right, steer * MAX_LATERAL);
      target.copy(probe.position).add(tangent);
      probe.lookAt(target);
      // Banking: lean into the sideways motion, plus a little for where the pointer is.
      const roll =
        -steer * MAX_ROLL * 0.5 - Math.max(-1, Math.min(1, steerVelocity)) * MAX_ROLL * 0.5;
      probe.rotateZ(roll);

      // On wide screens the page text sits on the left, so the camera is shifted to put the probe
      // in the right third of the frame. On tall (phone) screens it stays centred.
      const shift = camera.aspect > 1.2 ? -4.5 : 0;
      camera.position
        .copy(position)
        .addScaledVector(tangent, -11)
        .addScaledVector(right, steer * MAX_LATERAL * 0.4 + shift);
      camera.position.y += 3;
      target.copy(position).addScaledVector(tangent, 14).addScaledVector(right, shift);
      // Look a little higher so the probe sits low in the frame: far enough down to stay clear of
      // the world beside it on a wide screen, and under the text on a phone.
      target.y += camera.aspect <= 1.2 ? 5.5 : 1.8;
      camera.lookAt(target);
    },
  };
}
