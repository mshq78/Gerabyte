/**
 * Runs the Vite dev server and the API server together.
 * Vite proxies /api to the API server (see vite.config.ts), so the browser only
 * ever talks to one origin and the same-origin cookie rules apply in dev too.
 */
import { spawn } from 'node:child_process';

const procs = [
  { name: 'web', cmd: 'npm', args: ['run', 'web'] },
  { name: 'api', cmd: 'npm', args: ['run', 'dev:server'] },
];

const children = procs.map(({ name, cmd, args }) => {
  const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: false });
  const tag = `[${name}]`;
  child.stdout.on('data', (d) => process.stdout.write(prefix(tag, d)));
  child.stderr.on('data', (d) => process.stderr.write(prefix(tag, d)));
  child.on('exit', (code) => {
    console.log(`${tag} exited with ${code}`);
    shutdown(code ?? 1);
  });
  return child;
});

function prefix(tag, chunk) {
  return String(chunk)
    .split('\n')
    .map((line) => (line ? `${tag} ${line}` : line))
    .join('\n');
}

let shuttingDown = false;
function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill('SIGTERM');
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
