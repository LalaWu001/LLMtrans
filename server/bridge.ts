import express from 'express';
import path from 'path';
import {spawn, type ChildProcessWithoutNullStreams} from 'child_process';
import {fileURLToPath} from 'url';
import crypto from 'crypto';

type StoredMessage = {
  id: string;
  sessionId: string;
  senderName: string;
  text: string;
  timestamp: string;
};

type WorkerEvent =
  | {type: 'ready'; role: 'sender' | 'receiver'}
  | {type: 'sent'; clientId: string; senderName: string; text: string}
  | {type: 'message'; clientId: string; senderName: string; text: string}
  | {type: 'error'; role: 'sender' | 'receiver'; message: string};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const senderScript = path.join(rootDir, 'Core_Architecture', 'cmd', '1.py');
const receiverScript = path.join(rootDir, 'Core_Architecture', 'cmdjieshou', '1.py');
const port = Number(process.env.BRIDGE_PORT || 18081);
const pythonCommand = process.platform === 'win32' ? 'py' : 'python3';
const pythonArgs = process.platform === 'win32' ? ['-3'] : [];

const app = express();
app.use(express.json({limit: '1mb'}));

let senderProcess: ChildProcessWithoutNullStreams | null = null;
let receiverProcess: ChildProcessWithoutNullStreams | null = null;
let senderReady = false;
let receiverReady = false;
let activeSessionId = '';
const sessionMessages = new Map<string, StoredMessage[]>();
const messageIndex = new Map<string, StoredMessage>();

function getSessionBucket(sessionId: string) {
  if (!sessionMessages.has(sessionId)) {
    sessionMessages.set(sessionId, []);
  }
  return sessionMessages.get(sessionId)!;
}

function upsertMessage(message: StoredMessage) {
  const existing = messageIndex.get(message.id);
  if (existing) {
    existing.sessionId = message.sessionId;
    existing.senderName = message.senderName;
    existing.text = message.text;
    existing.timestamp = message.timestamp;
    return existing;
  }
  messageIndex.set(message.id, message);
  getSessionBucket(message.sessionId).push(message);
  return message;
}

function attachWorkerLogging(role: 'sender' | 'receiver', child: ChildProcessWithoutNullStreams) {
  let stdoutBuffer = '';
  child.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk.toString();
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const payload = JSON.parse(trimmed) as WorkerEvent;
        handleWorkerEvent(role, payload);
      } catch {
        console.log(`[${role}] ${trimmed}`);
      }
    }
  });

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString().trim();
    if (text) console.error(`[${role}:stderr] ${text}`);
  });

  child.on('exit', (code) => {
    console.log(`[${role}] exited with code ${code ?? 'null'}`);
    if (role === 'sender') {
      senderProcess = null;
      senderReady = false;
    } else {
      receiverProcess = null;
      receiverReady = false;
    }
  });
}

function handleWorkerEvent(role: 'sender' | 'receiver', event: WorkerEvent) {
  if (event.type === 'ready') {
    if (event.role === 'sender') senderReady = true;
    if (event.role === 'receiver') receiverReady = true;
    console.log(`[bridge] ${event.role} ready`);
    return;
  }

  if (event.type === 'error') {
    console.error(`[bridge:${event.role}] ${event.message}`);
    return;
  }

  if (event.type === 'message') {
    const sessionId = activeSessionId || 'default-session';
    upsertMessage({
      id: event.clientId,
      sessionId,
      senderName: event.senderName,
      text: event.text,
      timestamp: new Date().toISOString(),
    });
    console.log(`[receiver] ${event.senderName}: ${event.text}`);
    return;
  }

  if (event.type === 'sent') {
    console.log(`[sender] ${event.senderName}: ${event.text}`);
  }
}

function spawnWorker(role: 'sender' | 'receiver') {
  const script = role === 'sender' ? senderScript : receiverScript;
  const child = spawn(pythonCommand, [...pythonArgs, script, '--bridge-worker'], {
    cwd: rootDir,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  attachWorkerLogging(role, child);
  return child;
}

function ensureWorkersStarted() {
  if (!senderProcess) {
    senderProcess = spawnWorker('sender');
  }
  if (!receiverProcess) {
    receiverProcess = spawnWorker('receiver');
  }
}

function sendToSender(command: {type: 'send'; nickname: string; clientId: string; message: string}) {
  ensureWorkersStarted();
  if (!senderProcess?.stdin.writable) {
    throw new Error('sender worker is not writable');
  }
  senderProcess.stdin.write(`${JSON.stringify(command)}\n`);
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    activeSessionId,
    senderReady,
    receiverReady,
  });
});

app.post('/api/channel/start', (req, res) => {
  const sessionId = String(req.body?.sessionId || '').trim();
  if (sessionId) {
    activeSessionId = sessionId;
    getSessionBucket(sessionId);
  }
  ensureWorkersStarted();
  res.json({
    ok: true,
    activeSessionId,
    senderReady,
    receiverReady,
  });
});

app.get('/api/messages', (req, res) => {
  const sessionId = String(req.query.sessionId || activeSessionId || '').trim();
  if (!sessionId) {
    res.json({messages: []});
    return;
  }
  res.json({messages: getSessionBucket(sessionId)});
});

app.post('/api/messages', (req, res) => {
  const sessionId = String(req.body?.sessionId || '').trim();
  const nickname = String(req.body?.nickname || '').trim();
  const text = String(req.body?.text || '').trim();
  const clientId = String(req.body?.clientId || crypto.randomUUID());

  if (!sessionId || !nickname || !text) {
    res.status(400).json({error: 'sessionId, nickname, and text are required'});
    return;
  }

  activeSessionId = sessionId;
  const stored = upsertMessage({
    id: clientId,
    sessionId,
    senderName: nickname,
    text,
    timestamp: new Date().toISOString(),
  });

  try {
    sendToSender({
      type: 'send',
      nickname,
      clientId,
      message: text,
    });
    res.json({message: stored});
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'failed to send',
    });
  }
});

ensureWorkersStarted();

const server = app.listen(port, () => {
  console.log(`[bridge] listening on http://127.0.0.1:${port}`);
});

function shutdown() {
  try {
    senderProcess?.stdin.write(`${JSON.stringify({type: 'shutdown'})}\n`);
  } catch {}
  senderProcess?.kill();
  receiverProcess?.kill();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
