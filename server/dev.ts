import {spawn, type ChildProcess} from 'child_process';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function run(name: string, args: string[]) {
  const child = process.platform === 'win32'
    ? spawn('C:\\Windows\\System32\\cmd.exe', ['/d', '/s', '/c', `npm ${args.join(' ')}`], {
        cwd: rootDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      })
    : spawn('npm', args, {
        cwd: rootDir,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
  const pipe = (stream: NodeJS.ReadableStream | null, method: 'log' | 'error') => {
    stream?.on('data', (chunk) => {
      const text = chunk.toString().trim();
      if (text) console[method](`[${name}] ${text}`);
    });
  };
  pipe(child.stdout, 'log');
  pipe(child.stderr, 'error');
  return child;
}

const processes: ChildProcess[] = [
  run('bridge', ['run', 'bridge']),
  run('frontend', ['run', 'dev']),
];

function shutdown() {
  for (const child of processes) {
    child.kill();
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
