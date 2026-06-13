const {EventEmitter} = require('events');
const {spawn} = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PAYLOAD_PREFIX = 'LLMTRANS1:';
const FILE_EVENT_PREFIX = 'LLMTRANS_FILE_EVENT:';

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

function decodeFileEvent(line) {
  const index = line.indexOf(FILE_EVENT_PREFIX);
  if (index < 0) return null;
  const encoded = line.slice(index + FILE_EVENT_PREFIX.length).trim().split(/\s/)[0];
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
    this.fileSender = null;
    this.fileReceiver = null;
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
      fileSenderRunning: Boolean(this.fileSender && !this.fileSender.killed),
      fileReceiverRunning: Boolean(this.fileReceiver && !this.fileReceiver.killed),
    };
  }

  resolvePython() {
    const embedded = path.join(this.rootDirectory, 'python', 'python.exe');
    return fs.existsSync(embedded) ? embedded : 'py';
  }

  resolveScript(role) {
    const relative = {
      sender: ['cmd', '1.py'],
      receiver: ['cmd_reserve', '1.py'],
      'file-sender': ['file', 'fawenjian.py'],
      'file-receiver': ['file_recerve', 'wenjianjieshou.py'],
    }[role];
    return path.join(this.rootDirectory, 'Core_Architecture', ...relative);
  }

  pythonArgs(...args) {
    const command = this.resolvePython();
    return {
      command,
      args: command.toLowerCase().endsWith('py.exe') || command === 'py'
        ? ['-3', '-u', ...args]
        : ['-u', ...args],
    };
  }

  async start({conversation, account, receiveDirectory}) {
    await this.stop();
    fs.mkdirSync(receiveDirectory, {recursive: true});
    this.status = 'starting';
    this.active = {
      conversationId: conversation.id,
      account,
      receiveDirectory,
    };
    this.emitStatus();

    this.sender = this.spawnTextWorker('sender', conversation);
    this.receiver = this.spawnTextWorker('receiver', conversation);
    this.fileSender = this.spawnFileWorker('file-sender', conversation, receiveDirectory);
    this.fileReceiver = this.spawnFileWorker('file-receiver', conversation, receiveDirectory);

    this.startTimer = setTimeout(() => {
      if (!this.sender || !this.receiver || !this.fileSender || !this.fileReceiver) return;
      this.status = 'running';
      this.emitStatus();
    }, this.readyDelay);
    return this.getStatus();
  }

  spawnTextWorker(role, conversation) {
    const script = this.resolveScript(role);
    const {command, args} = this.pythonArgs(script);
    const child = this.spawnChild(role, command, args, path.dirname(script));
    child.stdin.write(`${conversation.cookieFile}\n${conversation.dialogFile}\n`);
    return child;
  }

  spawnFileWorker(role, conversation, receiveDirectory) {
    const script = this.resolveScript(role);
    const adapter = path.join(this.rootDirectory, 'electron', 'file-worker-adapter.py');
    const adapterArgs = [
      adapter,
      role === 'file-sender' ? 'sender' : 'receiver',
      script,
      conversation.cookieFile,
    ];
    if (role === 'file-receiver') adapterArgs.push(receiveDirectory);
    const {command, args} = this.pythonArgs(...adapterArgs);
    return this.spawnChild(role, command, args, path.dirname(script));
  }

  spawnChild(role, command, args, cwd) {
    const child = spawn(command, args, {
      cwd,
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
        this.handleFailure(role, new Error(`${role} process exited with code ${code ?? 'unknown'}`));
      }
      if (role === 'sender') this.sender = null;
      if (role === 'receiver') this.receiver = null;
      if (role === 'file-sender') this.fileSender = null;
      if (role === 'file-receiver') this.fileReceiver = null;
    });
    return child;
  }

  handleOutput(role, line) {
    const trimmed = line.trim();
    if (!trimmed) return;

    const fileEvent = decodeFileEvent(trimmed);
    if (fileEvent) {
      if (fileEvent.type !== 'ready') this.emit('file-event', {...fileEvent, role});
      return;
    }

    if (role === 'file-receiver' && trimmed.startsWith('下载成功：')) {
      const filePath = trimmed.slice('下载成功：'.length).trim();
      this.emit('file-event', {
        type: 'received',
        role,
        transferId: crypto.randomUUID(),
        filePath,
        fileName: path.basename(filePath),
      });
      return;
    }

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

  sendFile(filePath, transferId = crypto.randomUUID()) {
    if (this.status !== 'running' || !this.fileSender?.stdin.writable || !this.active) {
      throw new Error('当前对话尚未运行');
    }
    if (!path.isAbsolute(filePath) || !fs.existsSync(filePath)) {
      throw new Error('发送文件不存在或路径无效');
    }
    this.fileSender.stdin.write(`${JSON.stringify({
      type: 'send',
      transferId,
      filePath,
    })}\n`);
    return {
      transferId,
      filePath,
      fileName: path.basename(filePath),
      sentAt: new Date().toISOString(),
    };
  }

  async stop() {
    clearTimeout(this.startTimer);
    if (!this.sender && !this.receiver && !this.fileSender && !this.fileReceiver) {
      this.status = 'stopped';
      this.active = null;
      return this.getStatus();
    }
    this.status = 'stopping';
    this.emitStatus();
    const children = [this.sender, this.receiver, this.fileSender, this.fileReceiver].filter(Boolean);
    if (this.sender?.stdin.writable) {
      try {
        this.sender.stdin.write('2\n');
      } catch {}
    }
    if (this.fileSender?.stdin.writable) {
      try {
        this.fileSender.stdin.write(`${JSON.stringify({type: 'stop'})}\n`);
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
    this.fileSender = null;
    this.fileReceiver = null;
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
