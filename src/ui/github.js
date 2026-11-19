// Live data from GitHub's public API: "Last transmission" in the footer and the Cargo hold list.
// The answer is cached for 10 minutes in sessionStorage. If the request fails or is rate-limited,
// both parts stay hidden and nothing is shown. Nothing here is needed to read the site.
import { config } from '../config.js';
import { $, $$ } from '../lib/dom.js';
import { pickRepos, lastTransmission } from '../core/github.js';

const CACHE_KEY = 'ak-github';
const CACHE_MS = 10 * 60 * 1000;
const CARGO_SHOWN = 12;

function readCache() {
  try {
    const cached = JSON.parse(window.sessionStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.savedAt < CACHE_MS) return cached.repos;
  } catch {
    // Storage blocked or the cache is damaged. Fetch again.
  }
  return null;
}

function writeCache(repos) {
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), repos }));
  } catch {
    // Not saving is fine.
  }
}

async function loadRepos() {
  const cached = readCache();
  if (cached) return cached;
  const url = `https://api.github.com/users/${config.githubUser}/repos?per_page=100&sort=pushed`;
  const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
  const repos = await response.json();
  writeCache(repos);
  return repos;
}

function renderCargo(repos) {
  const list = $('[data-cargo]');
  if (!list) return;
  const missionIds = $$('[data-mission]').map((el) => el.id);
  const picked = pickRepos(repos, { deny: config.repoDenyList, missionIds }).slice(0, CARGO_SHOWN);
  for (const repo of picked) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = repo.url;
    link.textContent = repo.name;
    const meta = document.createElement('span');
    meta.className = 'tag';
    meta.textContent = repo.language || 'repository';
    const text = document.createElement('p');
    text.textContent = repo.description;
    item.append(link, ' ', meta, text);
    list.append(item);
  }
}

function renderTelemetry(repos) {
  const line = $('[data-telemetry]');
  const text = lastTransmission(repos.filter((repo) => !repo.fork));
  if (!line || !text) return;
  line.textContent = `Last transmission: ${text}`;
  line.hidden = false;
}

async function load() {
  try {
    const repos = await loadRepos();
    renderCargo(repos);
    renderTelemetry(repos);
  } catch {
    // Hidden on failure, as planned. The page already says where the repositories live.
  }
}

// GitHub allows only a few unauthenticated requests per hour from one address, and many visitors
// never reach the Cargo hold. So the request waits until the Cargo hold or the footer is close to
// the screen, and is made once.
export function initGithub() {
  const targets = [$('#cargo'), $('.site-footer')].filter(Boolean);
  if (targets.length === 0 || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      load();
    },
    { rootMargin: '600px 0px' },
  );
  for (const target of targets) observer.observe(target);
}
