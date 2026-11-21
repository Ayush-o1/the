// One lighting setup for the whole flight. A warm key light from the sun, a weak cold fill from
// Earth below, and an environment map for reflections. The map is made once, at start, from a
// small procedural sky (black, sparse stars, the sun's disc and the glow of Earth), so metal and
// foil have something real to reflect instead of looking matte.
import {
  DirectionalLight,
  Mesh,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  BackSide,
} from 'three';
import { SUN_DIRECTION, FILL_DIRECTION } from './worlds/util.js';

const SKY_VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const SKY_FRAGMENT = /* glsl */ `
uniform vec3 uSunDir;
uniform vec3 uFillDir;
varying vec3 vDir;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vec3 d = normalize(vDir);
  float toSun = dot(d, normalize(uSunDir));
  // The disc is drawn larger than the real sun so the small map still holds it, and very bright
  // so the blurred, rough reflections keep a warm highlight.
  vec3 color = vec3(1.0, 0.93, 0.82) * (smoothstep(0.9975, 0.999, toSun) * 60.0 + pow(max(toSun, 0.0), 64.0) * 1.6);
  // Earth below: a broad blue glow, brightest toward its sunlit side.
  float toEarth = dot(d, normalize(uFillDir));
  float earth = smoothstep(0.15, 0.75, toEarth);
  float earthLit = 0.35 + 0.65 * smoothstep(-0.4, 0.6, dot(normalize(uFillDir), normalize(uSunDir)) + 0.6);
  color += vec3(0.24, 0.32, 0.46) * earth * earthLit;
  // A faint glow over the whole sky (scattered sunlight, the Milky Way), so rough metal is never flat black.
  color += vec3(0.012, 0.014, 0.02);
  // Sparse stars, so a mirror-like part never shows a perfectly empty black.
  vec3 cell = floor(d * 90.0);
  float star = step(0.995, hash(cell));
  color += vec3(0.9) * star * 0.5;
  gl_FragColor = vec4(color, 1.0);
}`;

export function createLighting({ renderer, scene }) {
  const key = new DirectionalLight(0xfff0dc, 3.2);
  key.position.copy(SUN_DIRECTION).multiplyScalar(100);
  const fill = new DirectionalLight(0x7a96c8, 0.28);
  fill.position.copy(FILL_DIRECTION).multiplyScalar(100);
  scene.add(key, fill, key.target);

  const skyScene = new Scene();
  const skyGeometry = new SphereGeometry(10, 64, 32);
  const skyMaterial = new ShaderMaterial({
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
    uniforms: { uSunDir: { value: SUN_DIRECTION }, uFillDir: { value: FILL_DIRECTION } },
    side: BackSide,
    depthWrite: false,
  });
  skyScene.add(new Mesh(skyGeometry, skyMaterial));
  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(skyScene, 0, 0.1, 100);
  pmrem.dispose();
  skyGeometry.dispose();
  skyMaterial.dispose();

  scene.environment = target.texture;
  scene.environmentIntensity = 1;

  return {
    key,
    fill,
    dispose() {
      scene.environment = null;
      target.dispose();
      key.dispose();
      fill.dispose();
    },
  };
}
