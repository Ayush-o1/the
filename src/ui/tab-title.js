// The tab title changes while the page is in the background, and comes back when it returns.
export function initTabTitle() {
  const original = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? 'Still here: Ayush Kumar' : original;
  });
}
