// Flat ring: passes the distance from the centre so the fragment shader can draw bands.
varying float vRadius;
varying float vAngle;

void main() {
  vRadius = length(position.xy);
  vAngle = atan(position.y, position.x);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
