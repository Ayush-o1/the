// An atmosphere seen from outside: bright at the edge, strongest on the lit side, clear in the middle.
uniform vec3 uColor;
uniform vec3 uSunDir;
varying vec3 vNormal;
varying vec3 vView;

uniform float uFade;

void main() {
  float facing = abs(dot(normalize(vNormal), normalize(vView)));
  float edge = pow(1.0 - facing, 2.6);
  float lit = 0.15 + 0.85 * smoothstep(-0.35, 0.55, dot(-normalize(vNormal), normalize(uSunDir)));
  gl_FragColor = vec4(uColor * edge * lit * 0.5, edge * lit * 0.5 * uFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
