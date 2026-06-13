const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {DatabaseSync} = require('node:sqlite');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, expected] = String(stored).split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}

class DatabaseService {
  constructor(dataDirectory) {
    fs.mkdirSync(dataDirectory, {recursive: true});
    this.filePath = path.join(dataDirectory, 'llmtrans.db');
    this.db = new DatabaseSync(this.filePath);
    this.db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
    this.migrate();
  }

  migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        account_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        nickname TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_path TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        cookie_path TEXT NOT NULL,
        dialogue_path TEXT NOT NULL,
        last_message TEXT NOT NULL DEFAULT '',
        last_message_at TEXT,
        last_error TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_account TEXT NOT NULL,
        sender_nickname TEXT NOT NULL,
        content TEXT NOT NULL,
        direction TEXT NOT NULL CHECK(direction IN ('self', 'peer', 'system')),
        status TEXT NOT NULL DEFAULT 'received',
        sent_at TEXT NOT NULL,
        received_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_messages_conversation_time
        ON messages(conversation_id, sent_at, created_at);

      CREATE TABLE IF NOT EXISTS file_transfers (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_account TEXT NOT NULL,
        sender_nickname TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        direction TEXT NOT NULL CHECK(direction IN ('self', 'peer')),
        status TEXT NOT NULL,
        error_message TEXT NOT NULL DEFAULT '',
        sent_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_file_transfers_conversation_time
        ON file_transfers(conversation_id, sent_at, updated_at);

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }

  register({accountName, nickname, password}) {
    const normalized = String(accountName || '').trim();
    const displayName = String(nickname || '').trim();
    if (!normalized || !displayName || String(password).length < 4) {
      throw new Error('账号、昵称不能为空，密码至少需要 4 个字符');
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try {
      this.db.prepare(`
        INSERT INTO accounts (id, account_name, nickname, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, normalized, displayName, hashPassword(password), now, now);
    } catch (error) {
      if (String(error.message).includes('UNIQUE')) throw new Error('账号名称已存在');
      throw error;
    }
    return this.getAccountById(id);
  }

  login({accountName, password}) {
    const account = this.db.prepare('SELECT * FROM accounts WHERE account_name = ? COLLATE NOCASE')
      .get(String(accountName || '').trim());
    if (!account || !verifyPassword(password, account.password_hash)) {
      throw new Error('账号或密码错误');
    }
    return this.mapAccount(account);
  }

  clearLegacyLoginSession() {
    this.db.prepare('DELETE FROM app_settings WHERE key = ?').run('current_account_id');
  }

  getAccountById(id) {
    const row = this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    return row ? this.mapAccount(row) : null;
  }

  mapAccount(row) {
    return {
      id: row.id,
      accountName: row.account_name,
      nickname: row.nickname,
      avatarPath: row.avatar_path,
    };
  }

  setSetting(key, value) {
    this.db.prepare(`
      INSERT INTO app_settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, String(value));
  }

  getSetting(key) {
    return this.db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key)?.value ?? null;
  }

  createConversation({name, cookiePath, dialoguePath}) {
    for (const [label, filePath] of [['Cookie', cookiePath], ['对话', dialoguePath]]) {
      if (!filePath || !path.isAbsolute(filePath) || !fs.existsSync(filePath)) {
        throw new Error(`${label}文件不存在或路径无效`);
      }
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO conversations
        (id, name, cookie_path, dialogue_path, last_message, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, String(name || '').trim() || '新对话', cookiePath, dialoguePath, '对话已创建，尚未启动', now, now);
    return this.getConversation(id);
  }

  ensureFixedConversation({cookiePath, dialoguePath}) {
    if (!fs.existsSync(cookiePath) || !fs.existsSync(dialoguePath)) return null;
    const id = 'builtin-doubao-conversation';
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO conversations
        (id, name, cookie_path, dialogue_path, last_message, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        cookie_path = excluded.cookie_path,
        dialogue_path = excluded.dialogue_path,
        updated_at = excluded.updated_at
    `).run(id, '固定豆包对话', cookiePath, dialoguePath, '使用项目内置 Cookie 和对话文件', now, now);
    return this.getConversation(id);
  }

  getConversation(id) {
    const row = this.db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
    return row ? this.mapConversation(row) : null;
  }

  listConversations() {
    return this.db.prepare(`
      SELECT * FROM conversations
      ORDER BY COALESCE(last_message_at, created_at) DESC
    `).all().map((row) => this.mapConversation(row));
  }

  mapConversation(row) {
    return {
      id: row.id,
      name: row.name,
      cookieFile: row.cookie_path,
      dialogFile: row.dialogue_path,
      lastMessage: row.last_message,
      unread: 0,
      time: row.last_message_at ? new Date(row.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '',
      lastError: row.last_error,
    };
  }

  addMessage(message) {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT OR IGNORE INTO messages
        (id, conversation_id, sender_account, sender_nickname, content, direction, status, sent_at, received_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      message.id,
      message.conversationId,
      message.senderAccount,
      message.senderNickname,
      message.content,
      message.direction,
      message.status,
      message.sentAt,
      message.receivedAt || null,
      now,
    );
    this.db.prepare(`
      UPDATE conversations
      SET last_message = ?, last_message_at = ?, updated_at = ?, last_error = ''
      WHERE id = ?
    `).run(message.content, message.sentAt, now, message.conversationId);
    return this.getMessage(message.id);
  }

  updateMessageStatus(id, status) {
    this.db.prepare('UPDATE messages SET status = ? WHERE id = ?').run(status, id);
    return this.getMessage(id);
  }

  getMessage(id, currentAccountName = null) {
    const row = this.db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
    return row ? this.mapMessage(row, currentAccountName) : null;
  }

  listMessages(conversationId, currentAccountName = null) {
    return this.db.prepare(`
      SELECT * FROM messages WHERE conversation_id = ?
      ORDER BY sent_at ASC, created_at ASC
    `).all(conversationId).map((row) => this.mapMessage(row, currentAccountName));
  }

  mapMessage(row, currentAccountName = null) {
    const origin = row.direction === 'system'
      ? 'system'
      : currentAccountName && row.sender_account.localeCompare(currentAccountName, undefined, {sensitivity: 'accent'}) === 0
        ? 'self'
        : 'peer';
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderAccount: row.sender_account,
      sender: row.sender_nickname,
      text: row.content,
      origin,
      status: row.status,
      time: new Date(row.sent_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
      sentAt: row.sent_at,
    };
  }

  setConversationError(id, message) {
    this.db.prepare('UPDATE conversations SET last_error = ?, updated_at = ? WHERE id = ?')
      .run(String(message || ''), new Date().toISOString(), id);
  }

  addFileTransfer(transfer) {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT OR REPLACE INTO file_transfers
        (id, conversation_id, sender_account, sender_nickname, file_name, file_path, direction, status, error_message, sent_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      transfer.id,
      transfer.conversationId,
      transfer.senderAccount,
      transfer.senderNickname,
      transfer.fileName,
      transfer.filePath,
      transfer.direction,
      transfer.status,
      transfer.errorMessage || '',
      transfer.sentAt,
      now,
    );
    return this.getFileTransfer(transfer.id);
  }

  updateFileTransfer(id, status, errorMessage = '') {
    this.db.prepare(`
      UPDATE file_transfers
      SET status = ?, error_message = ?, updated_at = ?
      WHERE id = ?
    `).run(status, String(errorMessage || ''), new Date().toISOString(), id);
    return this.getFileTransfer(id);
  }

  getFileTransfer(id) {
    const row = this.db.prepare('SELECT * FROM file_transfers WHERE id = ?').get(id);
    return row ? this.mapFileTransfer(row) : null;
  }

  listFileTransfers(conversationId) {
    return this.db.prepare(`
      SELECT * FROM file_transfers WHERE conversation_id = ?
      ORDER BY sent_at ASC, updated_at ASC
    `).all(conversationId).map((row) => this.mapFileTransfer(row));
  }

  mapFileTransfer(row) {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderAccount: row.sender_account,
      sender: row.sender_nickname,
      fileName: row.file_name,
      filePath: row.file_path,
      direction: row.direction,
      status: row.status,
      errorMessage: row.error_message,
      time: new Date(row.sent_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
      sentAt: row.sent_at,
    };
  }

  close() {
    this.db.close();
  }
}

module.exports = {DatabaseService};
