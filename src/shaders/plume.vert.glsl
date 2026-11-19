// Engine plume: a cone whose brightness fades along its length.
varying float vAlong;

void main() {
  vAlong = uv.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
