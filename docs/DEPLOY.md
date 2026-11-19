# Deploy

The site is a static build served by GitHub Pages at https://ayush-o1.github.io/the/.

- `.github/workflows/pages.yml` builds with `npm run build` and deploys `dist/` on every push to `main`.
- `.github/workflows/ci.yml` runs `npm run check` and the Playwright tests on every push and pull request.
- `vite.config.js` uses `base: './'`, so the same build works under `/the/` and on a custom domain.
- Pages was enabled with `gh api -X POST repos/Ayush-o1/the/pages -f build_type=workflow`.

To check a deployment: `node scripts/live-check.js` (needs the network and a Mac GPU for the flight check).

## Custom domain (optional, later)

Add the domain in the repository's Pages settings, then update the address in `public/404.html`, the canonical and Open Graph URLs and the JSON-LD in `index.html`, `public/robots.txt` and `public/sitemap.xml`.
