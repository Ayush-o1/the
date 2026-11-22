# Ayush Kumar, software engineer

My portfolio. It is a flight past six projects I built, each one around something going wrong: an
outage, a mismatch, a bad input. Every project has a short write-up (the problem, what I decided)
and a small simulation of its core rule that runs in the browser.

Live: https://ayush-o1.github.io/the/

## What is on the page

- The six projects: Argus, BlackWater, BeetleJuice, theRedArmy, deadLetter and Europa.
- A simulation under each one. The logic in each is a copy of a rule from the real project, named
  in the file header, with tests.
- About, Education and Contact.
- A plain version of the whole page for browsers that cannot or should not run the 3D flight.

## How it is built

Plain HTML, CSS and JavaScript with Vite. Three.js draws the flight. There is no framework. All
text is in `index.html`; scripts only add behaviour. The flight is loaded after the page is
readable and the page works without it.

The numbers below were measured on a local build, with Lighthouse 12 on a Mac GPU (median of
three runs):

| Measure                            | Desktop | Phone profile |
| ---------------------------------- | ------- | ------------- |
| Performance                        | 100     | 95            |
| Accessibility, best practices, SEO | 100     | 100           |
| Total blocking time                | 40 ms   | 98 ms         |

The headline is the largest paint and appears at once; nothing covers the page while the 3D warms
up, and it fades in behind the text when it is ready. Browsers that draw WebGL on the CPU get the
plain page. The first load is 23 KB, all JavaScript is 217 KB gzipped, the three font files are
52 KB, and the planet maps (loaded after the flight starts) are 694 KB.

## Planet imagery

The planet maps are public imagery, used under each source's terms, with credit to NASA:

- Earth: NASA Earth Observatory, Blue Marble: Next Generation (day), Earth at Night 2016 (night
  lights) and The Blue Marble 2002 (clouds).
- Mars: USGS Astrogeology, Mars Viking Global Color Mosaic.
- Europa: USGS Astrogeology, Europa Voyager-Galileo SSI Global Mosaic.
- Jupiter: NASA/JPL/Space Science Institute, PIA07782 (Cassini).

`scripts/make-textures.py` makes the WebP files in `src/assets/tex/` from those sources.

## Run it

```sh
npm install
npm run dev
```

`npm run check` runs lint, the build, the logic tests and the size budgets. `npm run test:e2e`
runs the browser tests. See [ARCHITECTURE.md](ARCHITECTURE.md) for how the code is laid out.

## Contact

ayushh.pvt10@gmail.com · [GitHub](https://github.com/Ayush-o1) · [LinkedIn](https://linkedin.com/in/ayushh-o1)
