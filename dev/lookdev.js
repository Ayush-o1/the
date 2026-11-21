// Look-dev page (development only; not a build input, see vite.config.js and
// tests/logic/build-output.test.js). One asset at a time, fixed camera and light, a turntable,
// a light-direction control, lit and unlit, a silhouette mode and a tone-mapping switch. Every
// control also reads from the URL, so scripts can render the same still again:
//   /dev/lookdev.html?asset=probe&yaw=30&pitch=10&sunAz=40&sunEl=30&lit=1&tm=agx&clean=1
import {
  Scene,
  PerspectiveCamera,
  Vector3,
  Color,
  MeshBasicMaterial,
  AgXToneMapping,
  ACESFilmicToneMapping,
  NeutralToneMapping,
  PCFShadowMap,
} from 'three';
import { createRenderer } from '../src/scene/renderer.js';
import { createPost } from '../src/scene/post.js';
import { createLighting } from '../src/scene/lighting.js';
import { createProbe } from '../src/scene/probe.js';
import { createStarfield } from '../src/scene/starfield.js';
import { createNebula } from '../src/scene/nebula.js';
import { SUN_DIRECTION } from '../src/scene/worlds/util.js';
import { collectFade } from '../src/scene/worlds/index.js';
import { loadMaps } from '../src/scene/maps.js';
import { createEarth } from '../src/scene/worlds/earth.js';
import { createArgus } from '../src/scene/worlds/argus.js';
import { createBlackWater } from '../src/scene/worlds/blackwater.js';
import { createBeetleJuice } from '../src/scene/worlds/beetlejuice.js';
import { createMars } from '../src/scene/worlds/mars.js';
import { createRelay } from '../src/scene/worlds/relay.js';
import { createEuropa } from '../src/scene/worlds/europa.js';

// distance: default camera distance. center: what the camera looks at, in the asset's space.
const ASSETS = {
  probe: { distance: 7, center: [0, 0.2, 0] },
  earth: { create: createEarth, distance: 110, center: [0, 0, 0] },
  mars: { create: createMars, distance: 32, center: [0, 0, 0] },
  argus: { create: createArgus, distance: 70, center: [0, 0, 0] },
  blackwater: { create: createBlackWater, distance: 70, center: [0, 0, 0] },
  beetlejuice: { create: createBeetleJuice, distance: 90, center: [0, 0, 0] },
  relay: { create: createRelay, distance: 40, center: [0, -3, 0] },
  europa: { create: createEuropa, distance: 30, center: [0, 0, 0] },
};
const TONE = { agx: AgXToneMapping, aces: ACESFilmicToneMapping, neutral: NeutralToneMapping };

const params = new URLSearchParams(location.search);
if (params.get('clean') === '1') document.body.classList.add('clean');
const form = document.getElementById('controls');
const assetSelect = form.elements.asset;
for (const name of Object.keys(ASSETS)) assetSelect.append(new Option(name, name));
const defaults = {
  asset: 'probe',
  yaw: 35,
  pitch: 12,
  dist: 0,
  sunAz: 0,
  sunEl: 0,
  spin: 0,
  lit: 1,
  sil: 0,
  tm: 'aces',
};
for (const [key, fallback] of Object.entries(defaults)) {
  const element = form.elements[key];
  const value = params.get(key) ?? String(fallback);
  if (element.type === 'checkbox') element.checked = value === '1';
  else element.value = value;
}

const { renderer, canvas, resize } = createRenderer({ onContextLost() {} });
document.body.prepend(canvas);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFShadowMap;
const scene = new Scene();
const camera = new PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 4000);
const lighting = createLighting({ renderer, scene });
lighting.buildEnvironment();
lighting.key.castShadow = true;
lighting.key.shadow.mapSize.set(2048, 2048);
Object.assign(lighting.key.shadow.camera, {
  left: -4,
  right: 4,
  top: 4,
  bottom: -4,
  near: 1,
  far: 60,
});
lighting.key.shadow.bias = -0.0004;
lighting.key.shadow.normalBias = 0.02;
const stars = createStarfield();
stars.setCount(3000);
scene.add(stars.object);
// The same backdrop as the site, so blacks look as they will there.
const nebula = createNebula();
scene.add(nebula.object);
const post = createPost({ renderer, scene, camera });
// The sun direction as first set in code: azimuth and elevation are offsets from it.
const BASE_SUN = SUN_DIRECTION.clone();

let current = null;
let currentName = '';
const unlit = new Map();

function build(name) {
  if (current) {
    scene.remove(current.group);
    current.dispose();
  }
  const spec = ASSETS[name];
  // Set first: the map loader checks it to know whether this asset is still the one on show.
  currentName = name;
  window.__ready = true;
  if (name === 'probe') {
    const probe = createProbe({ anisotropy: renderer.capabilities.getMaxAnisotropy() });
    current = {
      group: probe.object,
      update: (time) => probe.update(time, 0),
      dispose: probe.dispose,
    };
  } else {
    const world = spec.create({ tier: 'high' });
    collectFade(world.group, { value: 1 });
    current = {
      group: world.group,
      update: (time) => world.update(time, camera, 0),
      dispose: world.dispose,
      world,
    };
    if (world.maps?.length) {
      window.__ready = false;
      loadMaps({
        renderer,
        names: world.maps,
        onMap: (map, texture) => world.setMap(map, texture),
        isStopped: () => currentName !== name,
      }).then(() => {
        window.__ready = true;
      });
    }
  }
  current.group.traverse((node) => {
    if (node.isMesh && node.material?.isMeshStandardMaterial) {
      node.castShadow = node.receiveShadow = true;
      unlit.set(node, {
        lit: node.material,
        flat: new MeshBasicMaterial({ map: node.material.map, color: node.material.color }),
      });
    }
  });
  scene.add(current.group);
}

const silhouette = new MeshBasicMaterial({ color: 0x000000 });
const sunTarget = new Vector3();

function apply() {
  const values = Object.fromEntries(new FormData(form));
  const spec = ASSETS[values.asset];
  if (values.asset !== currentName) build(values.asset);
  const distance = Number(values.dist) > 1 ? Number(values.dist) : spec.distance;
  const yaw = (Number(values.yaw) * Math.PI) / 180;
  const pitch = (Number(values.pitch) * Math.PI) / 180;
  const center = new Vector3(...spec.center);
  camera.position
    .set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch))
    .multiplyScalar(distance)
    .add(center);
  camera.lookAt(center);
  // Sun: the code's direction turned by the azimuth and elevation offsets.
  const az = (Number(values.sunAz) * Math.PI) / 180;
  const el = (Number(values.sunEl) * Math.PI) / 180;
  SUN_DIRECTION.copy(BASE_SUN).applyAxisAngle(new Vector3(0, 1, 0), az);
  const sideways = new Vector3().crossVectors(SUN_DIRECTION, new Vector3(0, 1, 0)).normalize();
  if (sideways.lengthSq() > 0) SUN_DIRECTION.applyAxisAngle(sideways, el).normalize();
  lighting.key.position.copy(sunTarget).addScaledVector(SUN_DIRECTION, 30);
  lighting.key.target.position.copy(sunTarget);
  const lit = values.lit === 'on';
  lighting.key.intensity = lit ? 3.2 : 0;
  for (const [node, pair] of unlit) node.material = lit ? pair.lit : pair.flat;
  renderer.toneMapping = TONE[values.tm] ?? AgXToneMapping;
  const sil = values.sil === 'on';
  scene.overrideMaterial = sil ? silhouette : null;
  scene.background = sil ? new Color(0xffffff) : null;
  stars.object.visible = !sil;
  return { spin: values.spin === 'on', sil };
}

function size() {
  resize();
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  post?.setSize(innerWidth, innerHeight, renderer.getPixelRatio());
}
addEventListener('resize', size);
size();
form.addEventListener('input', apply);

const start = performance.now();
function frame(now) {
  window.__frameCount = (window.__frameCount || 0) + 1;
  const time = (now - start) / 1000;
  const { spin, sil } = apply();
  if (current) {
    current.group.rotation.y = spin ? time * 0.4 : 0;
    current.update(time);
  }
  stars.update(time, renderer.getPixelRatio());
  nebula.update(time, camera.position);
  nebula.object.visible = !sil;
  if (sil) renderer.render(scene, camera);
  else post.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__lookdev = { scene, camera, renderer, lighting, post };
