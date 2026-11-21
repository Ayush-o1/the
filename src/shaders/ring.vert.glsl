// Flat ring: passes the distance from the centre so the fragment shader can draw ringlets, and
// the world position for lighting and the planet's shadow.
varying float vRadius;
varying float vAngle;
varying vec3 vWorldPos;

void main() {
  vRadius = length(position.xy);
  vAngle = atan(position.y, position.x);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
