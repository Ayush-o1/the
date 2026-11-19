# Manual QA

Things the automated tests cannot judge. About 30 minutes. Tick them off on a real phone and on your Mac.

## On your phone (iPhone Safari, then Android Chrome if you have one)

- [ ] Open the live site. The hero text is readable at once. The flight appears within a few seconds, with no spinner.
- [ ] Scroll with your thumb the whole way down. It should feel smooth and never lock. Note the lowest frame rate you feel.
- [ ] Rotate to landscape and back mid-flight. Nothing should break or stay the wrong size.
- [ ] The address bar collapsing and returning should not make the page jump or cut the bottom path bar.
- [ ] Every button in the top bar is easy to hit with a thumb (four small squares showing B, M, S, L).
- [ ] Open the Briefing, the Map and the Console (the console needs a keyboard, so skip it on a phone).
- [ ] Try every simulation with your finger: drag-free, tap only. Check the text under each one updates.
- [ ] Switch to Lite with the L button. The page should stay where you were.
- [ ] Turn on Low Power Mode and reload. Still usable?
- [ ] Open the site, lock the phone, then wake it again. The flight should resume, not show a black screen.

## On your Mac

- [ ] Safari: the flight runs, the HUD is aligned, no console errors (Develop menu, Show Web Inspector).
- [ ] Chrome and Firefox: same.
- [ ] Press B, M, backtick, J, K, L, S. Each does what the Map dialog says.
- [ ] Switch tabs and come back. The title says "Signal lost" while away.
- [ ] Turn on Reduce Motion in System Settings. Reload. The page should start as Lite with no flying.
- [ ] Turn it off while the page is open in flight mode. Nothing should break.

## With VoiceOver (Cmd+F5 on a Mac, or Settings > Accessibility on iPhone)

- [ ] The page reads in order: skip link, header, name, line, buttons, sections.
- [ ] The current sector is announced when you move between sections, and not more often than that.
- [ ] Dialogs (Briefing, Map, Console, role chooser) announce their title, trap focus, and give focus back when closed.
- [ ] Each simulation announces its result after you press a button (for example "Flagged A-23" or "Refused: Invalid state transition").
- [ ] The Flight path buttons at the bottom read as "Fly to M2 BlackWater" and so on.
- [ ] Nothing in the 3D canvas is read out.

## With the keyboard only

- [ ] Tab through the whole page. A visible amber outline is always on the focused thing.
- [ ] Open and close each dialog with the keyboard. Focus returns to where you were.
- [ ] Use every simulation without a mouse.

## Contact form

- [ ] Fill the form and press Send. Your mail app should open with the message filled in.
- [ ] Optional: get a free key from Web3Forms, put it in `src/config.js` as `formKey`, build, and send a test message. Check it reaches your inbox and that the success and error messages read well.

## Content

- [ ] Read `docs/CONTENT_REVIEW.md` once and fix anything you disagree with in `index.html`.
- [ ] Check the live demo links on Argus and BlackWater. Decide whether visitors can do something useful there.
- [ ] Click every link on the live page once.
