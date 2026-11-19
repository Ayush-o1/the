// Argus simulation logic. The detector follows backend/app/services/anomaly.py in the real project:
// for each account, count the most transactions that fall in any 6-hour window (the burst count),
// then flag accounts whose burst count is 3 or more standard deviations above everyone else's.
//
// The real detector also needs an Isolation Forest to agree. That model cannot run here, so this
// simulation uses the z-score half only, and the page says so.
import { createRng } from '../lib/rng.js';

export const WINDOW_HOURS = 6;
export const Z_THRESHOLD = 3.0;
export const BURST_SIZE = 35;
const WEEK_HOURS = 24 * 7;

// The largest number of timestamps (in hours, any order) inside one window. Sorted two-pointer scan.
export function burstCount(times, windowHours = WINDOW_HOURS) {
  const sorted = [...times].sort((a, b) => a - b);
  let best = 0;
  let start = 0;
  for (let end = 0; end < sorted.length; end += 1) {
    while (sorted[end] - sorted[start] >= windowHours) start += 1;
    best = Math.max(best, end - start + 1);
  }
  return best;
}

export function meanAndStd(values) {
  if (values.length === 0) return { mean: 0, std: 0 };
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return { mean, std: Math.sqrt(variance) };
}

// Builds a small synthetic world. Every account and transaction is made up.
export function buildWorld(seed = 11, accountCount = 36) {
  const rng = createRng(seed);
  const accounts = Array.from({ length: accountCount }, (_, i) => ({
    id: `A-${String(i + 1).padStart(2, '0')}`,
    times: [],
    anomalous: false,
  }));
  const transactions = [];
  const perAccount = 5 + Math.floor(rng() * 3);
  for (let i = 0; i < accountCount; i += 1) {
    for (let k = 0; k < perAccount; k += 1) {
      let other = Math.floor(rng() * accountCount);
      if (other === i) other = (other + 1) % accountCount;
      // Spread over a week. Spacing them evenly with a little jitter keeps normal bursts low.
      const hour = ((k + rng() * 0.8) / perAccount) * WEEK_HOURS;
      transactions.push({ from: i, to: other, hour, injected: false });
      accounts[i].times.push(hour);
      accounts[other].times.push(hour);
    }
  }
  return { accounts, transactions, rng };
}

// Scores every account and flags the outliers.
export function detect(world) {
  const bursts = world.accounts.map((account) => burstCount(account.times));
  const { mean, std } = meanAndStd(bursts);
  const results = world.accounts.map((account, i) => {
    const z = std === 0 ? 0 : (bursts[i] - mean) / std;
    return { id: account.id, index: i, burst: bursts[i], z, flagged: z >= Z_THRESHOLD };
  });
  return { results, mean, std, flagged: results.filter((r) => r.flagged) };
}

// Plants 35 transactions inside one 6-hour window on an account that has not been used yet.
export function injectAnomaly(world) {
  const candidates = world.accounts
    .map((account, index) => ({ account, index }))
    .filter(({ account }) => !account.anomalous);
  if (candidates.length === 0) return null;
  const { account, index } = candidates[Math.floor(world.rng() * candidates.length)];
  account.anomalous = true;
  const startHour = 24 + world.rng() * (WEEK_HOURS - 48);
  for (let k = 0; k < BURST_SIZE; k += 1) {
    let other = Math.floor(world.rng() * world.accounts.length);
    if (other === index) other = (other + 1) % world.accounts.length;
    const hour = startHour + (k / BURST_SIZE) * (WINDOW_HOURS - 0.5);
    world.transactions.push({ from: index, to: other, hour, injected: true });
    account.times.push(hour);
    world.accounts[other].times.push(hour);
  }
  return index;
}

// Positions for drawing, in a unit square. A few rounds of springs between linked accounts and
// repulsion between all of them, from a seeded start, so the picture is the same every time.
export function layout(world, rounds = 160, seed = 5) {
  const rng = createRng(seed);
  const n = world.accounts.length;
  const points = Array.from({ length: n }, () => ({ x: rng(), y: rng(), vx: 0, vy: 0 }));
  const links = new Set(
    world.transactions
      .filter((t) => !t.injected)
      .map((t) => (t.from < t.to ? `${t.from}-${t.to}` : `${t.to}-${t.from}`)),
  );
  for (let round = 0; round < rounds; round += 1) {
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const distance = Math.max(0.02, Math.hypot(dx, dy));
        const push = 0.00012 / (distance * distance);
        points[i].vx += (dx / distance) * push;
        points[i].vy += (dy / distance) * push;
        points[j].vx -= (dx / distance) * push;
        points[j].vy -= (dy / distance) * push;
      }
    }
    for (const key of links) {
      const [a, b] = key.split('-').map(Number);
      const dx = points[b].x - points[a].x;
      const dy = points[b].y - points[a].y;
      points[a].vx += dx * 0.003;
      points[a].vy += dy * 0.003;
      points[b].vx -= dx * 0.003;
      points[b].vy -= dy * 0.003;
    }
    for (const p of points) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.85;
      p.vy *= 0.85;
    }
  }
  // Stretch the result to fill the drawing area with a small margin, whatever shape it settled into.
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
  const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
  return points.map(({ x, y }) => ({
    x: 0.05 + (0.9 * (x - minX)) / (maxX - minX || 1),
    y: 0.06 + (0.88 * (y - minY)) / (maxY - minY || 1),
  }));
}
