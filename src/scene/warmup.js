// Compiles every shader and uploads every buffer before the first visible frame. Without this the
// browser compiles each world's shaders the first time it comes into view, in the middle of a
// scroll, and the frame takes tens of milliseconds. Behind the boot cover it costs nothing.
// compileAsync alone does not upload geometry, and meshes outside the camera are skipped by
// frustum culling, so one real frame is rendered with culling switched off, then restored.
export async function warmUp({ renderer, scene, camera, render }) {
  const start = performance.now();
  const culled = [];
  scene.traverse((object) => {
    if (object.frustumCulled) {
      culled.push(object);
      object.frustumCulled = false;
    }
  });
  try {
    await renderer.compileAsync(scene, camera);
  } catch (error) {
    // A browser without parallel compile still works. The render below compiles synchronously.
    console.warn('compileAsync failed, compiling on first render:', error);
  }
  render();
  for (const object of culled) object.frustumCulled = true;
  return performance.now() - start;
}
