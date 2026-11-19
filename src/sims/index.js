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

// Returns a promise that settles when every simulation has mounted (or failed), so callers can
// react to the layout change that mounting causes.
export function mountSimulations() {
  const jobs = $$('[data-sim]')
    .filter((sim) => LOADERS[sim.dataset.sim])
    .map((sim) =>
      LOADERS[sim.dataset.sim]()
        .then((mount) => mount(sim))
        .catch((error) => console.warn(`Simulation ${sim.dataset.sim} failed to load:`, error)),
    );
  return Promise.allSettled(jobs);
}
