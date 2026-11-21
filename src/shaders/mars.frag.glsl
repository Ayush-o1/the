// Mars-like planet: rust terrain from noise, darker plains, pale polar caps, thin dusty rim.
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main() {
  vec3 p = normalize(vObjPos);
  float terrain = fbm(p * 3.0);
  float detail = fbm(p * 12.0);
  vec3 color = mix(vec3(0.42, 0.16, 0.08), vec3(0.78, 0.42, 0.22), terrain);
  color = mix(color, vec3(0.2, 0.09, 0.06), smoothstep(0.55, 0.75, detail) * 0.6);
  float cap = smoothstep(0.86, 0.93, abs(p.y) + detail * 0.06);
  color = mix(color, vec3(0.93, 0.9, 0.85), cap);

  vec3 n = normalize(vWorldNormal);
  float diffuse = max(dot(n, normalize(uSunDir)), 0.0);
  float rim = pow(1.0 - max(dot(n, normalize(vViewDir)), 0.0), 3.5);
  vec3 lit = color * (0.06 + 0.94 * diffuse) + vec3(0.9, 0.55, 0.3) * rim * 0.35 * diffuse;
  gl_FragColor = vec4(lit, uFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
