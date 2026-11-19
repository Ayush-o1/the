// The ?debug overlay: frame rate, tier, draw calls and triangles, refreshed four times a second.
export function mountDebug(getStats, getMode) {
  const box = document.createElement('pre');
  box.className = 'debug mono';
  box.setAttribute('aria-hidden', 'true');
  document.body.append(box);

  const timer = setInterval(() => {
    const stats = getStats();
    const lines = [`mode ${getMode()}`];
    if (stats) {
      lines.push(
        `fps ${stats.fps}`,
        `tier ${stats.tier}`,
        `draw calls ${stats.drawCalls}`,
        `triangles ${stats.triangles}`,
        `geometries ${stats.geometries}`,
        `textures ${stats.textures}`,
        `programs ${stats.programs}`,
        `worlds ${stats.worlds || 'none'}`,
      );
    }
    box.textContent = lines.join('\n');
  }, 250);

  return () => {
    clearInterval(timer);
    box.remove();
  };
}
