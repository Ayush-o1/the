// Finds every [data-sim] box on the page and mounts its interactive simulation, if there is one.
// Each simulation loads on its own, only when it is needed. Without JavaScript the static text
// that is already in index.html stays visible.
import { $$ } from '../lib/dom.js';

const LOADERS = {
  argus: () => import('./argus.js').then((module) => module.mountArgus),
  blackwater: () => import('./blackwater.js').then((module) => module.mountBlackWater),
  beetlejuice: () => import('./beetlejuice.js').then((module) => module.mountBeetleJuice),
  deadletter: () => import('./deadletter.js').then((module) => module.mountDeadLetter),
  theredarmy: () => import('./redarmy.js').then((module) => module.mountRedArmy),
  europa: () => import('./europa.js').then((module) => module.mountEuropa),
};

export function mountSimulations() {
  for (const sim of $$('[data-sim]')) {
    const load = LOADERS[sim.dataset.sim];
    if (!load) continue;
    load()
      .then((mount) => mount(sim))
      .catch((error) => console.warn(`Simulation ${sim.dataset.sim} failed to load:`, error));
  }
}
