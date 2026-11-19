// Entry point. All content is in index.html, so this file only adds behaviour on top.
import { initBriefing, toggleBriefing } from './ui/briefing.js';
import { initContact } from './ui/contact.js';
import { initKeys } from './core/keys.js';

initBriefing();
initContact();
initKeys({ b: toggleBriefing });
