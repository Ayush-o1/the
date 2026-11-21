// Compiles every shader and uploads every buffer before the first visible frame. Without this the
// browser compiles each world's shaders the first time it comes into view, in the middle of a
// scroll, and the frame takes tens of milliseconds. Behind the boot cover it costs nothing, but
// it must not freeze the page either, so the work is cut into short tasks: one world is built,
// then one world is rendered, with the thread handed back in between.
// compileAsync alone does not upload geometry, and meshes outside the camera are skipped by
// frustum culling, so each world is rendered with culling switched off, then restored.

// Lets the browser paint and handle input between two pieces of work.
export function yieldToMain() {
  if (globalThis.scheduler?.yield) return globalThis.scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function warmUp({ renderer, scene, camera, worlds, render, before = [] }) {
  const start = performance.now();
  // Setup work that has to happen before compiling (the reflection map), one task each.
  for (const step of before) {
    await yieldToMain();
    step();
  }
  await worlds.build(yieldToMain);
  const culled = [];
  scene.traverse((object) => {
    if (object.frustumCulled) {
      culled.push(object);
      object.frustumCulled = false;
    }
  });
  camera.updateMatrixWorld();
  // compileAsync skips hidden objects, and every world is hidden until it is near. Without this,
  // nothing in the worlds was compiled here, and each world's shaders were compiled and linked
  // synchronously in warmEach below: one long task per world.
  worlds.setAllVisible(true);
  try {
    await renderer.compileAsync(scene, camera);
  } catch (error) {
    // A browser without parallel compile still works. The renders below compile synchronously.
    console.warn('compileAsync failed, compiling on first render:', error);
  }
  worlds.setAllVisible(false);
  await worlds.warmEach(render, yieldToMain);
  render();
  for (const object of culled) object.frustumCulled = true;
  return performance.now() - start;
}
