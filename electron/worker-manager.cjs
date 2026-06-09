const {EventEmitter} = require('events');
const {spawn} = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PAYLOAD_PREFIX = 'LLMTRANS1:';

function encodePayload(payload) {
  return PAYLOAD_PREFIX + Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodePayload(line) {
  const index = line.indexOf(PAYLOAD_PREFIX);
  if (index < 0) return null;
  const encoded = line.slice(index + PAYLOAD_PREFIX.length).trim().split(/\s/)[0];
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

class WorkerManager extends EventEmitter {
  constructor(rootDirectory, options = {}) {
    super();
    this.rootDirectory = rootDirectory;
    this.sender = null;
    this.receiver = null;
    this.active = null;
    this.status = 'stopped';
    this.startTimer = null;
    this.readyDelay = options.readyDelay ?? 8000;
  }

  getStatus() {
    return {
      status: this.status,
      conversationId: this.active?.conversationId || null,
      senderRunning: Boolean(this.sender && !this.sender.killed),
      receiverRunning: Boolean(this.receiver && !this.receiver.killed),
    };
  }

  resolvePython(role) {
    const embedded = path.join(this.rootDirectory, 'python', 'python.exe');
    return fs.existsSync(embedded) ? embedded : 'py';
  }

  resolveScript(role) {
    const folder = role === 'sender' ? 'cmd' : 'cmd_reserve';
    return path.join(this.rootDirectory, 'Core_Architecture', folder, '1.py');
  }

  async start({conversation, account}) {
    await this.stop();
    this.status = 'starting';
    this.active = {
      conversationId: conversation.id,
      account,
    };
    this.emitStatus();

    this.sender = this.spawnOriginal('sender', conversation);
    this.receiver = this.spawnOriginal('receiver', conversation);

    this.startTimer = setTimeout(() => {
      if (!this.sender || !this.receiver) return;
      this.status = 'running';
      this.emitStatus();
    }, this.readyDelay);
    return this.getStatus();
  }

  spawnOriginal(role, conversation) {
    const command = this.resolvePython(role);
    const script = this.resolveScript(role);
    const args = command.toLowerCase().endsWith('py.exe') || command === 'py'
      ? ['-3', '-u', script]
      : ['-u', script];
    const child = spawn(command, args, {
      cwd: path.dirname(script),
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      env: {...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1'},
    });

    let stdoutBuffer = '';
    child.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString('utf8');
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || '';
      for (const line of lines) this.handleOutput(role, line);
    });
    child.stderr.on('data', (chunk) => {
      const message = chunk.toString('utf8').trim();
      if (message) this.emit('log', {role, level: 'error', message});
    });
    child.on('error', (error) => this.handleFailure(role, error));
    child.on('exit', (code) => {
      if (this.status !== 'stopping' && this.status !== 'stopped') {
        this.handleFailure(role, new Error(`${role} 进程已退出，代码 ${code ?? 'unknown'}`));
      }
      if (role === 'sender') this.sender = null;
      else this.receiver = null;
    });

    child.stdin.write(`${conversation.cookieFile}\n${conversation.dialogFile}\n`);
    return child;
  }

  handleOutput(role, line) {
    const trimmed = line.trim();
    if (!trimmed) return;
    const payload = role === 'receiver' ? decodePayload(trimmed) : null;
    if (payload?.messageId && payload?.senderAccount && typeof payload.content === 'string') {
      this.emit('message', payload);
      return;
    }
    this.emit('log', {role, level: 'info', message: trimmed});
  }

  handleFailure(role, error) {
    clearTimeout(this.startTimer);
    this.status = 'error';
    this.emit('error-event', {
      role,
      conversationId: this.active?.conversationId || null,
      message: error.message,
    });
    this.emitStatus();
  }

  send(content) {
    if (this.status !== 'running' || !this.sender?.stdin.writable || !this.active) {
      throw new Error('当前对话尚未运行');
    }
    const payload = {
      protocol: 1,
      messageId: crypto.randomUUID(),
      senderAccount: this.active.account.accountName,
      senderNickname: this.active.account.nickname,
      content: String(content),
      sentAt: new Date().toISOString(),
    };
    this.sender.stdin.write(`1\n${encodePayload(payload)}\n`);
    return payload;
  }

  async stop() {
    clearTimeout(this.startTimer);
    if (!this.sender && !this.receiver) {
      this.status = 'stopped';
      this.active = null;
      return this.getStatus();
    }
    this.status = 'stopping';
    this.emitStatus();
    const children = [this.sender, this.receiver].filter(Boolean);
    if (this.sender?.stdin.writable) {
      try {
        this.sender.stdin.write('2\n');
      } catch {}
    }
    for (const child of children) {
      if (!child.killed) child.kill();
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    for (const child of children) {
      if (!child.killed) child.kill('SIGKILL');
    }
    this.sender = null;
    this.receiver = null;
    this.active = null;
    this.status = 'stopped';
    this.emitStatus();
    return this.getStatus();
  }

  emitStatus() {
    this.emit('status', this.getStatus());
  }
}

module.exports = {WorkerManager};
