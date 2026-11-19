// Hazard 1, The Belt. A crowd of identical grey probes (one InstancedMesh) and a few larger rocks
// that carry stock portfolio phrases. One rock passes close to the hull. Clicking a rock breaks it.
// The phrases are read from the page (the Belt list in index.html), not written here.
import {
  Group,
  Mesh,
  InstancedMesh,
  BoxGeometry,
  IcosahedronGeometry,
  MeshStandardMaterial,
  Object3D,
  Sprite,
  SpriteMaterial,
  CanvasTexture,
  SRGBColorSpace,
  Raycaster,
  Vector2,
  Points,
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
} from 'three';
import { createRng } from '../../lib/rng.js';

const BREAK_SECONDS = 0.35;
const FRAGMENT_SECONDS = 1;
const FRAGMENTS = 14;

function labelTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  context.fillStyle = 'rgba(6, 7, 10, 0.75)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(237, 231, 218, 0.4)';
  context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  context.fillStyle = '#ede7da';
  context.font = '600 34px "IBM Plex Mono", monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// A lumpy rock: a sphere whose points are pushed in and out by seeded random amounts.
function rockGeometry(rng) {
  const geometry = new IcosahedronGeometry(1, 1);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const push = 0.75 + rng() * 0.5;
    positions.setXYZ(
      i,
      positions.getX(i) * push,
      positions.getY(i) * push,
      positions.getZ(i) * push,
    );
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function createBelt({ curve, stopCount, beltIndex, probeCount, phrases }) {
  const rng = createRng(777);
  const group = new Group();
  const owned = [];
  const toT = (param) => param / (stopCount - 1);

  // The crowd: identical small boxes scattered in a tube around the path.
  const probeGeometry = new BoxGeometry(0.55, 0.18, 0.55);
  const probeMaterial = new MeshStandardMaterial({
    color: 0x8d8a82,
    metalness: 0.5,
    roughness: 0.6,
  });
  const crowd = new InstancedMesh(probeGeometry, probeMaterial, probeCount);
  const dummy = new Object3D();
  for (let i = 0; i < probeCount; i += 1) {
    const point = curve.getPoint(toT(beltIndex - 0.5 + rng() * 1.3));
    const angle = rng() * Math.PI * 2;
    const radius = 4 + rng() ** 0.7 * 22;
    dummy.position.set(
      point.x + Math.cos(angle) * radius,
      point.y + Math.sin(angle) * radius * 0.6,
      point.z,
    );
    dummy.rotation.set(rng() * 6.28, rng() * 6.28, rng() * 6.28);
    dummy.updateMatrix();
    crowd.setMatrixAt(i, dummy.matrix);
  }
  crowd.frustumCulled = false;
  group.add(crowd);
  owned.push(probeGeometry, probeMaterial);

  // The rocks. Index 0 is the one that clips the hull, so it sits almost on the flight path.
  const rockMaterial = new MeshStandardMaterial({
    color: 0x4d463d,
    roughness: 1,
    flatShading: true,
  });
  owned.push(rockMaterial);
  const rocks = phrases.map((phrase, i) => {
    const geometry = rockGeometry(rng);
    owned.push(geometry);
    const rock = new Mesh(geometry, rockMaterial);
    const hero = i === 0;
    const point = curve.getPoint(
      toT(hero ? beltIndex + 0.05 : beltIndex - 0.4 + (i / phrases.length) * 1.1),
    );
    const angle = rng() * Math.PI * 2;
    const radius = hero ? 1.1 : 4.5 + rng() * 9;
    const size = hero ? 0.9 : 1.2 + rng() * 1.1;
    rock.position.set(
      point.x + Math.cos(angle) * radius,
      point.y + Math.sin(angle) * radius * 0.6,
      point.z,
    );
    rock.scale.setScalar(size);
    rock.userData = { size, spin: 0.1 + rng() * 0.3, broken: false, brokenAt: 0 };

    const texture = labelTexture(phrase);
    const material = new SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const label = new Sprite(material);
    label.scale.set(3.6, 0.68, 1);
    label.position.set(0, 2.1 / size + 0.6, 0);
    rock.add(label);
    rock.userData.label = label;
    owned.push(texture, material);
    group.add(rock);
    return rock;
  });

  const raycaster = new Raycaster();
  const fragments = [];

  function breakRock(rock, time) {
    rock.userData.broken = true;
    rock.userData.brokenAt = time;
    const positions = new Float32Array(FRAGMENTS * 3);
    const velocities = Array.from({ length: FRAGMENTS }, () => [
      (rng() - 0.5) * 8,
      (rng() - 0.5) * 8,
      (rng() - 0.5) * 8,
    ]);
    for (let i = 0; i < FRAGMENTS; i += 1) positions.set(rock.position.toArray(), i * 3);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const material = new PointsMaterial({ color: 0xc9c4b8, size: 0.5, transparent: true });
    const points = new Points(geometry, material);
    points.frustumCulled = false;
    group.add(points);
    fragments.push({ points, velocities, start: time, origin: rock.position.clone() });
  }

  return {
    group,
    // ndc is the pointer position in -1..1 screen space. Returns true if a rock was hit and broken.
    pick(ndc, camera, time) {
      raycaster.setFromCamera(new Vector2(ndc.x, ndc.y), camera);
      const live = rocks.filter((rock) => !rock.userData.broken);
      const hit = raycaster.intersectObjects(live, false)[0];
      if (!hit) return false;
      breakRock(hit.object, time);
      return true;
    },
    update(time) {
      for (const rock of rocks) {
        const { size, spin, broken, brokenAt } = rock.userData;
        rock.rotation.y = time * spin;
        rock.rotation.x = time * spin * 0.6;
        if (broken) {
          const left = Math.max(0, 1 - (time - brokenAt) / BREAK_SECONDS);
          rock.scale.setScalar(size * left);
          rock.visible = left > 0;
        }
      }
      for (let i = fragments.length - 1; i >= 0; i -= 1) {
        const fragment = fragments[i];
        const age = time - fragment.start;
        if (age > FRAGMENT_SECONDS) {
          group.remove(fragment.points);
          fragment.points.geometry.dispose();
          fragment.points.material.dispose();
          fragments.splice(i, 1);
          continue;
        }
        const attribute = fragment.points.geometry.attributes.position;
        fragment.velocities.forEach((velocity, j) => {
          attribute.setXYZ(
            j,
            fragment.origin.x + velocity[0] * age,
            fragment.origin.y + velocity[1] * age,
            fragment.origin.z + velocity[2] * age,
          );
        });
        attribute.needsUpdate = true;
        fragment.points.material.opacity = 1 - age / FRAGMENT_SECONDS;
      }
    },
    dispose() {
      crowd.dispose();
      for (const fragment of fragments) {
        fragment.points.geometry.dispose();
        fragment.points.material.dispose();
      }
      for (const resource of owned) resource.dispose();
    },
  };
}
