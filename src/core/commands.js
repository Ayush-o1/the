// The mission console's commands. A pure function: the page facts come in as `context`, and
// the answer comes back as lines of text plus an optional action for the caller to carry out.
// Nothing here touches the DOM, so node --test can check every command.

// context: {
//   missions: [{ id, name, status }],
//   stackCounts: [[tag, count], ...],
//   about: string,
//   hasResume: boolean,
//   uptimeSeconds: number
// }
export const COMMANDS = [
  'help',
  'missions',
  'open',
  'resume',
  'contact',
  'stack',
  'uptime',
  'whoami',
];

function formatUptime(seconds) {
  const total = Math.floor(seconds);
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const rest = String(total % 60).padStart(2, '0');
  return `T+${minutes}:${rest}`;
}

export function runCommand(input, context) {
  const [name, ...args] = input.trim().split(/\s+/);
  switch ((name ?? '').toLowerCase()) {
    case '':
      return { lines: [] };
    case 'help':
      return {
        lines: [
          'help        this list',
          'missions    the six missions and their status',
          'open NAME   fly to a mission, for example: open argus',
          'resume      open the resume',
          'contact     go to the contact form',
          'stack       tools used across the missions',
          'uptime      how long this flight has been going',
          'whoami      who is flying',
        ],
      };
    case 'missions':
      return { lines: context.missions.map((m) => `${m.name.padEnd(12)} ${m.status}`) };
    case 'open': {
      const wanted = (args[0] ?? '').toLowerCase();
      if (!wanted) return { lines: ['Say which one: open argus'] };
      const mission = context.missions.find(
        (m) => m.id === wanted || m.name.toLowerCase() === wanted,
      );
      if (!mission) return { lines: [`No mission called "${args[0]}". Try: missions`] };
      return { lines: [`Opening ${mission.name}.`], action: { type: 'goto', id: mission.id } };
    }
    case 'resume':
      return context.hasResume
        ? { lines: ['Opening the resume.'], action: { type: 'resume' } }
        : { lines: ['There is no resume on this site yet. Use the contact form.'] };
    case 'contact':
      return { lines: ['Going to the contact form.'], action: { type: 'goto', id: 'contact' } };
    case 'stack':
      return {
        lines: context.stackCounts.map(
          ([tag, count]) => `${tag.padEnd(14)} ${count} mission${count === 1 ? '' : 's'}`,
        ),
      };
    case 'uptime':
      return { lines: [formatUptime(context.uptimeSeconds)] };
    case 'whoami':
      return { lines: [context.about] };
    default:
      return { lines: [`Unknown command "${name}". Try: help`] };
  }
}
