# Hand-off: what only you can do

The site is built and deployed. These are the things I could not do, or should not decide for you. Roughly in order of importance.

## Before you share the link

1. **Add your resume.** Put it at `public/resume.pdf` and push. Until then the Resume buttons and the console `resume` command are hidden or say there is none. The build removes the buttons by itself when the file is missing.
2. **Read `docs/CONTENT_REVIEW.md` once.** Nine short items. Every line of copy comes from your repos and public profile, but you know them best. Edit `index.html` where you disagree.
3. **Check the two live demos.** Open "Open live demo" on Argus and BlackWater. Decide whether a visitor can do something useful there, and change the link text or remove the link if not. I could confirm both answer, not what a first-time visitor can do.
4. **Check the status chips.** They are static HTML: Argus and Europa say Complete, the other four say Active (rule in `docs/DECISIONS.md` D10). Change them if your work changes.
5. **Decide what to do with `docs/`.** It holds the build plan, progress log and decision log. They describe how the site was made, which you asked the site itself never to say. The site and README do not. If you want the repository to stay equally quiet, move `docs/` out of the public repo (or make it private) before sharing.

## Contact form

- The form opens a pre-filled email in the visitor's mail app. It works today.
- To receive messages directly, get a free access key from Web3Forms, put it in `src/config.js` as `formKey`, and rebuild. I could not test that path without a key (D36). Send yourself one test message.
- The email address is the one from your profile README. Your GitHub profile's own email field is a different address (D02). Change `src/config.js` and the two `mailto:` links in `index.html` if you prefer the other.

## Things I left out because I could not prove them

- No CGPA, no LeetCode problem count, no achievements, no certifications. Add them to the Crew file when you have the source. `src/config.js` has a `showCgpa` flag.
- React, TypeScript, Docker, MongoDB and cloud platforms are not on the site on purpose (D05, D09).
- theRedArmy is described as a team project and links to its contributors page. No teammate is named.

## Choices you may want to revisit

- The Belt's fourteen mock phrases (see `docs/CONTENT_REVIEW.md` item 8).
- The social card (`public/og.jpg`) is a screenshot of the hero. Regenerate it with `node scripts/og-image.js` while `npm run preview` is running.
- The 404 page links to `https://ayush-o1.github.io/the/`. If you add a custom domain, change that link in `public/404.html`, the canonical and Open Graph URLs in `index.html`, and `public/robots.txt` and `public/sitemap.xml`.
- The Argus satellite easter egg from the plan was not built (D35).

## Real-device checks

I tested in desktop Chromium and WebKit and measured frame rate on your Mac's GPU. I could not test on a phone, in real Safari, or with a screen reader. `docs/MANUAL_QA.md` is a 30-minute checklist for exactly that.

## Keeping it up to date

- Add a project: copy one `<article class="mission">` block in `index.html`, add its waypoint in `src/scene/route.js` and its world in `src/scene/worlds/`. The Briefing, Map and Console read the new mission from the page.
- GitHub data (Cargo hold and "Last transmission") needs no maintenance. If you want a repository hidden, add its name to `repoDenyList` in `src/config.js`.
