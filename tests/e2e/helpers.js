// Shared test helpers.

// Pretends this browser has visited before, so the boot sequence and role chooser stay out of the way.
export async function markVisited(page, role = 'curious') {
  await page.addInitScript((savedRole) => {
    localStorage.setItem('ak-visited', '1');
    localStorage.setItem('ak-role', savedRole);
  }, role);
}
