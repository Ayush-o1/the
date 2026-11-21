// Shared by the probe and the relay station: a builder that merges parts per material, a dish
// profile, and the spacecraft materials (crinkled gold, silver and black foil with seams, white
// paint, anodised and bare metal, solar cells, panel backs, mirror-tile radiators).
import {
  Mesh,
  CylinderGeometry,
  LatheGeometry,
  Vector2,
  Vector3,
  Quaternion,
  Matrix4,
  Euler,
  MeshStandardMaterial,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  foilNormalMap,
  solarCellMap,
  panelBackMap,
  radiatorMap,
  foilSeamMap,
} from './probe-textures.js';

const UP = new Vector3(0, 1, 0);

// Collects transformed copies of geometries per material, then merges each set into one mesh.
export function createBuilder() {
  const sets = new Map();
  const matrix = new Matrix4();
  const quaternion = new Quaternion();
  const scale = new Vector3(1, 1, 1);
  function add(material, geometry, position = [0, 0, 0], rotation = null) {
    if (rotation instanceof Quaternion) quaternion.copy(rotation);
    else quaternion.setFromEuler(new Euler(...(rotation ?? [0, 0, 0])));
    matrix.compose(new Vector3(...position), quaternion, scale);
    const copy = (geometry.index ? geometry.toNonIndexed() : geometry.clone()).applyMatrix4(matrix);
    geometry.dispose();
    for (const name of Object.keys(copy.attributes)) {
      if (!['position', 'normal', 'uv'].includes(name)) copy.deleteAttribute(name);
    }
    if (!sets.has(material)) sets.set(material, []);
    sets.get(material).push(copy);
  }
  // A thin rod from a to b.
  function rod(material, a, b, radius, segments = 8) {
    const start = new Vector3(...a);
    const end = new Vector3(...b);
    const direction = end.clone().sub(start);
    const geometry = new CylinderGeometry(radius, radius, direction.length(), segments, 1);
    const turn = new Quaternion().setFromUnitVectors(UP, direction.clone().normalize());
    add(material, geometry, start.add(end).multiplyScalar(0.5).toArray(), turn);
  }
  function build(group) {
    for (const [material, geometries] of sets) {
      const mesh = new Mesh(mergeGeometries(geometries), material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      for (const geometry of geometries) geometry.dispose();
    }
  }
  return { add, rod, build };
}

export function dishGeometry(radius, focal, thickness) {
  const points = [];
  const steps = 14;
  for (let i = 0; i <= steps; i += 1) {
    const r = (radius * i) / steps;
    points.push(new Vector2(Math.max(r, 0.001), (r * r) / (4 * focal)));
  }
  for (let i = steps; i >= 0; i -= 1) {
    const r = (radius * i) / steps;
    points.push(new Vector2(Math.max(r, 0.001), (r * r) / (4 * focal) - thickness));
  }
  return new LatheGeometry(points, 48);
}

// own(resource) records each texture and material so its owner can dispose of them.
export function createHardwareMaterials(anisotropy, own) {
  const foil = own(foilNormalMap(256, 10));
  foil.repeat.set(2, 2);
  const seams = own(foilSeamMap(anisotropy));
  const material = (options) => own(new MeshStandardMaterial(options));
  const gold = material({
    color: 0xd9a24a,
    map: seams,
    metalness: 0.85,
    roughness: 0.34,
    normalMap: foil,
    normalScale: new Vector2(0.5, 0.5),
  });
  const silver = material({
    color: 0xd9dde2,
    map: seams,
    metalness: 1,
    roughness: 0.26,
    normalMap: foil,
    normalScale: new Vector2(0.4, 0.4),
  });
  // Black kapton blanket on the side that faces away from the sun in flight.
  const black = material({
    color: 0x1a1c20,
    metalness: 0.6,
    roughness: 0.4,
    normalMap: foil,
    normalScale: new Vector2(0.5, 0.5),
  });
  const paint = material({ color: 0xe4e1d8, metalness: 0, roughness: 0.55 });
  const anodised = material({ color: 0x34373d, metalness: 0.75, roughness: 0.42 });
  const aluminium = material({ color: 0xaeb2b8, metalness: 0.9, roughness: 0.34 });
  const cells = material({
    map: own(solarCellMap(anisotropy)),
    metalness: 0.3,
    roughness: 0.2,
  });
  const backs = material({ map: own(panelBackMap(anisotropy)), metalness: 0, roughness: 0.8 });
  const radiator = material({
    map: own(radiatorMap(anisotropy)),
    metalness: 0.85,
    roughness: 0.16,
  });
  return { material, gold, silver, black, paint, anodised, aluminium, cells, backs, radiator };
}
