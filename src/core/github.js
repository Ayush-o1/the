// Helpers for the public GitHub data: which repositories to list in the Cargo hold and how to say
// when the last push was. Pure functions, so they are easy to test.

// Skips forks, anything on the deny-list and the repositories that already have a mission.
export function pickRepos(repos, { deny = [], missionIds = [] } = {}) {
  const hidden = new Set([...deny, ...missionIds].map((name) => name.toLowerCase()));
  return repos
    .filter((repo) => !repo.fork && !repo.archived && !hidden.has(repo.name.toLowerCase()))
    .map((repo) => ({
      name: repo.name,
      description: repo.description ?? '',
      language: repo.language ?? '',
      url: repo.html_url,
      pushedAt: repo.pushed_at,
    }));
}

export function daysAgo(dateString, now = Date.now()) {
  const days = Math.floor((now - Date.parse(dateString)) / 86400000);
  return Math.max(0, days);
}

export function describeDays(days) {
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

// The newest push among the repositories the visitor can see. Null if there are none.
export function lastTransmission(repos, now = Date.now()) {
  const stamps = repos.filter((repo) => repo.pushed_at).map((repo) => Date.parse(repo.pushed_at));
  if (stamps.length === 0) return null;
  return describeDays(daysAgo(new Date(Math.max(...stamps)).toISOString(), now));
}
