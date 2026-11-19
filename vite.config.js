import { existsSync } from 'node:fs';
import { defineConfig } from 'vite';

// The Resume links sit between <!--resume:start--> and <!--resume:end--> in index.html.
// If public/resume.pdf does not exist at build time, those links are removed instead of leading nowhere.
function resumeLinks() {
  return {
    name: 'resume-links',
    transformIndexHtml(html) {
      const hasResume = existsSync('public/resume.pdf');
      const block = /[ \t]*<!--resume:start-->([\s\S]*?)<!--resume:end-->\n?/g;
      return html.replace(block, hasResume ? '$1' : '');
    },
  };
}

// base './' lets the built site work at ayush-o1.github.io/the/ and on a custom domain.
export default defineConfig({
  base: './',
  plugins: [resumeLinks()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
});
