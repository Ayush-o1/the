// Shared test helpers.

// Pretends this browser has visited before, so the boot sequence and role chooser stay out of the way.
// It also answers GitHub's API with an empty list, so no test depends on (or is slowed by) the real
// service. An empty answer, not a failure, because a failed request prints a console error. A test that
// wants GitHub data or a failure adds its own page.route afterwards, which takes precedence.
export async function markVisited(page, role = 'curious') {
  await page.addInitScript((savedRole) => {
    localStorage.setItem('ak-visited', '1');
    localStorage.setItem('ak-role', savedRole);
  }, role);
  await page.route('https://api.github.com/**', (route) => route.fulfill({ json: [] }));
}
