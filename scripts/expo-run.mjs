import { execFileSync, spawn } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { join } from 'node:path';

const PRIMARY_PORT = 8081;
const projectRoot = realpathSync(process.cwd());
const [action, ...expoArgs] = process.argv.slice(2);

function run(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

// The primary checkout keeps 8081 so the single-worktree workflow is unchanged.
// A linked worktree gets its port from worktrunk, which lets several worktrees
// serve Metro at once. Worktrunk owns the number so that every tool expanding a
// worktrunk template reports the same port as this script.
function devPort() {
  const requested = process.env.ALFURQAN_METRO_PORT;
  if (requested) {
    const override = Number(requested);
    if (!Number.isInteger(override) || override < 1024 || override > 65535) {
      console.error(`ALFURQAN_METRO_PORT must be a port from 1024 to 65535. Got "${requested}".`);
      process.exit(2);
    }
    return override;
  }

  const gitDir = run('git', ['rev-parse', '--absolute-git-dir']);
  const commonDir = run('git', ['rev-parse', '--path-format=absolute', '--git-common-dir']);
  if (gitDir !== '' && gitDir === commonDir) return PRIMARY_PORT;

  // Strip the colour codes first. A reset sequence carries a digit of its own,
  // so matching digits on the raw output can read the escape instead of the port.
  const printed = run('wt', ['metro-port']).replace(/\[[0-9;]*m/g, '');
  const port = Number(printed.match(/\d+/)?.[0]);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    console.error('Could not read this worktree\'s Metro port from `wt metro-port`.');
    console.error('Create worktrees with `wt new <github-issue-number>`, or set ALFURQAN_METRO_PORT.');
    process.exit(2);
  }
  return port;
}

const DEV_PORT = devPort();

function listenerPids() {
  return run('lsof', [`-tiTCP:${DEV_PORT}`, '-sTCP:LISTEN'])
    .split(/\s+/)
    .filter(Boolean)
    .map(Number)
    .filter(Number.isInteger);
}

function processCwd(pid) {
  const cwdLine = run('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'])
    .split('\n')
    .find((line) => line.startsWith('n'));

  if (!cwdLine) return '';
  try {
    return realpathSync(cwdLine.slice(1));
  } catch {
    return cwdLine.slice(1);
  }
}

function processCommand(pid) {
  return run('ps', ['-p', String(pid), '-o', 'command=']);
}

function listeners() {
  return listenerPids().map((pid) => ({
    pid,
    cwd: processCwd(pid),
    command: processCommand(pid),
  }));
}

function printListener(listener) {
  console.log(`PID ${listener.pid}`);
  console.log(`  directory: ${listener.cwd || 'unknown'}`);
  console.log(`  command: ${listener.command || 'unknown'}`);
}

const active = listeners();
const local = active.filter((listener) => listener.cwd === projectRoot);
const foreign = active.filter((listener) => listener.cwd !== projectRoot);

if (action === 'status') {
  console.log(`Worktree ${projectRoot}`);
  console.log(`Metro port ${DEV_PORT}`);
  if (active.length === 0) {
    console.log(`Port ${DEV_PORT} is available.`);
  } else {
    console.log(`Port ${DEV_PORT} listener${active.length === 1 ? '' : 's'}:`);
    active.forEach(printListener);
  }
  process.exit(0);
}

if (action === 'stop') {
  if (foreign.length > 0) {
    console.error(`Refusing to stop port ${DEV_PORT}: another checkout owns it.`);
    foreign.forEach(printListener);
    console.error('Stop that Metro server from its own project directory.');
    process.exit(1);
  }

  if (local.length === 0) {
    console.log(`No Al Furqan Metro server is listening on port ${DEV_PORT}.`);
    process.exit(0);
  }

  for (const listener of local) {
    process.kill(listener.pid, 'SIGTERM');
    console.log(`Stopped Al Furqan Metro PID ${listener.pid} on port ${DEV_PORT}.`);
  }
  process.exit(0);
}

if (!action) {
  console.error('Missing Expo command.');
  process.exit(2);
}

if (foreign.length > 0) {
  console.error(`Cannot launch Al Furqan: port ${DEV_PORT} belongs to another checkout.`);
  foreign.forEach(printListener);
  console.error('Stop that Metro server from its own project directory, then retry.');
  console.error('Two worktrees can hash to one port. Set ALFURQAN_METRO_PORT to move this one.');
  process.exit(1);
}

if (action === 'start' && local.length > 0) {
  console.log(`Al Furqan Metro is already running on port ${DEV_PORT}.`);
  local.forEach(printListener);
  process.exit(0);
}

const expoBin = join(projectRoot, 'node_modules', '.bin', 'expo');
// The wrapper owns the port so no npm script can pin one that contradicts it.
// Expo accepts -p, --port and --port=N, and passing a second one makes it fail.
const hasPortFlag = expoArgs.some(
  (arg) => arg === '-p' || arg === '--port' || arg.startsWith('--port=')
);
const portArgs = hasPortFlag ? [] : ['--port', String(DEV_PORT)];
const child = spawn(expoBin, [action, ...expoArgs, ...portArgs], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
});

child.on('error', (error) => {
  console.error(`Could not start Expo: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
