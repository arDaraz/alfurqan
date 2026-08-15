import { execFileSync, spawn } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { join } from 'node:path';

const DEV_PORT = 8081;
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
  process.exit(1);
}

if (action === 'start' && local.length > 0) {
  console.log(`Al Furqan Metro is already running on port ${DEV_PORT}.`);
  local.forEach(printListener);
  process.exit(0);
}

const expoBin = join(projectRoot, 'node_modules', '.bin', 'expo');
const child = spawn(expoBin, [action, ...expoArgs], {
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
