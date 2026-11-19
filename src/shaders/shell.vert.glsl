// Vertex shader for glow shells (an inside-out sphere slightly larger than a star or planet).
varying vec3 vNormal;
varying vec3 vView;

void main() {
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vView = normalize(cameraPosition - worldPosition.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
